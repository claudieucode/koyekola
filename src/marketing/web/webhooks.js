// Webhooks entrants du fournisseur d'envoi. Le corps est lu BRUT (la signature porte sur les octets exacts) : ce routeur est monté
// dans server.js AVANT l'analyse JSON du site. Sans signature valide, rien n'est lu ni appliqué ; les erreurs ne disent pas pourquoi.
const express = require("express");
const { verifySvixSignature, parseResendEvent } = require("../sending/providers/resend");
const { applyEvent } = require("../sending/webhooks");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(600, 60 * 1000);

  router.post("/email/resend/:org", (req, res, next) => {
    if (limiter.isLimited(req.ip)) return res.status(429).json({ error: "limite" });
    limiter.hit(req.ip);
    const orgId = /^\d{1,9}$/.test(req.params.org) ? Number(req.params.org) : 0;
    const marketing = req.app.locals.marketing;
    let secret = null;
    try { secret = orgId && marketing && marketing.ready ? marketing.settings.get(orgId, "email.webhook_secret") : null; } catch { secret = null; }
    if (!secret) return res.status(404).json({ error: "introuvable" });

    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verifySvixSignature({ rawBody: raw, headers: req.headers, secret })) return res.status(400).json({ error: "signature" });
    let json;
    try { json = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "corps" }); }
    try {
      const event = { ...parseResendEvent(json), dedupeKey: `wh:${req.headers["svix-id"]}` };
      applyEvent({ db, organizationId: orgId, userId: null, bus: marketing.bus }, event);
      res.json({ ok: true });
    } catch (error) {
      next(error); // erreur interne : le fournisseur réessaiera (le traitement est idempotent)
    }
  });

  return router;
};
