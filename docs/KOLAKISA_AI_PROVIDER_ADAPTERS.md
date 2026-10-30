# KOLAKISA — AI Core : adaptateurs de fournisseurs

## Contrat d'un adaptateur (`src/ai/adapters/*.js`)
`{ id, connectorId, baseUrl, label, supports, authHeaders(secrets), complete({ http, credentials, model, request }) }` → `{ content, finishReason ('stop'|'length'|'refused'|'other'), providerFinishReason, usage ({inputTokens, outputTokens} | null), providerRequestId, model }`.
Ajouter un fournisseur = un fichier + `providers.register(adapter)` (+ un connecteur pour la clé). Le reste du Core ne change pas. `supports` ne déclare que ce que le code **implémente**.

## État réel
| Fournisseur | Point d'accès utilisé | Authentification | Sortie JSON | Vérifié contre le vrai service ? |
|---|---|---|---|---|
| OpenAI | `POST /v1/chat/completions` | `Authorization: Bearer` | `response_format: json_object` + validation locale | **Non** (aucune clé) |
| Anthropic | `POST /v1/messages` | `x-api-key` + `anthropic-version` | consigne « JSON seulement » + validation locale | **Non** |
| Google Gemini | `POST /v1beta/models/{m}:generateContent` | `x-goog-api-key` | `responseMimeType: application/json` + validation locale | **Non** |
| Mistral AI | `POST /v1/chat/completions` | `Authorization: Bearer` | `json_object` + validation locale | **Non** (adaptateur et connecteur écrits de mémoire de la documentation, jamais exercés) |

« Testé » signifie ici : requêtes envoyées à un **faux serveur local** et réponses simulées lues correctement (`tests/ai-core-adapters.test.js`). Cela prouve la forme de ce que Kolakisa envoie et sa lecture de réponses d'un format connu, pas l'acceptation par le service réel.

## Différences réelles prises en compte
Rôles Gemini (`user`/`model`), `system` séparé chez Anthropic et Gemini, jetons nommés différemment (`prompt_tokens` / `input_tokens` / `promptTokenCount`), raisons de fin différentes (normalisées), températures bornées (Anthropic ≤ 1, Mistral ≤ 1,5), température transmise seulement si demandée. Ni images, ni fichiers, ni flux : **aucun** adaptateur ne les implémente et aucun modèle ne peut les déclarer utilisables.

## Non étudié dans cette session
Tarification, limites de débit officielles, disponibilité géographique et conditions d'utilisation de chaque fournisseur : **non consultées** (pas de vérification en ligne). Aucun tarif n'est donc livré ; les modèles sont enregistrés sans tarif.
