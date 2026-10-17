// Page publique d'un formulaire (/f/:slug) : aucune session, aucun compte. Mêmes protections que le formulaire de
// contact du site (src/routes/pages.js) : champ piège invisible + limite de débit par IP, pour rester cohérent.
const express = require("express");
const forms = require("../forms");
const { createRateLimiter } = require("../../middlewares/security");
const { sendSubscriptionConfirmation } = require("../../utils/mailer");
const antispam = require("../forms/antispam");
const fieldRules = require("../forms/fields");
const formUpload = require("./formUpload");
const visitorsLib = require("../visitors");
const { consentedVisitor } = require("./visitorsPublic");

const PENDING_TEXT = "Merci ! Un e-mail de confirmation vient de vous être envoyé : cliquez sur le lien qu'il contient pour finaliser votre inscription (pensez aux courriers indésirables).";

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(5, 60 * 60 * 1000); // 5 par heure et par IP, comme le formulaire de contact

  router.use("/f", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Ce formulaire est momentanément indisponible." });
    req.mkForms = { organizationId: marketing.organizationId, bus: marketing.bus, settings: marketing.settings };
    res.locals.formToken = antispam.issue(); // anti-robot : heure d'affichage signée (voir forms/antispam.js)
    next();
  });

  // Interrogé par public/js/popup.js sur chaque page du site : le pop-up actif (s'il y en a un), ou rien.
  // AVANT /f/:slug (sinon Express prendrait "popup.json" pour une adresse de formulaire).
  router.get("/f/popup.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    // Page où le visiteur se trouve (chemin seulement) : sert aux règles « pages » des pop-ups
    const pathname = typeof req.query.page === "string" && /^\/[^\s<>"'`\\]{0,300}$/.test(req.query.page) ? req.query.page.split("?")[0] : "/";
    const user = req.session && req.session.user;
    // Contact déjà abonné (personne connectée dont l'adresse est un contact abonné) : connu du serveur seulement
    const subscribed = user && db.prepare("SELECT 1 FROM mk_contacts WHERE organization_id = ? AND email = lower(trim(?)) AND status = 'subscribed'").get(req.mkForms.organizationId, user.email);
    const eligible = forms.getActivePopups(db, req.mkForms.organizationId).filter((p) => {
      const r = p.popupRules || {};
      if (!fieldRules.pageMatches(r, pathname)) return false;
      if (r.hideForStudents && user) return false;
      if (r.hideIfSubscribed && subscribed) return false;
      return true;
    });
    const describe = (popup) => ({
      slug: popup.slug, name: popup.name, consentText: popup.consentText,
      // Accord SMS facultatif : texte de la seconde case ; le numéro est demandé à part si le formulaire n'a pas déjà « Téléphone »
      smsConsentText: popup.smsConsentText || "", smsPhoneField: Boolean(popup.smsConsentText) && !popup.fields.includes("phone"),
      fields: [
        ...popup.fields.map((key) => ({ key, label: forms.FIELD_CATALOG[key] })),
        ...forms.propertyFieldDefs(db, req.mkForms.organizationId, popup).map((d) => ({ key: d.name, label: d.label, type: d.type, options: d.options })),
      ],
      trigger: popup.popupTrigger, triggerValue: popup.popupTriggerValue, frequencyDays: popup.popupFrequencyDays, thankYouText: popup.thankYouText,
      fieldSettings: popup.fieldSettings, ft: res.locals.formToken,
      // Règles vérifiées dans le navigateur (appareil, pages vues, provenance, déjà inscrit dans ce navigateur)
      rules: { devices: popup.popupRules.devices || null, minPages: popup.popupRules.minPages || 1, utmSource: popup.popupRules.utmSource || null, utmCampaign: popup.popupRules.utmCampaign || null, referrer: popup.popupRules.referrer || null, hideIfSubscribed: Boolean(popup.popupRules.hideIfSubscribed), visitors: popup.popupRules.visitors || null },
    });
    const list = eligible.map(describe);
    res.json({ form: list[0] || null, forms: list });
  });

  // ---------- Double confirmation : /f/confirmer/:token (AVANT /f/:slug) ----------
  // Un GET ne confirme JAMAIS (antivirus et aperçus de liens ouvrent les adresses) : il faut cliquer le bouton.
  const confirmInvalid = (res) => res.status(410).render("marketing-public/message", {
    title: "Lien expiré", heading: "Ce lien de confirmation n'est plus valable", text: "Il a déjà servi, ou il date de plus de 7 jours. Inscrivez-vous de nouveau pour recevoir un nouveau lien.",
  });
  router.get("/f/confirmer/:token", (req, res) => {
    res.set({ "Referrer-Policy": "no-referrer" });
    const found = forms.findPendingConfirmation(db, req.params.token);
    if (!found) return confirmInvalid(res);
    res.render("marketing-public/confirm-subscription", { title: "Confirmer mon inscription", formName: found.form.name });
  });
  router.post("/f/confirmer/:token", (req, res, next) => {
    try {
      const ctx = { db, organizationId: req.mkForms.organizationId, userId: null, bus: req.mkForms.bus, settings: req.mkForms.settings };
      const r = forms.confirmSubscription(ctx, req.params.token);
      if (!r.ok) return confirmInvalid(res);
      res.render("marketing-public/message", { title: "Inscription confirmée", heading: "Inscription confirmée", text: r.form.thankYouText || "Merci ! Votre inscription est confirmée." });
    } catch (error) {
      next(error);
    }
  });

  router.get("/f/:slug", (req, res) => {
    const form = forms.getPublishedForm(db, req.mkForms.organizationId, req.params.slug);
    if (!form) return res.status(404).render("error", { message: "Ce formulaire n'existe pas ou n'est plus publié." });
    const submitted = req.query.envoye === "1";
    if (!submitted) forms.recordView(db, form.id); // la page de remerciement n'est pas une nouvelle visite du formulaire
    res.render("marketing-public/form", { title: form.name, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: forms.propertyFieldDefs(db, req.mkForms.organizationId, form), error: null, values: {}, submitted, confirmPending: submitted && req.query.confirmer === "1" });
  });

  router.post("/f/:slug", formUpload, (req, res, next) => {
    // Le pop-up (public/js/popup.js) envoie cet en-tête : il reste sur la page en cours, jamais une redirection
    // de page complète (qui le ferait quitter l'article qu'il lisait) — la même logique de soumission sert les deux.
    const isPopup = req.get("x-mk-popup") === "1";
    const fail = (status, message) => (isPopup ? res.status(status).json({ ok: false, error: message }) : res.status(status).render("marketing-public/form", { title: form.name, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: forms.propertyFieldDefs(db, req.mkForms.organizationId, form), error: message, values: req.body, submitted: false }));
    const form = forms.getPublishedForm(db, req.mkForms.organizationId, req.params.slug);
    if (!form) return isPopup ? res.status(404).json({ ok: false, error: "Formulaire introuvable." }) : res.status(404).render("error", { message: "Ce formulaire n'existe pas ou n'est plus publié." });
    // Champ piège rempli, ou envoi sans jeton valide / trop rapide pour un humain : robot
    if (String(req.body.website || "").trim() || !antispam.check(req.body.ft)) {
      // champ piège rempli : faux positif silencieux (jamais renseigner un robot sur son échec)
      return isPopup ? res.json({ ok: true, thankYouText: form.thankYouText }) : res.redirect(form.redirectUrl || `/f/${req.params.slug}?envoye=1`);
    }
    if (limiter.isLimited(req.ip)) return fail(429, "Trop de tentatives : réessayez dans un instant.");
    // La case à cocher n'est pas qu'un détail d'affichage : c'est la PREUVE de consentement (voir compliance/consent.js).
    // Revérifiée ici, jamais seulement côté navigateur (un envoi direct, hors formulaire, pourrait sinon la contourner).
    if (req.uploadError) return fail(400, req.uploadError);
    if (!req.body.consent) return fail(400, "Cochez la case pour confirmer votre inscription.");
    limiter.hit(req.ip);
    try {
      const ctx = { db, organizationId: req.mkForms.organizationId, userId: null, bus: req.mkForms.bus, settings: req.mkForms.settings };
      // Page d'origine : celle du pop-up (chemin envoyé par le navigateur, revérifié) ou la page du formulaire
      const page = isPopup && typeof req.body.page === "string" ? req.body.page : `/f/${form.slug}`;
      const result = forms.submitForm(ctx, form.id, { ...req.body, ip: req.ip, file: req.file, page });
      if (!result.ok) {
        const message = result.reason === "invalid_email" ? "Adresse e-mail invalide." : result.message || "Inscription impossible pour le moment.";
        return fail(400, message);
      }
      // Visiteur suivi (accord donné) : l'envoi rejoint son parcours, ses visites sont reliées au contact
      if (result.contact && !result.withheld && consentedVisitor(req)) visitorsLib.recordFormSubmit(db, req.mkForms.organizationId, { visitorId: consentedVisitor(req), contactId: result.contact.id, path: page, formName: form.name });
      // Palier 19 : le parcours déjà suivi par ce visiteur rejoint son contact (événements datés de leur vrai moment)
      if (result.contact && !result.withheld && consentedVisitor(req)) { try { require("../funnels/events").replayVisitor({ db, organizationId: req.mkForms.organizationId, bus: req.mkForms.bus, userId: null, audit: false }, consentedVisitor(req), result.contact.id); } catch (error) { console.error("[KOLAKISA] Parcours du visiteur :", error.message); } }
      if (result.pending) {
        // Double confirmation : l'adresse publique du site (SITE_URL) sert au lien ; sinon celle de la requête
        const base = String(process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
        sendSubscriptionConfirmation(db, { to: result.email, formName: form.name, url: `${base}/f/confirmer/${result.token}` });
        return isPopup ? res.json({ ok: true, thankYouText: PENDING_TEXT }) : res.redirect(`/f/${req.params.slug}?envoye=1&confirmer=1`);
      }
      if (isPopup) return res.json({ ok: true, thankYouText: form.thankYouText });
      // Redirection choisie dans la configuration (validée à l'enregistrement : http(s) ou chemin du site), sinon remerciement
      res.redirect(form.redirectUrl || `/f/${req.params.slug}?envoye=1`);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
