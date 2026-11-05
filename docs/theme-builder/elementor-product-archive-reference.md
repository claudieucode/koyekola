# Référence Elementor / WooCommerce — Archives de produits

Établie **avant** la reconstruction de la catégorie « Archives produits » du Theme Builder de Kolakisa. Complète `ELEMENTOR_WOOCOMMERCE.md` (matrice EL-WC022 à EL-WC030), `ELEMENTOR_DISPLAY_CONDITIONS.md` et `ELEMENTOR_TEMPLATE_LIFECYCLE.md`.

Légende : **[C]** confirmé par une page officielle lue pour ce document · **[O]** observé dans l'interface réelle · **[N]** non vérifiable ici · **[K]** choix propre à Kolakisa.

> Aucune interface Elementor réelle n'a pu être ouverte : **aucun point n'est marqué [O]**. Les pages d'aide Elementor sont servies avec leur menu de navigation en tête ; le corps des articles n'est lisible que par lecture décalée (les contrôles ci-dessous viennent de cette lecture). Ce qui n'a pas pu être lu est marqué [N], jamais supposé.

## 1. Sources

| Page | Adresse | Lecture |
|---|---|---|
| Widget Archive Products (style et mise en page) | https://elementor.com/help/woocommerce-archive-products-pro/ | corps lu (contrôles de contenu et de style) |
| Widget Products | https://elementor.com/help/woocommerce-products-pro/ | corps lu (requête, colonnes, éléments de carte, style) |
| Créer des archives de produits WooCommerce | https://elementor.com/help/?p=399 | seule la fin (référence des réglages) lue ; étapes de création **non lues** |
| Archive Title / Archive Description | https://elementor.com/help/woocommerce-archive-title-pro/ | titre et métadonnées seulement |
| Category page avec Loop Grid | https://elementor.com/help/create-a-category-page-using-the-loop-grid-or-loop-carousel/ | titre seulement |
| Conditions d'affichage | `ELEMENTOR_DISPLAY_CONDITIONS.md` (même dossier) | document existant |

La page WooCommerce « Product archive and shop page » (woocommerce.com/document/…) a répondu **404** : le comportement WooCommerce cité plus bas vient des pages Elementor et des constats [K] ; il n'est pas sourcé WooCommerce.

## 2. Modèle d'archive de produits

* **[C]** WooCommerce doit être installé pour utiliser ces fonctions (mention répétée sur chaque page d'aide).
* **[C]** Les widgets d'archive existent en trois familles : *Archive Title*, *Archive Description*, *Archive Products*.
* **[N]** Étapes exactes de création, ordre des écrans de condition à la publication : non lues. Le cycle de vie général (carte du Theme Builder, « Publish » puis conditions) est documenté dans `ELEMENTOR_TEMPLATE_LIFECYCLE.md`.
* **[N]** Types d'archives couverts par les conditions (boutique, catégorie, étiquette, taxonomie personnalisée) : voir `ELEMENTOR_DISPLAY_CONDITIONS.md` ; non relus.

## 3. Widget Archive Products — contrôles confirmés [C]

| Zone | Contrôles |
|---|---|
| Contenu | **Allow Order** (tri proposé au visiteur) · **Show Result Count** (nombre de résultats) |
| Avancé | **Nothing Found Message** (texte, étiquette dynamique permise) |
| Style · Products | Columns Gap · Rows Gap · Alignment |
| Style · Image | Border Type · Border Radius · Spacing |
| Style · Title / Price / Regular price | Color · Typography (+ Spacing pour le titre) |
| Style · Rating | Star Color · Empty Star Color · Star Size · Spacing |
| Style · Button (normal/survol) | Text/Background/Border Color · Typography · Border Type/Radius · Text Padding · Spacing · **Automatically Align Buttons** (boutons alignés en bas de carte quand les titres passent à la ligne) |
| Style · View Cart | Color · Typography |
| Style · Box (normal/survol) | Border Width/Radius · Padding · Box Shadow · Background/Border Color |
| Style · Pagination | Spacing · Border · Border Color · Padding ; états normal/survol/actif : Typography · Color · Background Color |
| Style · Sale Flash | afficher/masquer · Text/Background Color · Typography · Border Radius · Width · Height · Position · Distance |
| Style · Nothing Found Message | Color · Typography |

**[C]** Le style du widget est souvent influencé par le thème et les extensions.
**[C]** Pas de contrôle « nombre de colonnes » dans cette page : il est dans le widget *Products* (ci-dessous) ou provient du thème (confirmé par des fils de support tiers : la colonne du thème peut l'emporter).

## 4. Widget Products — requête et cartes [C]

* **Colonnes** : 1 à 12. **Rows** : plafond de lignes affichées. **Pagination** : oui/non. **Allow Order** : tri par défaut, popularité, note, nouveauté, prix. **Show Result Count**.
* **Query › Source** : Current Query (la requête de la page, donc le contexte d'archive), Latest Products, Sale, Featured, Manual Selection, Related, Upsells, Cross-Sells. **Include / Exclude** par terme, sélection manuelle ou publication courante ; Order By + Order.
* **Éléments d'une carte** : image · titre · étoiles de note · prix et prix barré · bouton d'ajout au panier · lien « View Cart » · conteneur (Box) · badge promo (Sale Flash).

## 5. Ce que la référence ne dit pas [N]

* Le chargement progressif (« Load More ») sur archive WooCommerce : non présent dans les pages lues ; il relève du *Loop Grid* (autre widget, corps non lu).
* La sélection de variations directement dans la carte : non décrite ; le bouton d'une carte de produit variable mène normalement à la fiche (comportement WooCommerce, non sourcé ici).
* Filtres latéraux (catégorie, prix, attributs) : absents du widget Archive Products ; ce sont des widgets/extensions distincts.
* Hiérarchie des conditions et priorités : voir `ELEMENTOR_DISPLAY_CONDITIONS.md`.

## 6. Différences et choix Kolakisa

| Sujet | Elementor | Kolakisa |
|---|---|---|
| Source des produits | « Current Query » | **[K]** widget `shopgrid`, source « Suit la page » (`archive`) : catégorie, recherche, étiquette, filtres, tri et page de l'adresse |
| Tri visiteur | Allow Order | **[K]** widget `shopfilters` (réglage « Tri »), appliqué par le serveur |
| Compteur de résultats | Show Result Count | **[K]** widget `archiveinfo` (« afficher le nombre de résultats ») : total **de l'archive filtrée** |
| Pagination | Switch Pagination | **[K]** réglage « Pagination » de `shopgrid` (liens Précédent / pages / Suivant) ; pas de chargement progressif |
| Étoiles de note | Rating | **[K]** **absent** : le moteur de boutique n'a ni avis ni notes. Aucun modèle n'affiche de note |
| Ajout au panier | Add to cart (AJAX) | **[K]** bouton dans la carte pour les produits simples en stock ; « Choisir les options » (lien vers la fiche) pour les produits à variantes ; envoi vers le vrai panier |
| Badge promo | Sale Flash | **[K]** pastille « Promo » dans la carte, calculée par le moteur (dates de promotion comprises) |
| Rupture de stock | libellé WooCommerce | **[K]** pastille « Rupture de stock », pas de bouton d'achat |
| Archive vide | Nothing Found Message | **[K]** réglage « Message s'il n'y a aucun produit » |
| Taxonomies personnalisées | selon plugins | **[K]** non prises en charge : le moteur n'a que catégories (hiérarchiques) et étiquettes |
| Bibliothèque | modèles Elementor propriétaires | **[K]** catalogue en code, copie indépendante à l'utilisation |
