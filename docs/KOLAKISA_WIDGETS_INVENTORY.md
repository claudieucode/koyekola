# Inventaire des widgets de KOLAKISA

> Généré par `node scripts/build-widgets-docs.js` à partir du registre réel (`NODE_TYPES`, `PALETTE`, `CUSTOM_WIDGETS`, `editorSpec()`). Ne pas modifier à la main.

**92 types d'éléments** dans le registre (6 conteneurs, 25 widgets personnalisés déclarés dans `CUSTOM_WIDGETS`, 50 avec parties stylables). Catégories : Structure (8), Texte (11), Média (10), Interaction (15), Marketing (33), Avancé (2), Contenu dynamique (10), Formations (3).

Colonnes : **Propriétés lues** = champs de contenu lus par le validateur serveur du widget (`p.xxx` dans sa fonction `props`) ; **Insertion** = clic bibliothèque (direct) ou boîte de dialogue (choix demandé : image, adresse, formation…) ; **Parties** = sous-éléments stylables séparément ; **Tests préexistants** = fichiers de tests qui nomment le type (hors mission 8).

## Structure (8)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `container` | Conteneur | layout | oui | direct | `full` `band` | — | noyau (`_node.ejs`) | 104 : accordeons-navigateur, boucle-carte-inseree, canvas-vide-choix-navigateur |
| `columns` | Colonnes | layout | oui | direct | — | — | noyau (`_node.ejs`) | 16 : controles-matrice-navigateur, editeur-canvas-navigateur, editeur-canvas-proprietes-restantes-navigateur |
| `column` | Colonne | layout | oui | direct | — | — | noyau (`_node.ejs`) | 22 : accordeons-navigateur, editeur-canvas-moteur-navigateur, editeur-canvas-navigateur |
| `grid` | Grille | layout | oui | direct | — | — | noyau (`_node.ejs`) | 33 : boucle-carte-inseree, controles-matrice-navigateur, editeur-canvas-containers-navigateur |
| `stack` | Pile | layout | oui | direct | `link` `loopInsert` `newTab` | — | noyau (`_node.ejs`) | 5 : editeur-layout-contrat-navigateur, editeur-widgets, effets-serveur |
| `group` | Groupe | layout | oui | direct | `link` `loopInsert` `newTab` | — | noyau (`_node.ejs`) | 6 : editeur-blocs-reutilisables, editeur-layout-contrat-navigateur, editeur-widgets |
| `spacer` | Espace | basic | non | direct | `size` | — | noyau (`_node.ejs`) | 15 : editeur-apercu-navigateur, editeur-etats-typographie-navigateur, editeur-stabilite-navigateur |
| `divider` | Séparateur | basic | non | direct | `text` `lineStyle` `thickness` `color` `align` | — | noyau (`_node.ejs`) | 20 : controles-coherence, controles-contenu-navigateur, editeur-v2 |

## Texte (11)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `heading` | Titre | basic | non | direct | `text` `link` `tag` `level` `newTab` | — | noyau (`_node.ejs`) | 119 : accordeons-navigateur, boucle-carte-inseree, canvas-vide-choix-navigateur |
| `text` | Texte | basic | non | direct | `html` `dropCap` | — | noyau (`_node.ejs`) | 130 : automatisations-palette-navigateur, blog-editor, canvas-vide-compatibilite-navigateur |
| `list` | Liste | basic | non | direct | `items` `ordered` | — | noyau (`_node.ejs`) | 44 : cms-email-engine, editeur-canvas-sans-rechargement-navigateur, editeur-champ-numerique-contrat-navigateur |
| `quote` | Citation | general | non | direct | `text` `author` | — | noyau (`_node.ejs`) | 6 : marketing-bibliotheque-blocs-navigateur, marketing-pages-atterrissage, marketing-r5-bibliotheque |
| `code` | Code (texte) | general | non | direct | `text` `language` `highlight` `lineNumbers` `copy` | — | noyau (`_node.ejs`) | 5 : editeur-canvas-navigateur, elementor-parite-3-navigateur, etape1-markdown |
| `badge` | Badge | general | non | direct | `text` `tone` | — | noyau (`_node.ejs`) | 5 : controles-contenu-navigateur, crm-fiches, editeur-canvas-sans-rechargement-navigateur |
| `timeline` | Chronologie | general | non | direct | `items` | item, date, title, text | noyau (`_node.ejs`) | 1 : editeur-pro |
| `alert` | Alerte | general | non | direct | `text` `tone` `title` `dismissible` | icon, title, body | noyau (`_node.ejs`) | 6 : audit-corrections, centre-gestion, controles-contenu-navigateur |
| `iconlist` | Liste d'icônes | general | non | direct | `items` `iconColor` `inline` `divider` | icon, item, link | noyau (`_node.ejs`) | 4 : controles-coherence, editeur-v3, editeur-widgets |
| `table` | Tableau | general | non | direct | `rows` `header` `caption` `footer` `striped` `align` | — | noyau (`_node.ejs`) | 7 : audit-corrections, cms-comments, controles-coherence |
| `animatedheading` | Titre animé | advanced | non | direct | `words` `before` `after` `level` `effect` `interval` | — | noyau (`_node.ejs`) | 1 : editeur-widgets |

