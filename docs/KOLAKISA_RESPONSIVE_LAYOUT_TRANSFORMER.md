# Transformateur responsive

Calcule tablette (≤ 1023 px) et mobile (≤ 767 px) à partir de l'ordinateur ; réglages posés par le constructeur conservés.
Règles : grille ≥ 3 colonnes → 2 puis 1 ; grille à 2 colonnes (texte/image) → empilée dès la tablette ; chiffres clés → 2 colonnes conservées sur mobile ; mosaïque → 2 colonnes ; placements de grille de 12 colonnes → pleine largeur ; carte superposée → sous l'image ; titres > 40 px → ×0,8 puis ×0,58 (≥ 28 px) ; rythme vertical d'un cran en moins sur mobile ; écarts d'un cran en moins ; hero plein écran → 70 vh puis 60 vh ; marges négatives neutralisées ; texte en colonnes → 1 colonne.
Vérifié : réglages présents dans le modèle ET requêtes `@media (max-width: 1023px / 767px)` dans le CSS réel (`pageCss`). Non vérifié : rendu sur appareils réels.
