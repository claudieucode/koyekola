// Font Manager : manifeste léger de la bibliothèque et règles @font-face à la demande (aperçus du sélecteur, canevas des éditeurs).
const express = require("express");
const fonts = require("../utils/fontLibrary");
const router = express.Router();

// Manifeste sans le détail des fichiers (le détail se déduit de l'identifiant) : de quoi chercher, filtrer et afficher les graisses
router.get("/polices/manifeste.json", (req, res) => {
  // Seulement ce que le sélecteur utilise (recherche, filtres, graisses, aperçu) : licence, source, repli, axes… restent côté serveur
  const list = fonts.list().map((f) => ({ id: f.id, family: f.family, category: f.category, categories: f.categories, popularity: f.popularity, weights: f.weights, styles: f.styles, variable: f.variable, stack: fonts.stack(f) }));
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ count: list.length, families: list });
});

// ?f=font.inter,font.lora : règles @font-face de ces familles seulement (au plus 40 par appel)
router.get("/polices.css", (req, res) => {
  const ids = String(req.query.f || "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40);
  const css = ids.map((id) => fonts.byId(id)).filter(Boolean).map((f) => fonts.faceCss(f)).join("\n");
  res.set("Content-Type", "text/css; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(css);
});

module.exports = router;
