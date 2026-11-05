# Technologies de motion web : étude comparative pour Kolakisa Motion Studio

Date de recherche : 2026-11-05. Références [S..] : voir `MOTION_STUDIO_SOURCES.md`.

## Méthode et limites
- **Versions et licences** : lues sur le registre npm (requête `registry.npmjs.org/<paquet>/latest`) [S7] et, pour GSAP, sur la page de licence officielle [S1].
- **Poids** : mesurés le 2026-11-05 en téléchargeant les fichiers `dist` sur jsDelivr puis en les compressant avec `gzip -9` (valeurs "ko gzip"). Ce sont des mesures maison, légèrement différentes de Bundlephobia (ex. GSAP : 28,4 ko mesurés ici contre 26,8 ko sur Bundlephobia [S5]). Bundlephobia a répondu 429 (trop de requêtes) pour lottie-web, three, lenis, animejs, dotlottie-web ; seules les pages GSAP [S5] et Motion [S6] ont été lues.
- **Stack Kolakisa** (Node/Express/EJS, JS vanilla côté éditeur) : "compatible" veut dire utilisable sans React ni étape de compilation obligatoire.
- Tout ce qui n'a pas de source est marqué **non vérifié**.
- Cadre interne : le projet impose déjà `docs/KOLAKISA_MOTION.md` (durées 120/180/260 ms, une courbe, pas de propriété de mise en page animée) et `public/js/kb-motion.js`. Ce document ne les remplace pas ; il en est complémentaire pour le contenu des sites créés.

## 1. Tableau comparatif

