# Tests de la boutique

Lancer un fichier : `node --test --test-concurrency=1 tests/<fichier>.test.js`. Tous utilisent un VRAI serveur éphémère et de FAUX fournisseurs locaux (aucun paiement réel, aucun appel externe).

| Fichier | Couvre |
|---|---|
| boutique-remboursements | Remboursements partiels/totaux, remise en stock, idempotence, refus du fournisseur, isolation |
| boutique-compte-invite | Activation des comptes invités (anti prise de contrôle) |
| boutique-lot2-robustesse | Pas de seconde session Stripe, expiration des commandes manuelles, limites de débit |
| boutique-rapports | Chiffres exacts, remboursements soustraits, CSV protégés |
| boutique-factures | Numérotation continue, avoirs, contenu figé, accès, isolation |
| boutique-telechargements | Fichiers privés, droits après paiement, limites, expiration, révocation |
| boutique-taxes-expedition | Classes de taxe, codes postaux, exonération, classes d'expédition |
| boutique-api-evenements | API REST, événements, paniers abandonnés, RGPD |
| boutique-passerelles | Stripe du site, PayPal, Flutterwave, webhooks, remboursements API |
| boutique-theme-builder-pages | 4 types × 100 modèles, rendu des vraies pages, repli |
| boutique-widgets-fiche | Éléments de fiche produit et mini-panier |
| boutique-admin-complements | Coupons avancés, duplication, variantes, actions groupées, commande manuelle, plan du site |
| boutique-securite | Prix, XSS, isolation, accès, origine, injections, pages d'administration |
| boutique-charge | Survente, double soumission, webhook rejoué en parallèle, lecture sous charge |

Tests anciens conservés : boutique-abonnements, -age, -briques, -comparateur, -creneaux, -liste-cadeaux, -membre, -rdv, programme20-5-*, commerce-par-site.

Échecs connus HORS boutique (existent à l'identique sur `main` sans ces travaux) : pieds de page (513 modèles au lieu de 100), `widgets-parts` (shopbuy.choice), `seo-audit` (contenu), `editeur-blocs-widgets`, quelques tests Chrome du Theme Builder.
