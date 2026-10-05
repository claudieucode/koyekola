const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { sendPurchaseWelcomeEmail } = require("../utils/mailer");
const sales = require("../services/gestion/sales");
const { paidCheckoutOpen } = require("../services/payment");

const router = express.Router();

// Formations du panier qui peuvent réellement être achetées maintenant : publiées et pas déjà possédées.
// (Une formation dépubliée depuis l'ajout au panier, ou achetée entre-temps, en est écartée.)
function getPurchasableItems(req) {
  const ids = Object.keys(req.session.cart || {});
  if (!ids.length) return [];
  return db
    .prepare(
      `SELECT * FROM courses
       WHERE id IN (${ids.map(() => "?").join(",")}) AND published = 1
         AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)`
    )
    .all(...ids, req.session.user.id);
}

// Le panier ne garde que ce qui reste achetable
function syncCart(req, items) {
  req.session.cart = Object.fromEntries(items.map((c) => [c.id, true]));
}

// Code promo de la session, revérifié à chaque affichage (un code expiré ou épuisé entre-temps est retiré, avec la raison)
function pricing(req, items) {
  const subtotal = items.reduce((sum, c) => sum + c.price_cents, 0);
  const code = req.session.coupon;
  if (!code) return { subtotal, total: subtotal, discount: 0, coupon: null, couponError: null, lines: new Map(items.map((i) => [i.id, i.price_cents])) };
  const r = sales.applyCoupon(code, items);
  if (r.error) { delete req.session.coupon; return { subtotal, total: subtotal, discount: 0, coupon: null, couponError: `Code « ${code} » retiré : ${r.error}`, lines: new Map(items.map((i) => [i.id, i.price_cents])) }; }
  return { subtotal, total: subtotal - r.discount, discount: r.discount, coupon: r.coupon, couponError: null, lines: r.lines };
}

router.get("/commande", requireAuth, (req, res) => {
  const items = getPurchasableItems(req);
  syncCart(req, items);
  if (!items.length) return res.redirect("/panier");
  const p = pricing(req, items);
  const flash = req.session.couponFlash || null;
  delete req.session.couponFlash;
  res.render("checkout", { items, total: p.total, subtotal: p.subtotal, discount: p.discount, coupon: p.coupon, couponError: p.couponError || (flash && flash.error) || null, couponOk: flash && flash.ok, orderError: (flash && flash.orderError) || null });
});

// Code promo : vérifié tout de suite (message clair), appliqué au paiement après une nouvelle vérification
router.post("/commande/code-promo", requireAuth, (req, res) => {
  const items = getPurchasableItems(req);
  if (!items.length) return res.redirect("/panier");
  if (req.body.retirer) { delete req.session.coupon; req.session.couponFlash = { ok: "Code promo retiré." }; return res.redirect("/commande"); }
  const r = sales.applyCoupon(req.body.code, items);
  if (r.error) req.session.couponFlash = { error: r.error };
  else { req.session.coupon = r.coupon.code; req.session.couponFlash = { ok: `Code « ${r.coupon.code} » appliqué.` }; }
  res.redirect("/commande");
});

// Paiement simulé : aucune carte n'est réellement débitée. Voir le README pour brancher
// un vrai prestataire de paiement (Stripe, etc.). Sans PAIEMENT_SIMULE=1, seules les commandes à 0 € passent (src/services/payment.js).
router.post("/commande", requireAuth, async (req, res, next) => {
  // Un gestionnaire async doit intercepter ses erreurs lui-même : Express 4 ne le fait pas,
  // et une erreur non interceptée ferait tomber tout le serveur.
  try {
    const items = getPurchasableItems(req);
    syncCart(req, items);
    if (!items.length) return res.redirect("/panier");

    // Tout ou rien : la commande, ses lignes et les inscriptions sont écrites ensemble,
    // ou pas du tout (jamais de commande orpheline si une écriture échoue en cours de route).
    // Le code promo est revérifié DANS la transaction (limite d'utilisation exacte même avec des achats simultanés).
    let orderId;
    db.exec("BEGIN IMMEDIATE");
    try {
      let applied = null;
      if (req.session.coupon) {
        const r = sales.applyCoupon(req.session.coupon, items);
        if (r.error) {
          db.exec("ROLLBACK");
          delete req.session.coupon;
          req.session.couponFlash = { error: `Code promo retiré : ${r.error} Vérifiez le nouveau total avant de payer.` };
          return res.redirect("/commande");
        }
        applied = r;
      }
      const priceOf = (c) => (applied ? applied.lines.get(c.id) : c.price_cents);
      const total = items.reduce((sum, c) => sum + priceOf(c), 0);
      if (total > 0 && !paidCheckoutOpen()) {
        db.exec("ROLLBACK");
        req.session.couponFlash = { orderError: "Le paiement en ligne n'est pas encore ouvert : aucune commande payante ne peut être passée pour l'instant." };
        return res.redirect("/commande");
      }
      const orderInfo = db.prepare("INSERT INTO orders (user_id, total_cents, coupon_id, coupon_code, discount_cents) VALUES (?, ?, ?, ?, ?)")
        .run(req.session.user.id, total, applied ? applied.coupon.id : null, applied ? applied.coupon.code : null, applied ? applied.discount : 0);
      orderId = Number(orderInfo.lastInsertRowid);
      // price_cents : montant réellement payé (après remise) ; list_price_cents : prix catalogue
      const insertItem = db.prepare("INSERT INTO order_items (order_id, course_id, price_cents, list_price_cents) VALUES (?, ?, ?, ?)");
      const insertEnrollment = db.prepare("INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)");
      items.forEach((course) => {
        insertItem.run(orderId, course.id, priceOf(course), course.price_cents);
        insertEnrollment.run(req.session.user.id, course.id);
      });
      db.exec("COMMIT");
    } catch (err) {
      try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
      throw err;
    }

    req.session.cart = {};
    delete req.session.coupon;

    // L'e-mail est mis en file APRÈS l'enregistrement : il part en arrière-plan, son échec (ou un serveur SMTP lent)
    // ne peut ni annuler ni ralentir l'achat
    sendPurchaseWelcomeEmail(db, {
      to: req.session.user.email,
      username: req.session.user.username,
      courseTitles: items.map((c) => c.title),
    });

    res.redirect(`/commande/confirmation/${orderId}`);
  } catch (err) {
    next(err);
  }
});

router.get("/commande/confirmation/:id", requireAuth, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.params.id, req.session.user.id);
  if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
  const items = db
    .prepare(
      `SELECT order_items.*, courses.title, courses.slug FROM order_items
       JOIN courses ON courses.id = order_items.course_id
       WHERE order_id = ?`
    )
    .all(order.id);
  res.render("order-confirmation", { order, items });
});

module.exports = router;
