# Catalogue des widgets natifs Elementor

Date de consultation : 2026-11-05. Renvois `[S#]` vers `ELEMENTOR_REFERENCE_SOURCES.md`.

Lecture des fiches :
- **Détail confirmé** : fiche rédigée à partir de l'article d'aide officiel lu.
- **Détails non consultés** : le widget est confirmé par la liste officielle Gratuit/Pro [S33] ; son article n'a pas été lu. Les paramètres cités entre crochets « (général, non confirmé) » viennent de la connaissance générale et sont à vérifier.
- L'onglet **Avancé** est identique pour tous les widgets [S29] (voir `ELEMENTOR_OVERVIEW.md`, section 5) et n'est donc pas répété ; seules ses particularités sont notées.
- États : sauf mention, seuls Normal et Hover sont documentés ; « Focus » et « Actif » ne sont documentés que pour Tabs/Accordion (couleur active) et boutons de formulaire (non confirmé).
- Chaque fiche se termine par deux lignes à compléter par un autre agent.

Sommaire (nombre de fiches) : Gratuits 33 · Pro 41 · Site / Theme Builder 22 · WooCommerce 23 · soit **119 fiches** (dont 27 avec détail confirmé).

---

# A. WIDGETS GRATUITS (catégories Basic et General) [S33]

Liste officielle « Core » : Heading, Image, Text Editor, Video, Button, Image Box, Testimonials, Icon, Icon Box, Social Icons, Basic Image Gallery, Image Carousel, Icon List, Counter, Progress Bar, Tabs, Accordion, Toggle, Alert, HTML, Shortcode, Menu Anchor, Sidebar, Google Maps, SoundCloud, Divider, Spacer, Columns. Le site officiel cite aussi Container, Grid, Off-Canvas, Rating [S33][S45]. Le nombre exact de widgets gratuits varie selon les pages (28 à 40+).

