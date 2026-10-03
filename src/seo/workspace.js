// Espace de travail SEO de l'éditeur d'articles — côté serveur :
//   1. disposition des panneaux (dernière disposition + dispositions nommées), enregistrée sur le compte ;
//   2. préférences du Mode Fun (couche ludique optionnelle : ne touche à aucune donnée SEO) ;
//   3. couche de données partagée : les informations RÉELLES dont les panneaux ont besoin, rassemblées en un seul appel
//      par partie (page en ligne, audit, Search Console, vitesse, intégrations, opportunités). Aucun calcul SEO n'est
//      refait ici : chaque partie lit le moteur existant (inspect, robots, sitemap, audit, intégrations, suggestions).
const db = require("../config/database");
const { db: seoDb } = require("./store");
const settings = require("./settings");
const robots = require("./robots");
const sitemap = require("./sitemap");
const audit = require("./audit");
const integrations = require("./integrations");
const { inspect } = require("./inspect");
const { BY_ID, SEVERITIES, CATEGORIES } = require("./rules");

seoDb.exec(`
  CREATE TABLE IF NOT EXISTS seo_workspace_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    layout TEXT,
    fun TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS seo_workspaces (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layout TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, name)
  );
`);

// ---------- Disposition ----------
// Panneaux connus (même liste que l'éditeur) : toute autre clé est ignorée
const PANELS = ["score", "reco", "seo-site", "keyword", "google", "analysis", "social", "structure", "links", "indexing", "seo-history", "opportunities", "technical", "images", "performance", "gsc", "external"];
const MAX_LAYOUT = 20000;
const num = (v, min, max, fallback) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Math.round(Number(v)))) : fallback);
const cleanGroup = (g, seen) => {
  const panels = (Array.isArray(g && g.panels) ? g.panels : []).map(String).filter((k) => PANELS.includes(k) && !seen.has(k) && seen.add(k));
  if (!panels.length) return null;
  return { panels, active: panels.includes(g.active) ? g.active : panels[0] };
};
// Valide et normalise une disposition reçue du navigateur (structure, bornes, doublons) ; null si inutilisable
function cleanLayout(input) {
  let l = input;
  if (typeof l === "string") { if (l.length > MAX_LAYOUT) return null; try { l = JSON.parse(l); } catch { return null; } }
  if (!l || typeof l !== "object") return null;
  const seen = new Set();
  const dock = (d, size) => ({ ...(size ? { [size]: num(d && d[size], 120, 2000, null) } : {}), groups: (Array.isArray(d && d.groups) ? d.groups : []).slice(0, 30).map((g) => cleanGroup(g, seen)).filter(Boolean) });
  const out = {
    v: 1,
    right: dock(l.right, "w"), left: dock(l.left, "w"), bottom: dock(l.bottom, "h"),
    floats: (Array.isArray(l.floats) ? l.floats : []).slice(0, 12).map((f) => { const g = cleanGroup(f, seen); return g && { ...g, x: num(f.x, 0, 4000, 40), y: num(f.y, 0, 4000, 40), w: num(f.w, 200, 2000, 340), h: num(f.h, 140, 2000, 360) }; }).filter(Boolean),
    minimized: (Array.isArray(l.minimized) ? l.minimized : []).map(String).filter((k) => PANELS.includes(k)),
  };
  out.closed = PANELS.filter((k) => !seen.has(k) && (Array.isArray(l.closed) ? l.closed.map(String).includes(k) : false));
  return JSON.stringify(out).length > MAX_LAYOUT ? null : out;
}
const parse = (t) => { try { return t ? JSON.parse(t) : null; } catch { return null; } };
function prefsOf(userId) {
  const r = seoDb.prepare("SELECT layout, fun FROM seo_workspace_prefs WHERE user_id = ?").get(userId) || {};
  return {
    layout: parse(r.layout),
    fun: cleanFun(parse(r.fun) || {}),
    saved: seoDb.prepare("SELECT name, updated_at FROM seo_workspaces WHERE user_id = ? ORDER BY name COLLATE NOCASE").all(userId).map((x) => ({ name: x.name, updatedAt: x.updated_at })),
  };
}
function saveLayout(userId, layout) {
  const l = cleanLayout(layout);
  if (!l) return { ok: false, error: "Disposition invalide." };
  seoDb.prepare("INSERT INTO seo_workspace_prefs (user_id, layout, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET layout = excluded.layout, updated_at = excluded.updated_at").run(userId, JSON.stringify(l));
  return { ok: true, layout: l };
}
const NAME = /^[\p{L}\p{N} '’._-]{1,40}$/u;
function saveNamed(userId, name, layout) {
  const n = String(name || "").trim();
  if (!NAME.test(n)) return { ok: false, error: "Nom invalide : 1 à 40 lettres, chiffres ou espaces." };
  const l = cleanLayout(layout);
  if (!l) return { ok: false, error: "Disposition invalide." };
  if (seoDb.prepare("SELECT COUNT(*) n FROM seo_workspaces WHERE user_id = ?").get(userId).n >= 20 && !seoDb.prepare("SELECT 1 FROM seo_workspaces WHERE user_id = ? AND name = ?").get(userId, n)) return { ok: false, error: "20 dispositions au plus : supprimez-en une." };
  seoDb.prepare("INSERT INTO seo_workspaces (user_id, name, layout, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(user_id, name) DO UPDATE SET layout = excluded.layout, updated_at = excluded.updated_at").run(userId, n, JSON.stringify(l));
  return { ok: true, name: n };
}
const getNamed = (userId, name) => parse((seoDb.prepare("SELECT layout FROM seo_workspaces WHERE user_id = ? AND name = ?").get(userId, String(name)) || {}).layout);
const deleteNamed = (userId, name) => seoDb.prepare("DELETE FROM seo_workspaces WHERE user_id = ? AND name = ?").run(userId, String(name)).changes > 0;

// ---------- Mode Fun (préférences et progression purement ludiques) ----------
const FUN_FLAGS = ["enabled", "humor", "eggs", "gamification", "animations", "robot", "notifications"];
const PERSONALITIES = ["professionnel", "fun", "chaotique"];
const BADGES = ["premiere-optimisation", "maitre-des-liens", "nettoyeur-seo", "chasseur-exploration", "architecte-seo"];
function cleanFun(f) {
  const out = { enabled: false, humor: true, eggs: true, gamification: true, animations: true, robot: true, notifications: true, personality: "professionnel", xp: 0, badges: [] };
  for (const k of FUN_FLAGS) if (typeof f[k] === "boolean") out[k] = f[k];
  if (PERSONALITIES.includes(f.personality)) out.personality = f.personality;
  out.xp = num(f.xp, 0, 1000000, 0);
  out.badges = [...new Set((Array.isArray(f.badges) ? f.badges : []).map(String).filter((b) => BADGES.includes(b)))];
  return out;
}
function saveFun(userId, input) {
  const current = prefsOf(userId).fun;
  const f = cleanFun({ ...current, ...(input && typeof input === "object" ? input : {}) });
  seoDb.prepare("INSERT INTO seo_workspace_prefs (user_id, fun, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET fun = excluded.fun, updated_at = excluded.updated_at").run(userId, JSON.stringify(f));
  return f;
}

// ---------- Données de l'article (couche partagée) ----------
const siteBase = () => String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
const issueJson = (i) => {
  const rule = BY_ID[i.rule_id] || {};
  return { id: i.id, rule: i.rule_id, title: rule.title || i.rule_id, severity: i.severity, severityLabel: (SEVERITIES[i.severity] || {}).label || i.severity, category: CATEGORIES[i.category] || i.category, detail: i.detail, recommendation: rule.recommendation || null };
};
const ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const bySeverity = (a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9);

function auditPart(post) {
  const path = `/blog/${post.slug}`;
  const last = audit.latest();
  const a = last ? audit.get(last.id) : null;
  const issues = a ? seoDb.prepare("SELECT * FROM seo_issues WHERE audit_id = ? AND path = ? AND fixed_at IS NULL").all(a.id, path).map(issueJson).sort(bySeverity) : [];
  const changedAt = String(post.updated_at || post.published_at || "").replace("T", " ").slice(0, 19);
  return {
    online: Boolean(post.published), path, audit: a ? { id: a.id, finishedAt: a.finished_at, kind: a.kind } : null, issues,
    newerThanAudit: Boolean(a && changedAt && changedAt > a.finished_at),
    links: { analyse: `/formateur/seo/analyse?path=${encodeURIComponent(path)}`, audit: a ? `/formateur/seo/audit?id=${a.id}&q=${encodeURIComponent(path)}` : "/formateur/seo/audit", space: "/formateur/seo" },
  };
}

// Page réellement servie aux visiteurs : statut, balises, données structurées, robots.txt, plan du site, redirections
async function pagePart(post, req) {
  const path = `/blog/${post.slug}`;
  const map = sitemap.entries();
  const inMap = map.included.find((e) => e.path === path);
  const excluded = map.excluded.find((e) => e.path === path);
  const rules = robots.text(req).split("\n").filter((l) => !/^sitemap:/i.test(l)).join("\n");
  const redirectsIn = seoDb.prepare("SELECT source_path, status, hits FROM seo_redirects WHERE target = ? AND enabled = 1 ORDER BY id").all(path);
  const oldSlugs = db.prepare("SELECT old_slug FROM post_slug_history WHERE post_id = ? ORDER BY rowid DESC").all(post.id).map((r) => `/blog/${r.old_slug}`);
  const base = { path, online: Boolean(post.published), robotsTxtAllowed: robots.allowed(rules, "Googlebot", path), sitemap: inMap ? { included: true } : { included: false, reason: excluded ? excluded.reason : post.published ? "Non trouvée dans le plan du site" : "Article non publié" }, redirectsIn, oldSlugs, settingsRobots: { index: post.robots_index !== 0, follow: post.robots_follow !== 0 } };
  if (!post.published) return { ...base, live: null, reason: "L'article n'est pas en ligne : la page publique n'existe pas encore." };
  const r = await inspect(path, { host: req.get("host") });
  if (!r.ok) return { ...base, live: { reachable: false, error: r.error } };
  const p = r.page;
  return {
    ...base,
    live: {
      reachable: true, status: r.status, ms: r.ms, xRobots: r.xRobots,
      title: p ? p.title : null, description: p ? p.description : null, robots: p ? p.robots : null, canonical: p ? p.canonical : null, canonicalCount: p ? p.canonicalCount : null,
      og: p ? p.og : null, twitter: p ? p.twitter : null, h1: p ? p.h1 : null,
      schemaTypes: p ? (p.jsonLd || []).flatMap((j) => (Array.isArray(j["@graph"]) ? j["@graph"] : [j]).map((n) => n["@type"])).flat().filter(Boolean) : [],
      schemaProblems: p ? p.jsonLdProblems || [] : [],
    },
  };
}

async function gscPart(post) {
  const st = integrations.status("search_console");
  if (st.state !== "connected") return { state: st.state, label: st.label, data: null };
  if (!post.published) return { state: st.state, label: st.label, data: null, reason: "Article non publié : aucune donnée de recherche." };
  if (!siteBase()) return { state: st.state, label: st.label, data: null, reason: "Configuration requise : SITE_URL." };
  try { return { state: st.state, label: st.label, data: await integrations.pageReport(`${siteBase()}/blog/${post.slug}`) }; } catch (e) { return { state: "error", label: "Erreur", data: null, reason: e.message }; }
}

function psiPart(post) {
  const url = siteBase() ? `${siteBase()}/blog/${post.slug}` : null;
  const st = integrations.status("pagespeed");
  return { url, canRun: Boolean(post.published && url && /^https:\/\//.test(url)), reason: !url || !/^https:\/\//.test(url) ? "Configuration requise : SITE_URL en https." : !post.published ? "Article non publié." : null, label: st.label, history: url ? integrations.pageSpeedHistory(10, url) : [] };
}

function externalPart() {
  return Object.entries(integrations.NAMES).map(([key, label]) => { const s = integrations.status(key); return { key, label, state: s.state, stateLabel: s.label, detail: s.detail || null }; });
}

// Opportunités : uniquement ce que le moteur a réellement détecté, avec la source de chaque élément
const OPPORTUNITY_RULES = ["weak_inlinks", "orphan_page", "cannibalization", "near_duplicate", "thin_content", "link_to_redirect", "title_too_short", "description_missing", "og_image_missing"];
function opportunitiesPart(post, { gsc } = {}) {
  const out = [];
  const a = auditPart(post);
  for (const i of a.issues.filter((x) => OPPORTUNITY_RULES.includes(x.rule))) out.push({ type: i.category, title: i.title, evidence: i.detail, reason: `Règle « ${i.rule} » de l'audit du ${a.audit.finishedAt}`, action: i.recommendation, source: "Audit du site" });
  const rows = gsc && gsc.data ? gsc.data.queries : [];
  for (const q of rows.filter((r) => r.position >= 8 && r.position <= 20 && r.impressions >= 10).slice(0, 5)) out.push({ type: "Search Console", title: `Presque en première page : « ${q.query} »`, evidence: `Position moyenne ${q.position.toFixed(1)}, ${q.impressions} impressions`, reason: "Requête affichée en 2e page de Google", action: "Traiter cette requête plus en détail dans l'article (intertitre, exemples).", source: "Google Search Console" });
  for (const q of rows.filter((r) => r.impressions >= 50 && r.ctr < 0.02).slice(0, 5)) out.push({ type: "Search Console", title: `Peu de clics pour « ${q.query} »`, evidence: `${q.impressions} impressions, taux de clic ${(q.ctr * 100).toFixed(1)} %`, reason: "L'article est vu mais rarement choisi", action: "Rendre le titre SEO et la description plus engageants pour cette recherche.", source: "Google Search Console" });
  return { items: out, sources: { audit: a.audit ? `Audit du ${a.audit.finishedAt}` : "Aucun audit", gsc: gsc ? gsc.label : "Non connecté" } };
}

function sitePart() {
  const last = audit.latest();
  return {
    publishedPosts: db.prepare("SELECT COUNT(*) n FROM posts WHERE published = 1").get().n,
    brokenLinks: last ? seoDb.prepare("SELECT COUNT(*) n FROM seo_issues WHERE audit_id = ? AND rule_id IN ('broken_internal_link', 'broken_external_link') AND fixed_at IS NULL").get(last.id).n : null,
    lastAudit: last ? audit.get(last.id).finished_at : null,
    siteName: settings.get("site_name"),
  };
}

const PARTS = ["page", "audit", "gsc", "psi", "external", "opportunities", "site"];
async function articleData(post, req, parts) {
  const want = new Set(parts.filter((p) => PARTS.includes(p)));
  const out = {};
  let gsc = null;
  if (want.has("gsc") || want.has("opportunities")) gsc = await gscPart(post);
  if (want.has("gsc")) out.gsc = gsc;
  if (want.has("page")) out.page = await pagePart(post, req);
  if (want.has("audit")) out.audit = auditPart(post);
  if (want.has("psi")) out.psi = psiPart(post);
  if (want.has("external")) out.external = externalPart();
  if (want.has("opportunities")) out.opportunities = opportunitiesPart(post, { gsc });
  if (want.has("site")) out.site = sitePart();
  return out;
}

module.exports = { PANELS, PARTS, cleanLayout, prefsOf, saveLayout, saveNamed, getNamed, deleteNamed, cleanFun, saveFun, articleData, auditPart, BADGES };
