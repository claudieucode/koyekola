// Famille « E-commerce » — cible : 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 8 appels à modele({...}) (identifiants ft-ecommerce-01-… à ft-ecommerce-08-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "ecommerce",
  label: "E-commerce",
  description: "Boutiques : catégories de produits, service client, suivi de commande, moyens de paiement, livraison et retours, newsletter avec offre.",
  target: 8,
  built: false,
  models: [],
};
