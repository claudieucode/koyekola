// Advanced Content Intelligence & SEO Quality (programme 22.6) : écran /site-web/sites/:id/contenu-seo + API JSON. Le site vient de l'ADRESSE ; il est revérifié par le service (portée du membre, organisation).
// Droits : seo.view (lire, analyser) · seo.edit (faits, marché, genres, mots-clés, liens, traductions) · forms.write (optimisation IA via la régénération 21.9, brouillons seulement).
// Aucune écriture en ligne : les liens acceptés et les propositions vont dans les BROUILLONS ; rien n'est publié par ces routes.
const express = require("express");
const CI = require("../../contentIntel");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

const STATUS = { not_found: 404, forbidden: 403, conflict: 409, duplicate: 409, cannot_apply: 422, target_gone: 422, no_invented_metrics: 422, source_required: 422, protected: 423, needs_confirmation: 409, quota: 429, not_configured: 503 };
module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/contenu-seo", A = `${B}/api`;
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
  const str = (v) => (v === undefined || v === null ? "" : String(v).slice(0, 4000));
  const send = (res, d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d });
  const fail = (res, e) => res.status(STATUS[e.code] || (e instanceof MarketingError || e.name === "MarketingError" ? 400 : 500)).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
  // write = exige un site actif ; la garde de site passe AVANT tout service
  const run = (fn, { write = false } = {}) => (req, res, next) => Promise.resolve().then(() => { CI.guard(req.mk.ctx, sid(req), { write }); return fn(req.mk.ctx, sid(req), req); }).then((d) => send(res, d)).catch((e) => {
    if (e instanceof MarketingError || (e && e.name === "MarketingError") || (e && typeof e.code === "string" && STATUS[e.code])) return fail(res, e);
    next(e);
  });
  router.get(B, need("seo.view"), (req, res, next) => {
    try { const site = CI.guard(req.mk.ctx, sid(req)); res.set("Cache-Control", "no-store").render("marketing/site-content-intel", { title: "Contenu et qualité SEO", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/contenu-seo`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { edit: req.mk.can("seo.edit"), ai: req.mk.can("forms.write") } }); }
    catch (e) { if (e.name === "MarketingError") return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  const pageId = (req) => Number(req.params.pid);
  router.get(`${A}/tableau-de-bord`, need("seo.view"), run((ctx, id) => ({ dashboard: CI.dashboard(ctx, id) })));
  router.get(`${A}/revue`, need("seo.view"), run((ctx, id) => ({ review: CI.review(ctx, id) })));
  router.get(`${A}/pages/:pid(\\d+)`, need("seo.view"), run((ctx, id, req) => ({ evaluation: CI.evaluatePage(ctx, id, pageId(req), { force: req.query.force === "1" }) })));
  router.post(`${A}/evaluer-texte`, need("seo.view"), run((ctx, id, req) => ({ evaluation: CI.evaluateText(ctx, id, { kind: str(body(req).kind) || "article", title: str(body(req).title), body: str(body(req).body), keyword: str(body(req).keyword) }) })));
  router.get(`${A}/intention`, need("seo.view"), run((ctx, id, req) => { const c = CI.context(ctx, id); return { intent: CI.intent.analyze(str(req.query.mot), { kind: str(req.query.genre) || null, city: c.facts.city, brand: c.site.name }) }; }));
  router.post(`${A}/plan`, need("seo.view"), run((ctx, id, req) => ({ plan: CI.plan(ctx, id, { kind: str(body(req).kind), keyword: str(body(req).keyword) }) })));
  router.get(`${A}/reglages`, need("seo.view"), run((ctx, id) => ({ facts: CI.getFacts(ctx, id), market: CI.getMarket(ctx, id), voice: require("../../contentGen").getVoice(ctx, id), kinds: Object.keys(CI.kinds.KINDS).map((k) => ({ key: k, label: CI.kinds.KINDS[k].label })) })));
  router.post(`${A}/reglages/faits`, need("seo.edit"), run((ctx, id, req) => CI.setFacts(ctx, id, body(req).facts), { write: true }));
  router.post(`${A}/reglages/marche`, need("seo.edit"), run((ctx, id, req) => ({ market: CI.setMarket(ctx, id, body(req)) }), { write: true }));
  router.post(`${A}/pages/:pid(\\d+)/genre`, need("seo.edit"), run((ctx, id, req) => CI.setPageKind(ctx, id, pageId(req), body(req).kind ? str(body(req).kind) : null), { write: true }));
  // optimisation : actions de l'éditeur → proposition avant/après de la régénération 21.9 (acceptation et annulation par ses routes)
  router.get(`${A}/actions`, need("seo.view"), run(() => ({ actions: Object.entries(CI.presets.ACTIONS).map(([key, a]) => ({ key, label: a.label })) })));
  router.post(`${A}/optimiser`, need("forms.write"), run((ctx, id, req) => CI.optimize(ctx, id, { action: str(body(req).action), extra: str(body(req).extra), pageId: num(body(req).pageId), fieldKey: str(body(req).fieldKey) || null, sectionId: str(body(req).sectionId) || null, can: req.mk.can }), { write: true }));
  // maillage
  router.get(`${A}/liens`, need("seo.view"), run((ctx, id) => ({ analysis: CI.linking.analyze(ctx, id), ...CI.linking.list(ctx, id, { status: "proposed" }) })));
  router.post(`${A}/liens/proposer`, need("seo.edit"), run((ctx, id, req) => CI.linking.propose(ctx, id, { pageId: num(body(req).pageId) }), { write: true }));
  router.post(`${A}/liens/:lid(\\d+)/accepter`, need("seo.edit"), need("forms.write"), run((ctx, id, req) => CI.linking.accept(ctx, id, Number(req.params.lid)), { write: true }));
  router.post(`${A}/liens/:lid(\\d+)/refuser`, need("seo.edit"), run((ctx, id, req) => CI.linking.refuse(ctx, id, Number(req.params.lid)), { write: true }));
  // langues
  router.get(`${A}/langues`, need("seo.view"), run((ctx, id) => ({ groups: CI.i18n.groups(ctx, id).map((g) => ({ ...g, validation: CI.i18n.validate(g) })) })));
  router.post(`${A}/langues`, need("seo.edit"), run((ctx, id, req) => CI.i18n.link(ctx, id, { pageId: num(body(req).pageId), lang: str(body(req).lang), region: str(body(req).region), groupKey: str(body(req).groupKey), kind: str(body(req).kind) || "translation" }), { write: true }));
  router.post(`${A}/langues/:pid(\\d+)/retirer`, need("seo.edit"), run((ctx, id, req) => CI.i18n.unlink(ctx, id, pageId(req)), { write: true }));
  // mots-clés et sources de données
  router.get(`${A}/mots-cles`, need("seo.view"), run((ctx, id, req) => ({ keywords: CI.providers.list(ctx, id, { pageId: num(req.query.page) }), provenance: CI.providers.PROVENANCE })));
  router.post(`${A}/mots-cles`, need("seo.edit"), run((ctx, id, req) => CI.providers.add(ctx, id, { keyword: body(req).keyword, role: body(req).role, pageId: num(body(req).pageId), provenance: body(req).provenance, metrics: body(req).metrics, source: body(req).source, sourceDate: body(req).sourceDate }), { write: true }));
  router.post(`${A}/mots-cles/:kid(\\d+)/supprimer`, need("seo.edit"), run((ctx, id, req) => CI.providers.remove(ctx, id, Number(req.params.kid)), { write: true }));
  router.get(`${A}/sources`, need("seo.view"), run(() => ({ connectors: CI.providers.describe() })));
  return router;
};
