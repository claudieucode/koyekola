// Pages SMS, phase 1 : réglages (fournisseur, expéditeur, heures de silence, plafonds), SMS de test, numéros bloqués.
const express = require("express");
const sms = require("../sms");
const { parseKey } = require("../security/crypto");
const { MarketingError } = require("../errors");
const { createRateLimiter } = require("../../middlewares/security");
const { getContact } = require("../audience/contacts");
const { attempt, need } = require("./kit");

const BACK = "/marketing/sms/reglages";
const REASON_LABELS = { stop: "A répondu STOP", invalid: "Numéro invalide", manual: "Blocage manuel" };

module.exports = () => {
  const router = express.Router();
  const testLimiter = createRateLimiter(10, 60 * 60 * 1000); // 10 SMS de test par heure et par utilisateur (chaque SMS est payant)

  router.get("/sms/reglages", need("settings.read"), (req, res) => {
    const { ctx } = req.mk;
    let keyOk = true;
    try { parseKey(process.env.ENCRYPTION_KEY); } catch { keyOk = false; }
    res.render("marketing/sms-settings", {
      title: "Réglages SMS", active: "sms", cfg: sms.getSmsConfig(ctx), keyOk, countries: sms.countryOptions(), currencies: sms.CURRENCIES,
      suppressions: sms.listSmsSuppressions(ctx, { limit: 200 }).map((s) => ({ ...s, masked: sms.maskPhone(s.phone), label: REASON_LABELS[s.reason] })),
      canEdit: req.mk.can("settings.write"), canManage: req.mk.can("compliance.manage"),
    });
  });

  router.post("/sms/reglages", need("settings.write"), (req, res, next) =>
    attempt(req, res, next, BACK, () => {
      const b = req.body;
      try {
        sms.saveSmsConfig(req.mk.ctx, {
          provider: b.provider, sender: typeof b.sender === "string" ? b.sender.trim() : undefined, defaultCountry: b.default_country,
          quietStart: b.quiet_start, quietEnd: b.quiet_end, ratePerMinute: b.rate, dailyLimit: b.daily, maxSegments: b.max_segments, pricePerSegment: b.price_per_segment, currency: b.currency,
          accountSid: typeof b.account_sid === "string" ? b.account_sid : undefined, authToken: b.auth_token, clearAuthToken: b.clear_auth_token === "on",
        });
      } catch (error) {
        if (!(error instanceof MarketingError) && /ENCRYPTION_KEY/.test(error.message)) throw new MarketingError("invalid_field", error.message);
        throw error;
      }
      return "Réglages SMS enregistrés.";
    }));

  router.post("/sms/test", need("settings.write"), (req, res, next) => {
    const key = String(req.session.user.id);
    if (testLimiter.isLimited(key)) {
      req.session.mkFlash = { type: "error", text: "Trop de SMS de test : 10 par heure au plus. Réessayez plus tard." };
      return res.redirect(`${BACK}#test`);
    }
    testLimiter.hit(key); // compté à chaque tentative, même refusée
    sms.sendTestSms(req.mk.ctx, { to: req.body.to }).then(
      (r) => {
        if (r.ok) {
          req.session.mkFlash = r.provider === "console"
            ? { type: "ok", text: `Mode essai (console) : aucun SMS n'est réellement parti vers ${r.to}. Choisissez Twilio pour un vrai envoi.` }
            : { type: "ok", text: `SMS de test envoyé à ${r.to}. Il arrive en général en moins d'une minute.` };
        } else {
          req.session.mkFlash = { type: "error", text: r.message, detail: r.code ? `Code d'erreur Twilio : ${r.code} (voir twilio.com/docs/api/errors/${r.code}).` : undefined };
        }
        res.redirect(`${BACK}#test`);
      },
      (error) => {
        if (!(error instanceof MarketingError)) return next(error);
        req.session.mkFlash = { type: "error", text: error.message };
        res.redirect(`${BACK}#test`);
      },
    );
  });

  router.post("/sms/blocages", need("compliance.manage"), (req, res, next) =>
    attempt(req, res, next, `${BACK}#blocages`, () => {
      const r = sms.addSmsSuppression(req.mk.ctx, { phone: req.body.phone, reason: "manual", note: req.body.note });
      if (!r.added) return "Ce numéro était déjà bloqué.";
      return r.contacts ? `Numéro bloqué. ${r.contacts} contact(s) ne recevront plus de SMS.` : "Numéro bloqué.";
    }));

  // Levée d'un blocage manuel : identifié par l'id de la ligne (le numéro complet n'est jamais affiché dans la page)
  router.post("/sms/blocages/:id/retirer", need("compliance.manage"), (req, res, next) =>
    attempt(req, res, next, `${BACK}#blocages`, () => {
      const row = /^\d{1,12}$/.test(req.params.id)
        ? req.mk.ctx.db.prepare("SELECT phone FROM mk_sms_suppressions WHERE id = ? AND organization_id = ?").get(Number(req.params.id), req.mk.ctx.organizationId)
        : null;
      if (!row) throw new MarketingError("not_found", "Blocage introuvable.");
      sms.removeSmsSuppression(req.mk.ctx, row.phone);
      return "Blocage retiré. Les contacts concernés devront redonner eux-mêmes leur accord pour recevoir des SMS.";
    }));

  // ---------- Fiche contact : accord SMS enregistré par l'équipe (preuve obligatoire), désinscription des SMS ----------
  const contactOf = (req) => (/^\d{1,12}$/.test(req.params.id) ? getContact(req.mk.ctx, Number(req.params.id)) : null);

  router.post("/contacts/:id/sms/consentement", need("compliance.manage"), (req, res, next) => {
    const contact = contactOf(req);
    if (!contact) return res.status(404).render("error", { message: "Contact introuvable." });
    attempt(req, res, next, `/marketing/contacts/${contact.id}#sms`, () => {
      const r = sms.recordSmsConsent(req.mk.ctx, contact.id, { phone: req.body.phone, source: "admin", textShown: req.body.text, ip: req.ip, siteId: Number.isInteger(req.mk.ctx.siteScope) ? req.mk.ctx.siteScope : null });
      if (!r.ok) throw new MarketingError(r.reason, r.reason === "suppressed" ? "Ce numéro est bloqué : il ne peut pas recevoir de SMS marketing." : "Ce contact a retiré son accord SMS : seule la personne elle-même peut le redonner (formulaire d'inscription).");
      return r.already ? "Accord SMS déjà enregistré pour ce numéro." : "Accord SMS enregistré.";
    });
  });

  router.post("/contacts/:id/sms/desinscrire", need("contacts.write"), (req, res, next) => {
    const contact = contactOf(req);
    if (!contact) return res.status(404).render("error", { message: "Contact introuvable." });
    attempt(req, res, next, `/marketing/contacts/${contact.id}#sms`, () => {
      sms.unsubscribeSms(req.mk.ctx, contact.id, { source: "admin" });
      return "Contact désinscrit des SMS. Ses e-mails ne changent pas.";
    });
  });

  return router;
};
