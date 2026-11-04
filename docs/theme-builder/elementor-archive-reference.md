# Référence Elementor — modèles d'archive

Document de référence établi **avant** la refonte de la catégorie Archive du Theme Builder de Kolakisa. Il sépare strictement ce qui est **confirmé** par une source officielle, ce qui est **observé**, ce qui est **non vérifiable**, et les **choix propres à Kolakisa**.

Sources officielles consultées (centre d'aide Elementor, texte lu le 4 novembre 2026) :

- Widget « Archive Posts » : <https://elementor.com/help/archive-posts-widget-pro/>
- « Create a category page using the Loop Grid or Loop Carousel » : <https://elementor.com/help/create-a-category-page-using-the-loop-grid-or-loop-carousel/>
- « Add a blog page to your website » : <https://elementor.com/help/add-a-blog-page-to-your-website/>
- Pour les conditions d'affichage : [`ELEMENTOR_DISPLAY_CONDITIONS.md`](./ELEMENTOR_DISPLAY_CONDITIONS.md) (déjà établi dans le dépôt).

## 1. Comportements confirmés (documentation officielle)

**Où vit un modèle d'archive.** Le widget Archive Posts affiche « une liste de tous les articles dans les modèles d'archive, créés dans Modèles › Theme Builder › Archive ».

**Widget Archive Posts — contenu et mise en page**

| Réglage Elementor | Valeurs documentées |
|---|---|
| Skin | Classique ou Cartes |
| Colonnes | de 1 à 6 |
| Position de l'image | haut / gauche / droite / aucune |
| Masonry | activé ou non |
| Résolution, ratio, largeur de l'image | réglables |
| Titre | afficher/masquer ; balise H1 à H6, div, span, p |
| Extrait | afficher/masquer ; longueur en mots ; l'extrait manuel prime sur la longueur |
| Métadonnées | auteur, date, heure, commentaires ; séparateur personnalisable |
| « Lire la suite » | afficher/masquer ; texte ; alignement automatique des boutons en bas de carte |
| Badge (skin Cartes) | taxonomie au choix (catégories, étiquettes…) |
| Avatar de l'auteur (skin Cartes) | afficher/masquer |

Si un article n'a pas d'extrait, Elementor en génère un à partir du contenu.

**Pagination.** Six modes : *Aucune*, *Numéros*, *Précédent/Suivant*, *Numéros + Précédent/Suivant*, *Charger au clic* (bouton), *Défilement infini*. Réglages associés : limite par page, libellés Précédent/Suivant, alignement, raccourcir l'affichage des numéros, texte du bouton et indicateur de chargement. Le nombre d'articles par page vient des réglages de lecture de WordPress.

**Plusieurs listes sur une page.** Par défaut, deux widgets Archive Posts passent ensemble à la même page ; l'option « Pagination individuelle » les rend indépendants (tous doivent avoir le même réglage).

**Message « Aucun résultat ».** Champ *Nothing Found Message*, texte libre ou étiquette dynamique.

**Style.** Écart entre colonnes et lignes, alignement du contenu ; pour le skin Cartes : couleur de fond, bordure (couleur, épaisseur, arrondi), marges internes, ombre, effet au survol ; espacement de l'image ; filtres CSS de l'image ; apparence du badge.

**Archives de taxonomie (catégorie, étiquette).** Les taxonomies sont considérées comme des archives. Les étiquettes dynamiques utilisables sont **Titre de l'archive**, **Description de l'archive** et **URL de l'archive**. Dans le titre, l'option « Inclure le contexte » retire le mot « Catégorie : ».

**Page de blog.** On compose une page avec une grille de boucle (Loop Grid) dont le modèle contient titre, image mise en avant et extrait. Un conteneur peut devenir un lien vers l'article, mais on ne peut pas imbriquer un lien dans un lien (un bouton « Lire la suite » ne peut donc pas coexister avec un conteneur cliquable).

**Conditions d'affichage (archives).** Auteur, date, résultats de recherche, archive des articles, catégories, enfant direct d'une catégorie, enfant quelconque d'une catégorie, étiquettes. Le modèle **le plus spécifique** l'emporte (détail dans `ELEMENTOR_DISPLAY_CONDITIONS.md`).

## 2. Comportements observés

Aucun comportement n'a été observé directement dans l'éditeur Elementor Pro : cette fonction est payante et aucun accès n'était disponible. Tout ce qui figure en section 1 vient donc de la documentation officielle, pas d'une manipulation de l'interface.

## 3. Non vérifiable (à ne pas considérer comme acquis)

- Le rendu visuel exact des skins « Classique » et « Cartes » (espacements par défaut, typographie).
- Le comportement précis de la requête « Current Query » dans une grille de boucle placée dans un modèle d'archive (évoqué par des discussions de forum, absent des pages d'aide lues).
- Le comportement exact du défilement infini (déclenchement, gestion du bouton retour du navigateur).
- Les archives de type de contenu personnalisé et les produits WooCommerce : décrits dans l'aide mais hors du périmètre testable ici.

## 4. Correspondance avec Kolakisa et choix d'implémentation

| Fonction Elementor | Équivalent Kolakisa | Écart assumé |
|---|---|---|
| Modèle d'archive (Theme Builder › Archive) | Type `archive` du Theme Builder | — |
| Widget Archive Posts / Loop Grid | Grille à boucle `loop` avec `archive: true` : suit l'archive affichée | Un seul mécanisme (la boucle) au lieu de deux widgets |
| Titre / description de l'archive | Widget `archiveinfo` (titre, description, nombre) | Ajoute le nombre d'articles |
| Colonnes 1 à 6 | `columns` de la grille, 1 à 4 dans la bibliothèque, tablette ≤ 2, mobile = 1 | Les modèles avec colonne latérale plafonnent à 2 |
| Pagination (6 modes) | `numbers`, `prevnext`, `both`, `more`, `infinite` (+ carrousel `slider`) | Pas de pagination individuelle : la page est portée par l'identifiant de la boucle (`lp-<id>`), donc chaque boucle est déjà indépendante |
| Message « Aucun résultat » | `loop.empty` | Toujours renseigné dans les modèles |
| Badge / métadonnées | Étiquettes `{{post.category}}`, `{{post.author}}`, `{{post.date}}` | — |
| Conditions d'affichage | Moteur de règles commun du Theme Builder (`conditions.js` : tout, blog, catégorie, étiquette, auteur, date, recherche) | La condition « date » est acceptée par le moteur, mais le site n'a **aucune page d'archive par date** (aucune route) : elle n'est jamais atteinte. Pas de type de contenu personnalisé. |
| Filtres / recherche | Widgets `catfilter`, `search`, boucle `urlFilter` (`?q=`, `?categorie=`) | — |
| Aperçu avec un contenu d'exemple | Archive de démonstration « Titre de l'archive (exemple) » | Sélection libre d'une vraie archive non disponible dans l'aperçu de la bibliothèque |

**Choix de Kolakisa.**

1. **Une seule source de vérité.** Vignette, aperçu et site publié sont produits par le même rendu (`themeRender`) à partir du même document du catalogue.
2. **Aucun contenu de démonstration sur le site publié.** Les exemples n'existent que dans l'aperçu de la bibliothèque et sont signalés « (exemple) ». Sur le site public, une archive sans résultat affiche l'état vide du modèle.
3. **Images : jamais factices.** Une image de carte vaut `{{post.image}}` ; sans image mise en avant, aucune image n'est affichée.
4. **Pas de position absolue.** Toute la mise en page repose sur Flexbox et Grid.
