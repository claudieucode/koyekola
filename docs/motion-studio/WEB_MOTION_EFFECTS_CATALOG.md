# Catalogue des effets de mouvement web — Kolakisa Motion Studio

_Rédigé le 2026-11-05. Aucun code modifié. Les points marqués « (S#) » renvoient aux sources ouvertes listées en fin de document. Ce qui n'a pas de source est « non vérifié »._

## 0. Règles transversales

- **Compositeur d'abord** : animer `transform` et `opacity` ; éviter `top/left` et toute propriété de mise en page, qui forcent layout/paint (S1). Cohérent avec la charte Kolakisa (`docs/KOLAKISA_MOTION.md` : durées 120/180/260 ms, une seule courbe, jamais de propriété de mise en page animée).
- **`will-change`** : avec parcimonie, posé juste avant l'effet puis retiré (S1).
- **Mouvement réduit** : `prefers-reduced-motion: reduce` (Baseline, disponible depuis janvier 2020, S2). Bonne pratique : *remplacer* (fondu) plutôt que supprimer, cibler les mouvements à risque (grandes mises à l'échelle, panoramiques), garder un retour d'état sans mouvement (S2). Kolakisa : `motion.js` prévoit déjà « fade » ou « none » en repli.
- **Un seul écouteur** de scroll/pointeur, rAF seulement quand quelque chose bouge (déjà le cas dans `public/js/kw-effects.js`).
- **Niveaux d'appareil** : full / lite / off (déjà `public/js/kb-motion.js` pour l'éditeur ; à étendre au site publié).
- **Techniques** : « CSS » = CSS pur ; « WAAPI » = `Element.animate()` (S3) ; « JS » = script léger maison ; « Lib » = bibliothèque (Motion S4, GSAP S5, Lenis S6, Three.js, lottie-web…).
- **Appareils** : D = ordinateur, T = tablette, M = mobile ; « pointeur fin » = souris/trackpad (pas de survol au tactile).

**Légende Kolakisa** : Existant / Incomplet / Intégré (via moteur d'effets) / Absent — identique au catalogue de composants.

Colonnes : ID | Effet | Paramètres | Déclencheurs | Limites | Appareils | Précautions perf | Technique | Kolakisa.

---

## 1. Apparitions (entrées)

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E01 | Fondu | durée, délai | chargement, visible | — | D T M | trivial | CSS | **Existant** (`fade`) |
| E02 | Glisse (haut/bas/gauche/droite) | distance, durée | visible | distance trop grande = scroll horizontal parasite (prévoir `overflow-x: clip`) | D T M | transform | CSS | **Existant** (`slide-*`, `fade-in-*`) |
| E03 | Zoom avant/arrière | échelle de départ | visible | éviter échelle < 0,3 sur gros blocs en mobile | D T M | transform | CSS | **Existant** (`zoom*`) |
| E04 | Rebond / ressort | amplitude, raideur | visible | un ressort physique demande JS ; CSS = approximation par keyframes | D T M | transform | CSS (keyframes) / Lib (springs, S4) | **Existant** (`bounce`, keyframes) ; ressort physique **Absent** |
| E05 | Rotation d'entrée | angle | visible | — | D T M | transform | CSS | **Existant** (`rotate`) |
| E06 | Bascule 3D à l'entrée | axe, perspective | visible | `perspective` : attention aux textes flous | D T | transform | CSS | **Existant** (`flip`, `flip-in-y`) |
| E07 | Dévoilement par masque | direction, forme | visible | `clip-path` n'interpole qu'entre formes du même type (S7) | D T M | paint léger | CSS | **Existant** (`reveal`) |
| E08 | Attention (pulse, shake, tada, jello, heartbeat…) | intensité, répétition | chargement, survol | usage modéré (distrait) | D T M | transform | CSS | **Existant** (famille Attention Seekers) |
| E09 | Vitesse-lumière / Roll | sens | visible | effet daté, à réserver | D T M | transform | CSS | **Existant** |
| E10 | Cascade (stagger) | pas (ms), ordre, plafond | visible du parent | plafonner le total (< 1 s) | D T M | OK | CSS variable `--i` / WAAPI | **Absent** (pas de réglage de cascade) |
| E11 | Apparition par séquence orchestrée (hero) | timeline d'éléments | chargement | complexité d'édition | D T M | OK | WAAPI / Lib | **Absent** |
| E12 | Apparition « une seule fois » ou rejouée | once/repeat | IntersectionObserver (`threshold`, `rootMargin`, `unobserve`) (S8) | rejouer au scroll arrière peut fatiguer | D T M | OK | JS | **Existant** (à confirmer pour « rejouer ») |

## 2. Transitions de position, taille, rotation, opacité

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E13 | Translation douce au survol | distance, durée | survol, focus | pas de survol au tactile → prévoir l'état au clic | D (pointeur fin) | transform | CSS | **Existant** (styles de survol) |
| E14 | Échelle au survol / pression | facteur | survol, `:active` | cibles qui bougent = clic raté | D T M | transform | CSS | **Existant** |
| E15 | Rotation au survol | angle | survol | — | D | transform | CSS | **Existant** |
| E16 | Transition d'opacité | durée | état | — | tous | compositeur | CSS | **Existant** |
| E17 | Animation de taille réelle (hauteur auto) | durée | ouverture | animer `height` = layout ; préférer `grid-template-rows: 0fr→1fr` | tous | layout (réduit) | CSS | **Existant** (accordéon) |
| E18 | Ressort / inertie sur déplacement | raideur, amortissement | pointeur | demande JS | D T M | OK | Lib (S4) / JS | **Absent** |
| E19 | Courbes d'accélération personnalisées | cubic-bezier, `linear()` | — | une seule courbe dans la charte Kolakisa | tous | — | CSS | **Existant** (jetons) |
| E20 | Transformations indépendantes (`translate`, `scale`, `rotate`) | — | — | support navigateur récent (non vérifié ici) | tous récents | — | CSS | **Existant** (utilisé dans `kw-effects.js`) |

## 3. Typographie animée

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E21 | Révélation par caractère | stagger, ordre | visible | découpage coûteux sur beaucoup de texte (S9) ; a11y : `aria-label` + enfants masqués (S9) | D T M | OK si < 200 segments | JS + CSS / Lib (S9) | **Absent** |
| E22 | Révélation par mot | stagger, masque | visible | idem | D T M | OK | idem | **Absent** |
| E23 | Révélation par ligne (masque) | stagger | visible | re-découpage après chargement des polices et au redimensionnement (S9) | D T M | OK | idem | **Absent** |
| E24 | Machine à écrire | vitesse, curseur, boucle | visible | texte long = lent ; annonce lecteur d'écran | D T M | léger | CSS `steps()` / JS | **Incomplet** (mode `type`) |
| E25 | Mots qui tournent | liste, intervalle | auto | contenu changeant → pause possible (WCAG 2.2.2, non vérifié ici) | D T M | léger | JS | **Existant** |
| E26 | Dégradé de texte animé | couleurs, vitesse | auto | contraste | D T M | repaint | CSS | **Absent/Incomplet** |
| E27 | Remplissage au scroll (mot par mot) | couleurs | scroll | support `animation-timeline` limité : repli (S10) | D T M | OK | CSS timeline / JS | **Absent** |
| E28 | Scramble / décodage | jeu de signes, durée | visible, survol | lisibilité | D T M | léger | JS | **Absent** |
| E29 | Morph de mots | paires | auto | complexe | D T | moyen | JS/SVG | **Absent** |
| E30 | Texte variable (axes) | axes, plage | survol, scroll | police variable requise | D T M | repaint | CSS | **Absent** |
| E31 | Roll au survol (double texte) | durée | survol | doublon de texte à masquer aux lecteurs | D | transform | CSS | **Absent** |
| E32 | Souligné dessiné / surlignage | style | visible, survol | — | D T M | léger | SVG / CSS | **Absent** |
| E33 | Texte sur tracé animé | décalage | auto, scroll | support SVG | D T M | léger | SVG `startOffset` | **Incomplet** (tracé statique) |
| E34 | Contour → remplissage | épaisseur | visible | `-webkit-text-stroke` (préfixe) | D T M | repaint | CSS | **Incomplet** |
| E35 | Texte étiré/vitesse (skew au scroll) | amplitude | vitesse de scroll | nausées → plafond bas | D T | OK | JS | **Absent** |

## 4. Masques et découpes (clipping)

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E36 | Rideau (inset) | direction | visible | — | tous | léger | CSS `clip-path` (S7) | **Existant** (`reveal`) |
| E37 | Ouverture circulaire | centre, rayon | clic, visible | cercle→cercle seulement (S7) | tous | léger | CSS | **Absent** |
| E38 | Polygone qui change | sommets | survol | même nombre de sommets | tous | léger | CSS | **Absent** |
| E39 | Masque d'image / dégradé | image, taille | statique ou animé | Baseline « Widely available » depuis déc. 2023 (S11) ; sources HTTP/HTTPS (CORS) | tous | repaint | CSS `mask-image` | **Existant** (capacité masque) |
| E40 | Fondu de bord par dégradé | rayon | statique | — | tous | léger | CSS mask gradient | **Intégré** (masque) |
| E41 | Texte découpé en image | image | statique | `background-clip:text` | tous | léger | CSS | **Absent** |
| E42 | Masque « trou de serrure » qui grandit au scroll | échelle | scroll | peut coûter en paint plein écran | D T | moyen | CSS/JS | **Absent** |
| E43 | Effet de volet (blinds) | N bandes | visible | N éléments | D T | OK | CSS | **Absent** |

## 5. Morphing et tracés SVG

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E44 | Tracé qui se dessine | durée, ordre | visible, scroll | nécessite `pathLength` ou longueur calculée | D T M | léger | CSS `stroke-dasharray/offset` | **Absent** |
| E45 | Morph de formes | 2 tracés (même nb de points idéal) | survol, clic | points incompatibles = déformation | D T M | léger | WAAPI / Lib | **Absent** |
| E46 | Suivi de chemin (motion path) | chemin, durée | scroll, auto | support CSS `offset-path` (non vérifié) | D T M | transform | CSS / Lib | **Absent** |
| E47 | Animation Lottie | fichier, lecture | visible, survol, clic | JSON lourd ; pas d'expressions (lottie-web light) | D T M | moyen | lottie-web | **Existant** |
| E48 | dotLottie | .lottie | idem | lecteur dédié (S12 : détails non lus) | D T M | moyen | lecteur dotLottie | **Absent** |
| E49 | Rive (états interactifs) | .riv, state machine | pointeur, scroll, visible | canvas WebGL2, `cleanup()` obligatoire (S13) | D T M | moyen/haut | `@rive-app/webgl2` | **Absent** |
| E50 | Filtre SVG (turbulence, déplacement) | fréquence | survol/auto | coûteux sur grands éléments | D | élevé | SVG filter | **Absent** |

## 6. Parallaxe

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E51 | Parallaxe simple (une couche) | vitesse | scroll | éviter sur très longues pages mobiles | D T M | transform | JS rAF / CSS timeline | **Intégré** (effet y au défilement) |
| E52 | Parallaxe multicouche | N couches | scroll | N éléments animés | D T | OK | idem | **Incomplet** (à composer à la main) |
| E53 | Fond fixe (`background-attachment: fixed`) | — | scroll | peu fiable sur iOS (non vérifié ici) | D | repaint | CSS | **Existant** |
| E54 | Parallaxe souris | force | pointermove | pointeur fin seulement | D | transform | JS | **Existant** (« suit le curseur ») |
| E55 | Parallaxe par gyroscope | force | `deviceorientation` | permission iOS (non vérifié), batterie | M | OK | JS | **Absent** |
| E56 | Zoom parallaxe d'image dans son cadre | échelle | scroll | cadre `overflow:hidden` | D T M | transform | JS | **Intégré** (échelle) |

## 7. Liés au défilement (scroll-linked)

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E57 | Progression « de → à » (x, y, opacité, flou, échelle, rotation) | plage début/fin %, sens | position dans la fenêtre | — | D T M | un seul écouteur, rAF | JS | **Existant** (`SCROLL_FX`) |
| E58 | Timeline CSS `view()` / `scroll()` | axe, insets | scroll | « Baseline 2026, newly available » ; inactive s'il n'y a pas de barre de défilement ; repli `@supports not` (S10) | navigateurs récents | compositeur possible | CSS | **Absent** (le moteur actuel est en JS) |
| E59 | Barre de progression de page | position, épaisseur | scroll | — | tous | léger | JS / CSS | **Existant** |
| E60 | Scrub de vidéo/séquence | images, plage | scroll | pré-chargement lourd | D T | lourd | canvas / video | **Absent** |
| E61 | Compteur déclenché à la vue | durée | visible | — | tous | léger | JS | **Existant** |
| E62 | Changement de thème/couleur de fond par section | couleurs | section visible | contraste | tous | repaint | JS + CSS | **Absent** |
| E63 | Scroll horizontal piloté | largeur | scroll | sticky : éviter `overflow` sur parents (S14) | D T (M à simplifier) | transform | sticky + JS | **Absent** |
| E64 | Inertie du défilement (smooth scroll) | amortissement | molette/tactile | <5 ko annoncé, conserve le scroll natif (S6) ; peut gêner certains lecteurs/préférences : option | D T | léger | Lenis | **Absent** |
| E65 | Calage (scroll snap) | axe, rigueur `mandatory`/`proximity`, `scroll-snap-stop` | fin de scroll | `mandatory` piégeant si contenu plus grand que l'écran (S15) | tous | léger | CSS (S15) | **Existant** |
| E66 | Skew/étirement selon la vitesse | amplitude | vélocité | plafonner | D T | OK | JS | **Absent** |
| E67 | Entête qui rétrécit/se cache | seuil | scroll | — | tous | léger | JS | **Existant** (`headerFx`) |

## 8. Pinning et scènes

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E68 | Épinglage simple | décalage, limite | scroll | s'arrête au bord du parent ; seuil `top` obligatoire ; `overflow` d'un ancêtre casse l'effet (S14) | D T M | repaint possible | CSS `position: sticky` | **Existant** |
| E69 | Scène épinglée avec durée | longueur en px, étapes | scroll | espace ajouté (`pinSpacing`) (S5) | D T | moyen | Lib ScrollTrigger (S5) ou sticky + hauteur | **Absent** |
| E70 | Scrub avec rattrapage | délai | scroll | `scrub: 1` lisse mais retarde (S5) | D T | OK | Lib | **Absent** |
| E71 | Snap sur étapes d'une scène | labels | fin de scroll | (S5) | D T | OK | Lib | **Absent** |
| E72 | Cartes empilées (sticky stacking) | décalage, échelle | scroll | hauteur totale à prévoir | D T M | OK | sticky + CSS | **Absent** |
| E73 | Pied de page révélé | — | scroll | z-index/fixed | D T M | repaint | CSS | **Absent** |

## 9. Souris et pointeur

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E74 | Suivi du curseur (déplacement) | force, inversion | pointermove | pointeur fin uniquement | D | rAF | JS | **Existant** |
| E75 | Aimant (magnetic) | rayon, force | approche | idem | D | rAF | JS | **Absent** |
| E76 | Curseur personnalisé | forme, états | pointermove | masque le curseur natif : accessibilité ; jamais sur tactile | D | rAF | JS + CSS | **Absent** (propriété `cursor` seulement) |
| E77 | Traînée de curseur | longueur, fondu | pointermove | canvas/DOM ; coût | D | moyen | canvas | **Absent** |
| E78 | Traînée d'images | distance de dépôt, nombre max | pointermove | pool d'éléments, mémoire | D | moyen | DOM pool + WAAPI | **Absent** |
| E79 | Spotlight / lampe torche | rayon, dureté | pointermove | — | D | repaint | CSS variables `--x --y` | **Absent** |
| E80 | Bordure lumineuse suiveuse | couleur | pointermove | — | D | léger | CSS variables | **Absent** |
| E81 | Onde au clic (ripple) | couleur | clic/toucher | — | D T M | léger | CSS/JS | **Absent** |
| E82 | Glisser avec inertie | friction | pointerdown | `touch-action` correct | D T M | OK | JS | **Absent** |
| E83 | Image au survol d'une liste | image par ligne | survol | pas de survol au tactile → clic | D | léger | JS | **Absent** |
| E84 | Zoom à la loupe | échelle | survol/déplacement | — | D | transform | JS | **Absent** |

## 10. Tilt 3D et profondeur

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E85 | Inclinaison selon la souris | angle max | pointermove | pointeur fin | D | transform | JS | **Existant** (`mode: tilt`) |
| E86 | Reflet (glare) | intensité | pointermove | — | D | repaint | CSS gradient | **Absent** |
| E87 | Retournement de carte | axe, durée | survol, focus, clic | verso invisible aux lecteurs sans soin | D T M | transform | CSS 3D | **Existant** (`flipbox`) |
| E88 | Perspective de scène | profondeur par couche | souris, scroll | — | D T | transform | CSS 3D | **Incomplet** |
| E89 | Ombres dynamiques | décalage selon position | pointermove | `box-shadow` animé = paint | D | repaint | CSS vars | **Absent** |
| E90 | Cube / carrousel 3D | angle, rayon | clic, glisser | z-fighting, flou | D T | transform | CSS 3D | **Absent** |

## 11. Distorsions

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E91 | Vague/ondulation d'image | amplitude | survol | WebGL ou filtre SVG | D | élevé | WebGL / SVG | **Absent** |
| E92 | Transition par déplacement (displacement map) | carte, durée | clic | WebGL | D T | élevé | WebGL | **Absent** |
| E93 | Glitch / RGB split | intensité | survol/auto | épilepsie : éviter flashs rapides | D T M | moyen | CSS / canvas | **Absent** |
| E94 | Pixellisation | taille | survol | canvas | D | moyen | canvas/WebGL | **Absent** |
| E95 | Flou de mouvement (selon vitesse) | max | scroll | `filter: blur` coûteux | D | élevé | CSS filter | **Incomplet** (flou aux bords du défilement existe) |

## 12. Particules, glow, flou

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E96 | Particules en fond | nombre, vitesse, interaction | auto | canvas 2D : sprite pré-rendu, entiers, un seul `beginPath`, éviter `shadowBlur` (S16) | D T (M réduit) | moyen | canvas + rAF | **Absent** |
| E97 | Confettis / étincelles | nombre, gravité | clic, événement | durée brève | D T M | moyen | canvas | **Absent** |
| E98 | Lueur (glow) pulsante | couleur, rayon | auto, survol | `box-shadow`/`filter` animés = paint | D T M | repaint | CSS (animer opacité d'un pseudo-élément) | **Absent** |
| E99 | Flou d'arrière-plan (verre) | rayon | statique | `backdrop-filter` coûteux sur mobile | D T M | élevé | CSS | **Existant/à vérifier** |
| E100 | Taches mesh gradient mobiles | N blobs | auto | `blur` large = coûteux | D T | moyen/haut | CSS | **Absent** |
| E101 | Grain animé | intensité | auto | image répétée plutôt que filtre | D T M | léger | PNG/SVG | **Absent** |
| E102 | Étoiles / neige / pluie décoratives | densité | auto | pause hors écran | D T | moyen | canvas | **Absent** |

## 13. Transitions de pages et de layout

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E103 | Transition de page (même document) | durée, type | `document.startViewTransition()` (S16b) | support variable (tableau non lu) | navigateurs récents | géré par navigateur | View Transition API | **Absent** |
| E104 | Transition entre documents (MPA) | `@view-transition`, `pageswap`/`pagereveal` | navigation | idem ; focus/annonces mieux gérés via instantanés (S16b) | idem | idem | CSS + événements | **Absent** |
| E105 | Rideau de page | couleur, direction | navigation | masque le contenu : durée courte | D T M | léger | CSS/JS | **Absent** |
| E106 | Réarrangement fluide (FLIP) | durée | tri/filtre | mesure du DOM | D T M | moyen | JS / View Transition | **Absent** |
| E107 | Transition d'éléments partagés | nom de transition | navigation | noms uniques | récents | géré | `view-transition-name` | **Absent** |
| E108 | Précharge de transition | — | — | — | — | — | — | **Absent** |

## 14. Listes et grilles

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E109 | Entrée en cascade d'une grille | pas, ordre (ligne, diagonale) | visible | plafonner | D T M | OK | CSS/WAAPI | **Absent** |
| E110 | Filtre animé (disparition/réarrangement) | durée | clic filtre | FLIP | D T M | moyen | JS | **Incomplet** (filtre galerie sans transition fluide : à vérifier) |
| E111 | Ajout/retrait d'éléments | durée | données | — | tous | OK | CSS/FLIP | **Absent** |
| E112 | Survol d'une carte parmi d'autres (les autres s'estompent) | opacité | survol | `:has()` (support récent, non vérifié) | D | léger | CSS | **Absent** |
| E113 | Pagination / chargement infini avec entrée | seuil | scroll | a11y du focus | tous | OK | IO | **Incomplet** |

## 15. Micro-interactions et feedback

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E114 | Bouton : remplissage/flèche | durée | survol, focus | focus visible obligatoire | tous | léger | CSS | **Incomplet** |
| E115 | Lien : soulignement dessiné | durée | survol | — | tous | léger | CSS | **Incomplet** |
| E116 | Case/interrupteur animé | durée | clic | état en ARIA | tous | léger | CSS/SVG | **Existant** (toggle) / checkbox **Absent** |
| E117 | Validation de formulaire (succès/erreur) | secousse, tracé | submit | annonce par live region | tous | léger | CSS + ARIA | **Incomplet** |
| E118 | Notification (toast) | durée, position | événement | ne pas disparaître trop vite | tous | léger | JS | **Incomplet** (éditeur) |
| E119 | Infobulle | délai | survol, focus | clavier | tous | léger | CSS | **Existant** |
| E120 | Pression (`:active` scale) | facteur | pointerdown | — | tous | léger | CSS | **Existant** |
| E121 | Copie réussie (check animé) | durée | clic | — | tous | léger | JS | **Existant** (code : « copier ») |
| E122 | Haptique (vibration) | motif | clic | API non universelle (non vérifié) | M | — | JS | **Absent** |

## 16. Chargement

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E123 | Préchargeur de page | % réel / fictif | chargement | ne pas retarder le contenu (LCP) | tous | léger | JS+CSS | **Absent** |
| E124 | Spinner / points | taille | attente | `role="status"` | tous | léger | CSS | **Absent** (site publié) |
| E125 | Skeleton shimmer | formes | attente | — | tous | léger | CSS | **Absent** |
| E126 | Image : flou → net | durée | chargement | génère un LQIP | tous | léger | CSS | **Absent** (non vérifié) |
| E127 | Barre de progression de navigation | — | navigation | — | tous | léger | CSS/JS | **Absent** |
| E128 | Lecture paresseuse des animations lourdes | seuil | proximité | déjà fait pour Lottie | tous | gain | IO | **Existant** (Lottie) |

## 17. Chiffres

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E129 | Compteur qui monte | début/fin, durée, séparateur | visible | valeur finale dans le HTML pour a11y/SEO | tous | léger | JS | **Existant** |
| E130 | Odomètre (chiffres qui roulent) | colonnes | visible | police à chasse fixe conseillée | tous | transform | CSS | **Absent** |
| E131 | Anneau/arc de progression | valeur | visible | — | tous | léger | SVG | **Incomplet** |
| E132 | Barres qui se remplissent | valeur | visible | animer `transform: scaleX` plutôt que `width` | tous | transform | CSS | **Existant** (progress) |
| E133 | Compte à rebours | échéance | auto | fuseau horaire | tous | léger | JS | **Existant** |

## 18. 3D, caméra et fonds animés

| ID | Effet | Paramètres | Déclencheurs | Limites | App. | Perf | Technique | Kolakisa |
|---|---|---|---|---|---|---|---|---|
| E134 | Rotation automatique de modèle | vitesse | auto | .glb lourd ; repli image | D T (M selon appareil) | élevé | Three.js (S17 : page non lue, 404) | **Absent** |
| E135 | Orbite (glisser pour tourner) | limites | pointeur | `touch-action` | D T M | élevé | Three.js | **Absent** |
| E136 | Caméra pilotée par le scroll | trajectoire | scroll | synchroniser WebGL et DOM (Lenis le permet, S6) | D T | élevé | Three.js + Lenis | **Absent** |
| E137 | Séquence d'images (360°) | N images | scroll/glisser | poids ; canvas | D T M | moyen/haut | canvas | **Absent** |
| E138 | Fond shader | uniformes | auto | repli statique en mobile modeste | D T | élevé | WebGL | **Absent** |
| E139 | Fond dégradé qui dérive | couleurs, vitesse | auto | animer `background-position` = paint ; préférer pseudo-élément transformé | tous | moyen | CSS | **Absent** |
| E140 | Vidéo de fond | source, mute, boucle | auto | autoplay muet obligatoire ; poids | tous | élevé réseau | `<video>` | **Incomplet** (`video`) |
| E141 | Aurora / blobs | N, flou | auto | cf. E100 | D T | moyen/haut | CSS | **Absent** |

## 19. Effets combinés (recettes)

| ID | Recette | Composition | Techniques | Kolakisa |
|---|---|---|---|---|
| E142 | Hero cinématique | entrée en cascade + parallaxe souris + masque d'image | E10, E54, E36 | **Incomplet** (briques présentes sauf cascade) |
| E143 | Titre éditorial | révélation par ligne + soulignement dessiné | E23, E32 | **Absent** |
| E144 | Produit en séquence | épinglage + séquence d'images + textes qui changent | E69, E137 | **Absent** |
| E145 | Cartes empilées premium | sticky + échelle décroissante + flou léger | E72 | **Absent** |
| E146 | Galerie immersive | scroll horizontal piloté + parallaxe d'image + curseur personnalisé | E63, E56, E76 | **Absent** |
| E147 | Menu plein écran | rideau + cascade de liens + roll au survol | E105, E10, E31 | **Absent** |
| E148 | Carte produit « verre » | tilt + reflet + ombre dynamique | E85, E86, E89 | **Incomplet** (tilt seul) |
| E149 | Liste de projets | image suiveuse + autres éléments estompés | E83, E112 | **Absent** |
| E150 | Bande de marque réactive | marquee + vélocité de scroll | E66 | **Incomplet** (marquee CSS) |

---

## Matrice rapide « quelle technique ? »

| Besoin | Choix recommandé | Pourquoi (source) |
|---|---|---|
| Apparition, survol, états | CSS pur | compositeur, sans JS (S1) |
| Séquence/cascade, lecture contrôlée (pause, inverse) | WAAPI | API native `Element.animate()` avec objet `Animation` (S3) |
| Révélation à la vue | IntersectionObserver + classe CSS | `threshold`, `rootMargin`, `unobserve` (S8) |
| Progression liée au scroll simple | CSS `animation-timeline: view()` avec repli | Baseline récente (S10) |
| Scènes épinglées complexes, scrub, snap | GSAP ScrollTrigger (ou sticky + JS maison) | pin, scrub, snap, markers (S5) |
| Texte découpé | découpage maison léger ; GSAP SplitText comme référence de fonctions | chars/words/lines, masque, aria, autoSplit (S9) |
| Ressorts, gestes, layout | Motion | springs, scroll, layout (S4) |
| Inertie de scroll | Lenis | <5 ko, scroll natif conservé (S6) |
| Transitions de pages | View Transition API | même document et MPA (S16b) |
| Animations vectorielles | lottie-web (déjà) ; Rive pour l'interactif | (S13) |
| Particules | canvas 2D optimisé | (S16) |
| 3D | CSS 3D si possible, Three.js sinon | non vérifié (S17 = 404) |

## Sources consultées

Pages réellement ouvertes (WebFetch, 2026-11-05) :
- S1 https://web.dev/articles/animations-guide
- S2 https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- S3 https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API (la page ne détaille pas le compositeur ni le support : non affirmé ici)
- S4 https://motion.dev/docs (taille et `inView` non lus)
- S5 https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- S6 https://lenis.dev/
- S7 https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
- S8 https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
- S9 https://gsap.com/docs/v3/Plugins/SplitText/
- S10 https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view
- S11 https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image
- S12 https://docs.lottiefiles.com/
- S13 https://rive.app/docs/runtimes/web/web-js
- S14 https://developer.mozilla.org/en-US/docs/Web/CSS/position
- S15 https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap
- S16 https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- S16b https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- Pour l'inspiration créative : https://www.awwwards.com/websites/animations/ (étiquettes seulement)

Ouvertes mais en échec : S17 https://threejs.org/manual/en/fundamentals.html (404) ; https://tympanus.net/codrops/ (403). Le contenu 3D/WebGL, les distorsions, le glitch, les gyroscopes, `offset-path`, `:has()` et le haptique sont donc de connaissance générale, **non vérifiés par source**.
Sources internes lues : `src/marketing/pages/motion.js`, `public/js/kw-effects.js`, `public/js/page-builder-effects.js`, `public/js/kb-motion.js`, `src/marketing/pages/nodes.js` (SCROLL_FX, MOUSE_MODES, MASK_SHAPES).
