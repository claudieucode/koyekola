# Programme 21 — architecture finale (état réel)

## Moteurs et responsabilités (aucun doublon de responsabilité constaté)
| Moteur | Code | Rôle | Sortie consommée par |
|---|---|---|---|
| Brief Analyzer, Site Planner | `src/marketing/ai/builder/{brief,planner,plans,registry,locale,contracts}.js` | brief → analyse → plan validé (`mk_ai_plans`) | studio, pont de pages |
| Pont plan → pages | `ai/builder/bridge.js` (`toPageGenPlan`) | traduit les sections du plan en genres du Page Generator | Page Generator |
| Page Generator, Component Mapper | `src/pageGen/` | plan v1 → sections NATIVES validées (`normalizeSections`), brouillons | moteur de pages |
| Design Generator | `src/designGen/` | brief → 3 directions vérifiées → réglages du PERSONNALISATEUR (brouillon) | personnalisateur, Page Generator (`appliedLayout`) |
| Content Generator | `src/contentGen/` | textes dans les CHAMPS natifs, SEO, localisation, anti-invention | pages (brouillon) |
| Media Generator, Asset Manager | `src/aiMedia/` | besoins visuels, tâches asynchrones, provenance, affectation | médiathèque native, pages |
| Interface | `ai/builder/{workspace,assistant}.js`, `web/aiBuilder.js`, `views/marketing/ai-builder*.ejs`, `public/js/ai-builder.js` | 8 étapes, état calculé, annuler/rétablir, assistant à règles | utilisateur |
| AI Core | `src/ai/` | fournisseurs, registre, routage, quotas, journal | médias (quotas/journal/config) ; contenus en option (`viaCore`) |
| Socle IA historique | `services/aiCore.js`, `marketing/ai` (`ai.call`) | appel Anthropic, plafond quotidien, module « ia » par site | brief, plan, contenus, design (option) |

## Flux réels
`brief` → `analyzeBrief` → questions → `createPlan` → `validate` → `validatedPlan` (seule porte) → `bridge` → `pageGen.generate/apply` (brouillons) → `designGen.generate/apply` (brouillon du personnalisateur) → `contentGen.generatePage/accept/apply` → `aiMedia.plan/start/assign` → aperçu natif → `pages.publish`. Chaque étape lit l'état de la précédente en base ; aucune ne dépend de l'ordre d'appel (reprise possible à tout moment).

## Structures de données : natives d'abord
Pages = `mk_landing_pages.sections` (aucun format parallèle) ; styles = jetons du site via le personnalisateur ; médias = `mk_media` + chemin natif ; menus = `services/navigation`. Les tables propres au programme 21 sont des **états de travail** (plans, runs, ensembles de contenus, tâches, métadonnées de provenance), toutes rattachées au site.

## Écarts d'architecture (à connaître)
1. **Deux socles IA coexistent** : `services/aiCore` + `ai.call` (en service) et `src/ai` (AI Core, non branché pour le texte). Le Content Generator sait utiliser l'un ou l'autre (`gateway`), le reste utilise `ai.call`. Pas de duplication de responsabilité mais une migration à terminer.
2. **Trois chemins vers « OpenAI »** : connecteur (clés), adaptateur texte de l'AI Core, adaptateur image de `aiMedia` (qui réutilise la couche réseau et les clés du connecteur). Responsabilités distinctes.
3. **Deux réalisations de l'interface 21.8** ont existé ; seule celle du studio est déployée (la mienne reste en archive).
4. **Aucun appel de fournisseur depuis le navigateur** (recherche dans `public/` et `views/` : aucun hôte de fournisseur). Aucune dépendance circulaire problématique observée (chargement paresseux des modules qui touchent la base).
5. **AI Orchestrator** : pas de module nommé ainsi ; l'orchestration est dans `workspace.js` (studio).