| Technologie | Cas d'usage | Points forts | Limites | Licence (vérifiée 2026-11-05) | Décision Kolakisa |
|---|---|---|---|---|---|
| CSS Animations / Transitions | Micro-interactions, entrées, boucles simples | Zéro JS, hors thread principal si transform/opacity [S16][S18] | Pas de séquençage complexe, pas de contrôle fin | Standard web | **Adopter (base)** |
| Scroll-driven animations CSS (`animation-timeline`) | Révélations, parallaxe, progression de lecture | Hors thread principal [S17], zéro JS | Récent : MDN indique "Baseline 2026 newly available", disponible depuis octobre 2026 [S22] ; anciens navigateurs sans support | Standard web | **Adopter avec `@supports` et repli** |
| Web Animations API | Lecture/pause/seek en JS sur animations natives | Contrôle de lecture, `getAnimations()`, sert aussi aux timelines de scroll [S9][S17] | Pas de séquenceur de haut niveau | Standard web | **Adopter (socle JS)** |
| View Transitions API | Transitions de page et d'état | Même document et entre pages (`@view-transition`) [S8] | Support non vérifié navigateur par navigateur (tableau MDN non lu) | Standard web | **Adopter en amélioration progressive** |
| Motion (ex Framer Motion) version vanilla | Séquences, ressorts, stagger, scroll | `animate()` 3,2 ko (mini) [S4], vanilla sans build [S3] | Le paquet `motion` complet pèse 57,9 ko gzip [S6] (arborescent) ; hybride 22 ko [S4] | MIT [S7][S33] | **Adopter (moteur JS unique)** |
| GSAP + plugins | Timelines pro, ScrollTrigger, SplitText | Très complet, accessibilité de SplitText [S15] | **Clause "usage interdit" liée aux outils visuels concurrents de Webflow** [S1] | Licence "Standard" gratuite [S1] | **Reporter : ne pas livrer tant que l'avis juridique n'est pas obtenu** |
| Lottie (lottie-web) | Animations After Effects exportées | SVG/canvas/HTML, export Bodymovin [S28] | 76 ko gzip (complet), dernière publication npm 2025-05-21 [S7] | MIT [S7][S28] | **Exclure (doublon avec dotLottie)** |
| dotLottie (dotlottie-web) | Lottie JSON et .lottie, thèmes, machines d'état | Rust+WASM, worker, WebGL2, thèmes, machines d'état [S32] | WASM 491 ko gzip à charger | MIT [S7][S32] | **Adopter, chargement à la demande** |
| Rive | Animations interactives à machine d'état | Machines d'état, éditeur dédié [S26] | Runtime 151 ko gzip + WASM 931 ko gzip ; WASM chargé par défaut depuis unpkg [S27] | MIT (runtime) [S7][S39] | **Phase 2, optionnel, auto-hébergé** |
| Three.js | Scènes 3D | Standard 3D web, WebGL/WebGPU [S31] | ~195 ko gzip (deux fichiers) | MIT [S7][S31] | **Phase 2, bloc "3D" à la demande** |
| React Three Fiber / Drei | 3D déclarative | Écosystème React [S34] | Exige React (v9 pour React 19) [S34] | MIT [S7] | **Exclure (pas de React)** |
| Lenis | Défilement fluide | 5,4 ko gzip, respecte reduced-motion [S13] | Risque de scroll-hijacking si mal réglé ; limites Safari/iframes [S13] | MIT [S7][S13] | **Option désactivée par défaut** |
| Anime.js v4 | Timelines, SVG, scroll | Modulaire, riche [S36] | 40,6 ko gzip (bundle UMD complet) ; doublon avec Motion | MIT [S7][S37] | **Exclure (doublon)** |
| React Spring | Ressorts dans React | Physique [S35] | Exige React | MIT [S7] | **Exclure** |
| SVG (SMIL, tracés, morphing) | Dessin de tracés, icônes | `<animate>` Baseline Widely available [S10] | SMIL : pas de contrôle JS fin ; morphing natif limité | Standard web | **Tracés via CSS/Motion ; SMIL non utilisé** |
| Canvas / shaders : OGL | Fonds WebGL légers | Core 8 ko + Math 6 + Extras 15 = 29 ko minzip (annonce du README) [S38] | Public domain mais peu de vérification d'activité [S38] | Unlicense [S7][S38] | **Phase 2 (fond shader), à la place de Three pour les shaders** |
| tsParticles | Particules | Configurable | 46 ko gzip (slim bundle) | MIT [S7] | **Exclure (décoratif, doublon canvas simple)** |
| Export After Effects vers le web (Bodymovin, LottieFiles, Rive) | Pipeline de création | Bodymovin exporte du JSON pour lottie [S28] | Pas de vidéo/audio/séquences d'images [S28] | Fichiers LottieFiles : voir §3 | **Importer .json/.lottie ; pas d'outil intégré** |
| Prototypes animés (Figma Smart Animate) | Prototypage de design | Anime les différences entre cadres [S40] | Pas de code de production | Propriétaire (non lu) | **Hors périmètre, référence de design seulement** |

## 2. Détail par technologie

