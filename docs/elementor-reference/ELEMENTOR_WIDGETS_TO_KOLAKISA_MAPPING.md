# Correspondance Elementor → Kolakisa (widgets et effets animables)

Établie à partir de `KOLAKISA_EDITOR_ANIMATION_AUDIT.md` (état du code, vérifié dans le registre réel) et de `ELEMENTOR_WIDGETS_CATALOG.md` / `ELEMENTOR_ANIMATIONS_REFERENCE.md`.
Légende de la colonne « Après ce lot » : **Fait** = ajouté et testé dans ce lot ; **Déjà complet** = rien à faire ; **Reste** = non intégré (voir le rapport final).

| Widget ou fonction Elementor | Équivalent Kolakisa | Écart constaté | Travail nécessaire | Priorité | Tests | Après ce lot |
|---|---|---|---|---|---|---|
| Counter | `counter` | Pas de délai, de courbe ni de valeur de départ | Réglages `delay`, `easing`, `start` | Haute | `widgets-animes-reglages` | **Fait** |
| Progress Bar | `progress` | Durée et courbe du remplissage fixes | Réglages `duration`, `easing` | Haute | idem | **Fait** |
| Animated Headline | `animatedheading` | Seulement fondu / machine à écrire | Effets glissement, flou, zoom ; curseur masquable | Haute | idem | **Fait** (partiel : pas de surlignage animé ni d'animation par lettre) |
| Flip Box | `flipbox` | Sens et vitesse fixes | Sens vertical, durée réglable | Moyenne | idem | **Fait** |
| Hotspot | `hotspot` | Pas de pulsation | Option `pulse` (coupée en « mouvement réduit ») | Moyenne | idem | **Fait** |
| Lottie | `lottie` | Canevas = encadré ; JSON par lien ; pas de lecture liée au défilement | Aperçu de première image, `.lottie`, scrub | Moyenne | — | Reste |
| Image / Testimonial / Media Carousel, Slides | `carousel`, `testimonialcarousel`, `mediacarousel`, `slides` | Pas d'effet de transition (fondu, cube…), un seul élément visible | Moteur de carrousel à étendre | Moyenne | — | Reste |
| Reviews | `testimonial`, `rating`, `courserating` | Pas de widget d'avis multiples | Nouveau widget `reviews` | Moyenne | — | Reste |
| Marquee (extensions tierces) | `marquee` | Texte seulement | Logos/images | Basse | — | Reste |
| Progress Tracker | `readingprogress` | Page entière uniquement | Suivre un conteneur / des étapes | Basse | — | Reste |
| Text Path | `textpath` | Pas d'animation le long du tracé | — | Basse | — | Reste |
| Countdown | `countdown` | — | — | — | existants | Déjà complet |
| Tabs / Accordion / Toggle (+ imbriqués) | `tabs`, `accordion`, `toggle`, conteneur | Pas de réglage de durée d'ouverture | — | Basse | existants | Déjà complet |
| Before / After, Price List, CTA | `beforeafter`, `pricelist`, `cta` | — | — | — | existants | Déjà complet |
| Entrance Animation | `node.motion.entrance` (63) | Équivalent ou supérieur (sorties et « attention » en plus) | — | — | `moteur-mouvement`, Chrome | Déjà complet |
| Hover Animation | `node.motion.hover` (16) | Pas de durée/courbe réglable | — | Basse | existants | Déjà complet (limite notée) |
| Motion Effects : scroll (vertical, horizontal, opacité, flou, rotation, échelle) | `motion.scroll`, `scrollFx` | — | — | — | existants | Déjà complet |
| Mouse Track / 3D Tilt | `motion.mouse`, `mouseFx` | — | — | — | existants | Déjà complet |
| Sticky | `position: sticky` par écran, `headerFx` | Pas de « rester dans la colonne » | — | Basse | existants | Reste |
| Parallaxe d'arrière-plan | `background-attachment: fixed` | Pas de décalage de fond indépendant | — | Basse | — | Reste |
| Interactions V4 (déclencheur → action) | `interactions` (action « Rejouer ») | Moins d'actions | — | Basse | existants | Reste |
| `prefers-reduced-motion` | Respecté partout, par défaut | — | — | — | existants + ce lot | Déjà complet |
