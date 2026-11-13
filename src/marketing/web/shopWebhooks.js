// Webhooks de paiement PAR SITE : /boutique/webhooks/paypal | flutterwave | stripe, sur l'adresse du site. Monté AVANT l'analyse du corps (la signature Stripe porte sur les octets bruts) et hors contrôle d'origine (un fournisseur n'est pas un navigateur).
// Un message n'est jamais cru tel quel : signature (Stripe) ou hash secret (Flutterwave), PUIS relecture de l'état réel auprès du fournisseur (PayPal, Flutterwave). Idempotent : rejouer un message ne change rien.
const express = require("express");
const { createRateLimiter } = require("../../middlewares/security");
const siteModules = require("../siteModules");
const store = require("../shop/store");
const payments = require("../shop/payments");
const orders = require("../shop/orders");
const notify = require("../shop/notify");
const gateways = require("../shop/gateways");
const gw = require("../../services/payments");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(120, 60 * 1000);
  router.use((req, res, next) => {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).json({ ok: false });
    const siteId = req.kwSite && Number.isInteger(req.kwSite.id) ? req.kwSite.id : null;
    const s = { db, organizationId: marketing.organizationId, siteId };
    if (!siteModules.isEnabled(db, s.organizationId, siteId, "commerce")) return res.status(404).json({ ok: false });
    const key = `hook|${req.ip}|${siteId}`;
    if (limiter.isLimited(key)) return res.status(429).json({ ok: false });
    limiter.hit(key);
    req.shop = { s, settings: store.getSettings(s) };
    next();
  });
  // Corps brut lu par express.raw (monté dans server.js) ; JSON décodé ici
  const json = (req) => { try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "{}")); } catch { return null; } };

  router.post("/:provider(paypal|flutterwave)", async (req, res) => {
    try {
      const body = json(req);
      if (!body) return res.status(400).json({ ok: false });
      const r = await payments.handleProviderWebhook(req.shop.s, req.params.provider, body, req.headers);
      if (r.handled && r.becamePaid) notify.notify(req.shop.s, r.order, "order_paid");
      res.json({ ok: true });
    } catch (error) { console.error(`[KOLAKISA] Boutique : webhook ${req.params.provider} : ${error.message}`); res.status(500).json({ ok: false }); }
  });
  router.post("/stripe", (req, res) => {
    try {
      const { s } = req.shop;
      const creds = gateways.getCreds(s, "stripe");
      if (!creds || !creds.webhook_secret) return res.status(404).json({ ok: false }); // sans secret propre au site : le webhook global du serveur s'applique
      if (!gw.verifyWebhookSignature(req.body, req.get("stripe-signature"), creds.webhook_secret)) return res.status(400).json({ ok: false });
      const event = json(req);
      if (!event) return res.status(400).json({ ok: false });
      const out = payments.handleStripeEvent(db, event);
      if (out.handled && out.result && out.scope && out.orderId && out.scope.siteId === s.siteId && out.result.status === "paid") notify.notify(out.scope, orders.getOrder(out.scope, out.orderId), "order_paid");
      res.json({ received: true });
    } catch (error) { console.error(`[KOLAKISA] Boutique : webhook Stripe du site : ${error.message}`); res.status(500).json({ ok: false }); }
  });
  return router;
};
