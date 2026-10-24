// Outils SEO d'UN site (rubrique SEO de l'espace d'un site : vue générale, analyse, meta, indexation, sitemap, schema, Open Graph, robots, 404).
// Ce module ne duplique AUCUN moteur : il assemble les services communs (webPages, resolver, schema, sitemap, robots, audit, notfound, redirects)
// pour un site précis. Règles d'isolation :
//   · le site (siteId) est TOUJOURS fourni par l'appelant après vérification côté serveur (adresse + droits) ; il n'est jamais lu dans un formulaire ;
//   · chaque requête SQL est bornée à ce site (site_id = ?) ; une donnée d'un autre site n'est ni lue, ni affichée, ni modifiée ;
//   · les chiffres affichés sont observés (lus dans la base ou dans le HTML réellement produit) ; les recommandations sont calculées et étiquetées comme telles.
const db = require("../config/database");
const pagesLib = require("../marketing/pages");
const urls = require("../services/urls");
const webPages = require("./webPages");
const settings = require("./settings");
const sitemap = require("./sitemap");
const robots = require("./robots");
const schema = require("./schema");
const images = require("./images");
const audit = require("./audit");
const notfound = require("./notfound");
const redirects = require("./redirects");
const store = require("./store");
const probe = require("./probe");
const { RULES, BY_ID, SEVERITIES, CATEGORIES } = require("./rules");
const { absoluteUrl } = require("../utils/seo");

const MAX_PAGES = 500; // au-delà, les tableaux sont tronqués (avec avertissement) : jamais de calcul sans borne dans une requête web
const TITLE_MAX = 60; // repères indicatifs, jamais des règles de classement
const TITLE_MIN = 25;
const DESC_MAX = 160;
const DESC_MIN = 70;

const intId = (v) => (Number.isInteger(v) ? v : null);
function needSite(siteId) { if (!Number.isInteger(siteId) || siteId <= 0) throw new Error("Outils SEO d'un site : site non vérifié."); return siteId; }

// Requête « vue du site » : même résultat que sur le domaine public du site (le site de la page est connu), sans modifier la requête d'origine
function viewReq(req, siteId) {
  const r = Object.create(req);
  const info = urls.siteInfo(siteId);
  r.kwSite = info || { id: siteId, base: "" };
  return r;
}

function parseJson(text, fallback) { try { return JSON.parse(text); } catch { return fallback; } }

// Pages EN LIGNE du site (celles que les moteurs peuvent voir) : lecture bornée au site
function livePages(siteId) {
  needSite(siteId);
  const rows = db.prepare(`SELECT p.*, (SELECT 1 FROM mk_funnel_steps st JOIN mk_funnels f ON f.id = st.funnel_id WHERE st.page_id = p.id AND f.status = 'active' AND json_extract(st.settings, '$.noindex') = 1 LIMIT 1) AS funnelNoindex
    FROM mk_landing_pages p WHERE p.site_id = ? AND p.archived_at IS NULL AND p.status = 'published' ORDER BY p.id LIMIT ?`).all(siteId, MAX_PAGES + 1);
  const truncated = rows.length > MAX_PAGES;
  return { truncated, pages: rows.slice(0, MAX_PAGES).map((r) => ({ ...r, sections: parseJson(r.sections, []), theme: parseJson(r.theme, {}), funnelNoindex: Boolean(r.funnelNoindex) })) };
}

// Une seule évaluation par page (balises réellement produites par le moteur commun) ; réutilisée par tous les écrans
function evaluatePages(req, ctx, siteId) {
  const site = pagesLib.getSite(ctx, siteId);
  if (!site) return null;
  const vr = viewReq(req, siteId);
  const { pages, truncated } = livePages(siteId);
  const rows = pages.map((p) => {
    const seo = webPages.parseSeo(p);
    const ix = webPages.indexing(p, site);
    const h = webPages.head(Object.create(vr), { page: p, site });
    return { page: p, seo, ix, h, path: urls.pageCanonicalPath(p) };
  });
  return { site, rows, truncated };
}

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
function duplicates(rows, key) {
  const m = new Map();
  for (const r of rows) { if (!r.ix.indexable) continue; const v = norm(key(r)); if (v) m.set(v, [...(m.get(v) || []), r.page.id]); }
  return new Set([...m.values()].filter((ids) => ids.length > 1).flat());
}