## Média (10)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `image` | Image | basic | non | dialogue (image) | `src` `alt` `decorative` `link` `caption` `title` `newTab` `lightbox` | — | noyau (`_node.ejs`) | 53 : blog-editor, blog-medias-protection, centre-gestion |
| `gallery` | Galerie | general | non | dialogue (images) | `images` `masonry` `layout` `columns` `ratio` `rowHeight` `lightbox` `overlay` `filters` | item, image, caption | noyau (`_node.ejs`) | 9 : editeur-v2, editeur-widgets, effets-serveur |
| `video` | Vidéo | basic | non | dialogue (video) | `url` `title` `autoplay` `muted` `loop` `controls` `poster` `start` `end` | — | noyau (`_node.ejs`) | 20 : cms-media, editeur-canvas-navigateur, editeur-widgets |
| `audio` | Audio | general | non | dialogue (audio) | `src` `title` `loop` | — | noyau (`_node.ejs`) | 4 : cms-media, editeur-v2, marketing-r5-blocs |
| `carousel` | Carrousel d'images | general | non | dialogue (images) | `images` `label` `dots` `autoplay` `interval` `loop` | slide, image, arrows, dots | noyau (`_node.ejs`) | 6 : editeur-pro, editeur-v2, editeur-widgets |
| `hotspot` | Image à points d'intérêt | advanced | non | dialogue (image) | `src` `alt` `spots` `trigger` | dot, card | noyau (`_node.ejs`) | 4 : editeur-v3, effets-serveur, elementor-parite-3-navigateur |
| `map` | Google Maps | basic | non | dialogue (map) | `address` `zoom` `height` `title` | — | noyau (`_node.ejs`) | 2 : editeur-widgets, page-builder-editeur |
| `imagebox` | Boîte d'image | general | non | dialogue (image) | `src` `alt` `title` `link` `text` `titleLevel` `position` `newTab` | media, title, text | noyau (`_node.ejs`) | 5 : editeur-widgets, effets-serveur, images-resolutions |
| `iconbox` | Boîte d'icône | general | non | direct | `icon` `title` `link` `text` `titleLevel` `position` `size` `newTab` | media, title, text | noyau (`_node.ejs`) | 3 : controles-contenu-navigateur, editeur-pro, editeur-widgets |
| `icon` | Icône | basic | non | direct | `name` `link` `label` `size` `newTab` | — | noyau (`_node.ejs`) | 7 : editeur-v2, editeur-widgets-personnalises, editeur-widgets |

