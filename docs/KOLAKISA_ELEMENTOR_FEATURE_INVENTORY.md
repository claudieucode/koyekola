# Inventaire fonctionnel Elementor ↔ Kolakisa (identifiants stables)

_Généré par `scripts/build-parity-inventory.py` à partir des mêmes lignes que les décomptes ci-dessous. Ne pas modifier à la main : modifier le script._

## Décomptes (calculés)

| Mesure | Nombre |
|---|---|
| Lignes inventoriées | **109** |
| Présentes et validées (existantes) | **52** |
| Ajoutées ou complétées dans cette mission et validées | **49** |
| Partielles | **0** |
| Autre module de Kolakisa | **1** |
| Non faites ou exclues, avec raison | **7** |

« Validé » = testé de bout en bout (test indiqué) ; pour les lignes « existantes », le test cité est une suite préexistante qui passe (suite complète : 4 711 / 4 711 le 11 octobre 2026). Les lignes marquées « Présent » mais sans test dédié dans cette mission ne sont pas comptées comme revalidées une à une.

## Inventaire

| ID | Domaine | Référence Elementor | Source | Disponibilité (selon l'article) | Kolakisa | Statut initial | Statut final | Écart / action | Priorité | Tests |
|---|---|---|---|---|---|---|---|---|---|---|
| EL-W001 | Widget | Accordéon | https://elementor.com/help/accordion-widget/ | non indiquée | accordion | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W002 | Widget | Accordéon à éléments imbriqués | https://elementor.com/help/accordion-widget-with-nested-elements/ | non indiquée | conteneur mode accordéon | Absent | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-W003 | Widget | Onglets | https://elementor.com/help/tabs-widget/ | non indiquée | tabs | Présent | Validé (existant) | icônes par onglet déjà présentes | — | editeur-widgets |
| EL-W004 | Widget | Onglets à éléments imbriqués | https://elementor.com/help/tabs-with-nested-containers/ | Pro (expérience Nested Elements) | conteneur mode onglets | Présent | Validé (existant) |  | — | widgets-imbriques |
| EL-W005 | Widget | Bascule | https://elementor.com/help/toggle-widget/ | non indiquée | toggle | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W006 | Widget | Carrousel (imbriqué) | https://elementor.com/help/carousel-widget/ | non indiquée | conteneur mode carrousel | Présent | Validé (existant) |  | — | widgets-imbriques |
| EL-W007 | Widget | Slides | https://elementor.com/help/slides-widget-pro/ | non indiquée | slides | Incomplet | Ajouté et validé | effet Ken Burns ajouté | P2 | elementor-parite-2 |
| EL-W008 | Widget | Séparateur | https://elementor.com/help/divider-widget/ | non indiquée | divider | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W009 | Widget | Espaceur | https://elementor.com/help/spacer-widget/ | non indiquée | spacer | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W010 | Widget | Off-Canvas / Popups | https://elementor.com/help/off-canvas-widget/ | non indiquée | modal | Incomplet | Ajouté et validé | ouverture automatique, fréquence, verrou, carte du coin, barre du bas | P2 | elementor-parite-3 |
| EL-W011 | Widget | Sidebar | https://elementor.com/help/sidebar-widget/ | non indiquée | — | Non applicable | Non applicable | notion WordPress | P4 | — |
| EL-W012 | Widget | Section interne (legacy) | https://elementor.com/help/inner-section-widget/ | non indiquée | group / columns / grid | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W013 | Widget | Image | https://elementor.com/help/image-widget/ | non indiquée | image | Incomplet | Ajouté et validé | résolution, visionneuse | P1 | images-resolutions |
| EL-W014 | Widget | Image Box | https://elementor.com/help/image-box-widget/ | non indiquée | imagebox | Incomplet | Ajouté et validé | résolution | P1 | images-resolutions |
| EL-W015 | Widget | Image Carousel | https://elementor.com/help/image-carousel-widget/ | non indiquée | carousel | Incomplet | Ajouté et validé | résolution | P1 | images-resolutions |
| EL-W016 | Widget | Galerie / Galerie de base | https://elementor.com/help/gallery-widget/ | non indiquée | gallery | Incomplet | Ajouté et validé | dispositions, 1–12 colonnes, ratio, légende, filtres, résolution | P1 | galerie-options |
| EL-W017 | Widget | Carrousel média | https://elementor.com/help/media-carousel-widget-pro/ | non indiquée | mediacarousel | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W018 | Widget | Portfolio | https://elementor.com/help/portfolio-widget-pro/ | non indiquée | gallery (filtres) / querylist | Incomplet | Validé (existant) | filtres par étiquette dans la galerie ; filtre par taxonomie de contenu : grille de boucle + Filtre de taxonomie (catfilter) | — | galerie-options, site-widgets |
| EL-W019 | Widget | Vidéo | https://elementor.com/help/video-widget/ | non indiquée | video | Incomplet | Ajouté et validé | début / fin | P2 | elementor-parite-2 |
| EL-W020 | Widget | Playlist vidéo | https://elementor.com/help/video-playlist-widget-pro/ | non indiquée | videoplaylist | Absent | Ajouté et validé |  | P2 | elementor-parite |
| EL-W021 | Widget | Lottie | https://elementor.com/help/lottie-widget/ | non indiquée | lottie | Présent | Validé (existant) |  | — | widgets-lottie |
| EL-W022 | Widget | SoundCloud | https://elementor.com/help/soundcloud-widget/ | non indiquée | embed | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W023 | Widget | Image mise en avant | https://elementor.com/help/featured-image-widget/ | non indiquée | image + étiquette dynamique | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W024 | Widget | Icône | https://elementor.com/help/icon-widget/ | non indiquée | icon | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W025 | Widget | Icon Box | https://elementor.com/help/icon-box-widget/ | non indiquée | iconbox | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W026 | Widget | Liste d'icônes | https://elementor.com/help/icon-list-widget/ | non indiquée | iconlist | Incomplet | Ajouté et validé | en ligne, séparateurs | P2 | elementor-parite-2 |
| EL-W027 | Widget | Icônes sociales | https://elementor.com/help/social-icons-widget/ | non indiquée | social | Incomplet | Ajouté et validé | +4 réseaux | P2 | elementor-parite-2 |
| EL-W028 | Widget | Boutons de partage | https://elementor.com/help/share-buttons-widget-pro/ | non indiquée | sharebuttons | Incomplet | Ajouté et validé | +4 réseaux | P2 | elementor-parite-2 |
| EL-W029 | Widget | Facebook : J'aime | https://elementor.com/help/facebook-like-button-widget-pro/ | non indiquée | facebookbutton | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W030 | Widget | Facebook : Embed / Flux de page | https://elementor.com/help/facebook-embed-widget-pro/ | non indiquée | facebookembed | Absent | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-W031 | Widget | Facebook : Commentaires | https://elementor.com/help/facebook-comments-widget/ | ID d'application Facebook requis | — | Absent | Exclu (justifié) | exige un ID d'application Facebook et un script externe | P4 | — |
| EL-W032 | Widget | Titre | https://elementor.com/help/heading-widget/ | non indiquée | heading | Incomplet | Ajouté et validé | contour du texte, balise p / div / span | P2 | elementor-parite-3 |
| EL-W033 | Widget | Éditeur de texte | https://elementor.com/help/text-editor-widget/ | non indiquée | text | Incomplet | Ajouté et validé | lettrine, colonnes | P2 | elementor-parite |
| EL-W034 | Widget | Citation | https://elementor.com/help/blockquote-widget-pro/ | non indiquée | quote | Présent | Validé (existant) | bouton Tweet non repris (réseau tiers) | — | editeur-widgets |
| EL-W035 | Widget | Titre animé | https://elementor.com/help/animated-headline-pro/ | non indiquée | animatedheading | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W036 | Widget | Code Highlight | https://elementor.com/help/code-highlight-pro/ | non indiquée | code | Incomplet | Ajouté et validé | numéros, lignes surlignées, copier | P2 | elementor-parite-3 |
| EL-W037 | Widget | Lire la suite | https://elementor.com/help/read-more-widget/ | non indiquée | readmore | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W038 | Widget | Texte sur chemin | https://elementor.com/help/text-path-widget/ | non indiquée | textpath | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W039 | Widget | Table des matières | https://elementor.com/help/table-of-contents-pro/ | non indiquée | toc | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W040 | Widget | Alerte | https://elementor.com/help/alert-widget/ | non indiquée | alert | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W041 | Widget | Compteur | https://elementor.com/help/counter-widget/ | non indiquée | counter | Incomplet | Ajouté et validé | séparateur des milliers | P2 | elementor-parite-2 |
| EL-W042 | Widget | Barre de progression | https://elementor.com/help/progress-bar-widget/ | non indiquée | progress | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W043 | Widget | Suivi de progression | https://elementor.com/help/progress-tracker/ | non indiquée | readingprogress | Incomplet | Ajouté et validé | forme circulaire | P2 | elementor-parite-3 |
| EL-W044 | Widget | Évaluation | https://elementor.com/help/rating-widget/ | non indiquée | rating | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W045 | Widget | Avis / Témoignage / Carrousel de témoignages | https://elementor.com/help/testimonial-widget/ | non indiquée | testimonial, testimonialcarousel | Incomplet | Ajouté et validé | place de la photo | P2 | elementor-parite-3 |
| EL-W046 | Widget | Flip Box | https://elementor.com/help/flip-box-widget-pro/ | non indiquée | flipbox | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W047 | Widget | Hotspot | https://elementor.com/help/hotspot-widget-pro/ | non indiquée | hotspot | Incomplet | Ajouté et validé | infobulle au survol | P2 | elementor-parite-3 |
| EL-W048 | Widget | Liste de prix | https://elementor.com/help/price-list-widget-pro/ | non indiquée | pricelist | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W049 | Widget | Tableau de prix | https://elementor.com/help/price-table-pro/ | non indiquée | pricing | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W050 | Widget | Compte à rebours | https://elementor.com/help/countdown-widget-pro/ | non indiquée | countdown | Incomplet | Ajouté et validé | minuteur par visiteur, action à la fin, unités | P2 | elementor-parite-2 |
| EL-W051 | Widget | Bouton | https://elementor.com/help/button-widget/ | non indiquée | button | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W052 | Widget | Appel à l'action | https://elementor.com/help/call-to-action-widget/ | non indiquée | cta | Absent | Ajouté et validé |  | P2 | elementor-parite |
| EL-W053 | Widget | Bouton flottant | https://elementor.com/help/floating-button/ | affichage conditionnel Pro | floatingbutton | Absent | Ajouté et validé |  | P2 | elementor-parite |
| EL-W054 | Widget | Boutons Stripe / PayPal | https://elementor.com/help/stripe-button/ | compte Stripe requis | — | Absent | Exclu (justifié) | paiements : module Commerce (une seule source) | P4 | — |
| EL-W055 | Widget | Menu (imbriqué) / Menu WordPress | https://elementor.com/help/the-menu-widget/ | expérimental | menu, cmsmenu | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W056 | Widget | Ancre de menu | https://elementor.com/help/menu-anchor-widget/ | non indiquée | menuanchor | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W057 | Widget | Panier de menu | https://elementor.com/help/menu-cart-widget-pro/ | exige WooCommerce | cart, minicart | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W058 | Widget | Fil d'Ariane | https://elementor.com/help/breadcrumbs-widget-pro/ | exige Yoast SEO | breadcrumb | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W059 | Widget | Recherche / Formulaire de recherche | https://elementor.com/help/search-form-widget/ | remplacé par Recherche (3.24) | search | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W060 | Widget | Titre / Contenu / Extrait d'article | https://elementor.com/help/single-post-widgets/ | non indiquée | dyntext, postcontent | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W061 | Widget | Infos / Navigation / Commentaires d'article | https://elementor.com/help/post-info-widget/ | non indiquée | postmeta, postnav, postcomments, postterms | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W062 | Widget | Articles / Archive | https://elementor.com/help/posts-widget-pro/ | non indiquée | posts, querylist, archiveinfo | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W063 | Widget | Logo / Titre du site / Titre de page | https://elementor.com/help/site-logo-widget-pro/ | non indiquée | sitelogo, sitetitle, dyntext | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W064 | Widget | Boîte d'auteur | https://elementor.com/help/using-the-author-box-widget/ | non indiquée | authorbox | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W065 | Widget | Plan du site | https://elementor.com/help/sitemap-widget-pro/ | non indiquée | sitemap | Absent | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-W066 | Widget | Modèle (Template) / Éléments globaux | https://elementor.com/help/template-widget-pro/ | non indiquée | composants | Présent | Validé (existant) |  | — | composants |
| EL-W067 | Widget | Loop Grid / Carousel / Filtre de taxonomie | https://elementor.com/help/loop-grid/ | non indiquée | querylist, catfilter | Présent | Ajouté et validé | modèle alterné : carte insérée après le N-ième résultat (une fois ou tous les N) | P2 | site-widgets, boucle-carte-inseree |
| EL-W068 | Widget | Formulaire / Formulaire atomique | https://elementor.com/help/form-widget/ | non indiquée | signupform + module Formulaires | Présent | Autre module | champs de collecte de contacts ; fichiers / date / heure hors périmètre | P4 | — |
| EL-W069 | Widget | Connexion | https://elementor.com/help/login-widget-pro/ | non indiquée | account | Présent | Validé (existant) |  | — | widgets-nouveaux |
| EL-W070 | Widget | Shortcode | https://elementor.com/help/shortcode-widget/ | non indiquée | étiquettes dynamiques | Absent | Exclu (justifié) | pas de shortcodes (sécurité) | P4 | — |
| EL-W071 | Widget | HTML | https://elementor.com/help/html-widget/ | non indiquée | html | Présent | Validé (existant) | réservé aux administrateurs | — | editeur-widgets |
| EL-W072 | Widget | Google Maps | https://elementor.com/help/google-maps-widget/ | clé API Google requise | map | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W073 | Widget | Lien intelligent (Contact URL) | https://elementor.com/help/dynamic-contact-url-pro/ | non indiquée | smartlink | Absent | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-W074 | Widget | V4 : Div Block / Flexbox | https://elementor.com/help/div-block-element/ | non indiquée | container | Présent | Validé (existant) |  | — | editeur-canvas |
| EL-W075 | Widget | V4 : Heading / Paragraph / Button / Image / Tabs / YouTube | https://elementor.com/help/heading-element/ | non indiquée | heading, text, button, image, tabs, video | Présent | Validé (existant) |  | — | editeur-widgets |
| EL-W076 | Widget | V4 : SVG | https://elementor.com/help/svg-element/ | non indiquée | — | Absent | Exclu (justifié) | SVG refusé par la médiathèque (peut contenir du script) | P4 | — |
| EL-F001 | Images | Résolution de l'image (Thumbnail, Medium, Medium Large, Large, 1536, 2048, entier) sur 7 widgets + fond + photo de témoignage | https://elementor.com/help/image-widget/ | tailles WordPress | variants.js, nodes.js, inspecteur | Absent | Ajouté et validé | service commun, versions WebP à la demande, repli sur l'original | P1 | images-resolutions* |
| EL-F002 | Images | Visionneuse sur le widget Image seul | https://elementor.com/help/image-widget/ | non indiquée | nodes.js, _node.ejs | Absent | Ajouté et validé |  | P3 | images-resolutions |
| EL-F003 | Galerie | Grille / mosaïque / justifiée, colonnes, ratio, légende au survol, filtres | https://elementor.com/help/gallery-widget/ | non indiquée | nodes.js, landing.css/js | Incomplet | Ajouté et validé |  | P2 | galerie-options |
| EL-F004 | Texte | Contour du texte ; lettrine ; colonnes ; sens d'écriture ; balise du titre | https://elementor.com/help/text-stroke-feature/ | non indiquée | nodes.js (STYLE_PROPS) | Absent | Ajouté et validé |  | P3 | elementor-parite, -3 |
| EL-F005 | Structure | Séparateur de forme haut / bas | https://elementor.com/help/shape-divider/ | non indiquée | nodes.js, landing.css | Absent | Ajouté et validé | 7 formes | P3 | elementor-parite |
| EL-F006 | Structure | Conteneur en accordéon (volets libres) | https://elementor.com/help/accordion-widget-with-nested-elements/ | non indiquée | nodes.js, landing.js | Absent | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-F007 | Fond | Diaporama d'arrière-plan + Ken Burns | https://elementor.com/help/background-slideshow/ | non indiquée | nodes.js, landing.js | Absent | Ajouté et validé |  | P3 | elementor-parite-2 |
| EL-F008 | Fond | Vidéo d'arrière-plan : début / fin, secours, lecture unique | https://elementor.com/help/section-background-video-options/ | non indiquée | nodes.js | Incomplet | Ajouté et validé |  | P3 | elementor-parite-2 |
| EL-F009 | Fond | Dégradé radial, positions, couleurs intermédiaires ; découpe du fond | https://elementor.com/help/gradient-background/ | non indiquée | nodes.js, inspecteur | Incomplet | Ajouté et validé |  | P3 | elementor-parite-2/-3 |
| EL-F010 | Bordures | Types double, gravé, ridge, inset, outset | https://elementor.com/help/border-type/ | non indiquée | nodes.js | Incomplet | Ajouté et validé |  | P3 | elementor-parite-2/-3 |
| EL-F011 | Effets | Filtres (+ inversion) et filtres d'arrière-plan | https://elementor.com/help/style-tab-effects/ | non indiquée | nodes.js, inspecteur | Incomplet | Ajouté et validé |  | P3 | elementor-parite-3 |
| EL-F012 | Masques | Formes Fleur / Croquis / Blob | https://elementor.com/help/mask-option/ | non indiquée | nodes.js | Incomplet | Ajouté et validé |  | P3 | elementor-parite |
| EL-F013 | Mouvement | 14 animations de survol | https://elementor.com/help/hover-animations/ | non indiquée | nodes.js, landing.css | Incomplet | Ajouté et validé | 12 ajoutées | P3 | elementor-parite |
| EL-F014 | Mouvement | Entrée, défilement, souris, sticky, contrôle de fenêtre | https://elementor.com/help/entrance-animations/ | défilement et sticky : Pro | motion.js | Présent | Validé (existant) |  | — | effets-* |
| EL-F015 | Position | Décalage d'ancre ; relative / absolue / fixe / sticky ; z-index | https://elementor.com/help/style-tab-position/ | non indiquée | nodes.js | Incomplet | Ajouté et validé | décalage d'ancre ajouté | P3 | elementor-parite-3 |
| EL-F016 | Page | Magnétisme de défilement (Scroll Snap) | https://elementor.com/help/scroll-snap/ | non indiquée | scrollSnap.js, inspecteur page | Absent | Ajouté et validé |  | P3 | elementor-parite-2 |
| EL-F017 | Popups | Ouverture automatique (chargement, défilement, sortie, inactivité), fréquence, fermeture automatique, verrou, carte et barre non bloquantes | https://elementor.com/help/popups/ | Pro (non tranché) | nodes.js, landing.js | Incomplet | Ajouté et validé |  | P2 | elementor-parite-3 |
| EL-F018 | Popups | Nombre de clics, pages vues, source de trafic | https://elementor.com/help/popups/ | Pro (non tranché) | page-builder.js, landing.js | Absent | Ajouté et validé | déclencheur « après N clics », pages vues minimum, provenance (direct / moteur / réseau social / autre site) | P3 | elementor-parite-3-navigateur |
| EL-F019 | Avancé | Conditions d'affichage : public, programmation, jours / heures, paramètre d'adresse, groupes ET / OU | https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/ | non tranchée | nodes.js, inspecteur | Incomplet | Ajouté et validé |  | P2 | elementor-parite-2/-3 |
| EL-F020 | Avancé | Conditions propres aux modèles d'article (catégorie, auteur, date d'inscription) | https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/ | non tranchée | — | Absent | Non fait (justifié) | modèle d'audience différent | P4 | — |
| EL-F021 | Avancé | ID, classes, attributs personnalisés, z-index, ordre, taille, CSS par élément | https://elementor.com/help/advanced-tab/ | attributs et CSS : Pro | nodes.js | Présent | Validé (existant) |  | — | proprietes-* |
| EL-F022 | Responsive | Trois écrans, héritage descendant, seuils tablette / mobile réglables | https://elementor.com/help/mobile-editing/ | points de rupture : non tranché | siteSettings.js, nodes.js | Présent | Validé (existant) |  | — | site-web-reglages-ecrans |
| EL-F023 | Responsive | Écran supplémentaire « Grand écran » (seuil réglable) avec héritage de l'ordinateur | https://elementor.com/help/mobile-editing/ | non tranchée | nodes.js, siteSettings.js, page-builder.js | Absent | Ajouté et validé |  | P2 | elementor-parite-5 |
| EL-F024 | Responsive | Autres écrans supplémentaires (portable, tablette / mobile paysage) | https://elementor.com/help/mobile-editing/ | non tranchée | — | Absent | Non fait (justifié) | même mécanisme que le grand écran ; non demandé en priorité | P4 | — |
| EL-F025 | Interface | Raccourcis, menu contextuel, structure, sélection multiple, favoris, palette | https://elementor.com/help/hotkeys/ | non indiquée | page-builder.js | Présent | Validé (existant) |  | — | editeur-* |
| EL-F026 | Interface | Coller depuis un autre site ou navigateur | https://elementor.com/help/right-click/ | non indiquée | page-builder.js | Absent | Ajouté et validé |  | P3 | elementor-parite-2 |
| EL-F027 | Interface | Notes (commentaires sur un élément) | https://elementor.com/help/hotkeys/ | non indiquée | page-builder.js, nodes.js | Absent | Ajouté et validé | note privée par élément (500 caractères), pastille dans la Structure, jamais publiée ; pas de fil de discussion | P3 | elementor-parite-4-editeur-navigateur |
| EL-F028 | Historique | Historique de session, révisions, enregistrement automatique | https://elementor.com/help/revision-history-undo-and-redo/ | non indiquée | page-builder.js, pages/index.js | Présent | Validé (existant) |  | — | editeur-* |
| EL-F029 | Styles | Couleurs / polices globales, classes, états, styles enregistrés, composants | https://elementor.com/help/site-settings/ | variables : taille = Pro | styles studio, composants | Présent | Validé (existant) |  | — | styles-*, composants-* |
| EL-F030 | Styles | Export / import des classes et variables seules | https://elementor.com/help/how-to-export-and-import-variables-and-classes/ | non indiquée | page-builder.js | Absent | Ajouté et validé | classes globales : export .json et import avec fusion par nom, validé comme un enregistrement normal | P3 | classes-export-import-navigateur |
| EL-F031 | CMS | Étiquettes dynamiques, boucles, pagination, modèles | https://elementor.com/help/dynamic-tags-pro-2/ | non tranchée | dynamic, querylist | Présent | Validé (existant) |  | — | site-widgets |
| EL-F032 | CMS | Boucle : modèle alterné à une position donnée | https://elementor.com/help/how-do-i-add-an-alternate-template-in-a-loop-grid/ | non indiquée | nodes.js, landing/index.js | Absent | Ajouté et validé | carte insérée après le N-ième résultat (une fois ou tous les N) | P3 | boucle-carte-inseree |
| EL-F033 | IA | Modification par IA respectant le verrou de format | https://elementor.com/help/use-ai-to-add-animation-effects/ | IA : exigences Elementor | studio.js | Présent | Validé (existant) |  | — | format-mise-en-page |