// ---------- Meta ----------
function metaView(req, ctx, siteId) {
  const ev = evaluatePages(req, ctx, siteId);
  if (!ev) return null;
  const dupT = duplicates(ev.rows, (r) => r.h.title);
  const dupD = duplicates(ev.rows, (r) => r.h.description);
  const rows = ev.rows.map((r) => {
    const title = r.h.title || "";
    const description = r.h.description || "";
    const notes = [];
    if (title.length > TITLE_MAX) notes.push({ level: "warning", text: `Titre de ${title.length} caractères : souvent coupé dans les résultats au-delà de ${TITLE_MAX} environ (repère indicatif).` });
    else if (title.length < TITLE_MIN) notes.push({ level: "info", text: `Titre court (${title.length} caractères) : vous avez de la place pour être plus descriptif.` });
    if (!r.seo.description && !r.page.description) notes.push({ level: "warning", text: "Aucune description propre à la page : la description par défaut du site est utilisée." });
    else if (description.length > DESC_MAX) notes.push({ level: "info", text: `Description de ${description.length} caractères : susceptible d'être tronquée au-delà de ${DESC_MAX} environ (indicatif).` });
    else if (description.length < DESC_MIN) notes.push({ level: "info", text: `Description courte (${description.length} caractères).` });
    if (dupT.has(r.page.id)) notes.push({ level: "warning", text: "Un autre titre de page indexable de ce site est identique." });
    if (dupD.has(r.page.id)) notes.push({ level: "warning", text: "Une autre description de page indexable de ce site est identique." });
    return { id: r.page.id, name: r.page.name, path: r.path, title, titleLen: title.length, titleSource: r.seo.title ? "page" : "modèle", description, descLen: description.length,
      descSource: r.seo.description ? "page" : r.page.description ? "contenu" : "site", indexable: r.ix.indexable, notes, warn: notes.some((n) => n.level === "warning") };
  });
  const st = settings.allFor(siteId);
  return { site: ev.site, rows, truncated: ev.truncated, settings: st, stored: settings.storedFor(siteId),
    totals: { pages: rows.length, customTitle: rows.filter((r) => r.titleSource === "page").length, customDescription: rows.filter((r) => r.descSource === "page").length, warnings: rows.filter((r) => r.warn).length } };
}

// ---------- Indexation ----------
function indexingView(req, ctx, siteId) {
  const ev = evaluatePages(req, ctx, siteId);
  if (!ev) return null;
  const map = sitemap.entriesForSite(siteId);
  const inMap = new Set(map.included.map((e) => e.path));
  const excludedBy = new Map(map.excluded.map((e) => [e.path, e.reason]));
  const base = ev.site.settings.seo && ev.site.settings.seo.publicUrl;
  const blocked = new Set(robots.conflicts(viewReq(req, siteId), ev.rows.map((r) => r.path), { siteId, preview: true, base }));
  const siteNoindex = Boolean(ev.site.settings.extras && ev.site.settings.extras.noindex);
  const rows = ev.rows.map((r) => {
    const conflicts = [];
    if (blocked.has(r.path)) conflicts.push(r.ix.indexable ? "robots.txt interdit cette adresse à Google alors que la page est indexable." : "robots.txt interdit cette adresse : Google ne pourra pas lire sa directive noindex.");
    if (inMap.has(r.path) && !r.ix.indexable) conflicts.push("Dans le plan du site alors que la page n'est pas indexable.");
    if (!inMap.has(r.path) && r.ix.indexable && !blocked.has(r.path)) conflicts.push(`Indexable mais absente du plan du site${excludedBy.get(r.path) ? ` (${excludedBy.get(r.path)})` : ""}.`);
    if (r.seo.canonical && !String(r.seo.canonical).endsWith(r.path === "/" ? "/" : r.path)) conflicts.push("Adresse canonique vers une autre adresse : la page elle-même ne sera pas retenue.");
    return { id: r.page.id, name: r.page.name, path: r.path, indexable: r.ix.indexable, follow: r.ix.follow, reasons: r.ix.reasons, directive: r.h.noindex ? "noindex, nofollow" : (r.h.robots || "index, follow"), inSitemap: inMap.has(r.path), conflicts };
  });
  const closed = !require("../middlewares/siteHost").indexingAllowed(req);
  return { site: ev.site, rows, truncated: ev.truncated, siteNoindex, siteFollow: !(ev.site.settings.seo && ev.site.settings.seo.follow === false), revision: ev.site.settings_revision, envClosed: closed,
    totals: { pages: rows.length, indexable: rows.filter((r) => r.indexable).length, excluded: rows.filter((r) => !r.indexable).length, conflicts: rows.filter((r) => r.conflicts.length).length } };
}

