# Programme 22.6 — Advanced Content Intelligence & SEO Quality Engine : implémentation

Branche `feat/programme-22-6-content-seo`, issue de `origin/main` (3abf0fd1). Aucune migration : les tables `mk_ci_*` sont créées à la demande (même choix que 21.4 à 21.10 : les numéros de migration se télescopent entre sessions et plusieurs tests figent le dernier). Retour arrière : `DROP TABLE` des six tables `mk_ci_*`.

## 1. Audit initial (état réel, vérifié dans le code)
| Besoin du programme | Existant sur `main` | Décision |
|---|---|---|
| Moteur SEO (title, description, canonical, robots, OG, Twitter, JSON-LD, sitemap, robots.txt, redirections, 404, audit 41 règles, historique) | `src/seo/` (≈ 4 800 lignes), `docs/KOLAKISA_SEO_AUDIT.md`, `SEO_CORE.md` | **Réutilisé, non dupliqué.** Le calcul du `<head>` reste dans `seo/resolver.js` |
| Champs SEO d'une page | `seo { title ≤ 70, description ≤ 160, canonical, noindex…, focusKeyword, schemaType }` dans le brouillon | Lus tels quels |
| Voix de marque | `contentGen/voice.js` (orientations, formalité, longueur, vocabulaire, tu/vous, termes à éviter), `mk_content_voice` par site | **Réutilisée** (évaluation de la cohérence) |
| Anti-invention | `contentGen/facts.js` (`buildContext`, `guard`) | **Réutilisée** pour détecter les affirmations non étayées |
| Génération de contenu, SEO de contenu, localisation | `contentGen/engine.js`, `seo.js`, `localize.js` (21.6) | **Non reconstruits** |
| Réécriture avant/après, acceptation, refus, annulation, historique, restauration | `src/regen` (21.9) | **Réutilisés** pour l'assistant d'optimisation |
| Suggestions de liens internes | `seo/linkSuggestions.js` | Réutilisé ; ajout de la décision persistée |
| Search Console / PageSpeed / GA4 | `seo/integrations.js` (central) | Lus (état réel), non modifiés |
| Intention de recherche | **absente** | Créée |
| Lisibilité | **absente** | Créée |
| Score de qualité sur 14 critères | **absent** (l'audit SEO note la technique, pas l'éditorial) | Créé |
| Relations entre traductions, contrôle hreflang | **absents** (aucune occurrence de `hreflang`) | Créés (calcul et validation) |
| Décision sur chaque lien proposé, application au brouillon | absente | Créée |
| Registre de sources avec provenance | absent (21.6 : `volume` toujours `null`) | Créé |

Problèmes de contenu constatés (22.1) : le dépôt ne contient pas de rapport 22.1 ; aucun constat n'a donc été repris. Les problèmes traités sont ceux que les analyseurs détectent sur de vrais contenus (voir `KOLAKISA_PROGRAMME22_6_TESTS.md`).

## 2. Livré (`src/contentIntel/`)
| Composant demandé | Fichier |
|---|---|
| Content Intelligence Core (orchestration) | `index.js` |
| Content Structure Planner (12 genres) | `kinds.js` |
| Content Intent Analyzer | `intent.js` |
| Content Quality Evaluator (14 critères) | `quality.js` (+ `readability.js`, `technical.js`) |
| Content Consistency Validator | `quality.js` (adresse, termes à éviter, longueur de phrases) |
| Content Optimization Engine | `presets.js` → `regen.propose` |
| Content Version Manager | `src/regen` (21.9) + version de page prise avant chaque lien accepté |
| Internal Linking Intelligence | `linking.js` |
| Multilingue / hreflang | `i18n.js` |
| SEO Data Providers | `providers.js` |
| Extraction du contenu natif | `text.js` |
| Stockage | `store.js` |

Routes, écran : `src/marketing/web/contentIntel.js`, `views/marketing/site-content-intel.ejs`, `public/js/content-intel.js`, `public/css/content-intel.css`. Lien depuis la vue générale SEO du site. Montage dans `src/marketing/web/index.js`.

## 3. Ce qui n'est PAS fait
Voir `KOLAKISA_PROGRAMME22_6_REMAINING_ISSUES.md`.
