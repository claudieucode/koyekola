# Performance des gestes — mesures avant / après

*Chrome piloté, éditeur réel, vrai serveur, machine de 2015 (60 Hz). « Avant » = `58a75a1`, « après » = cette branche (seule `resizeStart.up` a changé). Une exécution par ligne, bruit probable ±30 %. Pages : un conteneur en colonne contenant N conteneurs de 60 % de large avec un texte.*

| Page | Sélection (clic → contour + inspecteur) méd. / max, 40 clics | Écouteurs d'événements après 40 sélections | Redimensionnement : 40 mouvements |
|---|---|---|---|
| 40 éléments — avant | 17 / 56 ms | 1 741 → 1 836 | 160 images, **0 > 50 ms**, max 21 ms ; 0 requête pendant le geste, **1 rendu + 1 enregistrement** à la fin |
| 40 éléments — après | 16 / 35 ms | 1 741 → 1 836 | 165 images, 0 > 50 ms, max 23 ms ; 1 rendu + 1 enregistrement |
| 380 éléments — avant | 20 / 203 ms | 5 191 → 5 286 | 169 images, 0 > 50 ms, max 27 ms ; 1 rendu + 1 enregistrement |
| 380 éléments — après | 22 / 72 ms | 5 191 → 5 286 | 160 images, 0 > 50 ms, max 27 ms ; 1 rendu + 1 enregistrement |

* **Aucune dégradation** : le correctif ne s'exécute qu'à la fin du geste ; les écarts sont dans le bruit (le « max » de la sélection sur 380 éléments, 203 → 72 ms, est une valeur isolée, pas un gain démontré).
* **Fuite d'écouteurs écartée** : 120 sélections supplémentaires laissent le compteur constant (1 836 sur 40 éléments ; 5 286 sur 380) après la première série (+95 une fois). Les compteurs sont lus après un ramasse-miettes forcé.
* **Geste continu** : rien n'est enregistré ni rendu côté serveur pendant le déplacement ; une étape d'annulation à la fin (comparable aux résultats des missions 2–4 : un geste = un enregistrement).
* **Non mesuré** : glisser-déposer des calques sur de grandes pages, déplacement depuis le canevas, redimensionnement en Grille, tactile, autres navigateurs.