## Interaction (15)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `button` | Bouton | basic | non | direct | `label` `url` `icon` `variant` `newTab` `iconPos` `size` `rel` | — | noyau (`_node.ejs`) | 77 : accueil-diaporama, automatisations-palette-navigateur, cms-appearance-navigateur |
| `link` | Lien | basic | non | direct | `label` `url` `newTab` | — | noyau (`_node.ejs`) | 30 : cms-comments-navigateur, cms-commerce, cms-orchestration |
| `accordion` | Accordéon / FAQ | general | non | direct | `items` `faqSchema` `openFirst` `single` `icon` | item, question, answer | noyau (`_node.ejs`) | 10 : controles-contenu-navigateur, editeur-canvas-sans-rechargement-navigateur, editeur-contraste-navigateur |
| `tabs` | Onglets | general | non | direct | `items` `vertical` | list, tab, panel | noyau (`_node.ejs`) | 8 : controles-contenu-navigateur, editeur-canvas-sans-rechargement-navigateur, editeur-contraste-navigateur |
| `menu` | Menu de navigation | site | non | direct | `items` `label` `vertical` `mobileToggle` | list, link, burger | noyau (`_node.ejs`) | 9 : cms-urls, editeur-menu-navigateur, editeur-pro |
| `toggle` | Bascule | general | non | direct | `title` `text` `open` | title, body | noyau (`_node.ejs`) | 5 : editeur-v2, editeur-v3, marketing-reglages-blocs |
| `breadcrumb` | Fil d'Ariane | site | non | direct | `items` `separator` | — | noyau (`_node.ejs`) | 3 : editeur-v2, editeur-widgets, widgets-liens-navigateur |
| `social` | Réseaux sociaux | social | non | direct | `items` `size` `shape` `label` | link | noyau (`_node.ejs`) | 15 : cms-analytics, cms-orchestration, editeur-partage |
| `sharebuttons` | Boutons de partage | social | non | direct | `networks` `size` `shape` `label` `message` | link | noyau (`_node.ejs`) | 4 : editeur-partage, editeur-structure-navigateur, elementor-parite-2-navigateur |
| `modal` | Fenêtre (modale) | advanced | non | direct | `buttonLabel` `title` `text` `ctaUrl` `ctaLabel` `variant` `size` `position` | open, head, title, body, foot, close | noyau (`_node.ejs`) | 5 : editeur-v2, editeur-v3, effets-serveur |
| `tooltip` | Infobulle | advanced | non | direct | `text` `tip` `position` | trigger, bubble | noyau (`_node.ejs`) | 1 : editeur-v3 |
| `flipbox` | Boîte retournable | advanced | non | direct | `frontTitle` `backTitle` `icon` `ctaUrl` `ctaLabel` `frontText` `backText` `effect` `height` | front, back, title, text | noyau (`_node.ejs`) | 1 : editeur-widgets |
| `toc` | Table des matières | advanced | non | direct | `title` `depth` `numbered` | title, list, link | noyau (`_node.ejs`) | 3 : editeur-conformite-widgets, editeur-widgets, widgets-parties-rendu-navigateur |
| `readingprogress` | Barre de lecture | advanced | non | direct | `position` `thickness` `shape` | bar, fill | noyau (`_node.ejs`) | 2 : editeur-widgets, elementor-parite-3-navigateur |
| `menuanchor` | Ancre de menu | general | non | dialogue (anchor) | — | — | noyau (`_node.ejs`) | 3 : editeur-manipulation-directe-navigateur, editeur-widgets, page-builder-editeur |

