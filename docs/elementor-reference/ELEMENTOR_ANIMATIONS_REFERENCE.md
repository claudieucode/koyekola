# Elementor : référence des animations et effets de mouvement

Document de référence (comportements observables uniquement, aucun code Elementor copié). Date de consultation : 2026-11-05. Les renvois `[S#]` pointent vers `ELEMENTOR_REFERENCE_SOURCES.md`.

Légende de fiabilité :
- **Confirmé** : lu dans une page officielle consultée.
- **Non confirmé** : absent des pages consultées ; mentionné seulement à titre d'hypothèse ou de connaissance générale à vérifier dans l'éditeur.

Légende de disponibilité : **Gratuit** / **Pro** / **Tiers** / **Éditeur** (version de l'éditeur : v3 classique, conteneurs flexbox, Editor V4 / Atomic).

---

## 1. Vue d'ensemble : les quatre familles d'animation

| Famille | Où se règle-t-elle (v3) | Déclencheur | Disponibilité |
|---|---|---|---|
| Animation d'entrée | Avancé > Effets de mouvement > Entrance Animation | Élément qui entre dans la fenêtre | Présentée dans la liste « Core » gratuite (Entrance Animation) [S33] ; l'article d'aide la range dans les effets de mouvement [S1][S5] |
| Effets de défilement (Scrolling Effects) | Avancé > Motion Effects > Scrolling Effects | Position de défilement | **Pro** (marqué Pro dans l'article Avancé et dans la liste des fonctions Pro) [S29][S33] |
| Effets de souris (Mouse Effects) | Avancé > Motion Effects > Mouse Effects | Mouvement du curseur | Bureau seulement [S1] ; l'article « Motion effects » est étiqueté Pro [S1] mais l'article Avancé ne place pas « Pro » à côté de Mouse Effects [S29] : **statut gratuit/Pro à vérifier dans l'éditeur** |
| Sticky | Avancé > Motion Effects > Sticky | Défilement | **Pro** [S29][S35] |
| Animation au survol (Hover Animation) | Style du widget (bouton, icône, image, etc.) | Survol | Gratuit (listé « Hover Animation » dans le Core) [S33] |
| Interactions (Editor V4) | Onglet « Interactions » à côté de General / Style | Chargement, entrée dans la vue, puis défilement / survol / clic (Pro, phases suivantes) | Éditeur V4 ; voir section 7 |

---

## 2. Animations d'entrée (Entrance Animation)

### 2.1 Où et comment
Chemin confirmé : sélectionner le conteneur ou le widget > onglet **Avancé** > **Motion Effects** > menu déroulant **Entrance Animation** ; il est possible de choisir une valeur **par appareil**, y compris « None » [S5]. S'applique aux widgets, conteneurs, sections et colonnes [S1].

### 2.2 Liste officielle (36 entrées listées ; l'article annonce « 37 » : écart signalé) [S5]
- **Fading** : Fade in, Fade in up, Fade in down, Fade in left, Fade in right.
- **Zooming** : Zoom in, Zoom in up, Zoom in down, Zoom in left, Zoom in right.
- **Bouncing** : Bounce in, Bounce in up, Bounce in down, Bounce in left, Bounce in right.
- **Sliding** : Slide in up, Slide in down, Slide in left, Slide in right.
- **Rotating** : Rotate in, Rotate in down left, Rotate in down right, Rotate in up left, Rotate in up right.
- **Attention seekers** : Bounce, Flash, Pulse, Rubber band, Shake, Head shake, Swing, Tada, Wobble, Jello.
- **Light speed** : Light speed in.
- **Specials** : Roll in.

Les noms internes (fadeIn, bounceIn, lightSpeedIn, rollIn…) ne sont pas confirmés par les pages consultées ; la bibliothèque est apparentée à la famille Animate.css (**non confirmé** par source officielle).

Note : il n'existe pas, dans la liste officielle, de variantes « Out » (sortie) ni de « Flip », « Back », « Slide in » avec rotation : ne pas les supposer.

### 2.3 Paramètres : durée, délai, vitesse
- **Vitesse** : un article de blog officiel indique que l'animation peut jouer à vitesse **Normal, Slow ou Fast** [S5-recherche]. Les valeurs exactes en millisecondes ne sont **pas confirmées**.
- **Délai (Animation Delay)** : un champ en millisecondes existe dans l'éditeur (connaissance générale) ; **non confirmé** par les pages consultées.
- Pas de durée libre en v3 ; la durée est dérivée du choix Slow/Normal/Fast (**non confirmé**).

### 2.4 Comportement
- Déclenchement à l'apparition de l'élément dans la fenêtre d'affichage au défilement [S1].
- Désactivée pour les visiteurs ayant activé « réduire les animations » dans leur système (voir section 9) [S1][S5].
- Problème connu Safari : la vieille version de jQuery embarquée par WordPress peut faire disparaître des éléments (par exemple flèches de carrousel) quand une animation d'entrée est combinée à des effets de souris ; contournement : retirer l'animation d'entrée des widgets ayant des effets de mouvement [S5][S1].

---

## 3. Effets de défilement (Scrolling Effects) : Pro

Chemin : Avancé > Motion Effects > activer « Scrolling Effects », puis cliquer sur l'icône crayon de chaque effet [S1][S13]. Plusieurs effets peuvent être cumulés (**non confirmé** explicitement, mais chaque effet a son propre interrupteur [S1]).

### 3.1 Effets et paramètres confirmés

| Effet | Direction / mode | Intensité | Points d'ancrage |
|---|---|---|---|
| **Vertical Scroll** | Up / Down | Speed 0 à 10 [S6] | non |
| **Horizontal Scroll** | To Left / To Right | Speed 0 à 10 [S13] | non |
| **Transparency** | Fade In / Fade Out / Fade Out In / Fade In Out | Level 0 à 10 [S11] | non |
| **Blur** | Fade In (flou vers net) / Fade Out (net vers flou) / Fade Out In / Fade In Out | Level 0 à 10 (flou maximal) [S12] | non |
| **Rotate** | Gauche / droite | Speed (min 0 ; maximum **non confirmé**, vraisemblablement 10) [S14] | X et Y Anchor Point [S1] |
| **Scale** | Scale Up / Scale Down / Scale Down Up / Scale Up Down | Speed 0 à 10 (entier) [S10] | X : Left / Center / Right ; Y : Top / Center / Bottom [S10] |

### 3.2 Paramètres communs
- **Viewport** : plage (curseur à deux poignées) en pourcentage de la hauteur de la fenêtre visible, qui définit quand l'effet démarre et finit. Exemple officiel : 50 à 100 signifie que le mouvement ne commence qu'après avoir défilé la moitié de la hauteur de la fenêtre [S6]. Exemple Transparency, Fade In Out, viewport 30 à 60 : l'élément part transparent, atteint son pic à 30 %, le maintient jusqu'à 60 %, puis s'efface ensuite [S11].
- Les valeurs de viewport se basent sur la hauteur **visible** de l'écran et non sur la hauteur de la page, sauf pour les éléments en position fixe [S6].
- **Apply Effects On** : Desktop, Tablet, Mobile (combinaison libre) [S1][S6].
- **Effects Relative To** : Default, Viewport, Entire Page. Les pages Blur, Horizontal et Rotate décrivent Default et Viewport de manière identique (calcul sur la fenêtre du visiteur) ; la différence réelle est **non confirmée**. Entire Page = calcul sur la hauteur totale de la page [S12][S13][S14].
- **Valeurs par défaut** : aucune documentée [S6][S10].

### 3.3 Sticky (Pro)
Sélecteur **Sticky** : None / Top / Bottom. **Sticky On** : Desktop, Tablet Portrait, Mobile Portrait. Si Top ou Bottom : **Offset** (px, décale l'élément), **Effects Offset** (px de défilement avant l'effet ; ne fonctionne que si du CSS a été ajouté à l'élément collant), **Stay in Column** (le bloc reste dans sa colonne) [S35].
- Éditeur V4 (Atomic) : Style > Position > **Sticky**, avec décalage Top / Bottom, Z-index et Anchor offset. Le sticky natif de la V4 est lié à son conteneur parent (l'élément cesse de coller quand sa section sort de l'écran) ; pour un en-tête persistant en V4, la documentation recommande « Fixed » [S35, recherche].
- Astuce officielle : un effet Rotate cesse après que la section interne devient collante car il est relatif à la fenêtre par défaut ; le corriger en choisissant « Entire Page » (source Academy, via recherche).

### 3.4 Scroll Snap (Pro 3.5, décembre 2021)
Réglage **Snap Position** : Top, Center ou Bottom. À chaque défilement, la section suivante s'aligne sur la position choisie ; exemple : sections à 100 % de hauteur de fenêtre avec Snap Position Top [S42]. Aucune autre option confirmée.

---

## 4. Effets de souris (Mouse Effects) : bureau uniquement

Chemin : Avancé > Motion Effects > Mouse Effects, puis crayon [S7][S8].

| Effet | Paramètres | Comportement |
|---|---|---|
| **Mouse Track** | Direction : Opposite (déplacement contre la souris) ou Direct (dans le même sens) ; Speed 0 à 10 | Les éléments bougent par rapport au curseur, effet de profondeur [S8][S1] |
| **3D Tilt** | Direction : Opposite (s'incline à l'opposé du mouvement) ou Direct ; Speed 0 à 10 | L'élément s'incline selon le curseur [S7][S1] |

Communs : Apply Effects On (Desktop, Tablet, Mobile ; mais l'article de synthèse précise que les effets de souris ne fonctionnent que sur ordinateur [S1]) ; Effects Relative To (Default / Viewport / Entire Page) [S7][S8]. Aucune valeur par défaut documentée.
- Problème Safari : erreur jQuery possible (éléments masqués, message « maximum call stack size exceeded ») ; contournements : retirer les animations d'entrée des widgets concernés ou retirer les effets de souris des zones qui combinent défilement et souris [S1][S8].

---

## 5. Animations au survol (Hover Animation)

### 5.1 Liste confirmée par l'article officiel (14 familles) [S9]
Grow, Shrink, Pulse, Push, Pop, Bounce, Rotate, Float, Sink, Bob, Hang, Skew, Wobble, Buzz. L'article ne précise pas le widget concerné ni le statut Pro.

### 5.2 Variantes dans le menu (non confirmées par les pages consultées)
Le menu déroulant du bouton propose, d'après la connaissance générale (famille Hover.css), des variantes dont : Pulse-Grow, Pulse-Shrink, Bounce-In, Bounce-Out, Grow-Rotate, Skew-Forward, Skew-Backward, Wobble-Vertical, Wobble-Horizontal, Wobble-To-Bottom-Right, Wobble-To-Top-Right, Wobble-Top, Wobble-Skew, Buzz-Out, Shrink (et Grow, Pulse, Push, Pop, Float, Sink, Bob, Hang). **Liste exacte et noms internes : non confirmé.** Les ouvrir dans l'éditeur avant de les figer dans une spécification.

### 5.3 Où elle s'applique (confirmé)
- **Icon** : Style > Icon > Hover > « Hover Animation » (exemples : Grow, Pulse, Skew) ; aussi Rotate jusqu'à 360 degrés, taille et couleurs au survol [S32].
- **Call to Action** : « Hover Animation » sur l'image (classique) ; pour la peau Cover : animation du contenu image (durée, séquencée) et animation du fond : zoom avant/arrière ou déplacement gauche/droite/haut/bas ; superposition de couleur, filtres CSS, mode de fusion, durée de transition [S18].
- **Slides** : effet Ken Burns (zoom avant ou arrière) par diapositive [S23].
- **Boutons, Image, etc.** : la liste « Hover Animation » est dans le Core [S33] ; détails par widget **non confirmés** dans cette passe.
- **Durée de transition au survol** : champ « Transition Duration » présent dans les états Hover (Lottie, Flip Box, boutons…) [S2][S24].

### 5.4 Ken Burns
Effet de zoom lent sur image de fond (Slides) ; marqué Pro (« Ken Burns Effect » dans la liste Pro) [S33][S23]. Paramètre : sens In / Out.

---

## 6. Déclencheurs et interactions

| Déclencheur | Famille concernée | Notes |
|---|---|---|
| Chargement de la page | Entrance Interactions (V4) [S4] | « On page load » |
| Entrée dans la vue (viewport) | Entrance Animation v3 [S1] ; V4 « On scroll into view » [S4] ; Lottie « Viewport » [S2] | |
| Défilement | Scrolling Effects [S1] ; Lottie « Scroll » [S2] ; Progress Tracker (suit le défilement) [S34] | |
| Survol | Hover Animation ; Lottie « On Hover » ; Flip Box ; 3D Tilt / Mouse Track | Pas de survol sur écran tactile (voir section 10) |
| Clic | Lottie « On Click » [S2] ; Interactions V4 Pro [S3] | |
| Mouvement de souris | Mouse Effects | Bureau seulement |

### Ordre, combinaisons et conflits (confirmés)
- Entrance Animation + Mouse Effects dans la même zone : conflit Safari documenté [S1][S5].
- Sticky + Rotate : voir 3.3.
- Plusieurs effets d'entrée dans la V4 se **cumulent** sur un même élément (Fade + Slide + Scale) [S4].
- Autres règles d'ordre d'exécution (priorité entre entrée v3 et défilement) : **non confirmé**.

---

## 7. Editor V4 : nouveau système « Interactions »

### 7.1 Phase 1 : Entrance Interactions (Elementor 3.34) [S4]
- Nouvel onglet **Interactions** à côté de General et Style.
- **Déclencheurs** : On page load, On scroll into view.
- **Effets** : Fade, Slide, Scale.
- **Type** : In ou Out. **Directions** : Up, Down, Left, Right (l'article ne précise pas quels effets utilisent la direction).
- **Durée** : 0,1 s à 3 s. **Délai** : 0 à 2 s. Valeurs par défaut non documentées.
- **Empilement** : plusieurs effets d'entrée sur le même élément ; bouton **Preview** pour rejouer.
- Activation : WordPress > Elementor > Réglages > onglet **Editor V4** > Activer. Version bêta « prête pour la production » annoncée pour le T1 2026 (planning à re-vérifier).
- Les onglets atomiques (Atomic Tabs) acceptent ces interactions sur leurs parties (conteneur, menu, déclencheur, contenu) [S4].

### 7.2 Phases suivantes : Interactions Pro (Editor 4.0) [S3]
- Marquées **Pro**. Déclencheurs annoncés : défilement, survol, clic.
- Effets : animations prédéfinies **ou « Custom effect »** (définir comment un élément se transforme entre états). Propriétés et nombre d'états : non précisés.
- **Réglages par point d'arrêt** (bureau, tablette, mobile), par exemple effets riches sur grand écran et simplifiés ou désactivés sur mobile.
- Seuils, durées, courbes (easing) et plages de valeurs : **non documentés** dans l'article consulté.

---

## 8. Widgets spécialisés animés

### 8.1 Lottie (Pro) [S2]
- **Source** : External URL ou Media File (.json). Avertissement officiel : n'utiliser que des .json de source fiable (peuvent contenir du code malveillant).
- **Lien** : l'animation peut être cliquable ; **Légende** (Custom Caption pour une URL externe) ; **Alignement** gauche/centre/droite.
- **Trigger** : Viewport (pourcentage visible, curseur), On Click, On Hover (zone : Animation, Column, Section, Container ; réglage « On Hover Out »), Scroll (curseur de portion de défilement), None.
- **Loop** : Default (fin de boucle puis arrêt), Pause (arrêt sur place), Reverse (retour arrière jusqu'au début).
- **Play Speed**, **Start Point / End Point** (plage de lecture, curseurs), **Reverse** (Oui/Non).
- **Renderer** : SVG (plus de contrôle) ou Canvas (plus rapide).
- **Lazy Load** : charge l'animation quand elle devient visible.
- **Style** : Width, Max Width, états Normal/Hover avec Transition Duration, Opacity, CSS Filter (Blur, Brightness, Contrast, Saturation, Hue).
- Valeurs par défaut : non documentées (hors Loop = Default).

### 8.2 Counter (gratuit) [S15, S33]
Starting Number, Ending Number, Prefix, Suffix, **Animation Duration** (ms ; exemple officiel 4000 pour ralentir), Thousand Separator (par défaut, point, espace). Compte croissant ou décroissant. Déclenchement au défilement/entrée en vue : **non décrit** dans l'article (comportement habituel : démarre à l'apparition, **non confirmé**). Pas de courbe d'accélération documentée.

### 8.3 Progress Bar (gratuit) [S16]
Titre, Percentage, Display Percentage, Inner Text ; couleurs. Article : « barres animées » mais **aucun réglage de durée ni de déclencheur** documenté.

### 8.4 Animated Headline (Pro) [S19]
- Style **Highlighted** : formes Circle, Curly, Underline, Double, Double Underline, Underline Zigzag, Diagonal, Strikethrough, X ; Before / Highlighted / After text.
- Style **Rotating** : Typing, Clip, Flip, Swirl, Blinds, Drop-in, Wave, Slide, Slide Down ; liste de textes en rotation.
- **Infinite Loop** (Oui = répété ; Non = une fois, figé sur l'état final), **Duration (ms)**, **Delay (ms)** (entre boucles ; seulement Highlighted + boucle infinie).
- Style : couleur/largeur de forme, Bring to Front, Rounded Edges, typographie.

### 8.5 Carrousels
- **Image Carousel (gratuit)** : Slides to Show 1 à 10, Slides to Scroll, Navigation (flèches/points/les deux/aucune), Autoplay, Pause on Hover, Pause on Interaction, Autoplay Speed (ms), Infinite Loop, Animation Speed, Direction, Lazy Load [S17].
- **Testimonial Carousel (Pro)** : Skin Default/Bubble, Slides Per View 1 à 10, pagination None/Dots/Fraction/Progress, Transition Duration, Autoplay, Autoplay Speed, Loop, Pause hover/interaction, Lazyload [S20].
- **Media Carousel (Pro)** : peaux Carousel / Slideshow / Coverflow ; effets Slide, Fade, Cube ; overlay texte/icône avec animation ; mêmes réglages d'autoplay [S21].
- **Reviews (Pro)** : mêmes réglages de carrousel + notes 0.0 à 5.0 [S30]. Autoplay soumis à la politique d'autoplay de Chrome.
- **Slides (Pro)** : Transition Slide/Fade, Transition Speed, **Content Animation** (None, Down, Up, Right, Left, Zoom), Ken Burns, Autoplay [S23].
- **Nested Carousel / Carousel (Pro)** : chaque diapositive est un conteneur ; Slides on display, Slides on scroll, Offset Slides (None/Both/Left/Right), Scroll Speed (ms), Transition Duration, Direction, autoplay/pause/loop. Autoplay et boucle infinie sont désactivés dans l'éditeur (pour faciliter le glisser-déposer) mais actifs en aperçu et sur le site [S31, S44].
- **Loop Carousel (Pro)** : mêmes réglages sur un modèle d'élément de boucle ; 3.11 [S28, S44].

### 8.6 Autres widgets animés
- **Hotspot (Pro)** : Tooltip Trigger Hover ou Click, Position, Animation (liste non précisée), Duration ms ; animation d'icône avec séquence en ms [S22].
- **Call to Action (Pro)** : animations d'image/contenu au survol, animation séquencée [S18].
- **Flip Box (Pro)** : Flip Effect (flip, slide, push, zoom in, zoom out, fade), direction (flip et slide), 3D Depth. Limite Safari mobile [S24].
- **Countdown (Pro)** : décompte jours/heures/minutes/secondes, pas d'animation spécifique documentée ; actions après expiration (redirection, masquage, message) [S25].
- **Price List (Pro)** : pas d'animation documentée [S26].
- **Text Path (Pro)** : texte sur chemin SVG ; pas d'animation documentée ; états Normal/Hover pour la couleur [S27].
- **Progress Tracker (Pro)** : suit le défilement ; type Horizontal ou Circular (le blog parle de « vertical ou circulaire » : divergence) [S34, S42].
- **Marquee / texte défilant** : **aucun widget Marquee natif confirmé** dans la liste officielle consultée [S33]. Hors catalogue : extensions tierces.
- **Tabs / Accordion / Toggle** : voir catalogue ; pas d'animation d'ouverture configurable documentée dans les articles consultés [S36-S38].

---

## 9. Accessibilité

- Si le système d'exploitation du visiteur active la réduction des animations (Mac, iOS, Windows 10), les **effets de mouvement sont désactivés** pour lui [S1][S5]. C'est le seul comportement `prefers-reduced-motion` confirmé ; son périmètre exact (entrée, défilement, souris, Lottie, carrousels, Interactions V4) n'est pas détaillé : **non confirmé** pour les widgets.
- Les carrousels proposent « Pause on Hover / Pause on Interaction » [S17][S20][S31].
- Autoplay vidéo/média limité par la politique du navigateur (Chrome) [S30].

## 10. Limites mobiles et tactiles

- Effets de souris : bureau uniquement [S1].
- Effets de défilement : activables par appareil (Desktop/Tablet/Mobile) [S6]. Interactions V4 : réglables par point d'arrêt [S3].
- Survol : sur tactile, le survol n'existe pas (comportement général) ; les Lottie « On Hover » et le Flip Box dépendent du survol. Alternative Flip Box : lien d'application sur la boîte. **Non confirmé** par article sur le comportement tactile exact.
- Flip Box en 3D sur Safari iOS : support partiel ; incompatible avec Nav Menu sur iOS ; solution : masquer la section sur mobile via Avancé > Responsive > Visibilité [S24].
- Navigateurs : Chrome, Firefox, Safari, Opera pris en charge ; Edge avec lenteurs ; Internet Explorer non pris en charge [S1].

## 11. Points ouverts
1. Durées en ms de Slow / Normal / Fast des animations d'entrée.
2. Liste exacte des variantes de Hover Animation.
3. Différence réelle entre Default et Viewport pour « Effects Relative To ».
4. Statut gratuit/Pro des Mouse Effects.
5. Plage de valeurs de Speed pour Rotate.
6. Spécification des Interactions Pro (V4) : seuils, durées, easing.
