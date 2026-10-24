// Moteur d'export : exécute les collecteurs (un échec n'emporte jamais les autres), assemble le rapport (HTML lisible, JSON structuré, manifeste)
// et fabrique l'archive ZIP, relue avant d'être déclarée valide. Aucune archive vide n'est jamais produite : sans donnée, on le dit (NO_DATA).
const crypto = require("node:crypto");
const registry = require("./registry");
const zip = require("./zip");

const FORMAT = "kolakisa-export-personnel@1";
const MAX_ROWS = 5000;
const FORBIDDEN = /pass(word)?|mot de passe|token|jeton|secret|api[_ -]?key|cl[ée] (priv|api)|private/i;
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const messageOf = (error) => String((error && error.message) || error || "Erreur").replace(/[\u0000-\u001f]+/g, " ").slice(0, 200);

class NoDataError extends Error { constructor() { super("Aucune donnée personnelle trouvée pour cette personne sur ce site."); this.code = "NO_DATA"; } }

// Retire toute colonne ou ligne ressemblant à un secret (ceinture et bretelles : les collecteurs ne les lisent déjà pas)
function scrub(section) {
  const columns = section.columns.filter(([key, label]) => !FORBIDDEN.test(key) && !FORBIDDEN.test(label));
  const keys = new Set(columns.map(([k]) => k));
  const rows = section.rows
    .filter((row) => !["champ", "propriete"].some((k) => typeof row[k] === "string" && FORBIDDEN.test(row[k])))
    .slice(0, MAX_ROWS)
    .map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => keys.has(k))));
  return { ...section, columns, rows, truncated: section.rows.length > MAX_ROWS };
}

function runOne(def, ctx) {
  const base = { id: def.id, title: def.title, category: def.category, owner: def.owner, description: def.description, fields: def.fields, method: def.method, filter: def.filter, limits: def.limits, format: def.format, sections: [], total: 0, note: "", error: "" };
  if (def.scope === "principal" && ctx.siteId !== null) return { ...base, status: "unsupported", note: "Cette catégorie n'existe que pour le site principal : elle n'est pas rattachée à un site." };
  if (def.scope === "site" && ctx.siteId === null) return { ...base, status: "unsupported", note: "Cette catégorie n'existe que pour un site." };
  if (def.orgOnly && !ctx.orgLevel) return { ...base, status: "denied", note: "Réservé à l'équipe de l'organisation." };
  if (def.permission && !ctx.can(def.permission)) return { ...base, status: "denied", note: "Votre rôle ne donne pas le droit de lire cette catégorie." };
  try {
    const out = def.collect(ctx) || {};
    const sections = (out.sections || []).map(scrub).filter((s) => s.rows.length);
    const total = sections.reduce((n, s) => n + s.rows.length, 0);
    return { ...base, sections, total, status: total ? "exported" : "empty", note: String(out.note || "") || (sections.some((s) => s.truncated) ? `Limité à ${MAX_ROWS} lignes par tableau.` : "") };
  } catch (error) {
    return { ...base, status: "failed", error: messageOf(error) };
  }
}

function collect(ctx, { collectors = registry.list() } = {}) {
  const results = collectors.map((def) => runOne(def, ctx));
  const count = (s) => results.filter((r) => r.status === s).length;
  return {
    results, externals: registry.externalsFor({ siteId: ctx.siteId }).map(({ id, title, action }) => ({ id, title, action })),
    summary: { exported: count("exported"), empty: count("empty"), unsupported: count("unsupported"), denied: count("denied"), failed: count("failed"), records: results.reduce((n, r) => n + r.total, 0) },
  };
}

const STATUS_FR = { exported: "Exportée", empty: "Aucune donnée", unsupported: "Non applicable", denied: "Non autorisée", failed: "Échec" };
const iso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");

