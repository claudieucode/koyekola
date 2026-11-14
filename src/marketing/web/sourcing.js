// Route « Sourcing produit » : page de destination volontairement vide, qui accueillera plus tard une application de sourcing indépendante.
// Aucune donnée, aucun moteur ici : seulement l'emplacement dans le menu et un point de montage (`#sourcing-app`) lié au site courant.
const express = require("express");
const { need } = require("./kit");

module.exports = () => {
  const router = express.Router();
  router.get("/sourcing-produit", need("campaigns.read"), (req, res) => {
    res.render("marketing/sourcing", { title: "Sourcing produit", active: "sourcing", siteId: req.mk.siteId ?? "" });
  });
  return router;
};
