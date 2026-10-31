// Responsive Studio (programme 22.8) : /site-web/sites/:id/responsive — diagnostic par page, profils d'écran du site, propositions de correction (aperçu → application → annulation).
// Le site vient de l'ADRESSE (revérifié par le service). Droits : forms.read (voir) · forms.write (proposer, appliquer, refuser) · revisions.restore + forms.write (annuler).
const express = require("express");
const RS = require("../../responsive");
const R = require("../../regen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const siteSettings = require("../pages/siteSettings");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, protected: 423, confirm_required: 409, needs_confirmation: 409, invalid_field: 422, nothing_to_do: 422 };
module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/responsive", A = `${B}/api`;
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
    if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code, blocked: e.blocked });
    next(e);
  });
  const both = (a, b) => (req, res, next) => (req.mk.can(a) && req.mk.can(b) ? next() : res.status(403).json({ ok: false, error: "Droit insuffisant pour cette action.", code: "forbidden" }));
  const breakpointsOf = (ctx, id) => { R.ctxLib.siteGuard(ctx, id); const site = require("../pages").getSite(ctx, id); return siteSettings.breakpointsOf(site && site.settings); };
  router.get(B, need("forms.read"), need("templates.read"), (req, res, next) => {
    try {
      const site = R.ctxLib.siteGuard(req.mk.ctx, sid(req));
      res.set("Cache-Control", "no-store").render("marketing/site-responsive", { title: "Responsive et mobile", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/responsive`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { write: req.mk.can("forms.write"), restore: req.mk.can("revisions.restore") && req.mk.can("forms.write") } });
    } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  router.get(`${A}/profils`, need("forms.read"), need("templates.read"), run((ctx, id) => { const bp = breakpointsOf(ctx, id); return { breakpoints: RS.breakpoints.normalize(bp), issues: RS.breakpoints.check(bp), profiles: RS.breakpoints.profilesFor(bp) }; }));
  router.get(`${A}/pages`, need("forms.read"), need("templates.read"), run((ctx, id) => { R.ctxLib.siteGuard(ctx, id); return { pages: require("../pages").sitePages(ctx, id).map((p) => ({ id: p.id, name: p.name })) }; }));
  router.get(`${A}/analyse`, need("forms.read"), need("templates.read"), run((ctx, id) => RS.apply.analyseSite(ctx, id)));
  router.get(`${A}/pages/:pid(\\d+)/analyse`, need("forms.read"), need("templates.read"), run((ctx, id, req) => RS.apply.analysePage(ctx, id, Number(req.params.pid))));
  router.post(`${A}/proposer`, need("forms.write"), run((ctx, id, req) => { const b = body(req); return RS.apply.propose(ctx, id, { pageId: Number(b.pageId), scope: String(b.scope || "page"), sectionId: typeof b.sectionId === "string" ? b.sectionId.slice(0, 40) : null, nodeId: typeof b.nodeId === "string" ? b.nodeId.slice(0, 40) : null, rules: Array.isArray(b.rules) ? b.rules.slice(0, 20).map((x) => String(x).slice(0, 40)) : null, request: typeof b.request === "string" ? b.request.slice(0, 300) : "" }); }));
  router.post(`${A}/operations/:oid(\\d+)/appliquer`, need("forms.write"), run((ctx, id, req) => RS.apply.apply(ctx, id, Number(req.params.oid), { confirm: body(req).confirm === true, allow: Array.isArray(body(req).allow) ? body(req).allow.slice(0, 20).map((x) => String(x).slice(0, 40)) : [] })));
  router.post(`${A}/operations/:oid(\\d+)/refuser`, need("forms.write"), run((ctx, id, req) => RS.apply.reject(ctx, id, Number(req.params.oid))));
  router.post(`${A}/operations/:oid(\\d+)/annuler`, both("forms.write", "revisions.restore"), run((ctx, id, req) => RS.apply.undo(ctx, id, Number(req.params.oid), { restoreAnyway: body(req).restoreAnyway === true, can: req.mk.can })));
  return router;
};
