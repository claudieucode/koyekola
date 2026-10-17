# Limites

## Volontaires
* Un geste n'écrit qu'une valeur par dimension et uniquement pour l'appareil affiché.
* Une borne min. / max. déclarée n'est pas contournée par la poignée (modifier la borne dans « Dimensions »).
* Les clics du canevas ne déclenchent jamais les actions du visiteur.

## Techniques
* Trois poignées seulement (largeur, hauteur, les deux) ; pas de redimensionnement par le haut ou la gauche.
* L'unité conservée est celle de la valeur propre ou héritée de l'appareil affiché ; un mot-clé (`auto`, `fit-content`) devient des pixels.
* Si le canevas est zoomé, le déplacement de la souris n'est pas en pixels de page (l'élément suit le curseur).
* Mesures : une machine de 2015, Chrome seulement, 60 Hz.

## À traiter / non testé
Sélection multiple, menus contextuels complets, raccourcis, tactile, déplacement depuis le canevas vers un autre parent (tests préexistants uniquement), redimensionnement en Grille.
