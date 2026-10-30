# KOLAKISA — Programme 21.2 : AI Core et infrastructure multi-fournisseurs (implémentation)

*Branche `feat/programme-21-2-ai-core`, issue de `origin/main`. 2026-10-30. Statut final : voir §6.*

## 1. Audit préalable (faits relevés)
| Question | Constat |
|---|---|
| Programme 21.1 | **Aucun document ni commit « 21.1 »** dans le dépôt ni sur les branches distantes. Aucune décision de 21.1 n'a donc pu être reprise ni modifiée. |
| Intégrations IA existantes | `src/services/aiCore.js` (Anthropic seul, SDK officiel, variable `ANTHROPIC_API_KEY`) utilisé par `services/blogAi.js` et `marketing/ai/` (quota quotidien par organisation, journal `mk_ai_requests` sans texte). **Non modifiés.** |
| Clés et secrets | Centre de connecteurs `src/services/connectors/` : clés chiffrées (AES-256-GCM, `ENCRYPTION_KEY`) **par site**, jamais renvoyées à l'interface, couche réseau unique (HTTPS, hôte déclaré, refus des adresses internes, pas de redirection, délai et taille bornés), erreurs normalisées. Adaptateurs existants : OpenAI, Anthropic, Google AI. **Pas de Mistral.** |
| Multi-sites | `mk_sites` (par organisation), tables classées dans `tests/fixtures/inventaire-tables-sites.json`, accès limité à un site (`siteScope`). |
| Dépendances | Aucune ajoutée. `fetch` natif via la couche réseau des connecteurs. |
| Écarts avec l'architecture « prévue » | Le prompt suppose des services à créer ; le dépôt avait déjà le socle des clés, du réseau et des erreurs. Le Core **s'appuie dessus** au lieu de le refaire. |

## 2. Décisions
1. Nouveau module `src/ai/` (modulaire, dans l'application, pas de microservice). L'ancien `aiCore.js` reste en place : migrer ses appelants est un chantier à part (voir REMAINING_ISSUES).
2. Les clés restent dans le centre de connecteurs. Ajout d'un connecteur **Mistral** (`services/connectors/adapters/mistral.js`) pour pouvoir stocker sa clé comme les autres.
3. Migration **116** additive : `mk_ai_core_usage` (journal) et `mk_ai_core_quotas` (plafonds). Classées dans l'inventaire des tables (`isolee` / `plateforme`).
4. Par défaut **tout est désactivé** (aucun fournisseur, aucun modèle, aucun site) : l'IA ne s'ouvre que par un acte de l'administration centrale.

## 3. Ce qui est livré
| Module | Fichier | Rôle |
|---|---|---|
| AI Core | `src/ai/index.js` | `execute(actor, requête)`, administration, instance de production `getAiCore()` |
| Provider Manager | `providers.js`, `adapters/*` | Adaptateurs OpenAI, Anthropic, Gemini, Mistral ; clés ; disjoncteur |
| Model Registry | `models.js` | Fiches de modèles, tarifs datés, disponibilité vérifiée |
| Request/Response | `contracts.js` | Validation stricte, normalisation, validation JSON/schéma |
| Usage Manager | `usage.js` | Journal, quotas, idempotence, synthèses |
| Security Layer | `security.js`, `config.js` | Permissions, isolation des sites, configuration centrale/site |
| Error Manager | `errors.js` | Codes normalisés, réessai/facturation |
| Logging | `logging.js` | Journal structuré sans contenu |
| Routage | `router.js` | Stratégies et secours encadrés |

## 4. Non fait (volontairement ou faute de moyens)
Aucune route HTTP ni écran d'administration ; aucun module existant branché sur le Core ; aucune clé réelle utilisée (**aucun fournisseur vérifié en conditions réelles**) ; pas d'images, de fichiers ni de flux.

## 5. Incident de test à connaître
Pendant l'écriture des tests d'adaptateurs, une version du test a laissé un appel partir **réellement** vers `api.openai.com` avec une fausse clé (réponse 401, aucun coût, aucune clé réelle). Le passage a été supprimé ; aucun test ne contacte plus d'hôte externe (le faux serveur local est le seul interlocuteur). Il a aussi révélé qu'OpenAI recopie la clé partiellement masquée dans ses erreurs : le nettoyage des messages couvre désormais ce format.

## 6. Statut : VALIDÉ AVEC RÉSERVES
L'infrastructure est opérationnelle et prouvée avec des fournisseurs simulés (voir `KOLAKISA_PROGRAMME21_2_TESTS.md`). Les connexions réelles, les tarifs et les capacités des modèles ne sont **pas vérifiés**.
