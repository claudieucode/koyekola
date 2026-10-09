// Outils de contenu (palier 13) : rechercher / remplacer sécurisé, régénérations et nettoyages précisément définis.
// Rien ici ne fait « une réparation inconnue » : chaque action annonce ce qu'elle touche, propose une SIMULATION (aucune écriture) et exige une
// confirmation. Les écritures passent par les services (brouillon de page + historique, article + révision).
const db = require("../../config/database");
const runner = require("./runner");
const runs = require("./runs");

// ---------- Rechercher / remplacer ----------
// Pages : seuls les textes saisis (titres, paragraphes, libellés…) sont remplacés — jamais les adresses, identifiants, classes ni le code HTML/CSS —
// et SEULEMENT dans le brouillon (la version en ligne ne change qu'à la publication). Articles : titre, résumé et texte du contenu (pas les balises).
const TEXT_KEYS = new Set(["title", "subtitle", "text", "markdown", "label", "buttonLabel", "description", "caption", "alt", "q", "a", "author", "quote", "heading", "placeholder", "content_text", "items"]);
const SKIP_KEYS = new Set(["html", "css", "customCss", "url", "href", "src", "link", "image", "id", "slug", "class", "classes", "style", "styles", "name"]);

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildRe = (search, { caseSensitive, wholeWord }) => new RegExp(wholeWord ? `(?<![\\p{L}\\p{N}_])${escRe(search)}(?![\\p{L}\\p{N}_])` : escRe(search), caseSensitive ? "gu" : "giu");
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Remplace dans un contenu JSON de page ; renvoie { value, count, samples }
function replaceInJson(value, re, replacement, acc = { count: 0, samples: [] }, key = "") {
  if (typeof value === "string") {
    if (SKIP_KEYS.has(key) || !TEXT_KEYS.has(key)) return { value, ...acc };
    let n = 0;
    const next = value.replace(re, () => { n++; return replacement; });
    if (n) { acc.count += n; if (acc.samples.length < 3) acc.samples.push(snippet(value, re)); return { value: next, ...acc }; }
    return { value, ...acc };
  }
  if (Array.isArray(value)) { const out = value.map((v) => replaceInJson(v, re, replacement, acc, key).value); return { value: out, ...acc }; }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP_KEYS.has(k) && typeof v === "string" ? v : replaceInJson(v, re, replacement, acc, k).value;
    return { value: out, ...acc };
  }
  return { value, ...acc };
}
const snippet = (text, re) => { const m = new RegExp(re.source, re.flags.replace("g", "")).exec(text); if (!m) return ""; const i = m.index; return `${i > 20 ? "…" : ""}${text.slice(Math.max(0, i - 20), i + m[0].length + 30).replace(/\s+/g, " ")}${text.length > i + m[0].length + 30 ? "…" : ""}`; };
// Texte d'un contenu HTML : seulement ce qui est entre les balises
function replaceInHtml(html, re, replacement) {
  let n = 0;
  const out = String(html || "").split(/(<[^>]+>)/).map((part) => (part.startsWith("<") ? part : part.replace(re, () => { n++; return escHtml(replacement); }))).join("");
  return { value: out, count: n };
}

function normalizeOptions(o) {
  const search = String(o.search ?? "").replace(/[\u0000-\u001f]/g, "");
  const replacement = String(o.replace ?? o.replacement ?? "").replace(/[\u0000-\u001f]/g, "");
  if (search.trim().length < 2) throw Object.assign(new Error("Saisissez au moins 2 caractères à rechercher."), { user: true });
  if (search.length > 200 || replacement.length > 200) throw Object.assign(new Error("200 caractères au plus."), { user: true });
  const targets = { pages: o.pages !== false && o.pages !== "0", articles: o.articles === true || o.articles === "1" };
  if (!targets.pages && !targets.articles) throw Object.assign(new Error("Choisissez où chercher (pages et / ou articles)."), { user: true });
  return { search, replacement, caseSensitive: o.caseSensitive === true || o.caseSensitive === "1", wholeWord: o.wholeWord === true || o.wholeWord === "1", ...targets, includeLive: o.includeLive === true || o.includeLive === "1" };
}

