// Pages d'atterrissage publiques (/p/<adresse>) : aucune session ni compte. Mêmes protections que les formulaires
// publics (champ piège, limite par IP, case de consentement revérifiée ici). Les clics passent par /p/<adresse>/clic/<n>
// qui ne redirige QUE vers un lien enregistré dans la page (jamais une adresse fournie par le visiteur).
const express = require("express");
const landing = require("../landing");
const pages = require("../pages");
const { tokensToCss } = require("../pages/tokens");
const forms = require("../forms");
const { tagContact } = require("../audience/tags");
const { createRateLimiter } = require("../../middlewares/security");
const { sendSubscriptionConfirmation } = require("../../utils/mailer");
const { renderMarkdown } = require("../../utils/markdown");
const antispam = require("../forms/antispam");
const formUpload = require("./formUpload");
const visitorsLib = require("../visitors");
const { consentedVisitor } = require("./visitorsPublic");

const PENDING_TEXT = "Merci ! Un e-mail de confirmation vient de vous être envoyé : cliquez sur le lien qu'il contient pour finaliser votre inscription (pensez aux courriers indésirables).";

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(5, 60 * 60 * 1000);
  const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa";

  router.use("/p", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Cette page est momentanément indisponible." });
    req.mkPages = { organizationId: marketing.organizationId, bus: marketing.bus, settings: marketing.settings };
    res.locals.formToken = antispam.issue(); // anti-robot des inscriptions (voir forms/antispam.js)
    next();
  });
  const ctxOf = (req) => ({ db, organizationId: req.mkPages.organizationId, userId: null, bus: req.mkPages.bus, settings: req.mkPages.settings, baseUrl: process.env.SITE_URL });
  const loadForm = (page) => (page.form_id ? forms.getForm({ db, organizationId: page.organization_id }, page.form_id) : null);
  // Page affichée : composants synchronisés résolus, formations relues dans le catalogue
  const shownPage = (req, page) => landing.viewModel(ctxOf(req), { ...page, sections: pages.resolveSections(ctxOf(req), page.sections).filter((s) => !s.hidden) });
  // Design system du site de la page (site actif seulement)
  const siteOf = (req, page) => { const site = page.site_id ? pages.getSite(ctxOf(req), page.site_id) : null; return site && site.status === "active" ? site : null; };
  const show = (req, res, page, { status = 200, error = null, values = {}, thanks = null } = {}) => {
    const form = loadForm(page);
    res.status(status).render("marketing-public/landing", {
      page: shownPage(req, page), site: siteOf(req, page), tokensToCss, form: form && form.status === "published" ? form : null, fieldCatalog: forms.FIELD_CATALOG,
      propertyDefs: form ? forms.propertyFieldDefs(db, page.organization_id, form) : [], renderMarkdown, error, values, thanks, preview: false,
    });
  };

  router.get("/p/:slug", (req, res) => {
    const page = landing.getPublishedPage(db, req.params.slug);
    if (!page) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const thanks = req.query.inscrit === "1" ? (req.query.confirmer === "1" ? PENDING_TEXT : (loadForm(page) || {}).thankYouText || "Merci, votre inscription est enregistrée.") : null;
    if (!thanks && !landing.isBot(req)) landing.record(db, page, "view", landing.visitorOf(req, secret()));
    show(req, res, page, { thanks });
  });

  router.get("/p/:slug/clic/:n(\\d{1,3})", (req, res) => {
    const page = landing.getPublishedPage(db, req.params.slug);
    if (!page) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const link = landing.linksOf(shownPage(req, page))[Number(req.params.n)];
    if (!link) return res.redirect(`/p/${page.slug}`);
    if (!landing.isBot(req)) landing.record(db, page, "click", landing.visitorOf(req, secret()), link.label);
    res.redirect(link.url);
  });

  router.post("/p/:slug/inscription", formUpload, (req, res, next) => {
    const page = landing.getPublishedPage(db, req.params.slug);
    if (!page) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const form = loadForm(page);
    if (!form || form.status !== "published") return show(req, res, page, { status: 400, error: "L'inscription n'est pas disponible pour le moment." });
    // Robot (champ piège rempli, jeton absent ou envoi trop rapide) : faux succès silencieux
    if (String(req.body.website || "").trim() || !antispam.check(req.body.ft)) return res.redirect(`/p/${page.slug}?inscrit=1#inscription`);
    if (req.uploadError) return show(req, res, page, { status: 400, error: req.uploadError, values: req.body });
    if (limiter.isLimited(req.ip)) return show(req, res, page, { status: 429, error: "Trop de tentatives : réessayez dans un instant.", values: req.body });
    if (!req.body.consent) return show(req, res, page, { status: 400, error: "Cochez la case pour confirmer votre inscription.", values: req.body });
    limiter.hit(req.ip);
    try {
      const ctx = ctxOf(req);
      const result = forms.submitForm(ctx, form.id, { ...req.body, ip: req.ip, file: req.file, page: `/p/${page.slug}` });
      if (!result.ok) return show(req, res, page, { status: 400, error: result.reason === "invalid_email" ? "Adresse e-mail invalide." : result.message || "Inscription impossible pour le moment.", values: req.body });
      // Étiquettes propres à la page (en plus de celles du formulaire) : on sait d'où vient l'inscription
      if (result.contact) for (const tag of page.tags) tagContact({ ...ctx, audit: false }, result.contact.id, tag);
      landing.record(db, page, "signup", landing.visitorOf(req, secret()), result.pending ? "en attente de confirmation" : "confirmée");
      if (result.contact && consentedVisitor(req)) visitorsLib.recordFormSubmit(db, page.organization_id, { visitorId: consentedVisitor(req), contactId: result.contact.id, path: `/p/${page.slug}`, formName: form.name });
      if (result.pending) {
        const base = String(process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
        sendSubscriptionConfirmation(db, { to: result.email, formName: form.name, url: `${base}/f/confirmer/${result.token}` });
        return res.redirect(`/p/${page.slug}?inscrit=1&confirmer=1#inscription`);
      }
      res.redirect(`/p/${page.slug}?inscrit=1#inscription`);
    } catch (error) {
      next(error);
    }
  });
  return router;
};
