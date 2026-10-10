# KOLAKISA — Interactions du canevas : performance (LOT 0)

Machine de mesure : Intel i5-6500 3,2 GHz ×4, Chrome 150 en mode sans affichage (macOS Darwin 21.6), **chargée par d'autres programmes** (charge 8 à 14) : ±30 %. Limite du produit : **400 éléments par page** (le serveur refuse au-delà : « Trop d'éléments sur la page (400 au plus) »), donc les essais à 500 éléments demandés ne sont pas possibles. Les mesures de cette session sont reproductibles avec `scripts/perf/bench-page-builder.js` et les sondes ci-dessous.

## Mesuré aujourd'hui
| Mesure | 20 éléments | 100 | 300 / 380 | Source |
|---|---|---|---|---|
| Sélection d'un calque (médiane, jusqu'à l'image suivante) | 28,8 ms | 38,6 ms | 37 ms (400) | bench |
| Frappe → canevas à jour | 163 ms | 80 ms | 576 ms (400) | bench |
| Glisser d'un nœud dans le canevas : image médiane / pire | 16,7 / 18,1 ms | 16,7 / 51,5 ms | 16,7 / 55,1 ms (400) | bench |
| Curseur (60 valeurs), glisser sur l'étiquette, poignée de redimensionnement : images > 33 ms | 0 | 0 | 0 (150) | sonde |
| Test de survol : `elementFromPoint` + `closest([data-node-id])` + `getBoundingClientRect` (300 essais) | < 0,2 ms | < 0,2 ms | < 0,2 ms (381 nœuds) | sonde |
| Création / retrait d'une boîte absolue dans l'iframe (300 essais) | < 0,2 ms | < 0,2 ms | < 0,2 ms | sonde |
| Défilement du canevas | 61 images/s | 61 | 61 | bench |

Limites de ces chiffres : la résolution du minuteur de Chrome est de 0,1 ms (donc « < 0,2 ms » et non une valeur plus fine) ; les 16,7 ms sont la cadence de l'écran sans affichage, pas une garantie sur un écran réel ; les gestes ont été simulés à la souris par Playwright.

## NON mesuré (à mesurer au LOT 2, avant de fixer des budgets)
- Coût de `drawOverlays()` (recréation de tous les overlays) en nombre d'appels par seconde pendant un défilement rapide.
- Survol réel à la souris (pas seulement le test de position), avec une couche d'overlay persistante.
- Zoom et pan à 300 % et 400 % (non pris en charge aujourd'hui : limite 200 %).
- Tactile (les gestes du canevas n'utilisent pas les événements `pointer`).
- Effet d'une couche d'overlay sur une page dont le `body` est positionné.

## Risques de performance identifiés
1. **`drawOverlays()` supprime et recrée tous les overlays** à chaque appel, y compris au défilement : à ne pas utiliser pour le survol (60 appels par seconde × création de plusieurs éléments).
2. **Le rendu serveur reste le goulot** (frappe → canevas : 80 à 576 ms selon la taille) : les gestes directs ne doivent **jamais** déclencher un rendu pendant le geste (le drapeau `gesture` le garantit déjà ; il faut s'en servir).
3. **`change()` sérialise tout le document** à chaque étape : un geste ne doit en produire qu'une (clé de transaction), jamais une par pixel.
4. **Zoom 400 %** : à cette échelle l'iframe garde sa taille logique mais est mise à l'échelle par `transform` ; coût inconnu, à mesurer avant d'élever la limite.

## Budgets proposés (À CONFIRMER par mesure, ce ne sont pas des résultats)
- Réaction au survol : moins d'une image (16 ms) sur 380 éléments ; mesure actuelle du test de position : < 0,2 ms.
- Geste de poignée (gap, padding, redimensionnement) : aucune image > 33 ms jusqu'à 380 éléments (valeur déjà obtenue pour les gestes existants).
- Zéro écriture réseau pendant un geste ; une seule étape d'historique par geste.
