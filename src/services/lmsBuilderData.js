// Constructeur de formations intégré au CMS (création, réglages, chapitres, leçons, duplication, suppression) — mêmes tables que le LMS existant.
// Règles reprises de routes/instructor.js (titres nettoyés, formation vendue non supprimable, fichiers effacés APRÈS la suppression en base, lien vidéo https validé).
// Isolation : TOUTE opération part d'une formation du site (scope()), jamais d'un identifiant seul : un chapitre / une leçon d'un autre site est introuvable.
// Rattachement : deux conventions coexistent dans le dépôt (mk_course_sites, voir lmsSites ; courses.site_id, voir config/siteColumns). scope() les lit TOUTES LES DEUX
// (la ligne mk_course_sites prime), et une création écrit les deux avec la même valeur : les deux systèmes restent d'accord.
const { slugify } = require("../utils/format");
const { parseVideoUrl } = require("../utils/video");
const { removeUploadedFile } = require("../utils/uploads");

const TITLE_MAX = 120, LEVELS = ["debutant", "intermediaire", "avance"];
const colCache = new WeakMap();
function hasSiteColumn(db) {
  if (colCache.has(db)) return colCache.get(db);
  let has = false;
  try { has = db.prepare("PRAGMA table_info(courses)").all().some((c) => c.name === "site_id"); } catch { has = false; }
  colCache.set(db, has);
  return has;
}
const hasMk = (db) => { try { return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'mk_course_sites'").get() !== undefined; } catch { return false; } };

// Fragment SQL « la formation <alias> appartient à ce site » (principal : null). Un identifiant invalide ne donne JAMAIS « tout ».
function scope(db, siteId, alias = "courses") {
  const a = String(alias).replace(/[^A-Za-z0-9_]/g, "");
  const mk = hasMk(db), col = hasSiteColumn(db);
  const none = mk ? `NOT EXISTS (SELECT 1 FROM mk_course_sites cs WHERE cs.course_id = ${a}.id)` : "1";
  if (siteId === null || siteId === undefined) return { sql: `(${none}${col ? ` AND ${a}.site_id IS NULL` : ""})`, params: [] };
  if (!Number.isInteger(siteId) || siteId < 1) return { sql: "0", params: [] };
  const viaMk = mk ? `EXISTS (SELECT 1 FROM mk_course_sites cs WHERE cs.course_id = ${a}.id AND cs.site_id = ?)` : "0";
  const viaCol = col ? `(${none} AND ${a}.site_id = ?)` : "0";
  return { sql: `(${viaMk} OR ${viaCol})`, params: [...(mk ? [siteId] : []), ...(col ? [siteId] : [])] };
}

function cleanTitle(value) {
  const sep = String.fromCharCode(0x2028, 0x2029);
  return Array.from(String(value == null ? "" : value)).map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || sep.includes(c) ? " " : c)).join("").replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
}
const err = (message, code = "invalid") => Object.assign(new Error(message), { userMessage: message, code });
const tx = (db, fn) => { db.exec("BEGIN"); try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ } throw e; } };
const priceCents = (v) => Math.max(0, Math.round(parseFloat(String(v || "0").replace(",", ".")) * 100)) || 0;
const text = (v, max) => String(v == null ? "" : v).replace(/\r\n/g, "\n").slice(0, max);

function courseOf(db, siteId, id) {
  if (!Number.isInteger(id)) return null;
  const sc = scope(db, siteId);
  return db.prepare(`SELECT courses.* FROM courses WHERE courses.id = ? AND ${sc.sql}`).get(id, ...sc.params) || null;
}
function sectionOf(db, siteId, id) {
  if (!Number.isInteger(id)) return null;
  const sc = scope(db, siteId);
  return db.prepare(`SELECT sections.* FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = ? AND ${sc.sql}`).get(id, ...sc.params) || null;
}
function lessonOf(db, siteId, id) {
  if (!Number.isInteger(id)) return null;
  const sc = scope(db, siteId);
  return db.prepare(`SELECT lessons.*, sections.course_id FROM lessons JOIN sections ON sections.id = lessons.section_id JOIN courses ON courses.id = sections.course_id WHERE lessons.id = ? AND ${sc.sql}`).get(id, ...sc.params) || null;
}

