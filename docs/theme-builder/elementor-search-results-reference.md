# Référence Elementor — Résultats de recherche (Theme Builder)

Établie le 2026-11-04 à partir de la documentation officielle et du blog officiel d'Elementor. Les pages d'aide sont très longues (menu inclus) : le corps des articles n'a été lu qu'en lisant la suite de la page (décalage de 100 000 caractères). Les pages `elementor.com/help/search-results-site-part/` et `elementor.com/help/archive-posts-widget/` n'ont renvoyé aucun contenu utile (menu seulement). Elementor Pro n'était pas installé : aucune observation de l'interface réelle n'a été faite. Les extractions ont été faites par un outil de résumé automatique : à recouper avec la page d'origine avant toute citation littérale.

## 1. Comportements confirmés (sources officielles)

| Sujet | Comportement | Source |
|---|---|---|
| Création | WP Admin → Templates → Theme Builder → **Archive** → **Search Results** (ou modifier le modèle existant) → *Add New*. La bibliothèque s'ouvre : insérer un modèle prêt, générer des variantes IA, ou la fermer pour partir de zéro ; l'éditeur s'ouvre ensuite. | <https://elementor.com/help/customize-the-search-results-archive/> |
| Réservé à Pro | Le Theme Builder fait partie d'Elementor Pro. | <https://elementor.com/blog/how-to-search-for-words-on-a-website/> (résultat de recherche officiel) |
| Aperçu | Icône *Settings* de la barre du haut → **Preview Settings** → champ **Search Term** : saisir un mot présent dans au moins un contenu, puis *Apply & Preview*. | <https://elementor.com/help/customize-the-search-results-archive/> |
| Aperçu « aucun résultat » | Saisir un terme absent du site puis *Apply and Preview* pour voir l'état vide. | <https://elementor.com/help/customize-the-search-results-archive/> |
| Publication et condition | *Publish* → condition **Include** + **Search Results** → *Save & Close*. | <https://elementor.com/help/customize-the-search-results-archive/> |
| Structure conseillée | (1) titre dynamique contenant la requête, ex. « Showing results for: [search query] » ; (2) widget **Archive Posts** pour les contenus correspondants ; (3) mise en page en grille/colonnes avec image mise en avant, titre, extrait, lien « Read More » ; (4) message « aucun résultat » utile (exemple : « Sorry, we couldn't find any results. Please try another search ») avec un nouveau champ de recherche. | <https://elementor.com/blog/how-to-search-for-words-on-a-website/> |
| Portée du modèle | Le modèle définit la mise en page et le style de **chaque** recherche du site. | <https://elementor.com/blog/how-to-search-for-words-on-a-website/> |
| Conseils généraux | Barre de recherche là où l'on l'attend (en-tête), icône loupe et texte indicatif clairs, conception mobile d'abord (cible facile à toucher, plein écran correct sur téléphone). | <https://elementor.com/blog/how-to-search-for-words-on-a-website/> |
| Widget Search Form | Skins **Classic** (champ + bouton), **Minimal** (champ seul), **Full Screen** (bouton qui ouvre une recherche plein écran) ; réglages : placeholder, type de bouton (icône ou texte) et taille, alignement/taille du bouton plein écran. Depuis Elementor 3.24, il est remplacé par le widget **Search** ; les anciens Search Form restent utilisables et modifiables. | <https://elementor.com/help/search-form-widget/> |
| Widget Search (3.24+) | Placeholder, icône, **Autocomplete**, icône d'effacement, déclencheur d'envoi (bouton, Entrée ou les deux). Option **Live Results** (résultats pendant la saisie) : exige un modèle **Loop Item** créé dans le Theme Builder. Source limitable : Products, Posts, Pages, Landing Pages, Floating Buttons ; options Include/Exclude, Date, Order By, Order, Posts Per Page, Query ID. L'article dit qu'un modèle **Search Results** est nécessaire pour utiliser le widget. Aucun message « aucun résultat » mentionné. | <https://elementor.com/help/search-widget/> |
| Archive Posts — mise en page | Skins **Classic** ou **Cards** ; colonnes 1 à 6 ; **Masonry** on/off ; position, résolution, ratio et largeur de l'image (haut, gauche, droite, aucune) ; titre et balise HTML ; extrait et longueur ; métadonnées et séparateur ; *Read More* et texte ; alignement automatique des boutons ; badge, taxonomie du badge et avatar (Cards). | <https://elementor.com/help/archive-posts-widget-pro/> |
| Archive Posts — pagination | None, Numbers, Previous/Next, Numbers + Previous/Next, Load On Click, Infinite Scroll ; *Individual Pagination* (bascule) ; **Page limit** disponible avec Numbers, Previous/Next et Numbers + Previous/Next ; le nombre d'articles par page vient autrement des réglages de lecture WordPress. | <https://elementor.com/help/archive-posts-widget-pro/> |
| Archive Posts — aucun résultat | Champ **Nothing Found Message** (onglet Advanced) : texte libre ou balise dynamique ; style : couleur et typographie. | <https://elementor.com/help/archive-posts-widget-pro/> |
| Loop Grid — requête | Source : **Current Query** (pour les modèles appliqués à plusieurs catégories/étiquettes), Posts, Pages, Landing pages, pages choisies à la main, Related items ; Include/Exclude, Include By/Exclude By ; **Order By** et **Order** (asc/desc) ; Ignore Sticky Posts. | <https://elementor.com/help/loop-grid/> |
| Loop Grid — mise en page | Colonnes, Items Per Page, Masonry, Equal height, modèle alternatif pour une partie de la boucle ; écarts entre colonnes et entre lignes (onglet Style). | <https://elementor.com/help/loop-grid/> |
| Loop Grid — pagination | Numbers, Previous/Next, Numbers + Previous/Next, Load on Click, Infinite Scroll ; Page Limit ; Shorten (limite le nombre de numéros) ; alignement ; type de chargement **Page Reload** ou **AJAX** ; Individual Pagination ; styles (typographie, couleurs Normal/Hover/Active, espacements). | <https://elementor.com/help/loop-grid/> |
| Loop Grid — aucun résultat | Bascule « Nothing Found Message » : texte, alignement, balise (H1–H6, Div, Span) ; style : espacements haut/bas, typographie, couleur, ombre, contour. | <https://elementor.com/help/loop-grid/> |
| Filtre par taxonomie | Un widget distinct **Taxonomy Filter** existe (l'article Loop Grid y renvoie sans détailler ses réglages). | <https://elementor.com/help/loop-grid/> |
| Tri | Le **Loop Grid** propose Order By / Order. L'article Archive Posts lu ne liste ni tri ni contrôle de requête. Aucune source lue ne mentionne un tri proposé au visiteur dans un widget natif. | <https://elementor.com/help/loop-grid/>, <https://elementor.com/help/archive-posts-widget-pro/> |
| Responsive (Loop Grid) | L'article ne décrit pas de contrôle responsive propre ; il renvoie à un article séparé sur l'édition responsive. | <https://elementor.com/help/loop-grid/> |
| Forum (ancien, ~5 ans) | Un utilisateur disait que l'état « not found » restait vide ; un membre de l'équipe répondait que le modèle Search Results permet de contrôler ce message ; un autre contestait (PHP nécessaire). Source non officielle de documentation, datée : à tester sur la version installée. | <https://forum.elementor.com/development-24/custom-search-page-8481> |

## 2. Comportements observés

Aucun : pas d'accès à une installation Elementor Pro pendant ce travail.

## 3. Non vérifiables

- Texte exact par défaut du titre d'archive pour la recherche (« Search Results for : … ») et nom exact de la balise dynamique du terme recherché : seule la formule « [search query] » du blog est citée.
- Réglage « Current Query » dans le widget Archive Posts (la source Current Query est confirmée pour Loop Grid seulement).
- Disponibilité d'un nombre de résultats (« N résultats ») via une balise dynamique.
- Valeurs de colonnes par point de rupture, masquage par appareil (« Hide On ») : non lus dans les pages obtenues.
- Contenu de « Preview Dynamic Content as » (seul « Preview Settings → Search Term » est confirmé).
- Priorités entre plusieurs modèles de recherche, condition Exclude pour ce modèle.
- Réglages du widget Taxonomy Filter ; plugins tiers de filtre/tri (le blog Toolset a été listé par la recherche mais non lu).
- Comportement exact du widget Post Info / Featured Image / Post Excerpt dans ce modèle (non lu).
- Pages d'aide `search-results-site-part` et `archive-posts-widget` : sans contenu exploitable.

## 4. Choix spécifiques à Kolakisa

| Elementor | Kolakisa |
|---|---|
| Modèle Archive → Search Results, condition Include « Search Results ». | Type de modèle recherche du Theme Builder, mêmes règles de résolution que les autres types ; le plus précis gagne. |
| Titre dynamique avec la requête. | Widget natif `archiveinfo` (affiche le contexte : terme recherché). |
| Search Form / Search. | Widget natif `search` (cible blog ou catalogue). Pas de résultats en direct ni d'autocomplétion présentés comme équivalents. |
| Archive Posts / Loop Grid. | Boucle `grid` avec props loop `{source: posts\|products\|courses, urlFilter, count, paginate, pagination: numbers\|more, empty}`. |
| Aucun résultat (Nothing Found Message). | Prop `empty` de la boucle. |
| Pagination (numbers, prev/next, load more, infinite scroll, page limit). | Seulement `numbers` ou `more` ; pas de prev/next, ni défilement infini, ni limite de pages dédiée. |
| Posts widget. | `querylist` pour des listes d'articles. |
| Taxonomy Filter. | Widget `catfilter` (catégories). |
| Tri et filtres combinés. | Aucun tri visiteur ni filtre combiné sur la recherche, hormis les catégories. |
| Aperçu « Search Term ». | Non décrit ici ; ne pas supposer d'équivalent. |

## 5. Recommandations de conception d'une page de résultats

Fondées sur le blog officiel (titre avec requête, grille, message utile, nouveau champ, mobile) ; le reste est du jugement de conception, non une affirmation d'Elementor.

- Terme recherché visible dans le titre (« Résultats pour : … »).
- Nombre de résultats affiché si le moteur le permet.
- Champ de recherche présent et pré-rempli avec le terme, pour reformuler vite.
- État vide utile : phrase claire, nouveau champ de recherche, liens vers catégories ou contenus récents.
- Résultats lisibles : image, titre, extrait court, date/catégorie ; même gabarit pour tous.
- Pagination simple (numéros ou « Charger plus ») ; éviter une page infinie sans repère.
- Mobile : une colonne, champ pleine largeur, cibles tactiles confortables, aucun débordement.
- Filtres : uniquement par catégorie (seul filtre disponible dans Kolakisa) ; ne pas promettre de tri.

Sources : <https://elementor.com/help/customize-the-search-results-archive/>, <https://elementor.com/help/search-form-widget/>, <https://elementor.com/help/search-widget/>, <https://elementor.com/help/archive-posts-widget-pro/>, <https://elementor.com/help/loop-grid/>, <https://elementor.com/blog/how-to-search-for-words-on-a-website/>, <https://forum.elementor.com/development-24/custom-search-page-8481>.
