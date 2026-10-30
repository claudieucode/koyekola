// Brief Analyzer + Site Planner (Programme 21.3) : API JSON sous /marketing/ia/site/… (le préfixe « /ia » est déjà gardé par le module « ia » du site, cf. siteModules.ROUTES).
// Lecture : forms.read ; écriture (analyse, réponses, plan, modification, validation) : forms.write — mêmes droits que l'AI Studio des pages.
// Aucun site_id n'est lu pour un accès limité : le serveur impose le sien. Rien n'est appliqué au site : le plan n'écrit ni page, ni menu, ni style.
const express = require("express");
const { AiError } = require("../ai");
const { MarketingError } = require("../errors");
const plans = require("../ai/builder/plans");
const { need } = require("./kit");

const STATUS = { not_configured: 503, quota: 429, rate: 429, conflict: 409, not_found: 404, forbidden: 403, module_disabled: 403, not_validated: 409, plan_invalid: 422, brief_empty: 400, brief_too_short: 400, brief_too_long: 413, brief_insufficient: 422, brief_blocked: 422, format: 502, too_long: 502, refusal: 422 };

module.exports = () => {
  const router = express.Router();
  const send = (res, next, run) => Promise.resolve().then(run).then((data) => res.set("Cache-Control", "no-store").json({ ok: true, ...data })).catch((error) => {
    if (error instanceof AiError || error instanceof MarketingError) return res.status(STATUS[error.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: error.message, code: error.code });
    next(error);
  });
  const body = (req) => (req.body && typeof req.body === "object" ? req.body : {});

  router.get("/ia/site/plans", need("forms.read"), (req, res, next) => send(res, next, () => ({ plans: plans.list(req.mk.ctx) })));
  router.get("/ia/site/plans/:id(\\d+)", need("forms.read"), (req, res, next) => send(res, next, () => ({ plan: plans.get(req.mk.ctx, req.params.id), history: plans.history(req.mk.ctx, req.params.id) })));
  router.post("/ia/site/analyser", need("forms.write"), (req, res, next) => send(res, next, async () => ({ plan: await plans.analyzeBrief(req.mk.ctx, { brief: body(req).brief, siteId: body(req).siteId }) })));
  router.post("/ia/site/plans/:id(\\d+)/reponses", need("forms.write"), (req, res, next) => send(res, next, async () => ({ plan: await plans.answerQuestions(req.mk.ctx, req.params.id, { answers: body(req).answers, revision: body(req).revision }) })));
  router.post("/ia/site/plans/:id(\\d+)/planifier", need("forms.write"), (req, res, next) => send(res, next, async () => ({ plan: await plans.createPlan(req.mk.ctx, req.params.id, { proceedWithAssumptions: body(req).proceedWithAssumptions === true }) })));
  router.post("/ia/site/plans/:id(\\d+)/modifier", need("forms.write"), (req, res, next) => send(res, next, () => ({ plan: plans.edit(req.mk.ctx, req.params.id, body(req).operation, { revision: body(req).revision }) })));
  router.post("/ia/site/plans/:id(\\d+)/valider", need("forms.write"), (req, res, next) => send(res, next, () => ({ plan: plans.validate(req.mk.ctx, req.params.id, { revision: body(req).revision }) })));
  return router;
};
