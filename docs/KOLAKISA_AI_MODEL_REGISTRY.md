# KOLAKISA — AI Core : registre des modèles

Fiche d'un modèle (`models.js`) : fournisseur, identifiant officiel, nom, `availability` (`unverified` | `available` | `unavailable` | `deprecated`), `capabilities` (`text`, `structured_output`, `images`, `files`, `streaming`), `tier` (économique/standard/premium), `contextTokens`, `maxOutputTokens`, `pricing` (entrée et sortie en USD par million de jetons, `verifiedAt`, `source`), `restrictions`, `lastVerifiedAt`.

## Règles
- **Modèles livrés** : `claude-opus-5-5` (Anthropic), `gpt-4o-mini` (OpenAI), `gemini-2.0-flash` (Google) — ceux que le dépôt référençait déjà. Ils sont `unverified`, **sans tarif**, **sans limite de contexte connue**. Aucun modèle Mistral n'est livré (aucun identifiant n'était référencé) : à enregistrer par l'administrateur.
- **Tarifs** : `setPricing` exige une source ; état `verified` (< 90 jours), `stale` (plus ancien : estimation signalée « périmée »), `unknown` (aucun : coût `null`, jamais inventé).
- **Disponibilité** : passe à `available`/`unavailable` seulement par `markVerified`, à appeler après un **test réel** de connexion (le centre de connecteurs sait en faire un). Rien ne l'appelle automatiquement aujourd'hui.
- Les modifications (modèle, tarif) sont **en mémoire du processus** : le registre n'est pas persisté. Après redémarrage, retour aux modèles livrés (voir REMAINING_ISSUES, R3).
- Un modèle n'est utilisable que s'il est activé par la configuration centrale (`enabledModels`) et, pour un site, autorisé par ce site.
