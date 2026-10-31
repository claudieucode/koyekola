# Core Web Vitals

**Version des seuils : web.dev « Core Web Vitals », en vigueur depuis mars 2024 (INP remplace FID).** Évaluation officielle : 75ᵉ centile des visites réelles.

| Métrique | Bon | À améliorer | Mauvais |
|---|---|---|---|
| LCP | ≤ 2 500 ms | ≤ 4 000 ms | > 4 000 ms |
| INP | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| CLS | ≤ 0,1 | ≤ 0,25 | > 0,25 |
| TTFB (indicatif, hors CWV) | ≤ 800 ms | ≤ 1 800 ms | > 1 800 ms |

## Ce que le produit sait faire réellement
- **Statique (serveur)** : estimer le candidat LCP, détecter `loading="lazy"` dessus, l'absence de `fetchpriority`, les images sans dimensions (risque CLS), polices sans `font-display`, scripts bloquants (risque LCP/INP). Étiqueté *estimation* ou *mesure du HTML*.
- **Laboratoire (manuel)** : `tests/manuel/perf-lab.js` mesure **LCP, CLS, tâches longues (TBT)** dans Chrome via `PerformanceObserver`, avec profil appareil/réseau simulé, relevés répétés, médiane et étendue.
- **INP** : non mesuré (aucune interaction pilotée dans le script). **Indisponible.**
- **Terrain** : aucune collecte (voir restes). Les données de laboratoire ne sont **jamais** présentées comme des données utilisateurs.

## Mesures de laboratoire de cette livraison
Voir `KOLAKISA_PROGRAMME22_9_TESTS.md` (conditions complètes). Résumé : profil « mobile lent », LCP médiane **3 376 ms → 2 852 ms** avec la priorité de l'image principale.
