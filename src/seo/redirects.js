// Gestionnaire de redirections : 301 (définitive) ou 302 (temporaire), exécutées par le serveur avant toute page.
// Contrôles à l'enregistrement : adresse source interne et publique, cible valide, pas de boucle. Détection des chaînes
// A → B → C (y compris avec les changements d'adresse automatiques des formations et articles) et correction en A → C.
// Import / export CSV. Compteur d'utilisations réel.
const { db, logChange } = require("./store");

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

// Espaces techniques ou privés : jamais redirigeables (sécurité, connexion, administration, fichiers)
const PROTECTED = ["/formateur", "/marketing", "/connexion", "/inscription", "/deconnexion", "/api", "/uploads", "/css", "/js", "/img", "/fonts", "/webhooks", "/t/", "/u/", "/preferences", "/sante", "/robots.txt", "/sitemap"];
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

let cache = null;
function map() {
  if (cache) return cache;
  cache = new Map(db.prepare("SELECT id, source_path, target, status FROM seo_redirects WHERE enabled = 1").all().map((r) => [r.source_path, r]));
  return cache;
}
const invalidate = () => { cache = null; };

// Toutes les redirections connues : manuelles + changements d'adresse automatiques (formations, articles)
function graph() {
  const edges = new Map();
  for (const r of db.prepare("SELECT source_path, target, id FROM seo_redirects WHERE enabled = 1").all()) edges.set(r.source_path, { target: r.target, id: r.id, kind: "manual" });
  for (const r of db.prepare("SELECT h.old_slug, c.slug FROM course_slug_history h JOIN courses c ON c.id = h.course_id").all()) if (!edges.has(`/cours/${r.old_slug}`)) edges.set(`/cours/${r.old_slug}`, { target: `/cours/${r.slug}`, kind: "course" });
  for (const r of db.prepare("SELECT h.old_slug, p.slug FROM post_slug_history h JOIN posts p ON p.id = h.post_id").all()) if (!edges.has(`/blog/${r.old_slug}`)) edges.set(`/blog/${r.old_slug}`, { target: `/blog/${r.slug}`, kind: "post" });
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

function validate({ source, target, status }, { exceptId = null } = {}) {
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
  if (src && !errors.length) {
    const other = db.prepare("SELECT id FROM seo_redirects WHERE source_path = ?").get(src);
    if (other && other.id !== exceptId) errors.push(`Une redirection existe déjà pour « ${src} ».`);
  }
  if (src && dst && !errors.length) {
    const edges = graph();
    if (exceptId) for (const [k, v] of edges) if (v.id === exceptId) edges.delete(k);
    const f = follow(src, edges, { source: src, target: dst });
    if (f.loop) errors.push(`Boucle de redirection : ${f.path.join(" → ")}. Elle rendrait ces pages inaccessibles.`);
  }
  return { errors, value: { source_path: src, target: dst, status: st } };
}

function list({ q = "" } = {}) {
  const like = `%${String(q).trim()}%`;
  return db.prepare("SELECT r.*, u.username FROM seo_redirects r LEFT JOIN users u ON u.id = r.created_by WHERE source_path LIKE ? OR target LIKE ? ORDER BY r.id DESC").all(like, like);
}
const get = (id) => db.prepare("SELECT * FROM seo_redirects WHERE id = ?").get(id);

function create(input, userId, { source = "admin" } = {}) {
  const { errors, value } = validate(input);
  if (errors.length) return { ok: false, errors };
  const info = db.prepare("INSERT INTO seo_redirects (source_path, target, status, note, created_by) VALUES (?, ?, ?, ?, ?)")
    .run(value.source_path, value.target, value.status, String(input.note || "").slice(0, 200), userId ?? null);
  logChange({ entityType: "redirect", entityKey: String(info.lastInsertRowid), field: "redirect", before: null, after: `${value.source_path} → ${value.target} (${value.status})`, userId, source });
  invalidate();
  return { ok: true, id: Number(info.lastInsertRowid) };
}

function update(id, input, userId) {
  const before = get(id);
  if (!before) return { ok: false, errors: ["Redirection introuvable."] };
  const { errors, value } = validate(input, { exceptId: before.id });
  if (errors.length) return { ok: false, errors };
  const enabled = input.enabled === undefined ? before.enabled : (input.enabled === "1" || input.enabled === true ? 1 : 0);
  db.prepare("UPDATE seo_redirects SET source_path = ?, target = ?, status = ?, enabled = ?, note = ?, updated_at = datetime('now') WHERE id = ?")
    .run(value.source_path, value.target, value.status, enabled, String(input.note ?? before.note).slice(0, 200), id);
  logChange({ entityType: "redirect", entityKey: String(id), field: "redirect", before: `${before.source_path} → ${before.target} (${before.status})${before.enabled ? "" : " [désactivée]"}`, after: `${value.source_path} → ${value.target} (${value.status})${enabled ? "" : " [désactivée]"}`, userId });
  invalidate();
  return { ok: true };
}

function remove(id, userId) {
  const before = get(id);
  if (!before) return false;
  db.prepare("DELETE FROM seo_redirects WHERE id = ?").run(id);
  logChange({ entityType: "redirect", entityKey: String(id), field: "redirect", before: `${before.source_path} → ${before.target} (${before.status})`, after: null, userId });
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
  const r = p && m.get(p);
  if (!r) return next();
  db.prepare("UPDATE seo_redirects SET hits = hits + 1, last_hit_at = datetime('now') WHERE id = ?").run(r.id);
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

module.exports = { list, get, create, update, remove, chains, fixChain, middleware, importCsv, exportCsv, normalizePath, graph, follow, validate, invalidate };
