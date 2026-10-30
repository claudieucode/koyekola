# Contrats de données — Programme 21.3

Tous les objets portent `contract` et `version` (actuellement 1). Un objet d'une autre version est refusé par le planificateur (`contract_version`) : les fiches enregistrées gardent leur version, une évolution = nouvelle version, jamais une réécriture silencieuse.

## 1. Schémas demandés au modèle (stricts : champs requis, `additionalProperties:false`)
Définis dans `contracts.js` (`analysisSchema()`, `planSchema()`). Le serveur ne fait jamais confiance au résultat : tout passe par `normalize` / `reconcile`.

## 2. BriefAnalysis v1 (`kolakisa.brief-analysis`)
| Champ | Contenu |
|---|---|
| `original` | brief tel que reçu (assaini, ≤ 6 000 car.) |
| `language` | `brief`, `detectedByRules`, `site` (fait), `supported`, `supportedLanguages` |
| `project` | `name`, `siteType` (clé fermée), `secondaryTypes[]`, `siteTypeLabel`, `sector`, `audience`, `city`, `country` (fait + `code` + `context`) |
| `identity` | `tone`, `formality`, `style`, `typography`, `colors[]` |
| `goals[]` | `{key, label, status, confidence, evidence}` ; clés : presenter, vendre, prospects, devis, publier, portfolio, former, reserver, informer, contacter |
| `features[]` | `{key, label, status, confidence, evidence, reason, availability, availabilityReason, module}` |
| `pagesRequested[]` | `{name, evidence}` |
| `assumptions[]` | `{field, value}` — tout fait de statut « assumed » |
| `contradictions[]` | `{code, description, evidence, source: rule|model}` |
| `missing[]` | `{topic, why, blocking}` |
| `questions[]` | `{id, topic, question, why, blocking, skippable, choices[]}` (5 au plus) |
| `confidence` | moyenne des confiances de type/secteur/public/pays (0 à 1) |
| `readiness` | `{level: ready|blocked|insufficient, blocking[]}` |
| `warnings[]` | `{code, level: info|warning|error, message, field?}` |

**Fait** : `{value, status: explicit|inferred|assumed|unknown, confidence, evidence}`. `evidence` n'est conservée que pour « explicit » et a été retrouvée dans le brief.

**Contexte pays** : `{code, known, name, currency, otherCurrencies[], timezones[], languages[], payments:"unverified", legal:"unverified", note}`.

## 3. SitePlan v1 (`kolakisa.site-plan`)
- `site` : `name`, `nameIsProvisional`, `nameEdited?`, `description`, `type`, `typeLabel`, `secondaryTypes[]`, `sector`, `audience`, `language`, `country`, `countryName`, `goals[]`.
- `pages[]` : `key`, `name`, `slug`, `purpose`, `description`, `pageType`, `availability`, `priority` (essential|recommended|optional), `origin` (user|ai), `menu` (main|secondary|footer|none), `position`, `parent`, `relatedTo[]`, `sections[]`.
- `pages[].sections[]` : `key`, `type`, `purpose`, `description`, `expectedContent`, `widgets[]` (éléments existants), `unknownWidgets[]` (rejetés), `importance`, `requiredData[]`, `dependsOn[]`, `origin`, `position`, `availability` (available|partial|unavailable), `missing[]`.
- `navigation` : `{main[], secondary[], footer[]}` (clés de pages).
- `features[]` : `key`, `label`, `level` (required|recommended|optional), `origin`, `reason`, `availability`, `availabilityReason`, `module`, `acknowledged`, `addedByUser?`.
- `modules[]` : `{key, enabled}` pour le site visé. `removedFeatures[]`, `acknowledged[]`, `rejectedRecommendations[]`.
- `conversions[]` : `{action, pageKey, label}` ; actions : acheter, devis, reserver, inscrire, telecharger, contacter, lire, catalogue.
- `recommendations[]` : `{id, text, why, feature, availability, origin:"ai", accepted}`.
- `assumptions[]`, `proceededWithAssumptions`, `warnings[]`, `summary {pages, sections, unavailableSections, errors, warnings}`.

## 4. PagePlan v1 (`kolakisa.page-plan`)
`page {key, name, slug, pageType, menu, parent}`, `goal`, `sections[] {key, type, purpose, importance, availability, components {section, widgets[]}, expectedContent, requiredData[], responsive[]}`, `requiredComponents[]`, `requiredData[]`. Produit uniquement à partir d'un plan **validé**.

## 5. Stockage
`mk_ai_plans(id, organization_id, site_id, user_id, status, revision, contract_version, brief_text, answers_json, analysis_json, plan_json, created_at, updated_at, validated_at)` ; `mk_ai_plan_events(plan_id, action, summary, revision, user_id, created_at)`. `status` contraint par CHECK ; `revision` protège les écritures concurrentes.

## 6. Codes d'erreur
`brief_empty`, `brief_too_short`, `brief_too_long` (400/413), `brief_insufficient`, `brief_blocked`, `plan_invalid` (422), `not_validated`, `conflict` (409), `not_found` (404), `forbidden`/`module_disabled` (403), `not_configured` (503), `quota`/`rate` (429), `format` (502), `contract_version`, `limit`, `invalid_field`.
