# Inventaire des contrôles de style de KOLAKISA

> Généré par `node scripts/build-controls-inventory.js` à partir du code (`STYLE_PROPS`, `STYLE_UI`, tables de l'inspecteur) et des résultats de la matrice navigateur. Ne pas modifier à la main.

**110 propriétés de style** — 81 pilotées une par une depuis l'inspecteur réel par la matrice (liste, icônes, nombre, couleur) ; 29 atteintes par un contrôle spécialisé (voir colonne « Contrôle ») dont les tests sont ceux d'avant ce chantier (colonne « Éprouvé par » : fichiers qui citent la propriété).

## Mise en page (26)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `display` | Affichage | `display` | icônes | `block` `flex` `grid` `inline-block` `inline` `inline-flex` `none` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `flexDirection` | Direction | `flex-direction` | icônes | `row` `column` `row-reverse` `column-reverse` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `flexWrap` | Retour à la ligne | `flex-wrap` | icônes | `wrap` `nowrap` `wrap-reverse` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `justifyContent` | Répartition | `justify-content` | icônes | `flex-start` `center` `flex-end` `space-between` `space-around` `space-evenly` `start` `end` `stretch` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `alignItems` | Alignement des enfants | `align-items` | icônes | `stretch` `flex-start` `center` `flex-end` `baseline` `start` `end` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `alignContent` | Répartition des lignes | `align-content` | icônes | `stretch` `flex-start` `center` `flex-end` `space-between` `space-around` `space-evenly` `start` `end` | écrans + survol / focus / clic | matrice navigateur : grid (icônes) ; contrat serveur |
| `alignSelf` | Alignement dans le parent | `align-self` | icônes | `auto` `flex-start` `center` `flex-end` `stretch` `start` `end` | écrans + survol / focus / clic | matrice navigateur : flexChild (icônes), head (icônes), button (icônes), image (icônes) ; contrat serveur |
| `justifySelf` | Alignement horizontal dans la case | `justify-self` | icônes | `auto` `start` `center` `end` `stretch` | écrans + survol / focus / clic | matrice navigateur : head (icônes) ; contrat serveur |
| `order` | Ordre d'affichage | `order` | ordre : premier / dernier / personnalisé | nombre -20 … 20, entier | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : automatisations-barre-navigateur, boucle-carte-inseree, centre-gestion |
| `gap` | Écart entre enfants | `gap` | nombre | longueur px rem em % ; valeur du site (`token:`) | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |
| `rowGap` | Écart entre lignes | `row-gap` | nombre | longueur px rem em % ; valeur du site (`token:`) | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |
| `columnGap` | Écart entre colonnes | `column-gap` | nombre | longueur px rem em % ; valeur du site (`token:`) | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |
| `columns` | Colonnes (grille) | `grid-template-columns` | colonnes de la grille (boutons + / − et champ) | nombre 1 … 12, entier | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-blocs-mise-en-page, editeur-canvas-navigateur, editeur-canvas-proprietes-restantes-navigateur |
| `gridTemplate` | Largeurs des colonnes (ex. 2fr 1fr) | `grid-template-columns` | largeurs des colonnes (texte) | pistes de grille (`fr`, `px`, `%`, `auto`; 12 au plus) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-ecart-curseur-navigateur, editeur-structure |
| `gridRows` | Lignes (grille) | `grid-template-rows` | lignes de la grille | nombre 1 … 12, entier | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-structure-navigateur, editeur-structure |
| `gridRowsTemplate` | Hauteurs des lignes (ex. 200px 1fr) | `grid-template-rows` | hauteurs des lignes (texte) | pistes de grille (`fr`, `px`, `%`, `auto`; 12 au plus) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-structure |
| `gridAutoRows` | Lignes automatiques (ex. minmax(120px, auto)) | `grid-auto-rows` | pistes automatiques (texte) | pistes de grille (`fr`, `px`, `%`, `auto`; 12 au plus) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, proprietes-style-completes |
| `gridAutoColumns` | Colonnes automatiques (ex. 1fr) | `grid-auto-columns` | pistes automatiques (texte) | pistes de grille (`fr`, `px`, `%`, `auto`; 12 au plus) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, proprietes-style-completes |
| `gridAutoFlow` | Remplissage | `grid-auto-flow` | remplissage de la grille | `row` `column` `row dense` `column dense` | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-widgets |
| `justifyItems` | Alignement horizontal des cases | `justify-items` | alignement des cases | `stretch` `start` `center` `end` | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-widgets |
| `gridColumnSpan` | Colonnes occupées | `grid-column` | nombre | nombre 1 … 12, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |
| `gridRowSpan` | Lignes occupées | `grid-row` | nombre | nombre 1 … 6, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |
| `gridColumnStart` | Colonne : début (ligne) | `grid-column-start` | nombre | nombre 1 … 13, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |
| `gridColumnEnd` | Colonne : fin (ligne) | `grid-column-end` | nombre | nombre 1 … 13, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |
| `gridRowStart` | Ligne : début (ligne) | `grid-row-start` | nombre | nombre 1 … 13, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |
| `gridRowEnd` | Ligne : fin (ligne) | `grid-row-end` | nombre | nombre 1 … 13, entier | écrans + survol / focus / clic | matrice navigateur : head (nombre) ; contrat serveur |

## Dimensions (9)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `width` | Largeur | `width` | nombre | longueur px % rem em vw ; `auto`, `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), image (nombre), grid (nombre) ; contrat serveur |
| `height` | Hauteur | `height` | nombre | longueur px % rem em vh ; `auto`, `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : image (nombre), grid (nombre) ; contrat serveur |
| `minWidth` | Largeur min. | `min-width` | nombre | longueur px % rem em vw ; `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `maxWidth` | Largeur max. | `max-width` | nombre | longueur px % rem em vw ; `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `minHeight` | Hauteur min. | `min-height` | nombre | longueur px % rem em vh ; `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : image (nombre), grid (nombre) ; contrat serveur |
| `maxHeight` | Hauteur max. | `max-height` | nombre | longueur px % rem em vh ; `fit-content` `min-content` `max-content` | écrans + survol / focus / clic | matrice navigateur : image (nombre), grid (nombre) ; contrat serveur |
| `flexGrow` | Croissance (flex-grow) | `flex-grow` | bascule Grandir / Rétrécir (flex) ou proportion de colonne | nombre 0 … 20 | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-moteur-navigateur, editeur-canvas-proprietes-effectives-navigateur, editeur-canvas-proprietes-restantes-navigateur |
| `flexShrink` | Rétrécissement (flex-shrink) | `flex-shrink` | bascule Grandir / Rétrécir | nombre 0 … 20 | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-dimensions-navigateur, editeur-canvas-proprietes-effectives-navigateur, editeur-canvas-proprietes-restantes-navigateur |
| `flexBasis` | Base de taille (flex-basis) | `flex-basis` | bascule Grandir / Rétrécir | longueur px % rem ; `auto` | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-effectives-navigateur, editeur-canvas-proprietes-restantes-navigateur, editeur-layout-contrat-navigateur |

## Espacement (8)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `marginTop` | Marge haut | `margin-top` | cellules Espacement (4 côtés liés ou non, unité commune) | longueur px % rem em ; négatif, `auto`, valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-proprietes-effectives-navigateur |
| `marginRight` | Marge droite | `margin-right` | cellules Espacement | longueur px % rem em ; négatif, `auto`, valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-effectives-navigateur, editeur-canvas-proprietes-restantes-navigateur, editeur-espacement-navigateur |
| `marginBottom` | Marge bas | `margin-bottom` | cellules Espacement | longueur px % rem em ; négatif, `auto`, valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-proprietes-effectives-navigateur |
| `marginLeft` | Marge gauche | `margin-left` | cellules Espacement | longueur px % rem em ; négatif, `auto`, valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-proprietes-effectives-navigateur, editeur-canvas-proprietes-restantes-navigateur |
| `paddingTop` | Intérieur haut | `padding-top` | cellules Espacement | longueur px % rem em ; valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-proprietes-effectives-navigateur |
| `paddingRight` | Intérieur droite | `padding-right` | cellules Espacement | longueur px % rem em ; valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-fond-pleine-largeur-navigateur |
| `paddingBottom` | Intérieur bas | `padding-bottom` | cellules Espacement | longueur px % rem em ; valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-proprietes-effectives-navigateur |
| `paddingLeft` | Intérieur gauche | `padding-left` | cellules Espacement | longueur px % rem em ; valeur du site (`token:`) | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : controles-numeriques-navigateur, editeur-canvas-dimensions-navigateur, editeur-canvas-fond-pleine-largeur-navigateur |

## Typographie (21)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `fontFamily` | Police | `font-family` | sélecteur de la bibliothèque de polices (Font Manager) | `heading` `body` `system` `serif` `mono` | écrans + survol / focus / clic | matrice navigateur : flexChild (autre), grid (autre) ; contrat serveur |
| `fontSize` | Taille | `font-size` | nombre | longueur px em rem vw | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), grid (nombre) ; contrat serveur |
| `fontWeight` | Graisse | `font-weight` | liste | `300` `400` `500` `600` `700` `800` `900` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), head (liste), button (liste), grid (liste) ; contrat serveur |
| `fontStyle` | Style | `font-style` | icônes | `normal` `italic` | écrans + survol / focus / clic | matrice navigateur : flexChild (icônes), grid (icônes) ; contrat serveur |
| `lineHeight` | Interligne | `line-height` | nombre | nombre 0.8 … 3 | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), grid (nombre) ; contrat serveur |
| `columnCount` | Colonnes de texte | `column-count` | nombre | nombre 1 … 6, entier | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `lineClamp` | Lignes maximum | `-webkit-line-clamp` | Typographie des textes | nombre 1 … 10, entier | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-widgets-parties-navigateur, widgets-parts |
| `letterSpacing` | Espacement des lettres | `letter-spacing` | nombre | longueur px em rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), grid (nombre) ; contrat serveur |
| `wordSpacing` | Espacement des mots | `word-spacing` | nombre | longueur px em rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `textIndent` | Retrait de première ligne | `text-indent` | nombre | longueur px em rem % ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `textTransform` | Casse | `text-transform` | icônes | `none` `uppercase` `lowercase` `capitalize` | écrans + survol / focus / clic | matrice navigateur : flexChild (icônes), head (icônes), button (icônes), grid (icônes) ; contrat serveur |
| `textAlign` | Alignement du texte | `text-align` | icônes | `left` `center` `right` `justify` | écrans + survol / focus / clic | matrice navigateur : flexChild (icônes), head (icônes), button (icônes), grid (icônes) ; contrat serveur |
| `textDecoration` | Décoration | `text-decoration` | icônes | `none` `underline` `line-through` | écrans + survol / focus / clic | matrice navigateur : flexChild (icônes), grid (icônes) ; contrat serveur |
| `textShadow` | Ombre du texte | `text-shadow` | liste | `none` `sm` `md` `lg` `glow` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `direction` | Sens d'écriture | `direction` | liste | `ltr` `rtl` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `textStrokeWidth` | Contour du texte : épaisseur | `-webkit-text-stroke-width` | nombre | longueur px em | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `textStrokeColor` | Contour du texte : couleur | `-webkit-text-stroke-color` | couleur | `#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>` | écrans + survol / focus / clic | matrice navigateur : flexChild (couleur), grid (couleur) ; contrat serveur |
| `whiteSpace` | Retour à la ligne | `white-space` | liste | `normal` `nowrap` `pre` `pre-wrap` `pre-line` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `textWrap` | Équilibrage du texte | `text-wrap` | liste | `wrap` `nowrap` `balance` `pretty` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `overflowWrap` | Mots trop longs | `overflow-wrap` | liste | `normal` `break-word` `anywhere` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `textOverflow` | Texte coupé (avec « Masqué » et « Jamais ») | `text-overflow` | liste | `clip` `ellipsis` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |

