# Rapport de tests — mission 6

## Exécutés
| Lot | Résultat |
|---|---|
| Nouveau : `edition-visuelle-navigateur` (6, Chrome réel, vraies souris) | 6 / 6 (après deux corrections de mon propre test : une récursion de mon utilitaire, et l'accrochage magnétique qu'il faut couper avec Alt pour mesurer) |
| **Régression ciblée, 19 fichiers** (manipulation directe, structure, canevas, règles et magnétisme, stabilité, grande page, menus, bascule de mode, dimensions, inspecteur, zones de conteneurs, responsive-isolation, aperçu immédiat, styles globaux, contrôles numériques, propriétés effectives…) ; `--test-concurrency=2` | **195 / 195** |

## Échec rencontré en chemin
`editeur-regles-magnetisme` (T9) a **échoué** avec ma première version de D2 (compare la taille rendue à la valeur demandée) : fausse détection en Flexbox. Défaut de ma correction, pas du produit ni du test : correction remplacée, test inchangé et vert.

## Preuves « échoue sans correctif »
Les deux tests de redimensionnement (unité conservée ; borne max.) échouent sans la modification de `page-builder.js` (vérifié).

## Suite complète : NON exécutée
Non validée de bout en bout depuis la mission 2 (durée > 1 h 30 ; impatience de l'utilisateur). Les 195 tests ci-dessus ne valent pas validation générale. Test numérique intermittent de la mission 2 : fait partie du lot (`controles-numeriques-navigateur`), vert ; cause toujours inconnue.

## Non testé
Sélection multiple, menus contextuels complets, raccourcis hors Ctrl+D / Suppr / Ctrl+Z / Alt+↑↓, redimensionnement en Grille, glisser du canevas vers un autre parent (tests préexistants), tactile, Safari / Firefox.
