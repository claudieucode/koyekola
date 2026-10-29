# Palier 12 — Implémentation

## Corrections réalisées
1. **Intégration des paliers 8-11** (`git merge --no-ff integration/palier11-sur-main` sur une branche `palier12` issue de `origin/main`). 68 fichiers, +4540/−84. Contenu : révision des composants (409 sur conflit entre onglets), « Mettre à jour » fiable, copie de site et déplacement de page sans perte des parties, page-modèle protégée, écran « Pourquoi ce modèle ? », brouillon + aperçu privé + « Mettre à jour » de l'en-tête et du pied de page, audit des 92 éléments, éléments « Défilement continu » et « Avant / Après » déjà livrés par la branche (non ajoutés par ce palier).
2. **Migration** : `094_composants_revision.sql` (branche) → `src/marketing/migrations/114_composants_revision.sql` (`git mv`, contenu identique : `ALTER TABLE mk_web_components ADD COLUMN revision INTEGER NOT NULL DEFAULT 0`). Aucune migration existante modifiée ou supprimée.
3. **Brouillon de composant sans révision refusé** : `src/marketing/web/landing.js` (`PUT /marketing/site-web/composants/:id/brouillon`) → erreur `invalid_field` « Révision manquante » au lieu d'écraser en silence. L'éditeur envoie toujours la révision (`public/js/page-builder.js`, `api("PUT", …/brouillon, {content, revision})`).

## Résolution des 5 conflits de fusion (rien supprimé des deux côtés)
| Fichier | Résolution |
|---|---|
| `public/css/landing.css` | les deux blocs conservés (navigation automatique de `main` + marquee / avant-après de la branche) |
| `src/marketing/pages/index.js` | `withSiteParts(ctx, page, sections, { draftId })` (branche) **et** l'aperçu du personnalisateur par site (`main`, `previewParts`) |
| `src/marketing/web/landing.js` | rôle via `pages.componentRole` + `revision: c.revision` (branche) ; lien de retour `…/reglages/en-tete#entete` (`main`) |
| `tests/site-espace.test.js`, `tests/site-menu-p1a.test.js` | dernier numéro de migration = 114, historique conservé (le premier échouait déjà sur `main`, bloqué à 109) |

## Causes racines
- P1/P2 : branches de longue durée jamais intégrées + numérotation de migrations partagée entre sessions parallèles sans réservation.
- P3 : contrôle de concurrence rendu optionnel côté serveur (`Number.isInteger(asked) ? asked : undefined`), alors que le service refuse déjà une révision périmée *quand elle est fournie*.
- P4 : `main` a changé la valeur par défaut de l'élément « menu » (source CMS) ; les tests de la branche supposaient l'ancienne.

## Décisions techniques
- **Strictness limitée à l'enregistrement du brouillon.** J'avais d'abord exigé la révision aussi pour « Mettre à jour » / « Abandonner » ; le test existant `theme-builder-serveur` (« version identique : rien de nouveau n'est publié », second clic sans révision → 200) documente un comportement voulu. Je l'ai **revenu** plutôt que d'affaiblir le test ; seul l'autosave, chemin d'écrasement silencieux, est durci.
- **Pas de nouveau système** d'autosave, d'historique ou d'isolation : l'existant (file d'enregistrement, `mk_page_versions`/`revisions`, `routeScopes.js`) est réutilisé.
- Permissions de « Mettre à jour » un composant : `forms.write` (comme avant) ; la publication d'une page exige `pages.publish`. Aujourd'hui les deux valent « editor » ; non modifié faute de défaut confirmé (voir LIMITATIONS).
- Test d'élément « menu » : liste manuelle explicite dans `tests/widgets-helpers.js` (assertions inchangées).

## Compatibilité préservée
Colonne additive avec valeur par défaut ; routes inchangées (seule l'absence de révision sur l'autosave de composant devient une erreur) ; aucune donnée migrée ; mise à niveau 113 → 114 testée.

## Fichiers modifiés par ce palier (hors contenu de la fusion)
`src/marketing/web/landing.js`, `src/marketing/migrations/114_composants_revision.sql` (renommée), `tests/palier12-isolation-composants.test.js` (nouveau), `tests/palier12-migration-composants-revision.test.js` (nouveau), `tests/widgets-helpers.js`, `tests/site-espace.test.js`, `tests/site-menu-p1a.test.js`, `docs/KOLAKISA_PALIER12_*.md`.
