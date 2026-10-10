# Inventaire des widgets de l'éditeur de pages KOYEKOLA

*Établi par un banc d'essai dans un vrai Chrome (`scripts/audit-widgets.js`) : chaque type du registre est inséré, enregistré, rendu dans le canevas, publié et lu sur la page publiée. Un widget n'est « opérationnel » que si ce parcours réussit.*

## Architecture (vérifiée, pas supposée)

* JavaScript sans framework : serveur Express + gabarits EJS ; éditeur dans `public/js/page-builder.js`.
* **Registre central** : `src/marketing/pages/nodes.js` (`NODE_TYPES`, `WIDGETS` = catégorie + mots-clés, `WIDGET_DESCRIPTIONS`, `editorSpec()` envoyé à l'éditeur).
* **Widgets personnalisés** (extensible sans toucher au moteur) : `src/marketing/pages/widgets/*.js` + gabarit `views/marketing-public/widgets/<type>.ejs` + styles `landing.css`. Mode d'emploi : `docs/widgets-personnalises.md`.
* Un seul modèle de données (arbre d'éléments `{id, type, props, children…}`), un seul rendu publié (`_node.ejs`), le même pour le canevas. Styles par écran (ordinateur / tablette / mobile), états, animations, interactions, visibilité, programmation : communs à tous les éléments.
* Bibliothèque : catégories repliables, recherche (nom, mots-clés), favoris, récents, cadenas de permission, **infobulle de description pour chaque widget**.

## État des widgets existants (avant ce chantier)

| Résultat du banc d'essai | Widgets |
|---|---|
| Opérationnels de bout en bout (enregistrement → canevas → publication → page publiée) | **66 sur 77** |
| Corrects mais **visibles seulement dans le contexte d'un article** (rien à afficher sur une page ordinaire, par conception) | contenu de l'article, sommaire, catégories/étiquettes, précédent/suivant, boîte auteur, commentaires, menu du CMS (7) |
| Demandent un contenu réel à l'insertion (formulaire publié, formation du catalogue) : vérifiés dans les tests dédiés du module | formulaire, formation, bouton d'achat, avis de formation (4) |
| Erreurs de script à l'insertion | aucune |

## Référence Elementor → équivalent KOYEKOLA

Légende : ✅ présent · ➕ ajouté dans ce chantier · 🔁 couvert sous un autre nom · ⏳ en attente d'une dépendance · ⛔ non applicable (raison donnée).

| Famille | Widget de référence | KOYEKOLA | Statut |
|---|---|---|---|
| Structure | Container, Grid, Spacer, Divider, Menu Anchor | conteneur, grille, espace, séparateur, ancre de menu | ✅ |
| | Template | composants réutilisables + modèles de l'équipe | 🔁 |
| | Off-Canvas | fenêtre (modale) : s'ouvre au clic, pas en panneau latéral | partiel |
| Texte | Heading, Text Editor, Animated Headline, Blockquote | titre, texte, titre animé, citation | ✅ |
| | Read More | **Lire la suite** (`<details>` natif) | ➕ |
| | Text Path | **Texte sur un tracé** (SVG `<textPath>`) | ➕ |
| | Code Highlight | code avec **coloration** (JavaScript, JSON, HTML, CSS, shell, Python, SQL, PHP), calculée à l'affichage, sans script visiteur | ➕ |
| Médias | Image, Image Box, Gallery, Image Carousel, Video, Audio | image, boîte d'image, galerie, carrousel, vidéo, audio | ✅ |
| | Media Carousel | **Carrousel média** (images + YouTube/Vimeo) | ➕ |
| | Video Playlist | **Playlist YouTube** (raccourci de « Contenu intégré ») | ➕ |
| | SoundCloud | raccourci SoundCloud | ✅ |
| | Lottie | nécessite une bibliothèque externe (lottie-web) à héberger | ⏳ |
| Icônes | Icon, Icon Box, Icon List, Social Icons, Star Rating | icône, boîte d'icône, liste d'icônes, réseaux sociaux, évaluation | ✅ |
| Marketing | Button, Flip Box, Hotspot, Price List, Price Table, Countdown, Progress Bar, Progress Tracker | bouton, boîte retournable, points d'intérêt, liste de prix, offre tarifaire, compte à rebours, barre de progression, barre de lecture | ✅ |
| | Call to Action | section prête « Appel à l'action » | 🔁 |
| | Link in Bio | **Lien en bio** (liste de boutons, chaque lien compté) | ➕ |
| Interactions | Accordion, Toggle, Tabs, Alert, Tooltip, Modal | accordéon, bascule, onglets, alerte, infobulle, fenêtre | ✅ |
| | Slides | **Diaporama** | ➕ |
| | Testimonial Carousel | **Carrousel de témoignages** | ➕ |
| | Nested Tabs / Nested Carousel | onglets et carrousels à contenu simple (pas d'éléments imbriqués dans un onglet) | partiel |
| Témoignages | Testimonial, Reviews | témoignage, avis de la formation | ✅ |
| Réseaux sociaux | Share Buttons | boutons de partage | ✅ |
| | Facebook Page / Embed | **Page Facebook**, **Publication Facebook** (modules officiels, sans clé) | ➕ |
| | Instagram, TikTok | **Instagram**, **TikTok** (intégrations officielles) | ➕ |
| | Facebook Comments | exige le SDK JavaScript de Facebook (suivi tiers) : non fourni | ⛔ |
| | Facebook Button (J'aime) | **Bouton Facebook** (J'aime / Recommander / Partager, module officiel) | ➕ |
| Formulaires | Form, Search | formulaire d'inscription (module Formulaires), recherche | ✅ |
| | Login | « Compte du visiteur » (connexion réelle du site) | 🔁 |
| Contenu / blog | Posts, Loop Grid, Loop Carousel, Taxonomy Filter, Archive Posts/Title/Description, Post Title/Excerpt/Featured Image/Content/Info, Author Box, Comments, Navigation, TOC, Breadcrumbs, Sitemap | articles, liste dynamique (grille, carrousel, filtres), archives, raccourcis article, boîte auteur, commentaires, précédent/suivant, sommaire, fil d'Ariane, liste de pages | ✅ / 🔁 |
| Global | Site Logo, Site Title, Page Title, Menu, WP Menu | logo, titre du site, titre de la page, menu, menu du CMS | ✅ |
| E-commerce | Products, Archive Products, Product Title/Price/Images/Rating, Add to Cart, Menu Cart, My Account | liste de formations, formation, avis, bouton d'achat, mini-panier, compte | ✅ / 🔁 |
| | Cart | **Panier** : le vrai panier du visiteur (lignes, prix réels offre comprise, total, boutons vers `/commande` et `/panier`) | ➕ |
| | Checkout | la caisse est la page `/commande` (paiement du site), proposée par le bouton du widget Panier ; pas de formulaire de paiement intégré à la page | partiel |
| | Purchase Summary, Notices | exigent une commande identifiée / des notices WooCommerce : sans équivalent | ⛔ |
| | Product Stock, Meta, Data Tabs, Related, Upsells, Additional Information | produits = formations : pas de stock ; le reste se compose avec liste dynamique + onglets | partiel / ⛔ stock |
| Avancé | Animations, survol, défilement, souris, arrière-plans, position, conditions, contenu dynamique, modèles, styles globaux, composants, filtres | présents dans le moteur (communs à tous les éléments) | ✅ |

## Ajouts de ce chantier

**Architecture (lot 1)** : champ `items` (liste d'éléments répétés) pour les widgets personnalisés, avec validation serveur, éditeur dans l'inspecteur (ajouter, modifier, monter, descendre, supprimer, bornes protégées), liens de liste comptés ; crochet `validate` ; métadonnées `description`, `status`, `dependencies` ; **description de chacun des 83 widgets** en infobulle.

**Widgets (lots 2-7)** : Lire la suite, Texte sur un tracé, Lien en bio, Diaporama, Carrousel de témoignages, Carrousel média, Bouton Facebook, Panier ; coloration du widget Code ; intégrations Facebook (page, publication), Instagram, TikTok, playlist YouTube.

**Bogues trouvés et corrigés en route** : liste d'éléments qui perdait une saisie au réordonner (liste périmée), boutons des nouveaux carrousels superposés (conteneur sans positionnement).

## Tests

`tests/widgets-nouveaux.test.js` (architecture, validation, rendu publié, liens, intégrations) · `tests/widgets-nouveaux-navigateur.test.js` (vrai Chrome : bibliothèque, insertion, éditeur de liste, enregistrement, rechargement, duplication, annuler / rétablir, dépliage réel, navigation réelle du diaporama) · banc d'essai `scripts/audit-widgets.js`.
