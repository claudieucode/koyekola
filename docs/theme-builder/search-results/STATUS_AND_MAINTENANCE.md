# Résultats de recherche : état et maintenance (10 novembre 2026)

## Ce qui a été refait
* 100 modèles (20 univers × 5 structures), chacun avec sa propre identité en valeurs fixes. Aucun jeton du site.
* Structures choisies par un algorithme de distance : aucune paire à plus de 0,70 de similarité.
* Moteur réel : recherche tolérante (accents, plusieurs mots), tri (`?tri=`), filtres par catégorie, pagination, état vide qui rappelle le terme.
* Aperçu de la bibliothèque : résultats de démonstration signalés « Exemple — » (jamais sur le site public). `?q=mot` change le terme, `?etat=vide` montre l'état vide.
* Nouveaux widgets : `searchsort` (tri) et `searchcount` (compteur).

## Où se trouve le code
`src/themeBuilder/catalog/search_results/v3/` (grammar, universes, specs, directions, catalog). Données de démonstration : `src/marketing/pages/demoResults.js`.

## Contrôles
`node scripts/audit-page-individuelle.js` et `…-isolement.js` avec `TYPE=search_results` ; tests : `theme-builder-recherche-bibliotheque`, `theme-builder-recherche-navigateur` (Chrome, 3 largeurs, alignement des boutons), `recherche-moteur-et-apercu`.

## Limites connues
La recherche historique `/recherche` reste inchangée. Le test `not_found/page-blanche` (vignette) échouait déjà avant ce travail.
