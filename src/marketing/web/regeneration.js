// Intelligent Regeneration & History (programme 21.9) : écran /site-web/sites/:id/regeneration + API JSON. Le site vient de l'ADRESSE (revérifié par le service), jamais du corps.
// Droits : forms.read (voir l'historique, comparer) · forms.write (demander, appliquer, refuser, protéger) · revisions.restore + forms.write (restaurer, annuler, rétablir) · revisions.delete (nettoyage, simulation par défaut).
// Rien n'est publié : toutes les écritures vont dans les BROUILLONS.
const express = require("express");
const R = require("../../regen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const { AiError } = require("../ai");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, not_configured: 503, quota: 429, rate: 429, conflict: 409, protected: 423, needs_confirmation: 409, confirm_required: 409, ambiguous: 422, unsupported_claim: 422, nothing_to_undo: 409, nothing_to_redo: 409, irreversible: 409, nothing_to_generate: 422, nothing_to_apply: 422, too_large: 413, format: 502, too_long: 502, refusal: 422 };
const AI_CODES = /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|format)$/;

module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/regeneration";
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
    if (e instanceof MarketingError || e instanceof AiError || (e && typeof e.code === "string" && AI_CODES.test(e.code))) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code, detail: e.detail, candidates: e.candidates });
    next(e);
  });
  const both = (a, b) => (req, res, next) => (req.mk.can(a) && req.mk.can(b) ? next() : res.status(403).json({ ok: false, error: "Droit insuffisant pour cette action.", code: "forbidden" }));
  router.get(B, need("forms.read"), need("templates.read"), (req, res, next) => {
    try { const site = R.ctxLib.siteGuard(req.mk.ctx, sid(req)); res.set("Cache-Control", "no-store").render("marketing/site-regen", { title: "Modifier avec l'IA et historique", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/regeneration`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { write: req.mk.can("forms.write"), restore: req.mk.can("revisions.restore") && req.mk.can("forms.write"), prune: req.mk.can("revisions.delete") } }); }
    catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  const A = `${B}/api`;
  router.get(`${A}/pages`, need("forms.read"), need("templates.read"), run((ctx, id) => { R.ctxLib.siteGuard(ctx, id); return { pages: require("../pages").sitePages(ctx, id).map((p) => ({ id: p.id, name: p.name })) }; }));
  router.post(`${A}/demander`, need("forms.write"), run(async (ctx, id, req) => { const site = R.ctxLib.siteGuard(ctx, id), b = body(req); return R.propose(ctx, id, { text: b.text, selection: sel(b.selection), context: { facts: { company_name: site.name }, language: "fr" }, can: req.mk.can }); }));
  router.post(`${A}/operations/:oid(\\d+)/appliquer`, need("forms.write"), run((ctx, id, req) => R.apply(ctx, id, Number(req.params.oid), { confirm: body(req).confirm === true, allow: Array.isArray(body(req).allow) ? body(req).allow.map(String) : [], resolve: body(req).resolve === "use_ai" ? "use_ai" : null, can: req.mk.can })));
  router.post(`${A}/operations/:oid(\\d+)/refuser`, need("forms.write"), run((ctx, id, req) => R.reject(ctx, id, Number(req.params.oid))));
  router.post(`${A}/annuler`, both("forms.write", "revisions.restore"), run((ctx, id, req) => R.undo(ctx, id, body(req).opId ? Number(body(req).opId) : null, { restoreAnyway: body(req).restoreAnyway === true, can: req.mk.can })));
  router.post(`${A}/retablir`, both("forms.write", "revisions.restore"), run((ctx, id, req) => R.redo(ctx, id, body(req).opId ? Number(body(req).opId) : null, { restoreAnyway: body(req).restoreAnyway === true, can: req.mk.can })));
  router.get(`${A}/historique`, need("forms.read"), need("templates.read"), run((ctx, id, req) => R.history(ctx, id, { pageId: num(req.query.page), sectionId: str(req.query.section), actor: str(req.query.acteur), status: str(req.query.statut), kind: str(req.query.type), limit: num(req.query.limite) || 25, offset: num(req.query.debut) || 0 })));
  router.get(`${A}/operations/:oid(\\d+)`, need("forms.read"), need("templates.read"), run((ctx, id, req) => ({ operation: R.getOperation(ctx, id, Number(req.params.oid)) })));
  router.get(`${A}/versions`, need("forms.read"), need("templates.read"), run((ctx, id, req) => ({ ...R.listSnapshots(ctx, id, { level: str(req.query.niveau), ref: str(req.query.ref), pageId: num(req.query.page), limit: num(req.query.limite) || 25, offset: num(req.query.debut) || 0 }), stats: R.snapshotStats(ctx, id) })));
  router.get(`${A}/versions/:vid(\\d+)`, need("forms.read"), need("templates.read"), run((ctx, id, req) => ({ version: R.getSnapshot(ctx, id, Number(req.params.vid)) })));
  router.post(`${A}/versions`, need("forms.write"), run((ctx, id, req) => ({ snapshot: R.takeSnapshot(ctx, id, { level: str(body(req).level), pageId: num(body(req).pageId), sectionId: str(body(req).sectionId), nodeId: str(body(req).nodeId), label: str(body(req).label) || "", can: req.mk.can }) })));
  router.get(`${A}/comparer`, need("forms.read"), need("templates.read"), run((ctx, id, req) => ({ comparison: req.query.vs === "actuel" ? R.compareWithCurrent(ctx, id, Number(req.query.a), { can: req.mk.can }) : R.compare(ctx, id, Number(req.query.a), Number(req.query.b)) })));
  router.post(`${A}/restaurer`, both("forms.write", "revisions.restore"), run((ctx, id, req) => R.restore(ctx, id, Number(body(req).snapshotId), { scope: body(req).scope && typeof body(req).scope === "object" ? { sectionId: str(body(req).scope.sectionId), nodeId: str(body(req).scope.nodeId) } : null, restoreAnyway: body(req).restoreAnyway === true, can: req.mk.can })));
  router.get(`${A}/protections`, need("forms.read"), need("templates.read"), run((ctx, id, req) => R.protections(ctx, id, num(req.query.page))));
  router.post(`${A}/protections`, need("forms.write"), run((ctx, id, req) => ({ protection: R.setProtection(ctx, id, { kind: str(body(req).kind), ref: str(body(req).ref), state: str(body(req).state), reason: str(body(req).reason) || "" }) })));
  router.get(`${A}/consommation`, need("forms.read"), need("templates.read"), run((ctx, id) => ({ usage: R.usage(ctx, id) })));
  router.post(`${A}/versions/nettoyer`, need("revisions.delete"), run((ctx, id, req) => ({ result: R.pruneSnapshots(ctx, id, { olderThanDays: num(body(req).jours), keepLastPerRef: num(body(req).garder), dryRun: body(req).confirmer !== true }) })));
  return router;
};
const str = (v) => (v === undefined || v === null || v === "" ? null : String(v).slice(0, 160)), num = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const sel = (s) => { const o = s && typeof s === "object" ? s : {}; return { pageId: num(o.pageId), sectionId: str(o.sectionId), nodeId: str(o.nodeId), fieldKey: str(o.fieldKey) }; };
