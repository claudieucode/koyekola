# Bibliothèque d'archives produits du Theme Builder

Catégorie **Archives produits** (type `product_archive`) : 100 compositions distinctes (10 familles × 10 ; 20 par identité visuelle). Liste complète : `kolakisa-product-archive-library-modeles.md`. Audit initial : `kolakisa-product-archive-audit.md`. Référence Elementor / WooCommerce : `elementor-product-archive-reference.md`.

## 1. Périmètre fonctionnel

Une archive produits est la page d'un **catalogue** : boutique (`/boutique`), recherche (`/boutique/recherche`, `/boutique?q=`), catégorie (`/boutique/categorie/<adresse>`), étiquette (`/boutique/etiquette/<étiquette>`). Les 100 modèles restent des archives : titre d'archive, filtres, grille ou liste de produits, pagination. Ils ne contiennent ni fiche produit (`shopbuy`), ni page d'accueil, ni panier complet (le widget `shopcart` n'est qu'un ensemble de liens).

## 2. Différences Elementor / Kolakisa

Voir le tableau §6 de la référence. En bref : « Current Query » = source « Suit la page » de `shopgrid` ; « Allow Order » = réglage « Tri » de `shopfilters` ; « Show Result Count » = `archiveinfo` ; **pas de notes ni d'avis**, **pas de chargement progressif**, **pas de choix de variante dans la carte**, **pas de taxonomie personnalisée**.

## 3. Architecture des modèles

`src/themeBuilder/catalog/product_archive.js` exporte `{ type, kind: "page", flat: true, families, layouts }` (catalogue « plat » comme les en-têtes : chaque modèle est une composition propre qui fixe son identité visuelle ; `catalog/index.js` en fait une entrée par modèle, `layoutKey` = famille, `layoutId` = identifiant du modèle).

