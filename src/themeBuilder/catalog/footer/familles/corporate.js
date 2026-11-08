// Famille « Corporate » — cible : 8 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 8 appels à modele({...}) (identifiants ft-corporate-01-… à ft-corporate-08-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "corporate",
  label: "Corporate",
  description: "Entreprises : grande zone de marque, 4 à 5 colonnes, double niveau de navigation avec mentions légales (SIRET, capital), bandeau d'appel, accordéon mobile.",
  target: 8,
  built: false,
  models: [],
};
