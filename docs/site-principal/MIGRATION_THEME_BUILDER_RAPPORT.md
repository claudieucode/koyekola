# Site principal et Theme Builder : rapport (7 novembre 2026)

**Bonne nouvelle : le gros du travail était déjà sur `main`** (commit `c214eab4`). Le site principal a déjà ses modèles Theme Builder, avec retour automatique à l'ancien habillage s'il n'y a pas de modèle publié. Je n'ai rien dupliqué.

## Fait
* Audit complet : `docs/site-principal/MIGRATION_THEME_BUILDER_AUDIT.md`.
* Retrait de 3 vues orphelines (`site.ejs`, `site-header.ejs`, `site-footer.ejs`), après recherche exhaustive : aucune n'est utilisée. Retour possible par `git revert`.
* Nouveau test dans un vrai Chrome (`tests/site-principal-theme-builder.test.js`, avec un petit pilote `tests/helpers-chrome-cdp.js` car Playwright n'est pas installé) : accueil, catalogue, blog, connexion, pied de page, menu mobile, à 390 / 820 / 1280 px.

## Preuves exécutées
* Nouveau test navigateur : 4 réussis sur 4. Sans modèle : habillage d'origine, aucun défilement horizontal. Avec modèles : en-tête et pied du Theme Builder affichés, aucun défaut de débordement, aucune erreur JavaScript. Après archivage : HTML de l'en-tête/pied et mesures calculées IDENTIQUES à l'état de départ (les 12 combinaisons page x largeur). Isolation : un modèle du site principal n'apparaît pas sur un site client, et inversement.
* `theme-builder-site-principal` : 6/6. `cms-appearance` : 38/38. `theme-builder-stabilisation` : 14/14.
* Limite : le « avant » des suites existantes n'a pas été mesuré avant le retrait des vues (elles ne sont référencées nulle part, donc aucun effet attendu). La comparaison « avant/après » du rendu repose sur l'état sans modèle puis après archivage, dans le même test.

## Pas fait (volontairement)
* Pas de conversion automatique des réglages d'apparence (logo, bandeau, etc.) en modèles : risque de changer l'aspect de kolakisa.com. Se fait à la main avec la bibliothèque.
* `appearance_configs` et la permission `appearance.parts` restent : cette table porte aussi les couleurs, polices et thèmes du site public.

## Risques restants
Publier un modèle change TOUTES les pages publiques du site principal. Retour arrière : archiver le modèle.

## À faire par vous
Déployer (hPanel, manuel). Aucun indicateur à activer : tant qu'aucun modèle n'est publié, rien ne change. Pour migrer : Theme Builder du site principal, choisir un en-tête et un pied, publier.

## Non vérifié
Rendu sur le vrai serveur de production et avec le vrai contenu ; les échecs de CI déjà présents sur main (cms-interface, D2/D3, migration 081, agent-ia, infobulles) n'ont pas été traités.
