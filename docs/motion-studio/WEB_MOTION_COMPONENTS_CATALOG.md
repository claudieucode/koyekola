# Catalogue des composants web animés — Kolakisa Motion Studio

_Rédigé le 2026-11-05. Document de cadrage (aucun code modifié). Les affirmations sur l'état de Kolakisa viennent d'une lecture réelle du dépôt (chemins cités). Les affirmations sur les technologies externes sont rattachées aux sources de la dernière section ; ce qui n'a pas de source est marqué « non vérifié »._

## 0. Lecture du document

**Légende d'état Kolakisa**
- **Existant** : un widget ou un réglage fait déjà l'essentiel.
- **Incomplet** : une partie existe (variante, version simple), il manque des options ou un mode.
- **Intégré** : pas un widget, mais fourni par le moteur d'effets commun (animations d'entrée, défilement, souris, masque, sticky).
- **Absent** : rien trouvé dans `src/` ni `public/js`.

**Priorité** : P0 = indispensable au lancement du Motion Studio ; P1 = fort impact, à faire juste après ; P2 = utile, plus tard ; P3 = confort / niche.
**Complexité** : S = quelques heures à 1 jour ; M = quelques jours ; L = plus d'une semaine (moteur, bibliothèque externe, tests d'appareils).

### Ce qui existe déjà dans Kolakisa (constaté dans le code)

| Brique | Où | Contenu réel |
|---|---|---|
| Registre de widgets | `src/marketing/pages/nodes.js`, `src/marketing/pages/widgets/*.js`, `elementorWidgets.json` | ~140 types dont `animatedheading`, `counter`, `progress`, `readingprogress`, `timeline`, `flipbox`, `hotspot`, `tooltip`, `countdown`, `accordion`, `tabs`, `toggle`, `modal`, `carousel`, `slides`, `mediacarousel`, `gallery`, `testimonialcarousel`, `cta`, `button`, `floatingbutton`, `menu`, `video`, `videoplaylist`, `lottie`, `textpath`, `marquee`, `beforeafter`, `icon`, `iconbox`, `pricing`, `rating`, `alert`, `querylist`… |
| Animations d'entrée (CSS pur, ~70) | `src/marketing/pages/motion.js` | Fondu, glisse (4 sens), zoom, rebond, rotation, dévoilement (`clip-path`), bascule 3D, familles Fading, Zooming, Back, Flipping, Attention Seekers (pulse, shake, tada, jello, heartbeat…), Light Speed, Specials ; direction `in/reverse/normal/alternate` ; repli « fondu » ou « aucune » en mouvement réduit |
| Effets de défilement et souris | `public/js/kw-effects.js` + inspecteur `public/js/page-builder-effects.js` + `SCROLL_FX` dans `nodes.js` | Défilement « de → à » sur x, y, opacité, flou, échelle, rotation (plages, sens) ; souris : « suit le curseur » ou « inclinaison 3D » ; un seul écouteur scroll et un seul pointermove, rAF, propriétés CSS indépendantes (`translate`, `scale`, `rotate`), coupure par écran (`data-kw-fx-off`), respect de `prefers-reduced-motion` |
| Capacités par type | `nodes.js` (caps `scroll`, `mouse`, `sticky`, `transform`, `mask`) | Épinglage (sticky), transformation, masque (formes + image `mask-image`) |
| Défilement magnétique | `src/marketing/pages/scrollSnap.js` | Scroll snap de page |
| Effet d'en-tête | `nodes.js` (`headerFx`) | Rétrécissement, plein au défilement… |
| Niveau de mouvement adaptatif | `public/js/kb-motion.js` | `html[data-kb-motion=full|lite|off]` (éditeur) |
| Primitives de micro-interactions | `public/js/kol-motion.js` | `appear()`, `leave()` (éditeur) |
| Lottie | `public/js/vendor/lottie_light.min.js` + `widgets/lottie.js` | lottie-web « light » (SVG, sans expressions), chargement paresseux, 1re image si mouvement réduit |
| Défilement continu | `widgets/marquee.js` | Animation CSS, pause survol/clavier, sens, 3 vitesses (pas lié à la vitesse de scroll) |
| Avant/Après | `widgets/beforeafter.js` | Curseur natif `range`, accessible |
| Texte sur tracé | `widgets/textpath.js` | SVG `<textPath>` : vague, arc, cercle, pente, ligne |
| Thèmes en paquets | `src/marketing/themes/packs/*/motion.js` | Mouvements propres à chaque thème (heliade, convoi, fournil…) |

**Pas trouvé** (grep sans résultat dans `nodes.js`, `widgets/`, `public/js`) : typewriter dédié (le titre animé a un mode `type`), jauge, spinner/loader, skeleton, SplitText, scramble, particules, canvas/WebGL/Three.js, Rive, dotLottie, transitions de pages, smooth scroll (inertie), curseur personnalisé, cursor trail, image trail. Un widget graphique : la présence du mot « chart » dans `nodes.js` n'a pas été creusée (**non vérifié** : à contrôler avant de classer « Absent » les graphiques).

