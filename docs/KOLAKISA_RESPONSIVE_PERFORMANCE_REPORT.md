# Performance — mesures

*Chrome piloté, éditeur réel, vrai serveur, machine de 2015 (60 Hz). Une exécution par page de test (bruit probable ±30 %). Pas de code de production modifié : il n'y a donc **pas de comparaison avant / après** ; ce sont des mesures de référence.*

| Page | Changement d'appareil : largeur du canevas atteinte (ms, méd. / max sur 6) | Requêtes pour 6 changements d'appareil | Réglage posé sur mobile : latence canevas (ms, méd.) |
|---|---|---|---|
| 25 éléments | 5,7 / 18 | 6 rendus, **0 enregistrement** | 89 |
| 100 éléments | 6,8 / 20 | 6 rendus, **0 enregistrement** | 89 |
| 380 éléments à plat | 12 / 25 | 6 rendus, **0 enregistrement** | 84 |
| 380 éléments, 7 niveaux | 10 / 25 | 6 rendus, **0 enregistrement** | 90 |

* **Comparable à la mission 3** (mêmes conditions : alignement du texte, clic → style calculé du canevas) : 84 – 100 ms alors, 84 – 90 ms ici, sur l'appareil mobile : l'aperçu immédiat fonctionne de la même façon hors ordinateur.
* Changer d'appareil n'enregistre rien ; il déclenche un rendu serveur par changement (largeur du canevas immédiate, contenu confirmé ensuite).
* Non mesuré : redimensionnement continu de la fenêtre côté éditeur, pages > 400 éléments, tactile, autres navigateurs.
