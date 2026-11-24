// Sourcing produit : l'application a quitté l'espace Marketing pour « Mon espace » (rubrique Croissance, /formateur/sourcing-produit, src/routes/sourcing.js).
// L'ancienne adresse redirige définitivement vers la nouvelle (favoris, liens déjà partagés).
const express = require("express");

module.exports = () => {
  const router = express.Router();
  router.get("/sourcing-produit", (req, res) => res.redirect(301, "/formateur/sourcing-produit"));
  return router;
};
