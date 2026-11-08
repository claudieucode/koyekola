// Famille « Landing pages » — cible : 6 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 6 appels à modele({...}) (identifiants ft-landing-pages-01-… à ft-landing-pages-06-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "landing-pages",
  label: "Landing pages",
  description: "Pieds courts à un seul appel à l'action, sans navigation distrayante, légal minimal.",
  target: 6,
  built: false,
  models: [],
};
