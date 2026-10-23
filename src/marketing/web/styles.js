// KOLAKISA CMS → Apparence → Styles : gestionnaire de styles globaux (système de design) d'UN site.
// UN écran partagé (comme Thèmes / Widgets) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/styles → ?site=<id>), jamais d'un état global ; sans site choisi,
// c'est le site principal (équipe seulement). Droits : appearance.read (voir) · appearance.styles (brouillon) · appearance.publish (publier).
// Ce n'est PAS un second moteur : Styles lit et écrit par les routes de Personnaliser (/site-web/personnaliser/{rendu,brouillon,annuler,publier,restaurer}) et partage son brouillon
// (cms_customizer_drafts) ; les valeurs vivent dans les moteurs du site (mk_sites.tokens / appearance_configs). Une seule valeur par réglage, jamais deux systèmes concurrents.
const express = require("express");
const customizer = require("../../services/customizer");
const palettes = require("../../services/stylePalettes");
const tokensLib = require("../pages/tokens");
const customizerWeb = require("./customizer");
const target = require("./siteTarget");
const { need, safeJson } = require("./kit");

const BASE = "/marketing/site-web/styles";
// Les quatre familles de réglages de design (le reste — identité, en-tête, pied de page, CSS — reste dans Personnaliser)
const PANELS = ["couleurs", "typographie", "mise-en-page", "boutons"];
const getPath = (obj, path) => path.split(".").reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), obj);

module.exports = () => {
  const router = express.Router();
  router.get("/site-web/styles", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const can = (p) => req.mk.can(p);
    const st = customizer.state(req.mk.ctx, t.siteId, { can });
    const panels = st.panels.filter((p) => PANELS.includes(p.id));
    const ids = new Set(panels.flatMap((p) => p.controls.map((c) => c.id)));
    const pick = (o) => Object.fromEntries(Object.entries(o).filter(([id]) => ids.has(id)));
    // Valeurs d'origine de Kolakisa (jetons par défaut) : proposées par « Valeurs d'origine », jamais appliquées sans confirmation
    const defaults = {};
    for (const id of ids) { const v = getPath({ tokens: tokensLib.DEFAULT_TOKENS }, id); if (v !== undefined && typeof v !== "object") defaults[id] = v; }
    const fontStacks = {};
    for (const c of panels.flatMap((p) => p.controls)) if (c.id.startsWith("tokens.fonts.")) for (const [value] of c.options || []) { try { fontStacks[value] = tokensLib.fontStackOf(value); } catch { /* police inconnue : repli du navigateur */ } }
    const q = t.siteId ? `?site=${t.siteId}` : "";
    // L'aperçu de la page réelle part du brouillon enregistré (copie de travail de CETTE session, pour CE site seulement), comme Personnaliser
    const key = t.siteId === null ? "p" : String(t.siteId);
    req.session.kwCustomizer = { ...(req.session.kwCustomizer || {}) };
    if (Object.keys(st.changes).length) req.session.kwCustomizer[key] = st.changes; else delete req.session.kwCustomizer[key];
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, base: "/marketing/site-web/personnaliser", siteQuery: q,
      panels: panels.map((p) => ({ id: p.id, label: p.label, controls: p.controls })), values: pick(st.values), live: pick(st.live), changes: pick(st.changes), outside: Object.fromEntries(Object.entries(st.changes).filter(([id]) => !ids.has(id))), outsideChanges: Object.keys(st.changes).filter((id) => !ids.has(id)).length,
      draft: st.draft, revision: st.revision, stale: st.stale, pendingEngineDraft: st.pendingEngineDraft, perControl: st.can,
      can: { edit: can("appearance.styles") && !t.readOnly, publish: can("appearance.publish") && !t.readOnly },
      defaults, fontStacks, palettes: palettes.forScope(t.siteId), previews: customizerWeb.previewTargets(req, t), history: customizer.history(t.siteId, 8),
      links: { personnaliser: `/marketing/site-web/personnaliser${q}`, polices: `/marketing/site-web/polices${q}`, themes: `/marketing/site-web/themes${q}` },
    };
    res.set("Cache-Control", "no-store");
    // « < » et les séparateurs de ligne sont échappés : le JSON ne peut jamais fermer la balise qui le contient
    const bootJson = safeJson(boot);
    res.render("marketing/styles", { title: "Styles", active: "apparence/styles", T: t, BASE, bootJson, stylesJs: true, mediaSite: t.siteId ? String(t.siteId) : "principal" });
  });
  return router;
};
module.exports.BASE = BASE;
