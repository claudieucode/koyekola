# Analyse des lacunes

| P | Lacune | Impact | Décision |
|---|---|---|---|
| P1 | Unité perdue au redimensionnement | Éléments fluides rendus fixes | **Corrigé** (D1) |
| P1 | Taille inatteignable enregistrée (borne max.) | Valeur morte, inspecteur trompeur | **Corrigé** (D2) |
| P2 | Pas de poignées de redimensionnement sur les 4 côtés / 4 coins (seulement e, s, se) | Parité Elementor : redimensionnement par tous les côtés | Écart connu ; demande de revoir `drawOverlays` et le calcul de position (gauche / haut) |
| P2 | Redimensionner un élément en `auto` écrit des px sans proposer de revenir à `auto` | Mineur (↺ dans l'inspecteur) | Non traité |
| P2 | Pas de glisser du canevas vers un autre parent testé en navigateur dans cette mission | — | Couverte par tests préexistants (`editeur-canvas-moteur`) |
| P3 | Sélection multiple, menus contextuels, raccourcis : non audités ici | — | À traiter si prioritaire |
| — | Suite complète non validée ; test numérique intermittent (cause inconnue) | Fiabilité | Voir rapport de tests |
