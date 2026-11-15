// Sourcing produit : la page Kolakisa monte l'application « Product Hunter » (chasse de produits gagnants) dans son point de montage.
// L'application est servie par cette même adresse, derrière la même permission : /sourcing-produit/app (page) et /sourcing-produit/products.json (données).
// Les données sont mises à jour chaque jour hors du dépôt, dans un dossier persistant (NAKEWENZE_DATA_DIR, par défaut ~/nakewenze-data), qu'un
// déploiement ne remplace pas ; à défaut, l'instantané livré avec le code (src/marketing/sourcing/products.json) est servi.
const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { need } = require("./kit");

const APP_DIR = path.join(__dirname, "..", "sourcing");
const dataDir = () => process.env.NAKEWENZE_DATA_DIR || path.join(os.homedir(), "nakewenze-data");

// Lit les données à jour si le fichier persistant existe et se lit comme du JSON (une écriture incomplète ne casse pas l'écran), sinon l'instantané livré.
function readProducts() {
  for (const file of [path.join(dataDir(), "products.json"), path.join(APP_DIR, "products.json")]) {
    try {
      const text = fs.readFileSync(file, "utf8");
      const data = JSON.parse(text);
      if (data && Array.isArray(data.products)) return text;
    } catch { /* fichier absent ou illisible : source suivante */ }
  }
  return JSON.stringify({ products: [] });
}

module.exports = () => {
  const router = express.Router();
  router.get("/sourcing-produit", need("campaigns.read"), (req, res) => {
    res.render("marketing/sourcing", { title: "Sourcing produit", active: "sourcing", siteId: req.mk.siteId ?? "" });
  });
  router.get("/sourcing-produit/app", need("campaigns.read"), (req, res) => {
    res.set({ "Cache-Control": "private, no-cache", "X-Robots-Tag": "noindex, nofollow" });
    res.type("html").sendFile(path.join(APP_DIR, "app.html"));
  });
  router.get("/sourcing-produit/products.json", need("campaigns.read"), (req, res) => {
    res.set({ "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" });
    res.type("json").send(readProducts());
  });
  return router;
};
module.exports.readProducts = readProducts;
