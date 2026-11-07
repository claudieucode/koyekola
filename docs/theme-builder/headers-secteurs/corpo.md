# En-têtes du secteur « Entreprises, corporate et finance » (corpo-01 à corpo-10)

Fichier source : `src/themeBuilder/catalog/header/sectors/corpo.js`. Aucune image, aucune donnée inventée (coordonnées, annonces et ticker sont des consignes à remplacer), pas de sélecteur de langue (fonction absente du CMS).

## Matrice de conception

| Clé | Nom | Direction artistique | Composition | Palette (fond / texte / accent) | Polices (titres / texte) | Navigation | Composants | Défilement | Entrée / survol |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Meridian | Corporate sophistiqué | barre sombre fermable, rangée à 3 zones, liseré dégradé or vers marine | #ffffff / #0c2340 / #0c2340 | Source Serif 4 / Public Sans | soulignée, centrée | note, coordonnées, recherche, bouton | collant | fondu / se soulève |
| 02 | Helvet Institut | Minimalisme suisse | filet noir de 8 px, 4 cellules séparées par des filets verticaux | #ffffff / #111111 / #d50000 | Inter Tight / IBM Plex Sans | fine, dans une cellule | compte, bouton rouge carré | statique | révélation / appuie |
| 03 | Banque Privée Aubert | Banque privée à serif | axe central, 3 rangées, nom italique entre deux filets or | #10261d / #f3ead7 / #c7a45a | Cormorant Garamond / Jost | fine, capitales espacées | compte, accroche, bouton souligné | statique | fondu |
| 04 | Cabinet Schéma | Conseil à schéma | pictogramme anneau + disque, cases bordées, liseré | #f4f6f6 / #1d2b2f / #0f766e | DM Sans / IBM Plex Sans | cases (mosaïque) | bouton | collant | glissement / se soulève |
| 05 | Mutuelle Clair-Foyer | Assurance rassurante | coins bas arrondis, pastille dégradée, capsule d'aide | #fffaf3 / #1f3a5f / #c2410c | Nunito / Nunito Sans | pilules | espace client, téléphone, bouton pilule | collant | montée / flotte |
| 06 | Parquet Marchés | Finance de marché | ticker pleine largeur + rangée sombre monospace | #0a1410 / #e8f1ec / #3ddc97 | IBM Plex Sans / IBM Plex Mono | mono, majuscules | ticker, compte, bouton contour | collant | zoom |
| 07 | Étude Delacroix | Audit / juridique | niveau 1 marque + coordonnées sous double filet, niveau 2 barre bordeaux | #ffffff / #1b2a41 / #7a1f2b | Libre Baskerville / Source Sans 3 | blocs pleins dans la barre | coordonnées, recherche | collant | montée |
| 08 | Groupe Forge | Groupe industriel | bandeau diagonal jaune, marque condensée, cases de métiers, liseré | #14181d / #f4f4f2 / #ffb703 | Barlow Condensed / Barlow | mosaïque (navTiles) | bouton massif | collant | glissement / appuie |
| 09 | Flux B2B | Fintech B2B | capsule flottante sur fond nuit | #0d1030 / #f4f5ff / #5b4bf0 | Plus Jakarta Sans / Inter | pilules dans la capsule | pastille dégradée, connexion, bouton dégradé | collant | zoom / se soulève |
| 10 | Holding Pierre | Holding, navigation latérale | grille 3 colonnes : menu vertical, nom monumental fluide, contact | #efece4 / #2a2a26 / #34452f | Newsreader / Work Sans | verticale (ordinateur), menu plein écran (tablette, mobile) | monument, coordonnées, bouton souligné, menu plein écran | statique | révélation |

## Responsive
Menus repliés derrière un bouton sur tablette et mobile (sauf 10 : menu plein écran) ; actions secondaires masquées sur mobile (`hideOn`), contact conservé ; grilles avec réglage tablette et `1fr`/`1fr auto` sur mobile.