const tableExists = (db, name) => { try { return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined; } catch { return false; } };
function curriculum(db, courseId) {
  const sections = db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId);
  const lessons = db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id");
  const quiz = tableExists(db, "quizzes") ? db.prepare("SELECT id FROM quizzes WHERE lesson_id = ?") : null;
  const att = tableExists(db, "lesson_attachments") ? db.prepare("SELECT COUNT(*) n FROM lesson_attachments WHERE lesson_id = ?") : null;
  for (const s of sections) { s.lessons = lessons.all(s.id); for (const l of s.lessons) { l.hasQuiz = quiz ? Boolean(quiz.get(l.id)) : false; l.attachments = att ? att.get(l.id).n : 0; } }
  return sections;
}

function uniqueSlug(db, title) {
  const base = slugify(title) || "formation"; let slug = base, n = 1;
  while (db.prepare("SELECT 1 FROM courses WHERE slug = ?").get(slug)) { n += 1; slug = `${base}-${n}`; }
  return slug;
}
function attach(db, courseId, siteId, organizationId, userId) {
  if (siteId === null || siteId === undefined) return;
  if (hasSiteColumn(db)) db.prepare("UPDATE courses SET site_id = ? WHERE id = ?").run(siteId, courseId);
  if (hasMk(db)) db.prepare("INSERT OR IGNORE INTO mk_course_sites (course_id, organization_id, site_id, created_by) VALUES (?, ?, ?, ?)").run(courseId, organizationId, siteId, userId ?? null);
}

function fields(input) {
  const level = LEVELS.includes(input.level) ? input.level : "debutant";
  return { subtitle: text(input.subtitle, 200).trim(), description: text(input.description, 20000), category: cleanTitle(input.category) || "Autre", level, price: priceCents(input.price) };
}