### 2.1 GSAP (core, ScrollTrigger, SplitText, Flip, MorphSVG, DrawSVG)
- **Version et licence actuelles** : version 3.15.1 publiée le 2026-11-04 ; champ licence npm : "Standard 'no charge' license" [S7].
  - La page officielle `gsap.com/standard-license` (date d'effet 30 avril 2025, modifiée le 30 mai 2025) indique que l'usage commercial est couvert, que les plugins autrefois réservés aux membres (SplitText, MorphSVG cités en exemple) sont utilisables sans frais [S1]. Le texte définit "GSAP Products" comme incluant "related plugins, tools, or extensions" ; ScrollTrigger, Flip et DrawSVG ne sont pas nommés un par un dans ce que j'ai lu, mais relèvent de la même définition (**interprétation, non confirmée plugin par plugin**) [S1].
  - La page tarifs confirme : "GSAP is now free for everyone, thanks to Webflow's support" [S2]. Oui, la gratuité vient du rachat par Webflow (équipe GSAP employée par Webflow) [S2].
  - **Point critique pour Kolakisa** : la licence interdit d'utiliser GSAP pour un outil d'animation visuel sans code qui "materially assists in creating a solution that competes with Webflow's visual animation building capabilities" [S1]. Le code généré par IA n'est pas un usage interdit [S1]. Un éditeur visuel de motion intégré à un page builder peut entrer dans cette zone. La page invite à contacter GSAP pour les cas incertains [S1]. **Conséquence : décision juridique requise avant d'embarquer GSAP dans l'éditeur ou dans les sites générés par l'éditeur.** Je n'ai pas d'avis juridique ; c'est un risque signalé, non une conclusion.
- **Fonctionnalités** : timelines, ScrollTrigger (pin, scrub, snap) [S14], SplitText (chars/words/lines, `aria-label` auto, masques, `autoSplit`) [S15]. Flip, MorphSVG, DrawSVG : fonctionnalités **non vérifiées** par pages de doc (seulement poids mesuré).
- **Poids (ko gzip, `gzip -9`, 3.15.1)** : gsap.min 28,4 (Bundlephobia : 26,8 [S5]) ; ScrollTrigger 18,0 ; SplitText 3,7 ; Flip 9,7 ; MorphSVG 9,6 ; DrawSVG 2,2 [S41].
- **Personnalisation** : thème par JS, nombreux paramètres d'easing. Détail d'easings **non vérifié** ici.
- **Accessibilité** : SplitText gère `aria-label`/`aria-hidden` ; sur ScrollTrigger, la page lue ne mentionne pas `prefers-reduced-motion` ; `gsap.matchMedia()` est mentionné comme API de réglages par media query [S14]. La gestion reduced-motion est donc à écrire.
- **Compatibilité vanilla/Express** : bonne (fichiers UMD sur jsDelivr [S41]). Dépendances : aucune [S7].
- **Maintenance** : publiée la veille de la recherche [S7] ; soutenue par Webflow [S2]. Risque : dépendance à un seul éditeur dont les conditions peuvent évoluer (la licence a changé en 2025 [S1]).
- **Intégration page builder** : excellente techniquement, bloquée juridiquement à ce stade.
- **Décision** : **reporter / exclure de la v1** ; réévaluer après avis écrit de GSAP/Webflow. Le design du studio est indépendant du moteur (voir stack).

### 2.2 Motion (ex Framer Motion)
- **Version / licence** : `motion` 14.9.1 (2026-11-04), MIT ; dépend de `framer-motion` et `tslib` [S7]. Le dépôt confirme MIT [S33]. "Framer Motion est maintenant Motion" [S33].
- **Fonctionnalités** : `animate()` sur sélecteur ou éléments, CSS, SVG, transformations indépendantes (x, rotateY), objets JS, ressorts, `stagger()`, scroll lié et déclenché par entrée dans la vue [S3].
- **Poids** : mini `animate()` 3,2 ko ; hybride 22 ko [S4] ; paquet complet 57,9 ko gzip (arborescent, deux dépendances) [S6]. Cette dernière mesure concerne l'entrée complète et surestime l'usage réel.
- **Vanilla** : fonctionne sans build via balise script ou modules ES ; la page conseille de figer la version [S3].
- **Motion+** : offre payante (exemples, éditeur de transitions, etc.) ; le coeur n'est pas décrit comme payant [S33].
- **Accessibilité** : page lue sans note d'accessibilité ; **reduced-motion non vérifié** pour la version vanilla, à gérer par le studio.
- **Maintenance** : publication quotidienne récente, sponsors multiples [S7][S33].
- **Décision** : **adopter comme moteur JS unique** pour séquences, ressorts, stagger, scroll.

### 2.3 Lottie (lottie-web)
- 5.13.0, MIT, dernière publication npm : 2025-05-21 (donc ~5,5 mois sans publication à la date de recherche) [S7]. Le dépôt affiche 791 tickets ouverts ; la page des releases GitHub est vide [S28][S29].
- Rendus : svg, canvas, html ; expressions After Effects supportées ; pas de vidéo, audio, séquences d'images ; masques inversés coûteux [S28].
- Poids : complet 76,1 ko gzip ; version light 46,5 ko gzip [S41].
- **Décision** : exclure (doublon avec dotLottie qui lit aussi le JSON [S32]).
- Licence des fichiers LottieFiles : usage commercial autorisé, mêmes conditions à la redistribution, pas de service concurrent, attribution encouragée [S30]. Bien distincte de la licence du code.

### 2.4 dotLottie (dotlottie-web)
- 0.82.1, MIT [S7][S32]. Lit `.json` et `.lottie`, moteur Rust+WASM (ThorVG), rendu Canvas2D/WebGL2/WebGPU expérimental, `DotLottieWorker` (OffscreenCanvas), machines d'état dans les fichiers dotLottie v2, thèmes [S32].
- Poids : `index.js` 30,9 ko gzip ; WASM logiciel 491 ko gzip (1,23 Mo brut) ; worker 14,7 ko gzip [S41]. Poids total significatif : chargement strictement à la demande.
- Auto-hébergement du WASM : la page lue ne mentionne pas `setWasmUrl` ; **non vérifié**. À tester en prototype avant décision définitive.
- Version 0.x : l'API peut encore changer (inférence sur le numéro de version, non sourcée sur la politique).
- Accessibilité : non traitée dans les pages lues ; à gérer (pause, `aria-hidden` décoratif).
- **Décision** : adopter pour les animations vectorielles importées.

### 2.5 Rive
- Runtime `@rive-app/canvas` 2.49.4, MIT [S7] ; dépôt rive-wasm MIT [S39]. Paquets : webgl2 (recommandé), canvas, canvas-lite [S26].
- Machines d'état : il faut passer `stateMachine` sinon seule la première animation linéaire joue [S26].
- Poids : `rive.js` 151,2 ko gzip ; `rive.wasm` 931,3 ko gzip (2,24 Mo brut) [S41]. canvas-lite : JS 121,0 ko gzip (WASM lite non mesuré).
- WASM chargé par défaut depuis unpkg (`unpkg.com/@rive-app/canvas@x.x.x/rive.wasm`) ; auto-hébergement possible avec `RuntimeLoader.setWasmUrl()`, version identique au paquet, type MIME `application/wasm`, mise en cache [S27]. Cela confirme que le défaut contredit la règle "pas de CDN" et qu'il faut surcharger.
- L'éditeur Rive est un produit externe ; ses conditions commerciales n'ont pas été lues (**non vérifié**).
- Accessibilité : non traitée par les pages lues.
- **Décision** : phase 2, bloc "interactif Rive" optionnel.

### 2.6 Three.js
- 0.187.0, MIT [S7][S31]. Publié le 2026-10-30 [S7]. Renderers WebGL et WebGPU ; SVG/CSS3D en addons [S31].
- Poids : `three.module.min.js` 89,4 ko gzip + `three.core.min.js` 105,4 ko gzip, soit environ 195 ko gzip [S41].
- Pas de notes d'accessibilité sur le dépôt [S31] : à compenser (alternative texte, pause, version statique).
- **Décision** : phase 2, bloc "3D" chargé à la demande, jamais sur la page par défaut.

### 2.7 React Three Fiber / Drei
- R3F 9.8.2, Drei 10.7.9, MIT [S7]. R3F est un renderer React, la v9 correspond à React 19 [S34]. Drei dépend notamment de hls.js [S7].
- **Exclure** : l'éditeur n'utilise pas React.

### 2.8 CSS Animations et Transitions
- `@keyframes`, `animation`, événements `animationstart/iteration/end` [S12]. Éviter les propriétés du modèle de boîte [S12]. L'accessibilité n'est pas couverte par cette page MDN ; la règle reduced-motion vient de [S11].
- **Décision** : socle de tout le système ; effets prédéfinis du studio compilés en CSS quand c'est possible.

### 2.9 CSS scroll-driven animations
- `animation-timeline: scroll()` / `view()`, durée de 1 ms comme espace réservé, `animation` shorthand réinitialise `animation-timeline` donc à déclarer après [S22].
- Support : MDN annonce "Baseline 2026 Newly available" (depuis octobre 2026) [S22]. L'article Chrome liste Chrome 115, Edge 115, Firefox 159, Safari 26 [S17]. Pas de polyfill mentionné dans l'article Chrome [S17].
- Repli recommandé par MDN : `@supports (animation-timeline: scroll())` [S22].
- Anciennes versions de navigateurs : sans support ; il faut un état final statique (ou un petit IntersectionObserver) en repli (recommandation Kolakisa).
- **Décision** : adopter.

### 2.10 Web Animations API
- `Element.animate()`, `getAnimations()`, `document.timeline` ; accessibilité : offrir pause/désactivation et respecter `prefers-reduced-motion` [S9]. Le support navigateur n'est pas dans la page lue : **non vérifié** ici.
- **Décision** : adopter comme couche de contrôle (pause globale, mode réduit).

### 2.11 SVG (SMIL, tracés, morphing)
- `<animate>` SMIL : Baseline Widely available selon MDN ; avertissement sur clignotement/vertige ; recommandation de pause et reduced-motion [S10]. Le statut de dépréciation de SMIL n'est pas dans la page : **non vérifié** (la page ne l'indique pas).
- Tracés (stroke-dasharray/offset) : faisables en CSS/Motion (technique connue, **non sourcée** ici).
- Morphing : Anime.js (`morphTo`) [S36], GSAP MorphSVG (poids [S41]) ; Motion : non vérifié.
- **Décision** : pas de SMIL ; tracés par CSS/Motion ; morphing hors v1.