// Enregistre « tout le site en noindex » / suivi des liens par le chemin officiel des réglages du site (contrôle de révision, journal)
function saveSiteIndexing(ctx, siteId, { noindex, follow, revision, userId }) {
  const site = pagesLib.requireSite(ctx, siteId, { active: true });
  const settingsNext = JSON.parse(JSON.stringify(site.settings));
  settingsNext.extras = { ...settingsNext.extras, noindex: Boolean(noindex) };
  settingsNext.seo = { ...settingsNext.seo, follow: Boolean(follow) };
  const before = { noindex: Boolean(site.settings.extras && site.settings.extras.noindex), follow: !(site.settings.seo && site.settings.seo.follow === false) };
  if (before.noindex === Boolean(noindex) && before.follow === Boolean(follow)) return { ok: true, changed: false };
  pagesLib.saveSiteDesign(ctx, siteId, { settings: settingsNext, revision });
  if (before.noindex !== Boolean(noindex)) store.logChange({ entityType: "settings", entityKey: `site:${siteId}`, field: "site_noindex", before: String(before.noindex), after: String(Boolean(noindex)), userId, siteId });
  if (before.follow !== Boolean(follow)) store.logChange({ entityType: "settings", entityKey: `site:${siteId}`, field: "site_follow", before: String(before.follow), after: String(Boolean(follow)), userId, siteId });
  return { ok: true, changed: true };
}

// ---------- Sitemap ----------
function sitemapView(req, siteId) {
  needSite(siteId);
  const map = sitemap.entriesForSite(siteId);
  const xml = sitemap.xmlForSite(req, siteId);
  const check = sitemap.validateXml(xml);
  const last = db.prepare("SELECT * FROM seo_site_sitemaps WHERE site_id = ?").get(siteId) || null;
  const publicUrl = map.ownDomain ? `${map.base.replace(/\/+$/, "")}/sitemap.xml` : absoluteUrl(req, "/sitemap.xml");
  return { included: map.included, excluded: map.excluded, ownDomain: map.ownDomain, publicUrl, check, xmlPreview: xml.split("\n").slice(0, 40).join("\n"), last: last ? { ...last, problems: parseJson(last.problems, []) } : null,
    consistent: map.included.every((e) => e.path.startsWith("/")), total: map.included.length, limit: 45000 };
}
// « Régénérer » : recalcule le plan depuis la base, le valide et enregistre la date et le résultat (le plan servi est toujours calculé depuis la base ; aucune date inventée)
function regenerateSitemap(req, siteId, userId) {
  needSite(siteId);
  const map = sitemap.entriesForSite(siteId);
  const check = sitemap.validateXml(sitemap.xmlForSite(req, siteId));
  db.prepare(`INSERT INTO seo_site_sitemaps (site_id, generated_at, generated_by, urls, excluded, valid, problems) VALUES (?, datetime('now'), ?, ?, ?, ?, ?)
    ON CONFLICT(site_id) DO UPDATE SET generated_at = excluded.generated_at, generated_by = excluded.generated_by, urls = excluded.urls, excluded = excluded.excluded, valid = excluded.valid, problems = excluded.problems`)
    .run(siteId, userId ?? null, map.included.length, map.excluded.length, check.valid ? 1 : 0, JSON.stringify(check.problems));
  store.logChange({ entityType: "sitemap", entityKey: `site:${siteId}`, field: "regeneration", before: null, after: `${map.included.length} adresse(s)`, userId, siteId });
  return { urls: map.included.length, excluded: map.excluded.length, valid: check.valid, problems: check.problems };
}

