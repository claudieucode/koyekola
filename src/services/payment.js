// Aucun prestataire de paiement n'est encore branché : une « commande » inscrit l'élève sans débiter de carte.
// Les commandes payantes sont donc refusées par défaut, quel que soit l'environnement (sinon toute formation payante
// serait gratuite) ; seules les commandes à 0 € passent (formations gratuites, code promo à 100 %).
// PAIEMENT_SIMULE=1 ouvre le mode démonstration (commande payante validée SANS paiement) : jamais avec de vrais clients.
// Les tests automatiques (NODE_ENV=test) gardent le mode démonstration pour vérifier le parcours d'achat.
function paidCheckoutOpen() {
  return process.env.PAIEMENT_SIMULE === "1" || process.env.NODE_ENV === "test";
}

module.exports = { paidCheckoutOpen };
