// Export / import des réglages SEO (JSON) et import depuis Rank Math ou Yoast (tableau « adresse + clés de métadonnées »).
// Règles :
//   · le périmètre (site ou équipe centrale) vient de l'appelant, jamais du fichier : un fichier exporté d'un site s'importe dans le site de l'appelant, pas dans « son » site d'origine ;
//   · tout passe par les validations existantes (settings.saveForSite / save, redirects.create…) : aucune écriture directe qui contournerait une règle ;
//   · jamais de secret (clés de comptes de service, clés d'API) ni de compteur dans un export ; un aperçu (essai à blanc) est toujours possible avant d'écrire.
const db = require("../config/database");
const settings = require("./settings");
const redirects = require("./redirects");
const meta = require("./meta");
const { logChange } = require("./store");

const FORMAT = "kolakisa-seo";
const VERSION = 1;
const MAX_BYTES = 400000;
const MAX_ITEMS = 2000;

const siteKeysOf = (siteId) => (Number.isInteger(siteId) ? settings.SITE_KEYS : Object.keys(settings.FIELDS));

// ---------- Export ----------
function exportScope(siteId = null) {
  redirects.ensureSchema();
  const scoped = Number.isInteger(siteId);
  const stored = scoped ? settings.storedFor(siteId) : settings.all();
  const out = {};
  for (const key of siteKeysOf(siteId)) if (Object.hasOwn(stored, key) && settings.FIELDS[key]) out[key] = stored[key];
  const rows = scoped
    ? db.prepare("SELECT source_path, target, status, match_type, note, enabled FROM seo_redirects WHERE site_id = ? ORDER BY id").all(siteId)
    : db.prepare("SELECT source_path, target, status, match_type, note, enabled FROM seo_redirects WHERE site_id IS NULL ORDER BY id").all();
  return {
    format: FORMAT, version: VERSION, exported_at: new Date().toISOString(), scope: scoped ? "site" : "central",
    settings: out,
    redirects: rows.map((r) => ({ source: r.source_path, target: r.target, status: r.status, match: r.match_type, note: r.note, enabled: Boolean(r.enabled) })),
  };
}

// ---------- Import ----------
function parse(text) {
  const raw = String(text || "");
  if (raw.length > MAX_BYTES) return { error: `Fichier trop volumineux (${Math.round(MAX_BYTES / 1000)} Ko au plus).` };
  let j;
  try { j = JSON.parse(raw.replace(/^﻿/, "")); } catch { return { error: "Fichier illisible : un export JSON de KOLAKISA est attendu." }; }
  if (!j || j.format !== FORMAT) return { error: "Ce fichier n'est pas un export de réglages SEO KOLAKISA (format « kolakisa-seo »)." };
  if (j.version !== VERSION) return { error: `Version d'export non prise en charge (${String(j.version).slice(0, 10)}).` };
  if (!j.settings || typeof j.settings !== "object" || Array.isArray(j.settings)) return { error: "Export invalide : section « settings » absente." };
  if (j.redirects !== undefined && !Array.isArray(j.redirects)) return { error: "Export invalide : section « redirects » incorrecte." };
  if ((j.redirects || []).length > MAX_ITEMS) return { error: `${MAX_ITEMS} redirections au plus par import.` };
  return { data: j };
}

