// Révisions du pied de page (chantier E) : API JSON du Theme Builder. Mêmes adresses et mêmes droits que le reste du Theme Builder :
// forms.read (liste, aperçu, comparaison) · forms.write (restaurer, revenir au modèle d'origine). Rien n'est jamais publié par ces routes.
const express = require("express");
const Rev = require("../../themeBuilder/revisions");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, invalid_field: 422, duplicate: 409 };
module.exports = () => {
  const router = express.Router();
  for (const [B, principal] of [["/site-web/sites/:id(\\d+)/constructeur-de-theme", false], ["/site-web/principal/constructeur-de-theme", true]]) {
    const T = `${B}/api/modeles/:tid(\\d+)/revisions`;
    const sid = (req) => (principal ? null : Number(req.params.id)), tid = (req) => Number(req.params.tid);
    const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
      if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
      next(e);
    });
    router.get(T, need("forms.read"), run((ctx, id, req) => Rev.list(ctx, id, tid(req), { limit: req.query.limite, before: req.query.avant })));
    router.get(`${T}/comparer`, need("forms.read"), run((ctx, id, req) => ({ comparison: Rev.compare(ctx, id, tid(req), String(req.query.a || ""), String(req.query.b || "")) })));
    router.get(`${T}/:rid(\\d+)/apercu`, need("forms.read"), run((ctx, id, req) => Rev.preview(ctx, id, tid(req), Number(req.params.rid))));
    router.post(`${T}/:rid(\\d+)/restaurer`, need("forms.write"), run((ctx, id, req) => Rev.restore(ctx, id, tid(req), Number(req.params.rid))));
  }
  return router;
};
