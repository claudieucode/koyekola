# Analyse des fournisseurs d'IA

**Aucun appel réel n'a été fait. Aucun prix, quota ni délai n'est donné ici** : ces valeurs changent et n'ont pas été vérifiées dans ce palier. Elles sont à relever sur les pages officielles au début du 21.2, avec date.

## 1. État du code
| Fournisseur | Adaptateur | Capacité | Structuré | Utilisé par `ai.call` |
|---|---|---|---|---|
| Anthropic | `aiCore.js` (SDK officiel) + `connectors/adapters/anthropic.js` | JSON par schéma (`output_config.format`), réflexion adaptative | **Oui** | **Oui** |
| OpenAI | `connectors/adapters/openai.js` (Chat Completions, modèle par défaut `gpt-4o-mini`) | texte libre | Non implémenté | Non |
| Google AI | `connectors/adapters/google-ai.js` | texte libre | Non implémenté | Non |

Les adaptateurs OpenAI/Google ne sont **pas** des fournisseurs du builder : sans sortie structurée, la validation stricte reposerait sur un simple `JSON.parse` + notre validateur. Possible mais plus fragile (réessais plus nombreux).

## 2. Interface cible
```
provider.generate({ system, prompt, schema, effort, maxTokens, signal }) → { data, model, usage }
provider.capabilities → { structuredOutput: bool, maxContext: n, images: bool }
```
Implémentation 1 : `anthropic` = extraction de `aiCore.runJson` (comportement inchangé, tests existants `ia-studio` comme filet). Sélection par réglage central, secours optionnel. Le modèle est aujourd'hui **codé en dur** (`claude-opus-5-5`) : à rendre configurable.

## 3. Critères à documenter par fournisseur (grille à remplir en 21.2)
API officielle · authentification · modèles · sortie structurée · fenêtre de contexte · coût entrée/sortie · quotas · latence mesurée · disponibilité géographique (RDC/Afrique) · conditions d'utilisation · rétention et entraînement sur les données · limites.

Éléments **vérifiés** : Anthropic documente les sorties structurées en JSON Schema, avec `additionalProperties:false` requis, disponibles sur la Claude API. La page contient une section « Data retention » dont le texte **n'a pas été lu** : à lire avant d'envoyer des données de clients.

## 4. Images
Aucun fournisseur d'images n'est branché au CMS. Les outils de génération présents dans l'environnement de travail de l'équipe ne sont pas des dépendances du produit. À étudier en 21.7 : API officielle, droits d'usage commercial, coût par image, filigrane, conditions de conservation. Tant qu'aucun fournisseur n'est validé : médiathèque du site et espaces réservés uniquement.

## 5. Coûts : méthode
Journal `usage` (tokens d'entrée/sortie) par génération → coût estimé = tokens × tarif relevé, affiché à l'administrateur **avant** de lancer (estimation basée sur le nombre de pages du plan). Plafond dur par organisation et par site. Les coûts supportés par Kolakisa (clé centrale) ou par le client (sa propre clé via Connecteurs) dépendent d'une décision commerciale : **non tranchée**.

## 6. Décision recommandée
Anthropic seul en 21.2–21.6 (déjà en production, structuré natif, tests en place), interface d'adaptateur dès 21.2, second fournisseur seulement s'il sait produire du JSON contraint ou avec une double validation.