## 1. Container (conteneur flexbox)
- Catégorie : structure (panneau « Layout »). Disponibilité : gratuit.
- Fonction : boîte de mise en page flexbox ; peut contenir widgets et autres conteneurs (imbrication).
- Structure interne : conteneur > enfants. Onglets Layout / Style / Avancé [S40].
- Paramètres : Layout (direction, justification, alignement, espacement : général, non confirmé) ; Style (fond, bordure, ombre) ; Avancé standard.
- Responsive : réglages par appareil. États : fond/bordure Normal/Hover [S29].
- Animations : toutes (entrée, défilement, souris, sticky Pro) [S1].
- Dépendances : fonction « Flexbox Container » (3.x).
- Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 2. Grid (conteneur grille)
- Catégorie : structure. Gratuit. Fonction : mise en page en grille. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 3. Heading (Titre)
- Catégorie : Basic. Gratuit. Fonction : titre (H1-H6, div, span, p) avec lien. Paramètres (général, non confirmé) : titre, lien, taille, balise HTML ; style : couleur, typographie, contour, ombre, mode de fusion. Animations : entrée, défilement, souris. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 4. Image
- Basic. Gratuit. Image avec légende, lien, lightbox ; style : largeur, opacité, filtres CSS, bordure, ombre ; **survol : Hover Animation et transition** (général, non confirmé pour l'image). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 5. Text Editor (Éditeur de texte)
- Basic. Gratuit. Éditeur de texte riche (WYSIWYG), colonnes de texte, lettrine (général, non confirmé). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 6. Video
- Basic. Gratuit. YouTube, Vimeo, Dailymotion, auto-hébergé ; lecture auto, muet, boucle, superposition d'image, lightbox [S33 cite « Video Lightbox »]. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 7. Button (Bouton)
- Basic. Gratuit. Texte, lien, icône, taille, alignement. Style : typographie, ombre de texte, couleurs Normal/Hover, bordure, **Hover Animation** (liste de 14 familles [S9]), durée de transition. Détails de la fiche non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 8. Image Box
- Basic. Gratuit. Image + titre + description ; position de l'image ; Hover Animation (général, non confirmé). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 9. Icon Box
- Basic. Gratuit. Icône + titre + description ; vues Default/Stacked/Framed ; Hover Animation. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 10. Icon (Icône) : détail confirmé [S32]
- Catégorie : Basic. Gratuit.
- Fonction : une icône vectorielle, avec lien optionnel.
- Structure : une icône dans un enrobage optionnel (vue Stacked = fond plein ; Framed = cadre).
- Contenu : Icon (bibliothèque Font Awesome ; SVG téléversable en Stacked/Framed), View (Default / Stacked / Framed), Shape (Circle / Square, Stacked et Framed seulement), Link (+ options nofollow / nouvelle fenêtre), Alignment (gauche/centre/droite).
- Style : Normal = couleurs (primaire = fond ou cadre ; secondaire = icône), taille (option « Fit to Size » pour SVG non carrés), rotation jusqu'à 360 degrés, remplissage et rayon de bordure (Stacked/Framed). Hover = couleurs, **Hover Animation** (Grow, Pulse, Skew cités en exemples), taille, rotation, remplissage, rayon.
- Responsive : alignement et tailles par appareil (général, non confirmé).
- États : Normal / Hover.
- Animations compatibles : Hover Animation, entrée, défilement, souris.
- Dépendances : aucune. Particularités : vue Default a moins d'options.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 11. Social Icons
- Basic. Gratuit. Liste de réseaux sociaux avec liens, forme, taille, couleurs officielles ou personnalisées, survol. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 12. Basic Image Gallery
- Basic. Gratuit. Galerie d'images en grille avec lightbox. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 13. Image Carousel : détail confirmé [S17]
- Basic (général). Gratuit [S33].
- Fonction : carrousel d'images.
- Structure : galerie d'images > diapositives > légende optionnelle ; navigation flèches/points.
- Contenu : galerie (Create a New Gallery > Insert Gallery) ; Image Resolution (miniature, pleine, personnalisée) ; **Slides to Show 1 à 10** ; Slides to Scroll ; Image Stretch ; Navigation (Arrows / Dots / Both / None ; icône de la bibliothèque ou SVG) ; Link (Media Files avec option Lightbox Oui/Non, Custom URL avec nouvelle fenêtre / nofollow / attributs personnalisés, None) ; Caption (None / Title / Caption / Description) ; Lazy Load ; Autoplay ; Pause on Hover ; Pause on Interaction ; **Autoplay Speed (ms)** ; Infinite Loop ; Animation Speed ; Direction (gauche / droite).
- Style : flèches (position intérieure/extérieure, taille PX/EM/REM, couleur), points (position, taille, couleur, couleur active), image (alignement vertical, **espacement 20 px par défaut**, bordure none/solid/double/dotted/dashed/groove, rayon), légende (alignement, couleur, typographie, ombre, espacement).
- Responsive : nombre de diapositives par appareil (général, non confirmé).
- États : points actifs ; flèches Normal/Hover (non confirmé).
- Animations : transition de diapositive, autoplay.
- Dépendances : bibliothèque Swiper (non confirmé).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 14. Icon List
- Basic. Gratuit. Liste d'éléments avec icônes et liens ; disposition verticale ou en ligne. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 15. Counter (Compteur) : détail confirmé [S15]
- Basic. Gratuit.
- Fonction : nombre animé qui compte de la valeur de départ à celle de fin (croissant ou décroissant).
- Structure : [préfixe] nombre [suffixe] + titre (optionnel).
- Contenu : Starting Number, Ending Number, Number Prefix, Number Suffix, **Animation Duration (ms)** (exemple officiel : 4000), Thousand Separator (oui/non) et Separator (défaut, point, espace), Title, Title HTML Tag (H1-H6, div par défaut, span, p).
- Style : Title Position (dessus, dessous, gauche, droite), alignement du titre, Title Gap (masqué sans titre), Number Position (gauche/droite/centre, option stretch), couleur / typographie / contour / ombre pour le nombre et pour le titre.
- Responsive : positions par appareil (général).
- États : aucun état hover documenté.
- Animation : le compte est la seule animation. Déclenchement (entrée en vue ?) et courbe : non documentés → non confirmé.
- Particularités : la section titre disparaît du Style s'il n'y a pas de titre.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 16. Progress Bar : détail confirmé [S16]
- Basic. Gratuit.
- Fonction : barre de progression animée.
- Contenu : Title, Title HTML Tag (H1-H6, p, span, div), Percentage, Display Percentage (interrupteur), Inner Text.
- Style : couleur de barre, couleur de fond, couleur du texte intérieur ; titre : couleur, typographie.
- Animation : « animée » selon l'article, mais déclencheur, durée et courbe non documentés → non confirmé.
- Responsive/états : non documentés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 17. Tabs (Onglets classiques) : détail confirmé [S36]
- General/Basic. Gratuit.
- Contenu : Tabs Items (titre + contenu ; **2 éléments par défaut**), Position (horizontal / vertical), Alignment (start, center, end, stretch).
- Style : onglets (largeur et couleur de bordure, fond), titre (couleur, **couleur active**, typographie, contour, ombre), contenu (couleur, typographie, ombre).
- États : Normal / Actif. Animation d'ouverture : non documentée.
- Remarque : une version imbriquée existe (voir Nested Tabs).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 18. Accordion : détail confirmé [S37]
- Gratuit. Contenu : Accordion Items (titre + description), Icon, Active Icon, Title HTML Tag (H1-H6, DIV), **FAQ Schema** (balisage structuré).
- Style : bordure, titre (fond, couleur, couleur active, typographie, contour, ombre, remplissage), icône (alignement gauche/droite, couleurs, espacement), contenu (fond, couleur, typographie, ombre, remplissage).
- États : Normal / Actif. Animation d'ouverture et durée : non documentées.
- Si l'Accordéon imbriqué est activé, il remplace Accordion et Toggle dans le panneau [S44].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 19. Toggle : détail confirmé [S38]
- Gratuit. Même structure que l'Accordion, mais plusieurs éléments peuvent être ouverts ; icône : None / SVG / bibliothèque ; **FAQ Schema : un seul widget Toggle par page**. Style supplémentaire : Space Between, Box Shadow (couleur, position, flou, étendue, inset/outline).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 20. Alert
- Gratuit. Boîte de message (type info, succès, avertissement, danger), titre, description, bouton de fermeture. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 21. HTML
- Gratuit. Bloc de code HTML libre. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 22. Shortcode
- Gratuit. Insertion d'un shortcode WordPress. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 23. Menu Anchor
- Gratuit. Ancre invisible pour liens internes (par ID). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 24. Sidebar
- Gratuit (WordPress). Affiche une zone de widgets WordPress. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 25. Google Maps
- Gratuit. Carte intégrée par adresse, zoom, hauteur. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 26. SoundCloud
- Gratuit. Intégration d'un lecteur SoundCloud. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 27. Divider
- Gratuit. Séparateur horizontal (style, poids, couleur, texte/icône central). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 28. Spacer
- Gratuit. Espace vertical réglable. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 29. Testimonial (unique)
- Gratuit (« Testimonials » [S33]). Une citation avec image, nom, titre, mise en page. Détails non consultés (page d'aide existante : /help/testimonial-widget/).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 30. Off-Canvas
- Gratuit selon la liste Core [S33] (cité aussi dans l'index d'aide [S45]). Panneau latéral glissant ouvert par un déclencheur. Détails non consultés ; comportement d'ouverture et animation : non confirmés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 31. Rating (Star Rating)
- Gratuit (étoiles de notation, valeur et échelle). Cité dans [S45]. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 32. Image Hover / Ken Burns zoom
- Pas un widget distinct : l'effet de zoom Ken Burns appartient aux Slides (Pro) [S23] ; le survol d'image passe par Hover Animation [S9].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 33. WordPress widgets
- Catégorie « WordPress » : widgets natifs WordPress (recherche, pages récentes, etc.) [S41]. Liste non lue.

Équivalent Kolakisa : à compléter

Priorité : à compléter

---

# B. WIDGETS PRO (catégorie Pro) [S33]

## 34. Lottie : détail confirmé [S2]
- Catégorie Pro, Pro. Fonction : joue une animation vectorielle Lottie (.json).
- Structure : conteneur d'animation + légende optionnelle ; lien possible.
- Contenu : Source (External URL / Media File .json), Alignment, Caption (Custom Caption si URL externe), Link, **Trigger** (Viewport avec pourcentage visible, On Click, On Hover avec Hover Area Animation / Column / Section / Container et réglage On Hover Out, Scroll avec curseur de viewport, None), **Loop** (Default = joue la boucle une fois puis s'arrête ; Pause ; Reverse), Play Speed, Start Point / End Point (plage de lecture), Reverse (Oui/Non), Renderer (SVG = plus de contrôle ; Canvas = plus rapide), Lazy Load.
- Style : Width, Max Width, Normal / Hover (Transition Duration), Opacity, CSS Filter (Blur, Brightness, Contrast, Saturation, Hue).
- Responsive : largeur par appareil (général).
- États : Normal / Hover.
- Animations compatibles : entrée, défilement, Hover.
- Avertissement : n'utiliser que des .json fiables.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 35. Animated Headline : détail confirmé [S19]
- Pro. Deux styles : **Highlighted** (formes : Circle, Curly, Underline, Double, Double Underline, Underline Zigzag, Diagonal, Strikethrough, X ; textes avant / surligné / après) et **Rotating** (Typing, Clip, Flip, Swirl, Blinds, Drop-in, Wave, Slide, Slide Down ; liste de textes).
- Réglages : Infinite Loop (Oui = répété ; Non = une fois figé), Duration (ms), Delay (ms, Highlighted + boucle infinie), Link, Alignment, HTML Tag (H1-H6, Div, Span, Paragraph).
- Style : forme (couleur, largeur, Bring to Front, Rounded Edges) ; texte avant/après et texte animé : couleur, typographie, contour.
- États : aucun. Valeurs par défaut non documentées.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 36. Testimonial Carousel : détail confirmé [S20]
- Pro. Slides (texte, image, nom, titre ; ajout, duplication, suppression, réordonnancement) ; Skin Default / Bubble ; Layout Image Inline / Stacked / Above / Left / Right ; Alignment ; Slides Per View 1-10 ; Slides to Scroll 1-10 ; Width ; Arrows ; Pagination None / Dots / Fraction / Progress ; Transition Duration (ms) ; Autoplay ; Autoplay Speed (ms) ; Infinite Loop ; Pause on Hover / Interaction ; Image Resolution ; Lazyload.
- Style : slides (espace, fond, bordure, rayon, remplissage), contenu, nom, titre, image (taille, bordure, rayon), flèches, points (couleur active), bulle (fond, remplissage, bordure) pour la peau Bubble.
- Responsive : slides par vue et largeur par appareil (blog officiel de lancement, via recherche).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 37. Media Carousel : détail confirmé [S21]
- Pro. Peaux **Carousel / Slideshow / Coverflow** ; 5 diapositives factices au départ ; type Image ou Vidéo (lightbox activée par défaut) ; Effect Slide / Fade / Cube (Carousel et Slideshow) ; Slides Per View 1-10 ; vignettes du Slideshow avec ratio 1:1, 4:3, 16:9, 21:9 et option Centered Slides ; pagination (Carousel) ; overlay None / Text / Icon (Search, Plus, Eye, Link) avec animation ; Image Fit Cover / Contain / Auto ; Lazyload ; autoplay, vitesse, boucle, pauses.
- Style : slides, flèches, pagination (position, taille, couleurs), icône lecture (vidéo), overlay, lightbox (couleurs, largeur vidéo).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 38. Reviews : détail confirmé [S30]
- Pro. Carrousel d'avis : image, nom, titre, note **0.0 à 5.0**, icône (Font Awesome ou Unicode), lien, texte ; Dynamic Tags (ACF, WooCommerce) ; mise en page de carrousel (1-10 diapositives, défilement 1-10, largeur) ; flèches, pagination None/Dots/Fraction/Progress, durées, autoplay, boucle, lazy load.
- Style : carte, en-tête, séparateur, texte, image, icône sociale, étoiles (icône, style non rempli solide/contour, taille, espacement, couleurs), navigation.
- Note : l'autoplay peut être limité par la politique de Chrome.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 39. Hotspot : détail confirmé [S22]
- Pro. Image de fond avec points chauds.
- Contrôles : fond (image, résolution, alignement) ; par point : libellé texte à la place de l'icône, lien (options dynamiques ; peut ouvrir un popup au lieu d'une info-bulle), icône (bibliothèque ou SVG), taille personnalisée, contenu d'info-bulle (éditeur de texte, HTML autorisé) ; position : côté de départ horizontal (gauche/droite) et décalage %, côté vertical (haut/bas) et décalage %, position/largeur d'info-bulle personnalisées (priment sur le général), retour à la ligne, **animation d'icône**, **animation séquencée (durée en ms)** ; info-bulle générale : position (gauche/haut/droite/bas), **Trigger Hover ou Click**, animation (liste non précisée), durée (ms).
- Style : fond (largeur px/%/vw, hauteur, opacité), point (couleur, taille, typographie, largeur, boîte, remplissage, rayon, ombre), info-bulle (texte, typographie, alignement, boîte).
- Avancé : aucun réglage propre. Responsive : positions en pourcentage (adaptatives).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 40. Slides : détail confirmé [S23]
- Pro. Chaque diapositive : fond (couleur ; image avec Auto / Cover / Contain ; **Ken Burns** In/Out ; superposition avec mode de fusion), contenu (titre, description, texte du bouton, lien sur bouton ou diapositive, Dynamic Tags), style personnalisé par diapositive (positions, alignement, couleur, ombre).
- Widget : Height, Title/Description HTML Tag, Navigation (flèches/points/les deux/aucune), Autoplay, Pause on Hover/Interaction, Autoplay Speed, Infinite Loop, **Transition Slide ou Fade**, Transition Speed, **Content Animation (None, Down, Up, Right, Left, Zoom)**.
- Style : largeur du contenu, remplissage, positions, titre, description, bouton (tailles XS à XL, états Normal/Hover, fond uni ou dégradé), flèches, points.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 41. Call to Action : détail confirmé [S18]
- Pro. Peaux **Classic** et **Cover**. Élément graphique None / Image / Icon (vues Default / Stacked / Framed). Titre et description avec balises HTML ; texte du bouton ; lien (Apply Link On : Whole Box ou Button Only) ; **Ribbon** (texte, position gauche/droite).
- Style : boîte (hauteur, alignement, position verticale, remplissage), image (Classic), titre, description, couleurs Normal/Hover, bouton, ruban.
- **Hover** : Classic = Hover Animation sur l'image, superposition de couleur, filtres CSS, mode de fusion, durée de transition. Cover = animation du contenu image avec durée et « Sequenced Animation » ; animation du fond (zoom avant/arrière, déplacement gauche/droite/haut/bas).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 42. Flip Box : détail confirmé [S24]
- Pro. Face avant : élément graphique (None/Image/Icon), titre, description, fond (couleur, image, dégradé). Face arrière : mêmes options + texte de bouton, lien (adresse complète http/https), Apply Link On (bouton ou boîte).
- Réglages : balises HTML, Height, Border Radius, **Flip Effect : flip, slide, push, zoom in, zoom out, fade**, **Flip Direction** (droite, gauche, haut, bas ; flip et slide seulement), **3D Depth**.
- Style : avant/arrière (remplissage, alignement, position verticale, bordure), icône, image, titre, description, bouton (Normal/Hover, durée de transition).
- Limite : Safari mobile gère mal la 3D ; incompatible avec Nav Menu sur iOS.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 43. Price List : détail confirmé [S26]
- Pro (Advanced+ selon la liste officielle [S33]). Éléments : prix, titre, description, balises HTML, image, lien. Style : titre, prix, séparateur (solid, dotted, dashed, double, none ; poids, couleur, espacement), image (résolution, rayon, espacement), éléments (écart des lignes, alignement vertical). Pas d'animation.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 44. Countdown : détail confirmé [S25]
- Pro. Type **Due Date** ou **Evergreen Timer** (heures / minutes ; accepte des Dynamic Tags) ; View Block / Inline ; afficher/masquer jours, heures, minutes, secondes et libellés (personnalisables) ; **Actions After Expire** : Redirect (URL), Hide, Show Message.
- Style : boîtes (largeur, fond, bordure none/solid/double/dotted/dashed/grooved, rayon, espace, remplissage), chiffres et libellés (couleur, typographie), message d'expiration (alignement, couleur, typographie).
- Particularité : Evergreen = même durée pour chaque visiteur.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 45. Text Path : détail confirmé [S27]
- Pro (déclaré dans l'aide ; absent de la liste Pro S33 → statut à vérifier). Contrôles : Text (options dynamiques), **Path Type : Wave, Arc, Circle, Line, Oval, Spiral, Custom** (Custom = SVG téléversé), Link, Alignment, Text Direction (Default / RTL / LTR), Show Path.
- Style : conteneur (taille px/%/em/rem/vw, rotation), texte (typographie, espacement des mots, point de départ, couleur Normal/Hover), chemin (couleur Normal/Hover), contour (couleur, épaisseur px).
- Pas d'animation de défilement du texte documentée (aucun effet « marquee »).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 46. Progress Tracker : détail confirmé [S34][S42]
- Pro (Pro 3.5). Contenu : **Tracker Type Horizontal ou Circular** (le blog évoque « vertical » : divergence), **Progress Relative To** (Entire Page / Post Content / Selector #id ou .class), Direction, Percentage (afficher/masquer).
- Style : taille ; indicateur (couleur, largeur px, alignement) ; fond (couleur, largeur) ; pourcentage (couleur, typographie, ombre).
- Avancé : positionnement et sticky (pour le fixer en haut de page).
- Comportement : se remplit en suivant le défilement.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 47. Loop Carousel : détail confirmé [S28]
- Pro, introduit en 3.11 [S44]. Layout : modèle d'élément de boucle, nombre de diapositives, à afficher, au défilement, Equal Height. Requête : Source (Posts, Pages, Landing Pages, Manual Selection, Current Query, Related), Date, Order By (Date, Title, Menu Order, Last Modified, Number of comments, Random), Order, Ignore Sticky Posts, Query ID. Réglages : Autoplay, Scroll Speed (ms), Pause on hover / interaction, Infinite scroll, Transition Duration (ms), Direction. Navigation : flèches (icônes, positions horizontale / verticale), pagination Dots / Fraction / Progress bar. Style : écart, navigation (taille, Normal/Hover, couleur, intérieur/extérieur), pagination.
- Dépendance : fonction « Loop » activée.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 48. Loop Grid
- Pro. Grille d'éléments de boucle (requête + modèle) ; pagination. Introduit avant 3.11. Détails non consultés (voir index d'aide [S45]).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 49. Carousel (Nested Carousel) : détail confirmé [S31][S44]
- Pro, 3.14, nécessite Flexbox Container + Nested Elements. Chaque diapositive est un conteneur.
- Contenu : Slides on display, Slides on scroll, Equal Height, Autoplay, Scroll Speed (ms), pauses, Infinite scroll, Transition Duration (ms), Direction, **Offset Slides** (None / Both / Left / Right), flèches (icône SVG ou bibliothèque, positions), pagination Dots / Fraction / Progress.
- Style : diapositives (écart, fond, bordure, rayon, remplissage), navigation (taille, Normal/Hover, couleur, fond, ombre, rayon, remplissage, intérieur/extérieur), pagination.
- Particularité : autoplay et boucle infinie inactifs dans l'éditeur.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 50. Nested Tabs (Tabs with nested elements) : détail confirmé [S39]
- Pro, 3.10, expérience Nested Elements. Éléments : titre, icône, icône active, ID CSS ; Direction (colonne/ligne, largeur en px/%) ; Justify ; Align Title ; Horizontal Scroll ; **Breakpoint** (mobile < 767 px, tablette < 1024 px, ou None) où les onglets passent en accordéon.
- Style : écart entre onglets, distance du contenu, fond / bordure / ombre / rayon / remplissage avec états **Normal, Hover, Actif** et durée de transition au survol ; titre ; icône.
- Avancé : CSS ID non supporté.
- V4 : Atomic Tabs, avec interactions d'entrée sur chaque partie [S4].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 51. Nested Accordion
- Pro, 3.15 [S44, recherche]. Chaque élément est un conteneur ; premier élément ouvert ou tous fermés ; limite du nombre d'éléments ouverts simultanément. Remplace Accordion + Toggle dans le panneau si activé. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 52. Forms (Form)
- Pro. Formulaire (champs, étapes, intégrations, actions après envoi, soumissions). Détails non consultés ; états focus/erreur : non confirmés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 53. Login
- Pro. Formulaire de connexion. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 54. Posts
- Pro. Liste d'articles (peaux Classic, Cards, Full Content), pagination, requête. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 55. Portfolio
- Pro. Grille filtrable (Masonry) de projets/articles. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 56. Gallery
- Pro. Galerie multiple, filtrable, Masonry, justifiée. Détails non consultés (page : /help/gallery-widget/).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 57. Nav Menu
- Pro. Menu de navigation (horizontal / vertical / déroulant), ancre, point de rupture mobile. Incompatible 3D Flip Box sur iOS [S24]. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 58. Share Buttons
- Pro. Boutons de partage social. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 59. Table of Contents
- Pro. Sommaire automatique à partir des titres. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 60. Video Playlist
- Pro (3.3). Liste de lecture de vidéos. Détails non consultés (blog Pro 3.3, via recherche).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 61. Code Highlight
- Pro. Bloc de code avec coloration syntaxique. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 62. Blockquote
- Pro. Citation avec bouton Tweet. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 63. Facebook widgets (Button, Comments, Embed, Page)
- Pro. Intégrations Facebook. Détails non consultés. Dépendances : services tiers (Facebook).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 64. Price Table
- Pro (Advanced+) [S33]. Tableau de tarifs avec fonctions, ruban, bouton. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 65. Menu Cart
- Pro (Advanced+), WooCommerce. Panier miniature. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 66. Template (Shortcode de modèle)
- Pro. Insère un modèle enregistré. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 67. Global Widget
- Pro (liste S33). Widget global réutilisable. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 68. Embed Anywhere
- Pro (liste S33). Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 69. Search (Search Form)
- Pro. Champ de recherche. Cité dans l'index d'aide [S45]. Détails non consultés.

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 70. Taxonomy Filter
- Pro (3.15). Filtre par catégories/étiquettes pour Loop Grid. Détails non consultés [S44, S45].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 71. Social proof (preuve sociale)
- Aucun widget officiel nommé « Social Proof » trouvé. Les widgets approchants : Reviews [S30], Testimonial Carousel [S20], Testimonial, Star Rating, Facebook widgets. Notification de preuve sociale en temps réel : extensions tierces (non confirmé).

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 72. Scroll Snap
- Pas un widget : réglage de section (Pro 3.5) Snap Position Top / Center / Bottom [S42].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 73. Marquee / Typing
- Aucun widget Marquee natif confirmé. L'effet de frappe existe dans Animated Headline (style Rotating > Typing) [S19].

Équivalent Kolakisa : à compléter

Priorité : à compléter

## 74. Custom Fonts / Ken Burns / Scrolling Effects
- Fonctions Pro, non widgets. Voir `ELEMENTOR_ANIMATIONS_REFERENCE.md`.

Équivalent Kolakisa : à compléter

Priorité : à compléter

---

# C. SITE / THEME BUILDER (catégorie « Site » = `theme-elements`, Pro) [S41][S33]

Widgets de gabarit de site, utilisables dans les modèles d'en-tête, de pied, d'article unique et d'archive. Détails non consultés pour chacun.

Chaque fiche : Pro, catégorie Site, dépendance au Theme Builder, contenu dynamique ; paramètres Style standards.

75. **Site Logo** : logo du site (Réglages du site). 76. **Site Title** : titre du site. 77. **Page Title** : titre de la page. 78. **Nav Menu** (voir 57). 79. **Search Form**. 80. **Post Title**. 81. **Post Excerpt**. 82. **Post Content**. 83. **Featured Image**. 84. **Post Info** (méta : auteur, date, catégories). 85. **Post Navigation** (précédent / suivant). 86. **Post Comments**. 87. **Author Box**. 88. **Archive Title**. 89. **Archive Posts**. 90. **Breadcrumbs**. 91. **Sitemap**. 92. **Blog Pagination**. 93. **Login** (voir 53). 94. **Menu Cart**. 95. **Table of Contents**. 96. **Loop Grid / Loop Carousel** (modèles de boucle).

Pour chacune des fiches 75 à 96 :

Équivalent Kolakisa : à compléter

Priorité : à compléter

Remarque : l'index [S33] liste « Archive Title, Archive Posts, Breadcrumbs, Featured Image, Site Logo, Site Title, Page Title, Post Content, Post Navigation, Post Comments, Post Info, Post Excerpt, Author Box, Sitemap, Blog Pagination, Header & Footer Builder, Dynamic single post & archive page design ». Les widgets « Post Title » et « Search Form » sont confirmés par la connaissance générale seulement.

---

# D. WOOCOMMERCE (catégorie `woocommerce-elements`, Pro Advanced+) [S33][S46]

Exigences : Elementor Pro 2.1+ et WooCommerce 3.4+ [S46]. Le constructeur WooCommerce n'est pas dans l'offre Essential [S33]. Les widgets sont répartis en « Single » (page produit) et « General » [S46]. Détails non consultés.

Liste officielle [S33] : Product Price, Product Title, Product Images, Upsells, Short Description, Product Meta, Product Stock, Product Rating, Product Data Tabs, Product Related, Archive Products, WC Products, WC Elements, WC Categories, WC Add to Cart, WC Breadcrumbs, WC Additional Information, WC Product Content, WC Archive Description, WC Checkout, WC My Account, WC Purchase Summary, WC Notice. Compléments hors liste (général, non confirmé) : Menu Cart, Cart, Product Add to Cart.

Fiches 97 à 119 (une par nom ci-dessus, dans l'ordre) : Product Price, Product Title, Product Images, Upsells, Short Description, Product Meta, Product Stock, Product Rating, Product Data Tabs, Product Related, Archive Products, Products, WC Elements, Product Categories, Add to Cart, Breadcrumbs, Additional Information, Product Content, Archive Description, Checkout, My Account, Purchase Summary, Notices.

Pour chacune :

Équivalent Kolakisa : à compléter

Priorité : à compléter

---

# E. Particularités transverses
- **Ce qui est animable dans chaque widget** : voir `ELEMENTOR_ANIMATIONS_REFERENCE.md`.
- **Extensions tierces** : toute « animation de marquee », « texte défilant », « reveal au défilement de texte mot par mot » ou « compteur de preuve sociale » relève d'add-ons non officiels (The Plus Addons, Xpro, HT Mega, Essential Addons).
- **Editor V4** : les widgets atomiques (Heading, Paragraph, Button, Image, Div Block, Flexbox, Tabs, Forms…) sont documentés dans les articles de blog 3.34 / 4.0 [S3][S4], non dans ce catalogue.
