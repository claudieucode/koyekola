// Famille « Services et prestations » — cible : 7 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 7 appels à modele({...}) (identifiants ft-services-01-… à ft-services-07-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "services",
  label: "Services et prestations",
  description: "Prestataires : contact, rendez-vous, zone d'intervention, devis, horaires, formulaire de contact.",
  target: 7,
  built: false,
  models: [],
};