* Un modèle = `m(famille, identifiant, libellé, mots-clés, description, (k) => [sections])`. L'identité est attribuée par `pick` : deux modèles par identité et par famille.
* `k` est le kit de `catalog/kit.js` (couleurs = jetons du site ; seule l'identité « Nuit » pose des teintes propres).
* Briques de `product_archive.js` : `head` (titre d'archive), `grid` (grille), `rail` (rangée de mise en avant), `filt` (filtres), `search`, `cart`, `side`/`main`/`split` (colonnes), `bar`, `tinted` (bande teintée alt / accent / ink), `sec` (section centrée de largeur choisie).
* « Utiliser » (`catalog/use.js`) crée une **page** indépendante (`createPage`) + un modèle du Theme Builder en brouillon. Modifier la copie ne touche jamais le catalogue ni un autre site.

## 4. Éléments utilisés et sources de données

| Élément | Source | Réglages notables |
|---|---|---|
| `archiveinfo` | scope d'archive posé par `shopPublic.listing` (titre = catégorie / étiquette / recherche / « Boutique », nombre de résultats = total filtré) | description, compteur |
| `shopgrid` | `catalog.catalogQuery` du **site** de la page (jamais un autre site) | source `archive` ; `columns` 1-5 ; `layout` grille / liste ; `ratio` 1/1, 4/5, 3/4, 2/3, 4/3, 16/9 ; `cardStyle` encadrée / sans cadre / fond doux ; pastille promo / rupture ; catégorie ; description ; ajout au panier ; `paginate` ; `onlySale` / `onlyFeatured` / `ignoreFilters` (rangées de mise en avant) |
| `shopfilters` | catégories du site ; critères de l'adresse | catégorie, prix, stock, promotion, tri ; `direction` ligne / colonne ; lien « Effacer les filtres » ; les critères non affichés sont conservés (champs cachés) |
| `shopsearch` | `GET /boutique/recherche` | texte d'aide, bouton |
| `shopcart` | `GET /boutique/panier.json` (nombre d'articles réel) | liens panier, commande, compte |

## 5. Prix, promotions, stocks

Calculés par le moteur (`hydrate` / `catalogQuery`) : prix effectif d'un produit simple (promotion datée comprise), « à partir de » pour un produit à variantes (minimum des variantes actives), prix barré = prix normal, rupture = stock géré à 0 (variantes : aucune active en stock). La grille n'invente rien : elle formate. L'ajout au panier passe par `POST /boutique/panier/ajouter` qui **recalcule prix, stock et quantité côté serveur** et refuse un produit épuisé.

## 6. Filtres, tri, pagination

* Critères lus par la grille « Suit la page » : `categorie`, `q`, `etiquette`, `min`, `max` (en euros), `stock=1`, `promo=1`, `vedette=1`, `tri` (`newest`, `featured`, `price_asc`, `price_desc`, `name`), `page`. Tous revalidés par `catalogQuery` (valeurs inconnues ignorées ; page bornée à 500 ; chaînes tronquées).
* La route `listing` transmet au modèle **tous** ces critères : la grille, les filtres et le compteur lisent le même contexte.
* Pagination : liens relatifs `?critères&page=N`, Précédent / Suivant, numéros avec ellipses ; seulement si la grille est paginée **et** qu'il y a plus d'une page.
* Rangées de mise en avant (promotions, vedettes, nouveautés) : `ignoreFilters` — elles suivent la catégorie / la recherche de la page mais pas les filtres, le tri ni la page du visiteur ; message de repli explicite.

## 7. Responsive

Tout est en flex / grille avec retour à la ligne ; aucune position absolue dans un modèle. Grille : `--kw-pg-cols` ; 2 colonnes sous 900 px ; liste : 1 colonne, image à gauche réduite sous 520 px. Colonnes latérales : `flex-basis` 260 px, 100 % sous le point de rupture mobile. Collant : `position: sticky` + `top` (colonnes de filtres, barres de filtres / de recherche).

## 8. Règles d'affichage, sauvegarde et publication

Identiques aux autres types (`conditions.js`, `match.js`) : conditions « Archives de produits » (toutes, boutique, catégorie, étiquette — `render.js` pose maintenant `kind: "tag"` pour `/boutique/etiquette/…`), priorité au plus précis, exclusions, un modèle d'un autre site ne s'applique jamais, remplacement explicite à la publication d'un modèle de mêmes conditions.

## 9. Aperçu de la bibliothèque et états de démonstration

L'aperçu (`.../api/bibliotheque/product_archive/<clé>/apercu`) et la vignette posent `page.demoShop` : **36 produits d'exemple** (promotions, ruptures, produits à variantes, produits sans image) et 3 catégories d'exemple, annoncés par un bandeau dans l'aperçu. Ce mode n'est posé que par `themeRender.previewDoc` pour la bibliothèque ; un modèle copié sur un site n'affiche **jamais** de produit d'exemple (boutique fermée : rien au public, message dans l'éditeur ; boutique vide : message de l'élément). Les états sont testés : plusieurs produits, un seul, aucun, promotion, rupture, variantes, sans image, plusieurs pages.

## 10. Tests

`tests/theme-builder-archives-produits-bibliotheque.test.js` (catalogue, utilisation / isolation, moteur, rendu par le vrai serveur, `/boutique` publiée) ; `tests/theme-builder-catalogue-public.test.js` et `tests/programme20-5-boutique-builder.test.js` (existants). Contrôle visuel : `scripts/audit-archives-produits.js` (voir `kolakisa-product-archive-library-verification.md`).

## 11. Limites connues

Voir §3 de l'audit. En plus : l'aperçu ne montre jamais d'image de produit (les produits d'exemple n'en ont pas) ; le menu mobile de l'en-tête n'est pas concerné ; seule la grille « Suit la page » est paginée.

## 12. Maintenance : ajouter ou modifier un modèle

1. Ajouter une ligne `m("<famille>", "<identifiant-ascii>", "Libellé", [mots-clés], "Description", (k) => [...])` dans `layouts` (l'identité est attribuée par `pick` ; garder 10 modèles par famille et 20 par identité — le test le vérifie).
2. Combiner les briques existantes ; un nouvel élément doit exister dans le moteur (jamais de contrôle décoratif).
3. L'identifiant doit rester unique et ne jamais reprendre une ancienne clé (`filtres-gauche`, `grille-4`, …).
4. Régénérer la liste (`kolakisa-product-archive-library-modeles.md`) et lancer `node --test tests/theme-builder-archives-produits-bibliotheque.test.js` puis `node scripts/audit-archives-produits.js <dossier>`.
