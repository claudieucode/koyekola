// Centre de gestion — Ventes : commandes (données réelles, limitées aux formations du formateur) et codes promo.
// Paiement : le site enregistre les commandes avec un paiement SIMULÉ (aucun prestataire connecté) — aucune transaction
// bancaire ni remboursement n'existe donc à afficher ; l'interface le dit sans rien inventer.
const db = require("../../config/database");
const siteScope = require("../siteScope");
// Portée de site (courses.site_id ; NULL = site principal) : toute lecture du Centre de gestion est limitée aux formations du site actif
const L = (siteId, alias) => siteScope.lit(siteId, alias);
const { paginate, page, likeOf, cleanQ, isYmd, parisDayStart, addDays, sqlUtc } = require("./common");

const ORDER_SORTS = { recent: "o.created_at DESC, o.id DESC", ancien: "o.created_at ASC, o.id ASC", montant: "amount DESC, o.id DESC", "montant-asc": "amount ASC, o.id ASC" };

// Commandes contenant au moins une formation du formateur ; montant = part du formateur (lignes de ses formations)
function listOrders(instructorId, query = {}, siteId = null) {
  const q = cleanQ(query.q);
  const where = ["c.instructor_id = ?" + L(siteId, "c") + ""], args = [instructorId];
  if (q) {
    const num = /^#?\d+$/.test(q) ? Number(q.replace("#", "")) : null;
    where.push(`(${num ? "o.id = ? OR " : ""}u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR c.title LIKE ? ESCAPE '\\' OR o.coupon_code LIKE ? ESCAPE '\\')`);
    if (num) args.push(num);
    args.push(likeOf(q), likeOf(q), likeOf(q), likeOf(q));
  }
  const course = Number.parseInt(query.formation, 10);
  if (course) { where.push("c.id = ?"); args.push(course); }
  if (isYmd(query.du)) { where.push("o.created_at >= ?"); args.push(sqlUtc(parisDayStart(query.du))); }
  if (isYmd(query.au)) { where.push("o.created_at < ?"); args.push(sqlUtc(parisDayStart(addDays(query.au, 1)))); }
  if (query.promo === "oui") where.push("o.coupon_id IS NOT NULL");
  if (query.promo === "non") where.push("o.coupon_id IS NULL");
  const sort = ORDER_SORTS[query.tri] ? query.tri : "recent";
  const base = `FROM orders o JOIN users u ON u.id = o.user_id JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id WHERE ${where.join(" AND ")}`;
  const total = db.prepare(`SELECT COUNT(DISTINCT o.id) n ${base}`).get(...args).n;
  const pg = paginate(total, page(query));
  const rows = db.prepare(`SELECT o.id, o.created_at, o.coupon_code, o.discount_cents, u.id AS user_id, u.username, u.email, SUM(oi.price_cents) AS amount, GROUP_CONCAT(c.title, ' · ') AS courses, COUNT(oi.id) AS items
    ${base} GROUP BY o.id ORDER BY ${ORDER_SORTS[sort]} LIMIT ? OFFSET ?`).all(...args, pg.limit, pg.offset);
  const sum = db.prepare(`SELECT COALESCE(SUM(oi.price_cents), 0) s ${base}`).get(...args).s;
  return { rows, ...pg, sort, q, sumCents: sum };
}

// Détail : uniquement si la commande contient une formation du formateur ; lignes des autres formateurs masquées
function getOrder(instructorId, id, siteId = null) {
  const order = db.prepare(`SELECT o.*, u.username, u.email, u.created_at AS user_created_at FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?
    AND EXISTS (SELECT 1 FROM order_items oi JOIN courses c ON c.id = oi.course_id WHERE oi.order_id = o.id AND c.instructor_id = ?${L(siteId, "c")})`).get(id, instructorId);
  if (!order) return null;
  const items = db.prepare(`SELECT oi.*, c.title, c.slug, c.id AS course_id, (c.instructor_id = ?${L(siteId, "c")}) AS mine,
      (SELECT created_at FROM enrollments e WHERE e.user_id = ? AND e.course_id = c.id) AS enrolled_at,
      (SELECT COUNT(*) FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id) AS lessons,
      (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id AND lp.user_id = ?) AS done
    FROM order_items oi JOIN courses c ON c.id = oi.course_id WHERE oi.order_id = ? ORDER BY oi.id`).all(instructorId, order.user_id, order.user_id, order.id);
  const mine = items.filter((i) => i.mine);
  // Paiement réel (Stripe) ou non : lu dans la session de paiement qui a créé la commande ; remboursements annoncés par Stripe (palier 20)
  const paid = db.prepare("SELECT 1 FROM checkout_sessions WHERE order_id = ? AND stripe_session_id IS NOT NULL").get(order.id);
  const refunds = db.prepare("SELECT id, amount_cents, created_at FROM order_refunds WHERE order_id = ? ORDER BY id").all(order.id);
  return { order, items: mine, otherItems: items.length - mine.length, myAmount: mine.reduce((s, i) => s + i.price_cents, 0), stripePaid: Boolean(paid), refunds, refundedCents: refunds.reduce((n, r) => n + r.amount_cents, 0) };
}

