# KOLAKISA — Programme 21 : rapport final (21.11)

Date : 2026-10-30 · Branche de validation : `feat/programme-21-11-validation` (rebasée sur `origin/main` a39abd87)

## Statut : VALIDÉ AVEC RÉSERVES

Le constructeur de site IA (21.1 à 21.10) est cohérent, testé et sécurisé sur le code fusionné. Il n'est pas déclaré « sans réserve » car :
aucun fournisseur d'IA ni de paiement réel n'a été vérifié, les suites navigateur n'ont pas pu être exécutées, et le planificateur n'est pas encore aligné avec la boutique native (voir `REMAINING_ISSUES`).

## A. Ce qui a été audité
Les 11 paliers, la matrice d'intégration, les scénarios vitrine (entreprise de construction à Kinshasa) et boutique (matériel informatique), la sécurité, le multi-sites, la performance, l'international (US, RDC, FR, CA). Détail dans les 11 autres documents `KOLAKISA_PROGRAMME21_*.md`.

## B. Corrections apportées
| Réf. | Gravité | Correction |
|---|---|---|
| F1 | P1 | Les routes de lecture du studio, de l'API des plans, de la régénération et de la boutique IA n'exigeaient que `forms.read` : elles exigent maintenant aussi `templates.read` (moindre privilège). |
| F2 | P2 | La publication depuis le studio exige désormais une confirmation explicite côté serveur (422 `confirm_required`). |
| F3 | P3 | Teinte rose retirée d'une couleur CSS (audit anti-rose). |
| F4 | — | Tests d'isolation « Formations » mis à jour après l'ouverture du module aux sites. |

## C. Tests (code fusionné, machine très chargée)
| Passe | Fichiers | Tests | Réussis | Échecs | Ignorés |
|---|---|---|---|---|---|
| A | 437 | 5063 | 5056 | 5 | 2 |
| B | 252 | 2111 | 2096 | 8 | 7 |

Nouveaux tests du 21.11 : 8 (vitrine) + 4 + 3 (sécurité, multi-sites, régénération/boutique) + 7 (international/migrations) + 5 (performance), tous verts.

Échecs restants (aucun n'est causé par le programme 21) :
- Hérités du palier 20.5 (boutique native) : `audit-corrections` D3 (index de clés étrangères manquants sur les tables `mk_shop_*`), `infobulles` ×2 (4 entrées de menu Boutique sans infobulle), `entrees-fermees-preuves` (compteur périmé après l'ajout du groupe Boutique).
- Environnement : `compte-ajouter` (serveur SMTP injoignable, sensible à la charge), `r9-lancer-recette-prod` ×4 (branche `r8-recette-outil` absente), `refonte-design` ×4 (antérieurs), `editeur-blocs-firefox` (Firefox absent).
- Aucun test n'a été supprimé ni affaibli pour obtenir un résultat vert.

Non exécuté : environ 190 suites navigateur (Playwright/Chrome absents). Lint et typecheck n'existent pas dans le projet. Les builds `build:editor` et `build:automation-flow` passent. `npm audit --omit=dev` : 0 vulnérabilité.

## D. Performance mesurée
12 pages × 8 sections générées en 17,7 ms et enregistrées en 34 ms ; 300 images enregistrées en ~570 ms ; liste de la médiathèque 4,5 ms ; lecture de 500 opérations d'historique 5,8 ms. Voir `PERFORMANCE_AUDIT`.

## E. Limites connues (détail dans `REMAINING_ISSUES`)
- I1 (P1) : le planificateur déclare encore la boutique indisponible alors que la boutique native existe (seul le texte a été corrigé).
- I2 : la régénération (21.9) et la boutique IA (21.10) ne sont pas branchées sur le studio (21.8).
- I3 : les protections de 21.9 ne sont pas consultées quand les générateurs sont appelés directement.
- I4 : 21.9 ne couvre pas le catalogue.
- 21.10 : pas de page produit générée, pas d'images produit générées, coupons non pilotés, validation du paiement statique, seul l'euro est testé.
- Aucun fournisseur d'IA ni Stripe vérifié en réel : rien n'est facturé sans configuration.

## F. Migrations et données
Aucune migration ajoutée par le 21.11. Aucune suppression de données, aucun changement DNS, aucun paiement réel.

## G. Git et déploiement
Voir la section « Résultat du déploiement » ajoutée après la mise en production (commit, push sans force, vérification de `/sante` et du fichier `/js/ai-builder.js`).

## H. Dossiers livrés
Les 12 documents `KOLAKISA_PROGRAMME21_*.md` de `docs/`.

## I. Prochaines priorités
P1 : aligner le planificateur sur la boutique native (I1) ; corriger les 5 échecs hérités de 20.5. P2 : brancher 21.9 et 21.10 sur le studio ; valider un fournisseur d'IA et Stripe en réel avec une clé de test. P3 : exécuter les suites navigateur sur une machine équipée de Chrome.
