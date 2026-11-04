# Audit initial — catégorie En-tête du Theme Builder (avant refonte)

Établi à partir du code du dépôt (`main`, novembre 2026). Chaque constat renvoie à un fichier ; rien n'est supposé.

## 1. État de la bibliothèque avant refonte

* `src/themeBuilder/catalog/header.js` : **20 mises en page × 5 identités = 100 modèles**, construits par produit cartésien (`catalog/index.js`, `entries()`).
* Les cinq identités (`catalog/kit.js`, `SKINS`) ne changent que couleurs, rayons, bordures, relief, casse et densité. Une même mise en page existait donc cinq fois ;
  seules **20 compositions réelles** existaient. Le cahier des charges demande 100 compositions distinctes « pas uniquement par la couleur » : l'objectif n'était pas atteint.
* Le catalogue est du **code** : aucune ligne en base tant qu'un modèle n'est pas utilisé (`catalog/use.js`). « Utiliser » crée une **copie indépendante** (composant + modèle Theme Builder en brouillon).

## 2. Chaîne de rendu (une seule source)

| Surface | Chemin | Source du document |
|---|---|---|
| Vignette de carte | `GET …/api/bibliotheque/header/:clé/vignette` → `themeRender.previewDoc(thumb)` | `Catalog.build()` |
| Aperçu | `GET …/api/bibliotheque/header/:clé/apercu` → `previewDoc` | `Catalog.build()` |
| Éditeur / aperçu d'une copie | `…/composants/:id/apercu`, canevas `…/rendu` | copie du composant |
| Site publié (pages du Page Builder) | `pages.withSiteParts` → `landing.viewModel` → `_sections.ejs` | composant publié |
| Site publié (blog, recherche, 404…) | `themeLayout` → `themeRender.renderParts` → `partials/header.ejs` | composant publié |

* Vignette, aperçu et site publié passent tous par `renderVm` / `_sections` : **ils ne peuvent pas diverger par construction**. Le seul dessin « inventé » est la miniature filaire `thumb.js` (repli quand la vignette réelle échoue) ; elle empile les éléments verticalement et ne représente donc pas fidèlement une rangée d'en-tête. Elle reste un repli, jamais l'affichage principal (`libLazyThumb`).
* Le collant et le superposé ne sont lus que sur la **première bande** du composant (`themeRender.partMode`) : un modèle ne peut pas rendre sticky une bande autre que la première.

## 3. Éléments natifs disponibles pour un en-tête (`pages/nodes.js`)

`sitelogo`, `sitetitle`, `menu` (menu affecté à l'emplacement ; un niveau de sous-menu ; `mobileToggle`), `search`, `account`, `minicart`, `social`, `dyntext` (date…), `text`, `button`, `link`, `divider`, `spacer`, conteneurs flex/grille, `hideOn` par appareil, animations de survol (`hover`), styles par appareil (desktop / tablette / mobile).
Non disponibles : effets de défilement propres à l'en-tête (rétrécissement, transparence au défilement), pointeurs de menu configurables, plusieurs niveaux de sous-menu.

## 4. Défauts constatés dans l'ancien catalogue

1. **Doublons de composition** (§1) : 80 % des modèles ne différaient que par l'identité.
2. **Aucune adaptation mobile explicite** des éléments secondaires : réseaux, date, messages restaient visibles et se repliaient en désordre (`flexWrap` seul).
3. **Zone d'action unique** : peu de cas d'usage (SaaS, e-commerce, portfolio, magazine) réellement différenciés par leur structure.
4. **Verre dépoli** : calcul de la couleur translucide fragile quand le fond est un jeton (`#ffffffcc` imposé).
5. Le filtre « mise en page » de l'interface listait 20 entrées sans notion de famille d'usage.

## 5. Données existantes et migration

* Le catalogue n'écrit rien en base : **aucun modèle de catalogue n'est stocké**. Les en-têtes utilisés par des sites sont des **copies indépendantes** (`mk_web_components` + `mk_tb_templates`) ; ils ne dépendent ni d'une clé ni d'une version du catalogue.
* Conséquence : remplacer le catalogue **ne supprime ni ne modifie** aucun en-tête de site. Aucune migration destructive n'est nécessaire, et aucune n'est écrite.
* Les anciennes clés (`classique.clair`…) deviennent inconnues du catalogue (`Catalog.find` → `null`, « Modèle introuvable »). Les vignettes et caches sont indexés par clé : le cache du catalogue (`CACHE`, 300 entrées) vit en mémoire et se vide au redémarrage ; les vignettes du navigateur sont mises en cache 2 minutes.

## 6. Tests existants touchant l'en-tête

`theme-builder-catalogue.test.js` (100 modèles valides et distincts, ≥ 20 structures), `theme-builder-catalogue-public.test.js` (adoption de `classique.clair`), `theme-builder-apercu-vignette.test.js`, `theme-builder-bibliotheque-navigateur.test.js`, `site-web-entete*.test.js`.
Le seuil « ≥ 20 structures » validait précisément la limite du §1.
