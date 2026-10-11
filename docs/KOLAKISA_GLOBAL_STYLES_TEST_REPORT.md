# Rapport de tests — mission 5

## Exécutés
| Lot | Résultat |
|---|---|
| Nouveau : `styles-globaux-navigateur` (7, Chrome réel, publié + canevas) | 7 / 7 |
| Contrat et cohérence des propriétés (missions 2) rejoués après le changement du format des couleurs | 16 / 16 |
| **Régression ciblée : 90 fichiers** citant `token:`, couleurs personnalisées, classes, thème, site web (+ nouveaux et priorité CSS) ; `--test-concurrency=2`, jsdom et Playwright disponibles | **1 189 tests : 1 184 réussis, 2 échecs, 3 ignorés** |
| Rejeu des 2 fichiers en échec après mise à jour de leurs attentes | 13 / 13 |

## Les 2 échecs
`page-builder-modele` (« arbre imbriqué validé ») et `editeur-v2` : ils comparaient le CSS généré à l'**ancien texte exact** `var(--kw-surface)` / `var(--kw-primary)`. Cause : **test périmé par mon correctif D2** (le CSS est maintenant `var(--kw-surface, #ffffff)`, plus tolérant), pas un défaut du produit. Attentes mises à jour avec la nouvelle forme ; la référence au jeton reste exigée. 3 tests ignorés : préexistants.

## Échecs de preuve (« échoue sans correctif »)
* D1 (suppression d'une couleur utilisée par un réglage du site) : le test échoue sans la correction.
* D2 (page hors site) : le test échoue sans la correction.

## Suite complète : NON exécutée
Ni le lot de 90 fichiers (≈ 1 200 tests sur environ 4 840) ni les tests ciblés ne valent suite complète. Elle reste non validée de bout en bout depuis la mission 2 ; je ne l'ai pas relancée (durée > 1 h 30, impatience de l'utilisateur).
Test numérique intermittent de la mission 2 : non rencontré dans ce lot ; cause toujours inconnue.

## Non testé
Safari / Firefox, tactile, sites de grande taille, modèles de site (mission 9), polices personnalisées téléversées.
