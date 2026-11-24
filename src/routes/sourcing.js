// Sourcing produit (Product Hunter Nakewenze) dans « Mon espace » : rubrique Croissance, à côté de Marketing et SEO.
// La page monte l'application (même origine) dans un cadre ; l'application et ses données sont servies derrière la même connexion formateur, non indexées.
// Les données sont lues dans le dossier persistant (NAKEWENZE_DATA_DIR, par défaut ~/nakewenze-data/products.json) qu'un déploiement ne remplace pas ;
// à défaut, l'instantané livré avec le code (src/marketing/sourcing/products.json). Lecture et repli : src/marketing/sourcing/catalog.js.
const express = require("express");
const path = require("path");
const { requireInstructor } = require("../middlewares/auth");
const catalog = require("../marketing/sourcing/catalog");

const APP = path.join(__dirname, "..", "marketing", "sourcing", "app.html");
const router = express.Router();
const PRIVATE = { "X-Robots-Tag": "noindex, nofollow" };

router.get("/formateur/sourcing-produit", requireInstructor, (req, res) => {
  res.render("instructor/sourcing", { title: "Sourcing produit" });
});
router.get("/formateur/sourcing-produit/app", requireInstructor, (req, res) => {
  res.set({ ...PRIVATE, "Cache-Control": "private, no-cache" });
  res.type("html").sendFile(APP);
});
router.get("/formateur/sourcing-produit/products.json", requireInstructor, (req, res) => {
  res.set({ ...PRIVATE, "Cache-Control": "private, no-store" });
  res.json(catalog.load());
});

module.exports = router;
