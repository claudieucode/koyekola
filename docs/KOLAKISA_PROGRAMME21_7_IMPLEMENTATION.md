# Programme 21.7 — AI Media Generator & Asset Manager : implémentation

## Audit initial (état réel du code, `origin/main` au commit `5641e61d`)
| Domaine | État |
|---|---|
| AI Core (`src/ai`) | Présent, **non branché** en production pour le texte ; fournisseurs texte (Anthropic, OpenAI, Gemini, Mistral) ; quotas/journal `usage`, configuration par site `config`, gestionnaire de fournisseurs et clés (connecteurs). **Aucun modèle ni adaptateur d'image** : la capacité « images » existe seulement dans le vocabulaire. La permission `ai.use` n'est mappée à aucun rôle. |
| Brief Analyzer / Site Planner (21.3) | Présents (`mk_ai_plans`). |
| Page Generator / Component Mapper (21.4), AI Design Generator (21.5) | Présents. |
| Content Generator (21.6) | **Présent** (`src/contentGen`, migration 118), fusionné pendant ce palier : non branché sur les consignes d'images (voir limites). |
| Médiathèque native (`marketing/media`) | Complète : type réel (sniff), limites, empreinte SHA-256, isolation par site (`reach`/`site_id`), usages, corbeille, dossiers, miniatures et variantes WebP à la demande (`variants`, sharp optionnel). Pas de provenance ni de tags. |
| Pages | Les seuls emplacements d'image natifs sont `hero.image` (+ `imageAlt`) et la section `image` (`src`, `alt` obligatoire). Les URL de médiathèque sont la référence native. |
| File d'attente (`mk_jobs`) | Existe, mais son worker n'est lancé que si `MARKETING_WORKER=on` : non fiable pour cette fonction. |
| Antivirus, AVIF | Absents. |

## Décisions
- **Aucune migration** (114–117 figées par test) : tables créées à la demande (`mk_aimedia_*`).
- **Aucun appel réel de fournisseur d'images** n'a été fait ni ne peut être vérifié (aucune clé). L'adaptateur OpenAI est écrit et testé uniquement contre un faux serveur local ; il est déclaré « NON VÉRIFIÉ ». Le fournisseur « Démonstration » (PNG déterministes) permet de tester le flux ; ses images sont marquées « Visuel d'attente », jamais « générée par IA ».
- Tâches **asynchrones en processus** (tables, idempotence, annulation, expiration), sans dépendre du worker.

## Livré
`src/aiMedia/{png,providers,planner,store,index}.js`, `src/marketing/web/aiMedia.js`, `views/marketing/site-ai-media.ejs`, `public/js/site-ai-media.js`, `tests/ai-media.test.js` (21), 9 documents. Écran : `/marketing/site-web/sites/:id/medias-ia`.