## Marketing (33)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `progress` | Barre de progression | general | non | direct | `label` `value` `showValue` `animate` | head, track, bar | noyau (`_node.ejs`) | 3 : controles-contenu-navigateur, editeur-pro, editeur-widgets |
| `counter` | Compteur | general | non | direct | `value` `label` `separator` `prefix` `suffix` `decimals` `duration` | number, label | noyau (`_node.ejs`) | 4 : editeur-canvas-sans-rechargement-navigateur, editeur-v2, editeur-widgets |
| `testimonial` | Témoignage | general | non | direct | `text` `name` `avatar` `role` `avatarPos` `rating` | stars, quote, author, role, avatar | noyau (`_node.ejs`) | 4 : editeur-v2, editeur-widgets, elementor-parite-3-navigateur |
| `pricing` | Offre tarifaire | advanced | non | direct | `title` `price` `features` `ctaUrl` `ctaLabel` `period` `description` `badge` `highlight` | badge, title, price, description, features, button | noyau (`_node.ejs`) | 4 : controles-contenu-navigateur, editeur-v2, page-builder-editeur |
| `countdown` | Compte à rebours | advanced | non | direct | `until` `endText` `mode` `minutes` `expire` `redirectUrl` `hideUnits` | unit | noyau (`_node.ejs`) | 3 : controles-contenu-navigateur, elementor-parite-2-navigateur, elementor-parite-4-editeur-navigateur |
| `pricelist` | Liste de prix | advanced | non | direct | `items` | item, title, price, text | noyau (`_node.ejs`) | 1 : editeur-widgets |
| `signupform` | Formulaire | form | non | dialogue (form) | `formId` `heading` `intro` `button` | title, intro, button | noyau (`_node.ejs`) | 4 : controles-contenu-navigateur, editeur-widgets, page-builder-editeur |
| `rating` | Évaluation | general | non | dialogue (rating) | `scale` `value` `title` `showValue` | title, stars, off, fill, value | noyau (`_node.ejs`) | 2 : editeur-widgets, page-builder-editeur |
| `slides` | Diaporama | general | non | direct | — | image, veil, body, title, text, button, arrows, dots | widget personnalisé (operational) | 5 : controles-contenu-navigateur, elementor-parite-2-navigateur, widgets-liens-navigateur |
| `testimonialcarousel` | Carrousel de témoignages | general | non | direct | — | slide, stars, quote, name, role, photo, arrows, dots | widget personnalisé (operational) | 2 : widgets-nouveaux-navigateur, widgets-nouveaux |
| `mediacarousel` | Carrousel média | general | non | direct | — | image, caption, arrows, dots | widget personnalisé (operational, données du visiteur / site) | 2 : widgets-nouveaux-navigateur, widgets-nouveaux |
| `cart` | Panier | commerce | non | direct | — | title, empty, line, image, name, price, total, button, edit | widget personnalisé (operational, données du visiteur / site) | 4 : editeur-boutique, rendu-accessibilite-navigateur, site-web-commerce |
| `cta` | Appel à l'action | general | non | direct | — | image, body, title, text, button, ribbon | widget personnalisé (operational) | 6 : controles-contenu-navigateur, elementor-parite-navigateur, marketing-bibliotheque-blocs |
| `facebookbutton` | Bouton Facebook | social | non | direct | — | — | widget personnalisé (operational, données du visiteur / site) | 1 : widgets-nouveaux |
| `facebookembed` | Contenu Facebook | social | non | direct | — | — | widget personnalisé (operational, données du visiteur / site) | 1 : elementor-parite-3-navigateur |
| `floatingbutton` | Bouton flottant | social | non | direct | — | button | widget personnalisé (operational, données du visiteur / site) | 2 : elementor-parite-navigateur, widgets-liens-navigateur |
| `linkinbio` | Lien en bio | social | non | direct | — | avatar, name, bio, link, icon | widget personnalisé (operational) | 3 : widgets-liens-navigateur, widgets-nouveaux-navigateur, widgets-nouveaux |
| `lottie` | Animation Lottie | advanced | non | direct | — | — | widget personnalisé (operational) | 2 : widgets-lottie-navigateur, widgets-nouveaux |
| `profilecard` | Carte de profil | general | non | direct | — | photo, name, role, bio | widget personnalisé (statut non déclaré) | 1 : editeur-widgets-personnalises |
| `readmore` | Lire la suite | basic | non | direct | — | intro, body, toggle | widget personnalisé (operational) | 2 : widgets-nouveaux-navigateur, widgets-nouveaux |
| `querylist` | Liste dynamique | site | non | direct | — | item, thumb, title, link, meta, date, excerpt, count | widget personnalisé (statut non déclaré, données du visiteur / site) | 2 : site-widgets-navigateur, site-widgets |
| `postmeta` | Informations de l'article | site | non | direct | — | item | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `postterms` | Catégorie et étiquettes | site | non | direct | — | label, term | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `postnav` | Article précédent / suivant | site | non | direct | — | link, dir, title, image | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `authorbox` | Boîte auteur | site | non | direct | — | heading, avatar, name, bio, link | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `archiveinfo` | En-tête d'archive | site | non | direct | — | title, desc, count | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `postcomments` | Commentaires de l'article | site | non | direct | — | heading, item, avatar, meta, body | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `cmsmenu` | Menu du CMS | site | non | direct | — | list, link | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `minicart` | Mini-panier | site | non | direct | — | icon, label, count | widget personnalisé (statut non déclaré, données du visiteur / site) | 1 : site-widgets |
| `sitemap` | Plan du site | site | non | direct | — | — | widget personnalisé (operational, données du visiteur / site) | 2 : cms-outils, elementor-parite-3-navigateur |
| `smartlink` | Lien intelligent | social | non | direct | — | — | widget personnalisé (operational, données du visiteur / site) | 1 : elementor-parite-3-navigateur |
| `textpath` | Texte sur un tracé | advanced | non | direct | — | — | widget personnalisé (operational) | 2 : widgets-nouveaux-navigateur, widgets-nouveaux |
| `videoplaylist` | Playlist vidéo | general | non | direct | — | stage, title, item | widget personnalisé (operational, données du visiteur / site) | 1 : elementor-parite-navigateur |