// siteId : entier = site de l'appelant ; null = équipe centrale. dryRun : valide sans rien écrire. allowExternal : permission « redirects.external » de l'appelant.
function importScope(siteId, text, userId, { dryRun = false, allowExternal = true } = {}) {
  const p = parse(text);
  if (p.error) return { ok: false, errors: [p.error] };
  const { data } = p;
  const scoped = Number.isInteger(siteId);
  const allowed = new Set(siteKeysOf(siteId));
  const report = { ok: true, dryRun, settings: { applied: [], ignored: [] }, redirects: { created: 0, skipped: [], errors: [] }, errors: [] };

  const input = {};
  for (const [key, value] of Object.entries(data.settings)) {
    if (!settings.FIELDS[key] || !allowed.has(key)) { report.settings.ignored.push(key); continue; }
    input[key] = value;
  }
  // Validation complète avant toute écriture (tout ou rien pour les réglages)
  for (const [key, value] of Object.entries(input)) {
    const r = settings.validate(key, value, { site: scoped });
    if (r.error) report.errors.push(r.error);
  }
  if (report.errors.length) return { ...report, ok: false };
  report.settings.applied = Object.keys(input);
  if (!dryRun && report.settings.applied.length) {
    const r = scoped ? settings.saveForSite(siteId, input, userId) : settings.save(input, userId);
    if (!r.ok) return { ...report, ok: false, errors: r.errors };
  }

  for (const [i, item] of (data.redirects || []).entries()) {
    const label = `Redirection ${i + 1} (${String(item && item.source).slice(0, 40)})`;
    if (!item || typeof item !== "object") { report.redirects.errors.push(`${label} : entrée invalide.`); continue; }
    if (!allowExternal && /^https:\/\//i.test(String(item.target || ""))) { report.redirects.errors.push(`${label} : destination extérieure (permission « redirects.external » nécessaire).`); continue; }
    const args = { source: item.source, target: item.target, status: item.status, note: String(item.note || "Import SEO").slice(0, 200), matchType: item.match };
    const check = redirects.validate({ ...args, siteId: scoped ? siteId : undefined });
    if (check.errors.length) {
      (check.errors.some((e) => /existe déjà/.test(e)) ? report.redirects.skipped : report.redirects.errors).push(`${label} : ${check.errors.join(" ")}`);
      continue;
    }
    if (dryRun) { report.redirects.created++; continue; }
    const r = scoped ? redirects.createForSite(siteId, args, userId, { source: "import" }) : redirects.create(args, userId, { source: "import" });
    if (r.ok) { report.redirects.created++; if (item.enabled === false) redirects.update(r.id, { ...args, enabled: "0", siteId: scoped ? siteId : undefined }, userId); } else report.redirects.errors.push(`${label} : ${r.errors.join(" ")}`);
  }
  return report;
}

// ---------- Rank Math / Yoast ----------
// Format accepté : lignes « adresse + clés de métadonnées WordPress » (export de la table postmeta, ou tableur préparé).
//   Large : colonnes url, rank_math_title, rank_math_description, rank_math_focus_keyword, rank_math_canonical_url, _yoast_wpseo_title, _yoast_wpseo_metadesc, _yoast_wpseo_focuskw, _yoast_wpseo_canonical.
//   Long  : colonnes url, meta_key, meta_value.
// Les noms de clés sont ceux que les deux extensions enregistrent dans la base WordPress ; ce format n'a pas été éprouvé sur un export réel de ces extensions (voir docs).
const KEYMAP = {
  rank_math_title: "seo_title", rank_math_description: "seo_description", rank_math_focus_keyword: "focus_keyword", rank_math_canonical_url: "canonical_url",
  _yoast_wpseo_title: "seo_title", _yoast_wpseo_metadesc: "seo_description", _yoast_wpseo_focuskw: "focus_keyword", _yoast_wpseo_canonical: "canonical_url",
};
const LIMITS = { seo_title: 70, seo_description: 160, focus_keyword: 80 };

// Variables de gabarit WordPress : remplacées par la valeur réelle ; une variable inconnue fait écarter le champ (jamais publiée telle quelle)
function resolveVars(value, { title, siteName, sep }) {
  let unknown = false;
  const out = String(value || "").replace(/%%?([a-z_]+)%%?/gi, (all, name) => {
    switch (name.toLowerCase()) {
      case "title": case "post_title": return title || "";
      case "sitename": return siteName || "";
      case "sep": return sep || "-";
      case "page": return "";
      default: unknown = true; return all;
    }
  }).replace(/\s+/g, " ").trim();
  return { value: out, unknown };
}

function parseTable(text) {
  const raw = String(text || "").replace(/^﻿/, "");
  if (raw.length > MAX_BYTES) return { error: `Fichier trop volumineux (${Math.round(MAX_BYTES / 1000)} Ko au plus).` };
  let rows;
  if (/^\s*[[{]/.test(raw)) {
    try { const j = JSON.parse(raw); rows = Array.isArray(j) ? j : []; } catch { return { error: "JSON illisible." }; }
  } else {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { error: "Fichier vide : une ligne d'en-têtes puis une ligne par page sont attendues." };
    const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
    const cells = (line) => { const out = []; let cur = ""; let q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((c) => c.trim()); };
    const head = cells(lines[0]).map((h) => h.toLowerCase());
    rows = lines.slice(1).map((l) => Object.fromEntries(cells(l).map((c, i) => [head[i] || `c${i}`, c])));
  }
  if (rows.length > MAX_ITEMS) return { error: `${MAX_ITEMS} lignes au plus par import.` };
  // Format long → large
  const byUrl = new Map();
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const url = String(r.url || r.URL || r.adresse || "").trim();
    if (!url) continue;
    const cur = byUrl.get(url) || { url };
    // Une valeur vide n'écrase jamais une valeur déjà lue pour la même adresse
    const put = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== "") cur[String(k).toLowerCase()] = v; };
    if (r.meta_key) put(r.meta_key, r.meta_value); else for (const k of Object.keys(r)) if (KEYMAP[k.toLowerCase()]) put(k, r[k]);
    byUrl.set(url, cur);
  }
  return { items: [...byUrl.values()] };
}

const pathOf = (url) => redirects.normalizePath(url);

