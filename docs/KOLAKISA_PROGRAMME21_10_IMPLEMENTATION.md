# KOLAKISA — Programme 21.10 : constructeur de boutique par IA (implémentation)

*Branche `feat/programme-21-10-ecommerce-builder`, issue de `origin/main` + fusion de `feat/programme-20-5-ecommerce`. 2026-10-30.*

## 1. Audit préalable : l'état RÉEL
| Élément | État vérifié |
|---|---|
| Moteur e-commerce « natif » | **N'était pas sur `main`** : seul le commerce des formations (`routes/cart.js`, `orders`) y existait. Le moteur (`src/marketing/shop`, migration 121 : catégories, produits simples/variables/numériques, variantes, stock + journal, panier, clients, zones et méthodes de livraison, règles de taxe sans taux par défaut, coupons, commandes, Stripe en test + paiement manuel) est sur la branche 20.5 : **fusionné ici** (prérequis). |
| Programme 21.9 (régénération, historique) | **Absent** : la branche existe mais n'a aucun commit. Les exigences « historique compatible 21.9 » sont donc couvertes par un historique propre au projet (voir §4). |
| 21.3 à 21.8 | Sur `main` : planificateur, générateurs de pages / design / contenus / médias, interface « Assistant IA » (réutilisée : charte, structure, mécanismes). L'AI Core 21.2 n'est branché sur aucun module (inchangé). |
| Limites déclarées du moteur (20.5) | Pas d'import CSV natif, pas de modification en masse, pas d'avis, pas de produits téléchargeables, pas de schema.org produit, pas de gros ni de dropshipping, pas de génération d'images de produits (21.7 : bandeaux et sections « Image » seulement). **Le constructeur ne simule aucune de ces fonctions.** |

## 2. Principe
Le constructeur **ne contient aucune logique commerciale**. Il prépare des BROUILLONS (analyse, plan, structure, produits, configuration), les fait valider par la personne, puis les écrit dans le moteur **uniquement par ses services natifs** (`catalog.saveCategory`, `catalog.createProduct`, `store.saveSettings`…), de façon idempotente. Prix, stocks, taxes, tarifs, délais, SKU et clés de paiement ne sont **jamais proposés par l'IA** : ils sont saisis par la personne.

## 3. Composants (correspondance avec la liste du programme)
| Composant demandé | Réalisé par | État |
|---|---|---|
| AI E-commerce Orchestrator | `ai/shop/project.js` | ✔ |
| E-commerce Brief Analyzer + Business Model Analyzer | `ai/shop/analyzer.js` (**à règles, sans IA**), `capabilities.js` | ✔ |
| Store Planner | `planner.js` | ✔ |
| Product Structure Planner + Category Planner | `structure.js`, `library.js` (9 secteurs) | ✔ |
| Product Content Generator | `products.js` (gabarit sans IA ; IA facultative via `ai.call`, filtrée par `contentGen.facts.guard`) | ✔ |
| Product Media Planner | association d'images de la **médiathèque** au produit (`assignImage`) | **partiel** : pas de génération d'images de produits |
| Product Page Generator | — | **non fait** : la fiche produit est la page **native** du moteur ; aucun composant parallèle |
| Store Design Planner | `designGen` (catégorie « boutique ») via `project.generateDesign` | ✔ (réutilisation) |
| Commerce Configuration Assistant | `config.js` | ✔ (valeurs saisies seulement) |
| Store Validation Engine + Deployment Validator | `validation.js`, garde de `project.publish` | ✔ |
| Interface (12 étapes) + assistant contextuel | `web/aiShop.js`, `ai-shop.ejs`, `public/js/ai-shop.js`, `ai/shop/assistant.js` (à règles) | ✔ |
| Migration | `122_ia_boutique.sql` (3 tables additives) | ✔ |

## 4. Historique (en l'absence de 21.9)
`mk_ai_shop_events` (qui, quoi, révision) et `mk_ai_shop_states` (annuler/rétablir sur 30 niveaux) couvrent **les brouillons du projet seulement**. Pas de comparaison de versions ; **pas de restauration d'un produit déjà créé** (le catalogue se gère dans l'administration de la boutique, qui garde son propre journal de stock). À brancher sur 21.9 quand il existera.

## 5. Incidents de procédure
Un test d'interface ne détectait pas qu'une étape plantait au rendu (l'ancien titre restait affiché) : corrigé en exigeant que le titre corresponde à l'étape et qu'aucune erreur de script ne soit levée. Le bouton « Nouveau produit » passait l'événement de clic comme produit : corrigé.

## 6. Statut : voir `KOLAKISA_PROGRAMME21_10_REMAINING_ISSUES.md` (VALIDÉ AVEC RÉSERVES)
