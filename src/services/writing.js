// KOLAKISA CMS → Réglages d'écriture : valeurs par défaut de rédaction et notifications de publication, PAR SITE (principal = « main »).
//  - catégorie par défaut : appliquée à un NOUVEL article seulement quand l'auteur n'en a choisi aucune ; jamais rétroactive ;
//    une catégorie supprimée ou d'un autre site est ignorée (l'article reste sans catégorie, comme avant) ;
//  - notifications de publication (ping XML-RPC « weblogUpdates.ping ») : liste d'adresses https validée, envoyée en arrière-plan, UNE fois par article
//    et par destination (première publication seulement, jamais à chaque enregistrement), délai d'attente court, trois essais au plus, journal consultable.
//    Une destination est refusée si elle résout vers une adresse privée (SSRF). L'échec n'empêche jamais la publication.
// Stockage : mk_settings (clés « writing.<main|site_N>.<champ> »), comme l'e-mailing par site ; journal : cms_ping_log.
const dns = require("node:dns").promises;
const net = require("node:net");
const db = require("../config/database");

db.exec(`
  CREATE TABLE IF NOT EXISTS cms_ping_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    site_id INTEGER,                         -- NULL = site principal
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',   -- queued | sent | failed | skipped
    attempts INTEGER NOT NULL DEFAULT 0,
    http_status INTEGER,
    error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (post_id, url)
  );
  CREATE INDEX IF NOT EXISTS idx_cms_ping_log_status ON cms_ping_log(status, updated_at);
`);

