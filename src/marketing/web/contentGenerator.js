// AI Content Generator (programme 21.6) : API JSON d'un site, sous /site-web/sites/:id/contenus. Le site vient de l'ADRESSE (revérifié par le service), jamais du corps.
// Droits : forms.read (voir) · forms.write (générer, réviser, appliquer). Ne publie jamais : l'application écrit un BROUILLON de page (révision contrôlée). L'IA passe par ai.call côté serveur.
const express = require("express");
const content = require("../../contentGen");
const { MarketingError } = require("../errors");
const { need } = require("./kit");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, not_configured: 503, quota: 429, rate: 429, conflict: 409, locked: 409, manual_protected: 409, critical_issues: 422, nothing_to_generate: 422, language_unsupported: 422, too_large: 413, target_required: 400, format: 502, too_long: 502, refusal: 422 };
const AI_CODES = /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|format)$/;

module.exports = () => {
  const router = express.Router();
  const B = "/site-web/sites/:id(\\d+)/contenus";
  const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, Number(req.params.id), req.body && typeof req.body === "object" ? req.body : {}, req)).then((data) => res.set("Cache-Control", "no-store").json({ ok: true, ...data })).catch((e) => {
    if (e instanceof MarketingError || (e && typeof e.code === "string" && AI_CODES.test(e.code))) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
    next(e);
  });
  const sid = (req) => Number(req.params.sid);
  router.get(`${B}/voix`, need("forms.read"), run((ctx, id) => ({ voice: content.getVoice(ctx, id), orientations: content.voice.ORIENTATIONS })));
  router.post(`${B}/voix`, need("forms.write"), run((ctx, id, b) => ({ voice: content.setVoice(ctx, id, b.voice) })));
  router.get(`${B}/ensembles`, need("forms.read"), run((ctx, id, b, req) => ({ sets: content.listSets(ctx, id, { pageId: req.query.page ? Number(req.query.page) : null }) })));
  router.get(`${B}/ensembles/:sid(\\d+)`, need("forms.read"), run((ctx, id, b, req) => ({ set: content.getSet(ctx, id, sid(req)), history: content.history(ctx, id, sid(req), req.query.champ ? String(req.query.champ) : undefined) })));
  router.post(`${B}/generer`, need("forms.write"), run(async (ctx, id, b) => ({ set: await content.generatePage(ctx, id, { pageId: Number(b.pageId), context: b.context, voiceOverride: b.voice, language: b.language, only: Array.isArray(b.sections) ? b.sections.map(String) : null, scope: b.scope === "all" ? "all" : "empty", pageType: String(b.pageType || ""), goal: String(b.goal || "") }) })));
  router.post(`${B}/generer-pages`, need("forms.write"), run(async (ctx, id, b) => ({ ...(await content.generateSite(ctx, id, { pageIds: (Array.isArray(b.pageIds) ? b.pageIds : []).map(Number), context: b.context, voiceOverride: b.voice, language: b.language, scope: b.scope === "all" ? "all" : "empty" })) })));
  router.post(`${B}/ensembles/:sid(\\d+)/reviser`, need("forms.write"), run(async (ctx, id, b, req) => await content.revise(ctx, id, sid(req), { fieldKey: String(b.field || ""), op: String(b.op || ""), instruction: String(b.instruction || ""), count: b.count })));
  router.post(`${B}/ensembles/:sid(\\d+)/choisir`, need("forms.write"), run((ctx, id, b, req) => content.choose(ctx, id, sid(req), { fieldKey: String(b.field || ""), variantId: Number(b.variant), replaceManual: b.replaceManual === true })));
  router.post(`${B}/ensembles/:sid(\\d+)/modifier`, need("forms.write"), run((ctx, id, b, req) => ({ set: content.editField(ctx, id, sid(req), { fieldKey: String(b.field || ""), text: b.text }) })));
  router.post(`${B}/ensembles/:sid(\\d+)/verrouiller`, need("forms.write"), run((ctx, id, b, req) => ({ set: content.lockField(ctx, id, sid(req), { fieldKey: String(b.field || ""), locked: b.locked !== false }) })));
  router.post(`${B}/ensembles/:sid(\\d+)/annuler-champ`, need("forms.write"), run((ctx, id, b, req) => content.undoField(ctx, id, sid(req), { fieldKey: String(b.field || "") })));
  router.post(`${B}/ensembles/:sid(\\d+)/accepter`, need("forms.write"), run((ctx, id, b, req) => ({ set: content.accept(ctx, id, sid(req)) })));
  router.post(`${B}/ensembles/:sid(\\d+)/ecarter`, need("forms.write"), run((ctx, id, b, req) => content.discard(ctx, id, sid(req))));
  router.post(`${B}/ensembles/:sid(\\d+)/localiser`, need("forms.write"), run(async (ctx, id, b, req) => ({ set: await content.localizeSet(ctx, id, sid(req), { language: String(b.language || ""), country: b.country ? String(b.country) : null }) })));
  router.post(`${B}/ensembles/:sid(\\d+)/appliquer`, need("forms.write"), run((ctx, id, b, req) => content.apply(ctx, id, sid(req), { pageId: b.pageId ? Number(b.pageId) : null, overwriteManual: Array.isArray(b.overwriteManual) ? b.overwriteManual.map(String) : [], onlyKeys: Array.isArray(b.only) ? b.only.map(String) : null, applySeo: b.seo !== false })));
  router.post(`${B}/ensembles/:sid(\\d+)/annuler-application`, need("forms.write"), run((ctx, id, b, req) => content.unapply(ctx, id, sid(req))));
  return router;
};
