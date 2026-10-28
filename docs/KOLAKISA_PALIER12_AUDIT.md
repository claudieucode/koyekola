# Palier 12 — Audit (état initial, 2026-10-28)

## 1. État du dépôt
- Référence : `origin/main` = `5f308599`. Aucune modification locale préexistante dans le worktree de travail (`KOLAKISA-palier12`, branche `palier12`, créée depuis `origin/main`).
- **Les paliers 8 à 11 ne sont PAS dans `main`.** Ils vivent dans `integration/palier11-sur-main` (14 commits d'avance, **224 de retard**), `theme-builder-brouillon-parties`, `backup/palier11-avant-integration-20261018`, `audit-palier11`, `theme-builder` (a0598f39), `widgets-catalogue` (19f0bcfc, 354 de retard / 1 d'avance). Vérifié : `git merge-base --is-ancestor a0598f39 origin/main` → non ; `tests/theme-builder-serveur.test.js`, `docs/KOLAKISA_THEME_BUILDER_AUDIT.md` et `…/071_composants_revision.sql` absents de `origin/main`.
- Le palier 11 n'est pas déclaré terminé (`KOLAKISA_PALIER11_BLOCAGE.md` / `LIMITATIONS.md`) : la condition « palier 10 terminé » n'a jamais été validée par l'utilisateur. Ici, l'ordre de l'utilisateur (palier 12) est pris comme décision d'intégrer le travail déjà testé (5032/5032 sur la branche d'origine) ; les points ouverts des paliers 10-11 restent des limites connues (voir LIMITATIONS).

## 2. Migrations — la collision signalée est confirmée, et elle a changé de forme
| Fichier | Où | État |
|---|---|---|
| `071_isolation_des_sites.sql` | `main` | appliquée en production (fait partie de `main` déployé) |
| `071_composants_revision.sql` | `widgets-catalogue`, `theme-builder` seulement | **jamais dans `main`**, donc jamais appliquée en production ; peut exister sur des bases de développement de ces branches |
| `094_composants_revision.sql` | `integration/palier11-sur-main` | renumérotation faite à l'époque (071→094), **devenue invalide** : `main` a depuis `094_themes_par_site.sql` |

Mécanique du runner (`src/marketing/db/migrate.js`) : suivi par `(scope, version)` dans `schema_migrations` ; **refuse deux fichiers de même numéro** ; **refuse une migration plus ancienne que la dernière appliquée** (« ordre non respecté ») ; refuse une migration appliquée dont le fichier a changé ou disparu ; sauvegarde la base avant d'appliquer. Dernier numéro dans `main` : **113**. Conséquence : un fichier 071 ou 094 ferait échouer le démarrage ; le seul numéro sûr est supérieur à 113 → **114**.
Contenu : `ALTER TABLE mk_web_components ADD COLUMN revision INTEGER NOT NULL DEFAULT 0` — additive, réversible sans perte.
Environnements : production = `main` ; elle n'a jamais reçu 071_composants_revision ni 094_composants_revision. Je n'ai pas accès à la base de production ni à une base de préproduction : **non confirmé par observation**, déduit du fait que ces fichiers n'ont jamais été dans la branche déployée.

## 3. Intégration (méthode)
`git merge --no-ff integration/palier11-sur-main` dans `palier12` (basée sur `origin/main`) : **5 conflits**, tous résolus à la main en gardant les deux côtés (voir IMPLEMENTATION). Aucune branche supprimée, aucune réécriture d'historique.

## 4. Problèmes détectés
| # | Gravité | Problème | Cause racine | Statut |
|---|---|---|---|---|
| P1 | **Élevée** (intégrité des données) | Les travaux des paliers 8-11 (Theme Builder : révision des composants, 409 sur conflit, « Mettre à jour » fiable ; copie/déplacement de site sans perte de parties ; brouillon + aperçu privé des en-têtes/pieds ; audit de 92 widgets) n'étaient pas livrés ; la prod ne les a pas | branches jamais fusionnées, 354 commits de dérive, collision de numéro | corrigé (fusion + migration 114) |
| P2 | **Élevée** (blocage de démarrage) | Migration en collision (071 ou 094) : le serveur refuserait de démarrer | numéros réutilisés par des sessions parallèles | corrigé (114, test de mise à niveau) |
| P3 | **Moyenne→Élevée** (perte silencieuse) | `PUT /marketing/site-web/composants/:id/brouillon` **sans numéro de révision** était accepté (200) et écrasait un brouillon plus récent, alors que les pages refusent (« Révision manquante ») | `Number.isInteger(asked) ? asked : undefined` rendait le contrôle optionnel | corrigé + test |
| P4 | Moyenne | Tests d'éléments (`widgets-*`) supposaient que l'élément « menu » neuf affiche une liste ; `main` l'a lié au menu CMS (source « location »), il n'affiche rien sans menu affecté | changement volontaire de `main` (fb478363), tests de la branche non mis à jour | tests : jeu de données explicite (liste manuelle) ; comportement de `main` conservé |
| P5 | Faible | `tests/site-espace.test.js` et `site-menu-p1a.test.js` figeaient le dernier numéro de migration à 109/113 (le premier échouait déjà sur `main`) | numéro codé en dur | mis à jour à 114 avec l'historique |

## 5. Vérifié sans défaut (preuves dans TEST_REPORT)
- **Isolation inter-sites des composants** : un membre du site A est refusé (403/404, aucun contenu exposé, base inchangée) sur lecture/éditeur/aperçu/instances/rendu, brouillon, mise à jour, abandon, modification, suppression d'un composant du site B **et** d'un composant global. Mécanisme : `routeScopes.js` (table déclarative, un test énumère les routes montées et échoue si l'une n'est pas classée). Test nouveau : `palier12-isolation-composants`.
- Lecteur (viewer) : lit son composant, ne peut ni enregistrer ni mettre à jour (403).
- Affectations en-tête/pied/variante : `setSiteParts` et `setPageHeader` refusent un composant d'un autre site (code lu) ; l'aperçu du personnalisateur ne peut désigner qu'un composant du site ou global (liste d'options validée par `coerce`).
- Publication d'une page : transaction unique, contrôle préalable (`preflight`), pas de version en double ; restauration d'une version → **brouillon** (la page en ligne ne change pas), état d'avant conservé (`before_restore`) ; historique existant réutilisé (aucun second système).
- Autosave de l'éditeur (`public/js/page-builder.js`) : un seul enregistrement en vol, file ordonnée, numéro de révision à chaque envoi, 409 → blocage visible + copie locale, 401/réseau → réessais espacés (5 s × n, max 5) avec message, `beforeunload` si non enregistré, « Publier » attend l'enregistrement en cours. Le système existant est conservé (pas de second autosave).
