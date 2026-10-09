// Stockage des sessions dans la base SQLite : les connexions et paniers survivent
// à un redémarrage du serveur (le stockage en mémoire par défaut les perd).
const session = require("express-session");
const db = require("./database");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const TOUCH_EVERY_MS = 60 * 1000;
const touchedAt = new Map(); // sid → dernier repoussage de l'expiration (mémoire du processus)

function expiryOf(sess) {
  const expires = sess && sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : NaN;
  return Number.isFinite(expires) ? expires : Date.now() + DEFAULT_TTL_MS;
}

class SqliteStore extends session.Store {
  get(sid, cb) {
    try {
      const row = db.prepare("SELECT data, expires_at FROM sessions WHERE sid = ?").get(sid);
      if (!row || row.expires_at < Date.now()) return cb(null, null);
      cb(null, JSON.parse(row.data));
    } catch (err) {
      cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      db.prepare(
        `INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at`
      ).run(sid, JSON.stringify(sess), expiryOf(sess));
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  // Appelé quand la session n'a pas changé : on repousse seulement sa date d'expiration. Sur une session valable 30 jours, la réécrire à
  // CHAQUE requête n'apporte rien et coûte une écriture synchrone en base (l'éditeur envoie un rendu et un enregistrement à chaque
  // modification) : au plus une fois par minute et par session.
  touch(sid, sess, cb) {
    const now = Date.now();
    if (now - (touchedAt.get(sid) || 0) < TOUCH_EVERY_MS) { if (cb) cb(null); return; }
    if (touchedAt.size > 5000) touchedAt.clear();
    touchedAt.set(sid, now);
    try {
      db.prepare("UPDATE sessions SET expires_at = ? WHERE sid = ?").run(expiryOf(sess), sid);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  destroy(sid, cb) {
    touchedAt.delete(sid);
    try {
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }
}

// Nettoyage des sessions expirées, toutes les heures
setInterval(() => {
  try {
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  } catch (err) {
    console.error("Nettoyage des sessions impossible :", err.message);
  }
}, 60 * 60 * 1000).unref();

module.exports = { SqliteStore };
