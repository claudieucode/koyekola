# Programme 21 — matrice de conformité et d'intégration

Statuts : OPÉRATIONNEL · PARTIELLEMENT OPÉRATIONNEL · NON OPÉRATIONNEL · NON IMPLÉMENTÉ · BLOQUÉ PAR UNE DÉPENDANCE. Niveau de validation : **T** test automatisé exécuté · **L** code lu · **D** document seul. « Simulé » = fournisseur IA simulé, aucun appel réel.

| Palier | Fonction | Emplacement | Statut | Dépendances | Tests (exécutés) | Limites | Validation |
|---|---|---|---|---|---|---|---|
| 21.1 | Références et architecture | `docs/…21_1_*` | OPÉRATIONNEL | — | — | documentaire | D |
| 21.1 | AI Orchestrator | `ai/builder/workspace.js` | PARTIELLEMENT | studio | tests studio | pas de module nommé | L,T |
| 21.2 | Adaptateurs Anthropic/OpenAI/Gemini/Mistral | `src/ai/adapters` | PARTIELLEMENT | clés | `ai-core-adapters` 8/8 (simulé) | jamais appelés en réel | T |
| 21.2 | Registre de modèles, routage, quotas, coûts, journal | `src/ai/{models,router,usage}.js` | OPÉRATIONNEL | migration 116 | `ai-core` 48/48 | coût réel jamais confirmé ; aucun modèle d'image | T |
| 21.2 | Branchement en production | `getAiCore()` | PARTIELLEMENT | — | — | utilisé seulement par les médias | L |
| 21.3 | Analyse de brief, questions, classification | `ai/builder/brief.js` | OPÉRATIONNEL | module IA + clé | `programme21-3-*` 30 (simulé) | qualité réelle non évaluée | T |
| 21.3 | Plan, navigation, validation | `planner.js`, `plans.js` | OPÉRATIONNEL | migration 117 | idem + vitrine 8 | idem | T |
| 21.4 | Génération de pages natives | `src/pageGen` | OPÉRATIONNEL | plan validé | `page-generator` 26 | composants absents signalés | T |
| 21.4 | Component Mapper / validation | `pageGen/{registry,mapper}.js` | OPÉRATIONNEL | `sections.TYPES` | idem | pas de galerie/produits natifs | T |
| 21.5 | Palettes, typo, jetons, responsive | `src/designGen` | OPÉRATIONNEL | personnalisateur | `design-generator` 25 | pas de mode sombre | T |
| 21.5 | Préservation des réglages manuels | `designGen/index.js` | OPÉRATIONNEL | — | idem | détection par comparaison au défaut | T |
| 21.6 | Contenus, voix, SEO, localisation | `src/contentGen` | OPÉRATIONNEL | module IA + clé | `programme21-6-*` 30 (simulé) | fr/en prioritaires | T |
| 21.6 | Anti-invention, champs verrouillés | `facts.js`, `validate.js` | OPÉRATIONNEL | — | idem + vitrine | — | T |
| 21.7 | Besoins visuels, tâches, historique, quotas | `src/aiMedia` | OPÉRATIONNEL | migration 116 | `ai-media` 21 | — | T |
| 21.7 | Génération d'images réelle | `aiMedia/providers.js` | **NON OPÉRATIONNEL (non vérifié)** | clé + autorisation | testé contre faux serveur | jamais appelé en réel | T |
| 21.7 | Textes alternatifs par analyse d'image | — | NON IMPLÉMENTÉ | modèle de vision | — | alt déduit de la demande | — |
| 21.7 | AVIF, antivirus | — | NON IMPLÉMENTÉ | — | — | WebP à la demande seulement | — |
| 21.8 | Studio 8 étapes, état calculé | `web/aiBuilder.js` | OPÉRATIONNEL | module IA | `programme21-8-ai-builder-http` 28 | navigateur réel non exécuté | T |
| 21.8 | Assistant (5 intentions + conseils) | `ai/builder/assistant.js` | PARTIELLEMENT | — | idem | règles locales | T |
| 21.8 | Publication native avec confirmation | `workspace.publishAll` | OPÉRATIONNEL (corrigé 21.11) | `pages.publish` | studio + vitrine | — | T |
| 21.9 | Context Resolver, Impact/Dependency Analyzer | — | **NON IMPLÉMENTÉ** | — | — | — | — |
| 21.9 | Snapshots, comparaison, restauration globale | — | **NON IMPLÉMENTÉ** | — | — | restaurer une page : versions natives des pages | — |
| 21.9 | Régénération sélective | `contentGen` (`only` + `scope`) | PARTIELLEMENT | — | vitrine (une section) | par section, pas par intention globale | T |
| 21.9 | Annuler/rétablir | plan (studio), pages, design, contenus (par champ) | PARTIELLEMENT | — | tests studio | pas de pile globale | T |
| 21.10 | Store/Product Structure Planner | — | **NON IMPLÉMENTÉ** | catalogue produits | — | — | — |
| 21.10 | Catalogue produits, variantes, livraison, taxes | — | **BLOQUÉ PAR UNE DÉPENDANCE** | n'existe pas dans le CMS | `programme21-international-migrations` (registre) | aucune table produit/expédition/taxe | T |
| 21.10 | Panier / paiement | `node:cart` | PARTIELLEMENT | Stripe | — | **formations seulement** | L |
| 21.11 | Sécurité et isolation multisite des moteurs | — | OPÉRATIONNEL | — | `programme21-securite-multisite` 4 | — | T |
| 21.11 | Scénario vitrine de bout en bout | — | OPÉRATIONNEL (simulé) | — | `programme21-integration-vitrine` 8 | pas de navigateur | T |
