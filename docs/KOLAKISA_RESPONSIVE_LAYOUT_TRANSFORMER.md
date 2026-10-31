# Transformateur responsive

Calcule tablette (≤ 1023 px) et mobile (≤ 767 px) à partir de l'ordinateur ; réglages posés par le constructeur conservés.
Règles : grille ≥ 3 colonnes → 2 puis 1 ; grille à 2 colonnes (texte/image) → empilée dès la tablette ; chiffres clés → 2 colonnes conservées sur mobile ; mosaïque → 2 colonnes ; placements de grille de 12 colonnes → pleine largeur ; carte superposée → sous l'image ; titres > 40 px → ×0,8 puis ×0,58 (≥ 28 px) ; rythme vertical d'un cran en moins sur mobile ; écarts d'un cran en moins ; hero plein écran → 70 vh puis 60 vh ; marges négatives neutralisées ; texte en colonnes → 1 colonne.
Vérifié : réglages présents dans le modèle ET requêtes `@media (max-width: 1023px / 767px)` dans le CSS réel (`pageCss`). Non vérifié : rendu sur appareils réels.

## Complément 22.8
Le transformateur (22.3) calcule tablette et mobile à la GÉNÉRATION ; l'assistant 22.8 (`src/responsive/apply.js`) corrige des sections EXISTANTES, y compris écrites à la main, avec les mêmes principes : ordre du DOM conservé, ordinateur jamais modifié, valeurs d'écran existantes jamais écrasées. Règles ajoutées : largeur fixe > 380 px → 100 %, ≥ 3 colonnes → 1 (mobile) / 4+ → 2 (tablette), ligne flex de 3+ éléments → retour à la ligne, titre > 40 px → taille fluide, texte < 14 px → 16 px, marge négative → 0, hauteur > 70vh → 60vh, espacement > 72 px → 40 px.
Pas de réorganisation (ordre, `order`) ni de masquage automatique : le sens et l'ordre de lecture sont préservés.
