// Sondages publics (/sondage/<adresse>) : aucune session ni compte. Le lien personnel des e-mails (?r=<jeton signé>) rattache
// la réponse au contact ; sans jeton, la réponse est anonyme ou identifiée par l'adresse saisie (selon le sondage).
// Protections : champ piège, limite par IP ; jamais d'abonnement sans case cochée.
const express = require("express");
const surveys = require("../surveys");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(20, 60 * 60 * 1000);
  router.use("/sondage", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Ce sondage est momentanément indisponible." });
    req.mkSurveys = { organizationId: marketing.organizationId };
    next();
  });
  const ctxOf = (req) => ({ db, organizationId: req.mkSurveys.organizationId, userId: null, tokenKey: process.env.ENCRYPTION_KEY });
  const show = (res, survey, { status = 200, values = {}, error = null, done = false, contact = null, token = "" } = {}) =>
    res.status(status).render("marketing-public/survey", { survey, values, error, done, contact, token, preview: false });

  router.get("/sondage/:slug", (req, res) => {
    const survey = surveys.getPublicSurvey(db, req.params.slug);
    if (!survey) return res.status(404).render("error", { message: "Ce sondage n'existe pas ou n'est pas encore ouvert." });
    const token = typeof req.query.r === "string" ? req.query.r.slice(0, 1024) : "";
    const contact = surveys.contactFromToken(ctxOf(req), token);
    // Réponse cliquée dans l'e-mail (1re question) : pré-remplie, enregistrée seulement à l'envoi du formulaire
    const values = {};
    if (req.query.p !== undefined && survey.questions[0]) values.q0 = String(req.query.p).slice(0, 4);
    show(res, survey, { values, contact, token: contact ? token : "", done: req.query.merci === "1" });
  });

  router.post("/sondage/:slug", (req, res, next) => {
    const survey = surveys.getPublicSurvey(db, req.params.slug);
    if (!survey) return res.status(404).render("error", { message: "Ce sondage n'existe pas ou n'est pas encore ouvert." });
    const token = typeof req.body.r === "string" ? req.body.r.slice(0, 1024) : "";
    const contact = surveys.contactFromToken(ctxOf(req), token);
    if (String(req.body.website || "").trim()) return res.redirect(`/sondage/${survey.slug}?merci=1`); // robot : faux succès silencieux
    if (limiter.isLimited(req.ip)) return show(res, survey, { status: 429, values: req.body, error: "Trop de réponses depuis votre connexion : réessayez plus tard.", contact, token: contact ? token : "" });
    try {
      const r = surveys.submitResponse(ctxOf(req), survey, req.body, { contact, ip: req.ip });
      if (!r.ok) return show(res, survey, { status: 400, values: req.body, error: r.error, contact, token: contact ? token : "" });
      limiter.hit(req.ip);
      res.redirect(`/sondage/${survey.slug}?merci=1`);
    } catch (error) { next(error); }
  });
  return router;
};
