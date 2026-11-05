# Audit — archives produits du Theme Builder (avant la refonte)

Réalisé avant toute modification, sur le dépôt `claudieucode/koyekola` (novembre 2026). Référence Elementor : `elementor-product-archive-reference.md`.

## 1. Ce qui existait

| Élément | État constaté |
|---|---|
| Catalogue (`src/themeBuilder/catalog/product_archive.js`) | 20 mises en page × 5 identités visuelles = « 100 modèles » ; **20 compositions réelles** seulement, répétées en 5 couleurs |
| Aucune ligne en base | Le catalogue est du code : les sites ne reçoivent une copie qu'à « Utiliser » (`catalog/use.js`). Aucune migration destructive n'est donc nécessaire : remplacer le catalogue ne touche aucun modèle déjà utilisé |
| Éléments disponibles | `archiveinfo`, `shopgrid`, `shopfilters`, `shopsearch`, `shopcart` (`src/marketing/pages/widgets/shop.js`), branchés sur `src/marketing/shop/catalog.js` |
| Rendu public | `src/marketing/web/shopPublic.js` : `/boutique`, `/boutique/recherche`, `/boutique/categorie/:slug` ; le modèle est choisi par `themeRender.renderRegion` (conditions du Theme Builder, isolation par site) |
| Moteur de requête | `catalogQuery` : recherche, catégorie (descendants compris), étiquette, mis en avant, stock, promotion (dates comprises), prix min/max, tri, pagination — exécutés par la base |

## 2. Défauts constatés

| # | Défaut | Gravité | Cause |
|---|---|---|---|
| 1 | **Les filtres d'un modèle ne filtraient rien** : le formulaire envoie `min`, `max`, `stock`, `promo`, `tri` ; la grille d'un modèle ne lisait que `categorie` et `q`, et la route ne transmettait que ces deux critères au modèle | Critique (contrôle décoratif) | `shopgrid.data` + `shopPublic.listing` |
| 2 | **Pas de pagination** : la grille plafonnait à `count` produits (24 au plus) et ignorait `page` ; un catalogue de plus de 24 produits était tronqué sans issue | Critique | `shopgrid` : `page: 1` fixe |
| 3 | Le compteur « N résultats » (`archiveinfo`) comptait avec les filtres de la page alors que la grille n'en appliquait aucun : **chiffre faux** | Majeur | idem |
| 4 | Aucune pastille de promotion, aucun ajout au panier dans la carte, aucun format d'image, aucune liste : tous les modèles se ressemblaient | Majeur | `shopgrid` sans réglages |
| 5 | Filtres : submit vers `/boutique` ; un tri seul sur une page de catégorie **perdait la catégorie** | Majeur | aucun champ caché |
| 6 | Pas d'archive d'étiquette (`/boutique/etiquette/…`) alors que la condition « étiquette » existe pour les archives produits | Mineur | route absente, `render.js` ne posait jamais `kind: "tag"` |
| 7 | Aperçu de la bibliothèque : site de test sans boutique ouverte → **aperçu et vignette vides** | Majeur | `shopOf` renvoie « fermée » |
| 8 | Bouton primaire sur l'identité « marque » (fond = couleur primaire) : invisible | Mineur | boutons des widgets boutique en `--kw-primary` |
| 9 | Régression découverte en chemin (hors périmètre produit) : la fusion de la branche « Page 404 » avait écrasé deux corrections de `catalog/index.js` (« Utiliser » un **en-tête** plantait) | Critique | corrigée et poussée séparément (`37cf9572`) |

## 3. Ce que le moteur ne sait pas faire (limites, non simulées)

* **Notes et avis** : aucune table d'avis ni de note de produit. Aucun modèle n'en affiche.
* **Chargement progressif** (« Load More ») : non géré ; pagination classique à la place.
* **Choix de variante dans la carte** : les produits à variantes renvoient vers la fiche (« Choisir les options »).
* **Attributs comme filtre** (couleur, taille) : le moteur filtre catégorie, prix, stock, promotion, tri — pas les attributs de variante.
* **Taxonomies produit personnalisées** : le moteur n'a que catégories (hiérarchiques) et étiquettes.
* **Condition « recherche »** des archives produits : une recherche sur `/boutique?q=` reste une archive « boutique » pour le choix du modèle.
