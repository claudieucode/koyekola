const crypto = require("node:crypto");
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { sendPurchaseWelcomeEmail } = require("../utils/mailer");
const { UserError } = require("../utils/errors");
const sales = require("../services/gestion/sales");
const payments = require("../services/payments");
const notifications = require("../services/notifications");
const { applyEffectivePrices } = require("../services/pricing");
const { paidCheckoutOpen } = require("../services/payment");
const funnels = require("../marketing/funnels");

const router = express.Router();

const siteBase = (req) => String(process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");

// Comment le paiement se déroule pour ce total : carte via Stripe, commande gratuite, démonstration (local), ou indisponible
function payMode(total) {
  if (total <= 0) return "free";
  if (payments.stripeEnabled()) return "stripe";
  return paidCheckoutOpen() ? "demo" : "unavailable"; // démonstration ouverte hors production (ou avec PAIEMENT_SIMULE=1)
}

// Formations du panier qui peuvent réellement être achetées maintenant : publiées et pas déjà possédées.
// (Une formation dépubliée depuis l'ajout au panier, ou achetée entre-temps, en est écartée.)
function getPurchasableItems(req) {
  const ids = Object.keys(req.session.cart || {});
  if (!ids.length) return [];
  const sc = require("../services/lmsSites").scopeSql(req.lmsSite, "courses"); // seules les formations de CE site (domaine) sont achetables ici
  const courses = db
    .prepare(
      `SELECT * FROM courses
       WHERE id IN (${ids.map(() => "?").join(",")}) AND published = 1 AND ${sc.sql}
         AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)`
    )
    .all(...ids, ...sc.params, req.session.user.id);
  // price_cents = prix à payer (offre en cours comprise) ; standard_price_cents = prix du catalogue ; offer = offre appliquée ou null
  return applyEffectivePrices(courses);
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
  res.render("checkout", { items, total: p.total, subtotal: p.subtotal, discount: p.discount, coupon: p.coupon, couponError: p.couponError || (flash && flash.error) || null, couponOk: flash && flash.ok, orderError: (flash && flash.orderError) || null, payMode: payMode(p.total), minAmount: payments.MIN_AMOUNT_CENTS, expectedTotal: p.total });
});

