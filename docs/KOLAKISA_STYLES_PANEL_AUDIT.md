# Apparence → Styles : audit du panneau (correctif d'alignement)

Constat initial : capture `screencapture-kolakisa-marketing-site-web-styles-2026-10-28-15_52_24.png` (fournie par l'utilisateur, non reproduite dans le dépôt).

## Composants
- Écran : `views/marketing/styles.ejs` ; rendu des contrôles : `public/js/cms-styles.js` (`field()`, `renderPalette()`, contrastes) ; styles : `public/css/cms.css` (`.mk-st-*`).
- Feuille en conflit : `public/css/kola-compose.css` (chargée après `cms.css`), règles `.mk-body .mk-st-field`.

## Cause racine (prouvée)
`kola-compose.css` l.204 donne à **tout** `.mk-st-field` une grille `minmax(200px,300px) minmax(0,1fr)` avec `column-gap: 48px` et `padding: 22px 0`, conçue pour de larges formulaires de réglages. Le panneau Styles n'a que ~390 px utiles : après libellé (200 px min) et écart (48 px), la colonne des contrôles est écrasée à ~140 px. Les contrôles (`.mk-st-colorrow` : pastille, sélecteur de couleur, champ hexadécimal, bouton ↺) ne tiennent plus et **débordent à droite du panneau** ; le champ hexadécimal est comprimé en un carré vide (le « troisième carré »). De plus `.mk-st-colorrow` est un `div` : la règle `> :is(input, select, textarea)` ne le plaçait pas, d'où un placement automatique incohérent. Les rangées avec aide (« Vide : couleur d'origine… ») ajoutaient du vide (padding 22 px + ligne de grille réservée).

Signification des trois éléments d'une rangée (lue dans le code, rien supprimé) : 1) pastille d'aperçu de la valeur effective, 2) sélecteur de couleur natif, 3) champ hexadécimal (+ bouton ↺ « revenir à la version en ligne », visible seulement si la valeur diffère).

Non en cause : positions absolues, marges négatives, transformations, z-index, données, clés de rendu (vérifiés : aucun). Contrastes WCAG : calcul inchangé et non modifié.

## Autres constats
- Grille de palettes (`repeat(auto-fill, minmax(120px,1fr))`) correcte ; durcie (`min-width: 0`, noms longs).
- Placeholder « (valeur d'origine) » tronqué dans le champ hexadécimal des liens → « Origine ».
