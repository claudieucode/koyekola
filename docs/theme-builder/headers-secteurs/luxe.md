# En-têtes du secteur Luxe, mode et haute couture : matrice de conception

Fichier : `src/themeBuilder/catalog/header/sectors/luxe.js` (clés `luxe-01` à `luxe-10`). Tous les éléments sont natifs (grammaire fermée) ; la navigation est toujours le menu affecté à « En-tête » ; panier, compte et recherche sont ceux du site ; aucun texte factice (consignes à remplacer).

| Clé | Nom | Direction | Composition | Palette (fond / texte / accent) | Polices (titres / texte) | Navigation | Mouvement | Défilement |
|---|---|---|---|---|---|---|---|---|
| 01 | Maison Aurore | Luxe éditorial | grille 3 colonnes : navigation fine / marque centrée très espacée / compte + panier ; rangée haute, puis bande d'accroche teintée, entre doubles filets | #faf6f0 / #1b1411 / #7a5c1f | Cormorant Garamond / Jost | fine, petites capitales | révélation du logo, menu et actions en fondu | statique |
| 02 | Gazette Mode | Fashion magazine | ticker noir ; marque italique + compte, panier, bouton ; onglets entre filets de 4 px et 1 px | #ffffff / #0d0d0d / #b3121f | Playfair Display / Libre Franklin | onglets (liseré rouge au survol) | montée douce | se cache en descendant |
| 03 | Rive Gauche | Haute couture parisienne | pile centrée : ornements (disques) + message, marque Didot, navigation entre deux filets or avec anneaux | #fffdf9 / #1d1b19 / #8c6a28 | GFS Didot / Tenor Sans | fine, capitales espacées | fondu doux | collant |
| 04 | Atelier Washi | Minimalisme japonais | colonne gauche de 240 px (marque + navigation verticale), filet vertical, grand vide, lien souligné en pied | #f3efe6 / #1f1d1a / #a8322a | Shippori Mincho / Zen Kaku Gothic New | verticale ; tablette et mobile : menu replié derrière un bouton | fondu doux | statique |
| 05 | Grand Format | Typographie monumentale | nom pleine largeur fluide 52–190 px, filet de 5 px, rangée fine | #ece5da / #14110f / #14110f | Bodoni Moda / Inter Tight | mono, capitales | montée douce | statique |
| 06 | Maison Pérenne | Haut de gamme intemporel | liseré dégradé, trois cases pleine largeur : bloc de marque doré, navigation, actions | #101a2c / #f3eee3 / #c9a86a | Libre Caslon Display / Raleway | fine, capitales | zoom ; bouton qui se soulève | collant |
| 07 | Maison Dissymétrie | Composition asymétrique de maison | bloc bordeaux 36 % (marque + accroche) ; à droite : navigation, filet, message + actions | #f6ece4 / #2a1418 / #5b1a28 | DM Serif Display / Work Sans | soulignée | révélation de la marque | statique |
| 08 | Velours Noir | Vitrine nocturne | fine barre compte + panier sur fond alterné ; navigation fine à gauche, marque à droite ; liseré or | #0d0b0a / #f1ebe0 / #c8a45c | Bodoni Moda / Tenor Sans | fine, capitales (menu replié sur mobile) | fondu doux | collant, se réduit |
| 09 | Écrin | Joaillerie | superposé transparent ; message orné de losanges ; marque Cinzel + navigation + compte ; filet dégradé | #0b2623 / #f4efe3 / #d9c08a | Cinzel / Jost | fine, capitales | montée douce | superposé transparent sur le visuel d'ouverture, devient plein (fond et texte du SITE, effet du moteur) au défilement |
| 10 | Flacon | Parfumerie | liseré dégradé ; bloc gauche (marque italique + navigation soulignée) ; colonne droite (bouton pilule, compte, panier) | #f7e9e6 / #3a1f2b / #8e3b5a | Instrument Serif / Raleway | soulignée | montée douce ; bouton qui se soulève | collant, se réduit |

Responsive : grilles repliées en une colonne sur mobile (et réglage tablette), menu replié derrière un bouton (04 : navigation verticale remplacée par un menu replié), compte et panier conservés.
