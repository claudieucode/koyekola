# Inventaire des widgets de l'éditeur de pages KOYEKOLA

*Établi par un banc d'essai dans un vrai Chrome (`scripts/audit-widgets.js`) : chaque type du registre est inséré, enregistré, rendu dans le canevas, publié et lu sur la page publiée. Un widget n'est « opérationnel » que si ce parcours réussit.*

## Architecture (vérifiée, pas supposée)

* JavaScript sans framework : serveur Express + gabarits EJS ; éditeur dans `public/js/page-builder.js`.
* **Registre central** : `src/marketing/pages/nodes.js` (`NODE_TYPES`, `WIDGETS` = catégorie + mots-clés, `WIDGET_DESCRIPTIONS`, `editorSpec()` envoyé à l'éditeur).
* **Widgets personnalisés** (extensible sans toucher au moteur) : `src/marketing/pages/widgets/*.js` + gabarit `views/marketing-public/widgets/<type>.ejs` + styles `landing.css`. Mode d'emploi : `docs/widgets-personnalises.md`.
* Un seul modèle de données (arbre d'éléments `{id, type, props, children…}`), un seul rendu publié (`_node.ejs`), le même pour le canevas. Styles par écran (ordinateur / tablette / mobile), états, animations, interactions, visibilité, programmation : communs à tous les éléments.
* Bibliothèque : catégories repliables, recherche (nom, mots-clés), favoris, récents, cadenas de permission, **infobulle de description pour chaque widget**.

## État réel (banc d'essai final, 86 types)

| Résultat | Nombre |
|---|---|
| Opérationnels de bout en bout : enregistrement → canevas → publication → page publiée (avec données réelles : formation, formulaire publié) | **79** |
| Opérationnels dans leur contexte, vides sur une page ordinaire par conception (contenu de l'article, sommaire, catégories/étiquettes, précédent/suivant, boîte auteur, commentaires, menu du CMS) | 7 |
| À corriger | **0** |

## Référence Elementor → équivalent KOYEKOLA

Légende : ✅ présent · ➕ ajouté dans ce chantier · 🔁 couvert sous un autre nom · ⏳ en attente d'une dépendance · ⛔ non applicable (raison donnée).

| Famille | Widget de référence | KOYEKOLA | Statut |
|---|---|---|---|
| Structure | Container, Grid, Spacer, Divider, Menu Anchor | conteneur, grille, espace, séparateur, ancre de menu | ✅ |
| | Template | composants réutilisables + modèles de l'équipe | 🔁 |
| | Off-Canvas | **Fenêtre (modale)** avec position centre / gauche / droite : un panneau latéral qui glisse depuis le bord | ✅ |
| Texte | Heading, Text Editor, Animated Headline, Blockquote | titre, texte, titre animé, citation | ✅ |
| | Read More | **Lire la suite** (`<details>` natif) | ➕ |
| | Text Path | **Texte sur un tracé** (SVG `<textPath>`) | ➕ |
| | Code Highlight | code avec **coloration** (JavaScript, JSON, HTML, CSS, shell, Python, SQL, PHP), calculée à l'affichage, sans script visiteur | ➕ |
| Médias | Image, Image Box, Gallery, Image Carousel, Video, Audio | image, boîte d'image, galerie, carrousel, vidéo, audio | ✅ |
| | Media Carousel | **Carrousel média** (images + YouTube/Vimeo) | ➕ |
| | Video Playlist | **Playlist YouTube** (raccourci de « Contenu intégré ») | ➕ |
| | SoundCloud | raccourci SoundCloud | ✅ |
| | Lottie | **Animation Lottie** : lottie-web « light » (MIT) hébergé avec le site, chargé seulement quand une animation approche de l'écran ; démarrage au chargement / à l'arrivée à l'écran / au survol / au clic ; « réduire les animations » respecté | ➕ |
| Icônes | Icon, Icon Box, Icon List, Social Icons, Star Rating | icône, boîte d'icône, liste d'icônes, réseaux sociaux, évaluation | ✅ |
| Marketing | Button, Flip Box, Hotspot, Price List, Price Table, Countdown, Progress Bar, Progress Tracker | bouton, boîte retournable, points d'intérêt, liste de prix, offre tarifaire, compte à rebours, barre de progression, barre de lecture | ✅ |
| | Call to Action | section prête « Appel à l'action » | 🔁 |
| | Link in Bio | **Lien en bio** (liste de boutons, chaque lien compté) | ➕ |
| Interactions | Accordion, Toggle, Tabs, Alert, Tooltip, Modal | accordéon, bascule, onglets, alerte, infobulle, fenêtre | ✅ |
| | Slides | **Diaporama** | ➕ |
| | Testimonial Carousel | **Carrousel de témoignages** | ➕ |
| | Nested Tabs / Nested Carousel | **Conteneur en mode « Onglets » ou « Carrousel »** : chaque conteneur enfant devient un onglet (titre = son nom) ou une diapositive ; le contenu est de vrais éléments, modifiables dans le canevas | ➕ |
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
| | Checkout | la caisse est la page sécurisée `/commande` du site (connexion et paiement du site) : elle ne peut pas être « incrustée » dans une page sans contourner ces protections ; le widget Panier y mène | ⛔ (par sécurité) |
| | Purchase Summary, Notices | exigent une commande identifiée / des notices WooCommerce : sans équivalent | ⛔ |
| | Product Title / Price / Images / Short Description / Meta / Related | **raccourcis « Produit »** (titre, prix, image, description, informations, produits apparentés) alimentés par la fiche de la formation | ➕ |
| | Product Stock, Additional Information, Upsells | une formation n'a ni stock ni caractéristiques techniques ni ventes additionnelles | ⛔ |
| | Product Data Tabs | se compose : conteneur en mode « Onglets » + textes dynamiques du produit | ✅ (composition) |
| Avancé | Animations, survol, défilement, souris, arrière-plans, position, conditions, contenu dynamique, modèles, styles globaux, composants, filtres | présents dans le moteur (communs à tous les éléments) | ✅ |

## Ajouts de ce chantier

**Architecture (lot 1)** : champ `items` (liste d'éléments répétés) pour les widgets personnalisés, avec validation serveur, éditeur dans l'inspecteur (ajouter, modifier, monter, descendre, supprimer, bornes protégées), liens de liste comptés ; crochet `validate` ; métadonnées `description`, `status`, `dependencies` ; **description de chacun des 83 widgets** en infobulle.

**Widgets (lots 2-8)** : Lire la suite, Texte sur un tracé, Lien en bio, Diaporama, Carrousel de témoignages, Carrousel média, Bouton Facebook, Panier, Animation Lottie ; onglets et carrousels imbriqués (mode du conteneur) ; coloration du widget Code ; intégrations Facebook (page, publication), Instagram, TikTok, playlist YouTube ; raccourcis « Produit ».

**Bogues trouvés et corrigés en route** : « exclure l'élément affiché » ne marchait pas sur une fiche de formation (le contexte n'avait pas d'identifiant) ;  liste d'éléments qui perdait une saisie au réordonner (liste périmée), boutons des nouveaux carrousels superposés (conteneur sans positionnement).

## Tests

`tests/widgets-nouveaux.test.js` (architecture, validation, rendu publié, liens, intégrations) · `tests/widgets-nouveaux-navigateur.test.js` (vrai Chrome : bibliothèque, insertion, éditeur de liste, enregistrement, rechargement, duplication, annuler / rétablir, dépliage réel, navigation réelle du diaporama) · banc d'essai `scripts/audit-widgets.js`.
