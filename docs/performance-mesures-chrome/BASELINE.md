# KOLAKISA — Performance de l'éditeur : état de référence (10 octobre 2026)

Mesures faites AVANT toute modification, sur `origin/main` (commit `bf61e33`), dans un worktree dédié
(`KOYEKOLA-performance`, branche `performance-editeur`). **Aucun fichier de production n'a été modifié.**
L'audit qui explique ces chiffres est dans `KOLAKISA_PERFORMANCE_AUDIT.md` ; le suivi des optimisations dans
`KOLAKISA_PERFORMANCE_REGRESSION.md`.

## 1. Ce qui a été mesuré, et avec quoi

| Élément | Valeur |
|---|---|
| Machine | iMac, Intel Core i5-6500 (2015, 4 cœurs, 3,2 GHz), 32 Go — c'est une machine **moyenne/ancienne**, pas une machine rapide |
| Navigateur | Google Chrome (celui installé sur la machine), piloté par Playwright en mode « headless » |
| Écran | **60 Hz** : le mode headless ne permet PAS de mesurer 120 Hz |
| Serveur | vrai serveur KOLAKISA lancé par `tests/helpers.js` avec une base temporaire (aucune de vos données) |
| Outils | `PerformanceObserver` (tâches longues, évènements lents), CDP `Performance.getMetrics` (script / mise en page / styles), CDP `Profiler` (échantillonnage 200 µs), `Memory.getDOMCounters`, journal de `fetch` injecté dans la page |
| Reproduire | `docs/performance/bench/` (voir §7) ; résultats bruts dans `docs/performance/mesures-initiales/` |

**Réserves honnêtes**

- **Safari et Firefox : non testés** (Playwright pilote ici Chrome seulement). Les chiffres ne valent que pour Chrome.
- **500 éléments est impossible** : le serveur refuse plus de **400 éléments** (`MAX_NODES = 400`) et **30 sections** par
  page. Les pages d'essai font donc **27, 108, 306 et 405 éléments** (comptés réellement), et 405 est le maximum de
  l'éditeur.
- Le zoom de l'éditeur va de **25 % à 200 %** (pas de 300 % ni 400 %).
- « Jusqu'à l'image affichée » est mesuré par **deux `requestAnimationFrame`** : à 60 Hz, **le plancher de cette
  mesure est ≈ 33 ms**. Une valeur de 34 ms veut donc dire « aussi vite que l'affichage le permet ».
- Aucune page d'essai ne contient d'**images** ni de **widgets dynamiques** (articles, formulaires) : l'impact de ces
  éléments n'est **pas mesuré** ici.
