# Site principal : migration vers le Theme Builder, audit (7 novembre 2026)

## 1. Constat principal : l'essentiel était déjà fait
Le commit `c214eab4` (déjà sur `main`) a livré le gros du chantier. Rien n'a été refait. Voir aussi `docs/theme-builder/KOLAKISA_THEME_BUILDER_GESTIONNAIRE_UNIQUE.md`.

| Besoin du chantier | État constaté dans le code | Preuve |
|---|---|---|
| `site_id` nul dans `mk_tb_templates` | Fait : migration `128_theme_builder_site_principal.sql`, toutes les requêtes de `src/themeBuilder/store.js` filtrent `site_id IS ?` | `tests/theme-builder-site-principal.test.js` |
| Rendu sans `req.kwSite` | Fait : `src/middlewares/themeLayout.js` (pas de `kwSite` = site principal), `src/marketing/web/themeRender.js`, `src/themeBuilder/render.js` | idem |
| Repli sur l'ancien rendu s'il n'y a pas de modèle publié | Fait : l'habillage d'apparence reste tant qu'aucun modèle d'en-tête / de pied n'est publié ; archiver le modèle le rend | test 3 du fichier ci-dessus ; nouveau test navigateur (test 4) |
| Anciens écrans En-tête / Pied de page | Retirés (301 vers le Theme Builder, POST en 404) | test 4 de `theme-builder-site-principal` |

## 2. Ce qui reste en production et pourquoi
`appearance_configs` (+ `src/services/appearance.js`, `appearanceEditor.js`, permission `appearance.parts`) ne sert PAS qu'à l'en-tête et au pied.
Cette table porte aussi les styles globaux (couleurs, polices), les thèmes et les réglages du site principal (`styles.js`, `siteStyles.js`, `themes.js`, `locals.js`, `stylePreview.js`).
Elle ne peut donc pas être supprimée sans casser tout le site public. Seuls les réglages d'en-tête et de pied qu'elle contient (logo, bandeau d'annonce, bouton d'action, recherche/panier/compte, marque et mentions du pied) deviennent de simples valeurs de repli, non modifiables.

## 3. Plan par étapes réversibles
1. Fait (déjà sur main) : modèles à `site_id` nul ; rendu avec repli exact ; écrans autonomes retirés.
2. Fait dans ce lot : retrait de 3 vues orphelines (`views/marketing/site.ejs`, `site-header.ejs`, `site-footer.ejs`), preuve ci-dessous ; test navigateur de non-régression.
3. Non fait, volontairement : conversion automatique des réglages d'en-tête/pied en modèles (voir 5).
4. Non fait : suppression de `appearance_configs` / `appearance.parts`.

## 4. Preuve de non-référencement des vues orphelines
Recherche exhaustive (`src`, `server.js`, `views`, `tests`, `scripts`, `public`) des noms `marketing/site`, `marketing/site-header`, `marketing/site-footer`, `site.ejs`, `site-header.ejs`, `site-footer.ejs` :
aucun `res.render`, aucun `include`, aucun nom construit dynamiquement (`marketing/${...}` : aucun résultat). Les seules mentions sont de la documentation historique.
Les 3 fichiers ne s'incluaient que `partials/top` et `partials/bottom` (toujours utilisés ailleurs). Retrait par `git rm` : un `git revert` les restitue.

## 5. Ce qui ne sera PAS fait, et risques
* Pas de conversion automatique de la config d'apparence en modèles : ce sont des réglages structurés, pas des documents du Page Builder ; une conversion « à l'identique » créerait un modèle qui ne reproduit pas exactement l'habillage actuel (risque visuel sur toutes les pages de kolakisa.com). La migration se fait à la main avec la bibliothèque (100 en-têtes, pieds).
* Pas de suppression de `appearance_configs` ni de la permission `appearance.parts` (utilisées pour les styles et thèmes).
* Risque restant : publier un modèle change TOUTES les pages publiques du site principal, pages d'atterrissage comprises. Retour arrière : archiver le modèle.
* La CI de `main` a des échecs déjà présents (cms-interface, D2/D3, migration 081, agent-ia, infobulles) : non traités.