function myCourses(instructorId, siteId = null) {
  return db.prepare(`SELECT id, title, price_cents FROM courses WHERE instructor_id = ?${L(siteId)} ORDER BY title COLLATE NOCASE`).all(instructorId);
}

// ---------- Codes promo ----------
const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;
function couponUses(couponId) { return db.prepare("SELECT COUNT(*) n FROM orders WHERE coupon_id = ?").get(couponId).n; }
function listCoupons(instructorId) {
  return db.prepare(`SELECT cp.*, c.title AS course_title, (SELECT COUNT(*) FROM orders o WHERE o.coupon_id = cp.id) AS uses,
      (SELECT COALESCE(SUM(o.discount_cents), 0) FROM orders o WHERE o.coupon_id = cp.id) AS discount_total
    FROM coupons cp LEFT JOIN courses c ON c.id = cp.course_id WHERE cp.instructor_id = ? ORDER BY cp.created_at DESC, cp.id DESC`).all(instructorId).map((c) => ({ ...c, state: couponState(c, c.uses) }));
}
function getCoupon(instructorId, id) { return db.prepare("SELECT * FROM coupons WHERE id = ? AND instructor_id = ?").get(id, instructorId) || null; }

// État lisible : active / désactivé / pas encore commencé / expiré / épuisé
function couponState(c, uses, now = new Date()) {
  const t = now.toISOString().slice(0, 19).replace("T", " ");
  if (!c.active) return { key: "off", label: "Désactivé" };
  if (c.starts_at && t < c.starts_at) return { key: "soon", label: "Pas encore commencé" };
  if (c.expires_at && t >= c.expires_at) return { key: "expired", label: "Expiré" };
  if (c.max_uses && uses >= c.max_uses) return { key: "exhausted", label: "Limite atteinte" };
  return { key: "on", label: "Actif" };
}