- Machine « rapide » : non disponible. Une machine plus lente (type portable d'entrée de gamme) n'a pas non plus été
  testée ; un ralentissement artificiel du processeur est prévu au LOT 14.

## 2. Pages d'essai

Sections libres › 4 conteneurs › 7 éléments (titres, textes, boutons en alternance).

| Page | Éléments réels | Nœuds DOM fenêtre / canevas |
|---|---|---|
| A | 27 | 3 429 / 66 |
| B | 108 | 5 895 / 177 |
| C | 306 | 11 854 / 431 |
| D (maximum autorisé) | 405 | 14 845 / 561 |

## 3. Tableau de référence

Médianes sur plusieurs répétitions (12 sélections, 6 modifications, 4 annuler, 4 rétablir…). « Gestionnaire » = temps
passé dans le code de l'éditeur avant de rendre la main ; « image » = jusqu'à l'image affichée (plancher ≈ 33 ms).

| Mesure | 27 él. | 108 él. | 306 él. | 405 él. |
|---|---|---|---|---|
| Ouverture : éditeur prêt (ms, mur) | 1132 | 714 | 866 | 1388 |
| Ouverture : tâches longues (nombre / total ms / max ms) | 3 / 476 / 309 | 5 / 497 / 156 | 4 / 547 / 298 | 4 / 984 / 672 |
| Tas JS (Mo) au départ → à la fin | 5.9 → 7.4 | 5.7 → 8.5 | 6.1 → 11.8 | 6.3 → 9.2 |
| **Sélection** par clic : gestionnaire (ms, médiane / p95) | 9.2 / 32.1 | 7.5 / 27.6 | 9.5 / 23 | 12.9 / 38.5 |
| Sélection : jusqu'à l'image (ms, médiane / p95) | 34.4 / 67.5 | 33.4 / 51.2 | 45.2 / 68.3 | 49.7 / 82.1 |
| **Désélection** : gestionnaire / image (ms) | 1.5 / 33.7 | 1.2 / 44.4 | 1.4 / 32.6 | 1.1 / 32.6 |
| **Survol** (règles actives) : coût par mousemove, p95 (ms) | 0.1 | 0.1 | 0.1 | 0.1 |
| Survol : durée d'image, p95 (ms) | 18.5 | 17.8 | 17.5 | 19 |
| **Modifier une propriété** : touche → canevas à jour (ms, médiane) | **72** | **81.5** | **107.9** | **103** |
| … première modification (ms) | 72 | 79.3 | 123.6 | **251.8** |
| **Redimensionner** (poignée) : durée d'image p95 / max (ms) | 18.6 / 18.9 | 22.1 / 111.9 | 18.2 / 18.8 | 18.5 / 19.8 |
| Redimensionner : relâchement (ms) | 22.9 | 40.1 | 28.1 | 30.1 |
| **Zoom** (clic) : gestionnaire / image (ms) | 1 / 34 | 1.3 / 34.4 | 1.7 / 35.8 | 2.4 / 35.5 |
| **Annuler** : gestionnaire / image (ms) | 27.2 / 51.9 | 31.7 / 74.6 | 29.6 / 65 | 34.9 / **105.3** |
| **Rétablir** : gestionnaire / image (ms) | 32 / 70.4 | 35.1 / 97.3 | 30.1 / 68.9 | 61.2 / **212.1** |
| Annuler / rétablir : pire image (ms) | 91.5 | 99.5 | 119.8 | **251.3** |
| **Structure** fermer / ouvrir : image (ms) | 34.1 / 33.5 | 34 / 50.4 | 34 / 81.7 | 32.7 / **116.4** |
| **Inspecteur** : onglet Style, gestionnaire / image (ms) | 16.2 / 31.8 | 13.1 / 38.5 | 13.9 / 48.5 | 16.5 / 50.1 |
| Rendu serveur `/rendu` : envoyé / reçu (Ko) | 3 / 6 | 11.4 / 18.3 | 33.5 / 48.6 | 44.4 / 63.8 |
| Rendu serveur `/rendu` : durée (ms) | 41 | 34 | 82 | 122 |
| Enregistrement `PUT /brouillon` (ms, 1 modif / après rafale) | 437 / 9 | 14 / 17 | 88 / 396 | 326 / **725** |
| `POST /seo/analyse` envoyé à chaque modification (ms serveur) | 30 | 27 | 28 | 41 |
| Rafale de 40 touches : requêtes `/rendu` / `PUT` | 1 / 1 | 1 / 1 | 2 / 1 | 1 / 1 |
| Sérialisation du document : taille (Ko) / copie (ms) | 2.8 / 0 | 11.2 / 0.1 | 33.3 / 0.2 | 44.2 / 0.3 |

Lecture rapide :

- **Déjà au plancher** : désélection, survol, zoom, redimensionnement (≈ 1 image à 60 Hz), sélection sur petites pages.
- **Pas un problème aujourd'hui** : sérialiser/copier le document (0,3 ms pour 44 Ko), l'écriture de la copie locale
  (0,1 ms), la rafale de touches (les requêtes sont déjà regroupées : 1-2 rendus et 1 enregistrement pour 40 touches).
- **À améliorer** : modification d'une propriété (72 → 108 ms, 252 ms au pire), annuler/rétablir (jusqu'à 251 ms),
  ouverture/fermeture du panneau Structure (116 ms à 405 éléments), enregistrement serveur (jusqu'à 725 ms), ouverture
  de l'éditeur (≈ 1 s, tâches longues jusqu'à 672 ms).

## 4. Décomposition (profil CPU, page de 405 éléments)

Temps cumulés sur la série de gestes indiquée ; `layouts` = nombre de recalculs de mise en page déclenchés.

