// Pages publiques sans compte : désinscription (/u/:token) et centre de préférences (/preferences/:token).
// Sécurité : le jeton signé fait foi (jamais un identifiant nu) ; un GET ne modifie JAMAIS rien (les antivirus et
// aperçus de liens ouvrent les URL) ; réponse neutre pour un jeton invalide ; le jeton ne fuit pas par le Referer.
const express = require("express");
const audience = require("../audience");
const compliance = require("../compliance");
const { parseKey } = require("../security/crypto");
const { verifyToken } = require("../security/tokens");
const { MarketingError } = require("../errors");
const tracking = require("../sending/tracking");
const { createRateLimiter } = require("../../middlewares/security");
const helpers = require("./helpers");

const REPLY_CONSENT_TEXT = "Je souhaite de nouveau recevoir les e-mails de KOYEKOLA (demande faite depuis le centre de préférences).";
const BLOCKED = new Set(["bounced", "complained", "suppressed"]);

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(120, 60 * 1000);

  router.use(["/u", "/preferences"], (req, res, next) => {
    res.set({ "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
    res.locals.mkh = helpers;
    if (limiter.isLimited(req.ip)) return res.status(429).render("marketing-public/message", { title: "Trop de requêtes", heading: "Trop de requêtes", text: "Réessayez dans une minute." });
    limiter.hit(req.ip);
    try {
      parseKey(process.env.ENCRYPTION_KEY);
    } catch {
      return res.status(503).render("marketing-public/message", { title: "Indisponible", heading: "Service momentanément indisponible", text: "Réessayez plus tard." });
    }
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("marketing-public/message", { title: "Indisponible", heading: "Service momentanément indisponible", text: "Réessayez plus tard." });
    req.mkPublic = { bus: marketing.bus, key: process.env.ENCRYPTION_KEY };
    next();
  });

  const invalid = (res) => res.status(404).render("marketing-public/message", {
    title: "Lien invalide", heading: "Ce lien n'est plus valide", text: "Si vous souhaitez ne plus recevoir nos e-mails, utilisez le lien de désinscription présent dans un message récent.",
  });

  // Jeton → contexte + contact ; null si tout n'est pas parfaitement valide (aucune raison n'est révélée)
  function resolve(req, kind) {
    const check = verifyToken(req.params.token, req.mkPublic.key, { kind });
    if (!check.ok || !Number.isInteger(check.payload.o) || !Number.isInteger(check.payload.c)) return null;
    const ctx = { db, organizationId: check.payload.o, userId: null, bus: req.mkPublic.bus };
    const contact = audience.getContact(ctx, check.payload.c);
    return contact ? { ctx, contact, payload: check.payload } : null;
  }

  const prefsToken = (req, r) => (r.ctx && db.prepare("SELECT 1 FROM mk_preference_categories WHERE organization_id = ? LIMIT 1").get(r.ctx.organizationId)
    ? compliance.preferencesToken(r.ctx, r.contact.id, req.mkPublic.key) : null);

  // ---------- Désinscription ----------
  router.get("/u/:token", (req, res) => {
    const r = resolve(req, "unsub");
    if (!r) return invalid(res);
    const list = r.payload.l ? db.prepare("SELECT name FROM mk_lists WHERE id = ? AND organization_id = ?").get(r.payload.l, r.ctx.organizationId) : null;
    res.render("marketing-public/unsubscribe", { title: "Se désinscrire", masked: helpers.maskEmail(r.contact.email), listName: list?.name ?? null, already: r.contact.status === "unsubscribed" });
  });

  router.post("/u/:token", (req, res) => {
    const oneClick = req.body["List-Unsubscribe"] === "One-Click";
    const done = compliance.unsubscribeWithToken(db, req.params.token, req.mkPublic.key, { source: oneClick ? "one_click" : "link", bus: req.mkPublic.bus });
    if (done.ok) {
      // Désinscription faite depuis le lien d'un message de campagne : attribuée à cette campagne (une seule fois)
      const t = verifyToken(req.params.token, req.mkPublic.key, { kind: "unsub" });
      if (t.ok && Number.isInteger(t.payload.m) && Number.isInteger(t.payload.o)) tracking.recordUnsubscribe({ db, organizationId: t.payload.o }, { messageId: t.payload.m, contactId: t.payload.c });
    }
    if (oneClick) return res.status(done.ok ? 200 : 404).type("text/plain").send(done.ok ? "OK" : "");
    if (!done.ok) return invalid(res);
    const r = resolve(req, "unsub");
    const token = r ? prefsToken(req, r) : null;
    res.render("marketing-public/message", {
      title: "Désinscription confirmée", heading: "Vous êtes désinscrit(e)", text: "Vous ne recevrez plus nos e-mails marketing. Cela peut prendre quelques minutes pour un message déjà en cours d'envoi.",
      link: token ? { href: `/preferences/${token}`, label: "Gérer mes préférences" } : null,
    });
  });

  // ---------- Centre de préférences ----------
  function showPreferences(req, res, r, notice = null, status = 200) {
    const blocked = BLOCKED.has(r.contact.status);
    res.status(status).render("marketing-public/preferences", {
      title: "Mes préférences", masked: helpers.maskEmail(r.contact.email), categories: compliance.preferencesOf(r.ctx, r.contact.id),
      contactStatus: r.contact.status, blocked, canResubscribe: r.contact.status === "unsubscribed", notice,
    });
  }

  router.get("/preferences/:token", (req, res) => {
    const r = resolve(req, "prefs");
    if (!r) return invalid(res);
    showPreferences(req, res, r);
  });

  router.post("/preferences/:token", (req, res, next) => {
    const r = resolve(req, "prefs");
    if (!r) return invalid(res);
    try {
      const { ctx, contact } = r;
      let notice;
      if (req.body.action === "unsubscribe") {
        compliance.unsubscribe(ctx, contact.id, { source: "preference_center" });
        notice = "Vous êtes désinscrit(e) de tous nos e-mails marketing.";
      } else if (req.body.action === "resubscribe") {
        const result = compliance.recordConsent(ctx, contact.id, { source: "preference_center", textShown: REPLY_CONSENT_TEXT, ip: req.ip });
        notice = result.ok ? "Vous êtes de nouveau abonné(e)." : "Cette adresse est bloquée (rebond, plainte ou blocage) : elle ne peut pas être réabonnée.";
      } else {
        for (const category of compliance.preferencesOf(ctx, contact.id)) compliance.setPreference(ctx, contact.id, category.key, req.body[`cat_${category.key}`] === "on");
        notice = "Vos préférences ont été enregistrées.";
      }
      showPreferences(req, res, { ctx, contact: audience.getContact(ctx, contact.id) }, notice);
    } catch (error) {
      if (error instanceof MarketingError) return invalid(res);
      next(error);
    }
  });

  return router;
};