function planReplace(ctx, siteId, o) {
  const re = buildRe(o.search, o);
  const found = [];
  if (o.pages) {
    const pages = require("../../marketing/pages");
    for (const row of db.prepare("SELECT id, name FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND archived_at IS NULL ORDER BY id LIMIT 3000").all(ctx.organizationId, siteId)) {
      const page = pages.requirePage(ctx, row.id);
      const r = replaceInJson(page.working, re, o.replacement);
      if (r.count) found.push({ type: "page", id: row.id, label: row.name, count: r.count, samples: r.samples, href: `/marketing/pages/${row.id}/editeur` });
    }
  }
  if (o.articles && ctx.orgLevel && ctx.can("articles.write")) {
    for (const p of db.prepare("SELECT id, title, excerpt, content, status, published FROM posts WHERE deleted_at IS NULL ORDER BY id LIMIT 3000").all()) {
      if (p.published && !o.includeLive) continue;
      let count = 0; const samples = [];
      for (const f of ["title", "excerpt"]) { const t = String(p[f] || ""); const n = (t.match(re) || []).length; if (n) { count += n; if (samples.length < 3) samples.push(snippet(t, re)); } }
      const h = replaceInHtml(p.content, re, o.replacement);
      if (h.count) { count += h.count; if (samples.length < 3) samples.push(snippet(String(p.content).replace(/<[^>]+>/g, " "), re)); }
      if (count) found.push({ type: "article", id: p.id, label: p.title, count, samples, live: Boolean(p.published), href: `/formateur/blog/${p.id}/modifier` });
    }
  }
  return { found, total: found.reduce((a, f) => a + f.count, 0) };
}

runner.register("content", async (run, api) => {
  const opts = JSON.parse(run.options || "{}");
  if (opts.op !== "replace") throw new Error("Opération inconnue.");
  const o = normalizeOptions(opts);
  const ctx = api.ctx;
  const plan = planReplace(ctx, run.site_id, o);
  if (run.phase !== "apply") {
    api.setTotal(plan.found.length); api.reset();
    return { status: "awaiting", phase: "analyse", report: { plan: plan.found.slice(0, 300), resources: plan.found.length, occurrences: plan.total, truncated: plan.found.length > 300, options: { ...o } }, message: plan.found.length ? "Simulation terminée : rien n'a été modifié." : "Aucune occurrence trouvée." };
  }
  if (!ctx.can("tools.content")) throw new Error("Permission « tools.content » requise.");
  const re = buildRe(o.search, o);
  const pages = require("../../marketing/pages");
  const articles = require("../articles");
  const done = [];
  api.setTotal(plan.found.length); api.reset();
  for (let i = 0; i < plan.found.length; i++) {
    if (api.cancelled()) return { status: "cancelled", report: { done }, message: `Remplacement annulé après ${done.length} ressource(s) (elles restent modifiées et sont dans l'historique).` };
    const f = plan.found[i];
    try {
      if (f.type === "page") {
        const page = pages.requirePage(ctx, f.id);
        const r = replaceInJson(page.working, re, o.replacement);
        pages.saveDraft(ctx, f.id, r.value, { revision: page.revision });
      } else {
        const p = db.prepare("SELECT title, excerpt, content FROM posts WHERE id = ?").get(f.id);
        articles.applyImported(f.id, { title: String(p.title).replace(re, () => o.replacement), excerpt: String(p.excerpt || "").replace(re, () => o.replacement), content: replaceInHtml(p.content, re, o.replacement).value, content_format: "html" }, ctx.userId);
      }
      done.push({ ...f, result: "remplacé" });
      api.advance({ done: 1 });
    } catch (error) { done.push({ ...f, result: "échec", message: runner.messageOf(error) }); api.advance({ failed: 1 }); }
    if (i % 10 === 9) await api.yieldTurn();
  }
  return { status: "done", report: { done, occurrences: plan.total }, message: "Remplacement terminé : pages dans leur brouillon, articles avec une révision « Import de contenu »." };
});

function startReplace(ctx, { siteId, options, phase = "analyse", parent = null }) {
  const o = normalizeOptions(options);
  const run = parent || runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "content", options: { op: "replace", ...o } });
  runs.update(run.id, { phase });
  runner.start(run, `replace-${phase}`);
  return run;
}

