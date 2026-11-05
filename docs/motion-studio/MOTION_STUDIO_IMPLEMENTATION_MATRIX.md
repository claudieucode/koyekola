# Motion Studio : matrice d'implémentation et plan technique

Sources : `KOLAKISA_MOTION_STUDIO_AUDIT.md` (code lu), `WEB_MOTION_TECHNOLOGIES.md` (licences), catalogues composants/effets/patterns. Statuts = lecture du code, pas encore de tests d'exécution. Rien n'est implémenté à ce stade.

## 1. Principe : étendre, ne pas dupliquer
Un moteur existe déjà (`docs/MOTION-ENGINE.md`, `src/marketing/pages/motion.js` : 63 animations, `public/js/kw-effects.js`, widget Lottie). Le Motion Studio s'y greffe : mêmes données `node.motion`, même validation `normalizeMotion`, même historique `change()`.

## 2. Stack retenue (v1)
| Rôle | Choix | Licence | Poids gzip |
|---|---|---|---|
| Base | CSS animations/transitions, scroll-driven CSS (`@supports` + repli), WAAPI, View Transitions (amélioration progressive) | standard | 0 |
| Moteur JS unique | Motion (version mini/hybride) auto-hébergée | MIT | 3 à 22 ko |
| Animations After Effects | dotLottie, chargé à la demande | MIT | 31 ko + WASM 491 ko |
| Défilement fluide | Lenis, option désactivée par défaut | MIT | 5 ko |
| Phase 2 | Rive, OGL (shaders), Three.js, en blocs à la demande | MIT / Unlicense | 150 à 195 ko |
| Exclus | GSAP (risque de licence concurrente de Webflow : avis juridique d'abord), lottie-web (doublon), Anime.js, React Spring, R3F/Drei (React), tsParticles, SMIL |

Tout est servi depuis l'origine du site (`public/js/vendor/`), jamais depuis un CDN.

## 3. Blocages à lever d'abord (issus de l'audit)
| # | Blocage | Plan |
|---|---|---|
| 1 | Le canevas n'exécute aucun mouvement | Lot 1 : runtime `kw-motion-studio.js` initialisé dans `setupCanvas`, lecture/pause contrôlées |
| 2 | `normalizeNode` supprime les clés inconnues, pas de version de schéma | Lot 1 : `motion.studio = {v:1,…}` validé et migrable dans `normalizeMotion` |
| 3 | Médiathèque refuse .json/.lottie/.riv/.glb | Lot 2 : autoriser .lottie/.json (Lottie) avec contrôle de contenu, plus tard .riv/.glb |
| 4 | Pas de type de champ JSON dans les widgets | Lot 1 : champs « liste d'éléments » et « timeline » dédiés au panneau |
| 5 | Pas de séquence multi-éléments | Lot 3 : `motionScenes {v:1}` au niveau de la page (stockage à trancher : colonne JSON existante) |
| 6 | Plafonds 400 nœuds / 1 Mo | Respectés ; les presets sont compacts |
| 7 | Playwright absent | Tests navigateur à ajouter hors dépôt (installation locale), tests unitaires `node --test` pour modèle et rendu |
| 8 | Chemins média non liés au site | Correctif de sécurité en lot 2 |
| 9 | Pas de `script-src` | Les libs restent same-origin ; `'wasm-unsafe-eval'` à prévoir si la CSP est resserrée |

## 4. Lots
| Lot | Contenu | Livré quand |
|---|---|---|
| 0 | Panneau Motion Studio (sections Contenu/Style/Animation/Interactions/Responsive/Avancé), contrôles réutilisables, runtime partagé dans le canevas, schéma versionné `motion.studio` | tests modèle + canevas |
| 1 (P0 texte et révélations) | Split Text (lettre/mot/ligne), Text Reveal, Word/Char/Line Reveal, Animated Heading, Typewriter, Gradient Text, Text Scramble, Marquee amélioré, Number Ticker, stagger des enfants, conteneur/grille/liste animés | insérable, éditable, sauvegardé, public |
| 2 (visuels) | Image Reveal/Mask/Parallax, comparaison, SVG Draw, dotLottie Player, fonds dégradés/mesh/grain, curseur personnalisé, bouton magnétique/animé, tilt 3D avec reflet | idem |
| 3 (storytelling) | Hero orchestré, cartes empilées, histoire collante (sticky), scène épinglée, scroll horizontal, séquence d'images au scroll, timeline animée, menu plein écran, transitions de sections/pages, timeline visuelle du panneau | idem |
| 4 (données et UI) | Cercles de progression, jauges, graphiques animés, cartes de métriques, loaders/skeleton, feedback de formulaire, toggle/checkbox animés | idem |
| 5 (phase 2, à la demande) | Rive, fonds shader, 3D (viewer de modèle, scène), avec alternative légère | seulement si lots 0 à 4 validés |

Composants/effets déjà présents (39 composants, ~40 effets) restent intacts et sont repris dans le panneau (statut « existant »).

## 5. Matrice (extrait par priorité ; liste complète des 165 composants et 150 effets dans les catalogues)
| Composant/effet | Techno | Existant Kolakisa | Écart | Lot | Priorité | Tests requis |
|---|---|---|---|---|---|---|
| Split Text + révélations | JS maison léger + CSS | titre animé partiel | découpage lettre/mot/ligne, a11y (aria-label) | 1 | P0 | modèle, rendu, reduced-motion, éditeur |
| Stagger / cascade | WAAPI/Motion | absent | délais par enfant | 1 | P0 | rendu, ordre, responsive |
| Conteneur/grille/liste animés | CSS + Motion | entrée par élément | animation du groupe | 1 | P0 | idem |
| Typewriter, Scramble, Ticker | JS léger | compteur existant | effets texte | 1 | P1 | contenu conservé sans JS |
| Image Reveal/Mask/Parallax | CSS clip-path/mask, scroll-driven | masque + scroll de/à | presets et déclencheurs | 2 | P0 | repli sans JS |
| SVG Draw | CSS/WAAPI | texte sur tracé | tracé qui se dessine | 2 | P0 | SVG sanitisé |
| dotLottie Player | dotlottie-web, à la demande | Lottie URL https | upload, segments, interactivité | 2 | P1 | upload sécurisé, erreur d'asset |
| Curseur personnalisé, bouton magnétique | JS léger | souris suivre/incliner | curseur, aimant | 2 | P1 | tactile désactivé |
| Hero orchestré, histoire collante, cartes empilées | CSS sticky + scroll-driven + Motion | épinglage | scènes à durée | 3 | P0 | responsive, performance |
| Séquence d'images, scroll horizontal | canvas / sticky | absent | à créer | 3 | P1 | chargement différé |
| Timeline visuelle | panneau + `motionScenes` | absent | lecture/pause, ordre, easing | 3 | P0 | sauvegarde, undo/redo |
| Transitions de pages/sections | View Transitions | absent | à créer | 3 | P2 | repli navigateurs |
| Smooth scroll | Lenis (option) | absent | option par page | 3 | P2 | désactivé par défaut |
| Jauges, graphiques, métriques | SVG + CSS | compteur, barres | animation lisible | 4 | P1 | données éditables |
| Rive, shaders, 3D | Rive/OGL/Three | absent | blocs lourds | 5 | P3 | repli appareils faibles |

## 6. Règles transverses (testées à chaque lot)
`prefers-reduced-motion` respecté (variante réduite pour chaque effet) · contenu visible si le JS échoue · boucles > 5 s avec pause · pas plus de 3 flashs/s · `transform`/`opacity` en priorité · libs chargées uniquement si la page les utilise · isolation par site · pages existantes inchangées (schéma additif).

## 7. Tests (par composant)
Insertion, sélection, chaque réglage, sous-éléments (ajout/suppression/ordre/duplication), annuler/rétablir, sauvegarde/rechargement, aperçu canevas, publication, rendu public, responsive, accessibilité, erreur d'asset, non-régression (widgets, header/footer, historique, multi-sites, permissions). Suite complète `npm test` avant chaque push.

## 8. Décisions qui vous reviennent
1. GSAP : exclu en attendant un avis juridique écrit (licence anti-concurrence Webflow).
2. Lot 5 (Rive, shaders, 3D) : à lancer seulement après validation des lots 0 à 4.
