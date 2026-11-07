# Bibliothèque d'en-têtes « Atelier » : rapport des 100 modèles

## 0. Résultat final de la reconception (état réel)

**100 modèles créés, intégrés et validés** : 10 secteurs × 10 (luxe, sport, ecom, tech, agence, corpo, sante, archi, resto, media). Chaque modèle est écrit sur mesure dans `src/themeBuilder/catalog/header/sectors/<secteur>.js` (contrat `header/contract.js`, briques `blocks.js` / `blocks2.js`). La matrice de conception de chaque secteur (nom, direction artistique, composition, palette, polices, navigation, composants, animations, réglages, responsive) est dans `docs/theme-builder/headers-secteurs/<secteur>.md`. Les sections 1 et 2 ci-dessous décrivent l'ANCIENNE bibliothèque (36 architectures) et la méthode ; les tableaux d'architectures générés sont ceux du catalogue actuel (une composition par modèle).

**Preuves** (tests exécutés sur la branche `headers-100`, Chrome réel) :
- `theme-builder-entetes-atelier-navigateur` : 6/6. Les 100 modèles sont rendus à 1280, 820 et 390 px : aucun défaut visible (débordement, chevauchement, texte coupé, en-tête trop haut) ; distance visuelle (niveaux de gris, sans texte, 96×24) : aucune paire sous le seuil 0,05, plus proche voisin 0,047 en moyenne ; **aucune paire tolérée** (liste héritée vidée).
- Tests propres à chaque secteur (unitaires + Chrome : 3 largeurs, menus desktop et mobile, défilement, mouvement réduit, clavier, modification puis sauvegarde puis relecture, installation dans un site, rendu public sans double en-tête), contrat de secteur, atelier : passés par les agents de chaque secteur avant fusion ; relancés après fusion : atelier, atelier-navigateur, tech, corpo.
- Interface (aperçu en contexte, installation, personnalisation, retour au modèle, identité protégée) : `HEADER_UI_RUNTIME_V3.md`, test `theme-builder-entetes-ui-execution`.

**Corrections faites à la fusion** : nom en double « Cimaise » (archi-10 / media-07 renommé « Vernissage ») ; paires trop proches corpo-06/resto-02 et luxe-03/sante-02 (fonds changés) ; tech-01 trop haut sur tablette ; la mesure de défauts ne comptait plus à tort les bandes défilantes, rubans rognés, formes décoratives et le bouton de fermeture.