const MAX_URLS = 5, MAX_ATTEMPTS = 3, TIMEOUT_MS = 8000, WINDOW_DAYS = 7;
// Délais entre deux essais (secondes) ; WRITING_PING_BACKOFF le règle (tests, hébergement particulier)
const BACKOFF_SEC = /^\d+(,\d+)*$/.test(process.env.WRITING_PING_BACKOFF || "") ? process.env.WRITING_PING_BACKOFF.split(",").map(Number) : [0, 120, 900];
const scopeKey = (siteId) => (siteId ? `site_${Number(siteId)}` : "main");
const orgId = (ctx) => (ctx && ctx.organizationId) || (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
const key = (siteId, field) => `writing.${scopeKey(siteId)}.${field}`;
function read(siteId, field, ctx) {
  const org = orgId(ctx);
  const r = org ? db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(org, key(siteId, field)) : null;
  return r ? r.value : "";
}
function write(siteId, field, value, ctx) {
  const org = orgId(ctx);
  if (!org) throw new Error("Aucune organisation.");
  if (value === "" || value === null || value === undefined) db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?").run(org, key(siteId, field));
  else db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(org, key(siteId, field), String(value));
}

// ---------- Catégorie par défaut ----------
const siteOfTerm = (id) => { const r = db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?").get(id); return r ? r.site_id : null; };
// Identifiant de la catégorie par défaut d'un site, ou null si aucune n'est réglée OU si elle n'est plus utilisable (supprimée, autre site)
function defaultCategoryId(siteId = null, ctx = null) {
  const id = Number(read(siteId, "default_category", ctx));
  if (!Number.isInteger(id) || id < 1) return null;
  const t = db.prepare("SELECT id, taxonomy FROM taxonomy_terms WHERE id = ?").get(id);
  if (!t || t.taxonomy !== "category" || (siteOfTerm(id) ?? null) !== (siteId ?? null)) return null;
  return id;
}
const setDefaultCategory = (siteId, value, ctx) => write(siteId, "default_category", value ? String(Number(value)) : "", ctx);
// Catégories proposées pour un site (arbre, avec profondeur)
function categoryChoices(siteId = null) {
  const sc = require("./siteContent");
  return require("./taxonomy").tree("category", sc.scopeForSite("term", "t.id", siteId ? Number(siteId) : 0)).map((t) => [String(t.id), `${"— ".repeat(t.depth)}${t.name}`]);
}
// Nouvel article sans aucune catégorie : applique la catégorie par défaut de SON site. Les catégories déjà choisies ne sont jamais touchées.
function applyDefaults(postId, ctx = null) {
  const sc = require("./siteContent");
  const site = sc.siteOf(db, "post", Number(postId));
  if (site === undefined) return false;
  const id = defaultCategoryId(site, ctx);
  if (!id) return false;
  const taxonomy = require("./taxonomy");
  if (taxonomy.termsOf("post", Number(postId)).categories.length) return false;
  taxonomy.setTerms("post", Number(postId), { categoryIds: [id], primaryId: id });
  return true;
}

// ---------- Notifications de publication ----------
// Liste d'adresses : https, sans identifiants, sans adresse IP littérale privée ; dédoublonnée ; au plus MAX_URLS
const PRIVATE_V4 = /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|192\.0\.0\.|198\.1[89]\.|2(2[4-9]|[3-5]\d)\.)/;
function privateAddress(ip) {
  const v = String(ip).toLowerCase().replace(/^::ffff:/, "");
  if (net.isIPv4(v)) return PRIVATE_V4.test(v);
  if (net.isIPv6(v)) return v === "::1" || v === "::" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  return true;
}
function parseUrls(raw) {
  const parts = String(raw ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const urls = [], errors = [];
  for (const p of parts) {
    let u;
    try { u = new URL(p); } catch { errors.push(`« ${p.slice(0, 60)} » n'est pas une adresse valide.`); continue; }
    if (u.protocol !== "https:") { errors.push(`« ${p.slice(0, 60)} » : seules les adresses https:// sont acceptées.`); continue; }
    if (u.username || u.password) { errors.push(`« ${p.slice(0, 60)} » : les identifiants dans l'adresse sont refusés.`); continue; }
    if (net.isIP(u.hostname.replace(/^\[|\]$/g, "")) && privateAddress(u.hostname.replace(/^\[|\]$/g, ""))) { errors.push(`« ${p.slice(0, 60)} » : adresse privée refusée.`); continue; }
    if (!/\./.test(u.hostname) && !net.isIP(u.hostname.replace(/^\[|\]$/g, ""))) { errors.push(`« ${p.slice(0, 60)} » : nom de domaine attendu.`); continue; }
    if (p.length > 200) { errors.push(`« ${p.slice(0, 60)}… » : 200 caractères au plus.`); continue; }
    if (!urls.includes(u.href)) urls.push(u.href);
  }
  if (urls.length > MAX_URLS) errors.push(`${MAX_URLS} destinations au plus.`);
  return { urls: urls.slice(0, MAX_URLS), errors };
}
const getPing = (siteId = null, ctx = null) => ({ enabled: read(siteId, "ping_enabled", ctx) === "1", urls: read(siteId, "ping_urls", ctx).split("\n").filter(Boolean), enabledAt: read(siteId, "ping_enabled_at", ctx) });
function setPingEnabled(siteId, on, ctx) {
  const was = read(siteId, "ping_enabled", ctx) === "1";
  write(siteId, "ping_enabled", on ? "1" : "", ctx);
  // Les articles publiés AVANT l'activation ne sont jamais notifiés après coup
  if (on && !was) write(siteId, "ping_enabled_at", new Date().toISOString().slice(0, 19).replace("T", " "), ctx);
  if (!on) write(siteId, "ping_enabled_at", "", ctx);
}
const setPingUrls = (siteId, urls, ctx) => write(siteId, "ping_urls", urls.join("\n"), ctx);

function siteUrlOf(siteId) {
  let origin = "";
  try { origin = new URL(process.env.SITE_URL).origin; } catch { return ""; }
  if (!siteId) return origin;
  const info = require("./urls").siteInfo(siteId);
  return info && info.base ? `${origin}${info.base}` : origin;
}
const siteNameOf = (siteId) => {
  if (siteId) { const r = db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(siteId); return (r && r.name) || "Site"; }
  try { return require("../seo/settings").get("site_name") || "KOLAKISA"; } catch { return "KOLAKISA"; }
};
const xml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
const body = (name, url) => `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value><string>${xml(name)}</string></value></param><param><value><string>${xml(url)}</string></value></param></params></methodCall>`;

async function checkHost(url) {
  if (process.env.NODE_ENV === "test" && process.env.WRITING_PING_ALLOW_PRIVATE === "1") return;
  const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new Error("destination refusée : adresse privée ou introuvable");
}
async function send(row) {
  const siteUrl = siteUrlOf(row.site_id);
  if (!siteUrl) return { status: "skipped", error: "adresse publique du site (SITE_URL) non définie" };
  await checkHost(row.url);
  const res = await fetch(row.url, { method: "POST", redirect: "manual", headers: { "Content-Type": "text/xml", "User-Agent": "Kolakisa-Ping/1.0" }, body: body(siteNameOf(row.site_id), siteUrl), signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = (await res.text().catch(() => "")).slice(0, 4000);
  if (res.status >= 300) return { status: "failed", http: res.status, error: `réponse HTTP ${res.status}` };
  if (/<name>flerror<\/name>\s*<value>\s*<boolean>1<\/boolean>/i.test(text)) return { status: "failed", http: res.status, error: "le service a signalé une erreur" };
  return { status: "sent", http: res.status };
}

// File : crée les lignes des articles NOUVELLEMENT publiés (première publication, dans la fenêtre, après l'activation), puis traite ce qui est à faire.
const sitesWithPing = () => db.prepare("SELECT DISTINCT key FROM mk_settings WHERE key LIKE 'writing.%.ping_enabled' AND value = '1'").all().map((r) => { const m = /^writing\.(main|site_(\d+))\.ping_enabled$/.exec(r.key); return m ? (m[2] ? Number(m[2]) : null) : undefined; }).filter((v) => v !== undefined);
function enqueue() {
  let n = 0;
  for (const siteId of sitesWithPing()) {
    const cfg = getPing(siteId);
    if (!cfg.urls.length || !cfg.enabledAt) continue;
    const posts = db.prepare(`SELECT p.id FROM posts p WHERE p.status = 'published' AND p.deleted_at IS NULL AND p.published_at IS NOT NULL AND p.published_at >= ? AND p.published_at <= datetime('now') AND p.published_at >= datetime('now', ?)
      AND ${siteId ? "EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = p.id AND cs.site_id = ?)" : "NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = p.id)"}`)
      .all(cfg.enabledAt, `-${WINDOW_DAYS} days`, ...(siteId ? [siteId] : []));
    for (const p of posts) for (const url of cfg.urls) n += db.prepare("INSERT OR IGNORE INTO cms_ping_log (post_id, site_id, url) VALUES (?, ?, ?)").run(p.id, siteId, url).changes;
  }
  return n;
}
let running = false;
async function process_() {
  if (running) return 0;
  running = true;
  let done = 0;
  try {
    const rows = db.prepare("SELECT * FROM cms_ping_log WHERE status IN ('queued', 'failed') AND attempts < ? ORDER BY id LIMIT 20").all(MAX_ATTEMPTS);
    for (const row of rows) {
      const wait = BACKOFF_SEC[Math.min(row.attempts, BACKOFF_SEC.length - 1)];
      if (row.attempts > 0 && db.prepare("SELECT (strftime('%s','now') - strftime('%s', ?)) AS s").get(row.updated_at).s < wait) continue;
      // Le site a pu désactiver ou retirer la destination entre-temps : rien n'est envoyé hors configuration
      const cfg = getPing(row.site_id);
      if (!cfg.enabled || !cfg.urls.includes(row.url)) { db.prepare("UPDATE cms_ping_log SET status = 'skipped', error = 'destination retirée ou notifications désactivées', updated_at = datetime('now') WHERE id = ?").run(row.id); continue; }
      let r;
      try { r = await send(row); } catch (e) { r = { status: "failed", error: String((e && e.name === "TimeoutError" ? "délai dépassé" : e && e.message) || "erreur").slice(0, 200) }; }
      const attempts = row.attempts + (r.status === "skipped" ? 0 : 1);
      db.prepare("UPDATE cms_ping_log SET status = ?, attempts = ?, http_status = ?, error = ?, updated_at = datetime('now') WHERE id = ?").run(r.status, attempts, r.http ?? null, r.error || "", row.id);
      done++;
    }
  } finally { running = false; }
  return done;
}
const sweep = async () => { try { enqueue(); return await process_(); } catch (e) { console.error("[écriture] notifications :", e.message); return 0; } };
const sweepSoon = () => { if (sitesWithPing().length) setImmediate(sweep).unref?.(); };
let timer = null;
const start = (everyMs = Number(process.env.WRITING_PING_EVERY_MS) || 60000) => { if (timer) return; timer = setInterval(sweep, everyMs); timer.unref?.(); };
const log = (siteId, limit = 30) => db.prepare(`SELECT l.*, p.title FROM cms_ping_log l LEFT JOIN posts p ON p.id = l.post_id WHERE ${siteId ? "l.site_id = ?" : "l.site_id IS NULL"} ORDER BY l.id DESC LIMIT ?`).all(...(siteId ? [siteId] : []), limit);

module.exports = { defaultCategoryId, setDefaultCategory, categoryChoices, applyDefaults, parseUrls, privateAddress, getPing, setPingEnabled, setPingUrls, sweep, sweepSoon, start, log, MAX_URLS, MAX_ATTEMPTS };
