# Éditeur de pages — rapport d'optimisation (6 novembre 2026)

## A. Causes racines
Aucune cause racine d'une lenteur globale n'a été trouvée sur les scénarios mesurés (voir `PAGE_EDITOR_PERFORMANCE_AUDIT.md`). Les seuls points chauds mesurés sont modestes : mise en page du canevas répétée 4 fois à l'ouverture (≈ 80 ms), géométrie de sélection (30–80 ms à l'ouverture), barre contextuelle (≈ 7 ms par sélection), rendu serveur à 300 éléments (135–380 ms).

## B. Corrections effectuées
**Aucune modification du code de l'éditeur n'est conservée.** Un essai sur la barre contextuelle n'a donné aucun gain mesurable et a été retiré.

## C. Optimisations réalisées
Aucune sur le produit. Ajoutés : outils de mesure reproductibles.
- `scripts/perf/bench-page-builder.js` : option `--mix=riche` (accordéons, onglets, compteurs, titres animés, progressions).
- `scripts/perf/mesure-ouverture-editeur.js` : ouverture de l'éditeur (temps prêt, tâches longues, ressources, temps de calcul par fichier et par fonction).

## D. Mesures avant / après
Pas d'« après » : le produit n'a pas changé. Mesures de référence dans `PAGE_EDITOR_PERFORMANCE_RESULTS.md`.

## E. Tests
Les scripts de mesure sont vérifiés syntaxiquement par `tests/performance-editeur-banc.test.js`. Suites de l'éditeur : voir le résumé final.

## F. Problèmes restants
- Votre sensation de lourdeur **n'est pas reproduite** par ces scénarios. Elle peut venir de pages réelles beaucoup plus chargées, du navigateur ou de la machine, de l'éditeur du Theme Builder ou d'un panneau précis : pour la localiser il faut me dire quelle action est lente (ouverture, sélection, un panneau, la frappe) ou fournir une page réelle.
- Machine de mesure chargée par d'autres programmes (bruit ±30 %), un seul navigateur (Chrome 150), pas de mesure tactile, pas de test de plusieurs heures, pas de mesure sur la version déployée (le déploiement suit le push ; l'adresse de production n'a pas été mesurée).
- Les 4 appels de `applyZoom` à l'ouverture et le rendu serveur à 300 éléments restent des pistes à traiter.
