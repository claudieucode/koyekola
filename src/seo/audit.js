// Audit SEO du site : le serveur explore ses propres pages publiques (comme un moteur de recherche), puis applique les
// règles de rules.js. Résultats enregistrés (seo_audits, seo_issues) : historique des notes, problèmes par page,
// corrections automatiques réelles. Aucun chiffre n'est estimé : tout provient des pages réellement lues.
const { db, logChange } = require("./store");
const { RULES, BY_ID, SEVERITIES, CATEGORIES } = require("./rules");
const { inspect } = require("./inspect");
const entities = require("./entities");
const sitemap = require("./sitemap");
const robots = require("./robots");
const redirects = require("./redirects");
const images = require("./images");
const notfound = require("./notfound");
const meta = require("./meta");
const { similarity, normalizeWords, titleTokens, jaccard } = require("./text");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL DEFAULT 'full',
    status TEXT NOT NULL DEFAULT 'running',
    pages INTEGER NOT NULL DEFAULT 0,
    issues INTEGER NOT NULL DEFAULT 0,
    scores TEXT,
    error TEXT,
    triggered_by INTEGER,
    source TEXT NOT NULL DEFAULT 'admin',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );
  CREATE TABLE IF NOT EXISTS seo_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id INTEGER NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    path TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    data TEXT,
    fixed_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_seo_issues_audit ON seo_issues(audit_id, severity);
`);

const KINDS = { full: "Scan complet", technical: "Scan technique", content: "Scan contenu", links: "Scan liens", images: "Scan images", schema: "Scan données structurées" };
const KIND_CATEGORIES = { technical: ["technical", "indexability", "metadata"], content: ["content", "metadata"], links: ["links"], images: ["images"], schema: ["schema"] };
const MAX_PAGES = 400;
const PRIVATE = robots.PRIVATE;
let running = null;

// Lien d'une page → chemin interne (null si externe, ancre, mailto…)
function internalPath(href, hosts) {
  const h = String(href || "").trim();
  if (!h || h.startsWith("#") || /^(mailto|tel|javascript):/i.test(h)) return null;
  try {
    const u = new URL(h, "http://interne.local");
    if (u.host !== "interne.local" && !hosts.includes(u.host)) return null;
    const keepQuery = /^\?page=\d+$/.test(u.search) ? u.search : "";
    let p = decodeURI(u.pathname) + keepQuery;
    if (p.length > 1 && !keepQuery) p = p.replace(/\/+$/, "");
    return p;
  } catch { return null; }
}
const externalUrl = (href) => (/^https?:\/\//i.test(String(href || "")) ? String(href).split("#")[0] : null);
const isPrivate = (p) => PRIVATE.some((x) => p === x.replace(/\/$/, "") || p.startsWith(x.endsWith("/") ? x : `${x}/`)) || /^\/(uploads|css|js|img|fonts)\//.test(p) || /\.(xml|txt|pdf|png|jpe?g|webp|gif|svg|ico|mp4|mp3)$/i.test(p);

// Vérification réelle d'un lien externe : HEAD puis GET, délai 8 s ; « injoignable » n'est jamais compté comme cassé
async function checkExternal(url) {
  const attempt = async (method) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, { method, redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; KOLAKISA-LinkChecker/1)" } });
      return { status: r.status };
    } catch (e) { return { error: e.name === "AbortError" ? "délai dépassé" : "connexion impossible" }; } finally { clearTimeout(timer); }
  };
  let r = await attempt("HEAD");
  if (r.error || r.status === 405 || r.status === 403 || r.status === 501) r = await attempt("GET");
  return r;
}

async function crawl({ host, onProgress }) {
  const hosts = [host, String(process.env.SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "")].filter(Boolean);
  const inventory = entities.list();
  const byPath = new Map(inventory.map((e) => [e.path, e]));
  const queue = [...new Set(["/", ...inventory.map((e) => e.path)])];
  const seen = new Set();
  const pages = new Map();
  // Garde-fou : si le site ne peut pas lire sa propre page d'accueil, l'audit s'arrête (aucun faux problème)
  const first = await inspect("/", { host });
  if (!first.ok || first.status === 0) throw new Error(`le serveur n'a pas pu lire ses propres pages (${first.error || "aucune réponse"}). Vérifiez la variable SITE_URL.`);
  while (queue.length && pages.size < MAX_PAGES) {
    const path = queue.shift();
    if (seen.has(path) || isPrivate(path)) continue;
    seen.add(path);
    const r = await inspect(path, { host });
    pages.set(path, { ...r, entity: byPath.get(path) || null });
    if (pages.size % 10 === 0 && onProgress) onProgress(pages.size);
    if (r.page) for (const l of r.page.allLinks) { const p = internalPath(l.href, hosts); if (p && !seen.has(p) && !isPrivate(p)) queue.push(p); }
  }
  return { pages, hosts, inventory };
}

