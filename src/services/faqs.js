// Questions fréquentes : générales (course_id vide, page « Questions fréquentes ») ou propres à une formation (page de la formation).
// Chaque lecture publique ne renvoie QUE les questions publiées ; toute écriture vérifie le périmètre (une formation n'est modifiable que par son formateur).
const db = require("../config/database");
const { UserError } = require("../utils/errors");
const siteScope = require("./siteScope");

const LIMITS = { question: 300, answer: 5000, category: 60 };
const clean = (v) => String(v ?? "").replace(/\r\n/g, "\n").trim();

// Portée : une formation (qui porte déjà son site) ou les questions générales DU SITE (faqs.site_id ; NULL = site principal)
const scope = (courseId, siteId = null) => {
  if (courseId) return { sql: "course_id = ?", args: [courseId] };
  const w = siteScope.where(siteId);
  return { sql: `course_id IS NULL${w.sql}`, args: w.params };
};
// Publiques : triées par position (puis identifiant) ; la catégorie ne sert qu'au classement de l'affichage des questions générales
const listPublic = (courseId, siteId = null) => { const w = scope(courseId, siteId); return db.prepare(`SELECT * FROM faqs WHERE ${w.sql} AND published = 1 ORDER BY position, id`).all(...w.args); };
const listAll = (courseId, siteId = null) => { const w = scope(courseId, siteId); return db.prepare(`SELECT * FROM faqs WHERE ${w.sql} ORDER BY position, id`).all(...w.args); };
const get = (id) => (Number.isInteger(id) ? db.prepare("SELECT * FROM faqs WHERE id = ?").get(id) || null : null);
const categories = (siteId = null) => { const w = siteScope.where(siteId); return db.prepare(`SELECT category c, COUNT(*) n FROM faqs WHERE course_id IS NULL AND category <> ''${w.sql} GROUP BY category ORDER BY MIN(position), c`).all(...w.params).map((r) => ({ name: r.c, count: r.n })); };

// → { values } valides ou { errors } par champ
function validate(input, { withCategory }) {
  const v = { question: clean(input.question).replace(/\s+/g, " "), answer: clean(input.answer), category: withCategory ? clean(input.category).replace(/\s+/g, " ").slice(0, LIMITS.category) : "", published: input.published_present ? (input.published === "1" ? 1 : 0) : (input.published === "0" || input.published === 0 ? 0 : 1) };
  const errors = {};
  if (!v.question) errors.question = "La question est obligatoire."; else if (v.question.length > LIMITS.question) errors.question = `La question ne doit pas dépasser ${LIMITS.question} caractères.`;
  if (!v.answer) errors.answer = "La réponse est obligatoire."; else if (v.answer.length > LIMITS.answer) errors.answer = `La réponse ne doit pas dépasser ${LIMITS.answer} caractères.`;
  if (clean(input.category).length > LIMITS.category && withCategory) errors.category = `La catégorie ne doit pas dépasser ${LIMITS.category} caractères.`;
  return Object.keys(errors).length ? { errors, values: v } : { values: v };
}

function create(courseId, input, siteId = null) {
  const r = validate(input, { withCategory: !courseId });
  if (r.errors) return r;
  const w = scope(courseId, siteId);
  const next = db.prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS n FROM faqs WHERE ${w.sql}`).get(...w.args).n;
  const id = Number(db.prepare("INSERT INTO faqs (course_id, question, answer, position, category, published, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(courseId || null, r.values.question, r.values.answer, next, r.values.category, r.values.published, siteId === undefined ? null : siteId).lastInsertRowid);
  return { id };
}
function update(faq, input) {
  const r = validate(input, { withCategory: !faq.course_id });
  if (r.errors) return r;
  db.prepare("UPDATE faqs SET question = ?, answer = ?, category = ?, published = ? WHERE id = ?").run(r.values.question, r.values.answer, r.values.category, r.values.published, faq.id);
  return { id: faq.id };
}
const setPublished = (faq, on) => db.prepare("UPDATE faqs SET published = ? WHERE id = ?").run(on ? 1 : 0, faq.id).changes === 1;
const remove = (faq) => db.prepare("DELETE FROM faqs WHERE id = ?").run(faq.id).changes === 1;
// Échange la position avec la voisine (même périmètre) ; les positions sont d'abord renumérotées 0..n pour qu'aucune égalité ne rende l'ordre ambigu
function move(faq, dir) {
  const rows = listAll(faq.course_id || null, faq.site_id ?? null);
  const i = rows.findIndex((r) => r.id === faq.id), j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return false;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  db.exec("BEGIN IMMEDIATE");
  try { const up = db.prepare("UPDATE faqs SET position = ? WHERE id = ?"); rows.forEach((r, k) => up.run(k, r.id)); db.exec("COMMIT"); } catch (e) { try { db.exec("ROLLBACK"); } catch { /* annulée */ } throw e; }
  return true;
}
// Le formateur propriétaire de la formation ; pour les questions générales : tout formateur (le site est contrôlé à part par dashSite.guardObject)
// siteOf : site d'une question (celui de sa formation, sinon son propre site_id)
const siteOf = (faq) => { if (faq.course_id) { const c = db.prepare("SELECT site_id FROM courses WHERE id = ?").get(faq.course_id); return c ? c.site_id ?? null : null; } return faq.site_id ?? null; };
function canManage(user, faq) {
  if (!faq) return false;
  if (!faq.course_id) return true;
  const c = db.prepare("SELECT instructor_id FROM courses WHERE id = ?").get(faq.course_id);
  return Boolean(c && user && c.instructor_id === user.id);
}
// Regroupement pour l'affichage : questions sans catégorie d'abord ? Non : l'ordre des catégories suit la position de leur première question
function grouped(faqs) {
  const groups = [], index = new Map();
  for (const f of faqs) { const key = f.category || ""; if (!index.has(key)) { index.set(key, { name: key, items: [] }); groups.push(index.get(key)); } index.get(key).items.push(f); }
  return groups;
}

module.exports = { siteOf, LIMITS, listPublic, listAll, get, categories, create, update, setPublished, remove, move, canManage, grouped, UserError };
