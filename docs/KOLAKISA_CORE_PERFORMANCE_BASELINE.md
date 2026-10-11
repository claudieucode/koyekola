# Performance du noyau — état de référence (avant correction)

Banc : `docs/performance/bench` de la mission précédente, rejoué sur cette branche (Chrome 60 Hz, machine de développement i5-6500 de 2015, serveur de test local). Pages de 25 et 100 éléments. Mesures réelles, médianes sauf mention.

| Scénario | 25 éléments | 100 éléments |
|---|---|---|
| Ouverture de l'éditeur (DCL) | 1 059 ms (premier lancement à froid) | 522 ms |
| Sélection d'un élément, partie synchrone (méd. / p95) | 8,5 / 30,8 ms | 8,9 / 47,6 ms |
| Sélection → image affichée (méd. / p95) | 49 / 75 ms | 37 / 231 ms |
| Modification de style → canevas | 19–35 ms | 23–35 ms |
| Rafale de 40 frappes | 1 rendu, 1 enregistrement (663 ms Playwright) | 1 rendu, 1 enregistrement (816 ms) |
| Annuler / rétablir (synchrone / image) | 34–58 / 52–125 ms | 33–58 / 64–93 ms |
| Ouvrir un onglet de l'inspecteur (Style) | 29 ms | 20 ms |
| Zoom | ≈ 1 ms + image 34 ms | idem |
| Sérialisation du document | 0,015 ms pour 2,7 Ko | 0,02 ms pour 11 Ko |
| Enregistrement `PUT /brouillon` | 23–78 ms | 62–263 ms |
| Erreurs de script | 0 | 0 |

## Lecture
Rien ne dépasse un seuil de gêne perceptible hors cas isolés (sélection p95 231 ms à 100 éléments, une valeur sur douze, non reproduite systématiquement). **Aucune optimisation n'a donc été faite sans preuve** : la mission a porté sur la fiabilité. Les corrections ajoutent un calcul par ajout/duplication (comptage des éléments : parcours de l'arbre, O(n), < 1 ms à 400 éléments) et une enveloppe `try/catch` par élément au rendu serveur (coût nul hors erreur).

Les mesures « après » sont dans `KOLAKISA_CORE_TEST_REPORT.md`.