// Évalue toutes les règles. Renvoie { issues, checks } ; checks[catégorie] = { total, passed } pondérés par gravité
async function evaluate({ pages, hosts }, { kind = "full", req }) {
  const issues = [];
  const checks = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, { total: 0, passed: 0, count: 0, failed: 0 }]));
  const wanted = KIND_CATEGORIES[kind] || Object.keys(CATEGORIES);
  // test : null (sans objet), false/undefined (réussi) ou texte de détail (échec)
  const run = (ruleId, path, result, data = null) => {
    const rule = BY_ID[ruleId];
    if (!wanted.includes(rule.category) || result === null) return;
    const w = SEVERITIES[rule.severity].weight;
    const c = checks[rule.category];
    c.total += w; c.count++;
    if (result) { c.failed++; issues.push({ rule_id: ruleId, category: rule.category, severity: rule.severity, path, detail: String(result).slice(0, 500), data }); } else c.passed += w;
  };
  const map = sitemap.entries();
  const inSitemap = new Set(map.included.map((e) => e.path));
  const blocked = new Set(robots.conflicts(req, [...inSitemap]));
  const ok = [...pages.values()].filter((p) => p.status === 200 && p.page);
  const indexable = ok.filter((p) => !(p.page.robots || "").includes("noindex"));
  const statusOf = (path) => (pages.get(path) ? pages.get(path).status : null);
  const toPath = (url) => internalPath(url, hosts);

  // Doublons de titres et descriptions entre pages indexables
  const groupBy = (key) => { const m = new Map(); for (const p of indexable) { const v = (p.page[key] || "").trim().toLowerCase(); if (v) m.set(v, [...(m.get(v) || []), p.path]); } return m; };
  const titles = groupBy("title");
  const descs = groupBy("description");
  // Graphe des liens internes
  const inbound = new Map();
  const inboundMain = new Map();
  for (const p of ok) for (const l of p.page.allLinks) {
    const t = toPath(l.href);
    if (!t || t === p.path) continue;
    inbound.set(t, (inbound.get(t) || 0) + 1);
    if (l.inMain) inboundMain.set(t, (inboundMain.get(t) || 0) + 1);
  }

  for (const p of pages.values()) {
    const inMap = inSitemap.has(p.path);
    if (inMap) {
      run("sitemap_url_error", p.path, p.status === 200 ? false : `Réponse ${p.status || "aucune"}${p.location ? ` → ${p.location}` : ""}`);
      run("robots_blocks_sitemap", p.path, blocked.has(p.path) ? "Interdite à Googlebot par robots.txt" : false);
    }
    if (p.status !== 200 || !p.page) continue;
    const pg = p.page;
    const noindex = (pg.robots || "").includes("noindex");
    if (inMap) run("noindex_in_sitemap", p.path, noindex ? `robots : ${pg.robots}` : false);
    run("x_robots_noindex", p.path, !noindex && /noindex/i.test(p.xRobots || "") ? `X-Robots-Tag : ${p.xRobots}` : false);
    run("viewport_missing", p.path, pg.viewport ? false : "Aucune balise viewport");
    run("html_lang_missing", p.path, pg.lang ? false : "Attribut lang absent");
    run("slow_response", p.path, p.ms > 1500 ? `${p.ms} ms` : false);
    run("url_format", p.path, /[A-Z]/.test(p.path) || p.path.length > 115 || /\/\//.test(p.path) || /[^a-z0-9\-/?=._~]/i.test(p.path) ? "Majuscules, caractères spéciaux ou adresse très longue" : false);
    run("title_missing", p.path, pg.title ? false : "Aucun titre");
    run("title_multiple", p.path, pg.titleCount > 1 ? `${pg.titleCount} balises <title>` : false);
    // Les pages en noindex ne sont pas concernées par les règles de résultats de recherche
    if (!noindex) {
      run("canonical_missing", p.path, pg.canonical ? false : "Aucune balise canonical");
      if (pg.canonical) {
        const cp = toPath(pg.canonical);
        if (cp && cp !== p.path.replace(/\?.*$/, "") && cp !== p.path) {
          const st = statusOf(cp);
          run("canonical_broken", p.path, st !== null && st !== 200 ? `${pg.canonical} répond ${st}` : false);
          run("canonical_other", p.path, `Canonical : ${pg.canonical}`);
        } else if (!cp) run("canonical_other", p.path, `Canonical externe : ${pg.canonical}`);
      }
      if (pg.title) {
        run("title_duplicate", p.path, (titles.get(pg.title.trim().toLowerCase()) || []).length > 1 ? `Même titre que : ${titles.get(pg.title.trim().toLowerCase()).filter((x) => x !== p.path).join(", ")}` : false);
        run("title_too_long", p.path, pg.title.length > 60 ? `${pg.title.length} caractères` : false);
        run("title_too_short", p.path, pg.title.length < 15 ? `${pg.title.length} caractères` : false);
      }
      run("description_missing", p.path, pg.description ? false : "Aucune méta description");
      if (pg.description) {
        const dup = (descs.get(pg.description.trim().toLowerCase()) || []).filter((x) => x !== p.path);
        run("description_duplicate", p.path, dup.length ? `Même description que : ${dup.join(", ")}` : false);
        run("description_length", p.path, pg.description.length < 70 || pg.description.length > 160 ? `${pg.description.length} caractères` : false);
      }
      const type = p.entity ? p.entity.type : null;
      if (type === "post" || type === "course") run("og_image_missing", p.path, pg.og["og:image"] ? false : "Aucune image de partage");
    }
    const type = p.entity ? p.entity.type : null;
    run("h1_missing", p.path, pg.h1.length ? false : "Aucun H1");
    run("h1_multiple", p.path, pg.h1.length > 1 ? `${pg.h1.length} titres H1` : false);
    let prev = 1;
    let skipped = null;
    for (const h of pg.headings) { if (h.level > prev + 1 && !skipped) skipped = `H${h.level} après H${prev} (« ${h.text.slice(0, 40)} »)`; prev = h.level; }
    run("heading_skip", p.path, skipped || false);
    if (type === "post") {
      run("thin_content", p.path, pg.words < 300 ? `${pg.words} mots dans le contenu principal (article)` : false);
      run("long_without_h2", p.path, pg.words >= 600 && !pg.headings.some((h) => h.level === 2) ? `${pg.words} mots sans H2` : false);
    } else if (type === "course") run("thin_content", p.path, pg.words < 150 ? `${pg.words} mots sur la page de la formation` : false);
    // Données structurées
    run("schema_invalid", p.path, pg.jsonLdError ? "JSON illisible" : false);
    if (!pg.jsonLdError) { const probs = pg.jsonLdProblems.filter((x) => x.level !== "critical" || !/JSON invalide/.test(x.message)); run("schema_problem", p.path, probs.length ? probs.map((x) => x.message).join(" ") : false); }
    // Liens internes cassés / vers une redirection
    const broken = [];
    const toRedirect = [];
    for (const l of pg.links) {
      const t = toPath(l.href);
      if (!t) continue;
      const st = statusOf(t);
      if (st === 404 || st === 410 || (st && st >= 500)) broken.push(`${l.href} (${st})`);
      else if (st === 301 || st === 302) toRedirect.push({ href: l.href, path: t, location: pages.get(t).location });
    }
    run("broken_internal_link", p.path, broken.length ? broken.slice(0, 10).join(", ") : false);
    run("link_to_redirect", p.path, toRedirect.length ? toRedirect.slice(0, 10).map((x) => `${x.href} → ${x.location}`).join(", ") : false, toRedirect.length && type === "post" ? { postId: Number(p.entity.key), links: toRedirect } : null);
    // Images
    // Texte alternatif : attribut absent partout ; dans un article, un alt VIDE est aussi un oubli (l'éditeur n'en crée
    // jamais volontairement : les images d'un article illustrent le propos, elles ne sont pas décoratives)
    let noAlt = pg.images.filter((i) => !i.hasAlt).map((i) => i.src);
    if (type === "post") {
      const row = db.prepare("SELECT content FROM posts WHERE id = ?").get(Number(p.entity.key));
      const empty = [...String(row ? row.content : "").matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((tag) => !/\balt="[^"]+"/i.test(tag)).map((tag) => (tag.match(/src="([^"]+)"/i) || [])[1] || "image");
      noAlt = [...new Set([...noAlt, ...empty])];
    }
    run("image_alt_missing", p.path, pg.images.length ? (noAlt.length ? `${noAlt.length} image(s) : ${noAlt.slice(0, 5).join(", ")}` : false) : null);
    const local = pg.images.map((i) => ({ ...i, path: toPath(i.src) })).filter((i) => i.path && i.path.startsWith("/uploads/"));
    const missingFiles = local.filter((i) => !images.probe(i.path).exists);
    run("image_broken", p.path, local.length ? (missingFiles.length ? missingFiles.slice(0, 5).map((i) => i.path).join(", ") : false) : null);
    const heavy = local.filter((i) => { const pr = images.probe(i.path); return pr.exists && pr.bytes > 400 * 1024; });
    run("image_heavy", p.path, local.length ? (heavy.length ? heavy.map((i) => `${i.path} (${Math.round(images.probe(i.path).bytes / 1024)} Ko)`).slice(0, 5).join(", ") : false) : null);
    const noDims = pg.images.filter((i) => !i.width || !i.height);
    run("image_no_dimensions", p.path, pg.images.length ? (noDims.length ? `${noDims.length} image(s)` : false) : null);
    // Pages orphelines (aucun lien interne entrant) et maillage faible
    if (p.path !== "/" && p.entity && !noindex) {
      run("orphan_page", p.path, (inbound.get(p.path) || 0) === 0 ? "Aucun lien vers cette page depuis les autres pages du site" : false);
      if (type === "post" || type === "course") run("weak_inlinks", p.path, (inboundMain.get(p.path) || 0) <= 1 && (inbound.get(p.path) || 0) > 0 ? `${inboundMain.get(p.path) || 0} lien(s) depuis le contenu des autres pages` : false);
    }
  }

  // Contenus très similaires et cannibalisation : articles et formations indexables
  const contentPages = indexable.filter((p) => p.entity && (p.entity.type === "post" || p.entity.type === "course"));
  const words = new Map(contentPages.map((p) => [p.path, normalizeWords(p.page.text)]));
  const keyword = (p) => {
    if (p.entity.type === "post") { const row = db.prepare("SELECT focus_keyword FROM posts WHERE id = ?").get(Number(p.entity.key)); return row ? (row.focus_keyword || "").trim().toLowerCase() : ""; }
    return (meta.get("course", p.entity.key).focus_keyword || "").trim().toLowerCase();
  };
  for (let i = 0; i < contentPages.length; i++) {
    const a = contentPages[i];
    let dup = null;
    let cannib = null;
    for (let j = 0; j < contentPages.length; j++) {
      if (i === j) continue;
      const b = contentPages[j];
      const wa = words.get(a.path);
      const wb = words.get(b.path);
      if (!dup && wa.length >= 80 && wb.length >= 80) { const s = similarity(wa, wb); if (s >= 0.6) dup = `${Math.round(s * 100)} % de passages communs avec ${b.path}`; }
      const ka = keyword(a);
      const kb = keyword(b);
      if (!cannib && ka && ka === kb) cannib = `Même mot-clé principal « ${ka} » que ${b.path}`;
      if (!cannib) { const t = jaccard(titleTokens(a.page.h1[0] || a.page.title), titleTokens(b.page.h1[0] || b.page.title)); if (t >= 0.7) cannib = `Titre très proche de ${b.path} (${Math.round(t * 100)} % de mots communs)`; }
    }
    run("near_duplicate", a.path, dup || false);
    run("cannibalization", a.path, cannib || false);
  }

  // Liens externes (scan complet et scan liens) : vérifiés pour de vrai, 4 à la fois, 150 adresses au plus
  if (wanted.includes("links")) {
    const ext = new Map();
    for (const p of ok) for (const l of p.page.links) { const u = externalUrl(l.href); if (u && !toPath(u)) ext.set(u, [...(ext.get(u) || []), p.path]); }
    const urls = [...ext.keys()].slice(0, 150);
    const results = new Map();
    for (let i = 0; i < urls.length; i += 4) {
      const batch = urls.slice(i, i + 4);
      const rs = await Promise.all(batch.map(checkExternal));
      batch.forEach((u, k) => results.set(u, rs[k]));
    }
    for (const [u, from] of ext) {
      const r = results.get(u);
      if (!r) continue;
      for (const path of from) {
        run("broken_external_link", path, r.status === 404 || r.status === 410 ? `${u} (${r.status})` : false);
        if (r.error) run("external_unreachable", path, `${u} : ${r.error}`);
      }
    }
  }
  // Site : chaînes de redirections gérées, adresses introuvables visitées par des personnes (30 derniers jours)
  for (const c of redirects.chains().filter((x) => !x.loop && x.id)) run("redirect_chain", c.source, c.path.join(" → "), { redirectId: c.id });
  for (const r of db.prepare("SELECT path, hits_human, last_seen FROM seo_404 WHERE ignored = 0 AND hits_human > 0 AND last_seen >= datetime('now', '-30 days') ORDER BY hits_human DESC LIMIT 50").all()) run("not_found_hits", r.path, `${r.hits_human} visite(s) de personnes, dernière le ${r.last_seen}`);
  return { issues, checks };
}

