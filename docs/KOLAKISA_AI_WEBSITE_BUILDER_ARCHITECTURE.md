# Architecture cible — Kolakisa AI Website Builder

Principe : **une couche d'assistance au-dessus du CMS existant**. Aucun second CMS, éditeur ni moteur de rendu. Module unique `src/marketing/ai/builder/` (application modulaire, pas de microservices), qui réutilise `ai.call`, `aiCore`, `pages/*`, `siteModules`, `ctx.siteScope`.

## 1. Flux

```
Brief → Analyse → Plan → [validation humaine 1] → Génération → Validation stricte
      → Aperçu (copie, rien d'écrit) → [validation humaine 2] → Enregistrement atomique (brouillon)
      → Édition native → (Publication = action humaine séparée, jamais l'IA)
```

L'IA ne publie jamais. Le résultat est écrit en **brouillon** (comme les packs de site).

## 2. Responsabilités (modules d'un même dossier)

| Rôle | Fichier prévu | Entrée → sortie | Réutilise |
|---|---|---|---|
| AI Orchestrator | `orchestrator.js` | demande + `ctx` → exécution par étapes, état, reprise | `ai.call` (plafond, journal, module par site) |
| Brief Analyzer | `brief.js` | texte libre + options → `Brief` | `aiCore.runJson` |
| Site Planner | `planner.js` | `Brief` → `SitePlan` | `sitePacks` comme exemples de structure |
| Page Planner | `planner.js` | `SitePlan` → pages + sections voulues | `sections.TYPES` |
| Design Planner | `design.js` | `Brief` → jetons | `tokens.js` (validation existante), `themes/catalog` |
| Content Generator | `content.js` | page + brief → textes | `ai.call`, voix de marque (`ai.brand_voice`) |
| Component Mapper | `mapper.js` | besoin → type de section/gabarit/widget **existant** | `sections.TYPES`, `templates`, `patterns`, `nodes.editorSpec` |
| Asset Planner | `assets.js` | page → emplacements d'images (jamais d'image) | médiathèque |
| Site Builder Adapter | `adapter.js` | `GeneratedSite` → appels `pages` existants | `buildTemplate`, `saveDraft`, import de pack |
| Validation Engine | `validate.js` | tout objet IA → accepté/refusé + motifs | `normalizeContent`, `tokens` validateurs, `lockedWidgetChanges` |
| Provider Adapter | `providers/*.js` | `{system,prompt,schema}` → JSON | `services/connectors` |

## 3. Règle d'or : l'IA choisit, le serveur construit

L'IA ne produit pas de sections brutes. Elle produit un **plan** : pour chaque section `{ type, gabarit?, intention, textes }`. L'adaptateur construit la section à partir de `blanks`/`templates`, puis y **verse les textes** et passe par `normalizeContent`. Conséquences :
- aucun composant ni propriété inventés : un type absent de `sections.TYPES` est rejeté ;
- identifiants générés par le serveur (comme `studio.js`) ;
- couleurs/polices uniquement par `token:` ou valeurs de listes fermées ;
- règle de compatibilité : **propriété inconnue → rejet de la section** (jamais ignorée en silence) ; rejet consigné dans le rapport de validation affiché à la personne.

## 4. Design par jetons
Le Design Planner propose un objet de jetons limité aux clés de `tokens.js` (10 couleurs, 9 niveaux de texte, espacements, rayons, ombres, polices de la liste fermée). Validation : contraste texte/fond ≥ 4,5:1 (contrôle déterministe côté serveur, pas confié au modèle), sinon correction automatique vers la paire la plus proche ou rejet. Enregistré comme **brouillon de styles** (jamais publié), modifiable dans le panneau de styles existant.

