# KOLAKISA — Programme 20.3 : Theme Builder, implémentation

*Branche `feat/programme-20-3-theme-builder`, issue de `origin/main` (bd794900). 2026-10-30. Statut : **VALIDÉ AVEC RÉSERVES** (voir fin).*

## Audit préalable (constats)
- Les documents du Programme 20.1 n'existent que sur une branche locale non fusionnée ; le Programme 20.2 est sur une branche poussée non fusionnée, avec 10 tests hérités en échec. **Décision de l'utilisateur : étendre l'existant depuis `main`**, sans 20.2.
- **Un Theme Builder existe déjà** (missions 9 / 9.1) : `pages/themeTemplates.js`, `web/themeRender.js`, écran « Modèles de thème », 9 familles, conditions, priorité, « Pourquoi ce modèle ? », garde de suppression. Il n'a pas été reconstruit.

## Réutilisé tel quel
Éditeur de pages (brouillon, révision, publication, versions), moteur `renderRegion`, étiquettes `{{post.…}}`, routage du blog / 404 / fiche formation, droits `forms.read` / `forms.write`, apparence du site.

## Modifications (les seules)
| Fichier | Changement |
|---|---|
| `src/marketing/pages/themeTemplates.js` | **Exclusions** (catégories, étiquettes, articles) honorées par `pick` et `explain` ; **`update`** (modifier les conditions sans changer l'identifiant ni le rang) ; **conflits** signalés (`conflicts`, même précision) ; `createdAt` / `updatedAt` ; doublon calculé exclusions comprises |
| `src/marketing/web/siteWeb.js` | Route `POST …/modeles-de-theme/:id/modifier` ; l'ajout accepte les exclusions ; le message signale les conflits |
| `views/marketing/theme-templates.ejs` | Colonnes Exclusions et Modifié ; formulaire « Modifier » par modèle ; champs d'exclusion à l'ajout |
| `tests/theme-builder-regles.test.js`, `tests/theme-builder-routes-20-3.test.js` | Nouveaux |

Aucune migration, aucune dépendance, aucune variable d'environnement. Aucun test existant modifié. Compatibilité : un modèle enregistré avant 20.3 (sans `exclude` ni dates) fonctionne à l'identique.

## Essai d'une validation stricte, retirée
J'avais validé les catégories contre la liste du blog. Deux tests existants ont échoué (ils utilisent des catégories libres). Je n'ai pas modifié ces tests : la validation a été retirée et la limite est documentée (REMAINING_ISSUES R7).

## Statut : VALIDÉ AVEC RÉSERVES
Opérationnel et prouvé : catalogue réel, ajout, modification, retrait, exclusions, priorité déterministe, conflits signalés, repli, brouillon non public, droits et entrées hostiles, rendu public. **Non réalisé** : page individuelle générique, e-commerce, duplication, aperçu à contenu choisi, rattachement des affectations à un site (voir `KOLAKISA_PROGRAMME20_3_REMAINING_ISSUES.md`).
