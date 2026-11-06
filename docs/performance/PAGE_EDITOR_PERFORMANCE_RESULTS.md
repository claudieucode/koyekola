# Éditeur de pages — résultats de mesure (6 novembre 2026)

Environnement : Intel(R) Core(TM) i5-6500 CPU @ 3.20GHz ×4, Chrome 150.0.7871.125, Darwin 21.6.0, charge machine pendant la mesure [4.15, 5.24, 3.99] (machine partagée avec d'autres programmes : valeurs absolues pessimistes, bruit d'environ ±30 %).
Outil : `scripts/perf/bench-page-builder.js` (Chrome réel piloté par Playwright contre un vrai serveur), `scripts/perf/mesure-ouverture-editeur.js`.

## Page ordinaire (titres, textes, boutons, images, listes, grilles)

| Éléments | Ouverture (ms) | Sélection (ms, médiane) | Frappe dans le panneau (ms) | Frappe → canevas (ms) | Enregistrement (ms) | Glisser dans le canevas (ms/image) | Tâches longues | Défilement (img/s) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 | 2097 | 30.1 | 23.2 | 66 | 1146 | 16.7 | 0 | 61 |
| 100 | 822 | 27.6 | 24.8 | 78 | 1166 | 16.6 | 0 | 61 |
| 300 | 1306 | 36.6 | 23.6 | 380 | 804 | 16.7 | 0 | 61 |

## Page riche (accordéons, onglets, compteurs, titres animés, progressions mélangés aux éléments ordinaires)

Ces widgets s'initialisent par script ; le scénario vérifie que les rendre ne fait pas recharger le canevas à chaque modification.

| Éléments | Ouverture (ms) | Sélection (ms, médiane) | Frappe dans le panneau (ms) | Frappe → canevas (ms) | Enregistrement (ms) | Glisser dans le canevas (ms/image) | Tâches longues | Défilement (img/s) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 | 2235 | 29.8 | 21.4 | 86 | 933 | 16.6 | 0 | 61 |
| 100 | 732 | 31.2 | 27.8 | 107 | 1029 | 16.6 | 1 | 61 |
| 300 | 1442 | 48.9 | 23.6 | 187 | 944 | 16.7 | 0 | 61 |

## Ouverture de l'éditeur (150 éléments, page riche, 3 ouvertures)

- Prêt (canevas affiché) : médiane **802 ms** (première ouverture à froid ≈ 2,4 s : démarrage du serveur et des gabarits, puis ≈ 0,6–0,8 s).
- Tâches longues (> 50 ms) pendant l'ouverture : médiane 2, durée cumulée médiane 248 ms.
- Ressources : 30 fichiers, 482 Ko transférés (compressés), 19 scripts.
- Temps de calcul par fichier : `page-builder.js` ≈ 150–200 ms, tous les autres scripts < 20 ms chacun.
- Dans `page-builder.js` : mise en page du canevas (`applyZoom` ≈ 80 ms, `readOverlayGeo` ≈ 30–80 ms), le reste < 15 ms par fonction.

## Lecture des résultats

- Objectifs de la mission : réaction < 100 ms, 60 images/s, aucune tâche longue bloquante en interaction.
- Sélection d'un élément : **25–49 ms** (médiane), pire cas 127 ms à 300 éléments : objectif tenu en médiane.
- Frappe dans le panneau : **21–28 ms**. Glisser dans le canevas : **16,6 ms/image = 60 images/s**, sans tâche longue (une seule, de 91 ms, observée sur la page riche de 100 éléments, non reproduite sur les autres tailles). Défilement : 61 images/s.
- Frappe → canevas à jour : 66–107 ms jusqu'à 100 éléments, **135–380 ms à 300 éléments** (dépend de la charge de la machine et du rendu serveur de la page entière).
- Sur la page riche, la frappe → canevas reste du même ordre que sur la page ordinaire (66–107 ms jusqu'à 100 éléments). Le bench ne vérifie pas si le cadre est rechargé ou mis à jour en place : seule la latence est mesurée.
- Mémoire JS : 7–10 Mo, stable après 5 cycles dupliquer / annuler / rétablir / supprimer (pas de fuite visible dans ce scénario ; mesure grossière via `performance.memory`, pas de test de plusieurs heures).

## Essai sans gain

Le calcul de la barre d'outils contextuelle (`fitContext`) a été testé groupé en une seule lecture de mise en page : temps mesuré 83 ms → 90 ms sur 12 sélections (dans le bruit). Le coût vient de la remise en place des groupes, pas de la boucle. **Modification non retenue** (code produit inchangé).

## Tests de non-régression

Le code du produit n'a pas été modifié par ce lot ; les suites existantes de l'éditeur (`editeur-blocs-a11y-perf-navigateur`, `editeur-widgets`, etc.) restent la référence. Voir le rapport final pour le détail des suites exécutées.
