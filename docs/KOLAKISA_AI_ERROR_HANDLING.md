# KOLAKISA — AI Core : gestion des erreurs et résilience

Chaque erreur est une `AiError` : `code`, `message` en français sans secret, `retryable`, `possiblyBilled`, et sur `execute` : `requestId`, `routing`.

| Situation | Code | Réessai | Secours | Compté (quota) |
|---|---|---|---|---|
| Requête invalide / non autorisée / IA désactivée | `invalid_request` / `not_authorized` / `ai_disabled` | — | — | non |
| Limite Kolakisa atteinte / tarif non vérifié | `quota_exceeded` / `cost_unverified` | — | — | non (rien envoyé) |
| Même clé d'idempotence déjà utilisée | `duplicate_request` | — | — | non |
| Clé refusée (401/403) | `auth_invalid` | non | oui* | non |
| Crédit/quota du fournisseur épuisé | `provider_quota` | non | oui* | non |
| Modèle introuvable chez le fournisseur | `model_unavailable` | non | oui* | non |
| Limite de débit (429) | `rate_limited` | **1 réessai** (attente 500 ms) | oui* | non |
| Saturation (503/529) | `provider_overloaded` | **1 réessai** | oui* | non |
| Erreur serveur (500…) | `provider_unavailable` | non | **non** | oui |
| Délai dépassé / coupure réseau | `timeout` / `network` | **non** | **non** | oui |
| Réponse illisible / hors schéma / vide | `malformed_response` / `empty_response` | **non** | **non** | oui |
| Fournisseur en pause (5 échecs de suite, 30 s) | `circuit_open` | non | oui* | non |
| Demande refusée par le fournisseur | `refused` | non | oui* | non |
\* seulement si la requête et la configuration centrale autorisent le secours, dans les limites de coût et de fournisseurs.

## Principes
- Une requête qui **a pu être facturée** n'est jamais relancée ni basculée automatiquement.
- Idempotence : avec `idempotencyKey`, une requête déjà **en cours, réussie ou possiblement facturée** n'est pas relancée (`duplicate_request`) ; une requête échouée **sans coût** peut être rejouée avec la même clé. Garantie valable dans une base unique, un seul processus.
- Disjoncteur par fournisseur, en mémoire du processus (remis à zéro au redémarrage).
- Consommation inconnue : jetons estimés et signalés ; coût `unknown` ; coût réservé retenu pour les quotas.

## Non couvert
Les 5xx du fournisseur sont tous traités comme « possiblement facturés » (prudence) ; `Retry-After` n'est pas lu ; les erreurs de facturation du fournisseur ne sont reconnues que par les codes 402/429-crédit de la couche réseau.
