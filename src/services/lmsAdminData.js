// Données de l'espace « Formations » intégré au CMS (lecture + publication). AUCUNE logique pédagogique nouvelle : mêmes tables que le LMS existant
// (courses, sections, lessons, enrollments, lesson_progress, certificats, commandes). L'isolation vient UNIQUEMENT de lmsSites.scopeSql(siteId) :
// siteId = null → formations du site principal ; siteId = n → formations rattachées au site n (mk_course_sites OU courses.site_id, voir lmsBuilderData.scope) ; autre valeur → rien.
// Le site est toujours déduit côté serveur (adresse vérifiée), jamais d'un paramètre du navigateur.
const { scope: unifiedScope } = require("./lmsBuilderData");

const PER_PAGE = 20;
const like = (q) => `%${String(q || "").trim().replace(/[\\%_]/g, (c) => `\\${c}`).slice(0, 80)}%`;
const page = (v) => Math.max(1, Number.parseInt(v, 10) || 1);
const scope = (db, siteId, alias = "c") => unifiedScope(db, siteId, alias);

// Une ligne par inscription du site, avec leçons totales et terminées (progression réelle, jamais estimée).
const PROGRESS_CTE = `WITH tl AS (SELECT s.course_id, COUNT(l.id) n FROM sections s JOIN lessons l ON l.section_id = s.id GROUP BY s.course_id),
  dn AS (SELECT s.course_id, lp.user_id, COUNT(*) d FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id GROUP BY s.course_id, lp.user_id)`;
const ENR = `FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = e.user_id LEFT JOIN tl ON tl.course_id = e.course_id LEFT JOIN dn ON dn.course_id = e.course_id AND dn.user_id = e.user_id`;

