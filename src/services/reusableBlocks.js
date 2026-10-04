// Blocs réutilisables de l'éditeur d'articles et préférences personnelles de l'éditeur.
//   - Bloc « copie » : inséré comme un contenu normal (modifiable indépendamment).
//   - Bloc « synchronisé » : l'article ne contient qu'un repère <div class="kb-reusable" data-ref="id"> ; le contenu
//     est lu dans cette table au moment de l'affichage. Modifier le bloc le modifie partout où il est utilisé.
// Contenu toujours passé par le filtre de sécurité du blog à l'enregistrement (jamais de HTML brut).
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
// Articles qui utilisent un bloc synchronisé
const usage = (id) => db.prepare("SELECT id, title FROM posts WHERE content LIKE ?").all(`%class="kb-reusable" data-ref="${Number(id)}"%`);
function remove(id) {
  const b = get(id);
  if (!b) throw new UserError("Bloc introuvable.");
  const used = b.synced ? usage(id) : [];
  if (used.length) throw new UserError(`Ce bloc synchronisé est utilisé par : ${used.map((p) => `« ${p.title} »`).join(", ")}. Convertissez-le d'abord en blocs normaux dans ces articles.`);
  db.prepare("DELETE FROM blog_reusable_blocks WHERE id = ?").run(id);
}
// Contenu d'un bloc synchronisé pour l'affichage d'un article
const syncedHtml = (id) => { const b = get(id); return b && b.synced ? b.content : null; };

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

module.exports = { create, update, get, list, remove, usage, syncedHtml, prefsOf, savePrefs, cleanPrefs, SETTINGS };
