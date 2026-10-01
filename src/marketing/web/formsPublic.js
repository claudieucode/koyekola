// Page publique d'un formulaire (/f/:slug) : aucune session, aucun compte. Mêmes protections que le formulaire de
// contact du site (src/routes/pages.js) : champ piège invisible + limite de débit par IP, pour rester cohérent.
const express = require("express");
const forms = require("../forms");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(5, 60 * 60 * 1000); // 5 par heure et par IP, comme le formulaire de contact

  router.use("/f", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Ce formulaire est momentanément indisponible." });
    req.mkForms = { organizationId: marketing.organizationId, bus: marketing.bus };
    next();
  });

  // Interrogé par public/js/popup.js sur chaque page du site : le pop-up actif (s'il y en a un), ou rien.
  // AVANT /f/:slug (sinon Express prendrait "popup.json" pour une adresse de formulaire).
  router.get("/f/popup.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    const popup = forms.getActivePopup(db, req.mkForms.organizationId);
    if (!popup) return res.json({ form: null });
    res.json({
      form: {
        slug: popup.slug, name: popup.name, consentText: popup.consentText,
        fields: [
          ...popup.fields.map((key) => ({ key, label: forms.FIELD_CATALOG[key] })),
          ...forms.propertyFieldDefs(db, req.mkForms.organizationId, popup).map((d) => ({ key: d.name, label: d.label, type: d.type, options: d.options })),
        ],
        trigger: popup.popupTrigger, triggerValue: popup.popupTriggerValue, frequencyDays: popup.popupFrequencyDays, thankYouText: popup.thankYouText,
      },
    });
  });

  router.get("/f/:slug", (req, res) => {
    const form = forms.getPublishedForm(db, req.mkForms.organizationId, req.params.slug);
    if (!form) return res.status(404).render("error", { message: "Ce formulaire n'existe pas ou n'est plus publié." });
    const submitted = req.query.envoye === "1";
    if (!submitted) forms.recordView(db, form.id); // la page de remerciement n'est pas une nouvelle visite du formulaire
    res.render("marketing-public/form", { title: form.name, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: forms.propertyFieldDefs(db, req.mkForms.organizationId, form), error: null, values: {}, submitted });
  });

  router.post("/f/:slug", (req, res, next) => {
    // Le pop-up (public/js/popup.js) envoie cet en-tête : il reste sur la page en cours, jamais une redirection
    // de page complète (qui le ferait quitter l'article qu'il lisait) — la même logique de soumission sert les deux.
    const isPopup = req.get("x-mk-popup") === "1";
    const fail = (status, message) => (isPopup ? res.status(status).json({ ok: false, error: message }) : res.status(status).render("marketing-public/form", { title: form.name, form, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: forms.propertyFieldDefs(db, req.mkForms.organizationId, form), error: message, values: req.body, submitted: false }));
    const form = forms.getPublishedForm(db, req.mkForms.organizationId, req.params.slug);
    if (!form) return isPopup ? res.status(404).json({ ok: false, error: "Formulaire introuvable." }) : res.status(404).render("error", { message: "Ce formulaire n'existe pas ou n'est plus publié." });
    if (String(req.body.website || "").trim()) {
      // champ piège rempli : faux positif silencieux (jamais renseigner un robot sur son échec)
      return isPopup ? res.json({ ok: true, thankYouText: form.thankYouText }) : res.redirect(form.redirectUrl || `/f/${req.params.slug}?envoye=1`);
    }
    if (limiter.isLimited(req.ip)) return fail(429, "Trop de tentatives : réessayez dans un instant.");
    // La case à cocher n'est pas qu'un détail d'affichage : c'est la PREUVE de consentement (voir compliance/consent.js).
    // Revérifiée ici, jamais seulement côté navigateur (un envoi direct, hors formulaire, pourrait sinon la contourner).
    if (!req.body.consent) return fail(400, "Cochez la case pour confirmer votre inscription.");
    limiter.hit(req.ip);
    try {
      const ctx = { db, organizationId: req.mkForms.organizationId, userId: null, bus: req.mkForms.bus };
      const result = forms.submitForm(ctx, form.id, { ...req.body, ip: req.ip });
      if (!result.ok) {
        const message = result.reason === "invalid_email" ? "Adresse e-mail invalide." : result.message || "Inscription impossible pour le moment.";
        return fail(400, message);
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
