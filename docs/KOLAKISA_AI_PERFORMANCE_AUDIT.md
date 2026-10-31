# Audit de performance (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## Conditions de mesure
Serveur Kolakisa local (Node v24.20.0), base SQLite vide + 15 sites, **machine partagée** (charge 4 à 5 pendant la mesure), pas de réseau (boucle locale), pas de compression ni de CDN, requêtes Node (`fetch`) — pas de navigateur. **Les chiffres décrivent le temps serveur, pas l'expérience d'un visiteur.** Lighthouse, Core Web Vitals (LCP, CLS, INP), requêtes réseau côté navigateur et mémoire du processus : **NON MESURÉS** (Chrome absent, mesure mémoire non instrumentée). Aucun score inventé.

## Mesures (15 scénarios, 53 pages publiées, 5 lectures par page, médiane)
| Mesure | Médiane | Maximum |
|---|---|---|
| Lecture d'une page publiée (temps de réponse local) | **10 ms** | 131 ms |
| Taille du HTML d'une page | ≈ 6,5 Ko | 6,8 Ko |
| Feuilles CSS servies (première page) | 123,5 Ko (non compressé) | — |
| Balises `<script>` par page | 4 | — |
| Génération d'un plan de pages (Page Generator) | 12 ms | 49 ms |
| Génération de la direction artistique (3 propositions) | 13 ms | 286 ms |
| Application des pages en brouillon | 27 ms | 589 ms |
| Publication de l'ensemble des pages d'un site | 34 ms | 185 ms |
| Scénario complet (hors démarrage du serveur) | 261 à 1 840 ms | — |
| Démarrage du serveur sur base vide (migrations) | ≈ 70 s sur cette machine chargée | — |

Les mesures du programme 21.11 (12 pages × 8 sections générées en 17,7 ms, enregistrées en 34 ms ; 300 images en ≈ 570 ms) sont cohérentes avec ces valeurs.

## Constats
- **P-1 (info)** Le socle est rapide côté serveur : les moteurs déterministes ne sont pas un goulot d'étranglement. Le temps utile viendra des **appels IA** (secondes à minutes), non mesurés ici.
- **P-2 (P2)** **123,5 Ko de CSS par page**, identiques pour tous les sites, y compris pour une page de 6,5 Ko de HTML : coût probable sur mobile (≈ 20 fois le HTML). À vérifier avec compression, cache HTTP (`Cache-Control`) et couverture CSS réelle dans un navigateur.
- **P-3 (P3)** Démarrage à froid d'un serveur de test long (≈ 70 s, migrations sur machine chargée) : sans effet pour la production, mais allonge le laboratoire (~3 min). Piste : base de départ pré-migrée pour les tests.
- **P-4 (non mesuré)** Mémoire, temps de génération d'images, temps de première peinture : à mesurer au palier suivant (Playwright + Lighthouse en mode local, sans toucher à la production).

## Reproduire
`node tests/quality-lab/lab.js` ; les durées sont dans `results.json` (`timings`, `pages[].ms`).
