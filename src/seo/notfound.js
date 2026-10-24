// Journal des erreurs 404 : chaque adresse introuvable demandée (GET), avec nombre de visites humaines et de robots,
// première et dernière fois, dernière page d'origine (referrer) et dernier navigateur. Aucune adresse IP n'est conservée.
// Volume borné : 5 000 adresses au plus (les plus anciennes et les moins vues sont retirées).
const { db, siteSchemaReady } = require("./store");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_404 (
    path TEXT PRIMARY KEY,
    hits_human INTEGER NOT NULL DEFAULT 0,
    hits_bot INTEGER NOT NULL DEFAULT 0,
    first_seen TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    last_referrer TEXT,
    last_user_agent TEXT,
    ignored INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_seo_404_last ON seo_404(last_seen);
`);

const MAX_ROWS = 5000;
const MAX_ROWS_PER_SITE = 1500; // protection contre les abus : un site qui reçoit un flot d'adresses inventées ne peut pas évincer le journal des autres sites
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link|whatsapp|telegrambot|python-requests|curl|wget|httpclient|headless|lighthouse|monitor|scan/i;
// Fichiers que les robots réclament sans cesse (aucun intérêt à les journaliser)
const NOISE = /^\/(wp-|xmlrpc|\.env|\.git|apple-touch-icon|favicon|ads\.txt|\.well-known)/i;
let writes = 0;

function record(req) {
  if (require("./probe").isProbe(req)) return; // sonde interne (test de redirection, liens cassés) : jamais comptée
  const path = String(req.originalUrl || req.url || "").split("?")[0].slice(0, 300); // adresse demandée (avant toute réécriture interne)
  if (!path.startsWith("/") || NOISE.test(path)) return;
  const ua = String(req.get("user-agent") || "").slice(0, 300);
  const ref = String(req.get("referer") || "").slice(0, 300) || null;
  const bot = !ua || BOT.test(ua);
  // R8 lot 6 : l'adresse introuvable est rattachée au SITE du domaine servi (req.kwSite, vérifié par le serveur) ; NULL = hôte principal. Deux sites peuvent avoir la même adresse introuvable.
  const siteId = req.kwSite ? req.kwSite.id : null;
  if (siteSchemaReady()) {
    db.prepare(`INSERT INTO seo_404 (path, site_id, hits_human, hits_bot, last_referrer, last_user_agent) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(COALESCE(site_id, 0), path) DO UPDATE SET hits_human = hits_human + excluded.hits_human, hits_bot = hits_bot + excluded.hits_bot, last_seen = datetime('now'),
        last_referrer = COALESCE(excluded.last_referrer, last_referrer), last_user_agent = excluded.last_user_agent`).run(path, siteId, bot ? 0 : 1, bot ? 1 : 0, ref, ua);
  } else {
    db.prepare(`INSERT INTO seo_404 (path, hits_human, hits_bot, last_referrer, last_user_agent) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET hits_human = hits_human + excluded.hits_human, hits_bot = hits_bot + excluded.hits_bot, last_seen = datetime('now'),
        last_referrer = COALESCE(excluded.last_referrer, last_referrer), last_user_agent = excluded.last_user_agent`).run(path, bot ? 0 : 1, bot ? 1 : 0, ref, ua);
  }
  if (++writes % 200 === 0) {
    // Borne par site d'abord (le site qui déborde est le seul touché), puis borne globale
    if (siteSchemaReady()) {
      const over = db.prepare("SELECT site_id, COUNT(*) n FROM seo_404 GROUP BY site_id HAVING COUNT(*) > ?").all(MAX_ROWS_PER_SITE);
      for (const o of over) db.prepare(`DELETE FROM seo_404 WHERE rowid IN (SELECT rowid FROM seo_404 WHERE ${require("../services/siteScope").sameScope("site_id")} ORDER BY (${hasStateColumns() ? "handled_at IS NOT NULL OR ignored = 1" : "ignored = 1"}) DESC, (hits_human + hits_bot) ASC, last_seen ASC LIMIT ?)`).run(o.site_id, o.n - MAX_ROWS_PER_SITE);
    }
    const n = db.prepare("SELECT COUNT(*) n FROM seo_404").get().n;
    if (n > MAX_ROWS) db.prepare("DELETE FROM seo_404 WHERE rowid IN (SELECT rowid FROM seo_404 ORDER BY (hits_human + hits_bot) ASC, last_seen ASC LIMIT ?)").run(n - MAX_ROWS);
  }
}

// Panne du journal des 404 : signalée une fois (pas à chaque page introuvable)
let reported = false;
function reportOnce(error) {
  if (reported) return;
  reported = true;
  console.error("[KOLAKISA] Journal des pages introuvables (404) indisponible :", error.message);
}

// Middleware : note les réponses 404 des pages (GET), quelle que soit la route qui les a produites
function middleware(req, res, next) {
  if (req.method === "GET") res.on("finish", () => { if (res.statusCode === 404) { try { record(req); } catch (error) { reportOnce(error); } /* le journal ne doit jamais casser une page */ } });
  next();
}

// Périmètre : site undefined = toutes les lignes (équipe) ; null = hôte principal ; entier = CE site seulement
const scopeSql = (site) => (!siteSchemaReady() || site === undefined ? { sql: "1 = 1", params: [] } : Number.isInteger(site) ? { sql: "site_id = ?", params: [site] } : { sql: "site_id IS NULL", params: [] });
function list({ filter = "all", q = "", limit = 300, site } = {}) {
  const sc = scopeSql(site);
  const where = [sc.sql];
  const params = [...sc.params];
  if (filter === "human") where.push("hits_human > 0");
  if (filter === "bot") where.push("hits_bot > 0 AND hits_human = 0");
  if (filter !== "ignored") where.push("ignored = 0"); else where.push("ignored = 1");
  if (q) { where.push("path LIKE ? ESCAPE '\\'"); params.push(`%${String(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`); }
  const withSite = siteSchemaReady() ? ", site_id" : "";
  return db.prepare(`SELECT *${withSite ? "" : ", NULL AS site_id"} FROM seo_404 WHERE ${where.join(" AND ")} ORDER BY hits_human DESC, (hits_human + hits_bot) DESC, last_seen DESC LIMIT ?`).all(...params, limit);
}
function stats({ site } = {}) {
  const sc = scopeSql(site);
  return db.prepare(`SELECT COUNT(*) urls, COALESCE(SUM(hits_human), 0) human, COALESCE(SUM(hits_bot), 0) bot FROM seo_404 WHERE ignored = 0 AND ${sc.sql}`).get(...sc.params);
}
// Les actions visent une ligne PRÉCISE (adresse + site). Sans précision : l'hôte principal (comportement historique).
const setIgnored = (path, ignored, { site = null } = {}) => { const sc = scopeSql(site === undefined ? null : site); return db.prepare(`UPDATE seo_404 SET ignored = ? WHERE path = ? AND ${sc.sql}`).run(ignored ? 1 : 0, path, ...sc.params).changes > 0; };
const remove = (path, { site = null } = {}) => { const sc = scopeSql(site === undefined ? null : site); return db.prepare(`DELETE FROM seo_404 WHERE path = ? AND ${sc.sql}`).run(path, ...sc.params).changes > 0; };

// États de traitement (colonnes de la migration 101) — l'historique des visites n'est jamais effacé par un changement d'état
const hasStateColumns = () => db.prepare("SELECT 1 FROM pragma_table_info('seo_404') WHERE name = 'handled_at'").get() !== undefined;
function setHandled(path, handled, { site, userId = null } = {}) {
  if (!Number.isInteger(site) || !hasStateColumns()) return false;
  return db.prepare("UPDATE seo_404 SET handled_at = CASE WHEN ? THEN datetime('now') ELSE NULL END, handled_by = CASE WHEN ? THEN ? ELSE NULL END WHERE path = ? AND site_id = ?").run(handled ? 1 : 0, handled ? 1 : 0, userId, path, site).changes > 0;
}
// Politique de conservation : les adresses traitées, ignorées ou revenues en ligne, sans visite depuis `days` jours, sont supprimées ; les adresses encore à traiter sont conservées.
function purge({ site, days = 180 } = {}) {
  if (!Number.isInteger(site) || !hasStateColumns()) return 0;
  const d = Math.max(30, Math.min(730, Number(days) || 180));
  return db.prepare("DELETE FROM seo_404 WHERE site_id = ? AND (ignored = 1 OR handled_at IS NOT NULL OR recovered_at IS NOT NULL) AND last_seen < datetime('now', ?)").run(site, `-${d} days`).changes;
}

module.exports = { middleware, record, list, stats, setIgnored, setHandled, purge, remove, BOT, MAX_ROWS_PER_SITE };
