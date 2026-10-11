# Rapport de tests — mission 7

## Exécutés
| Lot | Résultat |
|---|---|
| Nouveau : `persistance-navigateur` (8, Chrome, réseau contrôlé) | 8 / 8 |
| Nouveau : `persistance-serveur` (5, vrai serveur) | 5 / 5 |
| **Régression ciblée : 38 fichiers** (tout test citant publier / enregistrer / versions / restaurer / copie locale, + noyau, structure, stabilité, édition visuelle) ; `--test-concurrency=2`, jsdom et Playwright disponibles | **524 tests : 523 réussis, 1 échec** |

## L'échec
`editeur-manipulation-directe-navigateur` › « performance : geste de poignée fluide sur une page de 300 éléments (aucune image > 50 ms) » : 2 images > 50 ms (max 66,6 ms) **pendant le lot**, avec un autre test Chrome en parallèle. Rejoué **seul trois fois : 3 / 3 verts**. Ce test mesure des durées d'images : il est sensible à la charge par nature ; ma modification ne touche ni le geste ni le redimensionnement. La cause n'est **pas démontrée** (hypothèse : charge de la machine) ; il est consigné comme intermittent à surveiller, comme le test numérique de la mission 2 (vert dans ce lot, cause inconnue).

## Preuves « échoue sans correctif »
* Navigateur : sans la modification de `page-builder.js`, 4 des 8 tests échouent (publication pendant un vol, erreur, session expirée, aperçu).
* Serveur : sans la modification de `pages/index.js`, le test de publication sans doublon échoue.

## Suite complète : NON exécutée
Non validée de bout en bout depuis la mission 2 (durée > 1 h 30 ; vous m'avez demandé d'aller plus vite). 524 tests ciblés ne valent pas validation générale.

## Non testé
Coupure réelle de la connexion, Safari / Firefox, fermeture forcée de l'onglet, très gros documents, enregistrements simultanés de plusieurs utilisateurs réels, programmation de publication et composants globaux.
