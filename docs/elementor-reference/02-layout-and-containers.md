# 02 — Structure, conteneurs et mise en page

_Vérifié le 2026-10-10._

## Réglages de l'onglet Mise en page d'un conteneur — confirmé
Source : https://elementor.com/help/container-layout-tab-settings/ (article lu).
| Réglage | Options / unités | Remarque |
|---|---|---|
| Largeur du contenu | Encadré (défaut) / Pleine largeur | « Encadré » : la largeur règle le contenu intérieur ; « Pleine » : le conteneur lui-même |
| Largeur | px, %, vw | |
| Hauteur minimale | px, vh | 100 vh = hauteur de la fenêtre |
| Direction | Ligne, Colonne, Ligne inversée, Colonne inversée | |
| Justification | Début, Centre, Fin, Espace entre, Espace autour, Espace égal | |
| Alignement des éléments | Début, Centre, Fin, Étirer | « Étirer » ne s'applique qu'aux éléments sans largeur définie |
| Écart (gap) | px, %, vw | Défaut 20 px, modifiable dans Réglages du site → Mise en page |
| Retour à la ligne (wrap) | oui/non | |
| Alignement du contenu | Centre, Début, Fin, Espace entre/autour/égal | N'apparaît que si le retour à la ligne est actif |
| Débordement | Défaut, Caché, Auto | |
| Balise HTML | liste ; « a » rend le conteneur cliquable | |
Réglable par écran : largeur du contenu, hauteur minimale, écart (confirmé par l'article). Le statut Pro de ces réglages **n'est pas indiqué** par l'article.

## Éléments V4 « atomiques » (Mise en page / Style) — confirmé
Source : https://elementor.com/help/style-tab-layout/ (article lu, section Mise en page seulement). Types d'affichage : Block, Flex, Inline-block, None (masque l'élément à la taille d'écran choisie). Options Flex : direction, justification (Début/Centre/Fin/Espace entre/autour/égal), alignement (Début/Centre/Fin/Étirer), écarts, retour à la ligne (Pas de retour / Retour / Retour inversé). Largeur, hauteur mini, débordement : **non lus**.

## Conseils officiels notables — confirmé (résultats de recherche)
- Une marge gauche/droite sur un conteneur de premier niveau peut créer une barre de défilement horizontale (100 % + marge) : mettre la marge sur un conteneur enfant.
- « Espace entre » peut échouer dans certains cas : ajouter un écart explicite.

## Grille (Grid)
**Non vérifié** : aucune page lue ne documente la grille d'Elementor ; la recherche « container grid » n'a remonté aucun article. À ne pas supposer.

## Non vérifié
Dimensions max, positionnement (Avancé → Position : voir 07), ordre d'affichage, conteneurs imbriqués (comportement de sélection), « Inner Section » (marqué *legacy* dans la liste des widgets).