---

## 1. Texte et typographie

Fiche commune (valable pour toute la catégorie)
- **Sous-éléments** : conteneur texte (balise h1–h6/p), segments (caractère / mot / ligne), curseur éventuel, copie accessible pour lecteur d'écran.
- **Contenu** : texte, balise, langue, liste de mots (rotation). **Style** : police, taille, graisse, couleur/dégradé, espacement des lettres, alignement. **Animation** : type d'effet, durée, décalage (stagger) par segment, courbe, délai, déclencheur (chargement / visible / survol), répétition.
- **Interactions** : visible à l'écran, survol, clic pour rejouer. **Responsive** : redécoupage des lignes au redimensionnement ; réduire la durée et le stagger sur mobile ; mouvement réduit = texte final affiché d'emblée.
- **Techno** : CSS + IntersectionObserver (léger) ; WAAPI pour le stagger ; découpage (type SplitText, qui gère `aria-label`, masque par ligne, re-découpage après chargement des polices : source 9). **Personnalisation** : presets (rapide / doux / dramatique) + réglages avancés repliés.
- **Précaution** : toujours garder le texte lisible sans JS et exposer le texte complet aux lecteurs d'écran.

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| T01 | Animated Heading (mots qui changent) | Accroche vivante | avant/mots/après, intervalle, effet | CSS/JS léger | **Existant** `animatedheading` (effets fade, type ; 2 à 8 mots) | P1 | S (ajouter effets) |
| T02 | Text Reveal (apparition au scroll) | Titre qui se dévoile | direction, durée, déclencheur | CSS + IO | **Incomplet** : entrées génériques `motion.js` sur le bloc, pas sur le texte | P0 | S |
| T03 | Split Text (moteur de découpage) | Base des effets lettre/mot/ligne | type chars/words/lines, masque, aria | JS léger (maison) ou GSAP SplitText | **Absent** | P0 | M |
| T04 | Char Reveal | Lettre par lettre | stagger, direction, ordre (début/fin/centre/aléatoire) | T03 + CSS | **Absent** | P0 | S (après T03) |
| T05 | Word Reveal | Mot par mot, masqué | stagger, masque | T03 | **Absent** | P0 | S |
| T06 | Line Reveal | Ligne par ligne qui monte d'un masque | stagger, durée, re-découpage | T03 | **Absent** | P0 | S |
| T07 | Kinetic Typography | Texte qui bouge au défilement (étirement, poids variable, rotation) | axe de police variable, vitesse de scroll | CSS `animation-timeline` / JS | **Incomplet** : effets scroll x/y/rotation/échelle sur un bloc entier, pas par lettre | P1 | L |
| T08 | Typewriter | Écriture avec curseur | vitesse, boucle, pause, curseur | CSS `steps()` / JS | **Incomplet** (mode `type` du titre animé) | P1 | S |
| T09 | Rotating Text | Mots qui tournent en place | liste, effet (fondu, glisse, flip) | CSS/WAAPI | **Existant** (titre animé, mode fade) | P2 | S |
| T10 | Gradient Text | Texte en dégradé animé | couleurs, angle, vitesse | `background-clip:text` + keyframes | **Incomplet** : couleur/dégradé de fond possible, pas de dégradé animé sur le texte (non vérifié en détail) | P1 | S |
| T11 | Text Mask (texte → vidéo/image) | Texte qui laisse voir une image | image/vidéo, taille | `background-clip:text` / `mask-image` | **Incomplet** : le masque existe (formes, image) mais pas « texte comme masque » | P2 | M |
| T12 | Scramble / Decode | Lettres aléatoires qui se fixent | jeu de caractères, durée | JS léger | **Absent** | P2 | S |
| T13 | Text Morph | Un mot qui se transforme en un autre | paires, durée | JS (interpolation) / SVG | **Absent** | P3 | M |
| T14 | Text Path | Texte sur courbe | forme, décalage animé | SVG `<textPath>` + `startOffset` animé | **Existant** `textpath` (statique : animation de défilement du texte à ajouter) | P2 | S |
| T15 | Counter | Nombre qui monte | début/fin, durée, séparateur, préfixe/suffixe | JS rAF + IO | **Existant** `counter` | — | — |
| T16 | Number Ticker (chiffres qui roulent) | Compteur façon odomètre | colonnes de chiffres | CSS `translateY` par chiffre | **Absent** (le compteur monte, ne roule pas) | P2 | M |
| T17 | Marquee (bande défilante) | Logos, slogans | vitesse, sens, pause | CSS | **Existant** `marquee` (CSS) | — | — |
| T18 | Marquee réactif à la vitesse de scroll | Bande qui accélère/inverse selon le scroll | facteur, inversion | JS (scroll velocity) | **Absent** | P1 | M |
| T19 | Circular Text | Texte en cercle qui tourne | rayon, vitesse, sens | SVG `textPath` + rotation CSS | **Incomplet** (forme cercle de `textpath`, pas de rotation) | P2 | S |
| T20 | Highlight / Underline animé | Surlignage dessiné sur un mot | couleur, style (trait, cercle, gribouillis) | SVG stroke-dashoffset | **Absent** | P1 | S |
| T21 | Text Stroke → Fill | Contour qui se remplit | épaisseur, direction | CSS `-webkit-text-stroke` + clip | **Incomplet** (contour du texte existe dans `heading`) | P2 | S |
| T22 | Variable Font Hover | Graisse/largeur qui change au survol | axes | CSS `font-variation-settings` | **Absent** | P3 | S |
| T23 | Text Hover Swap (roll) | Texte qui roule vers un double au survol | durée | CSS `translateY` + double | **Absent** | P1 | S |
| T24 | Big Text Scroll-fill | Phrase qui se colore mot à mot au défilement | couleur de départ/fin | `animation-timeline: view()` ou JS | **Absent** | P1 | M |

