# Programme 21 — architecture finale (état réel)

## Moteurs et responsabilités
| Moteur | Code | Rôle |
|---|---|---|
| Brief Analyzer, Site Planner | `src/marketing/ai/builder/{brief,planner,plans,registry,locale,contracts}.js` | brief → analyse → plan validé (`mk_ai_plans`) |
| Pont plan → pages | `ai/builder/bridge.js` | sections du plan → genres du Page Generator |
| Page Generator, Component Mapper | `src/pageGen/` | plan v1 → sections NATIVES validées, brouillons |
| Design Generator | `src/designGen/` | 3 directions vérifiées → brouillon du PERSONNALISATEUR |
| Content Generator | `src/contentGen/` | textes dans les champs natifs, SEO, localisation, anti-invention |
| Media Generator, Asset Manager | `src/aiMedia/` | besoins visuels, tâches, provenance, affectation |
| Interface (studio) | `ai/builder/{workspace,assistant}.js`, `web/aiBuilder.js` | 8 étapes, état calculé, annuler/rétablir du plan |
| Régénération et historique (21.9) | `src/regen/`, `web/regeneration.js` | demande → contexte → impact → portée → régénération sélective, snapshots, comparaison, restauration, conflits, protections |
| Moteur de boutique natif (20.5) | `src/marketing/shop/`, `web/{shopAdmin,shopPublic}.js`, migration 121 | catalogue, panier, commandes, paiement (Stripe + manuel), clients |
| Constructeur de boutique par IA (21.10) | `src/marketing/ai/shop/`, `web/aiShop.js`, migration 122 | brief commercial → plan → structure → produits (brouillons) → config → validation → publication |
| AI Core | `src/ai/` | fournisseurs, registre, routage, quotas, journal |
| Socle IA historique | `services/aiCore.js`, `marketing/ai` (`ai.call`) | appel Anthropic, plafond quotidien, module « ia » par site |

## Flux réels
Vitrine : `brief → analyzeBrief → questions → createPlan → validate → validatedPlan → bridge → pageGen → designGen → contentGen → aiMedia → aperçu natif → pages.publish`.
Boutique : `brief commercial → ai/shop analyzer → planner → structure → catégories natives → produits en BROUILLON (prix saisis, jamais inventés) → config (paiement, livraison, taxes saisis) → validation (aucun achat d'essai) → publication guidée (produits complets, pages, ouverture de la boutique sur demande)`.
Régénération : `regen.analyzer → context → impact → plan de portée → snapshot → moteur du palier concerné (contenus/médias/design) → conflits → historique`.

## Structures natives d'abord
Pages = `mk_landing_pages.sections` ; styles = jetons du site (personnalisateur) ; médias = `mk_media` ; catalogue = tables du moteur Boutique ; menus = `services/navigation`. Les tables propres au programme 21 sont des états de travail rattachés au site.

## Écarts d'architecture
1. **Deux socles IA** (`ai.call` en service, `src/ai` non branché pour le texte) ; pas de modèle d'image dans le registre de l'AI Core.
2. **Deux planificateurs** : le Site Planner général (registre sans boutique) et le planificateur de boutique (21.10) ; deux assistants à règles (studio, boutique) et un troisième pour la régénération.
3. **Piles d'annulation séparées** (plan du studio, régénération 21.9, brouillons de boutique 21.10, versions de champs de contenu, annulation des générations de pages/design) ; aucune pile unifiée.
4. **Aucun appel de fournisseur depuis le navigateur** ; chargement paresseux des modules qui ouvrent la base ; pas de dépendance circulaire problématique observée.
5. **Interface 21.8 réalisée deux fois** (une seule déployée).
