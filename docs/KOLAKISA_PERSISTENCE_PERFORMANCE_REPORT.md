# Performance de la persistance

*Machine de 2015, Node 24, serveur et client sur la même machine, page de test = un conteneur contenant N conteneurs (largeur, fond, couleur du site, valeur de tablette) avec un texte. Médianes sur 5 enregistrements et 4 publications. Aucune comparaison avant / après : le correctif ne s'exécute qu'à la fin d'un enregistrement (une comparaison de chaînes à la publication).*

| Page | Brouillon | Enregistrement serveur (ms) | Publication (ms) | Copie locale (`stringify` + `setItem`, ms) |
|---|---|---|---|---|
| 25 éléments | 6 Ko | 10 | 6 | 0 |
| 100 éléments | 25 Ko | 11 | 9 | 0,1 |
| 380 éléments | 47 Ko | 23 | 14 | 0,3 |

* Le coût de la copie locale (écrite à chaque modification) reste négligeable même à 380 éléments.
* Un geste continu n'enregistre qu'une fois (mission 6) ; le minuteur d'1 s regroupe les modifications rapprochées.
* **Non mesuré** : réseau lent réel, documents proches de la limite de taille, nombreux enregistrements simultanés de plusieurs utilisateurs.
