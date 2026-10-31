// Webhooks entrants du fournisseur d'envoi. Le corps est lu BRUT (la signature porte sur les octets exacts) : ce routeur est monté
// dans server.js AVANT l'analyse JSON du site. Sans signature valide, rien n'est lu ni appliqué ; les erreurs ne disent pas pourquoi.
const express = require("express");
const { verifySvixSignature, parseResendEvent } = require("../sending/providers/resend");
const { applyEvent } = require("../sending/webhooks");
const { createRateLimiter } = require("../../middlewares/security");
const smsHooks = require("../sms/webhooks");

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

  // ---------- Mailchimp : événements d'audience (subscribe, unsubscribe, profile, cleaned, upemail, campaign) ----------
  // Mailchimp ne signe pas ses webhooks : l'adresse porte un jeton secret par organisation (comparé à temps constant). Un jeton faux = 404 sans explication.
  // GET/HEAD : Mailchimp teste l'adresse à la création du webhook ; POST : l'événement (formulaire encodé). Une fois le jeton validé, la réponse est 200 même si l'événement est
  // ignoré ou en échec (il est enregistré et rejouable) : Mailchimp désactive un webhook qui répond en erreur.
  // Le limiteur ne compte que les jetons REFUSÉS (essais de devinette) : une vague légitime d'événements (désinscriptions en masse) ne doit jamais être bloquée
  function mailchimpContext(req, res) {
    if (limiter.isLimited(req.ip)) { res.status(429).end(); return null; }
    const orgId = /^\d{1,9}$/.test(req.params.org) ? Number(req.params.org) : 0;
    const marketing = req.app.locals.marketing;
    const refuse = () => { limiter.hit(req.ip); res.status(404).end(); return null; };
    if (!orgId || !marketing || !marketing.ready) return refuse();
    const ctx = { db, organizationId: orgId, userId: null, bus: marketing.bus, settings: marketing.settings, env: process.env };
    let ok = false;
    try { ok = require("../mailchimp/connection").tokenMatches(ctx, req.params.token); } catch { ok = false; }
    return ok ? ctx : refuse();
  }
  router.get("/mailchimp/:org/:token", (req, res) => { if (mailchimpContext(req, res)) res.status(200).type("text/plain").send("ok"); });
  router.head("/mailchimp/:org/:token", (req, res) => { if (mailchimpContext(req, res)) res.status(200).end(); });
  router.post("/mailchimp/:org/:token", async (req, res) => {
    const ctx = mailchimpContext(req, res);
    if (!ctx) return;
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const out = await require("../mailchimp/inbound").receive({ ...ctx, background: true }, raw); // on répond vite à Mailchimp : l'éventuel renvoi d'un désabonnement part en arrière-plan
      res.status(200).json({ ok: true, ...(out.duplicate ? { duplicate: true } : {}) });
    } catch (error) {
      if (error && error.code === "too_large") return res.status(413).end();
      console.error("[KOLAKISA] Webhook Mailchimp :", error && error.message);
      res.status(200).json({ ok: true });
    }
  });

  // ---------- Twilio (SMS) : rappels de statut et SMS entrants, signés avec le jeton du compte ----------
  // L'adresse signée est celle déclarée chez Twilio : SITE_URL + chemin (le proxy de l'hébergeur ne la change pas).
  function twilioRequest(req, res) {
    if (limiter.isLimited(req.ip)) { res.status(429).end(); return null; }
    limiter.hit(req.ip);
    const orgId = /^\d{1,9}$/.test(req.params.org) ? Number(req.params.org) : 0;
    const marketing = req.app.locals.marketing;
    let token = null;
    try { token = orgId && marketing && marketing.ready ? marketing.settings.get(orgId, "sms.auth_token") : null; } catch { token = null; }
    const base = String(process.env.SITE_URL || "").replace(/\/+$/, "");
    if (!token || !/^https:\/\//.test(base)) { res.status(404).end(); return null; }
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
    const params = Object.fromEntries(new URLSearchParams(raw));
    const url = `${base}/webhooks${req.path}`;
    if (!smsHooks.verifyTwilioSignature({ url, params, signature: req.headers["x-twilio-signature"], authToken: token })) { res.status(403).end(); return null; }
    return { ctx: { db, organizationId: orgId, userId: null, bus: marketing.bus, settings: marketing.settings }, params };
  }

  router.post("/sms/twilio/:org", (req, res, next) => {
    const r = twilioRequest(req, res);
    if (!r) return;
    try { smsHooks.applyTwilioStatus(r.ctx, r.params); res.status(204).end(); } catch (error) { next(error); }
  });

  router.post("/sms/twilio/:org/entrant", (req, res, next) => {
    const r = twilioRequest(req, res);
    if (!r) return;
    try { res.type("text/xml").send(smsHooks.twiml(smsHooks.handleInboundSms(r.ctx, r.params).reply)); } catch (error) { next(error); }
  });

  return router;
};
