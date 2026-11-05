# Catalogue de modèles du Theme Builder

Le catalogue fournit **100 modèles par type** (20 mises en page × 5 identités visuelles) pour : En-tête, Pied de page, Page individuelle, Article individuel, Archives, Résultats de recherche, Page 404, Produit individuel, Archives produits (= 900 modèles).
> **Exception : Pied de page.** Même refonte (novembre 2026) : 100 compositions distinctes (10 familles × 10, 20 par identité) — voir [`kolakisa-footer-library.md`](kolakisa-footer-library.md) et [`kolakisa-footer-library-modeles.md`](kolakisa-footer-library-modeles.md).
> **Exception : En-tête.** Depuis la refonte de novembre 2026, le catalogue d'en-têtes n'est plus un croisement 20 × 5 mais **100 compositions distinctes** (10 familles × 10, identité fixée par modèle, 20 par identité) : voir [`kolakisa-header-library.md`](kolakisa-header-library.md) et [`kolakisa-header-library-modeles.md`](kolakisa-header-library-modeles.md). Les autres types gardent le croisement ci-dessous.

Les types « Barre latérale » et « Modèle personnalisé » n'ont **pas** de catalogue : aucune zone du site public ne les affiche (voir RENDU_CAUSES_RACINES §9) — leur proposer 100 modèles serait une fonctionnalité fictive.

## Principe
* Le catalogue est du **code** (`src/themeBuilder/catalog/<type>.js`), pas des lignes en base. Rien n'est écrit tant qu'un modèle n'est pas utilisé.
* `list()` ne renvoie que des **métadonnées** (clé, nom, étiquettes, description), filtrées et paginées. Le document d'un modèle n'est construit (`build()`) que pour l'aperçu ou l'utilisation, puis gardé dans un cache borné (300 entrées).
* **Utiliser un modèle** (`catalog/use.js`) crée une **copie indépendante** dans le site : un composant (en-tête, pied de page) ou une page (autres types), puis le modèle du Theme Builder en **brouillon**. Rien n'est publié sans action explicite. Modifier la copie ne change pas le catalogue ni un autre site.
* Un modèle = une **mise en page** (structure d'éléments) × une **identité** (skin : couleurs du site ou teintes propres, typographie, arrondis, bordures, relief, casse, densité). Les identités changent aussi la structure du rendu (filets, relief, casse), pas seulement les couleurs.
* Éléments natifs uniquement (grammaire fermée de `pages/nodes.js`) : aucun HTML, CSS ni script libre, aucune image factice (les images viennent de `{{post.image}}`, `{{product.image}}`…), aucun lien inventé (la navigation est le menu affecté dans Apparence → Menus).
* Les couleurs sont des **jetons du site** (`token:primary`…) : un modèle prend la charte du site qui l'utilise. Seule l'identité « Nuit » pose des teintes propres.

## Identités (skins) — `catalog/kit.js`
Clair épuré · Couleur de marque · Nuit · Éditorial (serif, capitales, filet double, angles droits) · Doux et arrondi.

## Écrire une mise en page (kit)
Un fichier `catalog/<type>.js` exporte `{ type, kind: "component" | "page", layouts: [L(key, label, tags, desc, (k, env) => [noeuds])] }` avec exactement **20** mises en page de **structures différentes** (pas de variantes de valeurs). `k = kit(skin)` fournit :

| Aide | Rôle |
|---|---|
| `k.band(children, st, tablet, mobile, name)` | bande pleine largeur du skin (fond, filet) |
| `k.inner(children, st)` | zone de contenu centrée (1180 px), flex en ligne |
| `k.section(children, st)` | section de page (colonne, marges verticales) |
| `k.row`, `k.col`, `k.card`, `k.grid(n, children)` | mise en page flex / carte du skin / grille responsive |
| `k.H(txt, level, st)`, `k.L(txt)`, `k.T(html, st)`, `k.B(label, url, variant, st)`, `k.LINK` | titres, libellé de rubrique, texte, bouton, lien (couleurs et casse du skin) |
| `k.logo(h)`, `k.siteTitle()`, `k.menu(location, st, vertical)`, `k.search(target)`, `k.account()`, `k.social(items)` | éléments du site |
| `k.W(type, props, st)` | **widget natif** : `postcontent`, `postmeta`, `postterms`, `postnav`, `authorbox`, `postcomments`, `archiveinfo`, `toc`, `breadcrumb`, `sharebuttons`, `readingprogress`, `querylist`, `catfilter`, `shopbuy`, `shopgrid`, `shopfilters`, `shopsearch`, `shopcart`, `minicart`, `posts`, `courselist`, `accordion`, `iconlist`… |
| `k.img(token, st)` | image dynamique (`post.image`, `product.image`, `author.avatar`…) |
| `k.loop(cols, itemChildren, loop, gridSt, cardSt)` | grille qui répète une carte pour chaque résultat réel (`loop`: `{ source: "posts" \| "products" \| "courses", count, paginate: true, pagination: "numbers" \| "more", urlFilter: true }`) |
| `env.formId` | identifiant d'un formulaire d'inscription réel du site, ou `null` (ne jamais inventer de formulaire : sinon `k.B("S'abonner", "/contact")`) |

Étiquettes dynamiques utilisables dans les textes (`{{…}}`) : `post.title/excerpt/url/image/date/author/category/reading_time/tags/comments/author_bio/author_avatar`, `archive.title/description/count/search/url`, `product.title/price/regular_price/short_description/description/image/sku/availability/category/url`, `page.title`, `site.name`, `author.*`, `term.*`. Dans une boucle `posts`, `{{post.*}}` désigne le résultat courant ; dans une boucle `products`, `{{product.*}}`.

Chaque mise en page doit être **structurellement distincte** : le test `theme-builder-catalogue` exige 100 modèles valides (acceptés par la vraie grammaire), tous différents, et au moins 20 structures (arbre d'éléments + noms de réglages) distinctes par type.
