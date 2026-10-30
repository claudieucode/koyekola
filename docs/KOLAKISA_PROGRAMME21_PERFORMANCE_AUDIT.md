# Programme 21 — audit de performance

**Mesures réelles** (`tests/programme21-performance.test.js`, exécution du 30/10/2026, **machine d'essai très chargée** — charge système 14 à 36 pendant la session — donc ordres de grandeur, pas des garanties). En processus, base SQLite en mémoire, dossier de fichiers jetable, IA simulée. Aucune mesure de réseau, de navigateur, de fournisseur réel ni de production.
| Mesure | Résultat |
|---|---|
| 12 pages × 8 sections : proposition du Page Generator | 17,7 ms |
| enregistrement en brouillon de ces 12 pages | 34,4 ms |
| relecture de 12 pages | 1,9 ms |
| enregistrement de 300 images (type réel, empreinte, fichier) | 570 ms (≈ 1,9 ms/image) |
| liste d'une page de 60 images / filtre IA + recherche / liste de 100 images | 4,5 ms / 3,0 à 11,2 ms / 3,5 ms |
| images inutilisées (60 premières) | 22,5 ms |
| planification des besoins visuels de 12 pages | 14,6 ms |
| lecture d'un historique de 500 opérations + tâches + consommation | 5,8 ms |
| direction artistique : 3 variantes validées (contrastes, normaliseurs stricts) | 10,6 ms |
| champs éligibles de 12 pages / 4 générations de contenu simulées | 2,8 ms / 41 ms |
| 4 tâches d'images simultanées (démonstration) | 39 ms, aucune perte |
**Tests de la suite complète** : 5 063 tests en 1 331 s (437 fichiers, concurrence 3, machine chargée) ; 1 940 tests en 1 966 s (241 fichiers).

## Constats
- Aucun goulot d'étranglement dans les moteurs eux-mêmes ; le coût réel d'une génération sera dominé par le fournisseur d'IA (non mesuré).
- La médiathèque expose au plus **100 images par page** (limite du service natif) ; la recherche « inutilisées » est bornée (60 résultats).
- Interrogation des tâches en arrière-plan toutes les 3 s, arrêtée quand plus rien n'est en cours.
- **Non mesuré** : temps de chargement du studio dans un navigateur, mémoire, charges de plusieurs dizaines de sites ou de plusieurs centaines de pages, catalogue volumineux (inexistant), production.
