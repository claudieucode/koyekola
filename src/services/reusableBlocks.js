// Blocs réutilisables de l'éditeur d'articles et préférences personnelles de l'éditeur.
// Un bloc est enregistré UNE fois (table blog_reusable_blocks, identifiant stable). Le mode se choisit À CHAQUE insertion :
//   - « synchronisé » : l'article ne contient qu'un repère <div class="kb-reusable" data-ref="id"> ; le contenu est lu dans
//     cette table au moment de l'affichage. Modifier le bloc le modifie partout où il est utilisé (tous les articles).
//   - « copie » : le contenu est inséré dans l'article et devient indépendant.
// Supprimer un bloc utilisé ne laisse jamais de repère cassé : ses repères sont convertis en copies ou retirés
// (articles, brouillons automatiques et versions). Contenu toujours passé par le filtre de sécurité du blog.
const db = require("../config/database");
const { UserError } = require("../utils/errors");

db.exec(`
  CREATE TABLE IF NOT EXISTS blog_reusable_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS editor_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Le filtre est chargé à la demande (évite une dépendance circulaire au démarrage)
const clean = (html) => require("../utils/blogHtml").sanitizeBlogHtml(html);
const NAME = /^[^<>]{1,80}$/;
// Un bloc synchronisé ne peut pas en contenir un autre (boucle impossible)
const stripRefs = (html) => String(html || "").replace(/<div class="kb-reusable"[^>]*><\/div>/g, "");

function validate({ name, category = "", html }) {
  const n = String(name || "").trim();
  if (!NAME.test(n)) throw new UserError("Nom du bloc : 1 à 80 caractères (sans < ni >).");
  const content = clean(stripRefs(html));
  if (!content) throw new UserError("Le bloc est vide : rien à enregistrer.");
  return { name: n, category: String(category || "").trim().slice(0, 40), content };
}
function create({ name, category, html, synced }, userId) {
  const v = validate({ name, category, html });
  const id = Number(db.prepare("INSERT INTO blog_reusable_blocks (name, category, content, synced, created_by) VALUES (?, ?, ?, ?, ?)").run(v.name, v.category, v.content, synced ? 1 : 0, userId).lastInsertRowid);
  return get(id);
}
function update(id, { name, category, html }) {
  const b = get(id);
  if (!b) throw new UserError("Bloc introuvable.");
  const v = validate({ name: name === undefined ? b.name : name, category: category === undefined ? b.category : category, html: html === undefined ? b.content : html });
  db.prepare("UPDATE blog_reusable_blocks SET name = ?, category = ?, content = ?, updated_at = datetime('now') WHERE id = ?").run(v.name, v.category, v.content, id);
  return get(id);
}
const get = (id) => db.prepare("SELECT * FROM blog_reusable_blocks WHERE id = ?").get(Number(id)) || null;
function list({ q = "" } = {}) {
  const like = `%${String(q).trim()}%`;
  return db.prepare("SELECT * FROM blog_reusable_blocks WHERE name LIKE ? OR category LIKE ? ORDER BY category COLLATE NOCASE, name COLLATE NOCASE").all(like, like);
}
// Repères d'un bloc dans un HTML (même bloc plusieurs fois possible)
const refPattern = (id) => new RegExp(`<div class="kb-reusable"[^>]*\\bdata-ref="${Number(id)}"[^>]*></div>`, "g");
const countRefs = (html, id) => (String(html || "").match(refPattern(id)) || []).length;
// Où un bloc est utilisé : articles (avec le nombre d'occurrences) et total des occurrences
function usage(id) {
  const posts = db.prepare("SELECT id, title, slug, status, published, content FROM posts WHERE content LIKE ?").all(`%data-ref="${Number(id)}"%`)
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status, published: Boolean(p.published), count: countRefs(p.content, id) }))
    .filter((p) => p.count > 0);
  return { posts, occurrences: posts.reduce((n, p) => n + p.count, 0) };
}
// Supprimer un bloc. Utilisé : mode obligatoire — « copies » (les repères deviennent son contenu, indépendant)
// ou « retirer » (les repères sont retirés). Appliqué aux articles, aux brouillons automatiques et aux versions.
function remove(id, { mode = null } = {}) {
  const b = get(id);
  if (!b) throw new UserError("Bloc introuvable.");
  const used = usage(id);
  if (used.occurrences && !["copies", "retirer"].includes(mode)) {
    throw new UserError(`Ce bloc est utilisé ${used.occurrences} fois (${used.posts.length} article(s)). Choisissez : le convertir en copies ou retirer ses occurrences.`);
  }
  const replacement = mode === "copies" ? b.content : "";
  const swap = (html) => String(html || "").replace(refPattern(id), () => replacement);
  const like = `%data-ref="${Number(id)}"%`;
  db.exec("BEGIN");
  try {
    for (const p of db.prepare("SELECT id, content FROM posts WHERE content LIKE ?").all(like)) db.prepare("UPDATE posts SET content = ? WHERE id = ?").run(swap(p.content), p.id);
    for (const r of db.prepare("SELECT id, content FROM post_revisions WHERE content LIKE ?").all(like)) db.prepare("UPDATE post_revisions SET content = ? WHERE id = ?").run(swap(r.content), r.id);
    // Brouillons automatiques : contenu dans un JSON
    for (const a of db.prepare("SELECT post_id, payload FROM post_autosaves WHERE payload LIKE ?").all(`%data-ref=\\"${Number(id)}\\"%`)) {
      try { const data = JSON.parse(a.payload); if (data && typeof data.content === "string") { data.content = swap(data.content); db.prepare("UPDATE post_autosaves SET payload = ? WHERE post_id = ?").run(JSON.stringify(data), a.post_id); } } catch { /* brouillon illisible : ignoré */ }
    }
    db.prepare("DELETE FROM blog_reusable_blocks WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return { converted: mode === "copies" ? used.occurrences : 0, removed: mode === "retirer" ? used.occurrences : 0, posts: used.posts.length };
}
// Dupliquer : nouveau bloc indépendant (nouvel identifiant), même contenu
function duplicate(id, userId) {
  const b = get(id);
  if (!b) throw new UserError("Bloc introuvable.");
  return create({ name: `${b.name} (copie)`.slice(0, 80), category: b.category, html: b.content, synced: b.synced }, userId);
}
// Repères vers des blocs supprimés retirés du HTML enregistré (jamais de référence cassée en base)
function pruneMissing(html) {
  const text = String(html || "");
  if (!text.includes('class="kb-reusable"')) return text;
  return text.replace(/<div class="kb-reusable"[^>]*\bdata-ref="(\d+)"[^>]*><\/div>/g, (m, id) => (get(Number(id)) ? m : ""));
}
// Contenu d'un bloc pour l'affichage d'un article (tout bloc référencé est résolu, quel que soit son mode d'origine)
const syncedHtml = (id) => { const b = get(id); return b ? b.content : null; };

// ---------- Préférences de l'éditeur (favoris, récents, réglages) ----------
const SETTINGS = {
  autosave: { type: "bool", default: true }, autosaveDelay: { type: "enum", values: ["2", "5", "10", "30"], default: "2" },
  counters: { type: "bool", default: true }, width: { type: "enum", values: ["normal", "wide", "full"], default: "normal" },
  density: { type: "enum", values: ["comfortable", "compact"], default: "comfortable" }, topToolbar: { type: "bool", default: false },
  spellcheck: { type: "bool", default: true }, seoAnalysis: { type: "bool", default: true }, aiAssistant: { type: "bool", default: true },
  previewDevice: { type: "enum", values: ["desktop", "tablet", "mobile"], default: "desktop" }, imageVariants: { type: "bool", default: true },
  hiddenBlocks: { type: "list", max: 80 },
};
function cleanPrefs(input = {}) {
  const out = { favorites: [], recents: [], settings: {} };
  const ids = (a, max) => [...new Set((Array.isArray(a) ? a : []).map(String).filter((x) => /^[a-z0-9:_-]{1,40}$/i.test(x)))].slice(0, max);
  out.favorites = ids(input.favorites, 40);
  out.recents = ids(input.recents, 12);
  const s = input.settings || {};
  for (const [k, def] of Object.entries(SETTINGS)) {
    if (def.type === "bool") out.settings[k] = typeof s[k] === "boolean" ? s[k] : def.default;
    else if (def.type === "enum") out.settings[k] = def.values.includes(String(s[k])) ? String(s[k]) : def.default;
    else if (def.type === "list") out.settings[k] = ids(s[k], def.max);
  }
  return out;
}
function prefsOf(userId) {
  const r = db.prepare("SELECT data FROM editor_prefs WHERE user_id = ?").get(userId);
  let data = {};
  try { data = r ? JSON.parse(r.data) : {}; } catch { data = {}; }
  return cleanPrefs(data);
}
function savePrefs(userId, patch) {
  const current = prefsOf(userId);
  const next = cleanPrefs({ ...current, ...(patch || {}), settings: { ...current.settings, ...((patch && patch.settings) || {}) } });
  db.prepare("INSERT INTO editor_prefs (user_id, data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").run(userId, JSON.stringify(next));
  return next;
}

module.exports = { create, update, get, list, remove, duplicate, usage, countRefs, pruneMissing, syncedHtml, prefsOf, savePrefs, cleanPrefs, SETTINGS };
