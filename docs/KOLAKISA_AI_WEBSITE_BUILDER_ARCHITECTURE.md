# Architecture de l'AI Website Builder — état réel (22.10)

```
Brief ─► Brief Analyzer (ai/builder/brief.js : règles + modèle simulé)
      ─► Site Planner (planner.js, plans.js, registry.js)           ─► plan validé
      ─► Page Generator (src/pageGen : plan → sections natives, Component Mapper)
      ─► Design Generator (src/designGen : palette, polices, jetons → personnalisateur du site)
      ─► Content Generator (src/contentGen : voix, faits, anti-invention, SEO, localisation)
      ─► Media (src/aiMedia : besoins, tâches, fournisseur, médiathèque)
      ─► Studio 8 étapes (marketing/web/aiBuilder.js + ai/builder/workspace.js)
      ─► Publication native (pages.publish, confirmation serveur)
Régénération (src/regen 21.9) · Boutique IA (ai/shop 21.10) · Mises en page (src/layoutGen 22.3) · Intelligence éditoriale (src/contentIntel 22.6)
AI Core (src/ai : adaptateurs Anthropic/OpenAI/Gemini/Mistral, routeur, quotas, journal)
```
Stockage : tables du CMS (pages, sections, SEO, médiathèque, personnalisateur) + métadonnées `mk_ai_*`, `mk_ci_*`, instantanés `regen`. Aucun format propriétaire de page.

## Branchements réels vs prévus
| Lien | État |
|---|---|
| Studio → Page Generator, Design, Content, Media, publication | ✅ branché |
| Studio → AI Core | ⛔ seul le Media l'utilise |
| Studio → Régénération 21.9 / Boutique 21.10 | ⛔ non branchés (écrans séparés) |
| Page Generator → layoutGen (22.3) | ⛔ non branché |
| Studio → contentIntel (22.6) | ⛔ non branché ; l'écran `contenu-seo` est autonome |
| Parcours guidé → boutique native | ⛔ produit un catalogue de formations |
| Publication → détection des textes d'exemple | ⛔ absente |

Pour 22.2, 22.4, 22.5, 22.7, 22.8, 22.9 : **aucun composant** (voir `KOLAKISA_PROGRAMME22_IMPLEMENTATION_STATUS.md`).