function createCourse(db, s, userId, input) {
  const title = cleanTitle(input.title);
  if (!title) throw err("Le titre de la formation est obligatoire.");
  const f = fields(input);
  return tx(db, () => {
    const id = Number(db.prepare("INSERT INTO courses (instructor_id, title, slug, subtitle, description, category, level, price_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(userId, title, uniqueSlug(db, title), f.subtitle, f.description, f.category, f.level, f.price).lastInsertRowid);
    attach(db, id, s.siteId, s.organizationId, userId);
    return id;
  });
}

function updateCourse(db, siteId, id, input) {
  const c = courseOf(db, siteId, id); if (!c) return false;
  const title = cleanTitle(input.title); if (!title) throw err("Le titre de la formation est obligatoire.");
  const f = fields(input);
  db.prepare("UPDATE courses SET title = ?, subtitle = ?, description = ?, category = ?, level = ?, price_cents = ?, updated_at = datetime('now') WHERE id = ?").run(title, f.subtitle, f.description, f.category, f.level, f.price, id);
  return true;
}

function duplicateCourse(db, s, userId, id) {
  const c = courseOf(db, s.siteId, id); if (!c) return null;
  return tx(db, () => {
    const title = cleanTitle(`${c.title} (copie)`);
    const nid = Number(db.prepare("INSERT INTO courses (instructor_id, title, slug, subtitle, description, category, level, price_cents, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)")
      .run(userId, title, uniqueSlug(db, title), c.subtitle, c.description, c.category, c.level, c.price_cents).lastInsertRowid);
    attach(db, nid, s.siteId, s.organizationId, userId);
    for (const sec of db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(id)) {
      const ns = Number(db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)").run(nid, sec.title, sec.position).lastInsertRowid);
      for (const l of db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id").all(sec.id)) {
        db.prepare("INSERT INTO lessons (section_id, title, description, video_url, duration_minutes, position, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?)").run(ns, l.title, l.description, l.video_url, l.duration_minutes, l.position, l.is_preview);
      }
    }
    return nid;
  });
}

const lessonFiles = (db, ids) => {
  if (!ids.length) return [];
  const m = ids.map(() => "?").join(",");
  let rows = [];
  try { rows = db.prepare(`SELECT video_path AS p FROM lessons WHERE id IN (${m}) AND video_path IS NOT NULL UNION SELECT path FROM lesson_attachments WHERE lesson_id IN (${m}) AND path IS NOT NULL`).all(...ids, ...ids); } catch { /* pas de pièces jointes */ }
  return rows.map((r) => r.p);
};

// Une formation déjà achetée ou suivie n'est pas supprimée (cascade = perte d'accès et d'historique) : on la dépublie.
function deleteCourse(db, siteId, id) {
  const c = courseOf(db, siteId, id); if (!c) return { ok: false, reason: "not_found" };
  const used = db.prepare("SELECT (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) + (SELECT COUNT(*) FROM order_items WHERE course_id = ?) n").get(id, id).n;
  if (used > 0) return { ok: false, reason: "used" };
  const ids = db.prepare("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?").all(id).map((l) => l.id);
  const files = [c.thumbnail_path, ...lessonFiles(db, ids)];
  db.prepare("DELETE FROM courses WHERE id = ?").run(id);
  try { db.prepare("DELETE FROM mk_course_sites WHERE course_id = ?").run(id); } catch { /* table absente ou déjà vide */ }
  files.filter(Boolean).forEach((f) => removeUploadedFile(f, "formation supprimée (CMS)"));
  return { ok: true };
}

const sectionIds = (db, courseId) => db.prepare("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId).map((r) => r.id);
const lessonIds = (db, sectionId) => db.prepare("SELECT id FROM lessons WHERE section_id = ? ORDER BY position, id").all(sectionId).map((r) => r.id);
const writeSections = (db, ids) => ids.forEach((id, i) => db.prepare("UPDATE sections SET position = ? WHERE id = ?").run(i, id));
const writeLessons = (db, sectionId, ids) => ids.forEach((id, i) => db.prepare("UPDATE lessons SET section_id = ?, position = ? WHERE id = ?").run(sectionId, i, id));
const touch = (db, courseId) => db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id = ?").run(courseId);

function addSection(db, siteId, courseId, title) {
  const c = courseOf(db, siteId, courseId); if (!c) return null;
  const t = cleanTitle(title); if (!t) throw err("Le titre du chapitre est obligatoire.");
  const pos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM sections WHERE course_id = ?").get(courseId).m + 1;
  const id = Number(db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)").run(courseId, t, pos).lastInsertRowid);
  touch(db, courseId); return id;
}
function renameSection(db, siteId, id, title) {
  const sec = sectionOf(db, siteId, id); if (!sec) return null;
  const t = cleanTitle(title); if (!t) throw err("Le titre du chapitre est obligatoire.");
  db.prepare("UPDATE sections SET title = ? WHERE id = ?").run(t, id); touch(db, sec.course_id); return sec.course_id;
}
function moveSection(db, siteId, id, dir) {
  const sec = sectionOf(db, siteId, id); if (!sec) return null;
  const d = dir === "haut" ? -1 : dir === "bas" ? 1 : 0; if (!d) throw err("Direction inconnue.");
  const ids = sectionIds(db, sec.course_id), from = ids.indexOf(id), to = from + d;
  if (to >= 0 && to < ids.length) { ids.splice(to, 0, ids.splice(from, 1)[0]); tx(db, () => writeSections(db, ids)); touch(db, sec.course_id); }
  return sec.course_id;
}
function deleteSection(db, siteId, id) {
  const sec = sectionOf(db, siteId, id); if (!sec) return null;
  const files = lessonFiles(db, lessonIds(db, id));
  tx(db, () => { db.prepare("DELETE FROM sections WHERE id = ?").run(id); writeSections(db, sectionIds(db, sec.course_id)); });
  files.forEach((f) => removeUploadedFile(f, "chapitre supprimé (CMS)")); touch(db, sec.course_id); return sec.course_id;
}
function addLesson(db, siteId, sectionId, title) {
  const sec = sectionOf(db, siteId, sectionId); if (!sec) return null;
  const t = cleanTitle(title); if (!t) throw err("Le titre de la leçon est obligatoire.");
  const pos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM lessons WHERE section_id = ?").get(sectionId).m + 1;
  const id = Number(db.prepare("INSERT INTO lessons (section_id, title, position) VALUES (?, ?, ?)").run(sectionId, t, pos).lastInsertRowid);
  touch(db, sec.course_id); return { id, courseId: sec.course_id };
}
function updateLesson(db, siteId, id, input) {
  const l = lessonOf(db, siteId, id); if (!l) return null;
  const title = cleanTitle(input.title); if (!title) throw err("Le titre de la leçon est obligatoire.");
  const wantsUrl = Boolean(input.video_url && String(input.video_url).trim());
  const parsed = wantsUrl ? parseVideoUrl(String(input.video_url)) : null;
  if (wantsUrl && !parsed) throw err("Lien vidéo invalide : utilisez une adresse https:// (YouTube, Vimeo, fichier .mp4) ou l'identifiant d'une vidéo Bunny Stream.");
  let videoPath = l.video_path, videoUrl = l.video_url, drop = null;
  if (parsed) { drop = videoPath; videoPath = null; videoUrl = parsed.url; } else if (input.remove_video) { drop = videoPath; videoPath = null; videoUrl = null; }
  tx(db, () => {
    db.prepare("UPDATE lessons SET title = ?, description = ?, duration_minutes = ?, is_preview = ?, video_path = ?, video_url = ? WHERE id = ?")
      .run(title, text(input.description, 50000), Math.max(0, Math.min(10000, parseInt(input.duration_minutes, 10) || 0)), input.is_preview ? 1 : 0, videoPath, videoUrl, id);
    const target = parseInt(input.section_id, 10);
    if (target && target !== l.section_id && sectionIds(db, l.course_id).includes(target)) {
      writeLessons(db, l.section_id, lessonIds(db, l.section_id).filter((x) => x !== id));
      writeLessons(db, target, [...lessonIds(db, target), id]);
    }
  });
  if (drop) removeUploadedFile(drop, "vidéo remplacée (CMS)");
  touch(db, l.course_id); return l.course_id;
}
function moveLesson(db, siteId, id, dir) {
  const l = lessonOf(db, siteId, id); if (!l) return null;
  const d = dir === "haut" ? -1 : dir === "bas" ? 1 : 0; if (!d) throw err("Direction inconnue.");
  tx(db, () => {
    const ids = lessonIds(db, l.section_id), from = ids.indexOf(id), to = from + d;
    if (to >= 0 && to < ids.length) { ids.splice(to, 0, ids.splice(from, 1)[0]); writeLessons(db, l.section_id, ids); return; }
    const secs = sectionIds(db, l.course_id), si = secs.indexOf(l.section_id), ni = si + d;
    if (ni < 0 || ni >= secs.length) return; // déjà en tête / en queue du programme
    writeLessons(db, l.section_id, ids.filter((x) => x !== id));
    const next = lessonIds(db, secs[ni]);
    writeLessons(db, secs[ni], d < 0 ? [...next, id] : [id, ...next]);
  });
  touch(db, l.course_id); return l.course_id;
}
function deleteLesson(db, siteId, id) {
  const l = lessonOf(db, siteId, id); if (!l) return null;
  const files = lessonFiles(db, [id]);
  tx(db, () => { db.prepare("DELETE FROM lessons WHERE id = ?").run(id); writeLessons(db, l.section_id, lessonIds(db, l.section_id)); });
  files.forEach((f) => removeUploadedFile(f, "leçon supprimée (CMS)")); touch(db, l.course_id); return l.course_id;
}

module.exports = { scope, courseOf, sectionOf, lessonOf, curriculum, createCourse, updateCourse, duplicateCourse, deleteCourse, addSection, renameSection, moveSection, deleteSection, addLesson, updateLesson, moveLesson, deleteLesson, cleanTitle, LEVELS };