## Couleurs (2)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `color` | Couleur du texte | `color` | couleur | `#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>` | écrans + survol / focus / clic | matrice navigateur : flexChild (couleur), head (couleur), button (couleur), grid (couleur) ; contrat serveur |
| `backgroundColor` | Couleur de fond | `background-color` | couleur | `#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>` | écrans + survol / focus / clic | matrice navigateur : head (couleur) ; contrat serveur |

## Fond (5)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `backgroundClip` | Découpe du fond | `background-clip` | liste | `border-box` `padding-box` `content-box` `text` | écrans + survol / focus / clic | matrice navigateur : grid (liste) ; contrat serveur |
| `backgroundSize` | Taille du fond | `background-size` | liste | `cover` `contain` `auto` | écrans + survol / focus / clic | matrice navigateur : grid (liste) ; contrat serveur |
| `backgroundPosition` | Position du fond | `background-position` | liste | `center` `top` `bottom` `left` `right` `top left` `top right` `bottom left` `bottom right` | écrans + survol / focus / clic | matrice navigateur : grid (liste) ; contrat serveur |
| `backgroundRepeat` | Répétition du fond | `background-repeat` | liste | `no-repeat` `repeat` `repeat-x` `repeat-y` | écrans + survol / focus / clic | matrice navigateur : grid (liste) ; contrat serveur |
| `backgroundAttachment` | Défilement du fond | `background-attachment` | liste | `scroll` `fixed` | écrans + survol / focus / clic | matrice navigateur : grid (liste) ; contrat serveur |

