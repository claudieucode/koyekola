# Bibliothèque d'en-têtes « Atelier » : rapport des 100 modèles

Généré par `node scripts/audit-entetes-atelier.js --rapport` à partir du catalogue réel (100 modèles, 100 compositions distinctes, 36 architectures).

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
| `cells` | Cellules à filets épais (grille de 4 cases) | sport-03, sport-04, agence-04, archi-03, media-10 |
| `twolevel` | Deux niveaux : barre d'information + rangée principale | tech-05, corpo-01, corpo-02, corpo-03, sante-03 |
| `centre` | Marque centrée, navigation à gauche, actions à droite (grille 1fr/auto/1fr) | luxe-03, luxe-04, sante-04, resto-07 |
| `masthead` | Mât de magazine : date, accroche, titre, filets épais | luxe-06, media-01, media-02, media-03 |
| `frame` | Cadre épais autour de l'en-tête | sport-10, agence-07, archi-08, resto-09 |
| `classic` | Classique : marque, navigation, actions | tech-04, corpo-09, sante-05, resto-08 |
| `monument` | Nom du site monumental + navigation dessous | agence-01, agence-02, agence-03, media-04 |
| `booking` | Réservation : message, ornements autour de la marque, bouton | sante-10, resto-01, resto-02, resto-03 |
| `luxe` | Luxe : marque espacée centrée, navigation fine, filets | luxe-01, luxe-02, resto-06 |
| `glass` | Superposé en verre dépoli sur le visuel d'ouverture | luxe-10, tech-10, resto-10 |
| `sidebrand` | Bloc de marque coloré à gauche (grille asymétrique) | sport-07, corpo-08, archi-09 |
| `dual` | Double action : navigation centrée, contour + plein + pastille | sport-08, tech-09, sante-09 |
| `shop3` | Boutique à 3 étages : bandeau, recherche/compte/panier, catégories | ecom-01, ecom-02, ecom-03 |
| `pill` | Pilule flottante détachée du bord | ecom-10, tech-06, sante-06 |
| `saas` | SaaS : pastille d'annonce + rangée principale | tech-01, tech-02, tech-03 |
| `index` | Index : marque minuscule + libellé + navigation fine | agence-05, agence-06, media-05 |
| `twotone` | Deux tons : demi-fond coloré pour la marque | agence-09, sante-08, archi-06 |
| `coords` | Colonnes à filets fins + cellule de coordonnées | agence-10, archi-01, archi-02 |
| `tagline` | Marque + filet + accroche + navigation + actions | corpo-05, corpo-06, media-08 |
| `navgrid` | Grille de navigation : marque + liens utiles + onglets | archi-04, archi-05, media-06 |
| `ticker` | Trois messages en haut + marque centrée entre deux navigations | resto-04, resto-05, media-07 |
| `stackc` | Pile centrée : marque, navigation ornée de filets | luxe-05, sante-07 |
| `mono` | Ligne unique en monospace, filet noir | luxe-07, tech-08 |
| `badge` | Médaillon : marque dans un disque coloré | luxe-08, sante-02 |
| `vertical` | Navigation verticale : grande marque + liens empilés | luxe-09, agence-08 |
| `sport` | Sport : majuscules lourdes, liseré d'accent épais | sport-01, sport-02 |
| `slab` | Dalle : navigation étirée en onglets, liseré épais | sport-06, corpo-07 |
| `shopc` | Boutique centrée : recherche | marque | compte-panier + catégories | ecom-04, ecom-05 |
| `shopm` | Boutique compacte + ruban promo | ecom-06, ecom-07 |
| `mega` | Méga-barre : barre sombre + rangée + navigation en blocs pleine largeur | ecom-08, corpo-10 |
| `dock` | Dock étroit centré en pilule | tech-07, archi-07 |
| `contactfirst` | Coordonnées et rendez-vous en haut + marque/navigation | corpo-04, sante-01 |
| `boxnav` | Navigation en cases contour | archi-10, media-09 |
| `bigcta` | Gros bouton d'action arrondi | sport-05 |
| `slim` | Barre ultra fine | sport-09 |
| `searchfirst` | Recherche d'abord : recherche centrale + puces | ecom-09 |

## 3. Composants, fonctionnalités et réglages (communs à tous les modèles)

