// Famille « ONG et associations » — cible : 5 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Pour construire la famille : remplir `models` avec 5 appels à modele({...}) (identifiants ft-ong-associations-01-… à ft-ong-associations-05-…), puis passer `built` à true.
// Tant que `built` est false, la bibliothèque continue de lister les anciens modèles rattachés à cette famille ; dès que `built` est true, seuls les nouveaux sont listés (les anciens restent ouvrables par alias).
const { modele, identifiantModele } = require("../kit-conception");
void modele; void identifiantModele;

module.exports = {
  key: "ong-associations",
  label: "ONG et associations",
  description: "Faire un don, adhérer, devenir bénévole, transparence, newsletter.",
  target: 5,
  built: false,
  models: [],
};