## Bordure (16)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `borderWidth` | Épaisseur de bordure | `border-width` | nombre | longueur px ; pas de % | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |
| `borderTopWidth` | Épaisseur haut | `border-top-width` | bordure déliée (4 côtés) | longueur px ; pas de % | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : automatisations-barre-navigateur, editeur-canvas-proprietes-restantes-navigateur, proprietes-style-completes |
| `borderRightWidth` | Épaisseur droite | `border-right-width` | bordure déliée | longueur px ; pas de % | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, proprietes-style-completes |
| `borderBottomWidth` | Épaisseur bas | `border-bottom-width` | bordure déliée | longueur px ; pas de % | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-fleches-numeriques-navigateur, editeur-pro |
| `borderLeftWidth` | Épaisseur gauche | `border-left-width` | bordure déliée | longueur px ; pas de % | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, editeur-pro, editeur-regles-magnetisme-navigateur |
| `borderStyle` | Style de bordure | `border-style` | liste | `none` `solid` `dashed` `dotted` `double` `groove` `ridge` `inset` `outset` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `borderColor` | Couleur de bordure | `border-color` | couleur | `#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>` | écrans + survol / focus / clic | matrice navigateur : grid (couleur) ; contrat serveur |
| `borderRadius` | Arrondi | `border-radius` | nombre | longueur px % rem | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), image (nombre), grid (nombre) ; contrat serveur |
| `borderTopLeftRadius` | Arrondi haut gauche | `border-top-left-radius` | arrondi délié (4 coins) | longueur px % rem | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-navigateur, editeur-canvas-proprietes-restantes-navigateur, editeur-raccourcis-boite-navigateur |
| `borderTopRightRadius` | Arrondi haut droit | `border-top-right-radius` | arrondi délié | longueur px % rem | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur |
| `borderBottomRightRadius` | Arrondi bas droit | `border-bottom-right-radius` | arrondi délié | longueur px % rem | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur, page-builder-modele |
| `borderBottomLeftRadius` | Arrondi bas gauche | `border-bottom-left-radius` | arrondi délié | longueur px % rem | écrans + survol / focus / clic | **non piloté par la matrice** ; contrat serveur ; tests préexistants : editeur-canvas-proprietes-restantes-navigateur |
| `outlineWidth` | Contour : épaisseur | `outline-width` | nombre | longueur px ; pas de % | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |
| `outlineStyle` | Contour : style | `outline-style` | liste | `none` `solid` `dashed` `dotted` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `outlineColor` | Contour : couleur | `outline-color` | couleur | `#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>` | écrans + survol / focus / clic | matrice navigateur : grid (couleur) ; contrat serveur |
| `outlineOffset` | Contour : décalage | `outline-offset` | nombre | longueur px rem ; négatif | écrans + survol / focus / clic | matrice navigateur : grid (nombre) ; contrat serveur |

