# Programme 21.3 — Brief Analyzer et Site Planner : implémentation

Branche `feat/programme-21-3-brief-planner` (issue de `docs/programme-21-1-ai-website-builder`, elle-même issue de `origin/main` `bd794900`). Rien fusionné, rien déployé.

## 1. Constat initial (audit demandé au point 1)
- **Programme 21.2 (AI Core) : non exécuté** (aucune branche, aucun document). Il n'existe donc ni registre de modèles, ni routeur de fournisseurs, ni interface d'adaptateur.
- Ce qui existe et fait office de socle réel : `aiCore.runJson` (SDK Anthropic, sortie JSON par schéma), `ai.call` (module « ia » par site, plafond quotidien d'organisation, clé du centre de connecteurs puis `ANTHROPIC_API_KEY`, journal `mk_ai_requests` sans texte). **Ce palier s'appuie sur ce socle et ne crée pas de seconde infrastructure IA.** Les clés restent côté serveur.
- Écarts du 21.2 qui subsistent (voir REMAINING_ISSUES) : fournisseur unique (Anthropic), modèle codé en dur, pas de registre de modèles, pas de coût estimé, plafond par organisation (pas par site).

## 2. Livré
| Élément | Fichier |
|---|---|
| Registre des capacités réelles | `src/marketing/ai/builder/registry.js` |
| Contexte local (pays, devise, fuseau, langue) | `src/marketing/ai/builder/locale.js` |
| Contrats versionnés + schémas du modèle | `src/marketing/ai/builder/contracts.js` |
| Brief Analyzer | `src/marketing/ai/builder/brief.js` |
| Site Planner + rapprochement avec le registre | `src/marketing/ai/builder/planner.js` |
| Plans : enregistrement, modification, validation, historique | `src/marketing/ai/builder/plans.js` |
| API JSON `/marketing/ia/site/…` | `src/marketing/web/aiPlanner.js` (monté dans `web/index.js`) |
| Migration 117 (`mk_ai_plans`, `mk_ai_plan_events`) | `src/marketing/migrations/117_plans_de_site_ia.sql` |
| Tests | `tests/programme21-3-brief-planner.test.js`, `…-http.test.js` |

## 3. Fichiers existants modifiés (changements minimes)
- `src/marketing/web/index.js` : montage de la route.
- `src/marketing/web/routeScopes.js` : deux lignes (`ia-plans-de-site`, règle `param` + famille `site`), exigées par le test `portee-des-routes`.
- `src/marketing/audit.js` : `ai_plan` ajouté à `SITE_OF` (le journal d'audit rattache l'événement au site du plan).
- `src/marketing/ai/index.js` : libellés d'actions `brief` et `plan` (écran de consommation).
- `tests/site-menu-p1a.test.js` : plafond de migration 114 → 117 (le test était déjà périmé par la 115 de `main`).

## 4. Hors périmètre volontaire
Aucune page, aucun menu, aucun style, aucune image n'est créé. Pas d'interface (palier 21.8) : l'API JSON est la seule surface. Aucun appel à un vrai fournisseur n'a été fait.

## 5. Utilisation (API)
`POST /ia/site/analyser {brief}` → `POST /ia/site/plans/:id/reponses {answers}` (facultatif) → `POST …/planifier {proceedWithAssumptions?}` → `POST …/modifier {revision, operation}` → `POST …/valider {revision}`. Lecture : `GET /ia/site/plans`, `GET /ia/site/plans/:id`. Droits : `forms.read` / `forms.write`. Un accès limité à un site est toujours rattaché à SON site.