// ---------- Robots ----------
function robotsView(req, siteId, ctxSite) {
  needSite(siteId);
  const info = urls.siteInfo(siteId);
  const base = info && info.base ? info.base : "";
  const custom = settings.allFor(siteId).robots_custom || "";
  const stored = Object.hasOwn(settings.storedFor(siteId), "robots_custom");
  const served = robots.text(viewReq(req, siteId), { siteId, preview: true, base });
  const sitemapPaths = sitemap.entriesForSite(siteId).included.map((e) => e.path);
  const blocked = robots.conflicts(viewReq(req, siteId), sitemapPaths, { siteId, preview: true, base });
  const history = store.listChanges({ entityType: "settings", entityKey: `site:${siteId}`, limit: 100, site: siteId }).filter((c) => c.field === "robots_custom").slice(0, 10);
  return { custom, stored, served, problems: robots.check(custom), warnings: robots.warnings(custom), blocked, history, domain: base || null, envClosed: !require("../middlewares/siteHost").indexingAllowed(req), siteNoindex: Boolean(ctxSite && ctxSite.settings.extras && ctxSite.settings.extras.noindex) };
}
// Aperçu avant publication : valide un texte sans l'enregistrer
function robotsPreview(req, siteId, text) {
  needSite(siteId);
  const v = settings.validate("robots_custom", text, { site: true });
  const probs = robots.check(String(text || "").replace(/\r\n?/g, "\n"));
  const info = urls.siteInfo(siteId);
  const warnings = robots.warnings(String(text || ""));
  const body = v.error ? null : (() => { const lines = ["User-agent: *", ...robots.PRIVATE.map((p) => `Disallow: ${p}`), ""]; if (v.value) lines.push(v.value, ""); lines.push(`Sitemap: ${info && info.base ? info.base.replace(/\/+$/, "") : absoluteUrl(req, "").replace(/\/$/, "")}/sitemap.xml`, ""); return lines.join("\n"); })();
  const fatal = probs.filter((p) => p.level === "error");
  const needsConfirm = [...probs, ...warnings].some((p) => p.level === "warning" && /Disallow: \/ »|TOUT le site|Google est interdit|bloque un grand nombre/.test(p.message));
  return { valid: !v.error && !fatal.length, error: v.error || (fatal[0] && fatal[0].message) || null, preview: body, problems: probs, warnings, needsConfirm };
}
// Restaure une ancienne valeur de robots_custom (entrée du journal DE CE SITE)
function robotsRestore(siteId, changeId, userId) {
  needSite(siteId);
  const row = db.prepare("SELECT * FROM seo_changes WHERE id = ? AND site_id = ? AND field = 'robots_custom' AND entity_key = ?").get(changeId, siteId, `site:${siteId}`);
  if (!row) return { ok: false, errors: ["Version introuvable pour ce site."] };
  let value = row.old_value;
  const parsed = parseJson(value, undefined);
  if (typeof parsed === "string") value = parsed;
  return settings.saveForSite(siteId, { robots_custom: value === null ? null : value }, userId);
}

// ---------- Schema ----------
const RECOMMENDED = { Organization: ["logo", "description", "sameAs"], EducationalOrganization: ["logo", "description", "sameAs"], WebPage: ["description", "primaryImageOfPage", "breadcrumb"], WebSite: [] };
function recommendedMissing(blocks) {
  const out = [];
  for (const b of blocks || []) for (const n of b["@graph"] || [b]) {
    const type = [].concat(n["@type"])[0];
    for (const prop of RECOMMENDED[type] || []) { const v = n[prop]; if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) out.push({ level: "info", message: `${type} : propriété recommandée « ${prop} » non renseignée (aucune valeur n'est inventée).` }); }
  }
  return out;
}
function schemaView(req, ctx, siteId, pageId) {
  const ev = evaluatePages(req, ctx, siteId);
  if (!ev) return null;
  const vr = viewReq(req, siteId);
  const org = schema.organization(vr, siteId);
  const orgProblems = [...schema.validate([{ "@context": "https://schema.org", "@graph": [org] }]), ...recommendedMissing([{ "@graph": [org] }])];
  const rows = ev.rows.map((r) => {
    const blocks = r.h.jsonLd || [];
    const problems = schema.validate(blocks);
    const types = [...new Set(blocks.flatMap((b) => (b["@graph"] || [b]).map((n) => [].concat(n["@type"])[0])))];
    return { id: r.page.id, name: r.page.name, path: r.path, types, blocks, problems, none: !blocks.length, why: !blocks.length ? (r.ix.blockAll || r.seo.noindex ? "Page non indexable : aucune donnée structurée n'est publiée." : "Aucune donnée structurée produite.") : null };
  });
  const sel = rows.find((r) => r.id === pageId) || rows[0] || null;
  const st = settings.allFor(siteId);
  return { site: ev.site, rows, truncated: ev.truncated, org, orgProblems, sel, selJson: sel && sel.blocks.length ? JSON.stringify(sel.blocks, null, 2) : "", selRecommended: sel ? recommendedMissing(sel.blocks) : [], settings: st, stored: settings.storedFor(siteId),
    totals: { pages: rows.length, withData: rows.filter((r) => !r.none).length, invalid: rows.filter((r) => r.problems.length).length } };
}

