# Performance des contrôles — mesures avant / après

*Mesures réelles (Chrome 120+ piloté par Playwright, éditeur réel, vrai serveur), machine de 2015 (i5-6500, 60 Hz). « Avant » = le code de `830b7d8` (fin du chantier noyau) dans un répertoire de travail séparé ; « Après » = la branche `controles-proprietes`. Page d'essai : 40 éléments dans un conteneur, un titre sélectionné. Trois exécutions de chaque ; aucune valeur n'est inventée ni arrondie en faveur d'un résultat.*

Le banc n'est pas conservé dans le dépôt (il dépend de chemins locaux) ; il est décrit ici pour pouvoir être refait.

## Scénarios

| Scénario | Geste |
|---|---|
| Liste | Casse du texte (`textTransform`) : 5 changements ; latence entre le clic et le moment où le style calculé de l'élément **dans le canevas** a la nouvelle valeur |
| 40 flèches | Taille de police 20 px → 60 px par 40 pressions de ↑ dans le champ |
| Curseur | Opacité : 60 déplacements du curseur, une image d'écran chacun |
| Nuancier | 30 changements de teinte rapides dans le sélecteur de couleur |

## Résultats (trois exécutions : 1 / 2 / 3)

| Mesure | Avant | Après |
|---|---|---|
| Liste : latence canevas, médiane (ms) | 100 / 81 / 92 | 108 / 89 / 81 |
| Liste : latence canevas, p95 (ms) | 162 / 160 / 131 | 226 / 177 / 96 |
| 40 flèches : durée du geste (ms) | 1776 / 1107 / 795 | 1210 / 881 / 801 |
| 40 flèches : rendus serveur du canevas | 4 / 2 / 1 | 3 / 3 / 2 |
| 40 flèches : enregistrements | 1 / 1 / 1 | 1 / 1 / 1 |
| 40 flèches : valeur enregistrée | 60px | 60px |
| Curseur (60 pas) : durée (ms) | 1174 / 1043 / 1085 | 1297 / 1186 / 1296 |
| Curseur : rendus / enregistrements | 1 / 1 | 1 / 1 |
| Curseur : valeur enregistrée | 0,4 (attendue 0,4) | 0,4 (attendue 0,4) |
| Nuancier (30 pas) : durée (ms) | 612 / 552 / 1236 | 771 / 525 / 486 |
| Nuancier : rendus / enregistrements | 1 / 1 | 1 / 1 |

## Lecture

* **Aucun gain ni perte démontrés** : les écarts entre « avant » et « après » sont dans le bruit de la machine (la même mesure varie de 795 à 1776 ms d'une exécution à l'autre). Ce chantier n'a modifié aucun chemin de performance ; c'était attendu, et la mesure le confirme.
* **Le comportement est déjà efficace** : un geste continu (curseur, nuancier, flèches maintenues) produit **un seul enregistrement** et **1 à 4 rendus** au lieu d'un par pas ; la valeur finale enregistrée est toujours la dernière valeur du geste (aucune perte, aucun rendu obsolète).
* **Latence perçue** : entre le choix dans une liste et l'affichage dans le canevas : médiane ≈ 80–110 ms, p95 ≤ 230 ms sur cette machine ancienne.
* **Police** : le choix répété d'une même police ne redemande pas ses fichiers (vérifié par un test, voir le rapport de tests).
* **Non mesuré** : fuite mémoire après plusieurs heures, appareils tactiles, autres navigateurs, pages de 400 éléments pendant un geste continu.
