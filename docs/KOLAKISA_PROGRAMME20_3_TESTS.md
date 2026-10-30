# KOLAKISA — Programme 20.3 : tests

Commande : `TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/theme-builder-serveur.test.js tests/theme-builder-regles.test.js tests/theme-builder-routes-20-3.test.js tests/editeur-modeles-theme.test.js tests/site-web-modeles.test.js`

**Résultat : 40 exécutés, 40 réussis, 0 échec, 0 ignoré.**

| Fichier | Rôle | Tests |
|---|---|---|
| `theme-builder-regles.test.js` (nouveau, sans serveur) | priorité, exclusions, égalités, modification, repli, brouillon, deux organisations, réglage corrompu, type hostile | 12 |
| `theme-builder-routes-20-3.test.js` (nouveau, serveur réel) | exclusion visible sur le site public, modification, droits d'un lecteur (403), anonyme, identifiants hostiles, page repassée en brouillon | 6 |
| `theme-builder-serveur.test.js`, `editeur-modeles-theme.test.js`, `site-web-modeles.test.js` | non-régression des missions 9 / 9.1 | 22 |

## Incident de parcours
Une première version validait les catégories : 2 tests existants ont échoué (`explication…`, `l'écran « Pourquoi ce modèle ? »…`). Cause : catégories libres dans ces tests. La validation a été retirée ; les tests existants sont inchangés et passent.

## Non exécuté
Suite complète `npm test` ; tests responsive, clavier, contrastes, Firefox / Safari ; isolation entre organisations **par HTTP** (testée au niveau du module avec deux organisations) ; cache entre sites (aucun cache de modèle n'existe dans ce code : non applicable, non testé).
