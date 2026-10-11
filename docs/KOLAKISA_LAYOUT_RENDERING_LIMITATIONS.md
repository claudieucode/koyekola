# Limites

## Restrictions volontaires
* Grammaire de longueurs fermée (`calc`, `clamp`, `min`, `max`, `minmax`, `ch`, `vmin`, `vmax` refusés) : sécurité ; aucune analyse nouvelle n'a été faite dans cette mission, la restriction est donc conservée.
* Editeur : conteneur vide = zone d'édition ; interactifs (onglets, carrousels) rendus comme conteneurs ordinaires.

## Limitations techniques constatées
* **Éléments masqués** : visibles en transparence et présents dans la mise en page de l'éditeur (+35 px mesurés dans une colonne). La page publiée ne les contient pas.
* **Aperçu immédiat** : nombres, couleurs et 24 listes seulement ; autres réglages = aller-retour serveur (≈ 90 – 270 ms).
* **Parité mesurée sur un jeu d'essai** (14 éléments, 3 écrans, Chrome 60 Hz). Elle est démontrée pour ce jeu et pour les 109 propriétés prises isolément, pas pour toutes les combinaisons possibles.
* **Chrome seulement** ; Safari et Firefox non testés ; machine de 2015.
* **Mesures de performance** : une machine, 6 changements par page, bruit de ±30 %.
* **Test intermittent** (`controles-numeriques-navigateur`, signalé par la mission 2) : non reproduit en 5 exécutions ; cause non établie.

## À développer
* `grid-template-areas`, sous-grilles, requêtes de conteneur, `aspect-ratio` libre.
* Aperçu immédiat des autres familles de réglages.
* Responsive avancé (mission 4).