## Effets (12)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `boxShadow` | Ombre | `box-shadow` | liste | `none` `sm` `md` `lg` `xl` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), head (liste), button (liste), image (liste), grid (liste) ; contrat serveur |
| `opacity` | Opacité | `opacity` | nombre | nombre 0 … 1 | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), image (nombre), grid (nombre) ; contrat serveur |
| `overflow` | Débordement | `overflow` | icônes | `visible` `hidden` `auto` | écrans + survol / focus / clic | matrice navigateur : button (icônes), grid (icônes) ; contrat serveur |
| `backdropBlur` | Flou de l'arrière-plan (px) | `backdrop-filter` | nombre | nombre 1 … 40, entier | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `visibility` | Visibilité (garde sa place) | `visibility` | liste | `visible` `hidden` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `cursor` | Curseur de la souris | `cursor` | liste | `auto` `default` `pointer` `text` `move` `grab` `not-allowed` `help` `zoom-in` `zoom-out` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), head (liste), button (liste), image (liste), grid (liste) ; contrat serveur |
| `pointerEvents` | Réaction à la souris | `pointer-events` | liste | `auto` `none` | écrans + survol / focus / clic | matrice navigateur : button (liste), grid (liste) ; contrat serveur |
| `mixBlendMode` | Fusion avec l'arrière-plan | `mix-blend-mode` | liste | `normal` `multiply` `screen` `overlay` `darken` `lighten` `color-dodge` `color-burn` `soft-light` `hard-light` `difference` `exclusion` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `overflowX` | Débordement horizontal | `overflow-x` | liste | `visible` `hidden` `auto` `scroll` `clip` | écrans + survol / focus / clic | matrice navigateur : button (liste), grid (liste) ; contrat serveur |
| `overflowY` | Débordement vertical | `overflow-y` | liste | `visible` `hidden` `auto` `scroll` `clip` | écrans + survol / focus / clic | matrice navigateur : button (liste), grid (liste) ; contrat serveur |
| `transitionDuration` | Durée des transitions (ms) | `transition` | nombre | nombre 0 … 2000, entier | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), image (nombre), grid (nombre) ; contrat serveur |
| `transitionEasing` | Accélération des transitions | `transition-timing-function` | liste | `ease` `linear` `ease-in` `ease-out` `ease-in-out` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |

