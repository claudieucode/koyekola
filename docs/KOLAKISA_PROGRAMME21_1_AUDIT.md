# Programme 21.1 — Audit de l'existant (AI Website Builder)

Base : `origin/main` (`bd794900`), branche `docs/programme-21-1-ai-website-builder`. Dépôt propre au départ (0 modification). Constats tirés du code lu et de requêtes `node` sur les registres, pas des documents.

## 1. État réel du programme 20

| Programme | Constat | Statut retenu |
|---|---|---|
| 20.1 | Aucun document `PROGRAMME20_1` dans le dépôt. | **Non vérifiable** |
| 20.2 | Branche `feat/programme-20-2-site-builder` (`1dc4a813`), poussée, **non fusionnée dans `main`**, non déployée. VALIDÉ AVEC RÉSERVES. | Non intégré |
| 20.3 à 20.7 | Aucune branche distante, aucun document, aucun commit nommé ainsi dans `main`. | **Non exécutés** |

Le programme 20.7 n'a donc pas été exécuté. Il n'est pas considéré comme validé. Les paliers 8 à 12 (Theme Builder, parties de site, audit des widgets) existent dans `main` (commit `6d1e2644`).

**Prérequis techniques posés par l'absence de 20.7** : (a) fusionner ou rebaser 20.2 si l'on veut le contexte « Mes sites » atomique ; (b) réparer les ~10 tests du registre de menu qui échouent déjà sur `main` ; (c) CI GitHub inutilisable (0 étape), donc confirmation de non-régression uniquement locale.

## 2. Ce qui existe et se réutilise (ne rien reconstruire)

| Besoin de l'IA | Existant (fichier) | Constat |
|---|---|---|
| Grammaire des sections | `src/marketing/pages/sections.js` | 16 types fermés : hero, text, image, list, course, button, quote, form, features, faq, cta, video, testimonials, divider, layout, component. Max 30 sections/page. Validation et normalisation à l'enregistrement. |
| Éléments imbriqués | `pages/nodes.js` (2 115 lignes) | 94 types d'éléments, 110 propriétés de style validées une à une, 400 nœuds max, profondeur 8, styles par écran (ordinateur/grand écran/tablette/mobile) et par état. Aucun HTML/CSS/JS libre. |
| Design tokens | `pages/tokens.js` | 10 couleurs + personnalisées, 9 niveaux typographiques, 6 espacements, ombres, boutons, polices (5 de la liste fermée). Les éléments référencent `token:…`. |
| Gabarits de pages | `pages/templates.js`, `patterns.js` (22 blocs), `blanks.js` | Vraies sections, sans faux chiffre ni faux témoignage. |
| Packs de site | `pages/sitePacks.js` | 5 packs (formation, service, produit, entreprise, événement) : pages + menu + palette + polices. **Seul mécanisme de « site complet » existant.** Importé en brouillon, jamais publié. |
| Thèmes | `themes/catalog.js`, `themes/library` | 5 thèmes ; manifeste validé strictement (champs inconnus refusés). |
| Modèles de thème | `pages/themeTemplates.js` | 8 familles (article, archive, 404…). |
| Widgets/zones | `widgets/catalog.js` | zones sidebar/footer-1/footer-2 ; bloc = JSON `{id,type,settings}` revalidé. |
| Gestion des sites | `pages/siteManager.js`, `web/siteModules.js`, `siteModules.js` | Module `ai` déclaré `ready: true` ; `assertEnabled(ctx,"ai")` appelé par le chemin IA. |
| Permissions / isolation | `ctx.siteScope`, `cmsAccess`, `siteContext` | Site toujours revalidé côté serveur. |
| **IA déjà présente** | `services/aiCore.js`, `marketing/ai/index.js`, `marketing/ai/studio.js` | Voir §3. |
| Connecteurs | `services/connectors/*` (adaptateurs `anthropic`, `openai`, `google-ai`) | Secrets chiffrés (`ENCRYPTION_KEY`), capacité `text.generate` seulement. |
| Journal/plafond | table `mk_ai_requests` (migrations 031, 086) | Sans texte, par organisation et par site. |

## 3. L'IA existante — constat clé

Le dépôt contient **déjà** une IA intégrée, à ne pas dupliquer :

- **`aiCore.runJson`** : SDK officiel `@anthropic-ai/sdk ^0.131`, modèle codé en dur `claude-opus-5-5`, réponse JSON forcée par schéma (`output_config.format: json_schema`), erreurs traduites, clé jamais renvoyée, client injectable pour les tests.
- **`ai.call(ctx, action, …)`** : porte unique avec module `ai` par site, plafond quotidien d'organisation (100 par défaut), clé du centre de connecteurs puis variable `ANTHROPIC_API_KEY`, journal sans texte.
- **`ai/studio.js`** : « AI Studio » de l'éditeur de pages. Le modèle renvoie des **opérations** (`set_styles`, `set_props`, `insert`, `move`, `remove`, `set_page`) ; le serveur refuse les éléments inconnus, valeurs de style invalides et éléments verrouillés, génère lui-même les identifiants, applique sur une **copie**, revalide le document entier, calcule les différences avant/après. Le prompt est construit depuis le catalogue réel (`nodes.editorSpec`). Un test existe (`ia-studio.test.js`, 128 lignes) plus `ia-par-site`, `connecteurs-ia`, `marketing-ia-redaction`.
- **Limite** : tout est rattaché à **une page existante** ou à un e-mail. **Il n'existe aucun flux brief → site.** Pas d'analyse de brief, de plan de site, de création de plusieurs pages ni de réglage des tokens par IA.
- **Limite fournisseur** : `aiCore` est lié à Anthropic. Les adaptateurs OpenAI et Google n'exposent que `text.generate` (texte libre), sans sortie structurée ; le chemin `ai.call` ne les utilise pas.

## 4. Écarts à combler pour l'AI Website Builder

1. Analyseur de brief et planificateur de site (inexistants).
2. Contrat de sortie « plan de site » et « page générée » (inexistant ; voir contrats).
3. Création **atomique** de plusieurs pages + menu + tokens (le pack le fait en brouillon : à réutiliser, pas à copier).
4. Abstraction fournisseur avec sortie structurée (aujourd'hui Anthropic seul pour le structuré).
5. Historique des générations avec acceptation/annulation au niveau du site (l'éditeur n'a que l'historique d'une page).
6. Protection des éléments modifiés à la main lors d'une régénération (seuls les éléments **verrouillés** sont protégés).
7. Images : aucune banque ni génération ; seulement la médiathèque du site.
8. Quota par site : le plafond est par **organisation** ; consommation lisible par site.

## 5. Ce qui n'a pas été fait / vérifié

- Aucun appel d'IA réel (aucun appel payant autorisé).
- Suite de tests complète non lancée ; seuls des registres ont été lus.
- Aucun code applicatif modifié ; ce palier ne livre que de la documentation.