// Validation complète d'un formulaire de code promo → { values } ou { errors: { champ: message } }
function validateCoupon(instructorId, input, currentId = null) {
  const errors = {}, v = {};
  v.code = String(input.code || "").trim().toUpperCase();
  if (!CODE_RE.test(v.code)) errors.code = "3 à 30 caractères : lettres, chiffres, tiret ou souligné (sans espace).";
  else {
    const taken = db.prepare("SELECT id FROM coupons WHERE code = ? COLLATE NOCASE").get(v.code);
    if (taken && taken.id !== currentId) errors.code = "Ce code existe déjà.";
  }
  v.kind = input.kind === "fixed" ? "fixed" : input.kind === "percent" ? "percent" : null;
  if (!v.kind) errors.kind = "Choisissez un pourcentage ou un montant.";
  const raw = String(input.value || "").replace(",", ".").trim();
  if (v.kind === "percent") {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 100) errors.value = "Pourcentage entier de 1 à 100.";
    else v.value = n;
  } else if (v.kind === "fixed") {
    const n = Math.round(Number(raw) * 100);
    if (!/^\d+(\.\d{1,2})?$/.test(raw) || n < 1 || n > 1000000) errors.value = "Montant en euros, de 0,01 à 10 000 (deux décimales au plus).";
    else v.value = n;
  }
  v.course_id = null;
  if (input.course_id) {
    const c = db.prepare("SELECT id FROM courses WHERE id = ? AND instructor_id = ?").get(Number(input.course_id), instructorId);
    if (!c) errors.course_id = "Formation inconnue."; else v.course_id = c.id;
  }
  const day = (field, endOfDay) => {
    const val = String(input[field] || "").trim();
    if (!val) return null;
    if (!isYmd(val)) { errors[field] = "Date invalide."; return null; }
    return sqlUtc(parisDayStart(endOfDay ? addDays(val, 1) : val)); // fin : le code reste valable toute la journée choisie
  };
  v.starts_at = day("starts_at", false);
  v.expires_at = day("expires_at", true);
  if (v.starts_at && v.expires_at && v.expires_at <= v.starts_at) errors.expires_at = "La date de fin doit suivre la date de début.";
  const max = String(input.max_uses || "").trim();
  v.max_uses = null;
  if (max) { const n = Number(max); if (!Number.isInteger(n) || n < 1 || n > 1000000) errors.max_uses = "Nombre entier d'utilisations (1 ou plus), ou vide pour illimité."; else v.max_uses = n; }
  v.active = input.active === "on" || input.active === "1" || input.active === true ? 1 : 0;
  return Object.keys(errors).length ? { errors, values: v } : { values: v };
}
function createCoupon(instructorId, values) {
  const r = db.prepare("INSERT INTO coupons (instructor_id, code, kind, value, course_id, starts_at, expires_at, max_uses, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(instructorId, values.code, values.kind, values.value, values.course_id, values.starts_at, values.expires_at, values.max_uses, values.active);
  return Number(r.lastInsertRowid);
}
function updateCoupon(instructorId, id, values) {
  db.prepare("UPDATE coupons SET code = ?, kind = ?, value = ?, course_id = ?, starts_at = ?, expires_at = ?, max_uses = ?, active = ?, updated_at = datetime('now') WHERE id = ? AND instructor_id = ?")
    .run(values.code, values.kind, values.value, values.course_id, values.starts_at, values.expires_at, values.max_uses, values.active, id, instructorId);
}
function setCouponActive(instructorId, id, active) { return db.prepare("UPDATE coupons SET active = ?, updated_at = datetime('now') WHERE id = ? AND instructor_id = ?").run(active ? 1 : 0, id, instructorId).changes === 1; }
// Suppression : les commandes passées gardent le code et la remise (coupon_id mis à vide par la base)
function deleteCoupon(instructorId, id) { return db.prepare("DELETE FROM coupons WHERE id = ? AND instructor_id = ?").run(id, instructorId).changes === 1; }

// ---------- Application au paiement ----------
// items : formations du panier ({ id, price_cents, instructor_id }). Remise répartie sur les formations éligibles
// (celles du formateur du code, ou la seule formation visée), jamais au-delà de leur prix.
// → { coupon, discount, lines: Map(courseId → montant payé) } ou { error }
function applyCoupon(code, items, now = new Date()) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return { error: "Saisissez un code promo." };
  const c = db.prepare("SELECT * FROM coupons WHERE code = ? COLLATE NOCASE").get(clean);
  if (!c) return { error: "Code promo inconnu." };
  const state = couponState(c, couponUses(c.id), now);
  if (state.key !== "on") return { error: { off: "Ce code promo n'est plus actif.", soon: "Ce code promo n'est pas encore valable.", expired: "Ce code promo a expiré.", exhausted: "Ce code promo a atteint sa limite d'utilisation." }[state.key] };
  const eligible = items.filter((i) => i.price_cents > 0 && i.instructor_id === c.instructor_id && (!c.course_id || i.id === c.course_id));
  if (!eligible.length) return { error: c.course_id ? "Ce code ne s'applique pas aux formations de votre panier." : "Ce code ne s'applique à aucune formation de votre panier." };
  const base = eligible.reduce((s, i) => s + i.price_cents, 0);
  let discount = c.kind === "percent" ? Math.round((base * c.value) / 100) : Math.min(c.value, base);
  discount = Math.min(discount, base);
  // Répartition proportionnelle, reste d'arrondi sur la dernière formation éligible
  const lines = new Map(items.map((i) => [i.id, i.price_cents]));
  let left = discount;
  eligible.forEach((i, idx) => {
    const part = idx === eligible.length - 1 ? left : Math.min(left, Math.round((discount * i.price_cents) / base));
    lines.set(i.id, i.price_cents - part);
    left -= part;
  });
  return { coupon: c, discount, lines };
}

module.exports = { listOrders, getOrder, myCourses, listCoupons, getCoupon, couponState, couponUses, validateCoupon, createCoupon, updateCoupon, setCouponActive, deleteCoupon, applyCoupon, ORDER_SORTS };
