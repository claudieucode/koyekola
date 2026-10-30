// AI Website Builder — interface (programme 21.8). Écran /site-web/sites/:id/createur-ia + API JSON /createur-ia/api/… Le site vient de l'ADRESSE (revérifié par le service), jamais du corps.
// Chaque route délègue à un moteur existant via src/aiBuilder (façade) ; les droits sont ceux du moteur concerné (forms.read/write, appearance.read/styles, pages.publish) et sont revérifiés côté serveur.
// Rien n'est publié sans la confirmation explicite de la personne ET le droit pages.publish ; les clés d'IA ne quittent jamais le serveur.
const express = require("express");
const b = require("../../aiBuilder");
const assistant = require("../../aiBuilder/assistant");
const contentGen = require("../../contentGen");
const aiMedia = require("../../aiMedia");
const designGen = require("../../designGen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const { AiError } = require("../ai");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, not_configured: 503, quota: 429, rate: 429, conflict: 409, preflight_failed: 422, plan_invalid: 422, not_validated: 409, confirm_required: 409, brief_empty: 400, brief_too_short: 400, brief_too_long: 413, brief_insufficient: 422, brief_blocked: 422, limit: 409, nothing_to_undo: 409, undo_unsupported: 409, nothing_to_redo: 409, redo_unsupported: 409, manual_protected: 409, locked: 409, critical_issues: 422, format: 502, too_long: 502, refusal: 422 };
const AI_CODES = /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|format)$/;

