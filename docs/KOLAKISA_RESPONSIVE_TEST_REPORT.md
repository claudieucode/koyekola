# Rapport de tests — mission 4

## Réussis
| Lot | Résultat |
|---|---|
| Nouveaux : isolation (9), largeurs (5), aperçu responsive (2) | 16 / 16 |
| Régression ciblée (34 fichiers : tout test qui cite `hideOn`, `breakpoints`, `lp-hide`, `data-device`, + layout-*, responsive-*, contrôles, inspecteur, stabilité) | 235 réussis sur 249 au premier passage ; les échecs ont été **rejoués** (voir ci-dessous) |
| Rejeu : `responsive-largeurs`, `elementor-parite-5-grand-ecran`, `site-web-reglages-theme` après annulation de ma correction | 31 / 31 |
| Rejeu : `elementor-parite-5`, `format-mise-en-page-navigateur`, `inspecteur-navigateur`, `layout-apercu-immediat` | 14 réussis, 1 échec = le test de compatibilité « Ordinateur masque aussi le grand écran » (cause : ma correction, annulée depuis) |

## Échecs et interruptions (à lire)
* Au premier passage du lot de régression, plusieurs fichiers ont échoué (`inspecteur-navigateur`, `layout-*`, `responsive-*`, `format-mise-en-page-navigateur`) **après que j'ai arrêté à la main un test de 20 minutes** (`controles-matrice-navigateur`, inclus par erreur dans le lot). Le rejeu groupé de quatre d'entre eux est vert (hors le test lié à ma correction). Après annulation de ma correction, j'ai rejoué ensemble `responsive-isolation`, `responsive-apercu`, `layout-parite`, `layout-priorite`, `layout-apercu-immediat` : **25 / 25 verts**.
* `controles-matrice-navigateur` : interrompu volontairement (non exécuté dans ce lot ; vert à la mission 2).
* Test numérique intermittent de la mission 2 : fait partie du lot, vert ; **cause toujours inconnue**.

## Suite complète : NON exécutée
Elle dépasse 1 h 30 sur cette machine et vous m'avez demandé d'aller plus vite. La dernière suite complète terminée remonte à la mission 2 ; la mission 3 en a vu 302 blocs sur ≈ 370. **Aucune suite complète n'est validée après les missions 3 et 4.**

## Non testé
Safari, Firefox, tactile, widgets à comportement mobile propre (menus, carrousels, formulaires), points de rupture supplémentaires (inexistants).
