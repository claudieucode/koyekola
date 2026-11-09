// TABLE D'ALIAS « anciens identifiants → modèles v2 ». VIDE tant que la bibliothèque v2 n'est pas complète (14 familles construites, 100 modèles).
// Quand la bibliothèque v2 remplace l'actuelle, les 100 identifiants actuels (ft-<famille>-<nn>-<nom>) et les 100 identifiants d'avant la refonte (<composition>.<identité>) restent OUVRABLES (masqués de la liste) ;
// pour que « Revenir au modèle d'origine » propose un modèle v2, ajouter ici : "ft-corporate-01-grande-marque": "ft2-001-bastion-ardoise". Règles : la valeur doit être un identifiant v2 existant ;
// ne jamais retirer une clé ; une clé inconnue fait échouer tests/footer-v2-bibliotheque.test.js.
module.exports = Object.freeze({});
