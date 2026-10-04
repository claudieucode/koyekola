// Corbeille des blocs d'un article (éditeur → Structure de l'article → Corbeille).
// Un bloc supprimé depuis la vue en liste est enregistré ici avec son contenu exact (JSON de l'éditeur) et sa place
// d'origine (bloc parent, voisins, rang) pour être restauré au même endroit. Source de vérité : l'article + cette table ;
// l'éditeur n'affiche que les éléments dont le bloc n'est pas (ou plus) dans l'article.
const db = require("../config/database");
const { UserError } = require("../utils/errors");

db.exec(`
  CREATE TABLE IF NOT EXISTS blog_block_trash (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    block_id TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    preview TEXT NOT NULL DEFAULT '',
    node TEXT NOT NULL,
    parent_id TEXT,
    prev_id TEXT,
    next_id TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    deleted_by INTEGER,
    deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (post_id, block_id)
  );
`);

const ID = /^b[a-z0-9]{8}$/;
const TYPE = /^[A-Za-z][A-Za-z0-9]{0,40}$/;
const MAX_NODE = 400000;
const optId = (v) => (v === null || v === undefined || v === "" ? null : ID.test(String(v)) ? String(v) : undefined);

function validate(input) {
  const blockId = String(input.blockId || "");
  if (!ID.test(blockId)) throw new UserError("Identifiant de bloc invalide.");
  const node = typeof input.node === "string" ? input.node : JSON.stringify(input.node || null);
  if (!node || node.length > MAX_NODE) throw new UserError("Bloc trop volumineux pour la corbeille.");
  let parsed;
  try { parsed = JSON.parse(node); } catch { throw new UserError("Contenu du bloc illisible."); }
  if (!parsed || typeof parsed !== "object" || !TYPE.test(String(parsed.type || "")) || parsed.type !== input.type) throw new UserError("Type de bloc invalide.");
  const parentId = optId(input.parentId);
  const prevId = optId(input.prevId);
  const nextId = optId(input.nextId);
  if ([parentId, prevId, nextId].includes(undefined)) throw new UserError("Position du bloc invalide.");
  const position = Math.max(0, Math.min(100000, Number.parseInt(input.position, 10) || 0));
  return { blockId, type: parsed.type, label: String(input.label || "").slice(0, 60), preview: String(input.preview || "").replace(/\s+/g, " ").trim().slice(0, 160), node, parentId, prevId, nextId, position };
}

function add(postId, input, userId) {
  const v = validate(input);
  db.prepare(`INSERT INTO blog_block_trash (post_id, block_id, type, label, preview, node, parent_id, prev_id, next_id, position, deleted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(post_id, block_id) DO UPDATE SET type = excluded.type, label = excluded.label, preview = excluded.preview, node = excluded.node,
      parent_id = excluded.parent_id, prev_id = excluded.prev_id, next_id = excluded.next_id, position = excluded.position, deleted_by = excluded.deleted_by, deleted_at = datetime('now')`)
    .run(postId, v.blockId, v.type, v.label, v.preview, v.node, v.parentId, v.prevId, v.nextId, v.position, userId || null);
  return get(postId, v.blockId);
}
const shape = (r) => r && { blockId: r.block_id, type: r.type, label: r.label, preview: r.preview, node: JSON.parse(r.node), parentId: r.parent_id, prevId: r.prev_id, nextId: r.next_id, position: r.position, deletedAt: r.deleted_at };
const get = (postId, blockId) => shape(db.prepare("SELECT * FROM blog_block_trash WHERE post_id = ? AND block_id = ?").get(postId, blockId));
const list = (postId) => db.prepare("SELECT * FROM blog_block_trash WHERE post_id = ? ORDER BY deleted_at DESC, id DESC").all(postId).map(shape);
// Suppression définitive (un élément, ou toute la corbeille)
function purge(postId, blockId) {
  if (!ID.test(String(blockId || ""))) throw new UserError("Identifiant de bloc invalide.");
  return db.prepare("DELETE FROM blog_block_trash WHERE post_id = ? AND block_id = ?").run(postId, blockId).changes > 0;
}
const empty = (postId) => db.prepare("DELETE FROM blog_block_trash WHERE post_id = ?").run(postId).changes;
// Après un enregistrement de l'article : les blocs présents dans l'article (restaurés, ou revenus par « Annuler ») quittent la corbeille
function settle(postId, html) {
  const present = new Set([...String(html || "").matchAll(/data-block-id="(b[a-z0-9]{8})"/g)].map((m) => m[1]));
  if (!present.size) return 0;
  const del = db.prepare("DELETE FROM blog_block_trash WHERE post_id = ? AND block_id = ?");
  let n = 0;
  for (const id of present) n += del.run(postId, id).changes;
  return n;
}

module.exports = { add, get, list, purge, empty, settle, ID };