## 2. Éléments visuels

Fiche commune
- **Sous-éléments** : support (SVG/canvas/img/vidéo), calque d'accessibilité (`alt`, `aria-label`, `role`), image de repli.
- **Contenu** : fichier/URL, texte alternatif. **Style** : taille, ratio, couleurs, opacité. **Animation** : lecture (auto / visible / survol / clic / scroll), boucle, vitesse, segments.
- **Responsive** : image de repli sur mobile modeste ; pause hors écran ; `prefers-reduced-motion` = première image.
- **Techno** : SVG/CSS, lottie-web, canvas, Rive (`@rive-app/webgl2`, state machines : source 12). **Personnalisation** : remplacement de fichier, couleurs via variables.

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| V01 | Animated Icon | Icône qui s'anime au survol/visible | icône, déclencheur, durée | SVG + CSS / Lottie | **Incomplet** (`icon`, `iconbox` statiques + animations d'entrée) | P1 | M |
| V02 | SVG Animator (général) | Animer les parties d'un SVG | sélecteurs, keyframes | CSS/WAAPI | **Absent** | P2 | L |
| V03 | SVG Draw (tracé qui se dessine) | Logo, signature, ligne | durée, ordre, couleur | `stroke-dasharray/offset` | **Absent** | P0 | M |
| V04 | SVG Morph | Forme A → forme B | 2 tracés, durée | WAAPI `d: path()` ou lib | **Absent** | P2 | M |
| V05 | Lottie | Animation vectorielle | URL .json, lecture, boucle | lottie-web | **Existant** `lottie` | — | — |
| V06 | dotLottie | Format compressé .lottie | URL, lecteur | lecteur dotLottie (source 14 : formats décrits, détails du lecteur non vérifiés) | **Absent** | P2 | M |
| V07 | Rive | Animation interactive à états | .riv, state machine, entrées | `@rive-app/webgl2`, canvas | **Absent** | P3 | L |
| V08 | Particle Background | Points/lignes en fond | densité, vitesse, interaction souris | canvas 2D, rAF (conseils canvas : source 17) | **Absent** | P2 | M |
| V09 | Gradient animé | Fond dégradé qui bouge | couleurs, angle, vitesse | CSS `@property` / `background-position` | **Incomplet** (fonds dégradés oui, animés non) | P1 | S |
| V10 | Mesh Gradient | Taches de couleur floues mobiles | 3 à 5 couleurs, flou | blobs CSS `filter:blur` / WebGL | **Absent** | P1 | M |
| V11 | Grain / Noise | Texture film | intensité, animée ou fixe | SVG `feTurbulence` / PNG répété | **Absent** | P2 | S |
| V12 | Image Reveal | Image dévoilée (rideau, cercle) | forme, direction, durée | `clip-path` (source 8) | **Intégré** : animation d'entrée « reveal » (`inset`) | P1 | S (presets) |
| V13 | Image Mask | Image dans une forme | forme, image | `mask-image` / `clip-path` | **Existant** (capacité masque, formes) | — | — |
| V14 | Image Parallax | Image qui bouge moins vite que la page | intensité, sens | scroll-linked translate | **Intégré** (effet défilement y/x + `backgroundAttachment: fixed`) | P1 | S (preset) |
| V15 | Image Comparison / Before-After | Curseur avant/après | orientation, position | `input range` | **Existant** `beforeafter` | — | — |
| V16 | Hotspots | Points cliquables sur une image | position %, bulle | positionnement relatif | **Existant** `hotspot` | — | — |
| V17 | Image Zoom on scroll / hover | Zoom doux | échelle, durée | `transform: scale` | **Intégré** (échelle au défilement ; Ken Burns dans `slides`) | P2 | S |
| V18 | Duotone / Filtre animé | Couleur qui change au survol | couleurs | SVG filter / CSS blend | **Absent** | P3 | S |
| V19 | Video Background / Scroll-scrub Video | Vidéo en fond ou pilotée par le scroll | source, boucle, mute | `<video>` + currentTime | **Incomplet** (`video`; pas de pilotage par scroll) | P1 | M |
| V20 | Blob / Morphing Shape décoratif | Forme organique | couleurs, vitesse | SVG/CSS `border-radius` anim | **Absent** | P2 | S |
| V21 | Stickers / Éléments flottants | Décors qui flottent/rebondissent | amplitude | CSS keyframes | **Incomplet** (rebond/pulse en entrée ; pas de boucle flottante libre) | P2 | S |

