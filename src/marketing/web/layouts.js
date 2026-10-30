// Advanced Layout Generation (programme 22.3) : écran /site-web/sites/:id/mises-en-page + API JSON. Le site vient de l'ADRESSE (revérifié par le service), jamais du corps.
// Droits : forms.read (voir, comparer) · forms.write (proposer, appliquer, refuser) · revisions.restore + forms.write (annuler). Rien n'est publié : écritures dans les BROUILLONS, via les normaliseurs natifs.
const express = require("express");
const LA = require("../../layoutGen/apply");
const L = require("../../layoutGen");
const R = require("../../regen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, protected: 423, needs_confirmation: 409, confirm_required: 409, invalid_field: 422 };
module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/mises-en-page", A = `${B}/api`;
  const sid = (req) => Number(req.params.id), body = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  const siteOf = (ctx, id) => { const s = R.ctxLib.siteGuard(ctx, id); return { name: s.name, description: s.description || "" }; };
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
    if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code, blocked: e.blocked });
    next(e);
  });
  const both = (a, b) => (req, res, next) => (req.mk.can(a) && req.mk.can(b) ? next() : res.status(403).json({ ok: false, error: "Droit insuffisant pour cette action.", code: "forbidden" }));
  router.get(B, need("forms.read"), need("templates.read"), (req, res, next) => {
    try { const site = R.ctxLib.siteGuard(req.mk.ctx, sid(req)); res.set("Cache-Control", "no-store").render("marketing/site-layouts", { title: "Mises en page avancées", active: "sites", marketingShell: true, siteId: site.id, siteName: site.name, base: `/marketing/site-web/sites/${site.id}/mises-en-page`, siteBase: `/marketing/site-web/sites/${site.id}`, perms: { write: req.mk.can("forms.write"), restore: req.mk.can("revisions.restore") && req.mk.can("forms.write") } }); }
    catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : 422).render("error", { message: e.message }); next(e); }
  });
  router.get(`${A}/catalogue`, need("forms.read"), need("templates.read"), run((ctx, id) => { R.ctxLib.siteGuard(ctx, id); return LA.catalog(); }));
  router.get(`${A}/pages`, need("forms.read"), need("templates.read"), run((ctx, id) => { R.ctxLib.siteGuard(ctx, id); return { pages: require("../pages").sitePages(ctx, id).map((p) => ({ id: p.id, name: p.name })) }; }));
  router.get(`${A}/pages/:pid(\\d+)/sections`, need("forms.read"), need("templates.read"), run((ctx, id, req) => LA.sectionsOf(ctx, id, Number(req.params.pid))));
  router.post(`${A}/variantes`, need("forms.read"), need("templates.read"), run((ctx, id, req) => { const b = body(req); return LA.variantsFor(ctx, id, { pageId: Number(b.pageId), sectionId: typeof b.sectionId === "string" ? b.sectionId.slice(0, 40) : null, role: typeof b.role === "string" ? b.role.slice(0, 20) : null, content: b.content && typeof b.content === "object" ? b.content : null, site: siteOf(ctx, id), pageInfo: { type: typeof b.pageType === "string" ? b.pageType.slice(0, 40) : "" } }); }));
  router.post(`${A}/page`, need("forms.read"), need("templates.read"), run((ctx, id, req) => { const b = body(req); const r = L.composePage(ctx, { key: "page", name: String(b.name || "Page").slice(0, 100), type: String(b.type || "").slice(0, 40), goal: String(b.goal || "").slice(0, 300), sections: Array.isArray(b.sections) ? b.sections.slice(0, 14) : [] }, siteOf(ctx, id)); return { intent: r.intent, report: r.report, metrics: r.metrics, wires: r.sections.map((s) => ({ desktop: LA.wire(s, "desktop"), tablet: LA.wire(s, "tablet"), mobile: LA.wire(s, "mobile") })) }; }));
  router.post(`${A}/proposer`, need("forms.write"), run((ctx, id, req) => { const b = body(req); return LA.propose(ctx, id, { pageId: Number(b.pageId), items: Array.isArray(b.items) ? b.items.slice(0, 12).map((x) => ({ role: typeof x.role === "string" ? x.role.slice(0, 20) : undefined, content: x.content && typeof x.content === "object" ? x.content : undefined, patternId: typeof x.patternId === "string" ? x.patternId.slice(0, 60) : undefined, sectionId: typeof x.sectionId === "string" ? x.sectionId.slice(0, 40) : undefined, index: Number.isInteger(x.index) ? x.index : undefined })) : [], site: siteOf(ctx, id), page: { type: typeof b.pageType === "string" ? b.pageType.slice(0, 40) : "" } }); }));
  router.post(`${A}/operations/:oid(\\d+)/appliquer`, need("forms.write"), run((ctx, id, req) => LA.apply(ctx, id, Number(req.params.oid), { confirm: body(req).confirm === true, allow: Array.isArray(body(req).allow) ? body(req).allow.slice(0, 50).map(String) : [] })));
  router.post(`${A}/operations/:oid(\\d+)/refuser`, need("forms.write"), run((ctx, id, req) => LA.reject(ctx, id, Number(req.params.oid))));
  router.post(`${A}/operations/:oid(\\d+)/annuler`, both("forms.write", "revisions.restore"), run((ctx, id, req) => LA.undo(ctx, id, Number(req.params.oid), { restoreAnyway: body(req).restoreAnyway === true, can: req.mk.can })));
  return router;
};
