# Moteur de performance (Performance Intelligence Core)

Module `src/perfEngine/`. Déterministe, sans IA, sans réseau externe.

| Composant demandé | Réalisation |
|---|---|
| Performance Intelligence Core | `index.js` : `analyzePage`, `history`, `compareReports`, `overview`, `settings/setOption/log` |
| Website / Resource / Rendering / JS / CSS / Image / Network Analyzer | `htmlAnalyzer.js` (une seule passe de l'analyseur HTML du produit, `htmlparser2`) : DOM, images, scripts, feuilles, polices, iframes, vidéos, domaines externes |
| Core Web Vitals Analyzer | `vitals.js` (seuils, notation, étiquetage de l'origine) |
| Optimization Recommendation Engine | `recommend.js` (22 règles) |
| Performance Regression Detector | `regress.js` |
| Optimization Validation Engine | tests `programme22-9-*` + mesures de laboratoire `tests/manuel/perf-*.js` |
| Cache Performance Analyzer | **partiel** : en-têtes de la page lus et rapportés ; pas de cache de pages (voir `KOLAKISA_ADVANCED_CACHING_ENGINE.md`) |

## Principes
1. Chaque métrique porte `kind` (**mesure** / **estimation** / **indisponible**), `env` (analyse-statique, laboratoire, terrain, serveur) et `source`.
2. LCP/INP/CLS ne sont **jamais** déduits du HTML : `indisponible`. Seul le candidat LCP est une *estimation* (première grande image du `<main>`).
3. Aucun score global n'est calculé ; le tableau de bord compte des constats.
4. Les poids JS/CSS locaux sont **lus sur le disque** et compressés (gzip 6) ; un fichier introuvable est « non mesuré », jamais inventé.
5. L'analyse lit le HTML réellement servi (requête locale sur une page publiée du site, jamais une adresse fournie par l'utilisateur).
6. Isolation : chaque lecture/écriture est bornée par `siteGuard` + `organization_id` + `site_id`.
