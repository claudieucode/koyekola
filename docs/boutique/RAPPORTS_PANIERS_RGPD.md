# Rapports, paniers abandonnés, données personnelles

## Rapports (Boutique → Rapports)
Période choisie (30 jours par défaut, 366 max) : ventes brutes, remboursé, **ventes nettes**, commandes payées, panier moyen, articles vendus, taxes, livraison, remises, nouveaux clients, commandes à traiter ; ventes par jour (graphique + tableau), meilleurs produits, commandes par statut, moyens de paiement, coupons, stock bas.
Règle : une vente = commande ayant été payée, non annulée, comptée à la date de paiement ; les remboursements réussis sont soustraits à leur date.
**Exports CSV** (Excel français : `;`, BOM UTF-8, virgule décimale) : commandes, lignes, clients, produits. Neutralisation de l'injection de formule (`=`, `+`, `-`, `@`). Commandes/lignes/clients exigent la permission `shop.orders` ; chaque export est journalisé.

## Paniers abandonnés
Panier avec articles inactif depuis N minutes (60 par défaut) → marqué, événement `shop.cart_abandoned`, visible dans Rapports. Le panier n'est jamais fermé : le visiteur le retrouve. **Relance e-mail** (désactivée par défaut) : uniquement aux clients **avec compte** ; lien signé de reprise (le panier est rattaché au navigateur qui ouvre le lien). Les invités ne reçoivent jamais de relance automatique.

## RGPD
- **Accès / portabilité** : le client télécharge ses données (JSON) depuis son compte ; l'administrateur exporte un client (journalisé).
- **Effacement** : mot de passe exigé ; refusé tant qu'une commande est en cours ou qu'un abonnement est actif. Le compte est anonymisé (e-mail, nom, téléphone, adresses, mot de passe), les listes, paniers, jetons, avis et rendez-vous sont dépersonnalisés. **Commandes et factures conservées** (obligation comptable, 10 ans en France), sans compte rattaché.
- Aucune donnée bancaire n'est jamais stockée (paiement hébergé chez le fournisseur).

Tests : `tests/boutique-rapports.test.js`, `tests/boutique-api-evenements.test.js`. Migration : `150_boutique_paniers_abandonnes.sql`.