// ---------- Open Graph ----------
function ogView(req, ctx, siteId) {
  const ev = evaluatePages(req, ctx, siteId);
  if (!ev) return null;
  const sx = ev.site.settings;
  const rows = ev.rows.map((r) => {
    const seo = r.seo;
    const hero = (r.page.sections || []).find((x) => x.type === "hero" && x.image);
    let source = "aucune";
    if (r.h.image) {
      if (seo.ogImage) source = "page";
      else if (hero && r.h.image.endsWith(hero.image)) source = "bandeau de la page";
      else if (sx.seo && sx.seo.ogImage && r.h.image.endsWith(sx.seo.ogImage)) source = "image du site";
      else if (sx.identity && sx.identity.logoUrl && r.h.image.endsWith(sx.identity.logoUrl)) source = "logo du site";
      else source = "valeur de secours";
    }
    const notes = [];
    if (!r.h.image) notes.push({ level: "warning", text: "Aucune image de partage trouvée : le lien partagé s'affichera sans visuel." });
    else if (r.h.imageWidth && r.h.imageHeight && (r.h.imageWidth < 600 || r.h.imageHeight < 315)) notes.push({ level: "info", text: `Image de ${r.h.imageWidth} × ${r.h.imageHeight} px : petite pour un partage (idéal 1200 × 630).` });
    else if (r.h.image && !r.h.imageWidth) notes.push({ level: "info", text: "Dimensions de l'image non vérifiables (adresse externe)." });
    if (r.h.noindex) notes.push({ level: "info", text: "Page non indexable : les balises de partage restent publiées, mais les données structurées non." });
    return { id: r.page.id, name: r.page.name, path: r.path, title: r.h.ogTitle || r.h.title, description: r.h.ogDescription || r.h.description, image: r.h.image || null, imageW: r.h.imageWidth || null, imageH: r.h.imageHeight || null, source, card: r.h.twitterCard, url: r.h.ogUrl || r.h.canonical, siteName: r.h.siteName, notes,
      custom: Boolean(seo.ogTitle || seo.ogDescription || seo.ogImage) };
  });
  const siteImage = (sx.seo && sx.seo.ogImage) || "";
  return { site: ev.site, rows, truncated: ev.truncated, siteImage, siteImageOk: siteImage ? (siteImage.startsWith("/") ? images.probe(siteImage).exists : /^https:\/\//i.test(siteImage)) : null,
    stored: settings.storedFor(siteId), settings: settings.allFor(siteId), revision: ev.site.settings_revision, totals: { pages: rows.length, withImage: rows.filter((r) => r.image).length, custom: rows.filter((r) => r.custom).length } };
}
// Image de partage par défaut du site (réglage du site, chemin officiel avec contrôle de révision)
function saveSiteShareImage(ctx, siteId, { image, revision, userId }) {
  const site = pagesLib.requireSite(ctx, siteId, { active: true });
  const settingsNext = JSON.parse(JSON.stringify(site.settings));
  const before = (settingsNext.seo && settingsNext.seo.ogImage) || "";
  const value = String(image || "").trim();
  if (value === before) return { ok: true, changed: false };
  settingsNext.seo = { ...settingsNext.seo, ogImage: value };
  pagesLib.saveSiteDesign(ctx, siteId, { settings: settingsNext, revision });
  store.logChange({ entityType: "settings", entityKey: `site:${siteId}`, field: "site_og_image", before, after: value, userId, siteId });
  return { ok: true, changed: true };
}

// Images de la médiathèque PROPRE à ce site (choix de l'image de partage) : aucun fichier d'un autre site ni de la médiathèque commune
function siteImages(ctx, siteId) {
  needSite(siteId);
  return db.prepare("SELECT path, name, width, height FROM mk_media WHERE organization_id = ? AND reach = 'site' AND site_id = ? AND kind = 'image' AND deleted_at IS NULL AND mime IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') ORDER BY id DESC LIMIT 80").all(ctx.organizationId, siteId);
}

// ---------- Analyse ----------
// Gravité affichée : critique / avertissement / recommandation (les niveaux fins du moteur sont regroupés)
const LEVEL_OF = { critical: "critique", high: "avertissement", medium: "avertissement", low: "recommandation", info: "recommandation" };
const LEVELS = { critique: "Critique", avertissement: "Avertissement", recommandation: "Recommandation" };

function reapStale(siteId) {
  if (!store.hasSiteColumn("seo_audits")) return;
  const running = audit.isRunning();
  db.prepare("UPDATE seo_audits SET status = 'failed', error = 'Analyse interrompue (redémarrage du serveur). Relancez-la.', finished_at = datetime('now') WHERE site_id = ? AND status = 'running' AND id <> ? AND started_at < datetime('now', '-20 minutes')").run(siteId, running || 0);
}
function analysisView(req, ctx, siteId, { auditId = null, severity = "", category = "", q = "" } = {}) {
  needSite(siteId);
  reapStale(siteId);
  const hasCol = store.hasSiteColumn("seo_audits");
  const history = hasCol ? audit.list(15, { site: siteId }) : [];
  const done = history.filter((a) => a.status === "done");
  const current = auditId ? audit.get(auditId, { site: siteId }) : (done[0] || null);
  const running = history.find((a) => a.status === "running") || null;
  const ev = (() => { const known = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL AND status = 'published'").get(siteId).n; return { known }; })();
  let issues = [];
  let counts = { critique: 0, avertissement: 0, recommandation: 0 };
  let pageOf = new Map();
  if (current && current.status === "done") {
    const pages = db.prepare("SELECT id, slug, site_id, status, archived_at FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL").all(siteId);
    pageOf = new Map(pages.map((p) => [urls.pageCanonicalPath(p), p.id]));
    const all = audit.issuesOf(current.id, { category }).filter((i) => !i.fixed_at);
    for (const i of all) counts[LEVEL_OF[i.severity] || "recommandation"]++;
    issues = all.filter((i) => (!severity || (LEVEL_OF[i.severity] || "recommandation") === severity) && (!q || i.path.includes(q) || i.detail.toLowerCase().includes(q.toLowerCase())))
      .map((i) => ({ ...i, level: LEVEL_OF[i.severity] || "recommandation", rule: BY_ID[i.rule_id] || null, pageId: pageOf.get(i.path.split("?")[0]) || null }));
  }
  // Comparaison avec l'analyse précédente (mêmes règles, même site) : nouveaux problèmes / problèmes résolus
  let comparison = null;
  if (current && current.status === "done") {
    const idx = done.findIndex((a) => a.id === current.id);
    const prev = idx >= 0 ? done[idx + 1] : null;
    if (prev) {
      const key = (i) => `${i.rule_id}|${i.path}`;
      const a = new Set(audit.issuesOf(prev.id).filter((i) => !["info"].includes(i.severity)).map(key));
      const b = new Set(audit.issuesOf(current.id).filter((i) => !["info"].includes(i.severity)).map(key));
      comparison = { prev, resolved: [...a].filter((k) => !b.has(k)).length, added: [...b].filter((k) => !a.has(k)).length, scoreBefore: prev.scores && prev.scores.overall ? prev.scores.overall.score : null, scoreNow: current.scores && current.scores.overall ? current.scores.overall.score : null };
    }
  }
  return { history, current, running, runningElsewhere: audit.isRunning() && !running ? audit.runningSiteId() !== siteId : false, issues, counts, comparison, knownPages: ev.known, LEVELS, categories: CATEGORIES, severity, category, q };
}
// Lance une analyse du site. Évite les relances inutiles : si rien n'a changé depuis la dernière analyse terminée (moins de 15 minutes), elle est réutilisée sauf demande explicite.
async function startAnalysis(req, siteId, userId, { force = false } = {}) {
  needSite(siteId);
  reapStale(siteId);
  if (!force && store.hasSiteColumn("seo_audits")) {
    const last = db.prepare("SELECT id, finished_at FROM seo_audits WHERE site_id = ? AND status = 'done' ORDER BY id DESC LIMIT 1").get(siteId);
    if (last) {
      const changed = db.prepare("SELECT 1 FROM mk_landing_pages WHERE site_id = ? AND updated_at > ? LIMIT 1").get(siteId, last.finished_at);
      const recent = db.prepare("SELECT datetime(?) > datetime('now', '-15 minutes') AS r").get(last.finished_at).r;
      if (!changed && recent) return { ok: true, reused: true, id: last.id };
    }
  }
  const r = await audit.runAudit({ kind: "full", userId, req, source: "site", siteId });
  if (!r.ok) return r;
  r.done.catch(() => {}); // l'échec est enregistré dans l'analyse (statut « failed ») ; l'écran lit cet état
  return { ok: true, id: r.id, reused: false };
}
function analysisState(siteId, id) {
  needSite(siteId);
  reapStale(siteId);
  const a = audit.get(Number(id), { site: siteId });
  if (!a) return null;
  const known = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL AND status = 'published'").get(siteId).n;
  return { id: a.id, status: a.status, pages: a.pages, known, issues: a.issues, error: a.error || null, finished_at: a.finished_at, started_at: a.started_at, scores: a.scores };
}

// ---------- 404 ----------
const ERROR_STATES = { open: "À traiter", handled: "Traitée", recovered: "Revenue en ligne", ignored: "Ignorée" };
function notFoundView(siteId, { state = "open", q = "", filter = "all" } = {}) {
  needSite(siteId);
  const list = notfound.list({ site: siteId, filter: state === "ignored" ? "ignored" : filter, q, limit: 300 });
  const rows = list.map((r) => {
    const red = redirects.lookup(siteId, r.path);
    const status = r.ignored ? "ignored" : r.recovered_at ? "recovered" : r.handled_at || red ? "handled" : "open";
    return { ...r, redirect: red ? { target: red.target, status: red.status } : null, state: status, recurrent: r.hits_human + r.hits_bot >= 5 && r.first_seen < r.last_seen };
  }).filter((r) => state === "all" || (state === "ignored" ? true : state === "open" ? r.state === "open" : r.state === state));
  const stats = notfound.stats({ site: siteId });
  return { rows, stats, states: ERROR_STATES, state, q, filter, suggestions: Object.fromEntries(rows.filter((r) => r.state === "open").slice(0, 50).map((r) => [r.path, suggestTargets(siteId, r.path)])) };
}
// Destinations plausibles (pages EN LIGNE de CE site dont l'adresse ressemble à l'adresse demandée) : proposées, jamais appliquées automatiquement
function suggestTargets(siteId, path) {
  const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const want = new Set(tokens(path));
  if (!want.size) return [];
  const { pages } = livePages(siteId);
  return pages.map((p) => ({ path: urls.pageCanonicalPath(p), name: p.name, score: tokens(`${p.slug} ${p.name}`).filter((t) => want.has(t)).length })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}
// Vérifie qu'une destination interne répond bien (200) en suivant ses redirections ; une destination externe n'est jamais appelée
async function checkTarget(siteId, target, req) {
  const t = String(target || "").trim();
  if (/^https:\/\//i.test(t)) return { ok: true, external: true, note: "Destination externe : non vérifiée (aucun appel sortant)." };
  if (!t.startsWith("/")) return { ok: false, error: "Destination invalide : un chemin du site (/page) ou une adresse https://." };
  const info = urls.siteInfo(siteId);
  let host = req.get("host");
  if (info && info.base) { try { host = new URL(info.base).host; } catch { /* hôte de la requête conservé */ } }
  const trace = await probe.trace(Number(process.env.PORT || 3002), t, { host });
  const final = trace.final || {};
  if (trace.loop) return { ok: false, error: "La destination boucle sur elle-même." };
  if (final.external) return { ok: true, external: true, note: "La destination redirige vers un site externe." };
  if (final.status !== 200) return { ok: false, error: `La destination répond ${final.status || "aucune réponse"} : choisissez une page qui existe.` };
  return { ok: true };
}
// Contrôle de reprise : l'adresse répond-elle encore 404 ? Les visites passées ne sont jamais effacées.
async function recheck(siteId, paths, req) {
  needSite(siteId);
  const info = urls.siteInfo(siteId);
  let host = req.get("host");
  if (info && info.base) { try { host = new URL(info.base).host; } catch { /* hôte de la requête conservé */ } }
  const out = [];
  for (const path of paths.slice(0, 25)) {
    const row = db.prepare("SELECT path FROM seo_404 WHERE site_id = ? AND path = ?").get(siteId, path);
    if (!row) continue; // une adresse qui n'appartient pas à ce site n'est jamais sondée
    const t = await probe.trace(Number(process.env.PORT || 3002), path, { host });
    const status = (t.final && t.final.status) || 0;
    const back = status === 200 || (t.final && t.final.external);
    db.prepare(`UPDATE seo_404 SET last_checked_at = datetime('now'), last_check_status = ?, recovered_at = CASE WHEN ? THEN COALESCE(recovered_at, datetime('now')) ELSE NULL END WHERE site_id = ? AND path = ?`).run(status, back ? 1 : 0, siteId, path);
    out.push({ path, status, recovered: back });
  }
  return out;
}

// ---------- Vue générale ----------
function overview(req, ctx, siteId) {
  needSite(siteId);
  const ev = evaluatePages(req, ctx, siteId);
  if (!ev) return null;
  const map = sitemap.entriesForSite(siteId);
  const dupT = duplicates(ev.rows, (r) => r.h.title);
  const dupD = duplicates(ev.rows, (r) => r.h.description);
  const schemaProblems = ev.rows.filter((r) => schema.validate(r.h.jsonLd || []).length).length;
  const lastAudit = store.hasSiteColumn("seo_audits") ? audit.list(1, { site: siteId })[0] || null : null;
  const lastDone = store.hasSiteColumn("seo_audits") ? audit.list(15, { site: siteId }).find((a) => a.status === "done") || null : null;
  const nf = notfound.stats({ site: siteId });
  const redirectsCount = db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id = ? AND enabled = 1").get(siteId).n;
  const robotsCustom = settings.allFor(siteId).robots_custom || "";
  const sm = db.prepare("SELECT generated_at, valid FROM seo_site_sitemaps WHERE site_id = ?").get(siteId) || null;
  const missingDesc = ev.rows.filter((r) => !r.seo.description && !r.page.description).length;
  return {
    site: ev.site, truncated: ev.truncated, lastAudit, lastDone, scores: lastDone && lastDone.scores ? lastDone.scores : null,
    pages: { analysed: ev.rows.length, indexable: ev.rows.filter((r) => r.ix.indexable).length, excluded: ev.rows.filter((r) => !r.ix.indexable).length,
      missingDescription: missingDesc, longTitle: ev.rows.filter((r) => (r.h.title || "").length > TITLE_MAX).length, dupTitle: dupT.size, dupDescription: dupD.size },
    sitemap: { urls: map.included.length, excluded: map.excluded.length, checkedAt: sm ? sm.generated_at : null, valid: sm ? Boolean(sm.valid) : null },
    robots: { custom: Boolean(robotsCustom.trim()), domain: urls.siteInfo(siteId) && urls.siteInfo(siteId).base ? urls.siteInfo(siteId).base : null },
    schema: { invalid: schemaProblems, withData: ev.rows.filter((r) => (r.h.jsonLd || []).length).length },
    notFound: nf, redirects: redirectsCount,
    siteNoindex: Boolean(ev.site.settings.extras && ev.site.settings.extras.noindex),
    envClosed: !require("../middlewares/siteHost").indexingAllowed(req),
  };
}

module.exports = {
  needSite, viewReq, livePages, evaluatePages, metaView, indexingView, saveSiteIndexing, sitemapView, regenerateSitemap, robotsView, robotsPreview, robotsRestore, schemaView, ogView, saveSiteShareImage, siteImages,
  analysisView, startAnalysis, analysisState, notFoundView, suggestTargets, checkTarget, recheck, overview, LEVELS, LEVEL_OF, ERROR_STATES, intId, SEVERITIES, RULES,
};
