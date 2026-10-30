# KOLAKISA — Programme 21.10 : tests

Aucun paiement, aucune transaction, aucun appel d'IA payant : l'analyse est à règles ; l'IA de rédaction est SIMULÉE (y compris une IA « hostile ») ; le serveur de test n'a ni clé Stripe ni webhook. Base en mémoire avec **toutes les vraies migrations** (dont le moteur e-commerce 121 et la 122).

## Résultats (exécutés)
| Lot | Exécutés | Réussis | Échoués | Ignorés |
|---|---|---|---|---|
| `programme21-10-ecommerce-builder.test.js` (service, base en mémoire) | 30 | 30 | 0 | 0 |
| `programme21-10-ecommerce-builder-http.test.js` (serveur réel) | 16 | 16 | 0 | 0 |
| `programme21-10-ecommerce-builder-navigateur.test.js` (Chrome réel) | 10 | 10 | 0 | 0 |
| Non-régression (41 fichiers : moteur e-commerce 20.5, **paiements des formations** Stripe / commerce par site / tunnel, paliers 20.2/20.7 et 21.2 à 21.8, portée des routes, inventaire des tables, migrations, connecteurs, Theme Builder, assistant de création de site) | 674 | 674 | 0 | 0 |
| Navigateur : 21.8 + 20.5 + 21.10 sur l'état final | 25 | 25 | 0 | 0 |
Commande : `NODE_PATH=<playwright-core> TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 <fichiers>`. Les tests navigateur sont **ignorés (avec la raison)** si Playwright ou Chrome sont absents (cas du dépôt par défaut).
**Non exécutés** : suite complète `npm test` ; lint / typecheck / build (**aucun script n'existe** dans ce dépôt pour ce code ; `node --check` sur les scripts du navigateur) ; Firefox, Safari ; lecteur d'écran.

## Garanties vérifiées par mutation
Désactiver le garde-fou anti-invention → le test de l'IA hostile échoue. Supprimer le filtre de site → les tests d'isolation (service et HTTP) échouent. Code restauré après chaque essai.

## Couverture de la liste du programme (30 points)
| # | Point | Où |
|---|---|---|
| 1-2 | Analyse du brief, modèle commercial (faits / hypothèses / manques, prise en charge réelle) | service (4 tests) |
| 3-5 | Plan de boutique, catégories, sous-catégories (création idempotente, parents d'abord, réutilisation) | service, HTTP, navigateur |
| 6-7 | Fiches produits, validation des caractéristiques (jamais inventées) | service (gabarit, IA hostile, repli) |
| 8 | Contenus SEO (titre, méta, alt, doublons) | service, étape SEO |
| 9 | Association des images | médiathèque du site : **non couvert par un test automatisé** (fonction `assignImage` écrite, vérifiée par lecture) |
| 10-11 | Variantes, SKU préservés (aucun SKU/stock/prix inventé) | service |
| 12-13 | Lot CSV, doublons (lot et catalogue) | service, HTTP, 400 lignes en < 3 s |
| 14 | Stocks (non géré tant que non saisi ; variantes à 0) | service, validation |
| 15-16 | Devises, marchés (code saisi, aucune conversion, « seul l'euro est testé ») | service, HTTP |
| 17 | Fournisseurs de paiement (carte refusée sans clés serveur ; manuel) | service, HTTP, navigateur |
| 18-19 | Livraison et taxes (tarif/taux absent refusé, rien d'inventé) | service, HTTP |
| 20 | Prévisualisation | navigateur (pages éditoriales) ; **fiches produits : lien vers l'administration seulement** |
| 21 | Checkout | **statique** (configuration) ; aucune commande d'essai |
| 22 | Validation avant publication, publication guidée | service, HTTP, navigateur |
| 23-24 | Historique et restauration | annuler/rétablir des **brouillons** (service, HTTP, navigateur) ; pas de restauration du catalogue ; **compatibilité avec le 21.9 (arrivé en cours de palier) non testée** |
| 25-26 | Isolation multisite, permissions | service, HTTP (lecteur, éditeur limité, administrateur d'un autre site, modules ia/commerce, `?site=` hostile) |
| 27 | Gestion des erreurs | 409, 422, 429/503 expliqués ; perte de connexion en navigateur |
| 28 | Idempotence | catégories, produits, 2e application sans doublon |
| 29 | Performance de gros catalogues | 400 lignes ; **pas de test à plusieurs milliers** |
| 30 | Régression du moteur existant | 674 tests, dont paiements des formations |

## Incidents du palier (corrigés)
Étape « catalogue » plantée au rendu (expression mal placée) non vue par un premier test trop faible ; bouton « Nouveau produit » (événement de clic pris pour un produit) ; alertes critiques non levées après correction du brouillon (contenu périmé désormais retiré) ; index de texte décalé par les accents dans les preuves de l'analyseur.

## Non testé
Paiement réel (aucun) · fournisseurs d'IA réels · création d'une commande de bout en bout · pagination du catalogue · plusieurs onglets simultanés · lecteur d'écran · association d'images par test automatisé.