### 2.12 Lenis
- 1.3.27, MIT, 5,4 ko gzip [S7][S41]. Enveloppe le scroll natif (sticky, ancres), respecte `prefers-reduced-motion` par défaut avec `respectReducedMotion: true` (déconseillé de désactiver) ; limites : 60 fps max sur Safari, iframes, nested scroll [S13].
- Hijacking : non traité directement, mais contrôles `smoothWheel`, `syncTouch`, `prevent` disponibles [S13]. NN/g met en garde contre le scroll-jacking [S20].
- **Décision** : option par site, désactivée par défaut.

### 2.13 Anime.js v4
- 4.5.0, MIT [S7][S37]. Modules : Timer, Animation, Timeline, Draggable, Layout, SVG, Text, scroll observer, WAAPI [S36]. 40,6 ko gzip pour le bundle UMD complet [S41] (version modulaire plus légère, non mesurée).
- Financé par sponsors GitHub [S37].
- **Décision** : exclure, fonctions couvertes par Motion + CSS.

### 2.14 React Spring
- `@react-spring/web` 10.1.2, MIT [S7] ; pour React 19 (v9 sinon) [S35]. **Exclure** (React).

### 2.15 View Transitions API
- `document.startViewTransition()`, `@view-transition { navigation: auto }`, événements `pageswap`/`pagereveal`, pseudo-éléments `::view-transition-*` [S8].
- Accessibilité : réduit la confusion de focus et de lecteur d'écran par rapport à un double DOM, mais la page ne traite pas `prefers-reduced-motion` : l'ajouter [S8].
- Support : **non vérifié** (tableau de compatibilité non lu). Toujours détecter la fonction [S8].
- **Décision** : amélioration progressive pour les sites générés (navigation et transitions d'état).

### 2.16 Canvas, particules, shaders (OGL, tsParticles)
- OGL 1.0.11, Unlicense (domaine public) [S7][S38], sans dépendance, API proche de Three, 29 ko minzip annoncés (README) [S38]. Je n'ai pas pu mesurer le fichier en gzip (le dépôt npm n'expose que les sources ES, pas de bundle), donc **chiffre = affirmation du README**.
- tsParticles slim 4.5.1, MIT, bundle slim minifié 46,1 ko gzip [S7][S41].
- **Décision** : OGL phase 2 pour fonds shader ; tsParticles exclu.

