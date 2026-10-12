# Performance — mesures

*Mesure unique, machine de 2015, Node 24, 200 exécutions après 20 de chauffe.*

| Mesure | Avant (`2605494`) | Après |
|---|---|---|
| `pageCss` sur 380 éléments qui portent chacun 4 couleurs du site (+1 sur mobile) : médiane / p95 | 2,87 / 5,58 ms | 3,42 / 6,87 ms |

* Le repli de couleur ajoute **≈ 0,5 ms** au calcul du CSS d'une page de 380 éléments à jetons (la valeur d'origine est lue dans un module déjà chargé). Négligeable devant le rendu serveur (33 – 56 ms, mission 3) ; la taille du CSS augmente de ≈ 10 octets par référence de couleur.
* La garde de suppression des couleurs ne s'exécute que lors de l'enregistrement du design d'un site, uniquement quand une couleur personnalisée est retirée : aucun effet sur l'édition d'une page.
* **Non mesuré** : délai d'affichage dans le canevas après modification d'un jeton (modification dans les réglages du site, rendu serveur, sans aperçu local) ; effet sur de très grands sites ; Safari / Firefox. Aucune affirmation de gain n'est faite.
