# KOLAKISA — AI Core : architecture

## Flux d'une requête (`core.execute(actor, requête)`)
1. **Validation** (`contracts.normalizeRequest`) : module enregistré, messages, limites, format, clé d'idempotence, stratégie. Une requête invalide ne crée aucune ligne et ne contacte personne.
2. **Autorisation** (`security.authorizeUse`) : permission `ai.use`, site appartenant à l'organisation, accès limité à un site respecté. Instructions système réservées aux modules enregistrés avec `allowSystem`.
3. **Configuration** (`config.effective`) : l'IA doit être activée au niveau central **et** pour le site.
4. **Routage** (`router.plan`) : modèle principal + secours éventuels (voir §Routage).
5. Pour chaque modèle prévu : **admission** (`usage.admit` : idempotence, quotas, réservation de coût, ligne « started »), **appel** (`providers.call` avec réessais contrôlés), **contrôle de la réponse** (`checkOutput`), **journal** (`usage.finish`).
6. **Réponse normalisée** ou `AiError` portant `requestId` et `routing`.

## Modèle de données
- `mk_ai_core_usage` : une ligne par tentative sur un modèle (un basculement = deux lignes, même `request_id`). Pas de contenu. Colonnes d'origine des données : `tokens_source` (provider / estimated / unavailable), `cost_kind` (estimated / unknown ; `confirmed` réservé, jamais produit), `counted` (0 pour un échec sans coût).
- `mk_ai_core_quotas` : plafonds par portée (global, organisation, site, utilisateur, module) et période (jour, mois).
- Configuration : réglage d'organisation `ai_core.config` (JSON, sans secret).

## Routage
| Stratégie | Comportement |
|---|---|
| `explicit` | Le modèle demandé, sinon **refus** (`model_unknown`) : jamais remplacé en silence |
| `recommended` | Modèle configuré pour la tâche, sinon modèle par défaut, sinon refus |
| `economy` | Le moins cher parmi les modèles compatibles **au tarif vérifié** ; aucun tarif vérifié → refus |
| Secours | Seulement si la requête (`allowFallback`) **et** la configuration centrale l'autorisent ; modèle de la liste de secours, fournisseur autorisé, tarif vérifié, coût estimé ≤ plafond (demandé, sinon coût du principal × facteur) ; jamais après un échec possiblement facturé ; les quotas s'appliquent au secours |
Filtres de compatibilité : fournisseur autorisé, adaptateur présent, modèle ni indisponible ni retiré, capacités déclarées **et** implémentées, limites de contexte/sortie connues. La latence n'est **pas** modélisée (voir REMAINING_ISSUES).

## Cohabitation
`src/services/aiCore.js` (assistants du blog et du marketing) est inchangé. `getAiCore()` n'est appelé nulle part en production : le Core est prêt mais non branché.
