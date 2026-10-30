# Visual Balance Analyzer

Règles mesurées sur la structure normalisée (aucune IA) : `column-ratio` (> 4:1, hors colonne-repère), `narrow-column` (< 20 % de largeur avec > 220 caractères), `empty-cells` (cases vides de la dernière ligne), `card-density` (rapport > 5:1), `image-dominance` (> 70 %), `heading-oversize` (≥ 56 px pour > 60 caractères), `mixed-alignment`, `contrast` (fond foncé sans couleur de texte : erreur), `nesting`, `overloaded` (> 2 200 caractères), `complexity` (> 90 nœuds), `empty-space`.
Score = 100 − pénalités (erreur 25, avertissement 10, info 3). Chaque constat porte une correction ciblée (`fix`) : le moteur la rejoue **une fois** et ne la garde que si le score progresse.
Limite : l'analyse porte sur la structure et les longueurs de texte, pas sur des rendus mesurés en pixels ; le seul rendu navigateur vérifié est celui de l'écran de sélection (aperçu filaire).