**Limites connues (à ne pas masquer)**
- Pas de vrais méga-menus (panneaux) ; pas de texte découpé ni de bouton magnétique ; menu plein écran limité au premier niveau ; l'aperçu de bibliothèque montre le menu plein écran fermé/à plat selon le cas.
- Pas de sélecteur de langue ni de favoris (le CMS n'en a pas) ; pas de second logo ni de logo clair/sombre.
- Défaut moteur ancien : l'iconlist en ligne n'est pas masquée sur mobile.
- Les en-têtes déjà installés avant cette refonte n'ont pas de clé « revenir au modèle ».
- Les tests de réglages passent par l'enregistrement du brouillon du composant, pas par une saisie dans l'éditeur visuel ; luxe-09, resto-09 (superposés) ne sont vérifiés transparents sur un vrai visuel d'ouverture que sur site publié.
- Suite complète `npm test` non relancée (machine lente) : seuls les fichiers d'en-têtes, contrat, atelier et interface ont été exécutés.

Généré par `node scripts/audit-entetes-atelier.js --rapport` à partir du catalogue réel (100 modèles, 100 compositions distinctes, 100 architectures).

## 1. Audit de l'ancienne bibliothèque (avant refonte)

* **Un seul moule.** Les 100 modèles précédents étaient construits par le même moteur de « rangées » (trois zones : gauche, centre, droite). Seuls changeaient le nombre de rangées, quelques filets et les couleurs : à l'œil, presque tous lisaient « logo + menu + bouton ».
* **Identités partagées.** 34 identités seulement pour 100 modèles (22 palettes + 12 sectorielles) : chaque palette servait à 3 modèles environ.
* **Défauts visibles.** Le bouton de recherche passait sous le champ dans plusieurs modèles (largeur trop étroite) ; barre promotionnelle à texte gris sur fond d'accent (contraste insuffisant).
* **Mouvement.** Seuls « se réduit » et « devient plein » existaient ; aucun mouvement d'entrée, aucun survol, aucun « se cache en descendant » ; aucun réglage dans l'éditeur pour l'effet d'en-tête.
* **Polices.** Les polices propres d'un modèle n'étaient chargées dans l'aperçu que si le site les utilisait déjà (correction dans `themeRender.wrapHtml`).

## 2. Méthode : matrice de conception et règle anti-répétition

1. **Secteurs** : 10 secteurs × 10 directions artistiques (`src/themeBuilder/catalog/header/models.js`).
2. **Architectures** : 36 compositions (`header/arch.js`) — grille, nombre de rangées, place de la marque, forme (pilule, cadre, cellules, médaillon, dock), filets, navigation (soulignée, pilule, case, onglet, bloc, mono, fine, verticale).
3. **Identité propre** : 4 couleurs fixes + 2 polices de la bibliothèque locale par modèle ; contraste ≥ 4,5 vérifié (texte, texte secondaire, bouton).
4. **Règle anti-répétition** : la *signature de composition* (types d'éléments, grille, position, filets, formes, style de navigation, éléments masqués ; sans couleur ni police ni texte) doit être unique pour les 100 modèles (test bloquant). Un contrôle visuel mesure en plus la distance entre rendus réels dans Chrome (`rapport-visuel-entetes-atelier.json`).

### Architectures et modèles qui les utilisent

| Architecture | Description | Modèles |
|---|---|---|
| `luxe-01` |  | luxe-01 |
| `luxe-02` |  | luxe-02 |
| `luxe-03` |  | luxe-03 |
| `luxe-04` |  | luxe-04 |
| `luxe-05` |  | luxe-05 |
| `luxe-06` |  | luxe-06 |
| `luxe-07` |  | luxe-07 |
| `luxe-08` |  | luxe-08 |
| `luxe-09` |  | luxe-09 |
| `luxe-10` |  | luxe-10 |
| `sport-01` |  | sport-01 |
| `sport-02` |  | sport-02 |
| `sport-03` |  | sport-03 |
| `sport-04` |  | sport-04 |
| `sport-05` |  | sport-05 |
| `sport-06` |  | sport-06 |
| `sport-07` |  | sport-07 |
| `sport-08` |  | sport-08 |
| `sport-09` |  | sport-09 |
| `sport-10` |  | sport-10 |
| `ecom-01` |  | ecom-01 |
| `ecom-02` |  | ecom-02 |
| `ecom-03` |  | ecom-03 |
| `ecom-04` |  | ecom-04 |
| `ecom-05` |  | ecom-05 |
| `ecom-06` |  | ecom-06 |
| `ecom-07` |  | ecom-07 |
| `ecom-08` |  | ecom-08 |
| `ecom-09` |  | ecom-09 |
| `ecom-10` |  | ecom-10 |
| `tech-01` |  | tech-01 |
| `tech-02` |  | tech-02 |
| `tech-03` |  | tech-03 |
| `tech-04` |  | tech-04 |
| `tech-05` |  | tech-05 |
| `tech-06` |  | tech-06 |
| `tech-07` |  | tech-07 |
| `tech-08` |  | tech-08 |
| `tech-09` |  | tech-09 |
| `tech-10` |  | tech-10 |
| `agence-01` |  | agence-01 |
| `agence-02` |  | agence-02 |
| `agence-03` |  | agence-03 |
| `agence-04` |  | agence-04 |
| `agence-05` |  | agence-05 |
| `agence-06` |  | agence-06 |
| `agence-07` |  | agence-07 |
| `agence-08` |  | agence-08 |
| `agence-09` |  | agence-09 |
| `agence-10` |  | agence-10 |
| `corpo-01` |  | corpo-01 |
| `corpo-02` |  | corpo-02 |
| `corpo-03` |  | corpo-03 |
| `corpo-04` |  | corpo-04 |
| `corpo-05` |  | corpo-05 |
| `corpo-06` |  | corpo-06 |
| `corpo-07` |  | corpo-07 |
| `corpo-08` |  | corpo-08 |
| `corpo-09` |  | corpo-09 |
| `corpo-10` |  | corpo-10 |
| `sante-01` |  | sante-01 |
| `sante-02` |  | sante-02 |
| `sante-03` |  | sante-03 |
| `sante-04` |  | sante-04 |
| `sante-05` |  | sante-05 |
| `sante-06` |  | sante-06 |
| `sante-07` |  | sante-07 |
| `sante-08` |  | sante-08 |
| `sante-09` |  | sante-09 |
| `sante-10` |  | sante-10 |
| `archi-01` |  | archi-01 |
| `archi-02` |  | archi-02 |
| `archi-03` |  | archi-03 |
| `archi-04` |  | archi-04 |
| `archi-05` |  | archi-05 |
| `archi-06` |  | archi-06 |
| `archi-07` |  | archi-07 |
| `archi-08` |  | archi-08 |
| `archi-09` |  | archi-09 |
| `archi-10` |  | archi-10 |
| `resto-01` |  | resto-01 |
| `resto-02` |  | resto-02 |
| `resto-03` |  | resto-03 |
| `resto-04` |  | resto-04 |
| `resto-05` |  | resto-05 |
| `resto-06` |  | resto-06 |
| `resto-07` |  | resto-07 |
| `resto-08` |  | resto-08 |
| `resto-09` |  | resto-09 |
| `resto-10` |  | resto-10 |
| `media-01` |  | media-01 |
| `media-02` |  | media-02 |
| `media-03` |  | media-03 |
| `media-04` |  | media-04 |
| `media-05` |  | media-05 |
| `media-06` |  | media-06 |
| `media-07` |  | media-07 |
| `media-08` |  | media-08 |
| `media-09` |  | media-09 |
| `media-10` |  | media-10 |

## 3. Composants, fonctionnalités et réglages (communs à tous les modèles)

* **Composants natifs** : conteneurs flex/grille, logo ou titre du site, menu AFFECTÉ à l'emplacement « En-tête » (aucun lien inventé), recherche, compte, mini-panier, boutons, réseaux, date, textes, séparateurs, liste d'icônes (coordonnées à remplacer).
* **Réglages** (tous modifiables dans l'éditeur du Page Builder, élément par élément) : largeur, hauteur, largeur max., alignement, espacements, arrière-plan et transparence, bordures, ombres, rayons, position collante/superposée, z-index ; logo (image, taille, lien) ; navigation (typographie, couleur, espacement, survol, focus, états actifs, sous-menus) ; boutons (texte, lien, couleurs, bordure, rayon, taille, icône) ; barre supérieure ; menu mobile ; mouvement.
* **Mouvement** : entrée du logo, de la navigation et des actions (natif : fondu, glissement, zoom, révélation) avec durée, délai, courbe, déclencheur, répétition et coupure par écran ; survol des boutons (16 effets natifs) ; effets d'en-tête au défilement : *se réduit*, *devient plein*, *se cache en descendant et revient en remontant* (réglage ajouté dans l'éditeur : conteneur pleine largeur → « Effet de l'en-tête au défilement »). Toutes les animations respectent « réduire les animations ».
* **Identité et autonomie** : les couleurs et polices sont posées sur les éléments (pas de jeton du site) ; changer la charte du site ne change pas l'en-tête installé. Modifier une couleur ou une police dans l'éditeur ne perd pas le reste de l'identité. Le catalogue n'est jamais modifié par une copie.

## 4. Les 100 modèles

| N° | Identifiant | Nom | Secteur | Direction artistique | Architecture | Comportement | Navigation | Actions | Palette (fond / texte / accent) | Polices (titres / texte) | Entrée | Survol |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `luxe-01.luxe-01` | Maison Aurore | Luxe, mode et haute couture | Luxe éditorial | `luxe-01` | statique | plain | — | #faf6f0 / #1b1411 / #7a5c1f | cormorant-garamond / jost | fade-in | — |
| 2 | `luxe-02.luxe-02` | Gazette Mode | Luxe, mode et haute couture | Fashion magazine | `luxe-02` | collant · hide | plain | — | #ffffff / #0d0d0d / #b3121f | playfair-display / libre-franklin | fade-in-up | — |
| 3 | `luxe-03.luxe-03` | Rive Gauche | Luxe, mode et haute couture | Haute couture parisienne | `luxe-03` | collant | plain | — | #fffdf9 / #1d1b19 / #8c6a28 | gfs-didot / tenor-sans | fade-in | — |
| 4 | `luxe-04.luxe-04` | Atelier Washi | Luxe, mode et haute couture | Minimalisme japonais | `luxe-04` | statique | plain | — | #f3efe6 / #1f1d1a / #a8322a | shippori-mincho / zen-kaku-gothic-new | fade-in | — |
| 5 | `luxe-05.luxe-05` | Grand Format | Luxe, mode et haute couture | Typographie monumentale | `luxe-05` | statique | plain | — | #ece5da / #14110f / #14110f | bodoni-moda / inter-tight | fade-in-up | — |
| 6 | `luxe-06.luxe-06` | Maison Pérenne | Luxe, mode et haute couture | Haut de gamme intemporel | `luxe-06` | collant | plain | — | #101a2c / #f3eee3 / #c9a86a | libre-caslon-display / raleway | zoom-in | lift |
| 7 | `luxe-07.luxe-07` | Maison Dissymétrie | Luxe, mode et haute couture | Composition asymétrique de maison | `luxe-07` | statique | plain | — | #f6ece4 / #2a1418 / #5b1a28 | dm-serif-display / work-sans | reveal | — |
| 8 | `luxe-08.luxe-08` | Velours Noir | Luxe, mode et haute couture | Vitrine nocturne | `luxe-08` | collant · shrink | plain | — | #0d0b0a / #f1ebe0 / #c8a45c | bodoni-moda / tenor-sans | fade-in | — |
| 9 | `luxe-09.luxe-09` | Écrin | Luxe, mode et haute couture | Joaillerie | `luxe-09` | superposé · solid | plain | — | #0b2623 / #f4efe3 / #d9c08a | cinzel / jost | fade-in-up | — |
| 10 | `luxe-10.luxe-10` | Flacon | Luxe, mode et haute couture | Parfumerie | `luxe-10` | collant · shrink | plain | — | #f7e9e6 / #3a1f2b / #8e3b5a | instrument-serif / raleway | fade-in-up | lift |
| 11 | `sport-01.sport-01` | Brut Béton | Sport, fitness et performance | Brutalisme moderne | `sport-01` | collant | plain | — | #e9e6dc / #0a0a0a / #ff4a1c | archivo-black / space-mono | slide-in-left | push |
| 12 | `sport-02.sport-02` | Volt Rush | Sport, fitness et performance | Sportif dynamique | `sport-02` | collant · shrink | plain | — | #0b0b10 / #ffffff / #d4ff00 | big-shoulders / barlow-condensed | slide-in-left | grow |
| 13 | `sport-03.sport-03` | Ligue Un | Sport, fitness et performance | Compétition et ligue | `sport-03` | collant | plain | — | #0c1b3a / #ffffff / #ffc20e | oswald / titillium-web | fade-in-up | pop |
| 14 | `sport-04.sport-04` | Foulée | Sport, fitness et performance | Marque de running | `sport-04` | collant | plain | — | #f3efe7 / #101828 / #ff5a3c | league-spartan / manrope | fade-in | lift |
| 15 | `sport-05.sport-05` | Box 24 | Sport, fitness et performance | CrossFit et box | `sport-05` | collant · hide | plain | — | #111111 / #f5f5f5 / #ffb800 | anton / roboto-condensed | reveal | push |
| 16 | `sport-06.sport-06` | Dojo Kata | Sport, fitness et performance | Arts martiaux | `sport-06` | collant | plain | — | #14100e / #f2ece2 / #d4202a | sofia-sans-extra-condensed / work-sans | zoom-in | pulse |
| 17 | `sport-07.sport-07` | Peloton | Sport, fitness et performance | Cyclisme | `sport-07` | collant · shrink | plain | — | #ffffff / #0a2540 / #0a2540 | kanit / dm-sans | fade-in-up | lift |
| 18 | `sport-08.sport-08` | Coach Pilote | Sport, fitness et performance | Coach en ligne | `sport-08` | collant | plain | — | #120a2a / #ffffff / #2ee6a6 | sora / dm-sans | slide-in-left | grow |
| 19 | `sport-09.sport-09` | Sentier Nord | Sport, fitness et performance | Outdoor et trail | `sport-09` | collant | plain | — | #f2efe6 / #1d2b1f / #e07a1f | saira-condensed / work-sans | fade-in-up | lift |
| 20 | `sport-10.sport-10` | Club Néon | Sport, fitness et performance | Club et salle de sport | `sport-10` | statique | plain | — | #0a0a0a / #ffffff / #00e5ff | league-gothic / space-grotesk | fade-in | bounce |
| 21 | `ecom-01.ecom-01` | Grand Rayon | E-commerce et boutiques en ligne | Marketplace à 3 étages | `ecom-01` | collant · shrink | plain | — | #ffffff / #14213d / #ff6b00 | poppins / inter | fade-in | lift |
| 22 | `ecom-02.ecom-02` | Maison Lin | E-commerce et boutiques en ligne | Boutique mode épurée | `ecom-02` | collant | plain | — | #faf8f5 / #1c1b19 / #1c1b19 | bodoni-moda / jost | reveal | — |
| 23 | `ecom-03.ecom-03` | Atelier Intérieur | E-commerce et boutiques en ligne | Maison et décoration | `ecom-03` | collant · shrink | plain | — | #f5efe6 / #2f2a24 / #9a4f2d | fraunces / dm-sans | slide-in-left | — |
| 24 | `ecom-04.ecom-04` | Volt | E-commerce et boutiques en ligne | Boutique high-tech | `ecom-04` | collant | plain | — | #0b0f19 / #e8ecf4 / #3df5c5 | space-grotesk / ibm-plex-mono | zoom-in | — |
| 25 | `ecom-05.ecom-05` | Halle Gourmande | E-commerce et boutiques en ligne | Épicerie fine, titre de journal | `ecom-05` | collant | plain | — | #fbf6ea / #1f3a2b / #a4262c | libre-baskerville / work-sans | fade-in | — |
| 26 | `ecom-06.ecom-06` | Éclat Beauté | E-commerce et boutiques en ligne | Beauté et soins | `ecom-06` | collant · shrink | plain | — | #fbe9ee / #3a1f2b / #b0306a | cormorant-garamond / nunito-sans | fade-in-up | — |
| 27 | `ecom-07.ecom-07` | Cabinet Créateur | E-commerce et boutiques en ligne | Boutique de créateur, rail latéral | `ecom-07` | statique | plain | — | #efece6 / #161616 / #c2410c | syne / work-sans | slide-in-left | — |
| 28 | `ecom-08.ecom-08` | Solde Express | E-commerce et boutiques en ligne | Outlet et promotions | `ecom-08` | collant | plain | — | #111111 / #ffffff / #ffe600 | anton / barlow-condensed | slide-in-right | pop |
| 29 | `ecom-09.ecom-09` | Cherche & Trouve | E-commerce et boutiques en ligne | Recherche d'abord | `ecom-09` | statique | plain | — | #1d3fd6 / #ffffff / #ffd23f | manrope / manrope | zoom-in | — |
| 30 | `ecom-10.ecom-10` | Pavé Catalogue | E-commerce et boutiques en ligne | Mosaïque de catégories | `ecom-10` | statique | plain | — | #ffffff / #0e0e0e / #d92d20 | archivo-black / archivo | reveal | — |
| 31 | `tech-01.tech-01` | Helvète | Technologie, SaaS et startups | Minimalisme suisse | `tech-01` | statique | plain | — | #ffffff / #0a0a0a / #e30613 | inter-tight / inter | reveal | push |
| 32 | `tech-02.tech-02` | Néon Vide | Technologie, SaaS et startups | Futuriste sombre | `tech-02` | superposé | plain | — | #06070d / #e9edff / #7df9ff | unbounded / space-grotesk | fade-in-down | pulse |
| 33 | `tech-03.tech-03` | Invite | Technologie, SaaS et startups | Terminal développeur | `tech-03` | collant | plain | — | #070b07 / #c9f7d3 / #4dff88 | jetbrains-mono / jetbrains-mono | fade-in | push |
| 34 | `tech-04.tech-04` | Manuel | Technologie, SaaS et startups | Documentation à sommaire | `tech-04` | collant | plain | — | #ffffff / #1b2330 / #0b57d0 | ibm-plex-sans / ibm-plex-sans | slide-in-left | lift |
| 35 | `tech-05.tech-05` | Atlas | Technologie, SaaS et startups | SaaS à méga-barre | `tech-05` | collant · shrink | plain | — | #ffffff / #111827 / #4f46e5 | manrope / inter | fade-in | grow |
| 36 | `tech-06.tech-06` | Pulsar | Technologie, SaaS et startups | Startup IA à pastille | `tech-06` | collant | plain | — | #fbf8ff / #1a1033 / #6d3bff | sora / dm-sans | fade-in-up | float |
| 37 | `tech-07.tech-07` | Stratus | Technologie, SaaS et startups | Plateforme cloud à deux niveaux | `tech-07` | collant · hide | plain | — | #ffffff / #0b2239 / #0a6cff | red-hat-display / red-hat-text | fade-in-down | lift |
| 38 | `tech-08.tech-08` | Quadrant | Technologie, SaaS et startups | Fintech géométrique | `tech-08` | collant | plain | — | #f2fbf6 / #052a1f / #12c98c | familjen-grotesk / figtree | slide-in-left | pop |
| 39 | `tech-09.tech-09` | Endpoint | Technologie, SaaS et startups | API et outil développeur | `tech-09` | statique | plain | — | #f6f8fa / #0d1117 / #0969da | geist / geist-mono | fade-in-up | push |
| 40 | `tech-10.tech-10` | Rail | Technologie, SaaS et startups | Matériel et hardware | `tech-10` | collant · hide | plain | — | #121418 / #f1f3f5 / #ff7a1a | chakra-petch / barlow | reveal | grow |
| 41 | `agence-01.agence-01` | Hors Cadre | Agences créatives et studios digitaux | Design expérimental | `agence-01` | statique | plain | — | #efe9dd / #141414 / #ff4b1f | syne / space-mono | fade-in-up | pop |
| 42 | `agence-02.agence-02` | Colossal Type | Agences créatives et studios digitaux | Typographie monumentale | `agence-02` | collant · shrink | plain | — | #0c0c0c / #f2efe6 / #d4ff3a | archivo-black / inter-tight | reveal | lift |
| 43 | `agence-03.agence-03` | Dalle Rose | Agences créatives et studios digitaux | Brutalisme moderne | `agence-03` | collant | plain | — | #dcdad2 / #000000 / #ff2e93 | dela-gothic-one / space-mono | slide-in-left | push |
| 44 | `agence-04.agence-04` | Fil Oblique | Agences créatives et studios digitaux | Artistique asymétrique | `agence-04` | statique | plain | — | #f7efe4 / #1d1240 / #ff6a3d | instrument-serif / dm-sans | slide-in-left | float |
| 45 | `agence-05.agence-05` | Seuil Ouvert | Agences créatives et studios digitaux | Studio digital minimal, menu plein écran | `agence-05` | superposé · solid | plain | — | #0a0a0a / #ffffff / #7c6cff | inter-tight / dm-mono | reveal | — |
| 46 | `agence-06.agence-06` | Table des Projets | Agences créatives et studios digitaux | Portfolio à index numéroté | `agence-06` | collant | plain | — | #f4f4ef / #101010 / #1a1aff | familjen-grotesk / dm-mono | fade-in | — |
| 47 | `agence-07.agence-07` | Boucle Rose | Agences créatives et studios digitaux | Studio de motion design | `agence-07` | collant | plain | — | #120a24 / #f6f1ff / #ff4fa3 | unbounded / space-grotesk | zoom-in | pulse |
| 48 | `agence-08.agence-08` | Maison Rétro | Agences créatives et studios digitaux | Branding rétro contemporain | `agence-08` | statique | plain | — | #f2e3c6 / #3a1c10 / #b93c1e | caprasimo / dm-sans | fade-in-up | bob |
| 49 | `agence-09.agence-09` | Plan Masse | Agences créatives et studios digitaux | Studio d'architecture web | `agence-09` | collant | plain | — | #0f2a4a / #e8f1ff / #ffd23f | ibm-plex-sans-condensed / ibm-plex-mono | slide-in-left | — |
| 50 | `agence-10.agence-10` | Collectif Ruban | Agences créatives et studios digitaux | Collectif d'artistes | `agence-10` | statique | plain | — | #ffd93d / #111111 / #2d2bff | bagel-fat-one / space-grotesk | zoom-in | wobble |
| 51 | `corpo-01.corpo-01` | Meridian | Entreprises, corporate et finance | Corporate sophistiqué | `corpo-01` | collant | plain | — | #ffffff / #0c2340 / #0c2340 | source-serif-4 / public-sans | fade-in | lift |
| 52 | `corpo-02.corpo-02` | Helvet Institut | Entreprises, corporate et finance | Minimalisme suisse institutionnel | `corpo-02` | statique | plain | — | #ffffff / #111111 / #d50000 | inter-tight / ibm-plex-sans | reveal | push |
| 53 | `corpo-03.corpo-03` | Banque Privée Aubert | Entreprises, corporate et finance | Banque privée à serif | `corpo-03` | statique | plain | — | #10261d / #f3ead7 / #c7a45a | cormorant-garamond / jost | fade-in | — |
| 54 | `corpo-04.corpo-04` | Cabinet Schéma | Entreprises, corporate et finance | Cabinet de conseil à schéma | `corpo-04` | collant | plain | — | #f4f6f6 / #1d2b2f / #0f766e | dm-sans / ibm-plex-sans | slide-in-left | lift |
| 55 | `corpo-05.corpo-05` | Mutuelle Clair-Foyer | Entreprises, corporate et finance | Assurance rassurante | `corpo-05` | collant | plain | — | #fffaf3 / #1f3a5f / #c2410c | nunito / nunito-sans | fade-in-up | float |
| 56 | `corpo-06.corpo-06` | Parquet Marchés | Entreprises, corporate et finance | Finance de marché à ticker | `corpo-06` | collant | plain | — | #0a1410 / #e8f1ec / #3ddc97 | ibm-plex-sans / ibm-plex-mono | zoom-in | — |
| 57 | `corpo-07.corpo-07` | Étude Delacroix | Entreprises, corporate et finance | Audit et juridique à deux niveaux | `corpo-07` | collant | plain | — | #ffffff / #1b2a41 / #7a1f2b | libre-baskerville / source-sans-3 | fade-in-up | — |
| 58 | `corpo-08.corpo-08` | Groupe Forge | Entreprises, corporate et finance | Groupe industriel à méga-barre de métiers | `corpo-08` | collant | plain | — | #14181d / #f4f4f2 / #ffb703 | barlow-condensed / barlow | slide-in-left | push |
| 59 | `corpo-09.corpo-09` | Flux B2B | Entreprises, corporate et finance | Fintech B2B | `corpo-09` | collant | plain | — | #0d1030 / #f4f5ff / #5b4bf0 | plus-jakarta-sans / inter | zoom-in | lift |
| 60 | `corpo-10.corpo-10` | Holding Pierre | Entreprises, corporate et finance | Holding intemporelle à navigation latérale | `corpo-10` | statique | plain | — | #efece4 / #2a2a26 / #34452f | newsreader / work-sans | fade-in | — |
| 61 | `sante-01.sante-01` | Sève | Nutrition, santé et bien-être | Organique | `sante-01` | statique | plain | — | #f4f1e6 / #23382a / #3f7d4e | fraunces / nunito | zoom-in | grow |
| 62 | `sante-02.sante-02` | Silence de Kyoto | Nutrition, santé et bien-être | Minimalisme japonais | `sante-02` | collant | plain | — | #e9e6dc / #1c1c1a / #b5472f | zen-old-mincho / zen-kaku-gothic-new | fade-in | lift |
| 63 | `sante-03.sante-03` | Herbier | Nutrition, santé et bien-être | Naturopathie | `sante-03` | statique | plain | — | #fbf7ee / #2e2a1c / #4a5a23 | gelasio / mulish | slide-in-left | push |
| 64 | `sante-04.sante-04` | Cabinet Verger | Nutrition, santé et bien-être | Nutritionniste | `sante-04` | collant | plain | — | #ffffff / #1f3b2c / #b9532f | dm-serif-display / figtree | fade-in-up | pop |
| 65 | `sante-05.sante-05` | Horizon Santé | Nutrition, santé et bien-être | Clinique et cabinet médical | `sante-05` | collant · shrink | plain | — | #ffffff / #0c2d48 / #0b6fa4 | manrope / figtree | fade-in-up | lift |
| 66 | `sante-06.sante-06` | Cueillette | Nutrition, santé et bien-être | Compléments et boutique santé | `sante-06` | collant | plain | — | #f8f3e3 / #2d3317 / #5d6b1e | fraunces / karla | fade-in | grow |
| 67 | `sante-07.sante-07` | Souffle en Ligne | Nutrition, santé et bien-être | Yoga et méditation en ligne | `sante-07` | collant | plain | — | #eef4fb / #26354f / #5a5fb0 | quicksand / nunito-sans | zoom-in | float |
| 68 | `sante-08.sante-08` | Aurèle Spa | Nutrition, santé et bien-être | Spa haut de gamme | `sante-08` | collant · shrink | plain | — | #14302d / #f3ece0 / #d3b27a | cormorant-garamond / jost | fade-in | lift |
| 69 | `sante-09.sante-09` | Cap Nutrition | Nutrition, santé et bien-être | Programme de coaching nutrition | `sante-09` | collant · shrink | plain | — | #fdf3e6 / #2b2a1f / #2f6f4f | bricolage-grotesque / figtree | slide-in-left | bounce |
| 70 | `sante-10.sante-10` | Pharmacie du Parc | Nutrition, santé et bien-être | Pharmacie et parapharmacie | `sante-10` | collant | plain | — | #ffffff / #0f3326 / #0a7a4f | albert-sans / public-sans | fade-in-up | lift |
| 71 | `archi-01.archi-01` | Silence | Architecture, immobilier et décoration | Minimalisme architectural | `archi-01` | statique | plain | — | #f7f6f3 / #111111 / #111111 | jost / inter | fade-in | push |
| 72 | `archi-02.archi-02` | Trame | Architecture, immobilier et décoration | Géométrique | `archi-02` | collant | plain | — | #ffffff / #14213d / #fca311 | outfit / work-sans | fade-in-up | lift |
| 73 | `archi-03.archi-03` | Registre | Architecture, immobilier et décoration | Cabinet à index de projets | `archi-03` | statique | plain | — | #efede8 / #1a1a1a / #c2410c | hanken-grotesk / dm-mono | reveal | push |
| 74 | `archi-04.archi-04` | Cadastre | Architecture, immobilier et décoration | Agence immobilière avec recherche de biens | `archi-04` | collant · shrink | plain | — | #ffffff / #12263a / #0f766e | manrope / dm-sans | fade-in-up | lift |
| 75 | `archi-05.archi-05` | Trois Tiers | Architecture, immobilier et décoration | Promoteur à tiers de page | `archi-05` | statique | plain | — | #d9d6cf / #1c1c1c / #a63d2f | archivo-black / archivo | fade-in-right | pop |
| 76 | `archi-06.archi-06` | Terre Cuite | Architecture, immobilier et décoration | Décoration d'intérieur chaleureuse | `archi-06` | collant | plain | — | #f4ebe0 / #3b2a20 / #b5532a | dm-serif-display / nunito-sans | fade-in-up | grow |
| 77 | `archi-07.archi-07` | Cartouche | Architecture, immobilier et décoration | Bureau d'études technique | `archi-07` | collant · hide | plain | — | #0b2a4a / #e8f1fb / #ffd23f | ibm-plex-sans / ibm-plex-mono | fade-in | push |
| 78 | `archi-08.archi-08` | Gros Œuvre | Architecture, immobilier et décoration | Rénovation et artisans | `archi-08` | collant · shrink | plain | — | #1b1b1b / #f5f5f0 / #ffc400 | barlow-condensed / barlow | slide-in-left | bounce |
| 79 | `archi-09.archi-09` | Haie Vive | Architecture, immobilier et décoration | Paysagiste | `archi-09` | collant · hide | plain | — | #f1f5ee / #1f3326 / #3f7d4e | young-serif / figtree | zoom-in | float |
| 80 | `archi-10.archi-10` | Cimaise | Architecture, immobilier et décoration | Galerie de design | `archi-10` | collant | plain | — | #dcdad4 / #151515 / #ff4a2a | instrument-serif / space-grotesk | fade-in-up | tilt |
| 81 | `resto-01.resto-01` | Le Zinc | Restaurants, gastronomie et hôtellerie | Bistrot rétro | `resto-01` | collant | plain | — | #f6ead3 / #2b1a12 / #9c2f1d | yeseva-one / karla | zoom-in | lift |
| 82 | `resto-02.resto-02` | Table Étoilée | Restaurants, gastronomie et hôtellerie | Gastronomie sobre | `resto-02` | collant · shrink | plain | — | #5a1a28 / #f6ecdc / #c8a456 | cormorant-garamond / raleway | fade-in | float |
| 83 | `resto-03.resto-03` | Pizza Rosso | Restaurants, gastronomie et hôtellerie | Trattoria colorée | `resto-03` | collant | plain | — | #fff4dc / #2a1208 / #c62a1f | caprasimo / nunito | slide-in-left | pop |
| 84 | `resto-04.resto-04` | Maki Zen | Restaurants, gastronomie et hôtellerie | Japonais minimal | `resto-04` | collant · hide | plain | — | #f7f4ee / #1c1b1a / #b3261e | zen-old-mincho / zen-kaku-gothic-new | fade-in | — |
| 85 | `resto-05.resto-05` | Pain de Campagne | Restaurants, gastronomie et hôtellerie | Boulangerie artisanale | `resto-05` | collant | plain | — | #fdf1e3 / #4a2c17 / #e0953f | cherry-swash / nunito-sans | fade-in-up | bob |
| 86 | `resto-06.resto-06` | La Carte des Vins | Restaurants, gastronomie et hôtellerie | Cave et bar à vin | `resto-06` | statique | plain | — | #2a0f17 / #f3e6d8 / #d8b06a | playfair-display / lato | fade-in | lift |
| 87 | `resto-07.resto-07` | Brasserie Houblon | Restaurants, gastronomie et hôtellerie | Brasserie artisanale | `resto-07` | collant · shrink | plain | — | #1e1b18 / #f4ead8 / #e8a317 | alfa-slab-one / barlow | slide-in-left | push |
| 88 | `resto-08.resto-08` | Maison de Charme | Restaurants, gastronomie et hôtellerie | Hôtel de charme | `resto-08` | collant | plain | — | #f3efe6 / #2f3a30 / #5b6f4f | bellefair / mulish | reveal | grow |
| 89 | `resto-09.resto-09` | Grand Resort | Restaurants, gastronomie et hôtellerie | Resort superposé | `resto-09` | superposé · solid | plain | — | #0e2a2f / #ffffff / #e9d3a1 | bodoni-moda / jost | fade-in | lift |
| 90 | `resto-10.resto-10` | Camion Soleil | Restaurants, gastronomie et hôtellerie | Traiteur et food truck | `resto-10` | collant | plain | — | #ffd23f / #1a1410 / #d7261e | lilita-one / work-sans | zoom-in | bounce |
| 91 | `media-01.media-01` | Le Courrier | Médias, magazines, culture et portfolios | Mât de magazine classique | `media-01` | statique | plain | — | #fbf7ef / #17140f / #b3261e | playfair-display / lora | reveal | lift |
| 92 | `media-02.media-02` | Dépêche Direct | Médias, magazines, culture et portfolios | Journal en ligne à ticker | `media-02` | collant | plain | — | #ffffff / #101828 / #d92d20 | oswald / ibm-plex-sans-condensed | slide-in-left | push |
| 93 | `media-03.media-03` | Pivoine | Médias, magazines, culture et portfolios | Magazine mode et lifestyle | `media-03` | collant | plain | — | #fdf1ef / #2a1215 / #b4235a | bodoni-moda / dm-sans | zoom-in | grow |
| 94 | `media-04.media-04` | Fréquence Noire | Médias, magazines, culture et portfolios | Webzine culture et musique | `media-04` | collant · shrink | plain | — | #0c0c0f / #f5f5f0 / #d4ff3a | anton / space-mono | slide-in-left | push |
| 95 | `media-05.media-05` | Onde Courte | Médias, magazines, culture et portfolios | Radio et podcast | `media-05` | collant | plain | — | #12102b / #f2f0ff / #ff4d8d | righteous / dm-sans | zoom-in | pulse |
| 96 | `media-06.media-06` | Saison Pourpre | Médias, magazines, culture et portfolios | Théâtre et lieu à programmation | `media-06` | statique | plain | — | #2a0a14 / #f7ecd9 / #e0b24f | gloock / newsreader | fade-in-up | lift |
| 97 | `media-07.media-07` | Vernissage | Médias, magazines, culture et portfolios | Galerie d'art contemporain | `media-07` | collant | plain | — | #ffffff / #0a0a0a / #ff3b00 | syne / space-mono | fade-in | — |
| 98 | `media-08.media-08` | Chambre Claire | Médias, magazines, culture et portfolios | Portfolio photographe minimal | `media-08` | collant · hide | plain | — | #f5f3ee / #111111 / #111111 | instrument-serif / dm-mono | fade-in | — |
| 99 | `media-09.media-09` | Carnet Ocre | Médias, magazines, culture et portfolios | Blog personnel éditorial | `media-09` | statique | plain | — | #f8efe0 / #2b2118 / #a8431f | fraunces / newsreader | fade-in-up | float |
| 100 | `media-10.media-10` | Écran Rouge | Médias, magazines, culture et portfolios | Chaîne vidéo et créateur | `media-10` | collant | plain | — | #0f0f10 / #f4f4f5 / #e11d1d | archivo-black / inter | fade-in-up | pop |

### Descriptions

1. **Maison Aurore** (`luxe-01.luxe-01`) — La marque centrée très espacée entre la navigation et les actions, puis une bande d'accroche teintée, le tout entre doubles filets : une maison d'édition de mode.
2. **Gazette Mode** (`luxe-02.luxe-02`) — Ticker noir défilant, titre de magazine italique, onglets de rubriques entre filets épais : la une d'un mensuel de mode.
3. **Rive Gauche** (`luxe-03.luxe-03`) — Pile centrée : ornements dorés, marque au style Didot, navigation entre deux filets or : la vitrine d'une maison de couture.
4. **Atelier Washi** (`luxe-04.luxe-04`) — Une étroite colonne à gauche (marque et navigation verticale), un grand vide, les actions posées en pied : le calme du papier washi.
5. **Grand Format** (`luxe-05.luxe-05`) — Le nom de la maison pleine largeur en didone ultra-gras, un filet épais, une rangée fine : l'affiche avant le menu.
6. **Maison Pérenne** (`luxe-06.luxe-06`) — Trois cases pleine largeur dont un bloc de marque doré, liseré en dégradé au-dessus : la sobriété qui ne se démode pas.
7. **Maison Dissymétrie** (`luxe-07.luxe-07`) — Un bloc bordeaux de 36 % porte la marque ; à droite, la navigation, un filet, puis le message et les actions : l'équilibre décalé.
8. **Velours Noir** (`luxe-08.luxe-08`) — Fine barre de compte, navigation à gauche et marque à droite, liseré or qui s'allume : une vitrine éclairée la nuit.
9. **Écrin** (`luxe-09.luxe-09`) — Superposé et transparent sur le visuel d'ouverture : message orné, marque en capitales romaines et navigation sertie d'un filet dégradé.
10. **Flacon** (`luxe-10.luxe-10`) — Liseré dégradé, grand nom italique avec sa navigation soulignée à gauche, colonne d'actions à droite : un flacon posé sur une page poudrée.
11. **Brut Béton** (`sport-01.sport-01`) — Trois grandes cases séparées par des filets de 4 px : marque, navigation en cases, bloc d'action orange.
12. **Volt Rush** (`sport-02.sport-02`) — Bloc de marque lime prolongé de bandeaux diagonaux, navigation condensée à droite, bouton incliné.
13. **Ligue Un** (`sport-03.sport-03`) — Ticker de résultats en tête, marque centrée entre deux barres inclinées, onglets pleine largeur.
14. **Foulée** (`sport-04.sport-04`) — Capsule sombre flottante sur fond clair : marque, liens fins et pilule corail.
15. **Box 24** (`sport-05.sport-05`) — Marque monumentale à gauche, informations pratiques et navigation en blocs à droite, ruban de sécurité en bas.
16. **Dojo Kata** (`sport-06.sport-06`) — Filet rouge vertical et disque, marque et accroche, deux boutons empilés, bande de navigation centrée dessous.
17. **Peloton** (`sport-07.sport-07`) — Liseré dégradé, marque entre deux roues, bande jaune pleine largeur à liens répartis.
18. **Coach Pilote** (`sport-08.sport-08`) — Annonce fine, pastille dégradée et navigation en pilules à gauche, compte et bouton menthe à droite.
19. **Sentier Nord** (`sport-09.sport-09`) — Pic stylisé, marque et accroche, informations pratiques ; bande forêt de navigation avec réseaux.
20. **Club Néon** (`sport-10.sport-10`) — Barre fine de navigation mono, marque géante, compteur d'inscriptions à renseigner et bouton néon.
21. **Grand Rayon** (`ecom-01.ecom-01`) — Bandeau promo fermable, rangée de marque avec recherche géante, compte et panier, puis catégories en onglets sur fond gris.
22. **Maison Lin** (`ecom-02.ecom-02`) — Une seule rangée aérée : bouton « Catégories » en menu plein écran, marque Bodoni centrée, compte et panier ; recherche fine dessous.
23. **Atelier Intérieur** (`ecom-03.ecom-03`) — Colonne de marque en terre cuite à l'angle arrondi portant le compte ; à droite, recherche et panier puis catégories soulignées.
24. **Volt** (`ecom-04.ecom-04`) — Ticker d'annonces, une seule rangée dense (marque à bandeau diagonal, catégories mono, barre de recherche de type commande, panier) et liseré dégradé.
25. **Halle Gourmande** (`ecom-05.ecom-05`) — Petite rangée utilitaire, marque italique centrée entre deux filets, catégories centrées entre un filet épais et un filet fin.
26. **Éclat Beauté** (`ecom-06.ecom-06`) — Barre promo fermable en dégradé, puis carte arrondie à marges et ombre : médaillon dégradé, recherche arrondie, actions ; catégories en pilules.
27. **Cabinet Créateur** (`ecom-07.ecom-07`) — Rail vertical à gauche (marque, catégories empilées en grand) ; à droite recherche, compte, panier et un ticker géant.
28. **Solde Express** (`ecom-08.ecom-08`) — Barre promo rouge fermable, puis rangée noire : bloc jaune de marque à biais, catégories en blocs, recherche et panier.
29. **Cherche & Trouve** (`ecom-09.ecom-09`) — Grand bandeau bleu : mini-rangée (marque, compte, panier), champ de recherche géant au centre, catégories en pastilles centrées.
30. **Pavé Catalogue** (`ecom-10.ecom-10`) — Cadre épais : nom du site monumental et recherche à gauche ; catégories en cases bordées à droite, compte et panier en blocs.
31. **Helvète** (`tech-01.tech-01`) — Filet noir épais, grille de quatre colonnes et menu empilé : la rigueur typographique d'un produit sans fioriture.
32. **Néon Vide** (`tech-02.tech-02`) — Trois îlots en capsule qui flottent sous un liseré lumineux : marque, menu en pilule, actions. L'en-tête se superpose au visuel d'ouverture.
33. **Invite** (`tech-03.tech-03`) — Une seule bande fine façon fenêtre de terminal : pastilles, invite « $ », menu monospace et barre de commande pour chercher.
34. **Manuel** (`tech-04.tech-04`) — Deux colonnes asymétriques : un sommaire à gauche (marque, version) et, à droite, la recherche puis des onglets de navigation.
35. **Atlas** (`tech-05.tech-05`) — Une rangée d'outils (marque, recherche, démonstration, essai) et une méga-barre de blocs : chaque lien du menu devient une grande case.
36. **Pulsar** (`tech-06.tech-06`) — Un orbe dégradé et la marque à gauche ; à droite, une pastille d'annonce posée au-dessus du menu et des actions.
37. **Stratus** (`tech-07.tech-07`) — Une barre d'état sombre avec pastille verte, puis une rangée de produit : bloc de marque plein, onglets pleine hauteur, boutons.
38. **Quadrant** (`tech-08.tech-08`) — Un en-tête découpé en quatre cellules : formes géométriques de marque, menu, connexion et cellule d'appel sombre, sous un liseré dégradé.
39. **Endpoint** (`tech-09.tech-09`) — Un ticker monospace en tête, puis deux colonnes : badge « API », marque et menu à gauche ; lien documentation et bouton démonstration à droite.
40. **Rail** (`tech-10.tech-10`) — Barre robuste : une case orange ouvre le menu en panneau coulissant, marque condensée, bande oblique, contact et bouton de démonstration.
41. **Hors Cadre** (`agence-01.agence-01`) — Bandeau défilant noir, marque et anneau en haut à gauche, navigation en cases décalées vers le bas et bouton remonté : une composition qui déborde de la grille.
42. **Colossal Type** (`agence-02.agence-02`) — Le nom du site occupe toute la largeur en lettres géantes ; une ligne de navigation répartie sur la page s'appuie sur un filet citron épais.
43. **Dalle Rose** (`agence-03.agence-03`) — Quatre cases aux filets épais — bloc rose, accroche, date, bouton — puis une barre de navigation noire pleine largeur : franc, lourd, lisible.
44. **Fil Oblique** (`agence-04.agence-04`) — Un gros bloc de marque orange collé au bord, un bandeau incliné et un disque dégradé qui le chevauchent, la navigation soulignée en bas à droite : une affiche.
45. **Seuil Ouvert** (`agence-05.agence-05`) — Une seule ligne très aérée : un point, le nom en mono, une mention de disponibilité et un bouton « Menu » qui ouvre un panneau plein écran numéroté.
46. **Table des Projets** (`agence-06.agence-06`) — Un petit nom à gauche, un mot « Index » géant à droite qui ouvre un index plein écran numéroté, et une ligne basse en trois cellules à filets fins.
47. **Boucle Rose** (`agence-07.agence-07`) — Un liseré dégradé, une marque précédée d'une tête de lecture, des pilules de navigation et un ruban défilant sombre : l'énergie d'une timeline.
48. **Maison Rétro** (`agence-08.agence-08`) — Un médaillon rond central, la date et une accroche à gauche, un bouton à droite, puis une navigation en cases à contour sous un double filet : un air d'étiquette.
49. **Plan Masse** (`agence-09.agence-09`) — Une colonne jaune pour la marque, puis deux niveaux techniques : informations pratiques et bouton, navigation en onglets mono — l'esprit d'un plan de masse.
50. **Collectif Ruban** (`agence-10.agence-10`) — Deux rubans adhésifs inclinés à gauche d'un nom centré légèrement penché ; un bouton rond à droite, des cases de navigation sous le nom : un tableau d'atelier.
51. **Meridian** (`corpo-01.corpo-01`) — Barre d'information fermable, rangée claire à trois zones et liseré dégradé : la confiance par la clarté.
52. **Helvet Institut** (`corpo-02.corpo-02`) — Filet noir épais et quatre cellules séparées par des filets verticaux : la rigueur d'une institution.
53. **Banque Privée Aubert** (`corpo-03.corpo-03`) — Tout sur un axe central : nom en italique entre deux filets or, navigation fine et espacée.
54. **Cabinet Schéma** (`corpo-04.corpo-04`) — Pictogramme anneau et disque, navigation en cases bordées comme un schéma : un cabinet qui structure.
55. **Mutuelle Clair-Foyer** (`corpo-05.corpo-05`) — Marque centrée entre navigation en pilules et capsule d'aide, coins bas arrondis : l'assurance proche de vous.
56. **Parquet Marchés** (`corpo-06.corpo-06`) — Ticker intégré à la rangée de marque, navigation monospace sur une barre en dessous : le pouls d'une salle de marché.
57. **Étude Delacroix** (`corpo-07.corpo-07`) — Marque et coordonnées en haut sous un double filet, grande barre bordeaux pour la navigation : l'autorité d'un cabinet.
58. **Groupe Forge** (`corpo-08.corpo-08`) — Bandeau jaune pour la marque, méga-barre sombre de cases de métiers en dessous : un groupe aux nombreuses activités.
59. **Flux B2B** (`corpo-09.corpo-09`) — Capsule flottante arrondie sur fond nuit, pastille dégradée et bouton lumineux : une fintech pour les entreprises.
60. **Holding Pierre** (`corpo-10.corpo-10`) — Navigation verticale à gauche, nom monumental au centre, contact à droite : la sobriété d'une holding familiale.
61. **Sève** (`sante-01.sante-01`) — Trois disques qui se chevauchent, marque en feuille, navigation en capsule douce et liseré dégradé : un cabinet de bien-être naturel.
62. **Silence de Kyoto** (`sante-02.sante-02`) — Une rangée très fine : sceau vermillon, marque minuscule, filet, menu plein écran numéroté. Beaucoup de vide, un seul accent.
63. **Herbier** (`sante-03.sante-03`) — Bloc de marque olive aux coins organiques à gauche ; à droite, horaires et contact puis navigation et rendez-vous.
64. **Cabinet Verger** (`sante-04.sante-04`) — Marque et navigation à gauche, grosse carte terracotta de prise de rendez-vous à droite, bandeau d'informations pratiques dessous.
65. **Horizon Santé** (`sante-05.sante-05`) — Rangée blanche (marque et informations séparées par des filets) puis bande bleu profond d'onglets de services avec rendez-vous.
66. **Cueillette** (`sante-06.sante-06`) — Bandeau défilant, médaillon de marque rond, recherche, compte et panier à pastille, catégories en pilules.
67. **Souffle en Ligne** (`sante-07.sante-07`) — Bande en dégradé bleu-lavande, anneaux concentriques autour de la marque, navigation fine, bouton rond : une plateforme de séances en ligne.
68. **Aurèle Spa** (`sante-08.sante-08`) — Bande vert profond, navigation en capitales espacées, marque italique entre deux filets or, horaires et bouton contour.
69. **Cap Nutrition** (`sante-09.sante-09`) — Bandes inclinées devant une marque appuyée, navigation en mosaïque de cases, bouton plein : un programme à étapes.
70. **Pharmacie du Parc** (`sante-10.sante-10`) — Bandeau vert d'informations, rangée marque + recherche large + compte + panier, bande verte pleine de rubriques.
71. **Silence** (`archi-01.archi-01`) — Une colonne centrée : un nom minuscule, un filet vertical qui se déroule, un menu fin et beaucoup de blanc. La sobriété d'un cabinet qui parle par ses plans.
72. **Trame** (`archi-02.archi-02`) — Une barre tricolore, une grappe de formes (carré, disque, anneau, bande oblique), la marque et un menu en cases contour : la grammaire d'un plan de masse.
73. **Registre** (`archi-03.archi-03`) — Un en-tête haut, partagé en trois colonnes par des filets : marque et index vertical à gauche, grande accroche au centre, coordonnées et devis à droite.
74. **Cadastre** (`archi-04.archi-04`) — Une rangée d'agence (marque, menu souligné, téléphone) puis une bande teintée dédiée à la recherche de biens, avec le bouton d'estimation.
75. **Trois Tiers** (`archi-05.archi-05`) — L'en-tête est coupé en trois tiers pleins : la marque sur anthracite, le menu sur béton, le devis sur brique. Massif, lisible, sans détour.
76. **Terre Cuite** (`archi-06.archi-06`) — Un bandeau défilant terre cuite, un nom en serif entre deux disques, la recherche et le devis, puis un menu dans une pilule arrondie.
77. **Cartouche** (`archi-07.archi-07`) — Le cartouche d'un plan : un tableau à quatre cellules étiquetées sur bleu de calque, tout en monospace. L'en-tête d'un bureau d'études qui dessine ses pièces.
78. **Gros Œuvre** (`archi-08.archi-08`) — Un ruban de chantier jaune à bandes obliques portant les infos pratiques, un bloc de marque jaune, un menu en blocs et un gros bouton de devis.
79. **Haie Vive** (`archi-09.archi-09`) — Une grappe de disques verts, la marque, une accroche, et un bouton « Parcourir » qui ouvre un menu plein écran numéroté. Un liseré dégradé comme une haie.
80. **Cimaise** (`archi-10.archi-10`) — Un ticker noir d'exposition puis un mur gris : un cartel blanc porte la marque, le menu se range en cases, et le bouton vermillon invite à écrire.
81. **Le Zinc** (`resto-01.resto-01`) — Un médaillon rond à gauche, un bandeau d'horaires brique au-dessus, puis deux niveaux : accroche et réservation, navigation en majuscules.
82. **Table Étoilée** (`resto-02.resto-02`) — Une seule rangée très aérée : réservation à gauche, marque espacée entre deux filets, menu plein écran numéroté à droite.
83. **Pizza Rosso** (`resto-03.resto-03`) — Un liseré tricolore, une dalle rouge inclinée qui porte la marque, des pastilles de navigation et un gros bouton vert.
84. **Maki Zen** (`resto-04.resto-04`) — Presque rien : une pastille rouge, la marque, un long filet fin qui relie la navigation, un bouton carré. Se cache au défilement.
85. **Pain de Campagne** (`resto-05.resto-05`) — Un bandeau défilant d'annonces, puis une étiquette en tirets pour la marque et une navigation en cases arrondies façon vitrine.
86. **La Carte des Vins** (`resto-06.resto-06`) — Une carte verticale : navigation en liste à filets pointillés dans un cartouche, marque italique à gauche, horaires et réservation à droite.
87. **Brasserie Houblon** (`resto-07.resto-07`) — Un bandeau ambre d'horaires, d'adresse et de téléphone au-dessus d'une barre charbon à onglets pleine hauteur et bouton carré.
88. **Maison de Charme** (`resto-08.resto-08`) — Marque centrée entre deux filets, puis une longue capsule qui contient la navigation fine et le bouton de réservation.
89. **Grand Resort** (`resto-09.resto-09`) — Superposé au visuel d'ouverture : barre d'informations, titre monumental centré, filet, navigation fine centrée et bouton Réserver en verre.
90. **Camion Soleil** (`resto-10.resto-10`) — Un ticker rapide noir, une dalle inclinée à cadre épais pour la marque, des cases à contour noir et un gros bouton noir.
91. **Le Courrier** (`media-01.media-01`) — Date et accroche en bandeau, titre monumental centré entre filets épais, rubriques centrées : un grand quotidien.
92. **Dépêche Direct** (`media-02.media-02`) — Bandeau « en direct » avec ticker défilant, marque et recherche, rubriques en onglets : un site d'actualité.
93. **Pivoine** (`media-03.media-03`) — Capsule flottante arrondie sous un liseré dégradé : médaillon, marque italique, rubriques en pilules.
94. **Fréquence Noire** (`media-04.media-04`) — Bloc de marque plein collé au bord, bandeau incliné, rubriques en mono : un webzine de scène et de disques.
95. **Onde Courte** (`media-05.media-05`) — Disque en dégradé et barres d'égaliseur, pastille « en direct », rubriques en pilules sur bande : une radio indépendante.
96. **Saison Pourpre** (`media-06.media-06`) — Infos pratiques en haut, grand nom à gauche, rubriques en mosaïque de cases dorées, bouton de réservation.
97. **Vernissage** (`media-07.media-07`) — Trois colonnes hautes séparées par des filets verticaux, rubriques empilées : l'en-tête d'un accrochage.
98. **Chambre Claire** (`media-08.media-08`) — Une ligne fine : marque minuscule, date, bouton « Index » qui ouvre un menu plein écran numéroté.
99. **Carnet Ocre** (`media-09.media-09`) — Grande marque italique et accroche à gauche, rubriques fines et actions à droite, double filet : le carnet d'un auteur.
100. **Écran Rouge** (`media-10.media-10`) — Marque en pavé, recherche large centrale, compte et abonnement, rangée de puces de rubriques : une chaîne de contenus.

