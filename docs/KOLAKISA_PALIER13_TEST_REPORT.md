# Palier 13 — Rapport de tests

Environnement : macOS 12, Node 24, Chrome (Playwright), `--test-concurrency=1`, `ENCRYPTION_KEY` de test. Branche `palier13`.

## Tests propres au palier
`tests/palier13-menus-clavier-navigateur.test.js` : 5 tests. **Sans les correctifs : 4 échouent / 1 réussit. Avec : 5 / 5** (réussi à chaque exécution isolée). Une fois, dans un lot de 252 tests exécuté pendant que je lançais d'autres mesures navigateur, le test « menu de navigation » a dépassé un délai de 30 s (`locator.click`) ; rejoué seul ensuite : 5 / 5. Cause du dépassement non démontrée (charge machine probable).

## Audit mesuré
`scripts/ux/audit-editeur-navigateur.js` : 46 mesures, 1 écart restant (barre du haut à 1024×640, 156 px — Palier 14, voir limites).

## Régression ciblée : 102 fichiers de l'éditeur (`editeur-*`, `palier13-*`, `page-builder*`, `composants-navigateur`, `theme-builder*`, `controles-*`)
Exécution unique propre (après arrêt d'un lancement parasite que j'avais déclenché par erreur, voir ci-dessous) : **825 tests, 148 suites, 823 réussis, 2 échoués, 0 annulé, 0 ignoré, durée 1 h 37.**

| Échec | Analyse |
|---|---|
| `editeur-canvas-navigateur` « le reste de l'interface est inchangé… » | **Intermittent.** Rejoué seul : 12/12 sur `origin/main` et 12/12 sur la branche, puis 2 fois 12/12. L'échec est survenu pendant que je lançais en parallèle la matrice responsive (Chrome + Firefox) : charge machine. Cause non démontrée. |
| `editeur-conformite-widgets` « chaque widget créable… » (menu, toc absents) | **Préexistant sur `origin/main`** (même échec, même message). Cause : le widget « menu » lit désormais un menu du CMS et n'affiche rien sans menu affecté ; le jeu de données du test n'en donnait pas. **Corrigé dans le test** (liste manuelle pour « menu », comme `tests/widgets-helpers.js` au Palier 12), assertions et liste `SILENT_BY_DESIGN` inchangées. Rejoué : 3/3. |

## Incident de méthode
Ma première régression a été lancée avec une liste de fichiers vide et a démarré toute la suite en arrière-plan, qui écrivait dans le même fichier de sortie. Les chiffres de ces deux premiers lancements ont été écartés ; seuls ceux de la ligne ci-dessus (lancement propre) sont retenus.
