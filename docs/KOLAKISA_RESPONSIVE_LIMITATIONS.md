# Limites

## Volontaires
* `calc()` / `clamp()` toujours refusés (sécurité) : pas de typographie fluide par formule ; chaque appareil a ses valeurs fixes.
* Largeur « ordinateur » du canevas = `tablette + 1` px, tablette 820, mobile 390 : pas de largeur d'appareil libre dans l'éditeur.
* Éléments masqués visibles dans le flux du canevas (décision mission 3, non modifiée).

## Techniques
* **« Afficher sur » : Ordinateur couvre le grand écran** (compatibilité) alors que l'interface propose 4 cases indépendantes.
* Quatre appareils seulement, états de style communs à tous.
* Aperçu immédiat limité à nombres, couleurs, 24 listes.
* Tests faits sur Chrome, machine de 2015 (60 Hz) ; la page d'essai (titres, texte, image, grille) ne couvre pas tous les widgets : menus, carrousels, formulaires non audités en responsive.
* Test numérique intermittent signalé en mission 2 : non reproduit, cause inconnue.

## Reste à traiter
Points de rupture supplémentaires, états par appareil, comportement mobile des widgets complexes, Safari / Firefox, tactile (mission 5 et suivantes).
