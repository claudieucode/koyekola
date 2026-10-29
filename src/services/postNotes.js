// Notes d'un article (commentaires de travail entre rédacteurs) : un fil par bloc ou par article, avec réponses, résolution, suppression.
// Elles ne sont JAMAIS publiées : elles vivent dans leur propre table, hors du contenu, des révisions, du flux RSS et du plan du site.
const db = require("../config/database");
const { UserError } = require("../utils/errors");

db.exec(`
  CREATE TABLE IF NOT EXISTS post_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    block_id TEXT,
    parent_id INTEGER REFERENCES post_notes(id) ON DELETE CASCADE,
    user_id INTEGER,
    body TEXT NOT NULL,
    resolved_at TEXT,
    resolved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_post_notes_post ON post_notes(post_id, id);
  CREATE INDEX IF NOT EXISTS idx_post_notes_parent ON post_notes(parent_id);
`);

// Mentions (@nom) : colonne ajoutée sans toucher aux notes existantes
if (!db.prepare("PRAGMA table_info(post_notes)").all().some((c) => c.name === "mentions")) db.exec("ALTER TABLE post_notes ADD COLUMN mentions TEXT NOT NULL DEFAULT '[]'");

const BLOCK_ID = /^b[a-z0-9]{8}$/;
const MAX_BODY = 2000;
const MAX_PER_POST = 500;
const clean = (text) => String(text || "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();

const parseIds = (text) => { try { const v = JSON.parse(text || "[]"); return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : []; } catch { return []; } };
const MENTION = /(^|[\s(,;:])@([\p{L}\p{N}._-]{2,40})/gu;
// Personnes que l'on peut mentionner dans les notes d'un article : le compte créateur, l'auteur de l'article et les personnes qui ont déjà écrit une note ici
function mentionable(postId) {
  return db.prepare(`SELECT DISTINCT u.id, u.username FROM users u WHERE u.role = 'formateur' OR u.id = (SELECT author_id FROM posts WHERE id = ?) OR u.id IN (SELECT user_id FROM post_notes WHERE post_id = ? AND user_id IS NOT NULL) ORDER BY u.username COLLATE NOCASE LIMIT 50`).all(postId, postId)
    .filter((u) => /^[\p{L}\p{N}._-]{2,40}$/u.test(u.username));
}
// Identifiants des personnes mentionnées (jamais une personne hors de cette liste : une mention ne révèle l'existence de personne d'autre)
function mentionsIn(postId, body) {
  const people = new Map(mentionable(postId).map((u) => [u.username.toLowerCase(), u.id]));
  const found = new Set();
  for (const m of String(body).matchAll(MENTION)) { const id = people.get(m[2].toLowerCase()); if (id) found.add(id); }
  return [...found];
}
const shape = (r) => ({ mentions: parseIds(r.mentions), id: r.id, blockId: r.block_id || null, parentId: r.parent_id || null, userId: r.user_id, author: r.author || "Compte supprimé", body: r.body, resolved: Boolean(r.resolved_at), resolvedAt: r.resolved_at || null, createdAt: r.created_at, updatedAt: r.updated_at });

// Fils de l'article : les notes racines (avec leurs réponses), les plus récentes en premier
function list(postId) {
  const rows = db.prepare(`SELECT n.*, u.username AS author FROM post_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.post_id = ? ORDER BY n.id ASC`).all(postId).map(shape);
  const names = new Map(mentionable(postId).map((u) => [u.id, u.username]));
  const withNames = (n) => ({ ...n, mentions: n.mentions.filter((id) => names.has(id)).map((id) => ({ id, username: names.get(id) })) });
  const roots = rows.filter((n) => !n.parentId).reverse();
  return roots.map((n) => ({ ...withNames(n), replies: rows.filter((r) => r.parentId === n.id).map(withNames) }));
}
function add(postId, userId, { body, blockId = null, parentId = null }) {
  const text = clean(body);
  if (!text) throw new UserError("Écrivez votre note avant de l'envoyer.");
  if (text.length > MAX_BODY) throw new UserError(`Une note contient ${MAX_BODY} caractères au plus.`);
  if (blockId !== null && blockId !== undefined && blockId !== "" && !BLOCK_ID.test(String(blockId))) throw new UserError("Bloc invalide.");
  if (db.prepare("SELECT COUNT(*) n FROM post_notes WHERE post_id = ?").get(postId).n >= MAX_PER_POST) throw new UserError("Cet article contient déjà beaucoup de notes : résolvez et supprimez les anciennes.");
  let parent = null;
  if (parentId) {
    parent = db.prepare("SELECT * FROM post_notes WHERE id = ? AND post_id = ?").get(Number(parentId), postId);
    if (!parent || parent.parent_id) throw new UserError("Note introuvable."); // une réponse se rattache à une note racine de CET article
  }
  const info = db.prepare("INSERT INTO post_notes (post_id, block_id, parent_id, user_id, body, mentions) VALUES (?, ?, ?, ?, ?, ?)").run(postId, parent ? parent.block_id : (blockId || null), parent ? parent.id : null, userId ?? null, text, JSON.stringify(mentionsIn(postId, text)));
  return Number(info.lastInsertRowid);
}
const get = (postId, id) => db.prepare("SELECT * FROM post_notes WHERE id = ? AND post_id = ?").get(Number(id), postId) || null;
// Résoudre / rouvrir un fil (note racine)
function resolve(postId, id, userId, resolved) {
  const n = get(postId, id);
  if (!n || n.parent_id) throw new UserError("Note introuvable.");
  if (resolved) db.prepare("UPDATE post_notes SET resolved_at = datetime('now'), resolved_by = ?, updated_at = datetime('now') WHERE id = ?").run(userId ?? null, n.id);
  else db.prepare("UPDATE post_notes SET resolved_at = NULL, resolved_by = NULL, updated_at = datetime('now') WHERE id = ?").run(n.id);
}
// Supprimer : l'auteur de la note, ou une personne qui peut modifier tous les articles ; supprimer un fil supprime ses réponses
function remove(postId, id, userId, { canModerate = false } = {}) {
  const n = get(postId, id);
  if (!n) throw new UserError("Note introuvable.");
  if (n.user_id !== userId && !canModerate) throw new UserError("Vous ne pouvez supprimer que vos propres notes.");
  db.prepare("DELETE FROM post_notes WHERE id = ? OR parent_id = ?").run(n.id, n.id);
}
// Nombre de fils ouverts par bloc (pastille dans l'éditeur)
function openCounts(postId) {
  const out = {};
  for (const r of db.prepare("SELECT block_id, COUNT(*) n FROM post_notes WHERE post_id = ? AND parent_id IS NULL AND resolved_at IS NULL AND block_id IS NOT NULL GROUP BY block_id").all(postId)) out[r.block_id] = r.n;
  return out;
}

module.exports = { list, add, resolve, remove, openCounts, mentionable, MAX_BODY };
