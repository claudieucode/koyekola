# Référence Elementor — Page 404 (Theme Builder)

Établie le 2026-11-03 à partir de la documentation officielle et du blog officiel d'Elementor. Les pages d'aide complètes (`elementor.com/help/error-404-site-part/`, `/help/conditions/`) n'ont renvoyé que leur titre et leur menu lors de l'extraction automatique : ce qui en dépend est classé « non vérifiable ». Elementor Pro n'était pas installé : aucune observation de l'interface réelle n'a été faite.

## 1. Comportements confirmés (sources officielles)

| Sujet | Comportement | Source |
|---|---|---|
| Création | Templates → Theme Builder → *Add New* ; type **Single**, type de contenu **404 Page** (aussi appelé « Error 404 ») ; réservé à Elementor Pro. | blog `create-custom-wordpress-404-page`, aide `error-404-site-part` |
| Nom | Ne pas nommer le modèle « 404 » (conflit avec les permaliens WordPress) ; utiliser par ex. « Page d'erreur ». | blog |
| Point de départ | Choisir un modèle prédéfini à personnaliser, ou fermer la bibliothèque et partir de zéro. | blog |
| Édition | Éditeur visuel standard et widgets habituels. | blog |
| Publication | Bouton *Publish* ; une fenêtre propose les conditions d'affichage, **« Include: 404 Page »** par défaut ; *Save & Close*. | blog, aide |
| Conditions | Modifiables après coup via la flèche à côté de *Publish* → *Display Conditions*. Si le modèle ne s'affiche pas, vérifier cette condition. | blog, aide |
| État | Point vert = modèle publié, point gris = brouillon. | aide |
| Test | Ouvrir une adresse inexistante (`monsite.com/xyz123`). | blog |
| Widgets cités | **Heading** (message), **Search Form** (sous le titre), **Posts** (3 derniers articles), **Media Carousel** (section ludique), grille de produits recommandés (e-commerce). | blog |
| Mise en page citée | Une section à une colonne, hauteur minimale 100vh, contenu centré. | blog |
| Recommandations | Message clair sans jargon, champ de recherche, un appel à l'action principal, liens vers les contenus clés ou navigation du site conservée, contenu récent, navigation contextuelle (catégorie ou produit proche plutôt que l'accueil), marque / humour acceptés, illustrations légères (SVG < 50 Ko), pas de vidéo en fond, chargement < 2 s. | blog |
| Responsive | Contrôler le point de rupture mobile dans l'éditeur avant de publier ; le champ de recherche ne doit pas être écrasé sur petit écran. | blog |

## 2. Comportements observés

Aucun : pas d'accès à une installation Elementor Pro pendant ce travail.

## 3. Non vérifiables

- Liste complète des conditions (Include / Exclude, priorités entre modèles).
- Existence et contenu exact de la bibliothèque de modèles 404 prédéfinis.
- Valeurs exactes des contrôles (typographie, marges, responsive) par widget.
- Mécanisme d'aperçu autre que l'éditeur lui-même.

## 4. Choix d'implémentation propres à Kolakisa

| Elementor | Kolakisa |
|---|---|
| Une condition « 404 Page » unique, ajoutée à la publication. | Type `not_found` du Theme Builder, vue `not_found` ; mêmes règles de résolution que les autres types (`src/themeBuilder/conditions.js`, `resolve.js`) ; plusieurs modèles publiés possibles, le plus précis gagne. |
| Modèle créé dans le site. | « Utiliser ce modèle » crée une **copie indépendante** dans le site (page du Page Builder) ; modifier la copie ne touche jamais le catalogue. |
| Widget Search Form. | Widget natif `search` (cible blog ou catalogue). |
| Widget Posts. | Widgets natifs `posts` et `querylist` (articles récents ou populaires, catégories). |
| Navigation du site. | Widget natif `menu` (emplacement du CMS) — aucun lien factice. |
| Illustrations. | Aucune image factice dans le catalogue : l'effet visuel vient de la typographie (grand « 404 »), des filets, des cartes et des bandeaux de couleur. |
| Bibliothèque de modèles. | 100 modèles : 20 contenus (archétypes) × 5 traitements de mise en page **structurellement différents** (centré, scindé, éditorial à gauche, bandeau pleine largeur, carte), chacun avec une identité visuelle (skin) propre. |

Sources : <https://elementor.com/help/error-404-site-part/>, <https://elementor.com/help/conditions/>, <https://elementor.com/blog/custom-404-page-wordpress/>, <https://elementor.com/blog/create-custom-wordpress-404-page/>.
