# Feuille de route corrigée et suivi du chantier MP (16/10/2026)

Document de travail, non suivi par Git. Aucun code, aucun commit, aucune branche, aucune sauvegarde n'a été modifié pour l'établir.

## 1. Numérotation corrigée
| Identifiant | Contenu | Branche / état |
|---|---|---|
| R0–R5 | inchangés (plan officiel `05-plan-par-paliers.md`) | R2 `r2-portee-api-webhooks` `3a01d4a` ; R3 `r3-modele-acces` `a26b362` ; R4 `r4-visibilite-listes` `c03fde9` ; R5 `r5-modules-par-site` `1d2606f` ; tous séparés, **non intégrés** |
| **MP** (nouveau, hors séquence) | Moteur central des pages et leur cycle de vie | branche **`r6-moteur-pages`** (nom d'origine conservé), HEAD `9f3702add471632bc22b55c88530c3535c6ebfaf`, base R5 ; locale, non poussée, non fusionnée |
| **R6** (officiel, préservé) | Contenus par site : articles, taxonomies, commentaires, adresses (migrations avec reconstruction de tables, décision D7) | **non commencé** ; prérequis R5 |
| R7 et suivants | inchangés | non commencés |

Règle de lecture : toute mention de « R6 » dans le plan officiel, les décisions et les documents R0–R5 désigne le R6 officiel. Seuls la **branche** `r6-moteur-pages`, le **dossier** `docs/r6-moteur-pages-2026-10-16/`, les **commentaires de tête des deux fichiers de tests** (`tests/moteur-pages*.test.js`) et deux commentaires de code (`src/marketing/web/index.js`, `src/marketing/pages/index.js`) portent encore « R6 » pour MP : ils ne sont pas modifiés (modifier un fichier de la branche exigerait un nouveau commit sur du code ; ce n'est pas demandé). Un renommage de branche, s'il est un jour décidé, relèvera d'une autorisation séparée.

Références identifiées par recherche dans `docs/` : le seul document décrivant MP sous le nom R6 était `r6-moteur-pages-2026-10-16/01-audit-et-rapport-R6.md` (corrigé : bandeau, titre, section 0, section 8). Les autres occurrences de « R6 » (plan, décisions, R0, audits de palier 9, rapports R3 à R5) désignent le R6 officiel et sont laissées intactes.

## 2. Suivi des vérifications (mis à jour le 16/10/2026, HEAD MP `0df611f`)
| # | Vérification | État |
|---|---|---|
| 1 | Contrôle visuel du formulaire « Déplacer » dans un navigateur réel | **FAIT** (Chrome réel, 6 tests, 7 captures examinées ; limites : un seul navigateur, pas de tactile) |
| 2 | Permissions après intégration de R3 (plafond sur source et destination, actions groupées) | **à faire après intégration R3** (non testable : branches séparées) |
| 3 | Visibilité des listes après intégration de R4 (liste `/pages`, JSON, exports) | **à faire après intégration R4** |
| 4 | Règles de portée de R3 : ajouter `POST /pages/creer.json`, `POST /pages/importer.json`, `GET /pages/nom.json` ; `/pages/:id/deplacer` est **déjà couverte** par la règle « page par identifiant » (correction de la version précédente de ce suivi) | **à faire à l'intégration R3** |
| 5 | Suite complète (407 fichiers) | **non lancée** (machine partagée, charge) ; ciblé : 693/693 + 25 nouveaux tests ; à lancer à l'intégration |
| 6 | Médias de R5 | rien à faire |
| 7 | Documents MP dans Git | **FAIT** : copiés sous `docs/mp-moteur-pages/` de la branche `r6-moteur-pages` (commit documentaire séparé) ; le dossier de travail `docs/r6-moteur-pages-2026-10-16/` de `KOYEKOLA-deploy` reste une copie identique non suivie |

## 3. Hors périmètre rappelé
Refonte graphique du tableau de bord Site Web ; constructeur visuel ; activation des modules par site (livrable du plan R4) ; R6 officiel ; R7.
