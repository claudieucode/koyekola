// Apparence d'un pied de page du Theme Builder (frontière de pied) : API JSON. Mêmes adresses et mêmes droits que le reste du Theme Builder :
// forms.read (lire) · forms.write (changer). Le réglage vit dans le DOCUMENT du pied (section.ftMode) : il est enregistré dans la COPIE DE TRAVAIL (révision « brouillon » créée) ;
// rien n'est publié par ces routes. Trois états : legacy (ancien comportement) · solo (indépendante du site) · site (suit la charte).
const express = require("express");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const FF = require("../pages/footerFrontier");

const STATUS = { not_found: 404, forbidden: 403, module_disabled: 403, conflict: 409, invalid_field: 422, duplicate: 409 };
const P = () => require("../pages");
const OPTIONS = [
  { key: "solo", label: "Indépendante du site", help: "Le thème, les couleurs, les polices et les boutons du site ne changent plus ce pied : il garde son propre style." },
  { key: "site", label: "Suit la charte du site", help: "Le pied reprend les couleurs, polices et boutons du site (et les thèmes du site peuvent le modifier)." },
  { key: "legacy", label: "Ancien comportement", help: "Fonctionnement d'avant : le pied est habillé par le thème du site, comme les pieds déjà installés." },
];
module.exports = () => {
  const router = express.Router();
  for (const [B, principal] of [["/site-web/sites/:id(\\d+)/constructeur-de-theme", false], ["/site-web/principal/constructeur-de-theme", true]]) {
    const U = `${B}/api/modeles/:tid(\\d+)/apparence-pied`;
    const sid = (req) => (principal ? null : Number(req.params.id));
    const run = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req.mk.ctx, sid(req), req)).then((d) => res.set("Cache-Control", "no-store").json({ ok: true, ...d })).catch((e) => {
      if (e instanceof MarketingError || (e && e.code && STATUS[e.code])) return res.status(STATUS[e.code] || 400).set("Cache-Control", "no-store").json({ ok: false, error: e.message, code: e.code });
      next(e);
    });
    const footer = (ctx, id, req) => {
      const t = require("../../themeBuilder").store.get(ctx, id, Number(req.params.tid));
      if (t.type !== "footer" || t.sourceKind !== "component") throw new MarketingError("invalid_field", "L'apparence ne se règle que pour un pied de page.");
      const c = P().getComponent(ctx, t.sourceId);
      if (!c) throw new MarketingError("not_found", "Document du pied introuvable.");
      return { t, c };
    };
    const state = (t, c) => ({ mode: FF.modeOf(c.draft || c.section), publishedMode: FF.modeOf(c.section), hasDraft: Boolean(c.hasDraft), options: OPTIONS, previewUrl: `/marketing/site-web/composants/${t.sourceId}/apercu` });
    router.get(U, need("forms.read"), run((ctx, id, req) => { const { t, c } = footer(ctx, id, req); return state(t, c); }));
    router.post(U, need("forms.write"), run((ctx, id, req) => {
      const { t, c } = footer(ctx, id, req);
      if (t.status === "archived") throw new MarketingError("invalid_field", "Ce modèle est archivé : restaurez-le avant de le modifier.");
      const mode = String((req.body && req.body.mode) || "");
      let tokens = null, extraVars = {};
      if (mode === "solo" && FF.modeOf(c.draft || c.section) !== "solo") {
        // Rendu indépendant : on fige l'apparence ACTUELLE du site dans le pied (son aspect ne change pas à la bascule)
        const site = id === null ? null : P().getSite(ctx, id);
        tokens = id === null ? (require("../../services/appearance").publishedTokens() || null) : (site && site.tokens) || null;
        const w = site && site.settings && site.settings.layout && Number(site.settings.layout.containerWidth);
        if (Number.isFinite(w)) extraVars = { "--kw-band-w": `${w}px` };
      }
      const after = P().setFooterAppearance(ctx, c.id, mode, { tokens, extraVars });
      return state(t, after);
    }));
  }
  return router;
};
