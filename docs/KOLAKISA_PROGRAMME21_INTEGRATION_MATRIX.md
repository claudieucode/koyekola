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
| 21.9 | Context Resolver, Dependency/Impact Analyzer | `src/regen/{context,engine}.js` | OPÉRATIONNEL (règles) | pages, contenus, médias, design | `programme21-9-regeneration` 28, `-http` 6 | langage naturel à règles ; dépendance « couleur de design » estimée | T |
| 21.9 | Snapshots, comparaison, restauration, conflits | `regen/{snapshots,compare,restore}.js` | OPÉRATIONNEL | tables à la demande | idem | **catalogue non couvert** ; chemins de médias seulement | T |
| 21.9 | Régénération sélective + protections | `regen/{engine,protect}.js` | PARTIELLEMENT | Content Generator, médias, design | idem + vitrine (une section) | protections non consultées par pagegen/designgen/médias appelés directement | T |
| 21.9 | Annuler/rétablir | `regen` + plan (studio) + moteurs | PARTIELLEMENT | — | idem | **pas de pile unifiée** ; aucun lien depuis le studio | T |
| 20.5 | Moteur de boutique natif (catalogue, variantes, stock, panier, commandes, clients) | `src/marketing/shop`, migration 121 | OPÉRATIONNEL | module Commerce | `programme20-5-boutique-moteur` 42, `-serveur` 29, `-builder` 12 | Stripe jamais vérifié contre le vrai service ; seul l'euro testé | T |
| 20.5 | Paiement | `shop/payments.js` | PARTIELLEMENT | clés serveur | `-serveur` (faux Stripe, webhook signé, montant falsifié refusé, remboursement) | carte désactivée sans clés ; manuel possible | T |
| 21.10 | Analyse du modèle commercial, plan, structure | `ai/shop/{analyzer,planner,structure}.js` | OPÉRATIONNEL (règles) | moteur Boutique | `programme21-10-ecommerce-builder` 30, `-http` 16 | gros/dropshipping non pris en charge | T |
| 21.10 | Produits en brouillon, variantes, CSV, anti-invention | `ai/shop/{products,csv}.js` | OPÉRATIONNEL | catalogue natif | idem | pas de fiche produit générée ; variantes à stock 0 sans SKU | T |
| 21.10 | Images de produits générées | — | NON IMPLÉMENTÉ | 21.7 ne couvre pas les produits | — | association d'images existantes seulement | — |
| 21.10 | Configuration paiement/livraison/taxes | `ai/shop/config.js` | OPÉRATIONNEL | droit « paiements » | idem | valeurs saisies ; aucune règle locale fournie | T |
| 21.10 | Validation et publication guidée | `ai/shop/{validation,project}.js` | OPÉRATIONNEL | — | idem | « prête » d'après la configuration : **aucune commande d'essai** | T |
| 21.10 | Prévisualisation du catalogue / panier / checkout | boutique publique | PARTIELLEMENT | — | `-serveur` (panier, commande, Stripe simulé) | pas d'aperçu intégré, navigateur non exécuté | T |
| 21.10 | Planificateur général ↔ boutique | `ai/builder/registry.js` | **NON ALIGNÉ** (I1) | — | `programme21-3` | le Site Planner déclare la boutique indisponible | L,T |
| 21.11 | Sécurité et isolation multisite des moteurs 21.3-21.8 | — | OPÉRATIONNEL | — | `programme21-securite-multisite` 4 | — | T |
| 21.11 | Sécurité et isolation 21.9 et 21.10 | — | OPÉRATIONNEL | — | `programme21-securite-regen-boutique` 3 + `r7-coherence-moteurs` 6 | — | T |
| 21.11 | Scénario vitrine de bout en bout | — | OPÉRATIONNEL (simulé) | — | `programme21-integration-vitrine` 8 | pas de navigateur | T |
