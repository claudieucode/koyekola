# Palier 16 — Mesures

**Environnement** : Intel i5-6500 (4 cœurs), macOS 12, Node 24.20, Chrome 150, serveur de test isolé (dossiers temporaires, SQLite). **Machine partagée avec d'autres sessions de travail** : charge système 3,9 → 13 pendant les relevés (voir ci-dessous) ; les temps absolus sont donc bruités. Mesures de développement et de production non séparées : le dépôt n'a pas de mode « dev » distinct pour le serveur de test.

## Avant correction (2026-10-29)
- Charge : 3,9 / 4,5 / 4,5 avant le banc serveur ; 6,1 / 8,0 / 7,7 en fin des bancs navigateur.
- Banc serveur : 20 passes par page, 120 articles, 3 000 contacts. Extraits (p50 / p95 ms ; requêtes SQL) :

| Page | p50 | p95 | SQL |
|---|---|---|---|
| `/` | 24,8 | 53,5 | 18 |
| `/blog` | 30,8 | 107,8 | 89 |
| `/sitemap.xml` | 14,2 | 73,9 | 152 |
| `/blog/feed.xml` | 8,9 | 115,8 | 46 |
| `/formateur` | 31,8 | 85,8 | 30 |
| `/formateur/blog` | 20,3 | 31,9 | 34 |
| `/marketing` | 16,5 | 20,0 | 39 |
| `/marketing/contacts` | 13,3 | 19,2 | 24 |

Tableau complet : `docs/performance-mesures-chrome/bench/palier16-serveur-avant.txt`.
- Chargement navigateur (3 passes, local puis 4G simulée) : FCP local 232 à 2 096 ms selon la page, **aucune ressource bloquant le rendu**, CLS ≤ 0,019, le plus lourd : éditeur d'articles (462 Ko, TBT 516 ms). La page d'accueil a été mesurée la première (serveur et caches froids) : son FCP de 1 072 ms n'est pas comparable aux autres.
- Canevas : frappe → canevas 36,9 ms (100 éléments), 95,1 ms (400).
- Interactions (400 éléments) : 60 images/s sauf sélection (pire image 217 ms) et curseur (267 ms), pointes liées à la charge de la machine, non reproduites de façon fiable.

## Après correction
Aucune mesure « après » comparative n'est présentée : le seul changement de code de production (borne du cache de variantes d'images) n'a pas d'effet de vitesse attendu ni mesurable ; il agit sur la croissance mémoire du processus. Son effet est démontré par test (voir le rapport de tests), pas par un gain de temps.
