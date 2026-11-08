// Famille « SaaS et technologie » — cible : 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 8 appels à modele({...}) (identifiants ft-saas-tech-01-… à ft-saas-tech-08-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "saas-tech",
  label: "SaaS et technologie",
  description: "Logiciels : produit, ressources, documentation, entreprise, essai gratuit, statut du service, colonnes denses.",
  target: 8,
  built: false,
  models: [],
};
