// Centre de gestion — Analytics : indicateurs calculés sur les données réelles de la période choisie (formations du
// formateur). Aucun chiffre estimé : ce qui n'est pas mesuré par le site (visites, conversion) est déclaré indisponible.
const db = require("../../config/database");
const { addDays, parisDayStart, sqlUtc } = require("./common");

// Agrégat par jour, semaine ou mois selon la longueur de la période (≤ 31 j : jour ; ≤ 180 j : semaine ; sinon mois)
function bucketsOf(p) {
  const unit = p.days <= 31 ? "day" : p.days <= 180 ? "week" : "month";
  const out = [];
  let cur = p.fromYmd;
  while (cur <= p.toYmd) {
    let next;
    if (unit === "day") next = addDays(cur, 1);
    else if (unit === "week") next = addDays(cur, 7);
    else { const [y, m] = cur.split("-").map(Number); next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); }
    if (next > addDays(p.toYmd, 1)) next = addDays(p.toYmd, 1);
    out.push({ fromYmd: cur, from: sqlUtc(parisDayStart(cur)), to: sqlUtc(parisDayStart(next)), label: label(cur, unit) });
    cur = next;
  }
  return { unit, buckets: out };
}
function label(ymd, unit) {
  const d = new Date(`${ymd}T12:00:00Z`);
  if (unit === "month") return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
}

function report(instructorId, p) {
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const SALES = "FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN courses c ON c.id = oi.course_id WHERE c.instructor_id = ? AND o.created_at >= ? AND o.created_at < ?";
  const sales = one(`SELECT COALESCE(SUM(oi.price_cents), 0) revenue, COUNT(DISTINCT o.id) orders, COUNT(DISTINCT CASE WHEN o.total_cents > 0 THEN o.id END) paid_orders, COUNT(*) items, COALESCE(SUM(CASE WHEN o.coupon_id IS NOT NULL THEN 1 ELSE 0 END), 0) promo_items ${SALES}`, instructorId, p.from, p.to);
  const discount = one(`SELECT COALESCE(SUM(o.discount_cents), 0) d, COUNT(*) n FROM orders o JOIN coupons cp ON cp.id = o.coupon_id WHERE cp.instructor_id = ? AND o.created_at >= ? AND o.created_at < ?`, instructorId, p.from, p.to);
  const enrollments = one("SELECT COUNT(*) n, COUNT(DISTINCT e.user_id) students FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ? AND e.created_at >= ? AND e.created_at < ?", instructorId, p.from, p.to);
  const newStudents = one(`SELECT COUNT(*) n FROM (SELECT e.user_id, MIN(e.created_at) first FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ? GROUP BY e.user_id) WHERE first >= ? AND first < ?`, instructorId, p.from, p.to).n;
  const lessons = one("SELECT COUNT(*) n FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.instructor_id = ? AND lp.completed_at >= ? AND lp.completed_at < ?", instructorId, p.from, p.to).n;
  const reviews = one("SELECT COUNT(*) n, AVG(r.rating) avg FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.instructor_id = ? AND r.created_at >= ? AND r.created_at < ?", instructorId, p.from, p.to);

  // Séries (une requête par série, regroupée côté base)
  const { unit, buckets } = bucketsOf(p);
  const series = (sql) => {
    const stmt = db.prepare(sql);
    return buckets.map((b) => stmt.get(instructorId, b.from, b.to).v || 0);
  };
  const revenueSeries = series(`SELECT COALESCE(SUM(oi.price_cents), 0) v ${SALES}`);
  const enrollSeries = series("SELECT COUNT(*) v FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = ? AND e.created_at >= ? AND e.created_at < ?");

  // Performances par formation (période) : ventes, inscriptions, progression moyenne (tous inscrits, état actuel)
  const courses = db.prepare(`SELECT c.id, c.title, c.published, c.price_cents,
      (SELECT COALESCE(SUM(oi.price_cents), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.course_id = c.id AND o.created_at >= ? AND o.created_at < ?) AS revenue,
      (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.course_id = c.id AND o.created_at >= ? AND o.created_at < ?) AS sales,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.created_at >= ? AND e.created_at < ?) AS enrollments,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students,
      (SELECT COUNT(*) FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id) AS lessons,
      (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id JOIN enrollments e ON e.user_id = lp.user_id AND e.course_id = c.id WHERE s.course_id = c.id) AS done
    FROM courses c WHERE c.instructor_id = ? AND c.archived = 0 ORDER BY revenue DESC, enrollments DESC, c.title COLLATE NOCASE`).all(p.from, p.to, p.from, p.to, p.from, p.to, instructorId)
    .map((c) => ({ ...c, avgProgress: c.students && c.lessons ? Math.round((c.done / (c.students * c.lessons)) * 100) : null }));

  // Ventes par offre (période) : nom conservé sur la ligne de commande même si l'offre est supprimée ensuite.
  // Les lignes sans offre sont « au prix standard ». Montants = payé réellement (après offre et code promo).
  const offerRows = db.prepare(`SELECT COALESCE(oi.offer_name, '') AS name, COUNT(*) sales, COALESCE(SUM(oi.price_cents), 0) revenue ${SALES} GROUP BY COALESCE(oi.offer_name, '') ORDER BY revenue DESC, sales DESC`).all(instructorId, p.from, p.to);
  const offers = { standard: offerRows.find((r) => r.name === "") || { sales: 0, revenue: 0 }, list: offerRows.filter((r) => r.name !== "") };

  // Lectures des articles du blog : seul un total cumulé existe (pas de date de lecture) → pas de chiffre par période
  const blogViews = one("SELECT COALESCE(SUM(views), 0) v FROM posts WHERE published = 1").v;

  return {
    kpis: { revenue: sales.revenue, orders: sales.orders, average: sales.paid_orders ? Math.round(sales.revenue / sales.paid_orders) : null, enrollments: enrollments.n, newStudents, lessons, reviews: reviews.n, rating: reviews.avg ? Math.round(reviews.avg * 10) / 10 : null, discount: discount.d, promoOrders: discount.n },
    unit, labels: buckets.map((b) => b.label), revenueSeries, enrollSeries, courses, offers, blogViews,
  };
}

module.exports = { report, bucketsOf };
