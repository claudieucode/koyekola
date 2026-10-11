# 19 — Correspondance widget par widget : Elementor → KOLAKISA

_10 octobre 2026. Colonne « Preuve » : **test** = test exécuté dans cette session ou suite citée ; **code** = type et réglages lus dans le code (`nodes.editorSpec().types`, normalisation), non retestés un par un. Les réglages détaillés d'Elementor sont dans `04…04i`._
Légende : ✔ présent · ➕ ajouté dans cette mission · ➡️ couvert par un autre module de KOLAKISA · ⚠ partiel · ✗ absent (raison) · NA sans objet.

| Widget Elementor | Équivalent KOLAKISA (type) | État | Preuve / remarque |
|---|---|---|---|
| Accordéon, Bascule | `accordion`, `toggle` | ✔ | code ; schéma FAQ (`faqSchema`), un seul ouvert (`single`). Éléments imbriqués (widgets dans un volet) : ⚠ contenu texte seulement |
| Onglets (+ imbriqués) | `tabs` ; conteneur en mode « onglets » | ✔ | code (onglets à contenu libre via le mode conteneur) |
| Carrousel (imbriqué) | conteneur en mode « carrousel » | ✔ | code |
| Slides | `slides` | ✔ ➕ | Ken Burns ajouté (test) |
| Séparateur, Espaceur | `divider`, `spacer` | ✔ | code (motifs à tirets/pointillés, texte) |
| Off-Canvas, Fenêtre | `modal` (position gauche / droite) | ✔ | code |
| Sidebar | — | NA | notion WordPress |
| Inner Section (legacy) | `group`, `columns`, `grid`, `stack` | ✔ | code |
| Image | `image` | ✔ ➕ | résolution, visionneuse (tests) |
| Image Box | `imagebox` | ✔ ➕ | résolution (test) |
| Image Carousel, Carrousel média, Basic Media Carousel | `carousel`, `mediacarousel` | ✔ ➕ | résolution (test) |
| Galerie, Basic Gallery | `gallery` | ✔ ➕ | dispositions, colonnes, ratio, filtres, légende (tests) |
| Portfolio | `gallery` (filtres) / `querylist` | ⚠ | filtre par étiquette à la main ; pas de filtre par taxonomie d'articles |
| Vidéo | `video` | ✔ ➕ | début / fin ajoutés (test) ; affiche (fichier), pas de mode « image de recouvrement » pour YouTube/Vimeo |
| Playlist vidéo | `videoplaylist` | ➕ | test ; YouTube / Vimeo, sans « lire la suivante » (exigerait l'API des lecteurs) |
| Lottie | `lottie` | ✔ | code |
| SoundCloud | `embed` (fournisseurs reconnus), `audio` | ✔ | code |
| Image mise en avant | `image` + étiquette `{{post.image}}` | ✔ | code |
| Icône, Icon Box | `icon`, `iconbox` | ✔ | code |
| Liste d'icônes | `iconlist` | ✔ ➕ | en ligne + séparateurs (test) |
| Icônes sociales | `social` | ✔ ➕ | +Telegram, Pinterest, Reddit, Threads |
| Boutons de partage | `sharebuttons` | ✔ ➕ | +4 réseaux (test) |
| Facebook (J'aime) | `facebookbutton` | ✔ | code. Embed (publication / vidéo), Commentaires (exige l'ID d'application Facebook), Flux de page : ✗ (dépendent d'un compte et d'un cookie Facebook ; hors périmètre) |
| Titre | `heading` (H1–H6) | ✔ ➕ | contour du texte (test). Balise p / div / span : exclue volontairement |
| Éditeur de texte | `text` | ✔ ➕ | lettrine, colonnes (test) |
| Citation | `quote` | ✔ | pas de bouton « Tweet » (NA : réseau tiers) |
| Titre animé | `animatedheading` | ✔ | code |
| Code Highlight | `code` | ✔ | langage ; numéros de ligne / bouton copier / lignes surlignées : ✗ |
| Lire la suite | `readmore` | ✔ | code (widget natif `<details>`) |
| Text Path | `textpath` | ✔ | code |
| Table des matières | `toc` | ✔ | code |
| Alerte | `alert` | ✔ | code |
| Compteur | `counter` | ✔ ➕ | séparateur des milliers (test) |
| Barre de progression | `progress` | ✔ | code |
| Suivi de progression | `readingprogress` | ✔ | code ; version circulaire : ✗ |
| Évaluation | `rating` | ✔ | code |
| Avis / Témoignage / Carrousel de témoignages | `testimonial`, `testimonialcarousel` | ✔ | position de la photo (haut / côté) du témoignage : ✗ |
| Flip Box | `flipbox` | ✔ | code |
| Hotspot | `hotspot` | ✔ ➕ | résolution ; déclencheur survol / clic : ✗ |
| Liste de prix, Tableau de prix | `pricelist`, `pricing` | ✔ | code |
| Compte à rebours | `countdown` | ✔ ➕ | minuteur par visiteur, fin = masquer / rediriger, unités (tests) |
| Bouton | `button` | ✔ | code |
| Appel à l'action | `cta` | ➕ | test |
| Boutons Stripe / PayPal | — | ➡️ | paiements gérés par le module Commerce (`addtocart`, `cart`) ; dons et abonnements PayPal : ✗ |
| Menu, Menu WordPress | `menu`, `cmsmenu` | ✔ | code |
| Ancre de menu | `menuanchor` | ✔ | code |
| Panier de menu | `cart`, `minicart` | ✔ | code |
| Fil d'Ariane | `breadcrumb` | ✔ | code (n'exige pas Yoast) |
| Recherche, Formulaire de recherche | `search` | ✔ | code |
| Titre / Contenu / Extrait / Infos / Navigation / Commentaires d'article | `dyntext`, `postcontent`, `postmeta`, `postnav`, `postcomments`, `postterms` | ✔ | code |
| Articles, Archive, Article seul | `posts`, `querylist`, `archiveinfo` | ✔ | code |
| Logo / Titre du site, Titre de page | `sitelogo`, `sitetitle`, `dyntext` | ✔ | code |
| Boîte d'auteur | `authorbox` | ✔ | code |
| Plan du site (Sitemap) | — | ✗ | pas de widget (liste hiérarchique des pages / articles) ; le plan du site XML existe pour le référencement ; `querylist` peut lister articles et formations |
| Modèle (Template) | composants | ✔ | commit composants |
| Loop Grid / Carousel, Filtre de taxonomie | `querylist`, `catfilter` | ✔ | code |
| Formulaire | `signupform` + module Formulaires | ➡️ | champs de collecte de contacts ; fichiers / date / heure : ✗ (hors périmètre marketing) |
| Connexion | `account` | ✔ | code |
| Shortcode | étiquettes dynamiques | ➡️ | pas de shortcodes (sécurité) ; équivalent sûr |
| HTML | `html` | ✔ | réservé aux administrateurs (comme chez Elementor) |
| Google Maps | `map` | ✔ | code |
| Bouton flottant | `floatingbutton` | ➕ | test ; WhatsApp, Messenger, e-mail, SMS |
| V4 : Button, Div Block, Flexbox, Heading, Image, Paragraph, Tabs, YouTube | `button`, `container`, `heading`, `image`, `text`, `tabs`, `video` | ✔ | code |
| V4 : SVG | — | ✗ | le SVG est refusé par la médiathèque (peut contenir du script) |
| V4 : formulaire atomique | module Formulaires | ➡️ | voir ci-dessus |