* **Composants natifs** : conteneurs flex/grille, logo ou titre du site, menu AFFECTÉ à l'emplacement « En-tête » (aucun lien inventé), recherche, compte, mini-panier, boutons, réseaux, date, textes, séparateurs, liste d'icônes (coordonnées à remplacer).
* **Réglages** (tous modifiables dans l'éditeur du Page Builder, élément par élément) : largeur, hauteur, largeur max., alignement, espacements, arrière-plan et transparence, bordures, ombres, rayons, position collante/superposée, z-index ; logo (image, taille, lien) ; navigation (typographie, couleur, espacement, survol, focus, états actifs, sous-menus) ; boutons (texte, lien, couleurs, bordure, rayon, taille, icône) ; barre supérieure ; menu mobile ; mouvement.
* **Mouvement** : entrée du logo, de la navigation et des actions (natif : fondu, glissement, zoom, révélation) avec durée, délai, courbe, déclencheur, répétition et coupure par écran ; survol des boutons (16 effets natifs) ; effets d'en-tête au défilement : *se réduit*, *devient plein*, *se cache en descendant et revient en remontant* (réglage ajouté dans l'éditeur : conteneur pleine largeur → « Effet de l'en-tête au défilement »). Toutes les animations respectent « réduire les animations ».
* **Identité et autonomie** : les couleurs et polices sont posées sur les éléments (pas de jeton du site) ; changer la charte du site ne change pas l'en-tête installé. Modifier une couleur ou une police dans l'éditeur ne perd pas le reste de l'identité. Le catalogue n'est jamais modifié par une copie.

## 4. Les 100 modèles

| N° | Identifiant | Nom | Secteur | Direction artistique | Architecture | Comportement | Navigation | Actions | Palette (fond / texte / accent) | Polices (titres / texte) | Entrée | Survol |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `luxe-01.luxe-01` | Maison Aurore | Luxe, mode et haute couture | Luxe éditorial | `luxe` | statique | thin | c | #faf6f0 / #1b1411 / #9b7b3c | cormorant-garamond / jost | fade-in | — |
| 2 | `luxe-02.luxe-02` | Velours Noir | Luxe, mode et haute couture | Luxe nocturne | `luxe` | collant | thin | a | #0e0c0b / #f2ece2 / #c8a45c | bodoni-moda / tenor-sans | fade-in | — |
| 3 | `luxe-03.luxe-03` | Atelier Perle | Luxe, mode et haute couture | Luxe minimal | `centre` | statique | thin | — | #2a2223 / #f6f1ef / #e8c7cf | italiana / raleway | fade-in-up | — |
| 4 | `luxe-04.luxe-04` | Rive Gauche | Luxe, mode et haute couture | Couture parisienne | `centre` | collant · shrink | thin | ac | #fffdf9 / #1d1b19 / #b0894a | playfair-display / tenor-sans | fade-in | — |
| 5 | `luxe-05.luxe-05` | Plume & Soie | Luxe, mode et haute couture | Luxe doux | `stackc` | statique | thin | — | #2b1f2b / #f6ecf1 / #e8b4c4 | cormorant-garamond / josefin-sans | fade-in-up | — |
| 6 | `luxe-06.luxe-06` | Vogue Atelier | Luxe, mode et haute couture | Mode magazine | `masthead` | collant · hide | plain | — | #ffffff / #101010 / #d41f3a | abril-fatface / inter | reveal | — |
| 7 | `luxe-07.luxe-07` | Studio Satin | Luxe, mode et haute couture | Luxe typographique | `mono` | statique | plain | — | #ece8e1 / #161616 / #161616 | syne / dm-mono | fade-in | — |
| 8 | `luxe-08.luxe-08` | Monogramme | Luxe, mode et haute couture | Luxe héraldique | `badge` | statique | underline | c | #fbf8f1 / #26201a / #8c6d2f | cinzel / lato | zoom-in | — |
| 9 | `luxe-09.luxe-09` | Cour d'Honneur | Luxe, mode et haute couture | Luxe asymétrique | `vertical` | statique | thin | b | #f3efe8 / #1c1814 / #1c1814 | gloock / jost | slide-in-left | — |
| 10 | `luxe-10.luxe-10` | Film de Soie | Luxe, mode et haute couture | Luxe cinématographique | `glass` | superposé · solid | plain | b | #ffffff / #141414 / #e9d9b8 | bodoni-moda / raleway | reveal | — |
| 11 | `sport-01.sport-01` | Voltage | Sport, fitness et performance | Sport dynamique | `sport` | collant | plain | ab | #0d0f12 / #ffffff / #ff4d1a | bebas-neue / barlow | fade-in-up | push |
| 12 | `sport-02.sport-02` | Apex Club | Sport, fitness et performance | Performance noire | `sport` | collant · shrink | underline | bt | #0a0a0a / #f4f4f2 / #c6ff1a | anton / archivo | fade-in-up | pop |
| 13 | `sport-03.sport-03` | Cardio Rouge | Sport, fitness et performance | Énergie rouge | `cells` | statique | plain | b | #ffffff / #111111 / #e11d2e | oswald / barlow-condensed | fade-in-up | grow |
| 14 | `sport-04.sport-04` | Iron Yard | Sport, fitness et performance | Brutalisme salle | `cells` | collant | plain | b | #e9e7df / #111111 / #ffcf1f | archivo-black / space-mono | fade-in-up | buzz |
| 15 | `sport-05.sport-05` | Sprint | Sport, fitness et performance | Gros bouton | `bigcta` | statique | pill | — | #f3f7ff / #0b1b3a / #1456ff | league-spartan / figtree | fade-in-up | bob |
| 16 | `sport-06.sport-06` | Marathon | Sport, fitness et performance | Dalle de navigation | `slab` | statique | tab | b | #ffffff / #10261c / #0aa35a | kanit / rubik | fade-in-up | lift |
| 17 | `sport-07.sport-07` | Trail Nord | Sport, fitness et performance | Bloc de marque | `sidebrand` | statique | underline | b | #f5f6f2 / #18261f / #1f6f4a | saira-condensed / work-sans | fade-in-up | float |
| 18 | `sport-08.sport-08` | Dojo | Sport, fitness et performance | Double action | `dual` | statique | plain | tob | #16110d / #f4eee6 / #d9262c | teko / barlow-semi-condensed | fade-in-up | pulse |
| 19 | `sport-09.sport-09` | Pulse 24 | Sport, fitness et performance | Barre ultra fine | `slim` | collant · hide | mono | b | #101418 / #e9f0f5 / #38e0a1 | russo-one / ibm-plex-mono | fade-in-up | grow |
| 20 | `sport-10.sport-10` | Podium | Sport, fitness et performance | Cadre épais | `frame` | statique | plain | b | #fff7e0 / #111111 / #ff3d00 | passion-one / lato | fade-in-up | pop |
| 21 | `ecom-01.ecom-01` | Étal Vif | E-commerce et boutiques en ligne | Commerce premium | `shop3` | collant · shrink | tab | ac | #ffffff / #14213d / #e63946 | outfit / inter | fade-in | — |
| 22 | `ecom-02.ecom-02` | Panier Doré | E-commerce et boutiques en ligne | Boutique chic | `shop3` | statique | underline | ac | #fbf7ef / #2b2118 / #b7791f | dm-serif-display / dm-sans | fade-in-up | — |
| 23 | `ecom-03.ecom-03` | Marché Pop | E-commerce et boutiques en ligne | Boutique colorée | `shop3` | statique | pill | ac | #fff8e1 / #1a1a1a / #7c3aed | lilita-one / nunito | fade-in-up | — |
| 24 | `ecom-04.ecom-04` | Vitrine Claire | E-commerce et boutiques en ligne | Boutique centrée | `shopc` | statique | underline | ac | #ffffff / #1d1d1f / #0071e3 | plus-jakarta-sans / inter | fade-in-up | — |
| 25 | `ecom-05.ecom-05` | Atelier Terre | E-commerce et boutiques en ligne | Boutique artisanale | `shopc` | collant | thin | ac | #fbf1e6 / #3b2417 / #b4531e | fraunces / karla | fade-in-up | — |
| 26 | `ecom-06.ecom-06` | Dense Market | E-commerce et boutiques en ligne | Boutique compacte | `shopm` | statique | plain | sac | #ffffff / #0f172a / #16a34a | inter-tight / inter | fade-in-up | — |
| 27 | `ecom-07.ecom-07` | Kiosque | E-commerce et boutiques en ligne | Commerce éditorial | `shopm` | collant · shrink | underline | sac | #fffdf6 / #161513 / #c1121f | old-standard-tt / public-sans | fade-in-up | — |
| 28 | `ecom-08.ecom-08` | Rayon Géant | E-commerce et boutiques en ligne | Méga-barre | `mega` | statique | plain | sac | #ffffff / #111827 / #f97316 | poppins / poppins | fade-in | — |
| 29 | `ecom-09.ecom-09` | Trouvaille | E-commerce et boutiques en ligne | Recherche d'abord | `searchfirst` | statique | pill | ac | #ffffff / #1c1c28 / #2563eb | manrope / manrope | fade-in-up | — |
| 30 | `ecom-10.ecom-10` | Flottant | E-commerce et boutiques en ligne | Pilule flottante | `pill` | collant | plain | sac | #f6f0ff / #241b3a / #7c3aed | sora / inter | fade-in-up | — |
| 31 | `tech-01.tech-01` | Prisme | Technologie, SaaS et startups | SaaS lumineux | `saas` | collant · shrink | plain | ab | #ffffff / #0f172a / #6d28d9 | plus-jakarta-sans / inter | fade-in-up | float |
| 32 | `tech-02.tech-02` | Noctilucent | Technologie, SaaS et startups | SaaS sombre | `saas` | collant | plain | ab | #0b0b14 / #ecebff / #8b7bff | space-grotesk / inter | fade-in-up | pop |
| 33 | `tech-03.tech-03` | Cloud9 | Technologie, SaaS et startups | SaaS bleu | `saas` | statique | underline | aob | #f7faff / #0b2447 / #0b6cff | red-hat-display / inter | fade-in-up | grow |
| 34 | `tech-04.tech-04` | Ligne de Code | Technologie, SaaS et startups | Technique | `classic` | statique | mono | ab | #ffffff / #0d1117 / #238636 | jetbrains-mono / inter | fade-in-up | push |
| 35 | `tech-05.tech-05` | Graphe | Technologie, SaaS et startups | Produit analytique | `twolevel` | collant · shrink | underline | ab | #f8fafc / #1e293b / #0891b2 | lexend / inter | fade-in | lift |
| 36 | `tech-06.tech-06` | Orbite | Technologie, SaaS et startups | Pilule technologique | `pill` | collant | plain | ab | #eef2ff / #111133 / #4f46e5 | sora / dm-sans | fade-in-up | grow |
| 37 | `tech-07.tech-07` | Dock Neutre | Technologie, SaaS et startups | Dock minimal | `dock` | collant | plain | b | #fafafa / #18181b / #18181b | geist / inter | fade-in-up | pop |
| 38 | `tech-08.tech-08` | Terminal | Technologie, SaaS et startups | Ultra fin | `mono` | statique | plain | b | #0a0f0a / #d7ffd7 / #39ff7a | ibm-plex-mono / ibm-plex-mono | fade-in-up | buzz |
| 39 | `tech-09.tech-09` | Duo | Technologie, SaaS et startups | Double action | `dual` | statique | plain | tob | #ffffff / #101828 / #0e9f6e | urbanist / inter | fade-in-up | float |
| 40 | `tech-10.tech-10` | Aurore Boréale | Technologie, SaaS et startups | Superposé futuriste | `glass` | superposé | plain | b | #ffffff / #0b1020 / #7dd3fc | unbounded / inter | fade-in-up | pulse |
| 41 | `agence-01.agence-01` | NOM EN GRAND | Agences créatives et studios digitaux | Typographie monumentale | `monument` | statique | plain | b | #f1efe8 / #0d0d0d / #0d0d0d | archivo-black / inter-tight | reveal | — |
| 42 | `agence-02.agence-02` | Studio Mutant | Agences créatives et studios digitaux | Monument décalé | `monument` | collant | mono | b | #0e0e10 / #f2f2f2 / #ff5e3a | syne / space-mono | slide-in-left | — |
| 43 | `agence-03.agence-03` | Maquette | Agences créatives et studios digitaux | Monument éditorial | `monument` | statique | plain | b | #fffdf8 / #1b1b1b / #1b1b1b | instrument-serif / dm-sans | reveal | — |
| 44 | `agence-04.agence-04` | Grille Vivante | Agences créatives et studios digitaux | Cellules brutalistes | `cells` | statique | plain | b | #ffffff / #111111 / #ffe600 | space-grotesk / space-grotesk | fade-in-up | pop |
| 45 | `agence-05.agence-05` | Index Studio | Agences créatives et studios digitaux | Portfolio index | `index` | statique | plain | b | #f5f5f2 / #101010 / #101010 | dm-sans / dm-mono | fade-in | — |
| 46 | `agence-06.agence-06` | Carnet de Notes | Agences créatives et studios digitaux | Index manuscrit | `index` | collant · hide | underline | b | #fbf6ea / #2a241c / #c2410c | fraunces / inter | fade-in-up | float |
| 47 | `agence-07.agence-07` | Cadre Net | Agences créatives et studios digitaux | Cadre expérimental | `frame` | statique | plain | b | #e8f0ff / #0a0a0a / #2a5bff | unbounded / space-grotesk | fade-in-up | buzz |
| 48 | `agence-08.agence-08` | Colonne Haute | Agences créatives et studios digitaux | Asymétrie verticale | `vertical` | statique | plain | b | #fff4e6 / #1a1209 / #ff6b00 | bricolage-grotesque / dm-sans | slide-in-left | — |
| 49 | `agence-09.agence-09` | Deux Temps | Agences créatives et studios digitaux | Deux tons | `twotone` | statique | underline | b | #f7f4ff / #1c1033 / #7c3aed | syne / inter | slide-in-left | — |
| 50 | `agence-10.agence-10` | Coordonnées | Agences créatives et studios digitaux | Grille technique | `coords` | statique | mono | b | #101010 / #f1f1ec / #c6ff3d | jetbrains-mono / jetbrains-mono | fade-in | — |
| 51 | `corpo-01.corpo-01` | Banque Lumière | Entreprises, corporate et finance | Corporate sophistiqué | `twolevel` | statique | underline | ab | #ffffff / #0b2545 / #13315c | source-serif-4 / public-sans | fade-in | — |
| 52 | `corpo-02.corpo-02` | Capital Sud | Entreprises, corporate et finance | Finance sobre | `twolevel` | collant | plain | b | #fbfbf8 / #17231a / #1f5f3f | libre-caslon-text / work-sans | fade-in-up | — |
| 53 | `corpo-03.corpo-03` | Groupe Atlas | Entreprises, corporate et finance | Corporate institutionnel | `twolevel` | statique | underline | sb | #ffffff / #102a43 / #0b69a3 | merriweather / source-sans-3 | fade-in-up | — |
| 54 | `corpo-04.corpo-04` | Cabinet Équerre | Entreprises, corporate et finance | Conseil net | `contactfirst` | statique | underline | a | #ffffff / #1c2b33 / #2b7a78 | lora / source-sans-3 | fade-in-up | — |
| 55 | `corpo-05.corpo-05` | Fonds Horizon | Entreprises, corporate et finance | Finance classique | `tagline` | statique | plain | b | #fafaf7 / #1a2233 / #a3772a | playfair-display / lato | fade-in-up | — |
| 56 | `corpo-06.corpo-06` | Mandat | Entreprises, corporate et finance | Corporate accroche | `tagline` | collant · shrink | underline | sb | #ffffff / #0e1f2e / #0aa5a0 | manrope / inter | fade-in-up | — |
| 57 | `corpo-07.corpo-07` | Dalle Pro | Entreprises, corporate et finance | Navigation étirée | `slab` | statique | tab | b | #ffffff / #14213d / #fca311 | barlow / barlow | fade-in-up | — |
| 58 | `corpo-08.corpo-08` | Bloc Capital | Entreprises, corporate et finance | Bloc de marque | `sidebrand` | statique | underline | b | #f4f6f8 / #13233a / #13233a | archivo / inter | fade-in-up | — |
| 59 | `corpo-09.corpo-09` | Prisme Assurances | Entreprises, corporate et finance | Corporate lumineux | `classic` | statique | underline | aob | #ffffff / #223249 / #e85d3a | nunito-sans / nunito-sans | fade-in-up | — |
| 60 | `corpo-10.corpo-10` | Gazette Éco | Entreprises, corporate et finance | Corporate éditorial | `mega` | statique | plain | ab | #0f2238 / #f4efe3 / #d4a73c | old-standard-tt / pt-sans | fade-in-up | — |
| 61 | `sante-01.sante-01` | Verger | Nutrition, santé et bien-être | Santé rassurante | `contactfirst` | statique | underline | a | #f6fbf6 / #1f3a2b / #3d8b5a | lora / nunito | fade-in-up | — |
| 62 | `sante-02.sante-02` | Souffle | Nutrition, santé et bien-être | Bien-être aérien | `badge` | statique | pill | b | #f3f8fa / #233844 / #4b9cb8 | quicksand / nunito-sans | fade-in-up | — |
| 63 | `sante-03.sante-03` | Racine | Nutrition, santé et bien-être | Naturel organique | `twolevel` | collant | underline | ac | #fbf6ec / #3a2c1c / #566b1f | fraunces / karla | fade-in-up | — |
| 64 | `sante-04.sante-04` | Équilibre | Nutrition, santé et bien-être | Centré apaisant | `centre` | statique | thin | b | #f4f7f2 / #2a3b2f / #5c8a5e | cormorant-garamond / mulish | fade-in-up | — |
| 65 | `sante-05.sante-05` | Clinique Claire | Nutrition, santé et bien-être | Clinique moderne | `classic` | statique | underline | ab | #ffffff / #0f3b52 / #0e8fb0 | figtree / figtree | fade-in-up | — |
| 66 | `sante-06.sante-06` | Pause Thé | Nutrition, santé et bien-être | Pilule douce | `pill` | collant | plain | b | #f6efe7 / #3a2d26 / #a0674b | fraunces / nunito-sans | fade-in-up | — |
| 67 | `sante-07.sante-07` | Fruit Frais | Nutrition, santé et bien-être | Pile centrée joyeuse | `stackc` | statique | underline | b | #fff7e8 / #3b2a14 / #f2891b | baloo-2 / nunito | fade-in-up | — |
| 68 | `sante-08.sante-08` | Maison Calme | Nutrition, santé et bien-être | Deux tons apaisants | `twotone` | statique | pill | b | #f7fbfa / #1d3b38 / #2f8f83 | josefin-sans / mulish | fade-in-up | — |
| 69 | `sante-09.sante-09` | Étincelle Vitale | Nutrition, santé et bien-être | Accroche chaleureuse | `dual` | statique | underline | tob | #fffaf2 / #34281d / #b0500c | young-serif / nunito | fade-in-up | — |
| 70 | `sante-10.sante-10` | Rituel | Nutrition, santé et bien-être | Booking bien-être | `booking` | statique | thin | b | #fbf3f3 / #3f2a2c / #b5656b | italiana / jost | fade-in-up | — |
| 71 | `archi-01.archi-01` | Plan Directeur | Architecture, immobilier et décoration | Minimalisme architectural | `coords` | statique | plain | b | #f2f1ee / #111111 / #111111 | archivo / dm-mono | fade-in-up | — |
| 72 | `archi-02.archi-02` | Coupe Nord | Architecture, immobilier et décoration | Grille technique claire | `coords` | collant | mono | b | #ffffff / #0f172a / #e11d48 | ibm-plex-sans / ibm-plex-mono | fade-in-up | — |
| 73 | `archi-03.archi-03` | Béton Brut | Architecture, immobilier et décoration | Brutalisme moderne | `cells` | statique | plain | b | #d9d7d0 / #161616 / #161616 | space-grotesk / space-mono | fade-in-up | — |
| 74 | `archi-04.archi-04` | Foncier | Architecture, immobilier et décoration | Navigation en grille | `navgrid` | statique | tab | sab | #ffffff / #1d2733 / #0e7490 | manrope / manrope | fade-in-up | — |
| 75 | `archi-05.archi-05` | Lot & Toit | Architecture, immobilier et décoration | Immobilier élégant | `navgrid` | collant | tab | sb | #faf8f4 / #2a2a28 / #a4793b | cormorant-garamond / lato | fade-in-up | — |
| 76 | `archi-06.archi-06` | Cote | Architecture, immobilier et décoration | Index d'architecte | `twotone` | statique | mono | b | #d8d6d0 / #1c1c1a / #b8431b | jost / dm-mono | fade-in-up | — |
| 77 | `archi-07.archi-07` | Atelier Sable | Architecture, immobilier et décoration | Décoration minimale | `dock` | collant | plain | ac | #e6dccb / #2b2620 / #8a5a2b | fraunces / dm-mono | fade-in-up | — |
| 78 | `archi-08.archi-08` | Maison Cadre | Architecture, immobilier et décoration | Cadre décoratif | `frame` | statique | plain | ac | #f5efe6 / #2a2118 / #2a2118 | playfair-display / karla | fade-in-up | — |
| 79 | `archi-09.archi-09` | Pierre Angulaire | Architecture, immobilier et décoration | Bloc de marque minéral | `sidebrand` | statique | underline | b | #f6f5f1 / #232321 / #5a6b5d | bellefair / work-sans | fade-in-up | — |
| 80 | `archi-10.archi-10` | Maquette 1:50 | Architecture, immobilier et décoration | Navigation encadrée | `boxnav` | statique | plain | ac | #ffffff / #141414 / #b5532a | bricolage-grotesque / inter | fade-in-up | — |
| 81 | `resto-01.resto-01` | Table d'Hôte | Restaurants, gastronomie et hôtellerie | Bistrot chaleureux | `booking` | statique | plain | b | #fbf3e6 / #2d1a10 / #9a3412 | playfair-display / lato | fade-in-up | — |
| 82 | `resto-02.resto-02` | Maison Étoilée | Restaurants, gastronomie et hôtellerie | Gastronomie | `booking` | collant · shrink | thin | b | #14110e / #f1e8da / #c9a24b | cinzel / raleway | fade-in-up | — |
| 83 | `resto-03.resto-03` | Brasserie Lumière | Restaurants, gastronomie et hôtellerie | Brasserie vivante | `booking` | statique | underline | ab | #fffaf1 / #2a2118 / #c2410c | abril-fatface / dm-sans | fade-in-up | — |
| 84 | `resto-04.resto-04` | Trois Messages | Restaurants, gastronomie et hôtellerie | Hôtel de bord de mer | `ticker` | statique | plain | b | #f1f7f8 / #12303a / #1b7f93 | cormorant-garamond / jost | fade-in-up | — |
| 85 | `resto-05.resto-05` | Mas Provençal | Restaurants, gastronomie et hôtellerie | Hôtel de campagne | `ticker` | collant | underline | b | #fbf4e8 / #37281a / #8a6a1c | eb-garamond / karla | fade-in-up | — |
| 86 | `resto-06.resto-06` | Domaine | Restaurants, gastronomie et hôtellerie | Luxe hôtelier | `luxe` | statique | thin | b | #1c1917 / #f5efe3 / #c9a24b | cinzel / lato | fade-in-up | — |
| 87 | `resto-07.resto-07` | Cuisine du Monde | Restaurants, gastronomie et hôtellerie | Restaurant centré | `centre` | statique | underline | ab | #fff7ed / #3a1d0f / #c2410c | fraunces / nunito-sans | fade-in-up | — |
| 88 | `resto-08.resto-08` | Le Passage | Restaurants, gastronomie et hôtellerie | Salon de thé | `classic` | collant | underline | b | #1f3a2f / #f3ead8 / #d9a441 | marcellus / lato | fade-in-up | — |
| 89 | `resto-09.resto-09` | Épicerie Fine | Restaurants, gastronomie et hôtellerie | Épicerie médaillon | `frame` | statique | box | ac | #f1ead2 / #2d2a14 / #6b7a1f | young-serif / nunito-sans | fade-in-up | — |
| 90 | `resto-10.resto-10` | Soirée Cinéma | Restaurants, gastronomie et hôtellerie | Hôtel superposé | `glass` | superposé · solid | plain | ab | #ffffff / #151212 / #f2d9a6 | gilda-display / jost | fade-in-up | — |
| 91 | `media-01.media-01` | Le Quotidien | Médias, magazines, culture et portfolios | Mât de journal | `masthead` | statique | plain | s | #fffdf8 / #161513 / #b91c1c | playfair-display / source-sans-3 | fade-in-up | — |
| 92 | `media-02.media-02` | Revue Verte | Médias, magazines, culture et portfolios | Magazine culturel | `masthead` | collant · hide | plain | b | #f1efe2 / #143324 / #143324 | dm-serif-display / lora | fade-in-up | — |
| 93 | `media-03.media-03` | Contre-Champ | Médias, magazines, culture et portfolios | Magazine de cinéma | `masthead` | statique | box | — | #111111 / #f4f1ea / #e5262a | bebas-neue / inter | fade-in-up | — |
| 94 | `media-04.media-04` | Cadre Libre | Médias, magazines, culture et portfolios | Portfolio éditorial de photographe | `monument` | statique | mono | b | #f4f3ef / #111111 / #111111 | instrument-serif / dm-mono | fade-in-up | — |
| 95 | `media-05.media-05` | Sommaire | Médias, magazines, culture et portfolios | Index culturel | `index` | statique | underline | ab | #fbfaf6 / #1d1b17 / #1d1b17 | libre-caslon-text / dm-mono | fade-in-up | — |
| 96 | `media-06.media-06` | Page Neuve | Médias, magazines, culture et portfolios | Navigation en grille | `navgrid` | statique | tab | sb | #ffffff / #111827 / #dc2626 | merriweather / public-sans | fade-in-up | — |
| 97 | `media-07.media-07` | Trois Titres | Médias, magazines, culture et portfolios | Magazine à la une | `ticker` | collant | plain | b | #fff5ef / #2b1710 / #c2410c | abril-fatface / inter | fade-in-up | — |
| 98 | `media-08.media-08` | Studio Radio | Médias, magazines, culture et portfolios | Accroche de média | `tagline` | statique | plain | ib | #0f1226 / #f1efff / #ff3d81 | righteous / dm-sans | fade-in-up | — |
| 99 | `media-09.media-09` | Boîtes Noires | Médias, magazines, culture et portfolios | Navigation encadrée | `boxnav` | statique | plain | b | #fbf4e4 / #111111 / #2a6fdb | space-grotesk / inter | fade-in-up | — |
| 100 | `media-10.media-10` | Galerie Z | Médias, magazines, culture et portfolios | Cellules d'exposition | `cells` | collant | plain | b | #ffffff / #0a0a0a / #0a0a0a | syne / inter | fade-in-up | — |

### Descriptions

1. **Maison Aurore** (`luxe-01.luxe-01`) — Marque centrée très espacée, navigation fine de chaque côté, filets doubles : une maison de couture.
2. **Velours Noir** (`luxe-02.luxe-02`) — Fond noir, or discret, navigation en petites capitales : l'élégance d'une boutique de nuit.
3. **Atelier Perle** (`luxe-03.luxe-03`) — Une seule bande claire, marque italique, navigation en deux mots : le luxe de la retenue.
4. **Rive Gauche** (`luxe-04.luxe-04`) — Marque et navigation centrées sur un seul axe, ornements fins : une vitrine de maison.
5. **Plume & Soie** (`luxe-05.luxe-05`) — Marque au-dessus, liens espacés entre deux filets : un en-tête de maison de soieries.
6. **Vogue Atelier** (`luxe-06.luxe-06`) — Mât de magazine : date, accroche, titre monumental en serif, filets épais.
7. **Studio Satin** (`luxe-07.luxe-07`) — Une ligne fine : marque minuscule, navigation en mono, filet noir : la haute couture à l'état brut.
8. **Monogramme** (`luxe-08.luxe-08`) — Marque dans un disque doré, navigation sobre à droite : un blason de maison.
9. **Cour d'Honneur** (`luxe-09.luxe-09`) — Grande marque à gauche, liens empilés à droite en grand, filet épais : un en-tête de galerie.
10. **Film de Soie** (`luxe-10.luxe-10`) — Superposé sur la vidéo d'ouverture : marque blanche, navigation en verre dépoli, bouton clair.
11. **Voltage** (`sport-01.sport-01`) — Marque massive, navigation en majuscules lourdes, bouton d'essai, liseré d'accent épais.
12. **Apex Club** (`sport-02.sport-02`) — Fond noir, lime électrique : en-tête d'un club de compétition.
13. **Cardio Rouge** (`sport-03.sport-03`) — Quatre cases séparées par de gros filets : logo, navigation, date, bouton.
14. **Iron Yard** (`sport-04.sport-04`) — Cellules à filets épais, grille de nav, texte mono : une salle de force.
15. **Sprint** (`sport-05.sport-05`) — Marque, navigation, grand bouton arrondi : la conversion d'abord.
16. **Marathon** (`sport-06.sport-06`) — Liens étirés sur toute la largeur, onglets à liseré haut : lisible pour les compétitions.
17. **Trail Nord** (`sport-07.sport-07`) — Bloc de marque coloré à gauche, navigation à droite : un club de montagne.
18. **Dojo** (`sport-08.sport-08`) — Navigation centrée, pastille, bouton contour et bouton plein : un art martial.
19. **Pulse 24** (`sport-09.sport-09`) — Une rangée basse, nette : la marque, des liens en monospace, un bouton.
20. **Podium** (`sport-10.sport-10`) — Tout l'en-tête dans un cadre noir épais avec ombre dure : esprit affiche de championnat.
21. **Étal Vif** (`ecom-01.ecom-01`) — Trois étages : bandeau promo, recherche large avec compte et panier, catégories en onglets.
22. **Panier Doré** (`ecom-02.ecom-02`) — Bandeau sombre, recherche, panier ; catégories en pleine largeur sur fond crème.
23. **Marché Pop** (`ecom-03.ecom-03`) — Rangée de marque colorée, bandeau de catégories ludique, pastille « nouveau ».
24. **Vitrine Claire** (`ecom-04.ecom-04`) — Recherche à gauche, marque au centre, compte et panier à droite ; catégories centrées dessous.
25. **Atelier Terre** (`ecom-05.ecom-05`) — Centré, chaleureux : terre cuite, serif, filet fin sous les catégories.
26. **Dense Market** (`ecom-06.ecom-06`) — Une rangée dense (marque, navigation, recherche, compte, panier) et un ruban d'offre.
27. **Kiosque** (`ecom-07.ecom-07`) — Compact et typographique : serif, ruban rouge, panier en évidence.
28. **Rayon Géant** (`ecom-08.ecom-08`) — Barre sombre, rangée principale, navigation en blocs pleine largeur : un grand catalogue.
29. **Trouvaille** (`ecom-09.ecom-09`) — Grande recherche au centre, catégories en pastilles : on cherche avant de parcourir.
30. **Flottant** (`ecom-10.ecom-10`) — Barre arrondie détachée du bord, ombre douce : une boutique mode.
31. **Prisme** (`tech-01.tech-01`) — Pastille d'annonce, navigation propre, connexion et bouton plein : le classique 2025.
32. **Noctilucent** (`tech-02.tech-02`) — Fond nuit, violet électrique, annonce fine : une plateforme pour développeurs.
33. **Cloud9** (`tech-03.tech-03`) — Bandeau d'annonce, navigation nette, double appel : démo et inscription.
34. **Ligne de Code** (`tech-04.tech-04`) — Barre unique, navigation en mono, filet fin : documentation et API.
35. **Graphe** (`tech-05.tech-05`) — Marque, navigation, connexion et bouton : l'essentiel, bien dosé.
36. **Orbite** (`tech-06.tech-06`) — Barre arrondie flottante, verre clair : une startup d'IA.
37. **Dock Neutre** (`tech-07.tech-07`) — Un dock étroit centré : marque, quatre liens, un bouton : un produit sobre.
38. **Terminal** (`tech-08.tech-08`) — Rangée basse sombre, mono : un outil en ligne de commande.
39. **Duo** (`tech-09.tech-09`) — Pastille, bouton contour, bouton plein, navigation centrée : un SaaS à essai gratuit.
40. **Aurore Boréale** (`tech-10.tech-10`) — Sur un visuel d'ouverture : marque claire, navigation en verre, bouton lumineux.
41. **NOM EN GRAND** (`agence-01.agence-01`) — Le nom du site occupe toute la largeur, la navigation passe dessous entre deux gros filets.
42. **Studio Mutant** (`agence-02.agence-02`) — Titre immense aligné à droite, navigation mono : une agence expérimentale.
43. **Maquette** (`agence-03.agence-03`) — Serif immense, navigation en majuscules espacées, un bouton noir : un studio de design.
44. **Grille Vivante** (`agence-04.agence-04`) — Quatre cases à filets épais, bloc de marque jaune : une agence qui assume.
45. **Index Studio** (`agence-05.agence-05`) — Marque minuscule, libellé « Index », liens en capitales fines : l'extrême sobriété.
46. **Carnet de Notes** (`agence-06.agence-06`) — Marque italique, navigation soulignée au survol : un journal de projets.
47. **Cadre Net** (`agence-07.agence-07`) — Tout dans un cadre noir à ombre dure, couleur d'accent vive : esprit affiche.
48. **Colonne Haute** (`agence-08.agence-08`) — Grande marque à gauche, liens empilés à droite en grand : une composition d'affiche.
49. **Deux Temps** (`agence-09.agence-09`) — Bloc de marque coloré, navigation sur fond clair : l'ordre et le jeu.
50. **Coordonnées** (`agence-10.agence-10`) — Colonnes séparées par des filets fins, cellule d'accroche : une identité d'atelier.
51. **Banque Lumière** (`corpo-01.corpo-01`) — Barre d'information, rangée principale nette : la confiance par la clarté.
52. **Capital Sud** (`corpo-02.corpo-02`) — Barre promo sombre, marque, navigation et bouton : une société d'investissement.
53. **Groupe Atlas** (`corpo-03.corpo-03`) — Barre d'information avec réseaux, rangée épurée, filet bleu : un grand groupe.
54. **Cabinet Équerre** (`corpo-04.corpo-04`) — Coordonnées et rendez-vous en haut, marque et navigation centrées : un cabinet.
55. **Fonds Horizon** (`corpo-05.corpo-05`) — Marque, filet vertical, accroche, navigation et bouton : une sicav.
56. **Mandat** (`corpo-06.corpo-06`) — Marque, accroche courte, navigation, deux actions : un cabinet d'audit.
57. **Dalle Pro** (`corpo-07.corpo-07`) — Liens répartis sur toute la largeur, onglets : un site d'entreprise riche en rubriques.
58. **Bloc Capital** (`corpo-08.corpo-08`) — Bloc de marque à gauche, navigation à droite : un groupe industriel.
59. **Prisme Assurances** (`corpo-09.corpo-09`) — Marque et navigation sur une rangée, appel à l'action contour : une mutuelle.
60. **Gazette Éco** (`corpo-10.corpo-10`) — Mât de journal économique : date, accroche, titre, filets épais.
61. **Verger** (`sante-01.sante-01`) — Coordonnées et prise de rendez-vous en haut, marque et navigation centrées : un cabinet de nutrition.
62. **Souffle** (`sante-02.sante-02`) — Marque dans un disque pastel, navigation douce, bouton rond : un studio de yoga.
63. **Racine** (`sante-03.sante-03`) — Marque dans un médaillon terre, navigation à droite : une boutique de compléments.
64. **Équilibre** (`sante-04.sante-04`) — Navigation à gauche, marque centrée, bouton à droite : douceur et symétrie.
65. **Clinique Claire** (`sante-05.sante-05`) — Une rangée nette : marque, navigation, bouton de rendez-vous : un centre médical.
66. **Pause Thé** (`sante-06.sante-06`) — Barre arrondie flottante aux tons de thé : un salon de bien-être.
67. **Fruit Frais** (`sante-07.sante-07`) — Marque au-dessus, liens entre deux filets : un bar à jus.
68. **Maison Calme** (`sante-08.sante-08`) — Bloc de marque vert d'eau, navigation sur fond clair : un spa.
69. **Étincelle Vitale** (`sante-09.sante-09`) — Marque, accroche, navigation et bouton : une marque de nutrition.
70. **Rituel** (`sante-10.sante-10`) — Message d'accueil, ornements autour de la marque, bouton de réservation : un institut.
71. **Plan Directeur** (`archi-01.archi-01`) — Colonnes séparées par des filets fins : un cabinet d'architectes.
72. **Coupe Nord** (`archi-02.archi-02`) — Cellule d'accroche et de coordonnées, filets noirs fins : un bureau d'études.
73. **Béton Brut** (`archi-03.archi-03`) — Cellules à filets épais, bloc de marque anthracite : un promoteur.
74. **Foncier** (`archi-04.archi-04`) — Marque à gauche, liens utiles en haut, navigation en onglets dessous : une agence immobilière.
75. **Lot & Toit** (`archi-05.archi-05`) — Navigation en onglets à liseré, recherche de biens, bouton : un réseau d'agences.
76. **Cote** (`archi-06.archi-06`) — Marque minuscule, libellé, navigation fine : un site de projets.
77. **Atelier Sable** (`archi-07.archi-07`) — Une ligne : marque italique, liens monospace, filet noir : un showroom.
78. **Maison Cadre** (`archi-08.archi-08`) — Tout dans un cadre fin crème, bouton noir : une boutique de décoration.
79. **Pierre Angulaire** (`archi-09.archi-09`) — Bloc de marque pierre à gauche, navigation et bouton à droite : une agence d'architecture.
80. **Maquette 1:50** (`archi-10.archi-10`) — Liens dans des cases contour, recherche et compte à droite : un catalogue de décoration.
81. **Table d'Hôte** (`resto-01.resto-01`) — Horaires en haut, ornements autour de la marque, bouton de réservation : un bistrot.
82. **Maison Étoilée** (`resto-02.resto-02`) — Marque centrée, liens de chaque côté, horaires : un restaurant gastronomique.
83. **Brasserie Lumière** (`resto-03.resto-03`) — Marque, navigation, réservation : lumineux, simple, convivial.
84. **Trois Messages** (`resto-04.resto-04`) — Ticker de trois messages, marque centrée, navigation de part et d'autre : un hôtel.
85. **Mas Provençal** (`resto-05.resto-05`) — Messages d'accueil colorés, marque en serif, bouton de réservation : une auberge.
86. **Domaine** (`resto-06.resto-06`) — Marque centrée très espacée, navigation fine, filets épais : un domaine viticole.
87. **Cuisine du Monde** (`resto-07.resto-07`) — Navigation à gauche, marque au centre, réservation à droite : un restaurant de quartier.
88. **Le Passage** (`resto-08.resto-08`) — Marque au-dessus, liens ornés d'un filet : un salon de thé raffiné.
89. **Épicerie Fine** (`resto-09.resto-09`) — Marque dans un disque, navigation sobre, bouton : une épicerie gourmande.
90. **Soirée Cinéma** (`resto-10.resto-10`) — Superposé sur la photographie d'ouverture : marque claire, navigation en verre.
91. **Le Quotidien** (`media-01.media-01`) — Date, accroche, titre monumental, filets épais : un quotidien en ligne.
92. **Revue Verte** (`media-02.media-02`) — Mât vert profond, serif contrasté, navigation en capitales : une revue.
93. **Contre-Champ** (`media-03.media-03`) — Mât noir et rouge, titre en sans condensé, filets épais : une revue de cinéma.
94. **Cadre Libre** (`media-04.media-04`) — Titre monumental à droite, liens en monospace, filet noir : un photographe.
95. **Sommaire** (`media-05.media-05`) — Marque minuscule, « Sommaire », rubriques fines : un webzine.
96. **Page Neuve** (`media-06.media-06`) — Marque à gauche, liens utiles et recherche en haut, rubriques en onglets : un média d'information.
97. **Trois Titres** (`media-07.media-07`) — Ticker de trois titres, marque centrée, rubriques de part et d'autre : un magazine.
98. **Studio Radio** (`media-08.media-08`) — Marque, accroche, navigation, réseaux et bouton : une radio indépendante.
99. **Boîtes Noires** (`media-09.media-09`) — Liens dans des cases contour épaisses, panier de billets : un lieu culturel.
100. **Galerie Z** (`media-10.media-10`) — Quatre cases : nom, rubriques, date, billetterie : une galerie d'art contemporain.

## 5. Tests et résultats

Fichiers : `tests/theme-builder-entetes-atelier.test.js` (catalogue + serveur réel), `tests/theme-builder-entetes-atelier-navigateur.test.js` (Chrome), `scripts/audit-entetes-atelier.js` (diversité de structure, rapport). Les deux anciens fichiers de tests de la bibliothèque précédente (`theme-builder-entetes-bibliotheque`, `theme-builder-entetes-secteurs`) sont remplacés.

| Domaine | Vérification | Résultat |
|---|---|---|
| Catalogue | 100 modèles exacts, 10 secteurs × 10, clés et noms uniques, clés sûres | validé |
| Diversité de structure | 100 signatures de composition distinctes, 36 architectures (aucune au-delà de 6 modèles) | validé |
| Identité propre | couleurs fixes et polices de la bibliothèque locale, aucun jeton du site ; ≥ 60 couples de polices, ≥ 90 palettes | validé |
| Lisibilité | contraste ≥ 4,5 pour le texte, le texte secondaire et le bouton, sur les 100 modèles | validé |
| Grammaire | chaque modèle passe `normalizeSections` (mêmes contrôles que la sauvegarde) ; éléments natifs uniquement | validé |
| Contenu | aucune image, vidéo, script ni HTML libre ; menus = menu affecté ; coordonnées = consignes à remplacer | validé |
| Responsive (structure) | aucune position absolue dans une rangée ; menu repliable ; grilles repliées (tablette, mobile) ; éléments secondaires masqués sur mobile | validé |
| Mouvement | ≥ 90 modèles animés (≥ 6 entrées différentes), ≥ 8 effets de survol ; conservés à l'enregistrement | validé |
| Utilisation | « Utiliser » = copie indépendante ; catalogue et autre site intacts ; 100 modèles enregistrables, polices conservées | validé |
| Publication | publication, conditions, remplacement explicite | validé |
| Serveur réel | 100 aperçus et 100 vignettes : 200, identité du site, police propre chargée, aucun script ; aperçu = vignette ; menu d'exemple seulement dans la bibliothèque ; anciennes clés : 404 | validé |
| Chrome — 100 modèles × 3 largeurs | aucun défilement horizontal, aucun élément qui dépasse, aucun chevauchement, aucun texte coupé, marque visible, hauteur raisonnable | validé : 0 modèle défectueux (`rapport-visuel-entetes-atelier.json`) |
| Chrome — diversité des rendus | distance moyenne par pixel entre captures 64×16 : plus proche voisin mesuré (seuil bloquant 0,015) ; la première version de la bibliothèque donnait 0,002 (rendus quasi identiques) : les paires proches ont été retravaillées | validé, valeur dans le rapport JSON |
| Chrome — site publié | un seul en-tête ; police et fond PROPRES au modèle (jamais ceux du site) pour un modèle par secteur ; aucune erreur JavaScript | validé |
| Chrome — menu | menu affecté visible sur ordinateur ; sur mobile, replié derrière un bouton qui s'ouvre et se referme ; pas de débordement | validé |
| Chrome — clavier, mouvement réduit | la touche Tab atteint l'en-tête ; aucune animation infinie avec « réduire les animations » | validé |
| Chrome — défilement | « se cache » (disparaît en descendant, revient en remontant), « se réduit », « devient plein » (superposé) | validé |

## 6. Limites restantes (à ne pas annoncer comme faites)

* **Mouvements non natifs** : « split text », « character reveal », « magnetic button » et menu plein écran sur ordinateur ne sont pas pris en charge par le moteur actuel (le repli du menu derrière un bouton n'existe que sur mobile). Aucune dépendance lourde (GSAP) n'a été ajoutée : les animations d'entrée, de survol et de défilement utilisent le moteur natif du Page Builder, qui respecte « réduire les animations ».
* **Méga-menu à panneaux** : le menu natif n'a qu'un niveau de sous-menu ; les modèles « méga-barre » utilisent une navigation en blocs pleine largeur, pas un panneau de colonnes.
* **Logo alternatif au défilement, versions claire/sombre du logo, barre supérieure fermable** : non pris en charge (un seul logo du site ; la barre supérieure est un texte).
* **Aperçu responsive dans la bibliothèque** : l'aperçu et la vignette sont des rendus réels à une largeur ; la vérification tablette et mobile est faite par les tests Chrome, pas par un sélecteur d'appareil dans la fenêtre d'aperçu.
* **Revenir au modèle initial** : se fait en réutilisant le modèle depuis la bibliothèque (nouvelle copie) ou par les versions du modèle ; il n'y a pas de bouton « réinitialiser » dédié.
* **Éléments de boutique** : le panier, le compte et la recherche sont les éléments natifs du site ; ils affichent des données réelles seulement si le site utilise la boutique ou le catalogue.
* **Distance visuelle** : la mesure par captures réduites est un indicateur de diversité, pas un jugement esthétique ; les en-têtes très sobres (fond clair, peu d'éléments) restent plus proches entre eux que les autres.
* **Déploiement** : voir le compte rendu de livraison (le déploiement Hostinger part de `main` ; la vérification de la version en ligne dépend d'un accès à la production).
