# Performance — mesures avant / après

*Chrome piloté, éditeur réel, vrai serveur, machine de 2015 (60 Hz). Une page de test par ligne ; 6 changements successifs d'« alignement du texte » sur le premier élément (espacés de 700 ms) ; latence = du clic au moment où le style calculé de l'élément **dans le canevas** a la nouvelle valeur. « Avant » = `956670b`, « après » = cette branche. Une exécution de chaque (bruit probable ±30 %).*

| Page | Rendu serveur complet (ms, médiane de 5) | Latence canevas avant (ms, méd.) | Latence canevas après (ms, méd.) | Rendus / enregistrements pour 6 changements (après) |
|---|---|---|---|---|
| 25 éléments, à plat | 10 | 148 | 84 | 6 / 1 |
| 100 éléments, à plat | 12 | 136 | 84 | 6 / 1 |
| 100 éléments, 8 niveaux | 17 | 130 | 90 | 6 / 1 |
| 380 éléments, à plat | 33 | 198 | 92 | 6 / 1 |
| 380 éléments, 7 niveaux | 56 | 268 | 100 | 6 / 1 |

## Lecture
* **Gain mesuré sur les listes de mise en page** (la seule modification) : 84 – 100 ms au lieu de 130 – 268 ms. La latence « après » n'est presque plus liée à la taille de la page (l'aperçu ne dépend pas du serveur) ; le plancher d'environ 85 ms comprend le déplacement du clic par l'outil de test.
* **Le rendu serveur suit toujours** (un par changement, un seul enregistrement) : le coût serveur croît avec la page (10 → 56 ms) mais ne bloque plus l'affichage de ces choix.
* **Points de comparaison de la mission 2** (non refaits) : un geste continu (curseur, nuancier, flèches) = 1 enregistrement et 1 à 4 rendus ; choix de liste ≈ 80 – 110 ms sur une page de 40 éléments : cohérent avec les 84 ms ci-dessus.
* **Non mesuré** : redimensionnement par glisser, déplacement d'éléments, fuite mémoire, appareils tactiles, autres navigateurs.