function overview(db, siteId) {
  const sc = scope(db, siteId);
  const courses = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(c.published), 0) published FROM courses c WHERE ${sc.sql}`).get(...sc.params);
  const enr = db.prepare(`${PROGRESS_CTE} SELECT COUNT(*) enrollments, COUNT(DISTINCT e.user_id) students,
      COALESCE(SUM(CASE WHEN e.created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END), 0) recent,
      COALESCE(SUM(CASE WHEN COALESCE(tl.n, 0) > 0 AND COALESCE(dn.d, 0) >= tl.n THEN 1 ELSE 0 END), 0) completed,
      COALESCE(SUM(CASE WHEN COALESCE(dn.d, 0) > 0 AND (COALESCE(tl.n, 0) = 0 OR dn.d < tl.n) THEN 1 ELSE 0 END), 0) inProgress,
      AVG(CASE WHEN COALESCE(tl.n, 0) > 0 THEN 100.0 * MIN(COALESCE(dn.d, 0), tl.n) / tl.n END) avgProgress
    ${ENR} WHERE ${sc.sql}`).get(...sc.params);
  const rev = db.prepare(`SELECT COALESCE(SUM(oi.price_cents), 0) cents, COUNT(DISTINCT oi.order_id) orders FROM order_items oi JOIN courses c ON c.id = oi.course_id WHERE ${sc.sql}`).get(...sc.params);
  const paid = db.prepare(`SELECT COUNT(*) n FROM courses c WHERE c.price_cents > 0 AND ${sc.sql}`).get(...sc.params).n;
  return {
    courses: courses.total, published: courses.published, drafts: courses.total - courses.published, paidCourses: paid,
    students: enr.students, enrollments: enr.enrollments, recent: enr.recent, completed: enr.completed, inProgress: enr.inProgress,
    avgProgress: enr.avgProgress === null ? null : Math.round(enr.avgProgress), revenueCents: rev.cents, orders: rev.orders,
  };
}

function recentEnrollments(db, siteId, limit = 6) {
  const sc = scope(db, siteId);
  return db.prepare(`${PROGRESS_CTE} SELECT e.created_at, u.id user_id, u.username, u.email, c.id course_id, c.title,
      CASE WHEN COALESCE(tl.n, 0) > 0 THEN CAST(ROUND(100.0 * MIN(COALESCE(dn.d, 0), tl.n) / tl.n) AS INTEGER) ELSE 0 END progress
    ${ENR} WHERE ${sc.sql} ORDER BY e.created_at DESC, e.id DESC LIMIT ?`).all(...sc.params, limit);
}

function topCourses(db, siteId, limit = 5) {
  const sc = scope(db, siteId);
  return db.prepare(`SELECT c.id, c.title, c.published, COUNT(e.id) students FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE ${sc.sql} GROUP BY c.id ORDER BY students DESC, c.updated_at DESC LIMIT ?`).all(...sc.params, limit);
}

function recentlyEdited(db, siteId, limit = 5) {
  const sc = scope(db, siteId);
  return db.prepare(`SELECT c.id, c.title, c.published, c.updated_at FROM courses c WHERE ${sc.sql} ORDER BY c.updated_at DESC, c.id DESC LIMIT ?`).all(...sc.params, limit);
}

// Inscriptions par jour sur 30 jours (jours sans inscription = 0), pour la courbe du tableau de bord.
function enrollmentsByDay(db, siteId, days = 30) {
  const sc = scope(db, siteId);
  const rows = db.prepare(`SELECT date(e.created_at) d, COUNT(*) n FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.created_at >= datetime('now', ?) AND ${sc.sql} GROUP BY d`).all(`-${days - 1} days`, ...sc.params);
  const map = new Map(rows.map((r) => [r.d, r.n]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) { const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); out.push({ day, n: map.get(day) || 0 }); }
  return out;
}

const SORTS = { recent: "c.updated_at DESC, c.id DESC", title: "c.title COLLATE NOCASE ASC", students: "students DESC, c.id DESC", price: "c.price_cents DESC, c.id DESC" };
function listCourses(db, siteId, { q, status, sort, page: p } = {}) {
  const sc = scope(db, siteId);
  const where = [sc.sql], args = [...sc.params];
  if (q && String(q).trim()) { where.push("(c.title LIKE ? ESCAPE '\\' OR c.category LIKE ? ESCAPE '\\')"); args.push(like(q), like(q)); }
  if (status === "published") where.push("c.published = 1"); else if (status === "draft") where.push("c.published = 0");
  const total = db.prepare(`SELECT COUNT(*) n FROM courses c WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE)), cur = Math.min(page(p), pages);
  const items = db.prepare(`SELECT c.id, c.title, c.slug, c.category, c.level, c.price_cents, c.thumbnail_path, c.published, c.updated_at, u.username instructor,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) students,
      (SELECT COUNT(*) FROM sections s JOIN lessons l ON l.section_id = s.id WHERE s.course_id = c.id) lessons
    FROM courses c JOIN users u ON u.id = c.instructor_id WHERE ${where.join(" AND ")} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (cur - 1) * PER_PAGE);
  return { items, total, page: cur, pages };
}

function listStudents(db, siteId, { q, courseId, page: p } = {}) {
  const sc = scope(db, siteId);
  const where = [sc.sql], args = [...sc.params];
  if (q && String(q).trim()) { where.push("(u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"); args.push(like(q), like(q)); }
  if (Number.isInteger(courseId)) { where.push("e.course_id = ?"); args.push(courseId); }
  const total = db.prepare(`${PROGRESS_CTE} SELECT COUNT(*) n ${ENR} WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE)), cur = Math.min(page(p), pages);
  const items = db.prepare(`${PROGRESS_CTE} SELECT e.created_at, u.id user_id, u.username, u.email, c.id course_id, c.title, COALESCE(tl.n, 0) lessons, COALESCE(dn.d, 0) done,
      (SELECT MAX(lp.completed_at) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id AND lp.user_id = u.id) last_activity,
      CASE WHEN COALESCE(tl.n, 0) > 0 THEN CAST(ROUND(100.0 * MIN(COALESCE(dn.d, 0), tl.n) / tl.n) AS INTEGER) ELSE 0 END progress
    ${ENR} WHERE ${where.join(" AND ")} ORDER BY e.created_at DESC, e.id DESC LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (cur - 1) * PER_PAGE);
  return { items, total, page: cur, pages };
}

function siteCourseChoices(db, siteId) {
  const sc = scope(db, siteId);
  return db.prepare(`SELECT c.id, c.title FROM courses c WHERE ${sc.sql} ORDER BY c.title COLLATE NOCASE LIMIT 200`).all(...sc.params);
}

function listCertificates(db, siteId, { q, page: p } = {}) {
  const sc = scope(db, siteId);
  const where = [sc.sql], args = [...sc.params];
  if (q && String(q).trim()) { where.push("(ce.student_name LIKE ? ESCAPE '\\' OR ce.course_title LIKE ? ESCAPE '\\' OR ce.code LIKE ? ESCAPE '\\')"); args.push(like(q), like(q), like(q)); }
  const from = "FROM certificates ce JOIN courses c ON c.id = ce.course_id";
  const total = db.prepare(`SELECT COUNT(*) n ${from} WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE)), cur = Math.min(page(p), pages);
  const items = db.prepare(`SELECT ce.code, ce.student_name, ce.course_title, ce.issued_at, ce.revoked_at ${from} WHERE ${where.join(" AND ")} ORDER BY ce.issued_at DESC, ce.id DESC LIMIT ? OFFSET ?`).all(...args, PER_PAGE, (cur - 1) * PER_PAGE);
  return { items, total, page: cur, pages };
}

// Publier / dépublier : seulement une formation DE CE SITE (sinon false, jamais d'effet ailleurs). Renvoie true si une ligne a changé.
function setPublished(db, siteId, courseId, published) {
  if (!Number.isInteger(courseId)) return false;
  const sc = scope(db, siteId, "courses");
  return db.prepare(`UPDATE courses SET published = ?, updated_at = datetime('now') WHERE id = ? AND ${sc.sql}`).run(published ? 1 : 0, courseId, ...sc.params).changes > 0;
}

module.exports = { PER_PAGE, overview, recentEnrollments, topCourses, recentlyEdited, enrollmentsByDay, listCourses, listStudents, listCertificates, siteCourseChoices, setPublished };