### 2.17 Export After Effects vers le web
- Bodymovin exporte du JSON depuis After Effects ; installation via aescripts, Adobe Exchange, ZXP, manuelle ou Homebrew ; images dans un dossier voisin ; vidéo/audio/séquences d'images non supportés [S28].
- LottieFiles : format `.lottie` (conteneur dotLottie), SDK sous licence MIT [S42]. Fichiers LottieFiles publics : conditions [S30].
- Rive : voir 2.5.
- **Décision** : le studio accepte `.json` Lottie et `.lottie` ; export lui-même hors périmètre.

### 2.18 Outils de prototypes animés
- Figma Smart Animate : met en correspondance les calques de cadres successifs par nom et position, anime échelle, position, opacité, rotation, remplissage ; ombres non supportées (repli en fondu) ; easing et durée réglables [S40].
- Autres outils (Principle, ProtoPie, Jitter) : **non vérifiés**, non lus.
- **Décision** : hors intégration ; servent de référence d'équipe.

## 3. Synthèse des licences vérifiées (2026-11-05)

| Technologie | Version npm | Licence | Source |
|---|---|---|---|
| GSAP (+ plugins) | 3.15.1 | "Standard 'no charge' license", gratuit y compris commercial, avec usages interdits (outils visuels concurrents de Webflow) | [S1][S7] |
| Motion | 14.9.1 | MIT | [S7][S33] |
| lottie-web | 5.13.0 | MIT | [S7][S28] |
| dotlottie-web | 0.82.1 | MIT | [S7][S32] |
| @rive-app/canvas | 2.49.4 | MIT | [S7][S39] |
| three | 0.187.0 | MIT | [S7][S31] |
| @react-three/fiber / drei | 9.8.2 / 10.7.9 | MIT | [S7] |
| Lenis | 1.3.27 | MIT | [S7][S13] |
| animejs | 4.5.0 | MIT | [S7][S37] |
| @react-spring/web | 10.1.2 | MIT | [S7] |
| ogl | 1.0.11 | Unlicense | [S7][S38] |
| @tsparticles/slim | 4.5.1 | MIT | [S7] |

