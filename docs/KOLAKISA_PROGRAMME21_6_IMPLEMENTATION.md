# Programme 21.6 — AI Content Generator : implémentation

Branche `feat/programme-21-6-content-generator`, issue de `origin/main` `01247a32`.

## 1. Audit initial (état réel, vérifié dans le code)
| Programme | Constat sur `origin/main` |
|---|---|
| 21.1 (audit) | Documents présents **seulement** sur la branche `docs/programme-21-1-ai-website-builder` (non fusionnée). |
| 21.2 AI Core | **Présent** (`src/ai/*`, migration 116, tests `ai-core*.test.js`). **Non branché en production** (`getAiCore()` n'est appelé nulle part ; la permission `ai.use` n'existe pas dans les rôles). |
| 21.3 Brief Analyzer / Site Planner | **Absent de `main`** : il existe sur `feat/programme-21-3-brief-planner` (non fusionnée). Sa migration porte aussi le numéro **116** : conflit à résoudre avant toute fusion. |
| 21.4 Page Generator / Component Mapper | **Présent** (`src/pageGen/*`, route `generateur`). Il a défini son propre contrat de Site Plan v1 (le Planner n'existait pas). Il écrit des textes d'exemple entre crochets (`[Service]`) et un texte IA minimal (`aiCopy`). |
| 21.5 AI Design Generator | **Absent** (aucune branche, aucun document). Le design se lit donc dans les jetons et styles existants ; ce palier ne produit ni style ni jeton. |

Conséquences de conception : le générateur de contenus s'appuie sur ce qui **existe sur `main`** (pages natives produites par le Page Generator ou par la personne) et reste compatible avec le BriefAnalysis v1 (21.3) par un adaptateur de faits, sans dépendre de sa fusion.

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
| Migration 117 (`mk_content_voice`, `mk_content_sets`, `mk_content_versions`) | `src/marketing/migrations/117_contenus_ia.sql` |
| Tests | `tests/programme21-6-content-generator.test.js` (26), `…-http.test.js` (3) |

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
