// Gestionnaire de redirections : 301 (définitive) ou 302 (temporaire), exécutées par le serveur avant toute page.
// Contrôles à l'enregistrement : adresse source interne et publique, cible valide, pas de boucle. Détection des chaînes
// A → B → C (y compris avec les changements d'adresse automatiques des formations et articles) et correction en A → C.
// Import / export CSV. Compteur d'utilisations réel.
const { db, logChange } = require("./store");
const primarySite = require("../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire

const { sameScope } = require("../services/siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
db.exec(`
  CREATE TABLE IF NOT EXISTS seo_redirects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_path TEXT NOT NULL UNIQUE,
    target TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 301,
    enabled INTEGER NOT NULL DEFAULT 1,
    note TEXT NOT NULL DEFAULT '',
    hits INTEGER NOT NULL DEFAULT 0,
    last_hit_at TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Palier 12 : une redirection peut être propre à un site (domaine propre) ; NULL = tous les sites. Colonne ajoutée sans toucher aux lignes existantes.
try { db.exec("ALTER TABLE seo_redirects ADD COLUMN site_id INTEGER"); } catch (e) { if (!/duplicate column/i.test(e.message)) throw e; }
db.exec("CREATE INDEX IF NOT EXISTS idx_seo_redirects_site ON seo_redirects(site_id)");

// Espaces techniques ou privés : jamais redirigeables (sécurité, connexion, administration, fichiers)
const PROTECTED = ["/__introuvable__", "/formateur", "/marketing", "/connexion", "/inscription", "/deconnexion", "/api", "/uploads", "/css", "/js", "/img", "/fonts", "/webhooks", "/t/", "/u/", "/preferences", "/sante", "/robots.txt", "/sitemap"];
const STATUSES = [301, 302];

// « /Ancienne-Page/?x=1#y » → « /Ancienne-Page » (chemin seul, sans barre finale, décodé)
function normalizePath(input) {
  let p = String(input || "").trim();
  if (/^https?:\/\//i.test(p)) { try { p = new URL(p).pathname; } catch { return null; } }
  p = p.split("#")[0].split("?")[0];
  if (!p.startsWith("/") || p.startsWith("//") || p.length > 300 || /[\s<>"\\]/.test(p)) return null;
  try { p = decodeURI(p); } catch { return null; }
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}
function normalizeTarget(input) {
  const t = String(input || "").trim();
  if (/^https:\/\/[^\s"'<>]{3,500}$/i.test(t)) return t;
  return normalizePath(t);
}
const isProtected = (p) => PROTECTED.some((x) => p === x || p.startsWith(x.endsWith("/") ? x : `${x}/`) || ((x === "/sitemap" || x === "/robots.txt") && p.startsWith(x)));

// R8 lot 6 : une redirection appartient à un site (site_id) ou est COMMUNE (NULL, gérée par l'équipe seulement). Le cache est indexé par « site:adresse » (0 = commune).
// Sur le domaine d'un site : la redirection du site passe avant la commune (qui reste active partout, comme avant) ; sur l'hôte principal : communes seulement.
let cache = null;
const keyOf = (siteId, path) => `${Number.isInteger(siteId) && siteId > 0 ? siteId : 0}:${path}`;
function map() {
  if (cache) return cache;
  cache = new Map(db.prepare("SELECT id, source_path, target, status, site_id FROM seo_redirects WHERE enabled = 1").all().map((r) => [keyOf(r.site_id, r.source_path), r]));
  return cache;
}
// La redirection qui s'applique à cette adresse sur cet hôte (siteId = site du domaine servi, jamais une valeur de la requête)
const lookup = (siteId, path) => { const m = map(); return (Number.isInteger(siteId) && m.get(keyOf(siteId, path))) || m.get(keyOf(null, path)) || null; };
const invalidate = () => { cache = null; };
const cacheInfo = () => ({ entries: cache ? cache.size : 0, loaded: cache !== null });

// Toutes les redirections connues : manuelles + changements d'adresse automatiques (formations, articles)
function graph(siteId = null) {
  const edges = new Map();
  // Redirections manuelles qui s'appliquent à ce périmètre : les communes, puis celles du site (qui passent avant, comme sur le domaine du site)
  for (const r of db.prepare("SELECT source_path, target, id FROM seo_redirects WHERE enabled = 1 AND site_id IS NULL").all()) edges.set(r.source_path, { target: r.target, id: r.id, kind: "manual" });
  if (Number.isInteger(siteId)) {
    for (const r of db.prepare("SELECT source_path, target, id FROM seo_redirects WHERE enabled = 1 AND site_id = ?").all(siteId)) edges.set(r.source_path, { target: r.target, id: r.id, kind: "manual" });
    return edges; // les historiques automatiques (formations, articles, pages) sont ceux du site principal
  }
  for (const r of db.prepare("SELECT h.old_slug, c.slug FROM course_slug_history h JOIN courses c ON c.id = h.course_id").all()) if (!edges.has(`/cours/${r.old_slug}`)) edges.set(`/cours/${r.old_slug}`, { target: `/cours/${r.slug}`, kind: "course" });
  for (const r of db.prepare("SELECT h.old_slug, p.slug FROM post_slug_history h JOIN posts p ON p.id = h.post_id").all()) if (!edges.has(`/blog/${r.old_slug}`)) edges.set(`/blog/${r.old_slug}`, { target: `/blog/${r.slug}`, kind: "post" });
  // Anciennes adresses de pages et de termes (palier 12) : elles mènent à l'adresse courante de la ressource
  try {
    const urls = require("../services/urls");
    for (const r of db.prepare("SELECT h.old_slug, h.resource_type, h.resource_id FROM cms_url_history h").all()) {
      const loc = r.resource_type === "page" ? (() => { const row = db.prepare("SELECT id, slug, site_id FROM mk_landing_pages WHERE id = ?").get(r.resource_id); return row ? urls.pagePath(row, { hostSite: null }) : null; })()
        : (() => { const tx = require("../services/taxonomy"); const t = tx.get(r.resource_id); return t ? tx.urlOf(t) : null; })();
      const from = r.resource_type === "page" ? `/p/${r.old_slug}` : `${require("../services/taxonomy").baseOf(r.resource_type)}/${r.old_slug}`;
      if (loc && loc !== from && !edges.has(from)) edges.set(from, { target: loc, kind: "history" });
    }
  } catch (e) { if (!/no such table/i.test(e.message)) throw e; }
  return edges;
}

// Suit une adresse de redirection en redirection ; renvoie le chemin parcouru et s'il boucle
function follow(start, edges = graph(), extra = null) {
  const pathSeen = [start];
  let cur = start;
  for (let i = 0; i < 20; i++) {
    const e = extra && extra.source === cur ? { target: extra.target } : edges.get(cur);
    if (!e) return { path: pathSeen, loop: false };
    if (/^https:\/\//i.test(e.target)) return { path: [...pathSeen, e.target], loop: false };
    if (pathSeen.includes(e.target)) return { path: [...pathSeen, e.target], loop: true };
    pathSeen.push(e.target);
    cur = e.target;
  }
  return { path: pathSeen, loop: true };
}

function validate({ source, target, status, siteId }, { exceptId = null } = {}) {
  const errors = [];
  const src = normalizePath(source);
  const dst = normalizeTarget(target);
  const st = Number(status) || 301;
  if (!src) errors.push("Adresse source invalide : un chemin du site, par exemple /ancienne-page.");
  else if (src === "/") errors.push("La page d'accueil ne peut pas être redirigée.");
  else if (isProtected(src)) errors.push(`« ${src} » est un espace technique ou privé du site : il ne peut pas être redirigé.`);
  if (!dst) errors.push("Destination invalide : un chemin du site (/nouvelle-page) ou une adresse complète en https://.");
  if (!STATUSES.includes(st)) errors.push("Type de redirection invalide (301 ou 302).");
  if (src && dst && src === dst) errors.push("La source et la destination sont identiques.");
  let site = null;
  if (siteId !== undefined && siteId !== null && siteId !== "") {
    site = Number(siteId);
    if (!Number.isInteger(site) || !db.prepare(`SELECT 1 FROM mk_sites WHERE id = ?${primarySite.excludeSql(db)}`).get(site)) { errors.push("Site introuvable."); site = null; }
  }
  if (src && !errors.length) {
    // L'ancienne adresse n'est unique que PAR site (une redirection commune et celle d'un site peuvent coexister : celle du site passe avant sur son domaine)
    const other = db.prepare(`SELECT id FROM seo_redirects WHERE source_path = ? AND ${sameScope("site_id")}`).get(src, site);
    if (other && other.id !== exceptId) errors.push(`Une redirection existe déjà pour « ${src} »${site ? " sur ce site" : ""}.`);
  }
  if (src && dst && !errors.length) {
    const edges = graph(site);
    if (exceptId) for (const [k, v] of edges) if (v.id === exceptId) edges.delete(k);
    const f = follow(src, edges, { source: src, target: dst });
    if (f.loop) errors.push(`Boucle de redirection : ${f.path.join(" → ")}. Elle rendrait ces pages inaccessibles.`);
  }
  return { errors, value: { source_path: src, target: dst, status: st, site_id: site } };
}

function list({ q = "" } = {}) {
  const like = `%${String(q).trim()}%`;
  return db.prepare("SELECT r.*, u.username FROM seo_redirects r LEFT JOIN users u ON u.id = r.created_by WHERE source_path LIKE ? OR target LIKE ? ORDER BY r.id DESC").all(like, like);
}
const get = (id) => db.prepare("SELECT * FROM seo_redirects WHERE id = ?").get(id);

// Liste du gestionnaire du CMS : recherche, filtres (type, état, site), tri et pagination dans la base
const SORTS = { recent: "r.id DESC", source: "r.source_path COLLATE NOCASE ASC", visites: "r.hits DESC, r.id DESC", derniere: "COALESCE(r.last_hit_at, '') DESC, r.id DESC" };
function query({ q = "", status = "", state = "", site = "", sort = "recent", page = 1, perPage = 25, siteIds = null } = {}) {
  const where = [];
  const args = [];
  const needle = String(q).trim().slice(0, 100);
  if (needle) { const like = `%${needle.replace(/[\\%_]/g, (c) => `\\${c}`)}%`; where.push("(r.source_path LIKE ? ESCAPE '\\' OR r.target LIKE ? ESCAPE '\\' OR r.note LIKE ? ESCAPE '\\')"); args.push(like, like, like); }
  if (STATUSES.includes(Number(status))) { where.push("r.status = ?"); args.push(Number(status)); }
  if (state === "active") where.push("r.enabled = 1"); else if (state === "inactive") where.push("r.enabled = 0");
  if (site === "none") where.push("r.site_id IS NULL"); else if (/^\d+$/.test(String(site))) { where.push("r.site_id = ?"); args.push(Number(site)); }
  // Un compte limité à certains sites ne voit que les redirections de ces sites et celles de tous les sites
  if (siteIds) where.push(`(r.site_id IS NULL OR r.site_id IN (${siteIds.length ? siteIds.map(() => "?").join(",") : "NULL"}))`), args.push(...siteIds);
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = db.prepare(`SELECT COUNT(*) n FROM seo_redirects r ${W}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pg = Math.min(Math.max(1, Number(page) || 1), pages);
  const sel = (join) => `SELECT r.*, u.username, ${join ? "s.name" : "NULL"} AS site_name FROM seo_redirects r LEFT JOIN users u ON u.id = r.created_by ${join ? "LEFT JOIN mk_sites s ON s.id = r.site_id" : ""} ${W} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`;
  let rows;
  try { rows = db.prepare(sel(true)).all(...args, perPage, (pg - 1) * perPage); } catch (e) { if (!/no such table/i.test(e.message)) throw e; rows = db.prepare(sel(false)).all(...args, perPage, (pg - 1) * perPage); }
  return { rows, total, page: pg, pages };
}
const isExternal = (target) => /^https:\/\//i.test(String(target || ""));

function create(input, userId, { source = "admin" } = {}) {
  const { errors, value } = validate(input);
  if (errors.length) return { ok: false, errors };
  const info = db.prepare("INSERT INTO seo_redirects (source_path, target, status, note, created_by, site_id) VALUES (?, ?, ?, ?, ?, ?)")
    .run(value.source_path, value.target, value.status, String(input.note || "").slice(0, 200), userId ?? null, value.site_id);
  logChange({ entityType: "redirect", entityKey: String(info.lastInsertRowid), field: "redirect", before: null, after: `${value.source_path} → ${value.target} (${value.status})`, userId, source, siteId: value.site_id });
  invalidate();
  return { ok: true, id: Number(info.lastInsertRowid) };
}

function update(id, input, userId) {
  const before = get(id);
  if (!before) return { ok: false, errors: ["Redirection introuvable."] };
  const { errors, value } = validate(input.siteId === undefined ? { ...input, siteId: before.site_id } : input, { exceptId: before.id });
  if (errors.length) return { ok: false, errors };
  const enabled = input.enabled === undefined ? before.enabled : (input.enabled === "1" || input.enabled === true ? 1 : 0);
  const siteId = input.siteId === undefined ? before.site_id : value.site_id;
  db.prepare("UPDATE seo_redirects SET source_path = ?, target = ?, status = ?, enabled = ?, note = ?, site_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(value.source_path, value.target, value.status, enabled, String(input.note ?? before.note).slice(0, 200), siteId, id);
  logChange({ entityType: "redirect", entityKey: String(id), field: "redirect", before: `${before.source_path} → ${before.target} (${before.status})${before.enabled ? "" : " [désactivée]"}`, after: `${value.source_path} → ${value.target} (${value.status})${enabled ? "" : " [désactivée]"}`, userId, siteId });
  invalidate();
  return { ok: true };
}

function remove(id, userId) {
  const before = get(id);
  if (!before) return false;
  db.prepare("DELETE FROM seo_redirects WHERE id = ?").run(id);
  logChange({ entityType: "redirect", entityKey: String(id), field: "redirect", before: `${before.source_path} → ${before.target} (${before.status})`, after: null, userId, siteId: before.site_id });
  invalidate();
  return true;
}

// Chaînes : une adresse qui mène à une autre redirection. Correction : pointer directement vers la destination finale.
function chains() {
  const edges = graph();
  const out = [];
  for (const [src, e] of edges) {
    const f = follow(src, edges);
    if (f.loop) out.push({ source: src, path: f.path, loop: true, id: e.id || null, kind: e.kind });
    else if (f.path.length > 2) out.push({ source: src, path: f.path, loop: false, final: f.path[f.path.length - 1], id: e.id || null, kind: e.kind });
  }
  return out;
}
function fixChain(id, userId) {
  const r = get(id);
  if (!r) return { ok: false, errors: ["Redirection introuvable."] };
  const f = follow(r.source_path);
  if (f.loop || f.path.length <= 2) return { ok: false, errors: ["Cette redirection ne fait pas partie d'une chaîne corrigeable."] };
  return update(id, { source: r.source_path, target: f.path[f.path.length - 1], status: r.status, note: r.note }, userId);
}

// Exécution : appelée pour chaque requête GET/HEAD avant les pages du site
function middleware(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const m = map();
  if (!m.size) return next();
  const p = normalizePath(req.path);
  // Le site est celui du DOMAINE servi (vérifié par le serveur, req.kwSite) : une redirection propre à un site ne s'applique que sur son domaine ; aucune valeur de la requête n'intervient
  const r = p && lookup(req.kwSite ? req.kwSite.id : null, p);
  if (!r) return next();
  if (!require("./probe").isProbe(req)) db.prepare("UPDATE seo_redirects SET hits = hits + 1, last_hit_at = datetime('now') WHERE id = ?").run(r.id);
  const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  const target = /^https:\/\//i.test(r.target) || r.target.includes("?") ? r.target : `${encodeURI(r.target)}${query}`;
  res.redirect(r.status, target);
}

// CSV : source,destination,type,note — séparateur virgule ou point-virgule, guillemets acceptés
function parseCsv(text) {
  const rows = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const sep = line.includes(";") && !line.includes(",") ? ";" : ",";
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted; } else if (ch === sep && !quoted) { cells.push(cur.trim()); cur = ""; } else cur += ch;
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  if (rows.length && /^(source|ancienne)/i.test(rows[0][0] || "")) rows.shift();
  return rows;
}
// ---------------------------------------------------------------------------------------------------------------------------------------------
// R8 lot 6 — Redirections d'UN site (administrateur de site). Le site vient de l'appelant (adresse vérifiée), jamais de la saisie : un « siteId » envoyé dans les données est ignoré.
// Une redirection commune (NULL) ou celle d'un autre site est introuvable pour lui : ni lecture, ni modification, ni suppression.
const ownSite = (siteId) => { if (!Number.isInteger(siteId) || siteId <= 0) throw new Error("Redirections d'un site : site non vérifié."); return siteId; };
const getForSite = (siteId, id) => { const r = get(id); return r && r.site_id === ownSite(siteId) ? r : null; };
const queryForSite = (siteId, opts = {}) => query({ ...opts, site: String(ownSite(siteId)), siteIds: null });
const createForSite = (siteId, input, userId, opts) => create({ ...input, siteId: ownSite(siteId) }, userId, opts);
function updateForSite(siteId, id, input, userId) {
  if (!getForSite(siteId, id)) return { ok: false, errors: ["Redirection introuvable."] };
  return update(id, { ...input, siteId: ownSite(siteId) }, userId);
}
function removeForSite(siteId, id, userId) { return getForSite(siteId, id) ? remove(id, userId) : false; }
function importCsvForSite(siteId, text, userId) {
  ownSite(siteId);
  const report = { created: 0, errors: [] };
  parseCsv(text).slice(0, 2000).forEach((cells, i) => {
    const r = create({ source: cells[0], target: cells[1], status: cells[2] || 301, note: cells[3] || "Import CSV", siteId }, userId, { source: "import" });
    if (r.ok) report.created++; else report.errors.push(`Ligne ${i + 1} (${cells[0] || "?"}) : ${r.errors.join(" ")}`);
  });
  return report;
}
function exportCsvForSite(siteId) {
  const rows = db.prepare("SELECT source_path, target, status, note, enabled, hits, last_hit_at FROM seo_redirects WHERE site_id = ? ORDER BY source_path").all(ownSite(siteId));
  return ["source,destination,type,note,active,utilisations,derniere_utilisation", ...rows.map((r) => [r.source_path, r.target, r.status, r.note, r.enabled ? "oui" : "non", r.hits, r.last_hit_at || ""].map(csvCell).join(","))].join("\n") + "\n";
}

function importCsv(text, userId) {
  const rows = parseCsv(text).slice(0, 2000);
  const report = { created: 0, errors: [] };
  rows.forEach((cells, i) => {
    const r = create({ source: cells[0], target: cells[1], status: cells[2] || 301, note: cells[3] || "Import CSV" }, userId, { source: "import" });
    if (r.ok) report.created++; else report.errors.push(`Ligne ${i + 1} (${cells[0] || "?"}) : ${r.errors.join(" ")}`);
  });
  return report;
}
const csvCell = (v) => (/[",;\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
function exportCsv() {
  const rows = db.prepare("SELECT source_path, target, status, note, enabled, hits, last_hit_at FROM seo_redirects ORDER BY source_path").all();
  return ["source,destination,type,note,active,utilisations,derniere_utilisation", ...rows.map((r) => [r.source_path, r.target, r.status, r.note, r.enabled ? "oui" : "non", r.hits, r.last_hit_at || ""].map(csvCell).join(","))].join("\n") + "\n";
}

module.exports = { cacheInfo, lookup, getForSite, queryForSite, createForSite, updateForSite, removeForSite, importCsvForSite, exportCsvForSite, query, SORTS, isExternal, STATUSES, list, get, create, update, remove, chains, fixChain, middleware, importCsv, exportCsv, normalizePath, graph, follow, validate, invalidate };
