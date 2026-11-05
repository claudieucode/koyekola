# Sources consultées pour Kolakisa Motion Studio

Date de consultation de toutes les sources : **2026-11-05**. Seules figurent ici les pages réellement ouvertes. Les contenus ont été lus via l'outil WebFetch (qui renvoie un résumé de la page) ou via requêtes HTTP directes (npm, jsDelivr) : les citations sont donc des paraphrases fidèles du résumé obtenu, pas une relecture intégrale du texte brut. Les "Fiabilité" notent le type d'autorité (officiel, communautaire, tiers).

| Id | Titre | URL | Auteur / organisme | Type | Sujet | Fiabilité / version |
|---|---|---|---|---|---|---|
| S1 | GSAP Standard License | https://gsap.com/standard-license/ | GSAP / Webflow | Licence officielle | Gratuité, usage commercial, usages interdits | Officiel ; effet 2025-04-30, modifiée 2025-05-30 |
| S2 | GSAP Pricing | https://gsap.com/pricing/ | GSAP / Webflow | Page produit | GSAP gratuit grâce à Webflow | Officiel ; ne détaille pas les conditions |
| S3 | Motion : Quick start | https://motion.dev/docs/quick-start | Motion (Matt Perry) | Documentation | Usage vanilla, animate, scroll, installation | Officiel ; licence non affichée sur la page |
| S4 | Motion : animate() | https://motion.dev/docs/animate | Motion | Documentation | Tailles mini 3,2 ko et hybride 22 ko, stagger | Officiel |
| S5 | Bundlephobia : gsap | https://bundlephobia.com/package/gsap | Bundlephobia | Outil de mesure | gsap 3.15.1 : 69 ko min, 26,8 ko gzip | Tiers fiable ; lu 1 fois |
| S6 | Bundlephobia : motion | https://bundlephobia.com/package/motion | Bundlephobia | Outil de mesure | motion 14.9.1 : 171,7 ko min, 57,9 ko gzip | Tiers fiable |
| S7 | Registre npm (API JSON `latest` et métadonnées) pour gsap, motion, lottie-web, @lottiefiles/dotlottie-web, @rive-app/canvas, @rive-app/canvas-lite, three, lenis, animejs, @react-spring/web, ogl, @tsparticles/slim, @tsparticles/engine, @react-three/fiber, @react-three/drei, framer-motion | https://registry.npmjs.org/<paquet>/latest | npm, Inc. | Registre de paquets | Versions, champ licence, dépendances, dates de publication | Source primaire pour les versions ; le champ licence est déclaratif |
| S8 | View Transition API | https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API | MDN / Mozilla | Documentation de référence | Transitions SPA et MPA, accessibilité | Référence ; tableau de compatibilité non lu |
| S9 | Web Animations API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API | MDN | Documentation | Interfaces, accessibilité | Référence ; support non lu |
| S10 | SVG `<animate>` | https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animate | MDN | Documentation | SMIL, accessibilité, Baseline | Référence |
| S11 | prefers-reduced-motion | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | MDN | Documentation (lue jusqu'à 100 000 caractères) | Syntaxe, réglages OS, Baseline Widely available | Référence |
| S12 | Using CSS animations | https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using | MDN | Documentation (lue jusqu'à 100 000 caractères) | Keyframes, performance | Référence |
| S13 | Lenis (dépôt GitHub) | https://github.com/darkroomengineering/lenis | darkroom.engineering | Dépôt / README | Fonctionnalités, accessibilité, limites, licence MIT | Officiel ; 1.3.27 via S7 |
| S14 | GSAP : ScrollTrigger | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ | GSAP | Documentation | pin, scrub, snap, matchMedia | Officiel ; pas de licence ni reduced-motion sur la page |
| S15 | GSAP : SplitText | https://gsap.com/docs/v3/Plugins/SplitText/ | GSAP | Documentation | Découpe de texte, aria, masques, autoSplit | Officiel |
| S16 | Animations guide | https://web.dev/articles/animations-guide | web.dev / Google | Article | transform/opacity, will-change, compositeur | Référence |
| S17 | Scroll-driven animations | https://developer.chrome.com/docs/css-ui/scroll-driven-animations | Chrome for Developers / Google | Article | Timelines scroll et view, performance, versions de navigateurs | Référence |
| S18 | CSS and JavaScript animation performance | https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance | MDN | Guide | Thread principal vs compositeur | Référence |
| S19 | Twelve basic principles of animation | https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation | Wikipédia | Encyclopédie | Les 12 principes de Disney (1981) | Secondaire ; source primaire (*The Illusion of Life*) non consultée |
| S20 | Animation Duration and Motion Characteristics | https://www.nngroup.com/articles/animation-duration/ | Nielsen Norman Group | Article de recherche UX | Durées 100-500 ms, easing, accessibilité | Fiable (organisme UX reconnu) ; date de l'article non relevée |
| S21 | Material Design 3 : Easing and duration | https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration | Google | Guide de design | Easing et durées | Page ouverte mais valeurs précises non obtenues : aucune valeur reprise |
| S22 | CSS animation-timeline | https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline | MDN | Documentation (lue jusqu'à 100 000 caractères) | scroll(), view(), Baseline 2026 | Référence ; tableau de compatibilité non lu |
| S23 | Understanding SC 2.3.3: Animation from Interactions | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html | W3C WAI | Norme (document explicatif) | AAA, prefers-reduced-motion | Officiel W3C ; WCAG 2.2 |
| S24 | Understanding SC 2.2.2: Pause, Stop, Hide | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | W3C WAI | Norme | Niveau A, 5 secondes | Officiel W3C |
| S25 | Understanding SC 2.3.1: Three Flashes or Below Threshold | https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html | W3C WAI | Norme | Niveau A, flashs | Officiel W3C |
| S26 | Rive : Web (JS) runtime | https://rive.app/docs/runtimes/web/web-js | Rive | Documentation | Paquets, machines d'état, installation | Officiel ; licence et accessibilité non précisées |
| S27 | Rive : Preloading WASM | https://rive.app/docs/runtimes/web/preloading-wasm | Rive | Documentation | Chargement par défaut via unpkg, `setWasmUrl`, auto-hébergement | Officiel |
| S28 | lottie-web (dépôt GitHub) | https://github.com/airbnb/lottie-web | Airbnb | Dépôt / README | Rendus, Bodymovin, limites, MIT | Officiel ; 791 tickets ouverts |
| S29 | lottie-web : Releases | https://github.com/airbnb/lottie-web/releases | Airbnb | Page GitHub | Page vide ("There aren't any releases here") | Officiel |
| S30 | LottieFiles License | https://lottiefiles.com/page/license | LottieFiles (Design Barn, Inc.) | Licence | Fichiers publics : usage commercial et conditions | Officiel |
| S31 | three.js (dépôt GitHub) | https://github.com/mrdoob/three.js | mrdoob / contributeurs | Dépôt / README | Fonctionnalités, MIT | Officiel |
| S32 | dotlottie-web (dépôt GitHub) | https://github.com/LottieFiles/dotlottie-web | LottieFiles | Dépôt / README | Rendu, worker, machines d'état, thèmes, MIT | Officiel ; version 0.82.1 via S7 |
| S33 | Motion (dépôt GitHub) | https://github.com/motiondivision/motion | Motion (Matt Perry) | Dépôt / README | MIT, Motion+, renommage de Framer Motion | Officiel |
| S34 | React Three Fiber : Introduction | https://r3f.docs.pmnd.rs/getting-started/introduction | Poimandres | Documentation | Renderer React, compatibilité versions | Officiel ; licence non indiquée sur la page |
| S35 | react-spring : Getting started | https://www.react-spring.dev/docs/getting-started | react-spring | Documentation | Paquet web, React 19 | Officiel |
| S36 | Anime.js v4 : Getting started | https://animejs.com/documentation/getting-started | Julian Garnier | Documentation | Modules, fonctionnalités | Officiel ; licence et poids absents de la page |
| S37 | anime (dépôt GitHub) | https://github.com/juliangarnier/anime | Julian Garnier | Dépôt / README | MIT, sponsors | Officiel |
| S38 | OGL (dépôt GitHub) | https://github.com/oframe/ogl | oframe | Dépôt / README | WebGL minimal, poids annoncé, Unlicense | Officiel ; chiffres de taille du README non vérifiés par mesure |
| S39 | rive-wasm (dépôt GitHub) | https://github.com/rive-app/rive-wasm | Rive | Dépôt | Licence MIT, activité | Officiel |
| S40 | Smart animate layers between frames | https://help.figma.com/hc/en-us/articles/360039818874-Smart-animate-layers-between-frames | Figma | Aide produit | Smart Animate, limites | Officiel |
| S41 | Mesures de poids (fichiers dist via jsDelivr et `gzip -9` en local) | https://cdn.jsdelivr.net/npm/<paquet>@<version>/<fichier> (ex. https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js) | jsDelivr (hébergement) ; mesures de l'agent de recherche | Mesure primaire | Tailles brutes et gzip des bibliothèques | Reproductible ; peut différer de Bundlephobia (niveau de compression) ; fichiers de la version indiquée dans le document |
| S42 | LottieFiles Developer Docs (accueil) | https://docs.lottiefiles.com/ | LottieFiles | Documentation | Format .lottie, SDK sous licence MIT | Officiel ; page d'accueil seulement |
| S43 | API de listing jsDelivr (structure des paquets) | https://data.jsdelivr.com/v1/packages/npm/<paquet>@<version>?structure=flat | jsDelivr | API | Liste et tailles des fichiers dist (Motion mini, dotLottie, OGL, tsParticles) | Source primaire pour les tailles brutes |

## Pages tentées mais non exploitables (donc non citées comme faits)
- Bundlephobia pour lottie-web, three, lenis, animejs, dotlottie-web : HTTP 429 (trop de requêtes). Aucun chiffre Bundlephobia pour ces paquets.
- `https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/` : redirection 301 vers docs.lottiefiles.com (pas de contenu).
- `https://web.dev/articles/scroll-driven-animations` : HTTP 404.
- Material Design 3 (S21) : ouverte, valeurs de durée et de courbes non retournées.

## Sujets sans source ouverte (donc "non vérifié" dans les documents)
- Pratiques d'un échantillon de sites primés (Awwwards, Codrops, etc.).
- Documentation détaillée de GSAP Flip, MorphSVG, DrawSVG.
- Tableaux de compatibilité navigateurs de WAAPI et View Transitions.
- Outils de prototypes autres que Figma (Principle, ProtoPie, Jitter).
- WCAG 2.3.2 (niveau AAA, Three Flashes) et texte intégral des critères WCAG (seules les pages "Understanding" de 2.2.2, 2.3.1, 2.3.3 ont été lues).
- Reduced-motion natif de Motion vanilla et de dotLottie.
- Licences complètes (fichiers LICENSE) autres que celle de GSAP.
