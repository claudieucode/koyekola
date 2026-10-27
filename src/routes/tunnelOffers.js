// Étapes de paiement d'un tunnel : bon de commande (avec offre additionnelle facultative), offre complémentaire (upsell)
// et offre de repli (downsell). Une offre = une formation publiée du catalogue, payée avec le Stripe du site
// (src/services/payments.js) : montants fixés par le serveur, commande créée seulement après confirmation de Stripe,
// puis le parcours continue vers l'étape suivante (retour géré par /commande/retour/:ref dans routes/orders.js).
// Aucun paiement simulé : sans STRIPE_SECRET_KEY, l'offre s'affiche mais ne peut pas être payée.
// Limite connue : l'offre complémentaire redemande la carte (pas de paiement en un clic : il faudrait enregistrer le moyen de paiement chez Stripe).
const crypto = require("node:crypto");
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { UserError } = require("../utils/errors");
const payments = require("../services/payments");
const { applyEffectivePrices } = require("../services/pricing");
const sales = require("../services/gestion/sales");
const funnels = require("../marketing/funnels");

const router = express.Router();
const siteBase = (req) => String(process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
const unavailable = (res) => res.status(404).render("error", { message: "Cette offre n'existe pas ou n'est plus disponible." });

const courseRow = (id) => (Number.isInteger(id) && id > 0 ? db.prepare("SELECT * FROM courses WHERE id = ? AND published = 1 AND archived = 0").get(id) : null);
const owned = (userId, courseId) => Boolean(db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(userId, courseId));
const effective = (course) => (course ? applyEffectivePrices([course])[0] : null);

// Étape, formation proposée et (bon de commande) offre additionnelle encore achetable par ce compte
function load(req) {
  const marketing = req.app.locals.marketing;
  if (!marketing || !marketing.ready) return null;
  const step = funnels.offerStep(db, marketing.organizationId, Number(req.params.sid));
  const course = step && effective(courseRow(step.course_id));
  if (!course) return null;
  const bumpId = step.type === "order" ? step.settings.bumpCourseId : null;
  const bump = bumpId && bumpId !== course.id ? effective(courseRow(bumpId)) : null;
  return { organizationId: marketing.organizationId, step, course, bump: bump && !owned(req.session.user.id, bump.id) && bump.price_cents > 0 ? bump : null };
}
const nextOrHome = (o, { paid }) => funnels.nextUrlAfterOffer(db, o.organizationId, o.step, { paid }) || "/mes-cours";

router.get("/tunnel/offre/:sid(\\d+)", requireAuth, (req, res) => {
  const o = load(req);
  if (!o) return unavailable(res);
  if (owned(req.session.user.id, o.course.id)) return res.redirect(nextOrHome(o, { paid: true })); // déjà acheté : le parcours continue
  res.set("Cache-Control", "no-store");
  res.render("tunnel-offer", {
    step: o.step, course: o.course, bump: o.bump, payable: payments.stripeEnabled(), minAmount: payments.MIN_AMOUNT_CENTS, canDecline: o.step.type !== "order",
    error: req.session.offerError || null,
  });
  delete req.session.offerError;
});

router.post("/tunnel/offre/:sid(\\d+)/payer", requireAuth, async (req, res, next) => {
  try {
    const o = load(req);
    if (!o) return unavailable(res);
    const back = `/tunnel/offre/${o.step.id}`;
    if (owned(req.session.user.id, o.course.id)) return res.redirect(nextOrHome(o, { paid: true }));
    const items = [o.course];
    if (o.bump && req.body.bump === "on") items.push(o.bump);
    const total = items.reduce((sum, c) => sum + c.price_cents, 0);
    // Le prix a changé entre l'affichage et le clic (promotion terminée…) : le client le revoit avant de payer
    if (req.body.expected_total !== undefined && String(req.body.expected_total) !== String(total)) {
      req.session.offerError = "Le prix a changé. Vérifiez le nouveau total avant de payer.";
      return res.redirect(back);
    }
    if (total <= 0) return res.redirect(`/cours/${encodeURIComponent(o.course.slug)}`); // formation gratuite : inscription depuis sa page
    // Code promo (facultatif) : revérifié ici, côté serveur ; le total envoyé à Stripe est celui de la formule de remise de la boutique
    let applied = null;
    if (String(req.body.code || "").trim()) {
      applied = sales.applyCoupon(req.body.code, items);
      if (applied.error) { req.session.offerError = applied.error; return res.redirect(back); }
    }
    const priceOf = (c) => (applied ? applied.lines.get(c.id) : c.price_cents);
    const payTotal = items.reduce((sum, c) => sum + priceOf(c), 0);
    if (!payments.stripeEnabled()) throw new UserError("Le paiement en ligne n'est pas encore ouvert : aucune commande payante ne peut être passée pour l'instant.", 503);
    if (payTotal < payments.MIN_AMOUNT_CENTS) throw new UserError("Le montant minimum payable par carte est de 0,50 €.", 400);
    const ref = crypto.randomUUID();
    const rows = items.map((c) => ({ course_id: c.id, price_cents: priceOf(c), list_price_cents: c.standard_price_cents, offer_id: c.offer ? c.offer.id : null, offer_name: c.offer ? c.offer.name : null }));
    db.prepare("INSERT INTO checkout_sessions (ref, user_id, items_json, coupon_id, coupon_code, discount_cents, total_cents, currency, funnel_step_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ref, req.session.user.id, JSON.stringify(rows), applied ? applied.coupon.id : null, applied ? applied.coupon.code : null, applied ? applied.discount : 0, payTotal, payments.CURRENCY, o.step.id);
    let session;
    try {
      session = await payments.createStripeSession({
        ref, email: req.session.user.email, lines: items.filter((c) => priceOf(c) > 0).map((c) => ({ title: c.title, amountCents: priceOf(c) })),
        successUrl: `${siteBase(req)}/commande/retour/${ref}`, cancelUrl: `${siteBase(req)}${back}`,
      });
      if (!session || !session.id || !session.url) throw new Error("réponse de Stripe sans adresse de paiement");
    } catch (error) {
      db.prepare("UPDATE checkout_sessions SET status = 'failed', failure_reason = 'page de paiement non créée' WHERE ref = ?").run(ref);
      console.error(`[KOLAKISA] ${error.message}`);
      throw new UserError("Le paiement est momentanément indisponible. Réessayez dans un instant : vous n'avez pas été débité.", 502);
    }
    db.prepare("UPDATE checkout_sessions SET stripe_session_id = ? WHERE ref = ?").run(session.id, ref);
    res.redirect(303, session.url);
  } catch (error) {
    next(error);
  }
});

// « Non merci » : seulement pour une offre complémentaire ou de repli (le bon de commande n'a pas de refus : on quitte la page)
router.post("/tunnel/offre/:sid(\\d+)/refuser", requireAuth, (req, res) => {
  const o = load(req);
  if (!o) return unavailable(res);
  if (o.step.type === "order") return res.redirect(`/tunnel/offre/${o.step.id}`);
  res.redirect(nextOrHome(o, { paid: false }));
});

module.exports = router;
