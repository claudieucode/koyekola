# Plan de corrections transversales — palier 26 (préparé, NON exécuté)

Les anomalies sont regroupées par **cause racine**, pas par module. Rien n'est à exécuter sans ton autorisation ; chaque groupe est une unité de livraison avec ses tests de non-régression et son retour arrière.

## Ordre proposé

| Rang | Groupe (cause racine) | Anomalies | Pourquoi dans cet ordre | Dépendances | Risque de régression | Tests de non-régression | Retour arrière |
|---|---|---|---|---|---|---|---|
| 1 | **Configuration de production invérifiable** : état du worker, du fournisseur d'envoi, de Stripe | G-01, G-02, G-08 | Tout le reste (envois, scénarios, paiements) repose sur ces réglages ; aucun code risqué : d'abord **voir** | Accès du propriétaire à l'hébergeur ; aucune clé n'est lue par moi | Faible | Écran « état du système » (worker, fournisseur, webhook) testé ; URL de santé | Retirer l'écran |
| 2 | **Droits d'écriture et d'accès** | G-03, G-15, G-11 (2FA, CSRF) | Un seul chantier « droits » évite trois retouches des mêmes gardes | Décisions D2, D3 ; correctif articles déjà prêt | Moyen (gardes d'accès) | Matrice 360 routes × profils ; `cms-users` ; `cms-articles-multi-auteurs` | `git revert` du lot (correctif en un bloc) |
| 3 | **Travail non fusionné** | G-04 | Évite de reconstruire sur des branches périmées | Décision par branche | Moyen (éditeur) | Suite Chrome éditeur | Branches conservées |
| 4 | **Persistance et reprise** | G-09 (sauvegarde externe), G-12 (copie locale) | Perte de données = risque le plus coûteux | Stockage externe (décision) ; coordination avec la session éditeur | Moyen | Restauration à blanc ; coupure réseau | Désactiver l'option |
| 5 | **Multi-site complet** (si D1 = oui) | G-05, M05/M06/M08 | Plus gros chantier : migrations additives sur posts, termes, commentaires, médias, contacts | D1 ; paliers 1–4 stables | **Élevé** | Deux sites × tous les écrans ; IDOR | Migrations additives (colonnes nulles = comportement actuel) |
| 6 | **Gouvernance des doublons** | G-07 (D-01 à D-11) | Décider avant de fusionner | D6 | Variable | Tests des modules concernés | — |
| 7 | **Qualité et dette** | G-10, G-14, G-17, G-19, G-20 | Suite verte ; images ; dépendances ; documentation | Coordination `node_modules` partagé | Faible à moyen | Suite complète | `git revert` |
| 8 | **Événements du CMS et API de contenu** (si décidés) | G-13, G-16 | Valeur d'intégration, pas de risque de données | D5 | Faible | Scénario réagissant à `page.published` | Retirer l'émission |

## Règles pour le palier 26
- Un groupe = une branche = une fusion testée ; jamais un « gros lot » mêlant plusieurs causes.
- Avant toute modification : relever les usages de l'élément (routes, tables, tests, documents) et les écrire dans le compte rendu.
- Migrations : toujours additives, numéro vérifié **juste avant** l'envoi (incident 067 du palier 22), test `tests/audit-corrections.test.js` après fusion.
- Rien n'est supprimé : un élément obsolète est signalé, pas retiré.