Limite : licences lues dans le champ npm et les pages ; le texte complet de chaque fichier LICENSE n'a pas été relu, sauf GSAP.

## 4. Poids mesurés (ko gzip, 2026-11-05)

| Fichier | Brut (ko) | gzip -9 (ko) |
|---|---|---|
| gsap.min.js 3.15.1 | 71,6 | 28,4 |
| ScrollTrigger.min.js | 43,6 | 18,0 |
| SplitText.min.js | 7,8 | 3,7 |
| Flip.min.js | 25,0 | 9,7 |
| MorphSVGPlugin.min.js | 20,7 | 9,6 |
| DrawSVGPlugin.min.js | 4,2 | 2,2 |
| lottie.min.js 5.13.0 | 298,5 | 76,1 |
| lottie_light.min.js | 164,4 | 46,5 |
| three.module.min.js + three.core.min.js 0.187.0 | 383 + 412 | 89,4 + 105,4 |
| lenis.min.js 1.3.27 | 18,4 | 5,4 |
| anime.umd.min.js 4.5.0 | 115,3 | 40,6 |
| dotlottie-web index.js 0.82.1 | 155,2 | 30,9 |
| dotlottie-player.wasm | 1197 | 491,1 |
| dotlottie.worker.js | 72,7 | 14,7 |
| @rive-app/canvas rive.js 2.49.4 | 662,2 | 151,2 |
| @rive-app/canvas rive.wasm | 2191 | 931,3 |
| @rive-app/canvas-lite rive.js | 526,9 | 121,0 |
| tsparticles.slim.bundle.min.js 4.5.1 | 158,4 | 46,1 |
| Motion `animate()` mini / hybride | non mesuré | 3,2 / 22 (annonce motion.dev [S4]) |
| Motion paquet complet | 171,7 | 57,9 (Bundlephobia [S6]) |

