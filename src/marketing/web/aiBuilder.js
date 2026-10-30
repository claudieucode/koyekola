// Interface « Assistant IA » de création de site (Programme 21.8) : pages HTML + API JSON sous /marketing/ia/studio/… (le préfixe « /ia » est gardé par le module « ia » du site).
// Les routes ne contiennent AUCUNE logique de moteur : elles appellent ai/builder/workspace.js, qui orchestre les moteurs 21.3 à 21.6 et les services natifs.
// Droits (vérifiés ici, côté serveur) : lecture forms.read · écriture forms.write · design appearance.styles · publication pages.publish.
// Le site d'un projet est celui du plan (relu en base) ; un accès limité à un site ne voit que les projets de CE site (ctx.siteScope posé par le serveur).
const express = require("express");
const { AiError } = require("../ai");
const { MarketingError } = require("../errors");
const ws = require("../ai/builder/workspace");
const pagesLib = require("../pages");
const { need } = require("./kit");

const STATUS = { not_configured: 503, quota: 429, rate: 429, conflict: 409, not_found: 404, forbidden: 403, module_disabled: 403, not_validated: 409, confirm_required: 422, plan_invalid: 422, invalid_field: 422, limit: 422, no_site: 409,
  nothing_to_undo: 409, nothing_to_redo: 409, nothing_to_publish: 409, preflight_failed: 422, brief_empty: 400, brief_too_short: 400, brief_too_long: 413, brief_insufficient: 422, in_use: 409 };
const AI_CODES = /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|bad_json|format)$/;

