# Palier 13 — Limites et problèmes restants

## Non résolus (documentés, pas élargis)
- **Barre du haut à 1024×640 : 3 lignes, 156 px (24 % de la hauteur).** Fait observé ; correction = refonte responsive → Palier 14.
- Panneaux IA et Qualité : ils ne se ferment pas au clic extérieur. Choix de conception conservé (ils suivent l'édition).

## Non testés dans ce palier
Firefox, Safari, lecteur d'écran, clavier tactile, glisser-déposer, mode sombre au-delà de la mesure de basculement (CLS 0, cadre non reconstruit), navigation entre plusieurs pages, reprise d'un travail après fermeture (couverts seulement par les suites existantes), deux onglets réels. Aucun audit d'accessibilité complet n'a été fait (Palier 15).

## Hypothèses (non démontrées)
- Les défauts U1–U4 sont reproduits dans Chrome ; leur comportement dans Safari (où un bouton cliqué ne reçoit pas toujours le focus) n'est pas vérifié : la mémorisation `document.activeElement` pourrait y mémoriser `<body>`, auquel cas le focus ne serait simplement pas rendu (comportement identique à avant).

## Statut des tests de régression
Voir `docs/KOLAKISA_PALIER13_TEST_REPORT.md`.