// Cibles du périmètre central : article (/blog/<adresse>) ou formation (/cours/<adresse>)
function centralTarget(path) {
  let m = /^\/blog\/([^/]+)$/.exec(path);
  if (m) { const p = db.prepare("SELECT id, title FROM posts WHERE slug = ?").get(m[1]); return p ? { kind: "post", id: p.id, title: p.title } : null; }
  m = /^\/cours\/([^/]+)$/.exec(path);
  if (m) { const c = db.prepare("SELECT id, title FROM courses WHERE slug = ?").get(m[1]); return c ? { kind: "course", id: c.id, title: c.title } : null; }
  return null;
}
// Cibles d'un site : pages du CMS de CE site (requête bornée au site)
function siteTarget(siteId, path) {
  const urls = require("../services/urls");
  const rows = db.prepare("SELECT id, slug, site_id, name FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL LIMIT 1000").all(siteId);
  const hit = rows.find((r) => urls.pageCanonicalPath(r) === path);
  return hit ? { kind: "page", id: hit.id, title: hit.name } : null;
}

// ctx : contexte du moteur de pages (requis pour un site). Écrit des BROUILLONS de pages (jamais publiés automatiquement).
function importWordPress(siteId, text, userId, { dryRun = true, ctx = null } = {}) {
  const parsed = parseTable(text);
  if (parsed.error) return { ok: false, errors: [parsed.error] };
  const scoped = Number.isInteger(siteId);
  if (scoped && !ctx) return { ok: false, errors: ["Contexte du site manquant."] };
  const st = scoped ? settings.allFor(siteId) : settings.all();
  const report = { ok: true, dryRun, updated: [], skipped: [], warnings: [] };
  for (const item of parsed.items) {
    const path = pathOf(item.url);
    if (!path) { report.skipped.push(`${String(item.url).slice(0, 60)} : adresse invalide.`); continue; }
    const target = scoped ? siteTarget(siteId, path) : centralTarget(path);
    if (!target) { report.skipped.push(`${path} : aucune page correspondante dans ce ${scoped ? "site" : "périmètre"}.`); continue; }
    const fields = {};
    for (const key of Object.keys(item)) {
      const field = KEYMAP[key];
      if (!field || item[key] === undefined || String(item[key]).trim() === "") continue;
      let value = String(item[key]);
      if (field !== "canonical_url") {
        const r = resolveVars(value, { title: target.title, siteName: st.site_name, sep: String(st.title_separator || "-").trim() });
        if (r.unknown) { report.warnings.push(`${path} : « ${field} » contient une variable inconnue, champ ignoré.`); continue; }
        value = r.value;
        if (LIMITS[field] && value.length > LIMITS[field]) { report.warnings.push(`${path} : « ${field} » dépasse ${LIMITS[field]} caractères, champ ignoré.`); continue; }
      } else if (!settings.HTTPS_URL.test(value)) { report.warnings.push(`${path} : adresse canonique non https, ignorée.`); continue; }
      if (value) fields[field] = value;
    }
    if (!Object.keys(fields).length) { report.skipped.push(`${path} : aucune donnée SEO exploitable.`); continue; }
    if (!dryRun) {
      if (target.kind === "post") {
        const before = db.prepare("SELECT seo_title, seo_description, focus_keyword, canonical_url FROM posts WHERE id = ?").get(target.id);
        const cols = Object.keys(fields);
        db.prepare(`UPDATE posts SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...cols.map((c) => fields[c]), target.id);
        for (const c of cols) logChange({ entityType: "post", entityKey: String(target.id), field: c, before: before[c], after: fields[c], userId, source: "import" });
      } else if (target.kind === "course") {
        const r = meta.save("course", String(target.id), fields, userId);
        if (!r.ok) { report.warnings.push(`${path} : ${r.errors.join(" ")}`); continue; }
      } else {
        const pagesLib = require("../marketing/pages");
        const page = pagesLib.getPage(ctx, target.id);
        if (!page || page.site_id !== siteId) { report.skipped.push(`${path} : page introuvable.`); continue; }
        const seo = { ...(page.working.seo || {}) };
        if (fields.seo_title) seo.title = fields.seo_title;
        if (fields.seo_description) seo.description = fields.seo_description;
        if (fields.focus_keyword) seo.focusKeyword = fields.focus_keyword;
        if (fields.canonical_url) seo.canonical = fields.canonical_url;
        try { pagesLib.saveDraft(ctx, target.id, { ...page.working, seo }, { revision: page.revision }); } catch (e) { report.warnings.push(`${path} : ${e.message}`); continue; }
      }
    }
    report.updated.push({ path, kind: target.kind, fields: Object.keys(fields) });
  }
  return report;
}

module.exports = { FORMAT, VERSION, exportScope, importScope, importWordPress, parseTable, resolveVars, KEYMAP };
