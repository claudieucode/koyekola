// Webhook Stripe : POST /stripe/webhook. Monté dans server.js avec le corps BRUT (la signature porte sur les octets exacts)
// et avant le contrôle d'origine (Stripe n'est pas un navigateur). Configurez dans Stripe l'adresse
// <SITE_URL>/stripe/webhook et les événements : checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired, charge.refunded ; copiez le « secret de signature » dans STRIPE_WEBHOOK_SECRET.
const express = require("express");
const db = require("../config/database");
const payments = require("../services/payments");

const router = express.Router();

router.post("/webhook", (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ erreur: "Webhook non configuré (STRIPE_WEBHOOK_SECRET)." });
  // Rien n'est lu dans le message tant que sa signature n'est pas authentifiée
  if (!payments.verifyWebhookSignature(req.body, req.get("stripe-signature"), secret)) {
    return res.status(400).json({ erreur: "Signature invalide." });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ erreur: "Message illisible." });
  }
  const session = event.data && event.data.object;
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const result = payments.fulfillCheckout(db, session || {});
        if (result.status === "unknown") console.warn(`[KOLAKISA] Webhook Stripe : session inconnue (${event.id}), ignorée.`);
        break;
      }
      case "checkout.session.expired":
        payments.markCheckoutEnded(db, session || {}, "expired");
        break;
      case "checkout.session.async_payment_failed":
        payments.markCheckoutEnded(db, session || {}, "failed");
        break;
      case "charge.refunded": {
        // Remboursement fait dans Stripe : tracé (commande + montant) pour le Contact Core et les scénarios ; accès et commande ne changent pas
        const r = payments.recordRefunds(db, session || {});
        if (r.status === "unknown") console.warn(`[KOLAKISA] Webhook Stripe : remboursement d'un paiement inconnu (${event.id}), ignoré.`);
        break;
      }
      default:
        break; // autres événements : accusés de réception sans action
    }
    res.json({ received: true });
  } catch (error) {
    // Erreur technique : 500 pour que Stripe réessaie (fulfillCheckout est idempotent)
    console.error(`[KOLAKISA] Webhook Stripe ${event.type || ""} (${event.id || "?"}) : ${error.message}`);
    res.status(500).json({ erreur: "Traitement impossible, réessayez." });
  }
});

module.exports = router;
