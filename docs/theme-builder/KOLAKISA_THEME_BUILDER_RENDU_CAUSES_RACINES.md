# Theme Builder → site public : causes racines de la non-propagation des modèles

*Audit du code de `origin/main` (df7c0bd3). Les constats sont tirés du code ; ils sont confirmés par `tests/theme-builder-couverture-rendu.test.js` (échecs avant correction, succès après).*

## 1. Deux renderers publics, un seul branché sur le Theme Builder
| Renderer | Où | Ce qui s'affiche autour du contenu | Theme Builder (23.1) |
|---|---|---|---|
| **Page Builder** | `landingPublic.js` (`/p/<adresse>` et pages d'un domaine) | En-tête / pied = composants du site, via `pages.withSiteParts(…, { themeBuilder: true })` | **Branché** : `themeBuilder/render.partsFor` (en-tête, pied de page) |
| **Gabarits du site** (blog, recherche, boutique, 404, à-propos, catalogue…) | `views/partials/header.ejs` et `footer.ejs`, routes `blog.js`, `shopPublic.js`, `server.js` (404) | En-tête / pied **codés dans la vue**, alimentés par les réglages d'apparence (`ap.header`) ; jamais par un composant du site | **Non branché** pour l'en-tête et le pied |

Conséquence directe de ce que décrit la demande : un en-tête créé et publié dans le Theme Builder s'affiche sur les pages du Page Builder, mais **les articles, archives, recherches, pages de boutique et pages 404 d'un même site gardent l'ancien en-tête** (celui de `header.ejs`).

## 2. Cause racine n° 1 — `themeBuilder/render.js` ne couvre que 4 des 11 types
`FAMILY` (utilisée par `pickRegion`) ne connaît que `product` et `product_archive`. Les appels `themeRender.renderRegion` pour l'article (`single_post`), les archives (`blog_archive`, `category_archive`, `tag_archive`, `author_archive`), la recherche (`search_results`), la 404 (`not_found`) et la page statique (`static_page`) passent par **l'ancien** système (`themeTemplates.pick`) : un modèle publié dans le Theme Builder pour ces types n'est **jamais** lu. `types.js` les déclare pourtant (`single_post`, `archive`, `search_results`, `not_found`, `single_page`).

## 3. Cause racine n° 2 — le site n'est pas transmis au moteur de résolution
`blog.js` et `server.js` (404) appellent `renderRegion` **sans `siteId`**. `pickRegion` renvoie alors `null` dès le début (`if (!siteId) return null`), même pour un blog servi par le domaine d'un site (`req.kwSite`). Seule la boutique (`shopPublic.js`) passe le site. Le site de la requête est pourtant connu (`req.kwSite`, résolu par `middlewares/siteHost.js`).

## 4. Cause racine n° 3 — le contexte de résolution est inexact ou absent
`partsFor` construit un contexte « page » figé (`view: front|page`, `categories: []`, `tags: []`) : une condition par catégorie, par étiquette ou par type d'archive ne peut jamais correspondre, et les pages hors Page Builder n'ont aucun contexte. `pickRegion` ne construit de contexte que pour produit / archive produits.

## 5. Cause racine n° 4 — l'en-tête de repli masque l'erreur
`withSiteParts` : `p.header = partOf(ctx, tb.header, …) || p.header`. Si le composant du modèle gagnant n'a pas de version publiée (ou a été supprimé), le code retombe **silencieusement** sur l'ancien en-tête du site, sans trace. Même chose pour le pied de page.

## 6. Ce qui n'est PAS en cause (vérifié)
* **Cache :** `/p/*` répond `Cache-Control: no-store` ; la liste des modèles publiés est mise en cache par site avec un marqueur (`store.stampOf`) qui change à chaque écriture ; le contenu des composants est relu à chaque requête. Aucun cache périmé trouvé.
* **Isolation :** `store.*` filtre toujours par `organization_id` et `site_id` ; un modèle d'un site n'est pas lu par un autre (tests existants).
* **Feuilles de style :** les parties rendues par le Page Builder sont habillées par les jetons et le CSS générés du site (`vm.nodeCss`, `assets.*`), dans l'ordre jetons → thème → éléments → personnalisé ; aucun `!important` n'est nécessaire.
* **Éditeur de pages :** `partsFor` n'est appelé que pour la page publiée et son aperçu, jamais par le canevas de l'éditeur (test existant). Cette règle est conservée.
* **Site principal :** le Theme Builder n'est proposé que pour les sites créés (`siteSpace.js`: `!space.principal`) ; le site principal garde son en-tête d'apparence. Hors périmètre.

## 7. Architecture de correction
1. **Un seul service de résolution** (`themeBuilder/render.js`, étendu) : `contextFor(req, view, data)` construit le contexte (site = `req.kwSite`, vue, identifiant, catégories, étiquettes, auteur, archive) ; `pickRegion` couvre **tous** les types de page (article, archives, recherche, 404, page statique, produit, archive produits) ; `partsFor` utilise le même contexte.
2. **Un seul rendu** : le rendu d'un modèle (page ou composant) passe par les mêmes fonctions que le Page Builder (`landing.viewModel`, `marketing-public/_sections`) ; aucun second moteur.
3. **En-tête et pied de page des pages du site** : un modèle publié applicable remplace l'en-tête / le pied codés dans `header.ejs` / `footer.ejs` pour les requêtes d'un domaine de site ; sans modèle, rendu historique inchangé.
4. **Repli visible** : un modèle gagnant dont le document est absent est journalisé (jamais silencieux) et le repli historique est conservé.
5. **Aucun nouveau cache** : réutilisation du marqueur existant ; invalidation ciblée par site.