Unités : colonne "Brut" en Kio (1024 o), colonne gzip en ko (1000 o), arrondis au dixième. Les chiffres jsDelivr sont de [S41].

## 5. Stack retenue pour Kolakisa Motion Studio

### Principes
1. **Un seul moteur par rôle** : CSS pour l'état et les entrées simples, WAAPI pour le contrôle, Motion pour les séquences/ressorts, dotLottie pour les assets vectoriels. Pas de deuxième moteur JS (donc pas d'Anime.js, GSAP en parallèle de Motion, ni React Spring).
2. **Chargement à la demande** : le JS d'un effet n'est chargé que si la page l'utilise (import dynamique ou balise insérée au premier besoin). Aucun fichier de motion dans une page sans effet.
3. **Auto-hébergement** : tout sert depuis le domaine du site (par exemple `/vendor/motion/<version>/`), versions figées dans le nom de fichier. Pas de CDN (Rive charge par défaut depuis unpkg : à surcharger, [S27]).
4. **Accessibilité d'office** : variante reduced-motion pour chaque effet, pause pour les boucles de plus de 5 s, zéro flash [S11][S23][S24][S25].
5. **Amélioration progressive** : `@supports` pour les scroll-driven animations [S22], détection de `startViewTransition` [S8].

### Contenu
| Phase | Technologies | Justification |
|---|---|---|
| v1 | CSS Animations/Transitions ; scroll-driven CSS avec repli ; WAAPI ; View Transitions (option) ; Motion (`animate`, `stagger`, `scroll`) ; dotLottie-web (chargement à la demande, après test d'auto-hébergement du WASM) ; Lenis (option off par défaut) | MIT, vanilla, couverture large, poids ciblé : 3,2 ko pour les séquences simples [S4], 5,4 ko pour Lenis |
| v2 | Rive (bloc interactif) ; OGL (fonds shader) ; Three.js (bloc 3D) | Lourds (Rive environ 1,1 Mo gzip, Three environ 195 ko gzip) donc en blocs distincts, jamais par défaut |
| À trancher | GSAP | Avis juridique nécessaire à cause de la clause sur les outils d'animation visuels [S1]. Si autorisé par écrit : ajouter ScrollTrigger et SplitText comme remplacements ciblés, et retirer le doublon avec Motion pour ces cas |
| Exclus | lottie-web, Anime.js, React Spring, R3F/Drei, tsParticles, SMIL | Doublons, dépendance à React, ou décoratif lourd |

### Intégration avec l'existant
- Se brancher sur `public/js/kb-motion.js` et ses trois niveaux `html[data-kb-motion]` : le niveau "réduit" doit forcer la variante reduced-motion de chaque effet. Je n'ai pas lu ce fichier dans cette recherche ; à vérifier au moment de l'implémentation.
- Les valeurs (durées 120/180/260 ms, une courbe) du document `docs/KOLAKISA_MOTION.md` restent la règle pour l'interface d'administration ; les sites créés peuvent disposer de préréglages plus riches, dans les bornes NN/g (100 à 500 ms) [S20].

### Points ouverts
1. Avis juridique GSAP / Webflow (bloquant pour GSAP).
2. Test d'auto-hébergement du WASM de dotLottie (non documenté dans les pages lues).
3. Tableaux de compatibilité navigateurs pour WAAPI et View Transitions (non lus).
4. Comportement reduced-motion de Motion vanilla (non vérifié).
5. Mesures Bundlephobia manquantes pour plusieurs paquets (429) ; mesures maison utilisées.
