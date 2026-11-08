// Famille « Éducation et formation » — cible : 6 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 6 appels à modele({...}) (identifiants ft-education-01-… à ft-education-06-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "education",
  label: "Éducation et formation",
  description: "Écoles et organismes de formation : catalogue de formations, campus, aide aux étudiants, accessibilité, inscription.",
  target: 6,
  built: false,
  models: [],
};