| Scénario | Script | Mise en page | Styles | Layouts | Principal coût JS identifié |
|---|---|---|---|---|---|
| 20 sélections | 91 ms | 38 ms | 68 ms | **144 (≈ 7 par clic)** | `getBoundingClientRect` ← `placeCanvasBar` ← `drawOverlays` : **122 ms** |
| 10 désélections | 46 ms | 29 ms | 63 ms | 102 | idem : 45 ms |
| 20 modifications ▲ | 78 ms | **169 ms** | 21 ms | **162 (≈ 8 par modification)** | idem : **148 ms** (≈ 7 ms par modification) |
| 10 modifications validées (Entrée) | 210 ms | 72 ms | 104 ms | 110 | `placeCanvasBar` ← `afterChange` 78 ms ; `physicalAxis` 90 ms ; `elementsFromPoint`/`elementFromPoint` 82 ms |
| 8 annuler | 103 ms | 50 ms | 78 ms | 72 | `placeCanvasBar` ← `afterChange` 60 ms ; `physicalAxis` 61 ms |
| 8 rétablir | 107 ms | 51 ms | 80 ms | 72 | idem : 64 ms ; `physicalAxis` 74 ms |
| 6 bascules du panneau Structure | 14 ms | 77 ms | **187 ms** | 12 | `applyZoom` : **232 ms** (≈ 39 ms par bascule) |
| 6 zooms | 14 ms | 3 ms | 3 ms | 53 | négligeable |
| règles actives + 200 survols | 114 ms | 32 ms | 16 ms | 205 | `selectionBand` → `getBoundingClientRect` 41 ms ; travail natif 1 258 ms (≈ 6 ms par image) |

## 5. Ouverture de l'éditeur

| | 27 él. | 405 él. |
|---|---|---|
| Éditeur prêt | 963 ms | 1 004 ms (1 388 ms dans la série complète) |
| Script / mise en page / styles / tâche (CDP) | 175 / 324 / 65 / 710 ms | 201 / 298 / 112 / 939 ms |
| Requêtes | 30 | 30 |
| `page-builder.js` | 582 Ko non minifié, **147 Ko** transférés | idem |
| `applyZoom` (mise en page forcée du canevas) | 153 ms | 146 ms |
| Premier `POST /seo/analyse` à l'ouverture | 322 ms | **870 ms** |

## 6. Mémoire (page de 108 éléments)

| Étape | Tas JS | Nœuds DOM (vivants / retenus détachés) | Écouteurs |
|---|---|---|---|
| départ | 4,1 Mo | 5 790 / 2 892 | 1 869 |
| après 200 sélections/désélections | 4,6 Mo | 5 826 / 2 931 | 1 884 |
| après 30 modifications ▲ | 6,2 Mo | 6 577 / 4 169 | 2 240 |
| après 30 modifications validées | – | 6 578 / 5 956 | 2 574 |
| après 30 annulations | – | 6 578 / 5 956 | 2 574 |

**Aucune fuite continue** : répéter 200 sélections, 40 annuler et 40 rétablir ne fait pas grossir le total. Il reste un
**plateau d'environ 3 000 à 6 000 nœuds détachés retenus** (cause non identifiée, voir l'audit §Mémoire). Écouteurs du
`document` et de la `window` : identiques au départ et à la fin.

## 7. Reproduire les mesures

```
cd KOYEKOLA-performance          # worktree dédié
npm i --no-save playwright-core  # une seule fois (non ajouté au projet)
node docs/performance/bench/bench.js 20,100,300,400 /tmp/resultats.json   # tableau §3 (≈ 10 min)
node docs/performance/bench/profile.js 400 1        # profil CPU §4 (dernier argument : ralentissement CPU, ex. 4)
node docs/performance/bench/open.js                 # ouverture §5
node docs/performance/bench/leak2.js                # mémoire §6
node docs/performance/bench/table.js                # tableau Markdown à partir des fichiers de résultats
```

`CHROME_PATH=…` change le navigateur. Le serveur de test et sa base sont créés puis supprimés par le script.

## 8. Budgets proposés (à valider)

Réalistes pour Chrome sur cette machine à 60 Hz ; chaque budget est mesurable avec les scripts ci-dessus.

| Interaction | Aujourd'hui (405 él.) | Budget | Note |
|---|---|---|---|
| Sélection : gestionnaire | 12,9 ms (p95 38,5) | ≤ 8 ms (p95 ≤ 16) | tenir dans une image |
| Désélection, survol, zoom, redimensionnement | au plancher | ne pas dégrader (≤ 1 image) | non-régression |
| Modification d'une propriété → canevas | 103 ms (252 au pire) | **≤ 50 ms perçu** (retour local immédiat), serveur en confirmation | plus gros levier |
| Annuler / rétablir : image | 105 / 212 ms | ≤ 100 ms | |
| Structure / panneau : image | 116 ms | ≤ 70 ms | |
| Enregistrement (serveur) | 326–725 ms | ≤ 250 ms ; jamais bloquant pour l'interface | |
| Ouverture de l'éditeur | ≈ 1,0–1,4 s | ≤ 800 ms, aucune tâche longue > 200 ms | |
| Tâche longue pendant un geste | 24–32 ms (évènements) | aucune > 50 ms | |
| Requêtes par modification | 3 (`/rendu`, `PUT`, `/seo/analyse`) | 2 | |
