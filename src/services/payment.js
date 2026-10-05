// Aucun prestataire de paiement n'est encore branché : une « commande » inscrit l'élève sans débiter de carte.
// En production, une commande payante est donc refusée (sinon toute formation payante serait gratuite) ;
// seules les commandes à 0 € passent (formations gratuites, code promo à 100 %).
// PAIEMENT_SIMULE=1 rouvre le mode démonstration en production (aucune carte débitée) : jamais avec de vrais clients.
// Hors production (développement, tests), le mode démonstration reste ouvert.
function paidCheckoutOpen() {
  return process.env.NODE_ENV !== "production" || process.env.PAIEMENT_SIMULE === "1";
}

module.exports = { paidCheckoutOpen };
