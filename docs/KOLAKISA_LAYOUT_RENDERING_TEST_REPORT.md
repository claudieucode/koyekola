# Rapport de tests — mission 3

## Exécuté et réussi
| Lot | Résultat |
|---|---|
| Nouveaux : parité canevas / publié (3), priorité CSS (5), aperçu immédiat (6) | 14 / 14 |
| Régression ciblée groupée : `editeur-canvas-*`, `editeur-layout-*`, `format-mise-en-page*`, `editeur-structure*`, stabilité, `inspecteur-navigateur`, `controles-numeriques-navigateur`, `controles-matrice-navigateur`, canevas stables | **175 / 175** |
| Contrôles et widgets (missions 2) : contrat, cohérence, `editeur-widgets`, `controles-numeriques-navigateur` rejoués (2 exécutions groupées + 3 sous charge Chrome) | 76 / 76 puis 13 / 13 × 3 |
| `automatisations-palette-navigateur` rejoué seul | 15 / 15 |

## Suite complète : NON terminée
Lancée (`--test-concurrency=2`, jsdom et Playwright disponibles), **arrêtée volontairement après ≈ 302 blocs de tests passés** à cause de sa durée (> 1 h 30 sur cette machine). Un seul échec observé avant l'arrêt : `automatisations-palette-navigateur` (67 s), qui **passe seul (15 / 15)**. À ce moment un processus orphelin de la même suite, resté bloqué depuis 16 h, tournait encore ; je l'ai arrêté. Le lien de cause n'est **pas démontré**. Les ≈ 70 blocs restants n'ont pas été exécutés dans cette mission. **La suite complète n'est donc pas validée de bout en bout après les corrections des missions 2 et 3.**

## Test intermittent signalé par la mission 2 (`controles-numeriques-navigateur`)
Cinq tentatives de reproduction (2 exécutions groupées avec les mêmes fichiers à concurrence 2 ; 3 exécutions pendant un test Chrome lourd) : **0 échec**. Plus une sixième dans le lot de régression ci-dessus. **Non reproduit ; cause non établie.** L'hypothèse « charge » n'est ni confirmée ni infirmée. Aucun test n'a été assoupli ni désactivé.

## Non testé
Safari, Firefox, tactile, glisser pour redimensionner / déplacer, pages de plus de 400 éléments.
