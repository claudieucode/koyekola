# Palier 0 — état de l'éditeur de pages prouvé par exécution (10 novembre 2026)

Exécution, dans un vrai Chrome, de 18 fichiers de tests existants de l'éditeur (canvas, dimensions, conteneurs, fond pleine largeur, moteur, propriétés effectives et restantes, rendu sans rechargement, contrôles complets, panneau de droite, fluidité, manipulation directe, bascule de mode, palette de commandes, raccourcis, verrou, aperçu). Fichiers lancés un par un (la machine ne tient pas plusieurs serveurs de test en parallèle).

## Résultats
- Premier passage : 133 tests, 127 réussis, 6 échecs (un dans chacun de 6 fichiers).
- Relance fichier par fichier : 4 des 6 échecs ne se reproduisent pas (aperçu, fond pleine largeur, manipulation directe, boîte des raccourcis) ; un cinquième (survol des contrôles complets) réussit à 2 relances sur 2 et passe sur `main` avant la fusion de la fiche produit. Ces 5 échecs viennent de la charge de la machine, pas du code.
- 1 échec reproductible : « réglage composé filtre » (`editeur-canvas-proprietes-restantes`). Cause : le test était en retard sur le commit `c5192766` (un filtre posé sur un conteneur n'agit plus que sur son fond, via `::before`). Le comportement est voulu ; le test lit maintenant le pseudo-élément. Résultat : 4 réussis sur 4.

## Ce que cela prouve (et ne prouve pas)
Prouvé par exécution : canvas stable lors des modifications sans rechargement (`sans-rechargement`, `fluidite`), dimensions, conteneurs, propriétés effectives, bascule d'appareil, palette Ctrl+K, raccourcis, verrou, manipulation directe, panneau de droite.
Non prouvé : aucun test n'a mesuré le « tremblement » visuel au pixel près ; les écrans supplémentaires, la grille avancée et le comportement des 162 widgets un par un n'ont pas été exécutés ici.
