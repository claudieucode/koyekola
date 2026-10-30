# Programme 21.6 — AI Content Generator : implémentation

Branche `feat/programme-21-6-content-generator`, issue de `origin/main` `01247a32`.

## 1. Audit initial (état réel, vérifié dans le code)
Le dépôt a **évolué pendant ce palier** : d'autres sessions ont fusionné des paliers dans `main`. Constat à la fin (après fusion de `origin/main` `5641e61d` dans la branche) :
| Programme | Constat |
|---|---|
| 21.1 (audit) | Fusionné dans `main` (documents). |
| 21.2 AI Core | **Présent** (`src/ai/*`, migration 116, tests `ai-core*.test.js`), **non branché en production** (`getAiCore()` jamais appelé ; permission `ai.use` inexistante). |
| 21.3 Brief Analyzer / Site Planner | **Présent sur `main`** (`src/marketing/ai/builder/*`, migration 117 renumérotée). Utilisé ici via `facts.fromBriefAnalysis` (testé sur un vrai `brief.normalize`). Le plan de site v1 du 21.3 n'est pas relié au Page Generator. |
| 21.4 Page Generator | **Présent** (`src/pageGen/*`). Il a son propre contrat de plan v1 ; il écrit des textes d'exemple `[…]` que ce palier remplace. |
| 21.5 AI Design Generator | **Présent sur `main`** (commit `e4524ca7`) mais **non utilisé** par ce palier : aucun style, jeton ou couleur n'est produit ni lu ; seule la voix éditoriale est prise en compte. |

Au début du palier, seuls 21.2 et 21.4 étaient sur `main` ; la conception s'appuie donc sur les pages natives et reste indépendante des fusions ultérieures.

## 2. Livré
| Élément | Fichier |
|---|---|
| Champs texte réels des sections (Content Mapper) | `src/contentGen/fields.js` |
| Voix de marque | `src/contentGen/voice.js` |
| Faits, sources, garde anti-invention | `src/contentGen/facts.js` |
| Localisation | `src/contentGen/localize.js`, `lang.js` |
| SEO | `src/contentGen/seo.js` |
| Validation qualité | `src/contentGen/validate.js` |
| Passerelle IA (legacy `ai.call` ou AI Core) | `src/contentGen/gateway.js` |
| Moteur (génération, révision, traduction, application) | `src/contentGen/engine.js` |
| API JSON `/marketing/site-web/sites/:id/contenus/…` | `src/marketing/web/contentGenerator.js` |
| Migration 118 (`mk_content_voice`, `mk_content_sets`, `mk_content_versions`) | `src/marketing/migrations/118_contenus_ia.sql` |
| Tests | `tests/programme21-6-content-generator.test.js` (27), `…-http.test.js` (3) |

Fichiers existants modifiés : `web/index.js` (montage), et trois tests dont le plafond de numéro de migration était périmé (`site-menu-p1a`, `site-espace`).

## 3. Mapping des responsabilités demandées
| Responsabilité | Où |
|---|---|
| Content Analyzer / Content Strategy Planner | `engine.pageFields` (champs admissibles, sections, rôles) + `facts.missingFor` (informations manquantes → questions) ; la stratégie rédactionnelle est portée par la voix et l'objectif de page dans le prompt |
| Brand Voice Engine | `voice.js` |
| Page Content Generator / Copywriting Engine | `engine.generatePage` (un appel par page, champs demandés par le serveur) ; règles dans `KOLAKISA_AI_COPYWRITING_RULES.md` |
| SEO Content Engine | `seo.js` + bloc `seo` de la réponse |
| Localization Engine | `localize.js`, `engine.localizeSet` |
| Content Quality Validator | `validate.js` |
| Content Mapper | `fields.js` + `engine.apply` |
| Content Revision Engine | `engine.revise / choose / editField / lockField / undoField / unapply` |

Ce sont des responsabilités d'un même module, pas des services séparés.

## 4. Principe de sécurité central
L'IA ne produit que des **chaînes associées à des clés de champ demandées par le serveur**. Elle ne choisit ni structure, ni composant, ni style, ni adresse, ni image. Le serveur nettoie, applique la garde anti-invention, valide, **propose** (rien n'est écrit), puis n'écrit en **brouillon** que les champs déclarés, via `pages.saveDraft` (normaliseurs natifs, contrôle de révision). La publication reste une action humaine séparée.

## 5. Interface
Aucune interface graphique n'a été construite : l'API JSON est la seule surface (l'interface complète relève du palier 21.8). Le point 15 de la demande n'est donc **pas** satisfait côté écran (voir REMAINING_ISSUES).
