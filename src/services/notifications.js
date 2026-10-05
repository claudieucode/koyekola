// Centre de notifications des élèves : UN seul système, réutilisé par le support, les certificats, les commandes…
// (chaque module appelle notify() ; aucune table de notifications propre à un module).
// Le texte est stocké brut (les vues l'échappent) ; le lien doit être une adresse INTERNE (jamais d'URL externe ni « // »).
const db = require("../config/database");

const safeUrl = (url) => (/^\/(?!\/)[^\s]*$/.test(String(url || "")) ? String(url) : "");

// Ne lève jamais d'erreur : une notification ratée ne doit jamais faire échouer l'action qui la déclenche.
function notify(userId, { kind, title, body = "", url = "" }) {
  try {
    if (!Number.isInteger(userId) || !kind || !title) return null;
    return Number(db.prepare("INSERT INTO notifications (user_id, kind, title, body, url) VALUES (?, ?, ?, ?, ?)")
      .run(userId, String(kind).slice(0, 40), String(title).slice(0, 160), String(body).slice(0, 500), safeUrl(url)).lastInsertRowid);
  } catch (error) {
    console.error("[KOLAKISA] Notification non enregistrée :", error.message);
    return null;
  }
}

const unreadCount = (userId) => db.prepare("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NULL").get(userId).n;
const list = (userId, limit = 100) => db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(userId, limit);
// Une notification n'est modifiable que par son propriétaire (user_id dans la requête)
const markRead = (userId, id) => db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL").run(id, userId).changes === 1;
const markAllRead = (userId) => db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(userId).changes;

module.exports = { notify, unreadCount, list, markRead, markAllRead, safeUrl };
