# 09 — Architecture

Monolithe modulaire dans l'application Express existante (décision déjà validée dans `EMAIL_MARKETING_ARCHITECTURE.md`) : module `src/marketing`, tables `mk_*`, routes d'administration `/marketing/*`, API `/api/v1/*` (clé d'API, pas de cookie), pages publiques `/t/*` (suivi), `/u/*` (désinscription), `/f/*` (formulaires), `/p/*` (landing pages). SQLite synchrone, file de travaux en base, worker dans le même processus. Pas de microservices : un hébergement, une base à sauvegarder.

## Décisions de cette mission

| Décision | Raison |
|---|---|
| Conserver l'architecture et corriger sur place | le module est cohérent et testé ; une réécriture détruirait des fonctions qui marchent |
| Réutiliser `pages/abstats.js` pour les tests A/B d'e-mail | un seul moteur statistique, pas deux méthodes incompatibles |
| Réutiliser la garde anti-SSRF des webhooks pour le contrôle des liens | une seule définition de « adresse interne » |
| Garde de réputation = fonction pure + une fonction qui écrit | testable sans base ; la décision et l'effet sont séparés |
| Réservation par colonne `claimed_at` | évite de reconstruire `mk_messages` |
| Ne pas coder la ré-entrée de scénario | touche deux contraintes d'unicité et l'idempotence ; risque de doubles envois ; conception écrite d'abord |
| Ne pas coder la facturation | décision commerciale préalable ; pas de paiement fictif |

## Points d'extension

- **Nouveau fournisseur d'envoi** : un fichier dans `sending/providers/` qui implémente `send(message)` et lève des `SendError` classées.
- **Nouveau déclencheur de scénario** : une ligne dans `automations/catalog.js` (`TRIGGERS`), et dans `SERVICE_TRIGGERS` seulement s'il s'agit d'un message de service.
- **Nouvelle action de scénario** : `automations/actions/registry.js`.
- **Nouveau champ de segmentation** : `segments/catalog.js`. Le moteur est unique, partagé par les campagnes et les scénarios.