// Note par catégorie : part du poids des contrôles réussis (critique 10, élevée 5, moyenne 3, faible 1) ; null = aucun contrôle
function scoresOf(checks) {
  const out = {};
  let total = 0;
  let passed = 0;
  for (const [cat, c] of Object.entries(checks)) {
    out[cat] = c.total ? { score: Math.round((100 * c.passed) / c.total), checks: c.count, failed: c.failed } : null;
    total += c.total; passed += c.passed;
  }
  out.overall = total ? { score: Math.round((100 * passed) / total) } : null;
  return out;
}

async function runAudit({ kind = "full", userId = null, req, source = "admin" }) {
  if (running) return { ok: false, error: "Un audit est déjà en cours." };
  if (!KINDS[kind]) return { ok: false, error: "Type de scan inconnu." };
  const id = Number(db.prepare("INSERT INTO seo_audits (kind, triggered_by, source) VALUES (?, ?, ?)").run(kind, userId, source).lastInsertRowid);
  running = id;
  const host = req.get("host");
  const done = (async () => {
    try {
      const site = await crawl({ host, onProgress: (n) => db.prepare("UPDATE seo_audits SET pages = ? WHERE id = ?").run(n, id) });
      const { issues, checks } = await evaluate(site, { kind, req });
      const insert = db.prepare("INSERT INTO seo_issues (audit_id, rule_id, category, severity, path, detail, data) VALUES (?, ?, ?, ?, ?, ?, ?)");
      db.exec("BEGIN");
      for (const i of issues) insert.run(id, i.rule_id, i.category, i.severity, i.path, i.detail, i.data ? JSON.stringify(i.data) : null);
      db.prepare("UPDATE seo_audits SET status = 'done', pages = ?, issues = ?, scores = ?, finished_at = datetime('now') WHERE id = ?").run(site.pages.size, issues.length, JSON.stringify(scoresOf(checks)), id);
      db.exec("COMMIT");
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch { /* aucune transaction ouverte */ }
      console.error("[KOLAKISA] Audit SEO en échec :", error && error.message);
      db.prepare("UPDATE seo_audits SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?").run(String(error && error.message || "Erreur inconnue").slice(0, 300), id);
    } finally { running = null; }
  })();
  return { ok: true, id, done };
}

