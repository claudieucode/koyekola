# Éditeur de pages — audit de performance (6 novembre 2026)

## Périmètre et méthode
Éditeur : `public/js/page-builder.js` (8 722 lignes, JavaScript sans framework : **pas de React**, donc pas de re-rendus de composants à profiler) + 11 modules `page-builder-*.js`, `views/marketing/page-builder.ejs`, `public/css/page-builder.css` (234 Ko). Le canevas est une iframe qui affiche le rendu serveur réel ; chaque modification envoie le document à `POST …/rendu`, le navigateur compare section par section (`patchCanvas`) et remplace seulement les sections changées.
Mesures : Chrome réel (Playwright), vrai serveur, profil CPU (CDP) par scénario et au chargement. Chiffres dans `PAGE_EDITOR_PERFORMANCE_RESULTS.md`. Audits précédents conservés : `docs/perf-page-builder.md`, `docs/KOLAKISA_EDITOR_PERFORMANCE_REPORT.md`.

## Constat principal
**Sur les scénarios mesurés, l'éditeur n'est pas lent** : sélection 25–49 ms, frappe 21–28 ms, glisser 60 images/s, défilement 61 images/s, ouverture 0,6–0,8 s (page de 150 éléments), mémoire stable. Je n'ai donc **pas reproduit** de dégradation globale sur cette machine. Je ne prétends pas avoir « retrouvé » une vitesse perdue : la mesure ne montre pas de régression de ce type.

## Points chauds réels (mesurés)
| # | Constat | Gravité | Fichier | Mesure |
|---|---|---|---|---|
| 1 | À l'ouverture, `applyZoom` est exécuté 4 fois (initialisation, changement de mode, deux passages de `queueZoom`) et chaque passage relit la géométrie du canevas | moyenne | `page-builder.js` (≈ l.6395, 8663, 6082, 6426) | ≈ 80 ms de mise en page forcée, 2 tâches longues (≈ 170 ms et ≈ 70 ms) |
| 2 | `readOverlayGeo` lit la géométrie de la sélection à chaque sélection et à l'ouverture | faible | `page-builder.js` ≈ l.5718 | 30–80 ms à l'ouverture |
| 3 | `fitContext` (barre contextuelle) remet tous les groupes en ligne puis relit la largeur à chaque changement de sélection | faible | `page-builder.js` ≈ l.5123 | ≈ 7 ms par sélection (83 ms sur 12) |
| 4 | Frappe → canevas à jour : dépend du rendu serveur de la page entière | moyenne à 300 éléments | `/rendu`, `patchCanvas` | 135–380 ms à 300 éléments (bruit élevé, machine chargée) |
| 5 | Première ouverture à froid | faible (une fois) | serveur | ≈ 2,4 s contre 0,6–0,8 s ensuite |

## Pistes écartées après mesure
- **Bibliothèques lourdes / chargement** : 30 ressources, 482 Ko compressés, 19 scripts ; compression gzip et cache immuable des ressources déjà en place (`app.js`). Tous les scripts autres que `page-builder.js` coûtent < 20 ms.
- **Fuites mémoire** : mémoire JS 7–10 Mo, stable sur 5 cycles dupliquer / annuler / rétablir / supprimer.
- **Animations / Lottie / 3D** : non chargés par l'éditeur au démarrage (aucun script correspondant dans la liste des 19).
- **Persistance** : l'enregistrement automatique attend 1 s après la dernière modification (≈ 0,8–1,2 s mesuré, délai compris).

## Production (hors éditeur)
Le serveur répond en moins de 35 ms (médiane) en local sur tout le site ; en production le premier octet arrive après 0,66 à 0,92 s (réseau + TLS ≈ 0,47 s, origine ≈ 0,2 s) et les fichiers css/js sont servis sans en-tête de cache. Gravité : moyenne (chaque visite et chaque ouverture de l'éditeur revalident 30 fichiers). Correction : `public/.htaccess`.

## Essai de correction
Le point 3 a été essayé (une seule lecture de mise en page au lieu d'une par groupe) : **aucun gain** (83 → 90 ms), donc non retenu.

## Corrections recommandées (non faites ici)
1. Regrouper les 4 appels de `applyZoom` de l'ouverture en un seul (gain attendu ≈ 40–60 ms et une tâche longue en moins ; à valider par mesure répétée, le bruit actuel est de ±30 %).
2. Mettre en cache le résultat de `fitContext` par type de sélection et largeur (gain ≈ 7 ms par sélection ; risque de coupure de la barre si une valeur change la largeur d'un groupe).
3. Mesurer sur une machine non chargée et sur les vraies pages de production avant d'aller plus loin.
