// KOLAKISA CMS → Personnaliser : coque de l'écran plein cadre (panneau à gauche, aperçu réel du site à droite).
// Étape 1 : structure générale seulement (barre du haut, catégories, barre responsive, aperçu). Aucun réglage n'est encore branché : chaque catégorie sera développée séparément.
// Le site vient de l'adresse vérifiée par le serveur (« ?site=<id> »), jamais d'un état global ; sans site, c'est le site principal (équipe seulement).
// Droit : appearance.read. L'aperçu est le vrai rendu public du site, dans un cadre de même origine.
const express = require("express");
const target = require("./siteTarget");
const { need, safeJson } = require("./kit");
const categories = require("./personnaliserCategories");
const { previewTargets } = require("./styles");

const BASE = "/marketing/site-web/personnaliser";
// Formats d'aperçu : largeur du viewport simulé (null = toute la largeur disponible). Ajouter un format = ajouter une ligne.
const DEVICES = Object.freeze([
  { id: "desktop", label: "Ordinateur", width: null },
  { id: "tablet", label: "Tablette", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
]);

module.exports = () => {
  const router = express.Router();
  router.get("/site-web/personnaliser", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = t.siteId ? `?site=${t.siteId}` : "";
    const previews = previewTargets(req, t);
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, base: BASE,
      categories, devices: DEVICES, defaultDevice: "desktop",
      preview: { url: previews.length ? previews[0].url : "/", targets: previews },
      links: { close: t.principal ? "/marketing" : `/marketing/site-web/sites/${t.siteId}/tableau-de-bord`, styles: `/marketing/site-web/styles${q}` },
    };
    res.set("Cache-Control", "no-store");
    res.render("marketing/personnaliser", { title: `Personnaliser — ${t.name}`, T: t, bootJson: safeJson(boot), mediaSite: t.siteId ? String(t.siteId) : "principal" });
  });
  return router;
};
