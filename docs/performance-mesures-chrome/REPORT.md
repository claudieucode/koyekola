# KOLAKISA — Rapport de performance de l'éditeur (10 octobre 2026)

Références : `KOLAKISA_PERFORMANCE_BASELINE.md` (état initial), `KOLAKISA_PERFORMANCE_AUDIT.md` (causes),
`KOLAKISA_PERFORMANCE_REGRESSION.md` (suivi). Scripts et résultats bruts : `docs/performance/`.

**Note de fusion** : une autre session a livré en parallèle sur `main` des optimisations voisines (lectures groupées à la sélection,
rendu immédiat du premier changement, panneau Structure). P1 de ce rapport n'a donc PAS été réappliquée ; seules P2, P3, P4, P6 et P8 le sont
(le tableau « avant/après » ci-dessous mesure l'ensemble P1-P8 sur l'ancienne base).

## Ce qui a été étudié et appliqué (`public/js/page-builder.js`)

| ID | Changement | Pourquoi (mesure initiale) |
|---|---|---|
| P1 | Surcouches du canevas : toutes les mesures sont lues **avant** d'écrire (`readOverlays` / `writeOverlays`), la barre d'actions est placée après | ≈ 7 mises en page forcées par clic, ≈ 8 par modification |
| P2 | Le panneau « Page » (et sa requête `/seo/analyse`) n'est reconstruit que lorsqu'il est visible, sinon marqué « à rafraîchir » | 1 requête et 1 reconstruction inutiles par modification ; 322–870 ms à l'ouverture |
| P3 | **Aperçu immédiat** des styles simples (taille, couleurs, marges, rayons, largeurs…) posés en style en ligne sur l'élément du canevas, retirés dès que le rendu serveur arrive | modification → canevas : 72–252 ms |
| P4 | `physicalAxis` : le style réel est lu une fois par élément et par reconstruction de l'inspecteur | 61–90 ms de `getComputedStyle` par série d'opérations |
| P6 | 3 délais fixes (30/60/30 ms) remplacés par `requestAnimationFrame` | attente à l'aveugle de la mise en page |
| P8 | `afterChange` : chaque rendu secondaire est isolé (`guarded`) ; le rendu du canevas et l'enregistrement ont toujours lieu | une exception d'un rendu pouvait empêcher l'enregistrement |

Non appliqué (voir l'audit) : P5 (panneau Structure), P7 (enregistrement serveur), P9 (ouverture), P10 (nœuds détachés) —
leur gain n'est pas démontré ou leur risque est plus élevé ; ils restent au plan.

## Mesures avant / après

**Précaution importante** : pendant les mesures « après », la machine était fortement chargée par d'autres programmes
(charge système 20 à 25 sur un processeur à 4 cœurs), ce qui bruite fortement les temps. Les mesures A/B ci-dessous ont donc
été faites **en alternance** (ancien code, nouveau code, ancien, nouveau) dans les mêmes conditions. Les **compteurs de
mises en page** (déterministes) sont la mesure la plus fiable.

### Mesures fiables

| Mesure (page de 405 éléments sauf mention) | Avant | Après |
|---|---|---|
| Modification d'une propriété → canevas à jour (médiane, 2 tours) | 178 / 114 ms | **24,5 / 26 ms** |
| Même mesure, page de 108 éléments | 83 / 88 ms | **24 / 20 ms** |
| Même mesure, pages de 306 éléments (passage isolé) | 108 ms | **30 ms** |
| Mises en page pour 20 sélections | 144 | **47** |
| Mises en page pour 20 modifications | 162 | **92** |
| Mises en page pour 8 annulations | 72 | **40** |
| Mises en page pour 6 zooms | 53 | **23** |
| Requêtes par modification | 3 | **2** |

### Mesures dans le bruit (aucune amélioration ni dégradation démontrée)

Sélection (≈ 10 ms de code, 35–50 ms jusqu'à l'image, au plancher de 33 ms), désélection, onglet Style, panneau Structure,
annuler/rétablir en temps (les compteurs de mises en page baissent mais les temps fluctuent de 50 à 270 ms sous charge),
ouverture (0,7 à 2,5 s selon la charge). **À re-mesurer sur machine au repos** pour conclure.

## Limites de cette mesure

- Chrome seulement, 60 Hz, machine unique (i5-6500), machine chargée pendant les mesures « après ».
- Safari, Firefox, 120 Hz, machine plus lente : non testés.
- Pages d'essai sans image, sans widget dynamique ni section interactive.
- L'aperçu immédiat (P3) ne couvre que les propriétés simples à valeur littérale (px, %, rem, em, couleur hexadécimale) sur
  l'état normal et l'élément lui-même ; tout le reste continue de passer par le rendu serveur (inchangé, et qui reste la
  référence : l'aperçu local est toujours remplacé par son résultat).

## Reste à faire (recommandations)

1. Re-mesurer au repos (machine non chargée), puis traiter P5 (Structure : 116 ms à 405 éléments) et P7 (enregistrement serveur 88–725 ms).
2. Profil Node de `PUT /brouillon`.
3. Instantané de tas pour le plateau de nœuds détachés (3–6 k).
4. Tester Safari/Firefox et un processeur ralenti (`profile.js 400 4`).
5. Mesurer avec images et widgets dynamiques.
