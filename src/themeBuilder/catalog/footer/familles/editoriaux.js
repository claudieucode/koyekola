// Famille « Éditoriaux et magazines » — cible : 7 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 7 appels à modele({...}) (identifiants ft-editoriaux-01-… à ft-editoriaux-07-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "editoriaux",
  label: "Éditoriaux et magazines",
  description: "Médias : rubriques, archives, auteurs, colophon, abonnement, articles récents.",
  target: 7,
  built: false,
  models: [],
};
