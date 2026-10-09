// Journal des erreurs 404 : chaque adresse introuvable demandée (GET), avec nombre de visites humaines et de robots,
// première et dernière fois, dernière page d'origine (referrer) et dernier navigateur. Aucune adresse IP n'est conservée.
// Volume borné : 5 000 adresses au plus (les plus anciennes et les moins vues sont retirées).
const { db } = require("./store");

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
  db.prepare(`INSERT INTO seo_404 (path, hits_human, hits_bot, last_referrer, last_user_agent) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET hits_human = hits_human + excluded.hits_human, hits_bot = hits_bot + excluded.hits_bot, last_seen = datetime('now'),
      last_referrer = COALESCE(excluded.last_referrer, last_referrer), last_user_agent = excluded.last_user_agent`).run(path, bot ? 0 : 1, bot ? 1 : 0, ref, ua);
  if (++writes % 200 === 0) {
    const n = db.prepare("SELECT COUNT(*) n FROM seo_404").get().n;
    if (n > MAX_ROWS) db.prepare("DELETE FROM seo_404 WHERE path IN (SELECT path FROM seo_404 ORDER BY (hits_human + hits_bot) ASC, last_seen ASC LIMIT ?)").run(n - MAX_ROWS);
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

function list({ filter = "all", q = "", limit = 300 } = {}) {
  const where = ["1 = 1"];
  const params = [];
  if (filter === "human") where.push("hits_human > 0");
  if (filter === "bot") where.push("hits_bot > 0 AND hits_human = 0");
  if (filter !== "ignored") where.push("ignored = 0"); else where.push("ignored = 1");
  if (q) { where.push("path LIKE ?"); params.push(`%${q}%`); }
  return db.prepare(`SELECT * FROM seo_404 WHERE ${where.join(" AND ")} ORDER BY hits_human DESC, (hits_human + hits_bot) DESC, last_seen DESC LIMIT ?`).all(...params, limit);
}
const stats = () => db.prepare("SELECT COUNT(*) urls, COALESCE(SUM(hits_human), 0) human, COALESCE(SUM(hits_bot), 0) bot FROM seo_404 WHERE ignored = 0").get();
const setIgnored = (path, ignored) => db.prepare("UPDATE seo_404 SET ignored = ? WHERE path = ?").run(ignored ? 1 : 0, path).changes > 0;
const remove = (path) => db.prepare("DELETE FROM seo_404 WHERE path = ?").run(path).changes > 0;

module.exports = { middleware, record, list, stats, setIgnored, remove, BOT };
