// Constructeur de boutique par IA (Programme 21.10) : pages HTML + API JSON sous /marketing/ia/studio/boutique/… (préfixe /ia : gardé par le module « ia » du site ; `?site=` pour un accès limité).
// Les routes n'ont AUCUNE logique commerciale : elles appellent ai/shop/project.js, qui n'écrit dans le moteur e-commerce que par ses services natifs. Droits vérifiés ici, côté serveur :
// lecture forms.read · brouillons forms.write · catalogue/ouverture shop.write / shop.payments · design appearance.styles · pages pages.publish.
const express = require("express");
const { AiError } = require("../ai");
const { MarketingError } = require("../errors");
const project = require("../ai/shop/project");
const assistant = require("../ai/shop/assistant");
const pagesLib = require("../pages");
const { need } = require("./kit");

const STATUS = { not_configured: 503, quota: 429, rate: 429, conflict: 409, not_found: 404, forbidden: 403, module_disabled: 403, invalid_field: 422, limit: 422, not_accepted: 409, nothing_to_undo: 409, nothing_to_redo: 409, preflight_failed: 422, brief_too_short: 400, brief_too_long: 413 };
const AI_CODES = /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|bad_json|format)$/;

module.exports = () => {
  const router = express.Router();
  const B = "/ia/studio/boutique";
  const body = (req) => (req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {});
  const pid = (req) => Number(req.params.id);
  const send = (res, next, run) => Promise.resolve().then(run).then((data) => res.set("Cache-Control", "no-store").json({ ok: true, ...data })).catch((e) => {
    const known = e instanceof MarketingError || e instanceof AiError || (e && e.name === "Error" && typeof e.code === "string" && AI_CODES.test(e.code)) || (e && e.name === "UserError");
    if (known) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code || "error" });
    return next(e);
  });
  const can = (req) => (p) => req.mk.can(p);
  const st = (req) => ({ state: project.state(req.mk.ctx, pid(req), { can: can(req) }) });
  const html = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : e.code === "forbidden" || e.code === "module_disabled" ? 403 : 422).render("error", { message: e.message }); next(e); } };

  router.get(`${B}/projets.json`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => ({ projects: project.list(req.mk.ctx) })));
  router.post(`${B}/projets`, need("forms.write"), (req, res, next) => send(res, next, () => {
    const b = body(req); const v = project.createWithSite(req.mk.ctx, { brief: b.brief, siteId: b.siteId ? Number(b.siteId) : undefined, newSiteName: b.newSiteName });
    return { id: v.id, url: `/marketing${B}/${v.id}?site=${v.siteId}` };
  }));
  router.get(`${B}/:id(\\d+)`, need("forms.read"), need("templates.read"), html((req, res) => {
    const s = project.state(req.mk.ctx, pid(req), { can: can(req) });
    const json = JSON.stringify(s).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    res.set("Cache-Control", "no-store").render("marketing/ai-shop", { title: s.project.name, project: s.project, id: pid(req), canWrite: req.mk.can("forms.write"), canShop: req.mk.can("shop.write"), canPayments: req.mk.can("shop.payments"), canDesign: req.mk.can("appearance.styles"), canPublish: req.mk.can("pages.publish"), initialJson: json, base: `/marketing${B}/${pid(req)}`, steps: project.STEPS });
  }));
  router.get(`${B}/:id(\\d+)/etat.json`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => st(req)));
  router.post(`${B}/:id(\\d+)/modifier`, need("forms.write"), (req, res, next) => send(res, next, () => { project.edit(req.mk.ctx, pid(req), body(req).operation, { revision: body(req).revision }); return st(req); }));
  router.post(`${B}/:id(\\d+)/annuler`, need("forms.write"), (req, res, next) => send(res, next, () => { project.undo(req.mk.ctx, pid(req), { revision: body(req).revision }); return st(req); }));
  router.post(`${B}/:id(\\d+)/retablir`, need("forms.write"), (req, res, next) => send(res, next, () => { project.redo(req.mk.ctx, pid(req), { revision: body(req).revision }); return st(req); }));
  router.post(`${B}/:id(\\d+)/assistant`, need("forms.write"), (req, res, next) => send(res, next, () => { const v = project.view(project.load(req.mk.ctx, pid(req))); return { reply: assistant.interpret(body(req).message, { structure: v.structure, plan: v.plan }), revision: v.revision }; }));

  // Produits : contenu, CSV
  router.post(`${B}/:id(\\d+)/produits/:key/generer`, need("forms.write"), (req, res, next) => send(res, next, async () => { await project.generateProduct(req.mk.ctx, pid(req), req.params.key, { useAi: body(req).useAi === true, style: body(req).style }); return st(req); }));
  router.post(`${B}/:id(\\d+)/csv/apercu`, need("forms.write"), (req, res, next) => send(res, next, () => ({ preview: project.previewCsv(req.mk.ctx, pid(req), body(req).text) })));
  router.post(`${B}/:id(\\d+)/csv/ajouter`, need("forms.write"), (req, res, next) => send(res, next, () => { project.addCsv(req.mk.ctx, pid(req), body(req).text, { revision: body(req).revision }); return st(req); }));

  // Application au moteur e-commerce (droits du catalogue : shop.write ; configuration : shop.payments)
  router.post(`${B}/:id(\\d+)/appliquer/structure`, need("shop.write"), (req, res, next) => send(res, next, () => ({ result: project.applyStructure(req.mk.ctx, pid(req)), ...st(req) })));
  router.post(`${B}/:id(\\d+)/appliquer/pages`, need("pages.publish"), (req, res, next) => send(res, next, async () => ({ result: await project.applyPages(req.mk.ctx, pid(req)), ...st(req) })));
  router.post(`${B}/:id(\\d+)/appliquer/produits`, need("shop.write"), (req, res, next) => send(res, next, () => ({ result: project.applyProducts(req.mk.ctx, pid(req), Array.isArray(body(req).keys) ? body(req).keys.map(String) : null), ...st(req) })));
  router.post(`${B}/:id(\\d+)/appliquer/configuration`, need("shop.payments"), (req, res, next) => send(res, next, () => ({ result: project.applyConfig(req.mk.ctx, pid(req), body(req).items || null), ...st(req) })));

  // Médias : médiathèque du site uniquement
  router.get(`${B}/:id(\\d+)/media/bibliotheque`, need("forms.read"), need("templates.read"), (req, res, next) => send(res, next, () => { const v = project.load(req.mk.ctx, pid(req)); return { items: require("../../aiMedia").library(req.mk.ctx, v.site_id, { q: String(req.query.q || "").slice(0, 80), limit: 40 }) }; }));
  router.post(`${B}/:id(\\d+)/media/produit`, need("shop.write"), (req, res, next) => send(res, next, () => ({ result: project.assignImage(req.mk.ctx, pid(req), Number(body(req).productId), Number(body(req).mediaId), { alt: body(req).alt }), ...st(req) })));

  // Design
  router.post(`${B}/:id(\\d+)/design/generer`, need("appearance.styles"), (req, res, next) => send(res, next, async () => ({ ...(await project.generateDesign(req.mk.ctx, pid(req), body(req).brief || {}, { useAi: body(req).useAi === true })), ...st(req) })));
  router.get(`${B}/:id(\\d+)/design/:rid(\\d+)/comparer`, need("appearance.read"), need("templates.read"), (req, res, next) => send(res, next, () => ({ comparison: project.designCompare(req.mk.ctx, pid(req), req.params.rid, String(req.query.variante || ""), { can: can(req) }) })));
  router.post(`${B}/:id(\\d+)/design/:rid(\\d+)/appliquer`, need("appearance.styles"), (req, res, next) => send(res, next, () => ({ result: project.designApply(req.mk.ctx, pid(req), req.params.rid, String(body(req).variante || ""), { overwrite: false, can: can(req), userId: req.session.user.id }), ...st(req) })));
  router.post(`${B}/:id(\\d+)/design/:rid(\\d+)/annuler`, need("appearance.styles"), (req, res, next) => send(res, next, () => ({ result: project.designUndo(req.mk.ctx, pid(req), req.params.rid, { can: can(req), userId: req.session.user.id }), ...st(req) })));

  // Publication (produits choisis + pages ; ouverture de la boutique seulement si demandée et autorisée)
  router.post(`${B}/:id(\\d+)/publier`, need("shop.write"), (req, res, next) => send(res, next, () => ({ result: project.publish(req.mk.ctx, pid(req), { productIds: Array.isArray(body(req).productIds) ? body(req).productIds.map(Number) : null, pages: body(req).pages !== false, open: body(req).open === true }, { can: can(req) }), ...st(req) })));
  return router;
};