module.exports = () => {
  const router = express.Router();
  const P = "/site-web/sites/:id(\\d+)/createur-ia";
  const A = `${P}/api/projets/:pid(\\d+)`;
  const siteId = (req) => Number(req.params.id);
  const pid = (req) => Number(req.params.pid);
  const body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  // Réponse JSON uniforme : { ok, … } ; erreurs connues → message lisible, jamais de détail interne ni de secret
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, siteId(req), req)).then((data) => res.set("Cache-Control", "no-store").json({ ok: true, ...data })).catch((e) => {
    if (e instanceof MarketingError || e instanceof AiError || (e && typeof e.code === "string" && AI_CODES.test(e.code))) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
    next(e);
  });
  const page = (req, res, next) => {
    try {
      const ctx = req.mk.ctx, id = siteId(req);
      const site = b.siteOf(ctx, id);
      res.set("Cache-Control", "no-store").render("marketing/site-ai-builder", {
        title: "Créateur de site IA", site: { id: site.id, name: site.name }, projectId: req.params.pid ? Number(req.params.pid) : null,
        base: `/marketing/site-web/sites/${id}/createur-ia`, siteBase: `/marketing/site-web/sites/${id}`,
        perms: { write: req.mk.can("forms.write"), design: req.mk.can("appearance.styles"), publish: req.mk.can("pages.publish") },
      });
    } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  };
  router.get(P, need("forms.read"), page);
  router.get(`${P}/:pid(\\d+)`, need("forms.read"), page);

  router.get(`${P}/api/projets`, need("forms.read"), run((ctx, id) => ({ projects: b.listProjects(ctx, id) })));
  router.post(`${P}/api/projets`, need("forms.write"), run((ctx, id, req) => ({ project: b.createProject(ctx, id, { name: body(req).name }) })));
  router.post(`${A}/archiver`, need("forms.write"), run((ctx, id, req) => b.archiveProject(ctx, id, pid(req))));
  router.get(`${A}/etat`, need("forms.read"), run((ctx, id, req) => b.state(ctx, id, pid(req))));
  router.post(`${A}/brouillon`, need("forms.write"), run((ctx, id, req) => ({ project: b.saveDraft(ctx, id, pid(req), { fields: body(req).fields, revision: body(req).revision }) })));
  // 1-2 : brief et plan (Brief Analyzer / Site Planner)
  router.get(`${A}/plan`, need("forms.read"), run((ctx, id, req) => ({ plan: b.planView(ctx, b.shape(b.row(ctx, id, pid(req)))) })));
  router.post(`${A}/analyser`, need("forms.write"), run((ctx, id, req) => b.analyze(ctx, id, pid(req))));
  router.post(`${A}/reponses`, need("forms.write"), run((ctx, id, req) => b.answer(ctx, id, pid(req), body(req).answers)));
  router.post(`${A}/planifier`, need("forms.write"), run((ctx, id, req) => b.planify(ctx, id, pid(req), { proceedWithAssumptions: body(req).proceedWithAssumptions === true })));
  router.post(`${A}/plan/modifier`, need("forms.write"), run((ctx, id, req) => b.editPlan(ctx, id, pid(req), body(req).operation, body(req).revision)));
  router.post(`${A}/plan/valider`, need("forms.write"), run((ctx, id, req) => b.validatePlan(ctx, id, pid(req), body(req).revision)));
  // 3 : pages (Page Generator)
  router.get(`${A}/pages`, need("forms.read"), run((ctx, id, req) => ({ pages: b.projectPages(ctx, id, b.shape(b.row(ctx, id, pid(req)))), run: runView(ctx, id, b.shape(b.row(ctx, id, pid(req)))) })));
  router.post(`${A}/pages/generer`, need("forms.write"), run((ctx, id, req) => b.generatePages(ctx, id, pid(req), { useAi: body(req).ia === true })));
  router.post(`${A}/pages/appliquer`, need("forms.write"), run((ctx, id, req) => b.applyPages(ctx, id, pid(req), { decisions: body(req).decisions && typeof body(req).decisions === "object" ? body(req).decisions : {}, confirmReplace: body(req).confirmReplace === true })));
  router.post(`${A}/pages/annuler`, need("forms.write"), run((ctx, id, req) => b.undoPages(ctx, id, pid(req))));
  // 4 : design (Design Generator)
  router.get(`${A}/design`, need("appearance.read"), run((ctx, id, req) => { const p = b.shape(b.row(ctx, id, pid(req))); return { run: p.links.designRun ? designGen.getRun(ctx, id, p.links.designRun) : null }; }));
  router.post(`${A}/design/generer`, need("appearance.styles"), run((ctx, id, req) => b.generateDesign(ctx, id, pid(req), { text: String(body(req).text || ""), useAi: body(req).ia === true })));
  router.get(`${A}/design/comparer`, need("appearance.read"), run((ctx, id, req) => ({ comparison: b.designCompare(ctx, id, pid(req), String(req.query.key || ""), req.mk.can) })));
  router.post(`${A}/design/appliquer`, need("appearance.styles"), run((ctx, id, req) => b.applyDesign(ctx, id, pid(req), { key: String(body(req).key || ""), overwrite: body(req).overwrite === true, can: req.mk.can })));
  router.post(`${A}/design/annuler`, need("appearance.styles"), run((ctx, id, req) => b.undoDesign(ctx, id, pid(req), req.mk.can)));
  // 5 : contenus (Content Generator) — révision, choix, édition, verrou : routes /contenus/… du moteur, appelées directement par l'interface
  router.get(`${A}/contenus`, need("forms.read"), run((ctx, id, req) => { const p = b.shape(b.row(ctx, id, pid(req))); const pages = b.projectPages(ctx, id, p).filter((x) => !x.missing); return { pages: pages.map((x) => ({ ...x, sets: contentGen.listSets(ctx, id, { pageId: x.pageId }) })) }; }));
  router.post(`${A}/contenus/generer`, need("forms.write"), run((ctx, id, req) => b.generateContent(ctx, id, pid(req), { pageId: body(req).pageId, scope: body(req).scope, voice: body(req).voice })));
  router.post(`${A}/contenus/appliquer`, need("forms.write"), run((ctx, id, req) => b.applyContent(ctx, id, pid(req), { setId: body(req).setId, overwriteManual: Array.isArray(body(req).overwriteManual) ? body(req).overwriteManual.map(String) : [] })));
  // 6 : médias (AI Media / Asset Manager)
  router.get(`${A}/medias`, need("forms.read"), run((ctx, id, req) => { b.row(ctx, id, pid(req)); return b.mediaState(ctx, id); }));
  router.post(`${A}/medias/planifier`, need("forms.write"), run((ctx, id, req) => { const p = b.shape(b.row(ctx, id, pid(req))); return { needs: aiMedia.plan(ctx, id, { pageIds: b.projectPages(ctx, id, p).filter((x) => !x.missing).map((x) => x.pageId) }) }; }));
  router.post(`${A}/medias/estimer`, need("forms.read"), run((ctx, id, req) => { b.row(ctx, id, pid(req)); return { estimate: aiMedia.estimate(ctx, id, { needKeys: body(req).needKeys, provider: body(req).provider || "demo", model: body(req).model || "", variants: body(req).variants }) }; }));
  router.post(`${A}/medias/generer`, need("forms.write"), run((ctx, id, req) => b.mediaStart(ctx, id, pid(req), { needKeys: body(req).needKeys, provider: body(req).provider || "demo", model: body(req).model || "", variants: body(req).variants, prompt: body(req).prompt, regenerate: body(req).regenerate === true })));
  router.post(`${A}/medias/affecter`, need("forms.write"), run((ctx, id, req) => b.mediaAssign(ctx, id, pid(req), { needKey: body(req).needKey, mediaId: Number(body(req).mediaId), alt: body(req).alt, replace: body(req).replace === true, confirmManual: body(req).confirmManual === true })));
  router.post(`${A}/medias/annuler-tache`, need("forms.write"), run((ctx, id, req) => { b.row(ctx, id, pid(req)); return { task: aiMedia.cancel(ctx, id, Number(body(req).taskId)) }; }));
  router.post(`${A}/medias/relancer-tache`, need("forms.write"), run((ctx, id, req) => { b.row(ctx, id, pid(req)); return { task: aiMedia.retry(ctx, id, Number(body(req).taskId)) }; }));
  // 7-8 : aperçu et publication
  router.get(`${A}/apercu`, need("forms.read"), run((ctx, id, req) => { const p = b.shape(b.row(ctx, id, pid(req))); const pages = b.projectPages(ctx, id, p).filter((x) => !x.missing); return { pages, checks: b.previewChecks(ctx, id, pages), previewed: Boolean(p.approvals.previewed) }; }));
  router.post(`${A}/apercu/valider`, need("forms.write"), run((ctx, id, req) => ({ project: b.approve(ctx, id, pid(req), "previewed", body(req).value !== false) })));
  router.get(`${A}/publication`, need("forms.read"), run((ctx, id, req) => ({ check: b.publishCheck(ctx, id, b.shape(b.row(ctx, id, pid(req)))) })));
  router.post(`${A}/publication/publier`, need("pages.publish"), run((ctx, id, req) => b.publish(ctx, id, pid(req), { confirm: body(req).confirm === true })));
  // journal, annuler / rétablir, assistant
  router.get(`${A}/journal`, need("forms.read"), run((ctx, id, req) => ({ events: b.events(ctx, id, pid(req), { limit: Number(req.query.limite) || 60 }) })));
  router.post(`${A}/annuler`, need("forms.write"), run((ctx, id, req) => b.undo(ctx, id, pid(req), { can: req.mk.can })));
  router.post(`${A}/retablir`, need("forms.write"), run((ctx, id, req) => b.redo(ctx, id, pid(req))));
  router.post(`${A}/assistant`, need("forms.write"), run((ctx, id, req) => assistant.propose(ctx, id, pid(req), { message: body(req).message, step: String(body(req).step || ""), pageKey: body(req).pageKey ? String(body(req).pageKey) : null, fieldKey: body(req).fieldKey ? String(body(req).fieldKey) : null, setId: body(req).setId ? Number(body(req).setId) : null, needKey: body(req).needKey ? String(body(req).needKey) : null, can: req.mk.can })));
  router.post(`${A}/assistant/:eid(\\d+)/decider`, need("forms.write"), run((ctx, id, req) => assistant.decide(ctx, id, pid(req), Number(req.params.eid), body(req).accept === true, { can: req.mk.can, replaceManual: body(req).replaceManual === true })));
  return router;
};
// Résumé de la génération de pages (sans les sections complètes) pour l'étape Pages
function runView(ctx, id, p) {
  if (!p.links.pagegenRun) return null;
  try {
    const r = require("../../pageGen").getRun(ctx, id, p.links.pagegenRun);
    return { id: r.id, status: r.status, warnings: r.result.warnings || [], pages: r.result.pages.map((x) => ({ key: x.key, name: x.name, status: x.status, reason: x.reason || "", sections: (x.sections || []).length, existing: x.existing, warnings: (x.warnings || []).slice(0, 6), errors: x.errors || [] })) };
  } catch { return null; }
}
