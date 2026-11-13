# Factures et avoirs numérotés

- **Émission automatique** : une facture est créée à l'encaissement de la commande (carte, paiement manuel confirmé, abonnement), un **avoir** à chaque remboursement réussi.
- **Numérotation** : `<préfixe>-<année>-<séquence 6 chiffres>` ; avoirs `AV<préfixe>-…`. La séquence est **continue, sans trou, propre à chaque site** et propre à chaque type (garantie par un index unique et une attribution en transaction).
- **Immuable** : le contenu (vendeur, acheteur, lignes, taxes, totaux) est un instantané pris à l'émission. Modifier ensuite les informations du vendeur ne change jamais une facture déjà émise.
- **Vendeur** : Boutique → Factures → raison sociale, adresse, TVA, immatriculation, préfixe, mentions légales.
- **Accès** : l'administration (journal + page de commande), le client (page de confirmation, lien secret ou compte). Impression / PDF par le navigateur. Les pages portent `noindex` et `no-store`.
- **Isolation** : un site ne voit jamais les factures d'un autre.

## Limites assumées
Pas de génération de fichier PDF côté serveur (impression navigateur) ; pas d'envoi automatique de la facture en pièce jointe (le message de paiement contient le lien de la commande). Les mentions légales propres à chaque pays sont à saisir par le vendeur.

Tests : `tests/boutique-factures.test.js`. Migration : `146_boutique_factures.sql`.
