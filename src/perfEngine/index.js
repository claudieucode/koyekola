// Performance Intelligence Core (programme 22.9) : analyse d'une page PUBLIÉE d'un site, historique, comparaison, réglage d'optimisation (journalisé, réversible).
// Rien ici n'appelle d'IA ni de service externe. Le HTML analysé est celui que sert réellement le serveur (requête locale sur une page du site, jamais une adresse fournie par l'utilisateur).
const path = require("node:path");
const crypto = require("node:crypto");
const vitals = require("./vitals");
const { analyzeHtml, localSizer } = require("./htmlAnalyzer");
const { recommend } = require("./recommend");
const { compare, DEFAULTS } = require("./regress");
const { prioritizeLcp } = require("./optimize");
const { MarketingError } = require("../marketing/errors");

const PUBLIC_ROOT = path.join(__dirname, "..", "..", "public");
const siteGuard = (ctx, siteId) => require("../regen").ctxLib.siteGuard(ctx, siteId);

function ensureSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS mk_perf_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, page_id INTEGER NOT NULL,
    kind TEXT NOT NULL, env TEXT NOT NULL, build TEXT NOT NULL DEFAULT '', optimization TEXT NOT NULL DEFAULT '', report TEXT NOT NULL, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  db.exec("CREATE INDEX IF NOT EXISTS idx_mk_perf_reports_page ON mk_perf_reports(site_id, page_id, id)");
  // Réglages d'optimisation par site + journal (qui, quand, avant, après) : tout réglage est réversible en le rebasculant
  db.exec(`CREATE TABLE IF NOT EXISTS mk_perf_settings (site_id INTEGER PRIMARY KEY REFERENCES mk_sites(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, lcp_priority INTEGER NOT NULL DEFAULT 1, updated_by INTEGER, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  db.exec(`CREATE TABLE IF NOT EXISTS mk_perf_log (id INTEGER PRIMARY KEY AUTOINCREMENT, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, option TEXT NOT NULL, before_value INTEGER, after_value INTEGER, user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
}
const guard = (ctx, siteId) => { siteGuard(ctx, siteId); ensureSchema(ctx.db); };
const KEEP_REPORTS = 30, MAX_HTML = 5 * 1024 * 1024, MIN_GAP_MS = () => (process.env.KOLAKISA_PERF_GAP_MS !== undefined ? Number(process.env.KOLAKISA_PERF_GAP_MS) || 0 : 3000);
const lastRun = new Map(); // anti-rafale : une analyse par page toutes les 3 s (clé site:page)
const BUILD = () => process.env.GIT_SHA || process.env.SOURCE_VERSION || require("../../package.json").version || "inconnu";

// Chemin chaud (chaque page publique) : jamais d'exception ; défaut = activé ; table absente = activé
function lcpEnabled(db, siteId) {
  if (siteId === null || siteId === undefined) return true;
  try { const r = db.prepare("SELECT lcp_priority AS v FROM mk_perf_settings WHERE site_id = ?").get(siteId); return r ? r.v === 1 : true; } catch { return true; }
}
function settings(ctx, siteId) { guard(ctx, siteId); return { lcpPriority: lcpEnabled(ctx.db, siteId) }; }
function setOption(ctx, siteId, option, value) {
  guard(ctx, siteId);
  if (option !== "lcpPriority" || typeof value !== "boolean") throw new MarketingError("invalid_field", "Option inconnue ou valeur invalide.");
  const before = lcpEnabled(ctx.db, siteId);
  ctx.db.prepare(`INSERT INTO mk_perf_settings (site_id, organization_id, lcp_priority, updated_by, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(site_id) DO UPDATE SET lcp_priority = excluded.lcp_priority, updated_by = excluded.updated_by, updated_at = excluded.updated_at`).run(siteId, ctx.organizationId, value ? 1 : 0, ctx.userId || null);
  ctx.db.prepare("INSERT INTO mk_perf_log (site_id, organization_id, option, before_value, after_value, user_id) VALUES (?, ?, ?, ?, ?, ?)").run(siteId, ctx.organizationId, option, before ? 1 : 0, value ? 1 : 0, ctx.userId || null);
  return { lcpPriority: value, previous: before };
}
function log(ctx, siteId) { guard(ctx, siteId); return ctx.db.prepare("SELECT id, option, before_value AS before, after_value AS after, user_id AS userId, created_at AS at FROM mk_perf_log WHERE site_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 50").all(siteId, ctx.organizationId); }

const pageOfSite = (ctx, siteId, pageId) => {
  const p = ctx.db.prepare("SELECT id, name, slug, status, site_id FROM mk_landing_pages WHERE id = ? AND site_id = ? AND organization_id = ? AND archived_at IS NULL").get(pageId, siteId, ctx.organizationId);
  if (!p) throw new MarketingError("not_found", "Page introuvable dans ce site.");
  return p;
};

// fetcher(path) → { status, html, headers, ttfbMs } : fourni par la route (requête locale) ; injectable dans les tests
async function analyzePage(ctx, siteId, pageId, fetcher, { host = "" } = {}) {
  guard(ctx, siteId);
  const page = pageOfSite(ctx, siteId, pageId);
  const gapKey = `${siteId}:${pageId}`, now = Date.now();
  if (now - (lastRun.get(gapKey) || 0) < MIN_GAP_MS()) throw new MarketingError("invalid_field", "Une analyse de cette page vient d'être lancée : patientez quelques secondes.");
  lastRun.set(gapKey, now); if (lastRun.size > 2000) lastRun.clear();
  if (page.status !== "published") throw new MarketingError("invalid_field", "Seule une page publiée peut être analysée : le brouillon n'est pas servi aux visiteurs.");
  const res = await fetcher(`/p/${encodeURIComponent(page.slug)}`);
  if (!res || res.status !== 200) throw new MarketingError("invalid_field", `La page n'a pas pu être lue (réponse ${res ? res.status : "aucune"}).`);
  if (String(res.html).length > MAX_HTML) throw new MarketingError("invalid_field", "La page dépasse 5 Mo de HTML : analyse refusée.");
  const a = analyzeHtml(res.html, { headers: res.headers, host, sizer: localSizer(PUBLIC_ROOT), ttfbMs: res.ttfbMs });
  const auto = lcpEnabled(ctx.db, siteId);
  const findings = recommend(a, { autoLcp: auto });
  const report = { metrics: a.metrics, facts: a.facts, findings, vitals: vitals.VERSION, conditions: { source: "HTML servi par ce serveur", env: "analyse-statique", at: new Date().toISOString(), note: "Aucune mesure LCP/INP/CLS : elles exigent un navigateur (laboratoire) ou des données terrain." } };
  const id = ctx.db.prepare("INSERT INTO mk_perf_reports (organization_id, site_id, page_id, kind, env, build, optimization, report, created_by) VALUES (?, ?, ?, 'statique', 'analyse-statique', ?, ?, ?, ?)")
    .run(ctx.organizationId, siteId, pageId, BUILD(), JSON.stringify({ lcpPriority: auto }), JSON.stringify(report), ctx.userId || null).lastInsertRowid;
  // historique borné : seuls les 30 derniers rapports de la page sont gardés (rapports dérivés, régénérables ; aucune donnée du site n'est touchée)
  ctx.db.prepare("DELETE FROM mk_perf_reports WHERE site_id = ? AND page_id = ? AND id NOT IN (SELECT id FROM mk_perf_reports WHERE site_id = ? AND page_id = ? ORDER BY id DESC LIMIT ?)").run(siteId, pageId, siteId, pageId, KEEP_REPORTS);
  const prev = ctx.db.prepare("SELECT id FROM mk_perf_reports WHERE site_id = ? AND page_id = ? AND kind = 'statique' AND id < ? ORDER BY id DESC LIMIT 1").get(siteId, pageId, id);
  let comparison = null; try { comparison = prev ? compare(get(ctx, siteId, prev.id).report, report) : null; } catch { comparison = null; }
  return { id: Number(id), page: { id: page.id, name: page.name }, report, comparison };
}
function get(ctx, siteId, id) {
  guard(ctx, siteId);
  const r = ctx.db.prepare("SELECT * FROM mk_perf_reports WHERE id = ? AND site_id = ? AND organization_id = ?").get(id, siteId, ctx.organizationId);
  if (!r) throw new MarketingError("not_found", "Rapport introuvable pour ce site.");
  return { id: r.id, pageId: r.page_id, kind: r.kind, env: r.env, build: r.build, optimization: JSON.parse(r.optimization || "{}"), at: r.created_at, report: JSON.parse(r.report) };
}
function history(ctx, siteId, pageId) {
  guard(ctx, siteId); pageOfSite(ctx, siteId, pageId);
  return ctx.db.prepare("SELECT id, kind, build, optimization, created_at AS at, report FROM mk_perf_reports WHERE site_id = ? AND page_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 30").all(siteId, pageId, ctx.organizationId).map((r) => {
    let rep; try { rep = JSON.parse(r.report); } catch { rep = null; }
    if (!rep || !rep.metrics) return { id: r.id, kind: r.kind, build: r.build, optimization: {}, at: r.at, summary: null };
    const M = rep.metrics;
    return { id: r.id, kind: r.kind, build: r.build, optimization: JSON.parse(r.optimization || "{}"), at: r.at, summary: { htmlGzipBytes: M.htmlGzipBytes.value, jsBytes: M.jsBytes.value, cssBytes: M.cssBytes.value, domNodes: M.domNodes.value, images: M.images.value, findings: rep.findings.length, high: rep.findings.filter((f) => f.severity === "élevée" || f.severity === "critique").length } };
  });
}
function compareReports(ctx, siteId, beforeId, afterId, thresholds) {
  const b = get(ctx, siteId, beforeId), a = get(ctx, siteId, afterId);
  const t = {}; for (const k of Object.keys(DEFAULTS)) if (thresholds && thresholds[k] && Number.isFinite(thresholds[k].rel) && Number.isFinite(thresholds[k].abs) && thresholds[k].rel >= 0 && thresholds[k].abs >= 0) t[k] = { rel: thresholds[k].rel, abs: thresholds[k].abs };
  return { before: { id: b.id, at: b.at, build: b.build, optimization: b.optimization }, after: { id: a.id, at: a.at, build: a.build, optimization: a.optimization }, ...compare(b.report, a.report, { thresholds: t }) };
}
// Vue globale : dernier rapport de chaque page du site. Aucun score inventé : des comptes de constats.
function overview(ctx, siteId) {
  guard(ctx, siteId);
  const pages = ctx.db.prepare("SELECT id, name, slug, status FROM mk_landing_pages WHERE site_id = ? AND organization_id = ? AND archived_at IS NULL ORDER BY name COLLATE NOCASE").all(siteId, ctx.organizationId);
  const rows = pages.map((p) => {
    const r = ctx.db.prepare("SELECT id, created_at, report FROM mk_perf_reports WHERE site_id = ? AND page_id = ? AND kind = 'statique' ORDER BY id DESC LIMIT 1").get(siteId, p.id);
    if (!r) return { id: p.id, name: p.name, slug: p.slug, status: p.status, analyzed: false };
    let rep; try { rep = JSON.parse(r.report); } catch { rep = null; }
    if (!rep || !rep.metrics) return { id: p.id, name: p.name, slug: p.slug, status: p.status, analyzed: false };
    return { id: p.id, name: p.name, slug: p.slug, status: p.status, analyzed: true, reportId: r.id, at: r.created_at, findings: rep.findings.length, high: rep.findings.filter((f) => f.severity === "élevée" || f.severity === "critique").length, metrics: Object.fromEntries(["htmlGzipBytes", "jsBytes", "cssBytes", "domNodes", "images", "requests", "blockingScripts"].map((k) => [k, rep.metrics[k].value])) };
  });
  return { site: siteId, pages: rows, totals: { pages: pages.length, analyzed: rows.filter((r) => r.analyzed).length, withHighFindings: rows.filter((r) => r.analyzed && r.high > 0).length, clean: rows.filter((r) => r.analyzed && r.findings === 0).length }, vitals: { version: vitals.VERSION, thresholds: vitals.THRESHOLDS }, field: { available: false, note: "Aucune collecte de données terrain (utilisateurs réels) : LCP, INP et CLS réels sont indisponibles." } };
}
module.exports = { analyzePage, get, history, compareReports, overview, settings, setOption, log, lcpEnabled, ensureSchema, prioritizeLcp, vitals, analyzeHtml, recommend, compare, localSizer };