## Avancé (2)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `html` | HTML (sécurisé) | general | non | direct | `html` | — | noyau (permission pages.code) | 43 : blocs-reutilisables, blog-comments, blog-editor |
| `embed` | Contenu intégré | advanced | non | dialogue (embed) | `url` `title` `height` | — | noyau (`_node.ejs`) | 8 : editeur-v3, editeur-widgets, marketing-builder-pro |

## Contenu dynamique (10)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `posts` | Derniers articles du blog | site | non | direct | `count` `category` `layout` `showExcerpt` `showDate` `showImage` `empty` | card, image, body, date, title, excerpt | noyau (`_node.ejs`) | 14 : boucle-carte-inseree, editeur-dynamique-navigateur, editeur-dynamique |
| `courselist` | Formations du catalogue | commerce | non | direct | `count` `category` `sort` `showPrice` `cta` `empty` | card, image, body, title, excerpt, price, button | noyau (`_node.ejs`) | 2 : editeur-v3, editeur-widgets |
| `search` | Recherche | site | non | direct | `target` `placeholder` `button` | — | noyau (`_node.ejs`) | 8 : editeur-v3, editeur-widgets, elementor-parite-3-navigateur |
| `account` | Compte du visiteur | site | non | direct | `login` `account` `showCart` `cart` | link, cart, count | noyau (`_node.ejs`) | 4 : cms-remediation, editeur-v3, editeur-widgets |
| `dyntext` | Texte dynamique | advanced | non | direct | `source` `before` `after` `fallback` `tag` | — | noyau (`_node.ejs`) | 2 : editeur-v3, editeur-widgets |
| `sitelogo` | Logo du site | site | non | direct | `height` `link` | image, text | noyau (`_node.ejs`) | 3 : editeur-widgets, site-web-entete, site-web-reglages-theme |
| `postcontent` | Contenu de l'article | site | non | direct | — | — | noyau (`_node.ejs`) | 4 : cms-appearance, editeur-conformite-widgets, editeur-modeles-theme |
| `catfilter` | Filtre par catégorie | site | non | direct | `source` `allLabel` `showCount` | — | noyau (`_node.ejs`) | 1 : editeur-dynamique |
| `sitetitle` | Titre du site | site | non | direct | `tag` `link` | — | noyau (`_node.ejs`) | 3 : editeur-widgets, site-web-entete, site-web-reglages-theme |
| `copyright` | Copyright | site | non | direct | `owner` `text` | — | noyau (`_node.ejs`) | 1 : editeur-widgets |

## Formations (3)

| Identifiant | Nom affiché | Groupe | Conteneur | Insertion | Propriétés lues | Parties stylables | Source du rendu | Tests préexistants |
|---|---|---|---|---|---|---|---|---|
| `course` | Formation | commerce | non | dialogue (course) | `courseId` `cta` | — | noyau (`_node.ejs`) | 18 : controles-contenu-navigateur, editeur-boutique, editeur-widgets |
| `addtocart` | Bouton d'achat | commerce | non | dialogue (course) | `courseId` `mode` `label` `variant` `size` `showPrice` | — | noyau (`_node.ejs`) | 4 : controles-contenu-navigateur, editeur-boutique, editeur-structure-navigateur |
| `courserating` | Avis de la formation | commerce | non | dialogue (course) | `courseId` `showCount` `empty` | — | noyau (`_node.ejs`) | 3 : controles-contenu-navigateur, editeur-boutique, page-builder-editeur |
