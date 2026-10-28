// Centre de gestion — Élèves : comptes inscrits à au moins une formation du formateur (données réelles).
// Progression = leçons terminées / leçons de la formation (lesson_progress), calculée à la demande.
const db = require("../../config/database");
const siteScope = require("../siteScope");
// Portée de site (courses.site_id ; NULL = site principal) : toute lecture du Centre de gestion est limitée aux formations du site actif
const L = (siteId, alias) => siteScope.lit(siteId, alias);
const { paginate, page, likeOf, cleanQ, isYmd, parisDayStart, addDays, sqlUtc } = require("./common");

const SORTS = { recent: "first_enrolled DESC, u.id DESC", ancien: "first_enrolled ASC, u.id ASC", nom: "u.username COLLATE NOCASE ASC", depense: "spent DESC, u.id DESC", formations: "courses DESC, u.id DESC" };
const spentOf = (siteId) => `(SELECT COALESCE(SUM(oi.price_cents), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c2 ON c2.id = oi.course_id WHERE o.user_id = u.id AND c2.instructor_id = ?${L(siteId, "c2")})`;

function listStudents(instructorId, query = {}, siteId = null) {
  const q = cleanQ(query.q);
  const where = ["c.instructor_id = ?" + L(siteId, "c") + ""], args = [instructorId];
  if (q) { where.push("(u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"); args.push(likeOf(q), likeOf(q)); }
  const course = Number.parseInt(query.formation, 10);
  if (course) { where.push("c.id = ?"); args.push(course); }
  if (isYmd(query.du)) { where.push("e.created_at >= ?"); args.push(sqlUtc(parisDayStart(query.du))); }
  if (isYmd(query.au)) { where.push("e.created_at < ?"); args.push(sqlUtc(parisDayStart(addDays(query.au, 1)))); }
  const having = query.achats === "oui" ? "HAVING spent > 0" : query.achats === "non" ? "HAVING spent = 0" : "";
  const sort = SORTS[query.tri] ? query.tri : "recent";
  const inner = `SELECT u.id, u.username, u.email, u.created_at, MIN(e.created_at) AS first_enrolled, COUNT(DISTINCT e.course_id) AS courses, ${spentOf(siteId)} AS spent
    FROM users u JOIN enrollments e ON e.user_id = u.id JOIN courses c ON c.id = e.course_id WHERE ${where.join(" AND ")} GROUP BY u.id ${having}`;
  const total = db.prepare(`SELECT COUNT(*) n FROM (${inner})`).get(instructorId, ...args).n;
  const pg = paginate(total, page(query));
  const rows = db.prepare(`${inner} ORDER BY ${SORTS[sort]} LIMIT ? OFFSET ?`).all(instructorId, ...args, pg.limit, pg.offset);
  // Progression moyenne et dernière activité de chaque élève affiché (20 au plus : requêtes ciblées)
  for (const r of rows) {
    const prog = progressOf(instructorId, r.id, siteId);
    r.progress = prog.length ? Math.round(prog.reduce((s, p) => s + p.percent, 0) / prog.length) : null;
    r.last_activity = db.prepare(`SELECT MAX(lp.completed_at) t FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE lp.user_id = ? AND c.instructor_id = ?${L(siteId, "c")}`).get(r.id, instructorId).t;
  }
  return { rows, ...pg, sort, q };
}

// Progression réelle par formation du formateur suivie par l'élève
function progressOf(instructorId, userId, siteId = null) {
  return db.prepare(`SELECT c.id, c.title, c.slug, e.created_at AS enrolled_at,
      (SELECT COUNT(*) FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id) AS lessons,
      (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id AND lp.user_id = e.user_id) AS done,
      (SELECT MAX(lp.completed_at) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id AND lp.user_id = e.user_id) AS last_done,
      EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = e.user_id AND oi.course_id = c.id) AS bought
    FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? AND c.instructor_id = ?${L(siteId, "c")} ORDER BY e.created_at DESC`).all(userId, instructorId)
    .map((r) => ({ ...r, percent: r.lessons ? Math.round((r.done / r.lessons) * 100) : 0 }));
}

// Profil : seulement un élève inscrit à au moins une formation du formateur
function getStudent(instructorId, userId, siteId = null) {
  const user = db.prepare(`SELECT u.id, u.username, u.email, u.created_at FROM users u WHERE u.id = ?
    AND EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = u.id AND c.instructor_id = ?${L(siteId, "c")})`).get(userId, instructorId);
  if (!user) return null;
  const courses = progressOf(instructorId, userId, siteId);
  const orders = db.prepare(`SELECT o.id, o.created_at, o.coupon_code, SUM(oi.price_cents) AS amount, GROUP_CONCAT(c.title, ' · ') AS titles
    FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id WHERE o.user_id = ? AND c.instructor_id = ?${L(siteId, "c")} GROUP BY o.id ORDER BY o.created_at DESC`).all(userId, instructorId);
  // Activité récente réelle : leçons terminées, avis, commentaires sur le blog
  const activity = db.prepare(`SELECT * FROM (
      SELECT 'lesson' AS kind, lp.completed_at AS at, l.title AS label, c.title AS context, c.id AS course_id FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE lp.user_id = ? AND c.instructor_id = ?${L(siteId, "c")}
      UNION ALL SELECT 'review', r.created_at, r.rating || '/5', c.title, c.id FROM reviews r JOIN courses c ON c.id = r.course_id WHERE r.user_id = ? AND c.instructor_id = ?${L(siteId, "c")}
      UNION ALL SELECT 'enrolled', e.created_at, c.title, '', c.id FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? AND c.instructor_id = ?${L(siteId, "c")}
    ) ORDER BY at DESC LIMIT 15`).all(userId, instructorId, userId, instructorId, userId, instructorId);
  const spent = orders.reduce((s, o) => s + o.amount, 0);
  return { user, courses, orders, activity, spent };
}

module.exports = { listStudents, getStudent, progressOf, SORTS };