// Analyse d'une seule page (bouton « Analyser cette page ») : mêmes règles, sans exploration du site
async function analyzePage(path, req) {
  const host = req.get("host");
  const r = await inspect(path, { host });
  const pages = new Map([[path, { ...r, entity: entities.list().find((e) => e.path === path) || null }]]);
  // Les liens internes de la page sont vérifiés (statut réel de chaque cible)
  if (r.page) for (const l of r.page.links) {
    const t = internalPath(l.href, [host]);
    if (t && !pages.has(t) && !isPrivate(t)) { const x = await inspect(t, { host }); pages.set(t, { ...x, entity: null, page: null }); }
  }
  const { issues, checks } = await evaluate({ pages, hosts: [host] }, { kind: "single", req });
  return { status: r.status, error: r.error || null, issues: issues.filter((i) => i.path === path && !["orphan_page", "weak_inlinks", "redirect_chain", "not_found_hits"].includes(i.rule_id)), scores: scoresOf(checks) };
}

const list = (limit = 30) => db.prepare("SELECT a.*, u.username FROM seo_audits a LEFT JOIN users u ON u.id = a.triggered_by ORDER BY a.id DESC LIMIT ?").all(limit).map((a) => ({ ...a, scores: a.scores ? JSON.parse(a.scores) : null }));
const get = (id) => { const a = db.prepare("SELECT * FROM seo_audits WHERE id = ?").get(id); return a ? { ...a, scores: a.scores ? JSON.parse(a.scores) : null } : null; };
const issuesOf = (id, { severity = "", category = "", q = "" } = {}) => {
  const where = ["audit_id = ?"];
  const params = [id];
  if (severity) { where.push("severity = ?"); params.push(severity); }
  if (category) { where.push("category = ?"); params.push(category); }
  if (q) { where.push("(path LIKE ? OR detail LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  const order = "CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END";
  return db.prepare(`SELECT * FROM seo_issues WHERE ${where.join(" AND ")} ORDER BY ${order}, rule_id, path LIMIT 2000`).all(...params).map((i) => ({ ...i, data: i.data ? JSON.parse(i.data) : null }));
};
const latest = () => db.prepare("SELECT id FROM seo_audits WHERE status = 'done' ORDER BY id DESC LIMIT 1").get();

// Corrections automatiques réelles (modifient les données, journalisées)
function fix(issueId, userId) {
  const issue = db.prepare("SELECT * FROM seo_issues WHERE id = ?").get(issueId);
  if (!issue) return { ok: false, error: "Problème introuvable." };
  if (issue.fixed_at) return { ok: false, error: "Déjà corrigé." };
  const data = issue.data ? JSON.parse(issue.data) : null;
  if (issue.rule_id === "redirect_chain" && data && data.redirectId) {
    const r = redirects.fixChain(data.redirectId, userId);
    if (!r.ok) return { ok: false, error: r.errors.join(" ") };
  } else if (issue.rule_id === "link_to_redirect" && data && data.postId) {
    const post = db.prepare("SELECT id, content FROM posts WHERE id = ?").get(data.postId);
    if (!post) return { ok: false, error: "Article introuvable." };
    let content = post.content;
    let n = 0;
    for (const l of data.links) {
      if (!l.location) continue;
      const finalPath = l.location;
      const escaped = l.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`href="${escaped}"`, "g");
      content = content.replace(re, () => { n++; return `href="${finalPath}"`; });
    }
    if (!n) return { ok: false, error: "Lien introuvable dans le contenu enregistré de l'article (déjà modifié ?)." };
    db.prepare("UPDATE posts SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, post.id);
    logChange({ entityType: "post", entityKey: String(post.id), field: "liens internes", before: data.links.map((l) => l.href).join(", "), after: data.links.map((l) => l.location).join(", "), userId, source: "autofix" });
  } else return { ok: false, error: "Aucune correction automatique pour ce problème." };
  db.prepare("UPDATE seo_issues SET fixed_at = datetime('now') WHERE id = ?").run(issueId);
  return { ok: true };
}

module.exports = { runAudit, analyzePage, list, get, issuesOf, latest, fix, KINDS, isRunning: () => running, scoresOf, internalPath, checkExternal };
