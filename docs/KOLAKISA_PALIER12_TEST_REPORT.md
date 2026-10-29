# Palier 12 — Rapport de tests

Environnement : macOS (Darwin 21.6), Node 24, `node:sqlite`, Chrome réel via Playwright, machine chargée (charge 6-13), autres sessions Claude actives en parallèle. Commande type : `ENCRYPTION_KEY=<64 zéros> TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 <fichiers>`. Worktree `KOLAKISA-palier12` (branche `palier12`).

## 1. Tests ciblés (avant fusion large)
| Lot | Résultat |
|---|---|
| 21 fichiers modifiés par la fusion (theme-builder, parties, widgets-*, site-web-entete…) | 232 tests : 228 réussis, 4 échecs → causes : (a) mon premier durcissement de « Mettre à jour » contredisait un test existant → **revenu** (voir IMPLEMENTATION) ; (b) élément « menu » : jeu de données de test (P4) |
| Après correction : `widgets-liens-navigateur`, `widgets-publie-navigateur`, `theme-builder-serveur`, `palier12-isolation-composants` | **26/26 réussis**, 0 échec, 0 annulé |
| `palier12-migration-composants-revision` (mise à niveau 113 → 114, numéros uniques, idempotence) | 2/2 |
| `palier12-isolation-composants` (6 tests) : isolation lecture/écriture B, composant global, témoin, lecteur, conflit | 6/6 après correction ; **avant correction, le test « sans révision » échouait (reproduction de P3)** |

## 2. Suite complète (`tests/*.test.js`, 643 fichiers), sur `palier12` après le commit d'intégration
`ℹ tests 7787 · suites 1687 · pass 7716 · fail 56 · cancelled 0 · skipped 15 · durée ≈ 3 h 03`.
**La suite complète n'est donc PAS entièrement verte.** Analyse des 56 échecs :

- Rejeu des 30 fichiers concernés **sur `main` (5f308599) puis sur `palier12`**, même machine : `main` 54 échecs / 260, `palier12` 55 / 260.
- **54 échecs sont identiques sur `main`** (préexistants, non causés par ce palier) : interface (menus, alignements, débordements, 30 s de délai sur des parcours de site), contrôles de CSS (« aucune couleur violette », « ombres teintées », « z-index », « classes orphelines »), inventaires (tables, registre des pages, clés étrangères D3), portée des routes (équivalence), santé du site.
- **1 échec propre à `palier12` au rejeu** : « erreur serveur et réseau : jamais présentée comme réussie… » (`apparence-styles-navigateur`). **Intermittent** : relancé 3 fois sur chaque arbre, il réussit 3/3 sur `palier12` ; les 2 mêmes échecs stables (« couleur invalide… », « typographie, formes et boutons… ») existent à l'identique sur `main` (3/3).
- **2 échecs vus uniquement dans le run complet** (`/formateur/categories?q=zzz` 9 largeurs ; `clavier : Alt+↓…` de `widgets : éditeur`) : réussis au rejeu → intermittents sous charge.
- Niveau de confiance : **aucune régression démontrée** attribuable aux changements du palier ; mais l'état vert complet n'est pas atteint à cause des échecs préexistants de `main`, que ce palier ne traite pas (hors périmètre, listés en LIMITATIONS).
- Non exécuté : Firefox/Safari, lecteur d'écran réel, test de charge, base de préproduction/production.
- Tests ignorés : 15 (`skipped`, ignorés par leur propre condition, non modifiés par moi).

## 3. Couverture des scénarios demandés
| Scénario | Preuve |
|---|---|
| Sauvegarde / autosave / conflits | `palier12-isolation-composants` (409 sur révision périmée, refus sans révision) ; suites existantes `theme-builder-*`, `parties-brouillon-*`, éditeur (réussies dans le run complet sauf échecs listés) |
| Récupération après erreur | suites navigateur existantes de l'éditeur (message d'erreur, copie locale, réessai) — exécutées dans le run complet |
| Persistance des widgets, synchronisation canvas/structure | `widgets-*` (26 fichiers branche + existants) ; 1 échec intermittent sous charge |
| Brouillons, aperçu privé, publication des parties | `parties-brouillon-serveur/navigateur`, `theme-builder-*` |
| Permissions et isolation inter-sites | `palier12-isolation-composants`, `isolation-des-sites*`, `portee-des-routes` (1 test d'équivalence échoue **aussi sur main**) |
| Migrations | `palier12-migration-composants-revision` + démarrage réel du serveur dans chaque test (migration 114 appliquée) |
| Restauration | `cms-revisions*`, `moteur-pages` (inclus au run complet) |