// ---------- Régénérations et nettoyages ----------
const ACTIONS = {
  sitemap: { group: "regeneration", label: "Actualiser le plan du site", description: "Le plan du site est calculé à chaque demande à partir du contenu publié. Cette action vide les caches qui l'alimentent (redirections, domaines des sites, réglages SEO) et en vérifie le résultat.",
    dry() { const s = require("../../seo/sitemap").entries(); return { count: s.included.length, detail: `${s.included.length} adresse(s) incluse(s), ${s.excluded.length} exclue(s)` }; },
    run() { require("./caches").invalidate("seo-settings"); require("./caches").invalidate("redirects"); require("./caches").invalidate("domains"); const s = require("../../seo/sitemap").entries(); return { count: s.included.length, detail: `Plan du site recalculé : ${s.included.length} adresse(s).` }; } },
  taxonomy: { group: "regeneration", label: "Rattacher les articles à leurs catégories", description: "Crée les relations de catégories / étiquettes des articles qui n'en ont pas encore, d'après leur catégorie et leurs étiquettes enregistrées. Ne retire rien.",
    dry() { const n = db.prepare("SELECT COUNT(*) n FROM posts p WHERE p.deleted_at IS NULL AND (p.category <> '' OR p.tags <> '') AND NOT EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.content_type = 'post' AND r.content_id = p.id)").get().n; return { count: n, detail: `${n} article(s) à rattacher` }; },
    run() { const n = require("../taxonomy").reconcile(); return { count: n, detail: `${n} article(s) rattaché(s)` }; } },
  log404: { group: "cleanup", label: "Nettoyer le journal des erreurs 404 ancien", description: "Supprime les adresses introuvables non revues depuis plus de 90 jours (compteurs compris). Les redirections ne sont pas touchées.",
    dry() { const n = db.prepare("SELECT COUNT(*) n FROM seo_404 WHERE last_seen < datetime('now', '-90 days')").get().n; return { count: n, detail: `${n} entrée(s) de plus de 90 jours` }; },
    run() { const n = db.prepare("DELETE FROM seo_404 WHERE last_seen < datetime('now', '-90 days')").run().changes; return { count: n, detail: `${n} entrée(s) supprimée(s)` }; } },
  runs: { group: "cleanup", label: "Nettoyer les anciennes opérations d'outils", description: "Supprime les fichiers d'export expirés (24 h) et les opérations terminées depuis plus de 60 jours (rapports compris). Les contenus importés ne sont pas touchés.",
    dry() { const a = db.prepare("SELECT COUNT(*) n FROM cms_tool_runs WHERE result IS NOT NULL AND expires_at IS NOT NULL AND expires_at < datetime('now')").get().n; const b = db.prepare("SELECT COUNT(*) n FROM cms_tool_runs WHERE finished_at IS NOT NULL AND finished_at < datetime('now', '-60 days')").get().n; return { count: a + b, detail: `${a} export(s) expiré(s), ${b} opération(s) ancienne(s)` }; },
    run() { const r = runs.purge({ keepDays: 60 }); return { count: r.expiredFiles + r.deletedRuns, detail: `${r.expiredFiles} export(s) expiré(s) effacé(s), ${r.deletedRuns} opération(s) supprimée(s)` }; } },
  jobs: { group: "cleanup", label: "Nettoyer les travaux terminés", description: "Supprime de la file de travaux ceux terminés avec succès depuis plus de 30 jours. Les travaux abandonnés (échecs) sont conservés pour le diagnostic.",
    dry() { const n = db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE state = 'done' AND finished_at < ?").get(Date.now() - 30 * 86400e3).n; return { count: n, detail: `${n} travail(aux) terminé(s) de plus de 30 jours` }; },
    run() { const n = db.prepare("DELETE FROM mk_jobs WHERE state = 'done' AND finished_at < ?").run(Date.now() - 30 * 86400e3).changes; return { count: n, detail: `${n} travail(aux) supprimé(s)` }; } },
};

module.exports = { ACTIONS, startReplace, normalizeOptions, planReplace, replaceInJson, replaceInHtml, buildRe };
