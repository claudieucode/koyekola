# Bibliothèque « Page 404 » du Theme Builder

## Périmètre
Catégorie `not_found` (« Page 404 », groupe « Pages et contenus ») : modèle affiché quand une adresse du site n'existe pas. Elle contient **100 modèles** dans la bibliothèque (`src/themeBuilder/catalog/not_found.js`). La référence Elementor étudiée est dans `elementor-404-reference.md`.

## Architecture
- **Le catalogue est du code** : aucune ligne en base tant qu'un modèle n'est pas utilisé. `catalog/index.js` expose `entries()`, `list()`, `build()`, `find()`.
- **« Utiliser ce modèle »** (`catalog/use.js`) crée une **copie indépendante** dans le site : une page du Page Builder (`mk_landing_pages`), puis le modèle `mk_tb_templates` (brouillon, type `not_found`). Modifier la copie ne touche jamais le catalogue ni un autre site.
- **Rendu public** : `themeBuilder/render.js` (`pickRegion`, famille `not_found`) choisit le modèle publié applicable (vue `not_found`) ; `themeRender.renderRegion` le rend avec le moteur public, entouré de l'en-tête et du pied du site.
- **Vignette, aperçu, éditeur, site publié** : le document vient de la même fonction `Catalog.build()` ; vignette et aperçu passent par `themeRender.previewDoc`. Un test compare les 100 rendus.

## Les 100 modèles : 20 contenus × 5 traitements
`not_found.js` définit des **entrées propres** (nouveauté du chargeur : `def.entries()`), au lieu de « mises en page × identités » :

- **20 contenus** (archétypes) : message simple, recherche en vedette, articles suggérés, catalogue de formations, boutique, quatre chemins, catégories du blog, articles populaires, signalement, étapes de retour, ton léger, corporate, navigation du site, blog complet, page complète, centre d'aide, portfolio créatif, texte seul, actualités, contact direct.
- **5 traitements** de mise en page structurellement différents : *Centré*, *Deux colonnes* (message à gauche, carte de suggestions à droite), *Éditorial à gauche* (grand « 404 », filet d'accent), *Bandeau pleine largeur* (message sur fond de couleur, suggestions dessous), *Carte centrale* (« 404 », filet, message dans une carte).
- **Identité visuelle** (5 skins du kit : Clair épuré, Couleur de marque, Nuit, Éditorial, Doux) attribuée de façon déterministe : `(index du contenu + décalage du traitement) mod 5` → 20 modèles par identité.
- Clé : `<contenu>.<traitement>` (ex. `humour.centre`, `corporate.scinde`). Les anciennes clés (`minimale.clair`, `grand-404.clair`…) n'existent plus.

## Composants utilisés (tous natifs)
`heading`, `text`, `button`, `link`, `search`, `menu` (emplacement du CMS), `posts`, `querylist` (articles récents / populaires, catégories), `courselist`, `account`, `grid`, `group`, `stack`, `container`, `divider`. Aucune image factice ; l'effet visuel vient de la typographie, des filets, des cartes et des bandeaux.

## Règles de rendu et responsive
- Mise en page par conteneurs Flexbox / Grid du Page Builder ; **aucun positionnement absolu**.
- Toute ligne flex passe à la ligne (`flexWrap: wrap`) ; toute grille a des réglages tablette (2 colonnes au plus) et mobile (1 colonne).
- Couleurs = jetons du site (`token:primary`…) ; seule l'identité « Nuit » pose ses teintes.
- Un seul titre de niveau 1 par modèle ; liens uniquement vers des pages standard (`/`, `/blog`, `/catalogue`, `/contact`, `/boutique`, `/compte`).

## Conditions d'affichage, sauvegarde, publication
Identiques aux autres types : conditions du Theme Builder (type `not_found`, vue `not_found`), brouillon puis « Publier » ; plusieurs modèles publiés possibles, le plus précis l'emporte ; publier un autre modèle de même condition remplace l'ancien (`replace: true`). Les copies déjà utilisées par des sites restent intactes quand le catalogue change.

## Tests
- `tests/theme-builder-404-bibliotheque.test.js` : 100 modèles, clés et noms uniques, anciens modèles disparus, 5 compositions différentes par contenu, aucun document répété, un titre principal, actions réelles, grilles et lignes adaptées, identités équilibrées ; puis, sur un vrai serveur, aperçu = vignette pour les 100 modèles, utilisation → publication → vraie page introuvable du site, isolation entre sites, remplacement sans reste de l'ancien modèle, recherche présente.
- `tests/theme-builder-catalogue.test.js`, `theme-builder-catalogue-public.test.js` : catalogue de tous les types.
- `scripts/verification-visuelle-404.js` : mesure dans Chrome, pour les 100 modèles à 1280 / 820 / 390 px, le débordement horizontal et les éléments hors écran, et produit une capture par modèle et par largeur ; rapport JSON.

## Limites connues
- Pas d'illustrations ni de photos : le catalogue ne contient aucune image factice.
- Les widgets dynamiques (articles, formations, catégories) affichent un message « apparaîtront ici » tant que le site n'a pas de contenu.
- Le widget de recherche cible le blog ou le catalogue selon le modèle ; il ne propose pas encore de recherche sur tout le site.
- Elementor Pro n'a pas pu être observé directement : voir `elementor-404-reference.md`.

## Ajouter ou modifier un modèle
1. Ajouter un contenu dans `ARCHETYPES` (titre, texte, actions, `extras(k)`, `side(k)`) : il produit 5 modèles automatiquement.
2. Ajouter un traitement dans `TREATMENTS` : il produit 20 modèles ; garder 100 au total (le test impose exactement 100).
3. Lancer `node --test tests/theme-builder-404-bibliotheque.test.js tests/theme-builder-catalogue.test.js` puis `node scripts/verification-visuelle-404.js`.
