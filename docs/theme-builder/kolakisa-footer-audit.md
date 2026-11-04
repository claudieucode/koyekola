# Pieds de page du Theme Builder — audit initial (3 novembre 2026)

Établi **avant** la reconstruction, sur `origin/main` au commit `d74fb554`. Il suit les neuf points de l'audit demandé.

## Résultat en une page

| # | Constat | Gravité | Traité par |
|---|---|---|---|
| 1 | Le catalogue annonçait 100 modèles mais n'en contenait que **20 compositions** : 20 mises en page × 5 identités (clair, marque, nuit, éditorial, doux). Les 5 variantes d'une même mise en page ne différaient que par couleurs, typographie, arrondis et bordures. | Qualité : le défaut de fond demandé | Nouveau catalogue « plat » : 100 compositions |
| 2 | **`catalog/index.js` ligne 57 cassait toute la bibliothèque « plate »** : `build()` cherchait la mise en page par la clé de *famille* (`meta.layoutKey`) au lieu de son identifiant (`meta.layoutId`) → `Cannot read properties of undefined (reading 'build')`. Reproduit sur `origin/main` avec un **en-tête** : la bibliothèque d'en-têtes (déjà livrée) levait cette erreur à l'aperçu, à la vignette et à « Utiliser ». Une résolution de conflit lors de la fusion de la branche 404 avait réintroduit l'ancienne ligne. | **Bloquant** pour toute bibliothèque plate | Corrigé (`layoutId`) ; testé pour les en-têtes et les pieds |
| 3 | Un seul pied de page doit être rendu par page. | — | Déjà garanti et testé (`theme-builder-pied-unique`, `theme-builder-pied-de-page-coherence`, `widgets-theme-builder-unicite`) ; re-vérifié pour les nouveaux modèles |
| 4 | Les pieds réellement utilisés par les sites ne sont **pas** dans le catalogue : « Utiliser ce modèle » crée une copie indépendante (composant + ligne `mk_tb_templates`). | — | Aucune migration nécessaire ; aucune donnée de site n'est touchée |

## 1. Modèles existants et identifiants

* `src/themeBuilder/catalog/footer.js` : 20 mises en page (`une-ligne`, `copyright-seul`, `trois-colonnes`, `quatre-colonnes`, `cinq-colonnes`, `logo-description`, `newsletter`, `reseaux`, `navigation-secondaire`, `boutique`, `blog`, `pro`, `formation`, `marque-geante`, `deux-rangees`, `appel-action`, `editorial`, `centre`, `asymetrique`, `accordeons`).
* Clé d'un modèle = `<mise en page>.<identité>` → 20 × 5 = 100 clés (`trois-colonnes.nuit`…).
* Le catalogue est du **code** : aucune ligne en base, aucun fichier d'images. Supprimer les modèles = supprimer ce code ; il n'y a pas de données à migrer.

## 2. Schéma de données

Un modèle du site = une ligne `mk_tb_templates` (type `footer`, état, conditions, `source_kind = component`, `source_id`) + un composant `mk_web_components` (section du Page Builder : brouillon et version diffusée). Voir `KOLAKISA_THEME_BUILDER_ARCHITECTURE.md`. Le catalogue ne porte aucun schéma propre : il produit des nœuds de la grammaire fermée de `nodes.js`.

## 3. Composants et widgets

Les pieds utilisaient déjà : logo, titre du site, menu affecté (emplacement « Pied de page » ou « En-tête »), copyright, listes dynamiques (`querylist`, `courselist`), recherche, compte, mini-panier, formulaire d'inscription, réseaux, bascule, séparateur, boutons, liens. Manquaient pour la nouvelle bibliothèque : **liste d'icônes (coordonnées)**, **carte** et **texte dynamique de date** — tous existent déjà dans la grammaire (`iconlist`, `map`, `dyntext`).

## 4. Rendu, bibliothèque, vignettes

| Contexte | Chemin | Source de données |
|---|---|---|
| Liste de la bibliothèque | `Catalog.list` | métadonnées seulement (jamais le document) |
| Aperçu / vignette / miniature | `/api/bibliotheque/footer/:key/(apercu|vignette|miniature)` → `themeRender.previewDoc` | `Catalog.build` (même document que « Utiliser ») |
| Utiliser | `catalog/use.js` | `Catalog.build` + `siteFormId` du site |
| Éditeur, aperçu d'une copie, site public | composant du site | copie indépendante |

Les trois premières lignes lisent le **même** document : la cohérence vignette / aperçu / copie est donc structurelle. Les causes des écarts passés (largeur, ancien pied, copie diffusée / brouillon) sont dans `KOLAKISA_THEME_BUILDER_PIED_DE_PAGE_CAUSES_RACINES.md` et sont déjà corrigées.

## 5. Éditeur, sauvegarde, publication, règles d'affichage

Inchangés : l'éditeur du Page Builder ouvre le composant ; la publication passe par `store.publish` (conditions, remplacement explicite en cas de mêmes conditions) ; le plus précis gagne ; un seul pied est résolu par page (`resolve.js`).

## 6. Intégration avec les sites et risque de doublons

* Un pied du Theme Builder publié remplace l'ancien réglage (`mk_sites.footer_component_id`, `partsFor.managed`) : jamais deux pieds.
* Les widgets de pied et la ligne légale sont rendus **dans** le pied du Theme Builder (commit `d74fb554`), plus de second bloc.
* Contrôles de cette mission : un pied de la bibliothèque publié s'affiche **une seule fois** sur chaque page publique (test `theme-builder-pieds-bibliotheque`).

## 7. Responsive et styles

L'ancien catalogue utilisait des colonnes `flexBasis: 0` + `minWidth: 180px` : correct. Défauts relevés sur les anciens pieds : menu horizontal replié derrière un bouton « hamburger » (`mobileToggle` par défaut sur un menu horizontal), ombre portée héritée de l'identité « marque » sous le pied, icônes de liste invisibles sur fond de marque. Corrigés dans le nouveau catalogue.

## 8. Tests existants

`theme-builder-catalogue-public` (clés d'ancien pied : adaptées), `theme-builder-pied-unique`, `theme-builder-pied-de-page-coherence` (clés `mise=newsletter` / `quatre-colonnes` : adaptées aux familles), `widgets-theme-builder-unicite`, `theme-builder-vignettes-retour`, `theme-builder-bibliotheque-navigateur`.