function renderHtml(meta, collected) {
  const withData = collected.results.filter((r) => r.status === "exported");
  const nav = withData.map((r) => `<li><a href="#c-${esc(r.id)}">${esc(r.title)}</a> <span class="n">(${r.total})</span></li>`).join("");
  const body = withData.map((r) => `<section id="c-${esc(r.id)}"><h2>${esc(r.title)}</h2><p class="meta">${esc(r.category)} · ${esc(r.owner)}${r.note ? ` · ${esc(r.note)}` : ""}</p>${r.sections.map((s) => `<h3>${esc(s.title)}</h3><table><thead><tr>${s.columns.map(([, label]) => `<th scope="col">${esc(label)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((row) => `<tr>${s.columns.map(([k]) => `<td dir="auto">${esc(row[k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("")}</section>`).join("");
  const other = collected.results.filter((r) => r.status !== "exported").map((r) => `<tr><td>${esc(r.title)}</td><td>${esc(STATUS_FR[r.status])}</td><td dir="auto">${esc(r.error || r.note || "")}</td></tr>`).join("");
  const ext = collected.externals.map((e) => `<li><strong>${esc(e.title)}</strong> — ${esc(e.action)}</li>`).join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Données personnelles — ${esc(meta.site)}</title>
<style>body{font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#1d2733;max-width:980px;margin:0 auto;padding:24px}h1{color:#0b2a5b}h2{color:#0b2a5b;border-bottom:2px solid #dbe4f0;padding-bottom:4px;margin-top:32px}h3{font-size:1rem;margin:18px 0 6px}.meta,.n{color:#5a6877;font-size:.9rem}table{border-collapse:collapse;width:100%;margin:6px 0 14px;font-size:.92rem}th,td{border:1px solid #dbe4f0;padding:6px 9px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef3fa}nav ul{columns:2}@media print{a{color:inherit}}</style></head>
<body><h1>Vos données personnelles</h1>
<p>Site : <strong>${esc(meta.site)}</strong><br>Adresse e-mail concernée : <strong>${esc(meta.email)}</strong><br>Rapport généré le ${esc(meta.generatedAt)}</p>
<p class="meta">Ce rapport regroupe les données personnelles que ce site détient à votre sujet dans Kolakisa. Une version structurée (donnees.json) et un manifeste (manifeste.json) accompagnent ce fichier.</p>
<nav aria-label="Catégories"><h2>Contenu</h2><ul>${nav}</ul></nav>${body}
<section><h2>Catégories sans données ou non disponibles</h2><table><thead><tr><th scope="col">Catégorie</th><th scope="col">État</th><th scope="col">Précision</th></tr></thead><tbody>${other}</tbody></table></section>
${ext ? `<section><h2>Données détenues hors de Kolakisa</h2><ul>${ext}</ul></section>` : ""}
</body></html>
`;
}

// → { buffer, sha256, bytes, files: [noms], summary } ; lève NoDataError si rien à exporter
function buildArchive(collected, { siteName, email, now = new Date() }) {
  if (!collected.summary.records) throw new NoDataError();
  const generatedAt = iso(now);
  const meta = { site: siteName, email, generatedAt };
  const json = {
    format: FORMAT, genere_le: generatedAt, site: siteName, personne: { adresse_email: email },
    categories: collected.results.filter((r) => r.status === "exported").map((r) => ({
      id: r.id, titre: r.title, categorie: r.category, module: r.owner, total: r.total, remarque: r.note || undefined,
      sections: r.sections.map((s) => ({ id: s.id, titre: s.title, colonnes: s.columns.map(([cle, libelle]) => ({ cle, libelle })), lignes: s.rows })),
    })),
    non_disponible: collected.results.filter((r) => r.status !== "exported").map((r) => ({ id: r.id, titre: r.title, etat: STATUS_FR[r.status], precision: r.error || r.note || undefined })),
    sources_externes: collected.externals,
  };
  const jsonText = `${JSON.stringify(json, null, 2)}\n`;
  const htmlText = renderHtml(meta, collected);
  const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
  const manifest = {
    format: FORMAT, genere_le: generatedAt, site: siteName,
    fichiers: [{ nom: "donnees-personnelles.html", description: "Rapport lisible, regroupé par catégorie", sha256: sha(htmlText) }, { nom: "donnees.json", description: "Mêmes données, structurées pour un traitement informatique", sha256: sha(jsonText) }],
    resume: collected.summary,
    categories: collected.results.map((r) => ({ id: r.id, titre: r.title, categorie: r.category, module: r.owner, etat: STATUS_FR[r.status], total: r.total, champs: r.fields, methode: r.method, filtre: r.filter, limites: r.limits || undefined, erreur: r.error || undefined })),
    sources_externes: collected.externals,
  };
  const buffer = zip.create([
    { name: "donnees-personnelles.html", data: htmlText },
    { name: "donnees.json", data: jsonText },
    { name: "manifeste.json", data: `${JSON.stringify(manifest, null, 2)}\n` },
  ], { now });
  verify(buffer, htmlText, jsonText);
  return { buffer, sha256: crypto.createHash("sha256").update(buffer).digest("hex"), bytes: buffer.length, files: ["donnees-personnelles.html", "donnees.json", "manifeste.json"] };
}

// Relecture stricte de l'archive fabriquée : trois fichiers, CRC valides, contenu identique, JSON lisible
function verify(buffer, htmlText, jsonText) {
  const entries = zip.read(buffer);
  const byName = new Map(entries.map((e) => [e.name, e.data.toString("utf8")]));
  if (byName.size !== 3 || byName.get("donnees-personnelles.html") !== htmlText || byName.get("donnees.json") !== jsonText) throw new Error("L'archive générée est incomplète ou ne correspond pas aux données collectées.");
  JSON.parse(byName.get("donnees.json")); JSON.parse(byName.get("manifeste.json"));
}

// Résumé sans donnée personnelle, conservé avec la demande
const reportOf = (collected) => ({
  summary: collected.summary,
  collectors: collected.results.map((r) => ({ id: r.id, title: r.title, status: r.status, total: r.total, ...(r.error ? { error: r.error } : {}), ...(r.note ? { note: r.note } : {}) })),
  externals: collected.externals.map((e) => ({ id: e.id, title: e.title })),
});

module.exports = { collect, buildArchive, reportOf, NoDataError, FORMAT, STATUS_FR };