## Position (8)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `position` | Position | `position` | liste | `static` `relative` `sticky` `absolute` `fixed` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `top` | Décalage haut | `top` | nombre | longueur px % rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `right` | Décalage droite | `right` | nombre | longueur px % rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `bottom` | Décalage bas | `bottom` | nombre | longueur px % rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `left` | Décalage gauche | `left` | nombre | longueur px % rem ; négatif | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |
| `transformOrigin` | Origine des transformations | `transform-origin` | liste | `center` `top` `bottom` `left` `right` `top left` `top right` `bottom left` `bottom right` | écrans + survol / focus / clic | matrice navigateur : flexChild (liste), grid (liste) ; contrat serveur |
| `zIndex` | Plan (z-index) | `z-index` | nombre | nombre -100 … 9999, entier | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), head (nombre), button (nombre), image (nombre), grid (nombre) ; contrat serveur |
| `scrollMarginTop` | Décalage d'ancre (lien #…) | `scroll-margin-top` | nombre | longueur px rem em | écrans + survol / focus / clic | matrice navigateur : flexChild (nombre), grid (nombre) ; contrat serveur |

## Image (3)

| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |
|---|---|---|---|---|---|---|
| `objectFit` | Cadrage | `object-fit` | liste | `cover` `contain` `fill` `none` | écrans + survol / focus / clic | matrice navigateur : image (liste) ; contrat serveur |
| `objectPosition` | Point focal | `object-position` | liste | `center` `top` `bottom` `left` `right` `top left` `top right` `bottom left` `bottom right` | écrans + survol / focus / clic | matrice navigateur : image (liste) ; contrat serveur |
| `aspectRatio` | Proportions | `aspect-ratio` | liste | `auto` `1/1` `4/3` `3/2` `16/9` `21/9` `3/4` | écrans + survol / focus / clic | matrice navigateur : image (liste) ; contrat serveur |

## Propriétés composées

| Propriété | Contenu | Contrôle |
|---|---|---|
| `backgroundImage` | `{ src, size }` image de la médiathèque ou https | type de fond « Image » + résolution |
| `gradient` | `{ from, to, angle, type, fromAt, toAt, extra[≤3] }` | type de fond « Dégradé » |
| `overlay` | `{ color }` voile | type de fond |
| `shadow` | `{ x, y, blur, spread, color, inset }` | Effets › Ombre personnalisée (4 champs numériques + couleur) |
| `filter` | flou, luminosité, contraste, noir et blanc, saturation, sépia, teinte | Effets › Filtres (curseur + nombre) |
| `backdrop` | mêmes filtres sur l'arrière-plan | Effets › Verre dépoli |
| `transform` | `{ x, y, rotate, scale, skewX, skewY }` | Avancé › Transformer |
| `mask` | `{ shape, src, size, position, repeat }` | Effets › Masque |
