# Pied de page : pourquoi vignette, aperçu, éditeur et site public différaient (diagnostic du 2026-11-03)

Le diagnostic a été fait **avant** toute modification, par reproduction sur un serveur réel (modèle A publié, brouillon modifié, modèle B jamais publié, modèle C plus récent) puis par mesure dans Chrome (largeur du pied dans chaque rendu à 1280, 820 et 390 px).

## Parcours d'un pied de page (un modèle = un composant de site + une ligne `mk_tb_templates`)
| Contexte | Chemin | Ce qui est lu |
|---|---|---|
| Carte (liste) | `themeBuilder.js` `card` → `docOf` → `thumb.js` | structure filaire (SVG) du composant |
| Vignette réelle | `GET …/modeles/:id/vignette` → `themeRender.previewDoc` | copie de travail (`draft || section`) |
| Bibliothèque | `…/bibliotheque/:type/:key/(apercu|vignette|miniature)` | document du catalogue |
| Aperçu | `GET /site-web/composants/:id/apercu` → `landing.renderPreview` → `pages.withSiteParts` | une page du site + parties résolues |
| Éditeur | `GET /site-web/composants/:id/editeur`, `POST …/rendu` | copie de travail ; canevas = section dans une page |
| Site public | `/p/:slug` → `withSiteParts({ themeBuilder: true })` ; autres pages : `themeLayout` | version diffusée du modèle gagnant |

## Causes racines (vérifiées)
1. **L'aperçu n'affichait pas le pied prévisualisé.** `renderPreview` appelait `withSiteParts(…, { draftId })` sans le Theme Builder : le pied affiché était celui que le *site* désignait dans l'ancien réglage `mk_sites.footer_component_id` (ou aucun). `draftId` ne remplaçait que ce pied hérité, jamais le composant prévisualisé. Reproduit : aperçu d'un brouillon V2 → ni V1 ni V2 à l'écran.
2. **Largeur différente selon le rendu.** Un pied est fait de bandes pleine largeur. Le rendu hors Page Builder (`themeRender.renderVm`, utilisé par la vignette et la bibliothèque) les sort de la colonne de contenu (`kw-theme-bleed`). Les pages du Page Builder (site public, aperçu, canevas de l'éditeur) les laissaient dans `.lp-main` : **728 px au lieu de 1280 px** à 1280 px d'écran (820 → 728 ; 390 → 358). Les colonnes se repliaient (3 au lieu de 4) : « une autre composition ».
3. **La carte lisait la version diffusée** (`getComponent().section`) alors que l'éditeur et la vignette réelle lisent la copie de travail : la miniature filaire ne suivait pas les modifications enregistrées.
4. **Repli silencieux sur l'ancien réglage.** Quand le Theme Builder gérait le pied mais qu'aucun modèle ne s'appliquait à une page (exclusion), `withSiteParts` conservait l'ancien pied du site : un pied « fantôme » que le Theme Builder ne pilotait pas.
5. **Bibliothèque ≠ copie.** L'aperçu de la bibliothèque construisait le document sans le formulaire d'inscription du site, alors que « Utiliser ce modèle » le construisait avec : les mises en page « Newsletter » et « Asymétrique » différaient avant/après la copie.

Ce qui n'était **pas** en cause : cache (liste invalidée par `stampOf`, pages `no-store`), identifiants (`?modele=` vérifié), sauvegarde (l'éditeur recharge bien la copie de travail enregistrée), priorité (déjà déterministe).

## Corrections
| Cause | Correction | Fichier |
|---|---|---|
| 1 | `withSiteParts({ force })` : l'aperçu injecte **exactement** le composant du modèle (copie de travail) à la place de la partie résolue ; l'aperçu annonce le modèle, son état et que les conditions sont ignorées | `pages/index.js`, `web/landing.js` |
| 2 | Une seule règle de largeur : `partBleeds` marque la partie (`bleed`), `_sections.ejs` ajoute `lp-part-bleed`, `landing.css` la sort de la colonne ; appliquée aussi au canevas de l'éditeur (`/rendu`) | `pages/index.js`, `_sections.ejs`, `landing.css`, `web/landing.js` |
| 3 | `docOf` lit `draft || section` | `web/themeBuilder.js` |
| 4 | `partsFor` renvoie `managed` : si le site a un modèle publié de ce type, aucune partie n'est reprise de l'ancien réglage | `themeBuilder/render.js`, `pages/index.js` |
| 5 | Aperçu, vignette et miniature de la bibliothèque utilisent le même `formId` que « Utiliser » | `web/themeBuilder.js`, `catalog/index.js` |

Aucune migration : aucune donnée n'est modifiée ; l'ancienne colonne `footer_component_id` reste intacte (elle n'est plus qu'un repli quand le site n'a **aucun** modèle publié de ce type).

## Règle de priorité (inchangée, désormais testée avec des ordres de chargement aléatoires)
Brouillon/archivé : jamais ; exclusion > inclusion ; le plus précis gagne ; à égalité le plus récemment publié ; puis le plus petit identifiant. Deux publications dans la même seconde sont à égalité de date : le plus petit identifiant l'emporte.

## Tests (`tests/theme-builder-pied-de-page-coherence.test.js`, 10 tests)
Cycle édition → sauvegarde → rechargement → aperçu du brouillon → publication → public ; aperçu d'un pied non gagnant ; carte = copie de travail ; ancien pied jamais réaffiché ; priorité déterministe ; isolation entre sites ; bibliothèque = copie ; **dans Chrome** à 1280 / 820 / 390 px : site public = aperçu = vignette (largeur, texte, colonnes par rangée), canevas de l'éditeur = public (largeur, texte hors aides, conteneurs), aucun défilement horizontal.

## Limites restantes
* La miniature filaire de la carte reste un schéma de structure (pas un rendu) : la vignette réelle (`/vignette`) est la référence visuelle.
* Les encadrés d'aide propres à l'éditeur (« Aucun logo… », « aucun menu publié… ») apparaissent dans le canevas et pas sur le site : voulu.
* Pas de comparaison pixel par pixel (captures) : la comparaison porte sur la largeur, le texte et la disposition mesurée par le navigateur.
* Les pages hors Page Builder (blog, boutique, 404) suivent `themeLayout` : non modifié ici.
