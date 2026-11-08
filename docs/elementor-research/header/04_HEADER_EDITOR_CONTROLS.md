# 04 - Contrôles d'éditeur applicables à un header (Elementor)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION]. « NON VÉRIFIÉ » = non confirmé par une page lue. Aucun code propriétaire.
Deux modèles : **V3** (onglets Content / Style / Advanced) et **V4 Atomic** (onglets General / Style ; statut exact NON VÉRIFIÉ, voir 03). Source : https://elementor.com/help/what-are-the-differences-between-the-elementor-editor-3-x-and-v4/

## 1. Architecture des contrôles (documentation développeur)
- Trois familles : contrôle régulier, contrôle responsive, contrôle de groupe ; conteneurs de contrôles : Control Section, Popovers, Tabs. Arguments : labels, sélecteurs CSS, selectors dictionary, affichage conditionnel, global style, contenu dynamique, frontend available, bouton IA. https://developers.elementor.com/docs/editor-controls/
- Cinq classes de base : Data (valeur unique), Multi Value, Unit, UI (aucune valeur), Group. http://developers.elementor.com/docs/editor-controls/control-types
- Types précis (TEXT, SELECT, SLIDER, COLOR, MEDIA, REPEATER, CHOOSE, NUMBER, SWITCHER, URL, ICONS, WYSIWYG, TEXTAREA) : confirmés seulement par un site tiers -> NON VÉRIFIÉ officiellement. Les pages officielles lues confirment Text, Number (min/max/step), Slider, Color, Media, Choose, Icons (l'ancien Icon est déprécié). https://developers.elementor.com/docs/editor-controls/regular-control
- Contrôles de groupe confirmés : Typography (Group_Control_Typography : taille, famille, graisse, transformation, style, hauteur de ligne, espacement des lettres) et Border (type, largeur, couleur) ; Text Shadow et Box Shadow cités sans détail. `fields_options` change libellés/défauts, `exclude` retire des champs. http://developers.elementor.com/docs/editor-controls/group-control
- Contrôles responsive : `add_responsive_control()`, `devices`, valeurs par défaut `default` / `tablet_default` / `mobile_default`, `selectors` avec `{{WRAPPER}}`, `{{SIZE}}{{UNIT}}`, `{{TOP}}{{RIGHT}}{{BOTTOM}}{{LEFT}}`, `prefix_class`. http://developers.elementor.com/docs/editor-controls/responsive-control
- Jetons de sélecteurs : `{{WRAPPER}}`, `{{ID}}` (déconseillé), `{{VALUE}}`, `{{SIZE}}`/`{{UNIT}}`, `{{TOP}}...`, `{{URL}}`, préfixes `{{nom.VALUE}}`. https://developers.elementor.com/docs/editor-controls/selectors
- Conditions : `condition` simple (égalité, `!` suffixe = différent, tableau = OU, plusieurs clés = ET) ; `conditions` avancé : `relation` (and/or) + `terms` (`name`, `value`, `operator`) ; opérateurs `==, !=, !==, in, !in, contains, !contains, <, <=, >, >=, ===` ; imbrication ; dans un repeater un champ interne ne peut pas dépendre d'un contrôle principal. http://developers.elementor.com/docs/editor-controls/conditional-display
- Contrôle responsive + breakpoints supplémentaires : jusqu'à 7 contrôles générés par contrôle responsive ; les conditions dépendant d'un contrôle responsive sont ignorées. https://developers.elementor.com/additional-custom-breakpoints-technical-details-and-gotchas/

## 2. Onglet Layout du conteneur (V3)
Voir 03 section 2 (direction, justify, align, gap, wrap, width, min-height, overflow, HTML tag) et section 4 pour Grid.

## 3. Onglet Style du conteneur (V3)
Sources : https://elementor.com/help/container-style-tab-settings/ ; https://elementor.com/help/flexbox-settings-overview
- **Background** : type = color, gradient, image ou slideshow ; Color (sélecteur) ; Image (médiathèque) ; slideshow = plusieurs images. L'article ne détaille pas hover, vidéo, sous-options de dégradé. https://elementor.com/help/container-style-tab-settings/
  - Section (ancien modèle) : Classic, Gradient, Video, Slideshow. https://elementor.com/help/section-overview/
  - Normal/Hover séparés (onglet Advanced > Background) : https://elementor.com/help/advanced-tab/
  - Gradient : « deux couleurs ou plus, avec type, angle et position » (idem). Sous-options vidéo (URL, début/fin, boucle, lecture unique, image de repli) : NON VÉRIFIÉ.
- **Background Overlay** : type color / gradient / image ; Color ; Image ; Opacity (curseur ou saisie). Mode de fusion et filtres CSS de l'overlay : NON VÉRIFIÉ.
- **Border** : type solid, double, dotted, dashed, grooved ; Width (px, em, %) ; Color ; Radius (px, em, %) ; **Box Shadow** (icône crayon ; sous-champs non listés par cet article. L'article Advanced dit « couleur, flou, étalement, position ». Détail horizontal/vertical NON VÉRIFIÉ en V3).
- **Shape Divider** : Top ou Bottom ; Type (liste de formes) ; Color ; Width ; Height ; Flip ; Bring to Front. https://elementor.com/help/shape-divider/ (cité par recherche)
- Pas d'états hover pour le conteneur dans cet article : voir Advanced > Background/Border (Normal/Hover).

## 4. Onglet Advanced (V3) - tous les groupes
Source : https://elementor.com/help/advanced-tab/ (+ https://elementor.com/help/container-advanced-tab-settings/)
- **Layout** : Margin, Padding (PX, EM, REM, %), Width (Auto / Full Width 100 % / Inline Auto / Custom en PX, %, VW), Align Self (Start, Center, End, Baseline, Stretch), Order, Size (None, Grow, Shrink, Custom grow/shrink), Position (Default, Absolute, Fixed + orientations/offsets), Z-Index, CSS ID, CSS Classes, Display Conditions (paramètres non précisés par la page ; critères connus par ailleurs : rôles utilisateur, titres de page, dates - https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/) [Display Conditions PRO - NON VÉRIFIÉ].
- **Motion Effects** : Scrolling Effects [PRO], Mouse Effects (Tilt, Track), Sticky [PRO], Entrance Animation. Détail section 6.
- **Transform** (widgets uniquement ; ni sections ni colonnes ni conteneurs d'après https://elementor.com/help/css-transform/ - NON VÉRIFIÉ pour les conteneurs récents) : Rotate (degrés ; option 3D Rotate avec axes X/Y et Perspective en px), Offset X/Y (% ou px), Scale (% ; verrou de proportions), Skew X/Y, Flip Horizontal / Vertical, Anchor Points X (gauche, centre, droite) / Y (haut, centre, bas) ; états Normal et Hover (durée de transition en hover) ; valeurs par breakpoint.
- **Background** : Normal / Hover ; Classic (couleur) ; Gradient (type, angle, position).
- **Border** : Normal / Hover ; type None, Solid, Double, Dotted, Dashed, Grooved ; Radius ; Box Shadow (couleur, flou, étalement, position).
- **Mask** : interrupteur ; Shape (formes prédéfinies ou SVG personnalisé) ; Size (Fit, Fill, Custom) ; Position (Top, Right, Bottom, Left, Center) ; Repeat.
- **Responsive** : Hide On Desktop / Tablet Portrait / Mobile Portrait. Voir 07.
- **Attributes** [PRO] : attributs HTML personnalisés. Format `key|value` une ligne par attribut (https://elementor.com/help/custom-attributes-pro/) ; la page Advanced écrit `attribute=value` : contradiction, privilégier la page spécifique. Plusieurs valeurs séparées par espace. Pas d'attribut JS (onclick) sur les liens (https://elementor.com/help/custom-link-attributes/).
- **Custom CSS** [PRO] : mot-clé `selector` = enveloppe de l'élément ; `selector img`, `selector .elementor-button` pour les enfants ; classes via CSS Classes ; `!important` parfois nécessaire. https://elementor.com/help/how-to-use-selector-in-the-custom-css-tab/ . CSS de page / de site : NON VÉRIFIÉ ici (Site Settings > Custom CSS existe, https://elementor.com/help/site-settings/).

## 5. Éditeur V4 : onglet Style (sections)
Sources : https://elementor.com/help/style-tab-typography/ ; https://elementor.com/help/style-tab-border/ ; https://elementor.com/help/style-tab-effects/ ; https://elementor.com/help/style-tab-position/ ; https://elementor.com/help/element-states/
- **Layout, Spacing** (padding/margin avec verrou des 4 côtés ; libellés physiques, propriétés logiques), **Size**, **Position** (voir 03), **Typography**, **Background**, **Border**, **Effects**.
- **Typography** : famille, graisse 100 a 900, taille, alignement (gauche, droite, centre, justifié), couleur ; sous « Show more » : Line height, Letter spacing, Word spacing, Columns, Column gap, Line decoration (None, Underline, Strikeout, Overline), Text transform (None, Capitalize, Uppercase, Lowercase), Direction (LTR/RTL), Font style (italique), Text stroke (largeur + couleur).
- **Border** : type Solid, Dashed, Dotted, Double, Groove, Ridge, Inset, Outset ; largeur (bouton Adjust borders = 4 côtés) ; couleur ; rayon (Adjust corners = 4 coins).
- **Effects** :
  - Opacity.
  - Box Shadow : couleur, Position Outset/Inset, Horizontal, Vertical, Blur, Spread ; plusieurs couches (+).
  - Filters (empilables) : Blur (px), Brightness, Contrast, Hue Rotate, Saturate, Grayscale (%), Invert, Sepia, Drop shadow.
  - Backdrop Filters : mêmes filtres, appliqués à l'arrière-plan.
  - Transform : Move (X/Y), Scale, Rotate (axes dont Z), Skew (X, Y, Z) ; un seul de chaque type par élément.
  - Transition : par défaut toutes propriétés en 200 ms ; durée par propriété [PRO] (ex. Font Color 0 ms, Background 200 ms, Border 400 ms, Box Shadow 600 ms) avec recherche de propriété.
  - Mix Blend Mode : Exclusion, Difference, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge ; et Hue, Luminosity, Soft light, Hard light, Saturation, Color (l'article en liste d'autres sous un titre erroné ; liste complète NON VÉRIFIÉ).
- **États** (pseudo-classes) : Hover, Focus, Active, Selected (onglets seulement). Sans état = style de base. Ajout : champ Classes > ellipses > choix de l'état ; couleur verte (classe globale) ou rose (classe locale).
- **Classes** : chaque élément a une classe locale non supprimable ; classes globales nommées réutilisables ; Class Manager (priorité, conflits). Variables et filtres introduits en alpha 3.31 : https://elementor.com/blog/elementor-331-v4-alpha-variables-filters/ (statut actuel NON VÉRIFIÉ).
- V4 : arrière-plans en couches, dégradés à couleurs illimitées, ombres en couches, sticky sur 4 côtés ; plus de HTML libre ni de boutons « reset ».
- Attributs V4 : onglet General > Attribute, nom + valeur, étiquettes dynamiques supportées, [PRO].

## 6. Motion Effects, animations d'entrée, hover
- Emplacement : Advanced > Motion Effects. [PRO] pour Scrolling/Sticky. https://elementor.com/help/motion-effects/
- **Scrolling Effects** : Vertical Scroll (parallaxe), Horizontal Scroll, Transparency, Blur, Rotate, Scale ; X/Y Anchor Point (Rotate/Scale seulement) ; Apply Effects On (Desktop, Tablet, Mobile) ; Effects Relative To (Default/Viewport = hauteur d'écran visible ; Entire Page = hauteur totale de la page) ; Viewport = plage de défilement en % de hauteur d'écran ; Rotate : direction To Left / To Right, Speed (curseur). https://elementor.com/help/scrolling-effects-rotate/ . Vitesse/direction des autres effets : NON VÉRIFIÉ.
- **Mouse Effects** (bureau seulement) : Mouse Track, 3D Tilt. Paramètres fins (direction, vitesse) NON VÉRIFIÉ.
- **Sticky** [PRO] : Sticky (Top/Bottom), Sticky On, Offset, Effects Offset, Stay In Column. Classe `elementor-sticky--effects` appliquée après Effects Offset (https://elementor.com/help/sticky-transparent-header/ ; ce CSS ne fonctionne qu'avec sections/colonnes d'après la page).
- Effets de mouvement désactivés si « réduire les animations » est actif. Risque de conflit animation d'entrée + effet de mouvement ; bug Safari avec Mouse Track (page motion-effects).
- **Entrance Animation** (37 annoncées, 36 nommées) : Fading (Fade in, up, down, left, right), Zooming (id.), Bouncing (id.), Sliding (up, down, left, right), Rotating (Rotate in, down left, down right, up left, up right), Attention seekers (Bounce, Flash, Pulse, Rubber band, Shake, Head shake, Swing, Tada, Wobble, Jello), Light speed in, Roll in. Réglable par appareil, valeur « None ». Durée et délai : non couverts par l'article -> NON VÉRIFIÉ (valeurs Slow/Normal/Fast = connaissance générale, non confirmée). https://elementor.com/help/entrance-animations/
- **Hover animation, text-shadow (V3), text-stroke (V3)** : NON VÉRIFIÉ dans les pages lues (text stroke V4 confirmé en 5).

## 7. Menu contextuel, copier/coller le style
Voir 03 section 8. Paste style applique le look sans toucher au contenu ; Reset style revient à l'état d'origine ; Save as default fait de l'élément le modèle des nouveaux ; Save as Template.

## 8. Design System (Global Colors/Fonts)
Voir 05.