## 5. Régénération partielle et travail manuel
- Chaque élément généré reçoit une empreinte (hash du contenu normalisé) stockée dans la génération.
- À la régénération d'une zone, un élément dont l'empreinte actuelle ≠ empreinte générée est **« modifié à la main »** : exclu par défaut, listé, remplaçable seulement sur choix explicite. Les éléments **verrouillés** restent intouchables (`lockedWidgetChanges`).
- Portée : site, page, section, en-tête/pied, jetons, version mobile (écran `mobile` seul, comme `responsiveFixes`).
- Mécanique de proposition = celle de `studio.js` (copie → validation → différences → acceptation → une étape d'historique), étendue du niveau page au niveau site.
- Historique : table de générations (voir contrats), annulation = restauration de la révision précédente de chaque page touchée (`revision` + `saveDraft` atomique existants).

## 6. Données (additif, réversible — à créer en 21.2)
`mk_ai_generations(id, organization_id, site_id, user_id, kind, status, brief_hash, plan_json, result_json, provider, model, input_tokens, output_tokens, created_at, decided_at)` + `mk_ai_generation_items(generation_id, kind, ref_id, fingerprint)`. Pas de texte brut du brief en clair au-delà de la durée utile (voir sécurité). Migration suivante libre : **116** sur `main` (dernière = 114, 115 prise par la branche LMS) ; à recalculer au moment de l'écriture. Retour arrière : `DROP TABLE`.

## 7. Multi-sites
Un moteur, une configuration centrale des fournisseurs (connecteurs), des réglages **par site** (module `ai`, plafond, voix). `site_id` vient de `ctx` serveur, jamais du navigateur ; chaque lecture de génération filtre sur `ctx.siteScope`. Quota : plafond organisation conservé + plafond optionnel par site (nouvelle clé de réglage).

## 8. Performance et robustesse
Génération asynchrone par étapes (une page = un appel, parallélisme borné à 2–3), état persistant et reprise ; échec d'une page ≠ échec du site (page marquée « à régénérer »). Délai par appel 120 s (valeur actuelle d'`aiCore`). Écriture finale en **une transaction** (`transaction` imbriquable existante).

## 9. Interface (conception seulement)
Écran dans « Mes sites » → « Créer avec l'IA » : brief (zone libre + exemples), secteur, ton, langue, pays, style ; étapes brief → plan → aperçu ; progression par page ; aperçu via le rendu existant (`sectionPreview`/`themeDemo`) ; bouton « Ouvrir dans l'éditeur ». Identité marine, `kola-vivid.css`, formulaires `data-mk-once` (anti double envoi). Non construite.

## Mise à jour 22.10 — branchements réels (vérifiés le 30/10/2026)

```
Brief ─► Brief Analyzer (ai/builder/brief.js : règles + modèle simulé)
      ─► Site Planner (planner.js, plans.js, registry.js)           ─► plan validé
      ─► Page Generator (src/pageGen : plan → sections natives, Component Mapper)
      ─► Design Generator (src/designGen : palette, polices, jetons → personnalisateur du site)
      ─► Content Generator (src/contentGen : voix, faits, anti-invention, SEO, localisation)
      ─► Media (src/aiMedia : besoins, tâches, fournisseur, médiathèque)
      ─► Studio 8 étapes (marketing/web/aiBuilder.js + ai/builder/workspace.js)
      ─► Publication native (pages.publish, confirmation serveur)
Régénération (src/regen 21.9) · Boutique IA (ai/shop 21.10) · Mises en page (src/layoutGen 22.3) · Intelligence éditoriale (src/contentIntel 22.6) · Images (src/imageIntel 22.7) · Responsive (src/responsive 22.8) · Performance (src/perfEngine 22.9)
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
| Page Generator → imageIntel (22.7) | ⛔ non branché (I-2 de 22.7) |
| Rendu public → perfEngine (22.9) | ✅ priorité LCP et dimensions d'images appliquées au rendu |
| Éditeur/rendu → responsive (22.8) | ✅ `fontSize` fluide, correctifs de menu ; pas de lien avec la génération |
| Parcours guidé → boutique native | ⛔ produit un catalogue de formations |
| Publication → détection des textes d'exemple | ⛔ absente |

Pour 22.2, 22.4, 22.5 : **aucun composant** (voir `KOLAKISA_PROGRAMME22_IMPLEMENTATION_STATUS.md`).