## 3. Storytelling et sections

Fiche commune
- **Sous-éléments** : scène/étape, média, texte, indicateur de progression, contrôles.
- **Contenu** : étapes (titre, texte, média), ordre. **Style** : fond par étape, typographie, espacements. **Animation** : liaison au scroll (scrub) ou déclenchée, durée de chaque étape, transitions entre étapes.
- **Interactions** : défilement, flèches clavier, glissement tactile, clic sur indicateurs. **Responsive** : empilement vertical simple sur mobile (désactiver épinglage si hauteur d'écran faible), hauteurs en `svh`.
- **Techno** : `position: sticky` (limites : un `overflow` sur un parent casse l'effet, source 5), `animation-timeline: view()` (Baseline « newly available » : prévoir repli, source 1), scroll snap (source 7), ScrollTrigger pour épinglage complexe (source 4).

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| S01 | Hero animé | Premier écran | titre, sous-titre, CTA, média, séquence d'entrée | CSS + stagger | **Incomplet** (sections hero + entrées ; pas de séquence orchestrée) | P0 | M |
| S02 | Scroll Storytelling | Récit en chapitres | chapitres, fond par chapitre | sticky + IO | **Absent** | P0 | L |
| S03 | Sticky Story (texte défile, visuel fixe) | Explication à côté d'un visuel | côté, étapes | sticky + IO | **Incomplet** (capacité sticky, pas de widget assemblé) | P0 | M |
| S04 | Scroll Sequence (images en séquence) | Produit qui tourne au scroll | N images, canvas, pré-chargement | canvas + scroll progress | **Absent** | P1 | L |
| S05 | Product Showcase | Mise en avant produit | angles, hotspots, variantes | images + sticky | **Incomplet** (`hotspot`, galerie) | P1 | M |
| S06 | 3D Viewer | Voir en 3D | modèle, rotation auto | Three.js / `<model-viewer>` (non vérifié) | **Absent** | P2 | L |
| S07 | Timeline | Chronologie | étapes, ligne qui se remplit | CSS + IO | **Existant** `timeline` (animation de la ligne : à vérifier) | P1 | S |
| S08 | Process Steps | Étapes numérotées | numéros, ligne | flex + IO | **Incomplet** (`iconlist`, `timeline`) | P1 | S |
| S09 | Infographic | Données illustrées | éléments, séquence | SVG + IO | **Absent** | P2 | L |
| S10 | Diagram animé | Flux/schéma | nœuds, flèches qui se tracent | SVG draw | **Absent** | P2 | L |
| S11 | Stats section | Chiffres clés | compteurs, libellés | counter | **Existant** (`counter` en colonnes) | — | — |
| S12 | Carousel | Diaporama | slides/vue, boucle, auto | scroll-snap ou lib | **Existant** `carousel`, `mediacarousel`, `slides`, `testimonialcarousel` | — | — |
| S13 | Card Stack (cartes empilées) | Pile de cartes qui se défait | rotation, profondeur | sticky + scale | **Absent** | P1 | M |
| S14 | Sticky Stacking Cards | Cartes qui s'empilent au scroll | décalage, réduction d'échelle | sticky + `animation-timeline` | **Absent** | P0 | M |
| S15 | Horizontal Scroll Section | Défilement latéral piloté par scroll vertical | largeur, vitesse | sticky + translateX | **Absent** (menu horizontal listé « Absent » dans `ELEMENTOR_FEATURES_CATALOG.md`) | P1 | M |
| S16 | Fullscreen Gallery / Lightbox | Galerie plein écran | navigation, légende | dialog + scroll-snap | **Incomplet** (`gallery` + visionneuse) | P1 | M |
| S17 | Portfolio Grid | Projets filtrables | filtres, survol | grid + filtre | **Existant** (`gallery` filtres, `querylist`) | P1 | S (survols) |
| S18 | Logo Wall / Clients | Grille/bande de logos | défilement | marquee | **Existant** (marquee, galerie) | — | — |
| S19 | Testimonials animés | Avis en défilement | auteur, note | carousel | **Existant** | — | — |
| S20 | Pricing animé | Tableau de prix | bascule mensuel/annuel | toggle | **Existant** `pricing` + `toggle` | — | — |
| S21 | Scroll Progress Chapters (sommaire latéral) | Puces de chapitres | ancres | IO | **Incomplet** (`toc`, `readingprogress`) | P2 | S |
| S22 | Full-page Snap Sections | Écrans plein format | snap | `scroll-snap` | **Existant** (`scrollSnap.js`) | — | — |
| S23 | Launch Countdown + Waitlist | Lancement produit | date, formulaire | countdown + form | **Existant** (`countdown`, `signupform`) | — | — |
| S24 | Feature Bento Grid animée | Cases de tailles variées | cases, survol | CSS grid | **Incomplet** (grilles oui, preset bento non) | P1 | S |

## 4. Interface (UI)

Fiche commune
- **Sous-éléments** : déclencheur, panneau/contenu, indicateur d'état, fermeture. **Contenu** : libellés, icônes, liens. **Style** : tailles, couleurs d'état (repos/survol/actif/focus/désactivé). **Animation** : durée 120–300 ms, courbe, direction.
- **Interactions** : souris, clavier (Tab, Entrée, Échap, flèches), tactile. **Responsive** : zones tactiles ≥ 44 px, pas de survol seul. **Techno** : CSS d'abord ; focus piégé pour modales ; ARIA appropriés.

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| U01 | Animated Button | Bouton avec survol riche | remplissage, flèche, ondulation | CSS | **Incomplet** (`button` + survols de base) | P0 | S |
| U02 | Magnetic Button | Suit légèrement le curseur | force, rayon | JS pointermove | **Absent** (l'effet souris « suit le curseur » existe pour un bloc, pas « aimant à l'approche ») | P1 | S |
| U03 | Cursor Button / Cursor Follower | Pastille qui suit la souris | taille, texte, mix-blend | JS rAF | **Absent** | P1 | M |
| U04 | Animated Link | Soulignement qui se dessine | style, durée | CSS `background-size` | **Incomplet** (`smartlink`) | P1 | S |
| U05 | Navigation animée | Barre qui change au scroll | rétrécir, masquer/montrer | CSS + JS | **Existant** (`headerFx`, `menu`) | P2 | S |
| U06 | Fullscreen Menu | Menu plein écran | ouverture, stagger des liens | `dialog`/overlay + CSS | **Incomplet** (`menu` responsive, `modal`) | P0 | M |
| U07 | Mega Menu | Grand panneau | colonnes, image | CSS + ARIA | **Incomplet** (`menu` imbriqué ; Elementor note « expérimental ») | P2 | M |
| U08 | Accordion | Sections repliables | un/plusieurs ouverts, icône | `details` / grid-rows | **Existant** `accordion` (moteur `accordion-engine.js`) | — | — |
| U09 | Tabs | Onglets | animation de l'indicateur | ARIA tabs | **Existant** `tabs` | — | — |
| U10 | Modal | Fenêtre | déclencheurs, fréquence | `dialog` | **Existant** `modal` | — | — |
| U11 | Drawer / Off-canvas | Panneau latéral | côté, fond assombri | CSS + focus trap | **Existant** (`modal` mode coin / barre ; off-canvas coché Complet dans `ELEMENTOR_WIDGETS_CATALOG.md`) | P2 | S |
| U12 | Tooltip | Bulle d'aide | position, délai | CSS + ARIA | **Existant** `tooltip` | — | — |
| U13 | Toast | Notification brève | durée, position | JS | **Incomplet** : toasts dans l'éditeur seulement ; `alert` côté site | P2 | S |
| U14 | Loader / Spinner | Attente | forme, taille | CSS | **Absent** côté site publié | P1 | S |
| U15 | Page Preloader | Écran d'ouverture | logo, % | JS + CSS | **Absent** | P1 | M |
| U16 | Skeleton | Placeholder chargement | formes | CSS shimmer | **Absent** | P2 | S |
| U17 | Form Feedback | Validation animée | succès/erreur, secousse | CSS + ARIA live | **Incomplet** (module Formulaires `form-logic.js`) | P1 | M |
| U18 | Toggle / Switch | Interrupteur | libellés | CSS | **Existant** `toggle` | — | — |
| U19 | Checkbox / Radio animés | Case qui se coche | tracé | SVG stroke | **Absent** | P3 | S |
| U20 | Progress Bar | Barre | valeur, animation | CSS | **Existant** `progress` | — | — |
| U21 | Back-to-top | Retour en haut | seuil | JS léger | **Incomplet** (`floatingbutton`) | P2 | S |
| U22 | Dropdown / Select animé | Liste déroulante | — | ARIA | **Absent** (non vérifié hors formulaires) | P3 | M |
| U23 | Search overlay | Recherche plein écran | — | dialog | **Incomplet** (`search`) | P2 | S |
| U24 | Cookie banner animé | Bandeau | position | CSS | **Absent** (non vérifié : `popup.js` à examiner) | P3 | S |
| U25 | Scroll cue (indicateur « défiler ») | Souris/flèche qui bouge | style | CSS | **Absent** | P2 | S |
| U26 | Hover Card (carte qui se soulève) | Cartes interactives | élévation, inclinaison | CSS | **Incomplet** (survols de style + tilt) | P1 | S |

## 5. 3D et WebGL

Fiche commune
- **Sous-éléments** : canvas, scène, caméra, lumières, modèle/texture, repli image.
- **Contenu** : modèle .glb/.gltf ou images, texte. **Style** : fond, éclairage, couleur. **Animation** : rotation auto, caméra, suivi souris/scroll.
- **Interactions** : orbite (glisser), zoom, survol. **Responsive** : résolution adaptée (`devicePixelRatio` plafonné), pause hors écran, repli image sur appareils modestes.
- **Techno** : Three.js (scène + caméra + rendu, source 11) — ajoute un poids notable ; CSS 3D (`perspective`, `rotateX/Y`) pour tilt/flip sans WebGL. **Attention** : dépendance lourde → chargement paresseux, jamais dans l'éditeur.
- **Équivalent Kolakisa** : aucun moteur 3D (grep négatif). Seuls CSS 3D existent : `flip` (entrée), inclinaison souris 3D (`kw-effects.js`), `flipbox`.

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| D01 | 3D Scene | Scène générique | objets, lumières | Three.js | **Absent** | P3 | L |
| D02 | Model Viewer | Modèle .glb | rotation auto, orbite | Three.js / `<model-viewer>` | **Absent** | P2 | L |
| D03 | Product Viewer 360 | Produit en rotation | images 360 ou .glb | séquence d'images (canvas) | **Absent** | P1 | M |
| D04 | 3D Text | Texte extrudé | police, profondeur | Three.js / CSS 3D empilé | **Absent** | P3 | L |
| D05 | 3D Card / Tilt Card | Carte qui s'incline | angle max, reflet | CSS 3D + pointer | **Incomplet** (inclinaison souris existante, sans reflet « glare ») | P0 | S |
| D06 | 3D Flip Card | Retourner | axe, durée | CSS 3D | **Existant** `flipbox` | — | — |
| D07 | 3D Carousel (cylindre/coverflow) | Carrousel en profondeur | angle, rayon | CSS 3D | **Absent** | P2 | M |
| D08 | Camera Motion | Travelling virtuel | trajectoire | Three.js / CSS `perspective` | **Absent** | P3 | L |
| D09 | Scroll 3D | Objet 3D piloté par scroll | clés | Three.js + scroll progress | **Absent** | P3 | L |
| D10 | WebGL Background | Fond shader | type, couleurs | WebGL | **Absent** | P3 | L |
| D11 | Shader Effect | Vague/bruit sur image | uniformes | WebGL | **Absent** | P3 | L |
| D12 | Distortion Transition | Image à image avec distorsion | carte de déplacement | WebGL | **Absent** | P3 | L |
| D13 | CSS 3D Cube / Prism | Cube de contenus | faces | CSS 3D | **Absent** | P3 | M |
| D14 | Parallax Layers 3D (scène en couches) | Profondeur par souris | couches, force | translate par couche | **Incomplet** (effet souris par bloc ; pas de scène multicouche) | P1 | M |

## 6. Transitions et mise en page

Fiche commune
- **Sous-éléments** : conteneur, éléments animés, état initial/final.
- **Animation** : durée, stagger, courbe. **Interactions** : navigation, filtre, tri, ouverture/fermeture. **Responsive** : transitions simplifiées sur mobile.
- **Techno** : View Transition API (même document via `document.startViewTransition()`, inter-documents via `@view-transition` ; source 2), FLIP en JS, `animation-timeline`, `position: sticky` (source 5), Lenis pour l'inertie (<5 ko, annoncé sans accessibilité cassée, source 10).

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| L01 | Page Transition | Entre deux pages | type (fondu, rideau, glisse), durée | View Transitions (MPA) | **Absent** | P1 | M |
| L02 | Section Transition | Entre sections | effet (diagonale, courbe) | CSS (`clip-path`, SVG divider) | **Incomplet** (séparateurs de forme : à vérifier) | P2 | S |
| L03 | Layout Transition (FLIP) | Réorganisation fluide | durée | FLIP / View Transition | **Absent** | P2 | M |
| L04 | Animated Container | Conteneur qui anime ses enfants | stagger, sens | IO + CSS | **Incomplet** (animation par élément, pas d'orchestration enfants) | P0 | M |
| L05 | Animated Grid | Grille qui apparaît en cascade | stagger, ordre | IO + CSS | **Absent** | P0 | M |
| L06 | Animated List | Liste qui entre/sort | ajout/retrait | CSS / FLIP | **Incomplet** | P2 | M |
| L07 | Expand / Collapse | Replier | hauteur auto | `grid-template-rows` 0fr→1fr | **Existant** (accordéon, `readmore`) | — | — |
| L08 | Reveal on Scroll | Révélation | direction, seuil | IO (source 6) | **Existant** (animations d'entrée au viewport) | — | — |
| L09 | Sticky | Épinglage | décalage, limite | `position: sticky` | **Existant** (capacité sticky) | — | — |
| L10 | Scroll Progress | Barre de progression de page | position, épaisseur | `animation-timeline: scroll()` | **Existant** `readingprogress` | — | — |
| L11 | Smooth Scroll | Inertie du défilement | amortissement | Lenis | **Absent** | P2 | S |
| L12 | Pinning (scènes épinglées) | Figer pendant une animation | durée en px | sticky / ScrollTrigger pin | **Incomplet** (sticky simple, pas de scène à durée) | P1 | L |
| L13 | Horizontal Scroll | Défilement latéral | — | voir S15 | **Absent** | P1 | M |
| L14 | Parallax | Plans à vitesses différentes | facteur | scroll-linked | **Intégré** (effet y au défilement) | P1 | S |
| L15 | Scroll Snap Sections | Calage | mandatory/proximity | CSS (source 7) | **Existant** | — | — |
| L16 | Anchor smooth jump + highlight | Navigation interne | décalage d'ancre | CSS `scroll-behavior` | **Existant** (décalage d'ancre, `menuanchor`) | — | — |
| L17 | Stagger Children | Délai en cascade | pas, ordre | CSS variable `--i` | **Absent** (pas de réglage de cascade) | P0 | S |
| L18 | Marquee Sections / Infinite Scroll | Boucle | — | — | **Incomplet** | P3 | M |

## 7. Données et indicateurs

Fiche commune
- **Sous-éléments** : valeur, libellé, unité, légende, source. **Contenu** : valeurs saisies ou dynamiques. **Style** : palette accessible, épaisseur. **Animation** : montée à l'apparition, durée.
- **Responsive** : réduction de légendes, graphes lisibles en 320 px. **Accessibilité** : alternative textuelle/tableau, pas de couleur seule.
- **Techno** : CSS (`conic-gradient`, `stroke-dasharray`), SVG, canvas ou petite lib ; pas de lib lourde pour 1 ou 2 graphes.

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| G01 | Counter | Nombre animé | voir T15 | JS | **Existant** | — | — |
| G02 | Progress | Barre | voir U20 | CSS | **Existant** | — | — |
| G03 | Circular Progress | Anneau % | valeur, épaisseur | SVG stroke | **Incomplet** (`readingprogress` forme circulaire seulement) | P1 | S |
| G04 | Gauge | Jauge demi-cercle | min/max/valeur | SVG | **Absent** | P2 | S |
| G05 | Chart (barres, lignes, secteurs) | Graphes | séries, couleurs | SVG/canvas | **À vérifier** (mot « chart » trouvé dans `nodes.js`, non examiné) | P2 | M |
| G06 | Comparison Table / Slider | Comparer | colonnes | table + toggle | **Existant** (`table`, `pricing`, `beforeafter`) | — | — |
| G07 | Metric Card | Valeur + tendance | delta, icône | composition | **Incomplet** (`counter` + `iconbox`) | P1 | S |
| G08 | Data Viz (carte, heatmap) | Visualisation riche | données | SVG/lib | **Absent** | P3 | L |
| G09 | Rating | Étoiles | note | SVG | **Existant** `rating` | — | — |
| G10 | Skill bars / Radar | Compétences | niveaux | CSS | **Existant** (progress) / radar **Absent** | P3 | M |
| G11 | Countdown | Compte à rebours | échéance | JS | **Existant** `countdown` | — | — |
| G12 | Sparkline | Mini courbe | points | SVG | **Absent** | P3 | S |

## 8. Composants créatifs d'agences, portfolios et lancements produit

_Ajoutés d'après les étiquettes et technologies relevées sur la page « animations » d'Awwwards (source 18 : parallax, défilement infini, mise en page horizontale, microinteractions, WebGL/Three.js, GSAP, Locomotive Scroll, Curtains.js…) et sur des pratiques courantes. Les noms de sites ne sont pas détaillés ici faute de description par site dans la source._

| ID | Composant | Usage | Params clés | Techno | Kolakisa | P | Cx |
|---|---|---|---|---|---|---|---|
| X01 | Cursor Trail | Traînée derrière le curseur | longueur, couleur, fondu | canvas/DOM + rAF | **Absent** | P2 | M |
| X02 | Image Trail | Images qui se déposent sous la souris | liste d'images, distance entre dépôts | DOM pool + WAAPI | **Absent** | P1 | M |
| X03 | Custom Cursor (états) | Curseur qui change sur liens/images | libellé (« Voir »), taille | JS + CSS | **Absent** (seule la propriété CSS `cursor` existe) | P1 | M |
| X04 | Magnetic Grid | Éléments attirés par le pointeur | rayon, force | JS | **Absent** | P2 | M |
| X05 | Spotlight / Torch | Zone éclairée qui suit la souris | rayon, flou | CSS `radial-gradient` + variables `--x/--y` | **Absent** | P1 | S |
| X06 | Glow Border Card | Bordure lumineuse qui suit la souris | couleur, rayon | CSS + variables | **Absent** | P1 | S |
| X07 | Hover Image Reveal sur liste | Liste de titres, image au survol | image par ligne | JS pointer | **Absent** | P1 | M |
| X08 | Split-screen Hover | Deux moitiés qui s'élargissent | ratio | flex | **Absent** | P2 | S |
| X09 | Expanding Cards / Accordion horizontal | Panneaux qui s'ouvrent | flex-grow | CSS | **Absent** | P1 | S |
| X10 | Infinite Drag Gallery | Galerie 2D déplaçable | inertie | JS (pointer) | **Absent** | P3 | L |
| X11 | Draggable Carousel (inertie) | Glisser avec élan | friction | scroll-snap / JS | **Incomplet** (carrousel sans inertie spécifique) | P2 | M |
| X12 | Text Marquee dual-direction | Deux lignes en sens opposé | — | marquee x2 | **Incomplet** (2 `marquee` possibles) | P2 | S |
| X13 | Scroll Velocity Skew | Éléments penchés selon la vitesse | max angle | JS velocity | **Absent** | P2 | M |
| X14 | Curtain / Shutter Reveal (chargement) | Rideaux qui s'ouvrent | direction | `clip-path`/translate | **Absent** | P1 | S |
| X15 | Logo Intro / Brand Reveal | Animation du logo à l'arrivée | SVG draw | SVG | **Absent** | P1 | M |
| X16 | Sticky Footer Reveal | Pied de page révélé sous le contenu | — | sticky/fixed + z-index | **Absent** | P2 | S |
| X17 | Text Stack Hover (marque rotative) | Titre qui se répète en cascade | — | CSS | **Absent** | P3 | S |
| X18 | Draggable Sticker / Polaroid | Éléments à jeter | — | JS | **Absent** | P3 | M |
| X19 | Scroll-triggered Video Chapters | Vidéo qui change par chapitre | marqueurs | video + IO | **Absent** | P2 | L |
| X20 | Interactive Product Configurator (couleur) | Changer la couleur du produit | variantes | images + états | **Absent** | P2 | L |
| X21 | Number Reveal Hero (grand chiffre masqué) | Compteur géant en intro | — | counter + masque | **Incomplet** | P3 | S |
| X22 | Mouse-parallax Hero Layers | Couches du hero bougent avec la souris | force | effet souris par bloc | **Intégré** (effet souris « suit le curseur » sur plusieurs blocs) | P1 | S (preset) |
| X23 | Gradient Follow (fond qui suit la souris) | Aura colorée | — | CSS variables | **Absent** | P2 | S |
| X24 | Ripple / Wave Click | Onde au clic | — | CSS/JS | **Absent** | P3 | S |
| X25 | Dock / Magnifier Menu | Icônes qui grossissent | facteur | JS/CSS | **Absent** | P3 | M |
| X26 | Floating Action Stack | Boutons flottants déployables | — | CSS | **Incomplet** (`floatingbutton`) | P3 | S |

---

## 9. Synthèse chiffrée

**165 composants** : T 24, V 21, S 24, U 26, D 14, L 18, G 12, X 26 (T texte, V visuel, S storytelling, U UI, D 3D, L transitions/layout, G données, X créatifs).
État (décompte de la colonne Kolakisa) : 39 Existant, 5 Intégré (moteur d'effets), 40 Incomplet, 81 Absent.
Le décompte compte la première étiquette de chaque ligne ; quelques lignes mixtes (ex. « Absent/Incomplet », « À vérifier ») sont rangées dans « Incomplet » ou « Absent » selon le texte.

## 10. Ordre de priorité proposé (Kolakisa)

1. **P0 (socle)** : T03 SplitText maison + T02/T04/T05/T06 ; L17 cascade ; L04/L05 conteneur et grille animés ; S14 cartes empilées ; S03 histoire collante ; D05 carte inclinée avec reflet ; U01 bouton animé ; U06 menu plein écran ; V03 tracé SVG ; S01 hero orchestré.
2. **P1** : marquee réactif au scroll, spotlight, glow card, image trail, curseur personnalisé, scroll sequence, horizontal scroll, page transition, anneau de progression, révélations de lignes.
3. **P2/P3** : particules, WebGL, Rive, dotLottie, 3D, shaders.

## Sources consultées

Pages réellement ouvertes avec WebFetch le 2026-11-05 (résumés lus ; les numéros renvoient aux références du texte) :
1. https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view
2. https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
3. https://motion.dev/docs
4. https://gsap.com/docs/v3/Plugins/ScrollTrigger/
5. https://developer.mozilla.org/en-US/docs/Web/CSS/position
6. https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
7. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap
8. https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
9. https://gsap.com/docs/v3/Plugins/SplitText/
10. https://lenis.dev/
11. https://threejs.org/manual/en/fundamentals.html — **la page a renvoyé 404 : non lue, le contenu Three.js ci-dessus est de connaissance générale, non vérifié.**
12. https://rive.app/docs/runtimes/web/web-js
13. https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image
14. https://docs.lottiefiles.com/ (page d'accueil : formats cités, détails du lecteur non lus)
15. https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
16. https://web.dev/articles/animations-guide
17. https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
18. https://www.awwwards.com/websites/animations/ (liste de sites et étiquettes seulement)
19. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

Non ouvert (403) : https://tympanus.net/codrops/ — aucune information Codrops n'est citée comme vérifiée.
Sources internes : `docs/ELEMENTOR_WIDGETS_CATALOG.md`, `docs/ELEMENTOR_FEATURES_CATALOG.md`, `KOLAKISA_WIDGET_COVERAGE.md`, `src/marketing/pages/*`, `public/js/kw-effects.js`, `public/js/page-builder-effects.js`.