// Paiement par carte : la commande n'existe pas encore. Le panier et les montants (calculés ici, jamais lus dans le
// formulaire) sont gardés dans checkout_sessions, puis le client est envoyé sur la page de paiement de Stripe.
async function startStripeCheckout(req, res, items, p) {
  if (p.couponError) { // code devenu invalide : le client revoit le nouveau total avant de payer
    req.session.couponFlash = { error: p.couponError };
    return res.redirect("/commande");
  }
  if (p.total < payments.MIN_AMOUNT_CENTS) throw new UserError("Le montant minimum payable par carte est de 0,50 €.", 400);
  const ref = crypto.randomUUID();
  const rows = items.map((c) => ({ course_id: c.id, price_cents: p.lines.get(c.id), list_price_cents: c.standard_price_cents, offer_id: c.offer ? c.offer.id : null, offer_name: c.offer ? c.offer.name : null }));
  db.prepare("INSERT INTO checkout_sessions (ref, user_id, items_json, coupon_id, coupon_code, discount_cents, total_cents, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ref, req.session.user.id, JSON.stringify(rows), p.coupon ? p.coupon.id : null, p.coupon ? p.coupon.code : null, p.discount, p.total, payments.CURRENCY);
  let session;
  try {
    session = await payments.createStripeSession({
      ref,
      email: req.session.user.email,
      // Une formation devenue gratuite grâce au code n'est pas une ligne de paiement (Stripe n'accepte que des montants > 0)
      lines: items.filter((c) => p.lines.get(c.id) > 0).map((c) => ({ title: c.title, amountCents: p.lines.get(c.id) })),
      successUrl: `${siteBase(req)}/commande/retour/${ref}`,
      cancelUrl: `${siteBase(req)}/commande`,
    });
    if (!session || !session.id || !session.url) throw new Error("réponse de Stripe sans adresse de paiement");
  } catch (error) {
    db.prepare("UPDATE checkout_sessions SET status = 'failed', failure_reason = 'page de paiement non créée' WHERE ref = ?").run(ref);
    console.error(`[KOLAKISA] ${error.message}`);
    throw new UserError("Le paiement est momentanément indisponible. Réessayez dans un instant : vous n'avez pas été débité.", 502);
  }
  db.prepare("UPDATE checkout_sessions SET stripe_session_id = ? WHERE ref = ?").run(session.id, ref);
  res.redirect(303, session.url);
}

// Retour du client depuis Stripe. Le webhook est le chemin principal ; ici on relit la session auprès de Stripe
// (authentifiée par notre clé secrète) pour ne pas dépendre de la rapidité du webhook. Les deux chemins sont idempotents.
router.get("/commande/retour/:ref", requireAuth, async (req, res, next) => {
  try {
    const cs = db.prepare("SELECT * FROM checkout_sessions WHERE ref = ? AND user_id = ?").get(req.params.ref, req.session.user.id);
    if (!cs) return res.status(404).render("error", { message: "Paiement introuvable." });
    let result = cs.status === "paid" ? { status: "already", orderId: cs.order_id } : null;
    if (!result && cs.status === "pending" && cs.stripe_session_id) {
      try {
        result = payments.fulfillCheckout(db, await payments.retrieveStripeSession(cs.stripe_session_id));
      } catch (error) {
        console.error(`[KOLAKISA] Relecture du paiement ${cs.ref} : ${error.message}`);
      }
    }
    if (result && (result.status === "paid" || result.status === "already")) {
      // Achat fait depuis une étape de tunnel : le parcours continue (offre complémentaire, remerciement…) ; sinon, confirmation de commande
      if (cs.funnel_step_id) {
        const marketing = req.app.locals.marketing;
        const step = marketing && marketing.ready ? funnels.offerStep(db, marketing.organizationId, cs.funnel_step_id) : null;
        const next = step ? funnels.nextUrlAfterOffer(db, marketing.organizationId, step, { paid: true }) : null;
        if (next) return res.redirect(next);
      } else { req.session.cart = {}; delete req.session.coupon; }
      return res.redirect(`/commande/confirmation/${result.orderId}`);
    }
    if (cs.status === "failed" || cs.status === "expired") {
      return res.status(402).render("error", { message: "Le paiement n'a pas abouti. Vous n'avez pas été débité : vous pouvez réessayer depuis votre panier." });
    }
    res.render("payment-pending", { ref: cs.ref });
  } catch (error) {
    next(error);
  }
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

    // Total à payer : décide du chemin. Carte → Stripe (la commande n'est créée qu'au paiement confirmé).
    // Gratuit (formations à 0 € ou remise totale) → enregistré directement, comme avant.
    // Démonstration (sans Stripe) → uniquement hors production ; en ligne, aucun paiement fictif n'est accepté.
    const pricingNow = pricing(req, items);
    if (pricingNow.couponError) { // code expiré ou épuisé entre-temps : le client revoit le nouveau total avant de payer
      req.session.couponFlash = { error: pricingNow.couponError };
      return res.redirect("/commande");
    }
    // Le prix affiché au client est celui qu'il paie : si une offre a pris fin (ou commencé) entre l'affichage et le clic,
    // le total a changé et il doit le voir avant de payer (le formulaire transmet le total affiché).
    if (req.body.expected_total !== undefined && String(req.body.expected_total) !== String(pricingNow.total)) {
      req.session.couponFlash = { error: "Le prix de votre commande a changé. Vérifiez le nouveau total avant de payer." };
      return res.redirect("/commande");
    }
    const mode = payMode(pricingNow.total);
    if (mode === "stripe") return await startStripeCheckout(req, res, items, pricingNow);
    if (mode === "unavailable") { // aucun paiement réel branché : même message que la page de paiement
      req.session.couponFlash = { orderError: "Le paiement en ligne n'est pas encore ouvert : aucune commande payante ne peut être passée pour l'instant." };
      return res.redirect("/commande");
    }

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
      // price_cents : montant réellement payé (après offre et remise) ; list_price_cents : prix standard du catalogue ;
      // offer_id / offer_name : offre appliquée (id vide si l'offre vient d'être supprimée : le nom reste)
      const insertItem = db.prepare("INSERT INTO order_items (order_id, course_id, price_cents, list_price_cents, offer_id, offer_name) VALUES (?, ?, ?, ?, ?, ?)");
      const offerExists = db.prepare("SELECT id FROM offers WHERE id = ?");
      const insertEnrollment = db.prepare("INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)");
      items.forEach((course) => {
        const offerId = course.offer && offerExists.get(course.offer.id) ? course.offer.id : null;
        insertItem.run(orderId, course.id, priceOf(course), course.standard_price_cents, offerId, course.offer ? course.offer.name : null);
        insertEnrollment.run(req.session.user.id, course.id);
      });
      db.exec("COMMIT");
    } catch (err) {
      try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
      throw err;
    }

    req.session.cart = {};
    delete req.session.coupon;
    notifications.notify(req.session.user.id, { kind: "order", title: `Commande n° ${orderId} confirmée`, body: items.map((c) => c.title).join(", "), url: "/mes-cours" });

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
