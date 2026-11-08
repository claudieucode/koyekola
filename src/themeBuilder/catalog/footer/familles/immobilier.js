// Famille « Immobilier » — cible : 5 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 5 appels à modele({...}) (identifiants ft-immobilier-01-… à ft-immobilier-05-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "immobilier",
  label: "Immobilier",
  description: "Agences : recherche de biens, estimation, mentions légales renforcées, coordonnées.",
  target: 5,
  built: false,
  models: [],
};
