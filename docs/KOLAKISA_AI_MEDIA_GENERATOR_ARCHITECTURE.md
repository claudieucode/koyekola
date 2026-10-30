# AI Media Generator — architecture

| Composant demandé | Réalisation |
|---|---|
| AI Media Orchestrator | `aiMedia/index.js` |
| AI Image Prompt Planner | `planner.js` (pur) |
| AI Image Provider Adapter | `providers.js` : interface `{id, kind, models, configured, generate}` ; `demo`, `openai` ; autres listés « non intégrés » |
| AI Asset Selector / Media Mapping Engine | `assign`, `autoAssign`, `restore` (écrivent dans le brouillon de la page par `pages.saveDraft`) |
| AI Asset Validator | `media.sniff` + `media.saveUpload` (type réel, taille, dimensions) + contrôle `type === image` |
| Image Processing Pipeline | stockage natif + `variants` (voir doc dédiée) |
| Metadata Manager | `mk_aimedia_meta`, `describe`, `provenance`, `registerImport` |
| Generation History | `mk_aimedia_history` |
| Cost and Quota Manager | `core.usage.admit/finish` (module `media`, tâche `image_generation`), `estimate`, `consumption` |

## Flux
`plan` (lit les sections réelles) → fiches de besoin → `start` (contrôles : fournisseur utilisable, modèle, format, consigne ; idempotence ; tâche `queued`) → exécution asynchrone `run` : admission AI Core (quotas) → adaptateur → contrôle de chaque image → `saveUpload` (médiathèque du site) → métadonnées → journal → `generated` → `assign` (explicite) → référence médiathèque dans le brouillon → relecture de contrôle.

## Réutilisation de l'AI Core
`usage` (quotas par portée global/organisation/site/utilisateur/module, journal, idempotence), `config.effective` (IA activée pour le site, fournisseurs autorisés), connecteurs (clés chiffrées par site) et couche réseau durcie. Non utilisés : `execute` (conçu pour des conversations texte), le registre de modèles (aucun modèle d'image), `security.authorizeUse` (permission `ai.use` sans rôle) — les droits sont ceux de Kolakisa (`forms.read/write`, `settings.write`).

## États
Besoin : `needed → queued → generated → assigned` (+ `skipped`, `no_slot`). Tâche : `queued → running → succeeded | failed | canceled`. Tâches `running` > 10 min : `timeout` ; `queued` > 30 min : `expired`. Relance : 3 tentatives par besoin au plus.
