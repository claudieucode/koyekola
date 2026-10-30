# KOLAKISA — AI Core : contrats de requête et de réponse

## Requête (entrée de `execute`)
`module` (enregistré), `task`, `siteId`, `messages[{role: user|assistant, content}]` (50 max, 100 000 caractères chacun, 200 000 au total, dernier message = utilisateur), `system` (module autorisé seulement, 20 000 car.), `model` (`fournisseur:modèle`), `routing{strategy, allowFallback, maxFallbackCostMicroUsd}`, `maxOutputTokens` (1–32 000, défaut 1 024), `timeoutMs` (1 s–300 s, défaut 60 s), `temperature` (0–2), `responseFormat{type: text|json, schema}`, `idempotencyKey` (8–100 car.). L'utilisateur, l'organisation et le site autorisés viennent de l'`actor` côté serveur, jamais d'un champ libre. Un rôle « system » dans `messages` est refusé : les instructions système ne se mêlent pas au contenu utilisateur.

## Réponse
`requestId` (corrélation), `status`, `provider`, `model`, `trusted: false`, `content`, `contentFormat`, `data` (JSON analysé), `finish{reason, providerReason}`, `usage{inputTokens, outputTokens}` chacun `{value, source}`, `cost{microUsd, kind, source, priceStatus, priceVerifiedAt}`, `durationMs{value, source}`, `providerRequestId`, `routing{strategy, attempts, fallbackUsed, skipped}`, `warnings[]`.

## Origine des données
| Donnée | Source |
|---|---|
| Jetons | `provider` (API) ; sinon `estimated` (≈ 1 jeton / 3 caractères, avertissement) |
| Coût | toujours **calculé** par Kolakisa (jetons × tarif du registre) : `estimated`, ou `unknown` si le tarif manque. `confirmed` n'existe pas encore |
| Durée | `computed` (mesurée par Kolakisa, réseau compris) |
| Raison de fin | `provider`, normalisée |

## Contrôle des sorties
Texte : caractères nuls retirés, 400 000 caractères au plus, vide → `empty_response`. JSON : balises ``` retirées, analyse stricte, profondeur ≤ 20, schéma (types, `required`, `properties`, `items`, `enum`, `additionalProperties:false`) → sinon `malformed_response`. Réponse coupée en JSON → refusée.