module.exports = () => {
  const router = express.Router();
  const B = "/ia/studio";
  const body = (req) => (req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {});
  const pid = (req) => Number(req.params.id);
  // Erreurs connues → message compréhensible et code d'état ; tout le reste part au gestionnaire d'erreurs (jamais de pile ni de secret)
  const send = (res, next, run) => Promise.resolve().then(run).then((data) => res.set("Cache-Control", "no-store").json({ ok: true, ...data })).catch((e) => {
    const known = e instanceof MarketingError || e instanceof AiError || (e && e.name === "Error" && typeof e.code === "string" && AI_CODES.test(e.code)) || (e && e.name === "UserError");
    if (known) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code || "error" });
    return next(e);
  });
  const can = (req) => (p) => req.mk.can(p);
  const html = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : e.code === "forbidden" || e.code === "module_disabled" ? 403 : 422).render("error", { message: e.message }); next(e); } };

  // ── Pages ──
  router.get(B, need("forms.read"), need("templates.read"), html((req, res) => {
    const ctx = req.mk.ctx;
    const sites = pagesLib.listSites(ctx, { view: "actifs" }).map((s) => ({ id: s.id, name: s.name }));
    res.set("Cache-Control", "no-store").render("marketing/ai-builder-home", { title: "Créer un site avec l'IA", active: "sites", marketingShell: true, projects: ws.listProjects(ctx), shops: require("../ai/shop/project").list(ctx), sites, canWrite: req.mk.can("forms.write"), canCreateSite: !req.mk.siteOnly, siteLimited: Boolean(req.mk.siteOnly) });
  }));
  router.get(`${B}/projets.json`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => ({ projects: ws.listProjects(req.mk.ctx) })));
  router.post(`${B}/projets`, need("forms.write"), (req, res, next) => send(res, next, async () => {
    const b = body(req);
    const v = await ws.createProject(req.mk.ctx, { brief: b.brief, siteId: b.siteId ? Number(b.siteId) : undefined, newSiteName: b.newSiteName });
    return { id: v.id, url: `/marketing${B}/${v.id}${v.siteId ? `?site=${v.siteId}` : ""}` };
  }));
  router.get(`${B}/:id(\\d+)`, need("forms.read"), need("templates.read"), html((req, res) => {
    const ctx = req.mk.ctx;
    const s = ws.state(ctx, pid(req), { can: can(req) });
    res.set("Cache-Control", "no-store").render("marketing/ai-builder", { title: s.project.name, project: s.project, id: pid(req), canWrite: req.mk.can("forms.write"), canDesign: req.mk.can("appearance.styles"), canPublish: req.mk.can("pages.publish"), initial: s, initialJson: JSON.stringify(s).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029"), base: `/marketing${B}/${pid(req)}`, steps: ws.STEPS });
  }));

  // ── État et brief ──
  router.get(`${B}/:id(\\d+)/etat.json`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => ({ state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) })));
  const reload = (req, v) => ({ plan: v, state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) });
  const planApi = require("../ai/builder/plans");
  router.post(`${B}/:id(\\d+)/reponses`, need("forms.write"), (req, res, next) => send(res, next, async () => reload(req, await planApi.answerQuestions(req.mk.ctx, pid(req), { answers: body(req).answers, revision: body(req).revision }))));
  router.post(`${B}/:id(\\d+)/planifier`, need("forms.write"), (req, res, next) => send(res, next, async () => reload(req, await planApi.createPlan(req.mk.ctx, pid(req), { proceedWithAssumptions: body(req).proceedWithAssumptions === true }))));

  // ── Plan (toutes les modifications passent par ws.edit : une entrée d'annulation, protégée par la révision) ──
  router.post(`${B}/:id(\\d+)/plan`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.edit(req.mk.ctx, pid(req), body(req).operation, { revision: body(req).revision, label: String(body(req).label || "").slice(0, 160) }))));
  router.post(`${B}/:id(\\d+)/plan/lot`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.editMany(req.mk.ctx, pid(req), body(req).operations, { revision: body(req).revision, label: String(body(req).label || "").slice(0, 160) }))));
  router.post(`${B}/:id(\\d+)/plan/dupliquer`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.duplicatePage(req.mk.ctx, pid(req), String(body(req).key || ""), { revision: body(req).revision }))));
  router.post(`${B}/:id(\\d+)/plan/valider`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.validatePlan(req.mk.ctx, pid(req), { revision: body(req).revision }))));
  router.post(`${B}/:id(\\d+)/annuler`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.undo(req.mk.ctx, pid(req), { revision: body(req).revision }))));
  router.post(`${B}/:id(\\d+)/retablir`, need("forms.write"), (req, res, next) => send(res, next, () => reload(req, ws.redo(req.mk.ctx, pid(req), { revision: body(req).revision }))));

  // ── Assistant contextuel ──
  router.post(`${B}/:id(\\d+)/assistant`, need("forms.write"), (req, res, next) => send(res, next, () => { const r = ws.chat(req.mk.ctx, pid(req), body(req).message, { pageKey: body(req).pageKey }); return { ...r, state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) }; }));
  router.post(`${B}/:id(\\d+)/propositions/:mid(\\d+)/accepter`, need("forms.write"), (req, res, next) => send(res, next, () => { const r = ws.decide(req.mk.ctx, pid(req), req.params.mid, "accept", { revision: body(req).revision }); return { message: r.message, state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) }; }));
  router.post(`${B}/:id(\\d+)/propositions/:mid(\\d+)/refuser`, need("forms.write"), (req, res, next) => send(res, next, () => { const r = ws.decide(req.mk.ctx, pid(req), req.params.mid, "refuse", {}); return { message: r.message, state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) }; }));

  // ── Pages (Page Generator) ──
  const st = (req) => ({ state: ws.state(req.mk.ctx, pid(req), { can: can(req) }) });
  router.post(`${B}/:id(\\d+)/pages/generer`, need("forms.write"), (req, res, next) => send(res, next, async () => { const r = await ws.generatePages(req.mk.ctx, pid(req), { useAi: body(req).useAi === true, only: body(req).only }); return { ...r, ...st(req) }; }));
  router.post(`${B}/:id(\\d+)/pages/:rid(\\d+)/appliquer`, need("forms.write"), (req, res, next) => send(res, next, () => { const r = ws.applyPages(req.mk.ctx, pid(req), req.params.rid, body(req).decisions && typeof body(req).decisions === "object" ? body(req).decisions : {}, { confirmReplace: body(req).confirmReplace === true }); return { ...r, ...st(req) }; }));
  router.post(`${B}/:id(\\d+)/pages/:rid(\\d+)/annuler`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.undoPages(req.mk.ctx, pid(req), req.params.rid), ...st(req) })));

  // ── Design (Design Generator) ──
  router.post(`${B}/:id(\\d+)/design/generer`, need("appearance.styles"), (req, res, next) => send(res, next, async () => ({ ...(await ws.generateDesign(req.mk.ctx, pid(req), body(req).brief || {}, { useAi: body(req).useAi === true })), ...st(req) })));
  router.get(`${B}/:id(\\d+)/design/:rid(\\d+)/comparer`, need("appearance.read"), need("templates.read"), (req, res, next) => send(res, next, () => ({ comparison: ws.designCompare(req.mk.ctx, pid(req), req.params.rid, String(req.query.variante || ""), { can: can(req) }) })));
  router.post(`${B}/:id(\\d+)/design/:rid(\\d+)/appliquer`, need("appearance.styles"), (req, res, next) => send(res, next, () => {
    const overwrite = body(req).overwrite === "all" ? "all" : Array.isArray(body(req).overwrite) ? body(req).overwrite.map(String) : false;
    return { result: ws.applyDesign(req.mk.ctx, pid(req), req.params.rid, String(body(req).variante || ""), { overwrite, can: can(req), userId: req.session.user.id }), ...st(req) };
  }));
  router.post(`${B}/:id(\\d+)/design/:rid(\\d+)/annuler`, need("appearance.styles"), (req, res, next) => send(res, next, () => ({ result: ws.undoDesign(req.mk.ctx, pid(req), req.params.rid, { can: can(req), userId: req.session.user.id }), ...st(req) })));

  // ── Images et médias (Media Generator + Asset Manager) ──
  router.post(`${B}/:id(\\d+)/media/planifier`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaPlan(req.mk.ctx, pid(req)), ...st(req) })));
  router.post(`${B}/:id(\\d+)/media/estimer`, need("forms.read"), (req, res, next) => send(res, next, () => ws.mediaEstimate(req.mk.ctx, pid(req), body(req))));
  router.post(`${B}/:id(\\d+)/media/generer`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaGenerate(req.mk.ctx, pid(req), body(req)), ...st(req) })));
  router.post(`${B}/:id(\\d+)/media/taches/:tid(\\d+)/annuler`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaCancel(req.mk.ctx, pid(req), req.params.tid), ...st(req) })));
  router.post(`${B}/:id(\\d+)/media/taches/:tid(\\d+)/relancer`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaRetry(req.mk.ctx, pid(req), req.params.tid), ...st(req) })));
  router.post(`${B}/:id(\\d+)/media/besoin`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaEditNeed(req.mk.ctx, pid(req), body(req).key, body(req)), ...st(req) })));
  router.post(`${B}/:id(\\d+)/media/affecter`, need("forms.write"), (req, res, next) => send(res, next, () => ({ ...ws.mediaAssign(req.mk.ctx, pid(req), body(req)), ...st(req) })));
  router.get(`${B}/:id(\\d+)/media/bibliotheque`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => ws.mediaLibrary(req.mk.ctx, pid(req), req.query.q)));

  // ── Publication (système natif de publication des pages) ──
  router.post(`${B}/:id(\\d+)/publier`, need("pages.publish"), (req, res, next) => send(res, next, () => ({ ...ws.publishAll(req.mk.ctx, pid(req), { can: can(req), confirm: body(req).confirm === true || body(req).confirm === "oui" }), ...st(req) })));
  return router;
};
