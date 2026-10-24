# Connecteurs — référence WordPress (étude préalable)

Sources : note officielle « Introducing the Connectors API in WordPress 7.0 » (make.wordpress.org/core, 18 mars 2026, mise à jour du 13 avril 2026), pages de référence de developer.wordpress.org et articles de presse spécialisée cités ci-dessous. Tout ce qui n'est pas dans ces sources est marqué « non établi ».

## 1. Ce que WordPress fournit nativement (cœur, version 7.0)

| Élément | Fait établi | Source |
|---|---|---|
| **API Connectors** | Cadre pour enregistrer et gérer des connexions à des services externes ; premier usage : fournisseurs d'IA ; gère les clés d'API, la découverte de fournisseurs et une interface d'administration | note make.wordpress.org |
| **Écran Réglages → Connecteurs** | Une **carte par connecteur** (nom, description, logo) ; les trois fournisseurs d'IA proposés : Anthropic, Google, OpenAI ; le bouton d'action dépend de l'état de l'extension du fournisseur (`plugin.file` : installée / active) ; lien « obtenir une clé » (`credentials_url`) | note make.wordpress.org + capture fournie |
| **Registre** | `WP_Connector_Registry` (singleton, créé à `init`) ; méthodes `register()`, `unregister()`, `is_registered()`, `get_registered()`, `get_all_registered()` ; fonctions publiques `wp_is_connector_registered()`, `wp_get_connector()`, `wp_get_connectors()` ; crochet `wp_connectors_init` pour enregistrer ou **surcharger** | note |
| **Structure d'un connecteur** | `name`, `description`, `type` (généralisé au-delà de `ai_provider`), `authentication`, `logo_url` (facultatif), `plugin` (facultatif) ; identifiant `/^[a-z0-9_-]+$/`, **doublon refusé** ; modification du registre hors `init` = `_doing_it_wrong()` | note |
| **Authentification** | `method` : `api_key` ou `none` ; seules les connexions `api_key` ont l'interface complète ; d'autres méthodes peuvent être stockées dans le registre PHP **sans interface native** | note |
| **Stockage de la clé** | Option de base de données `connectors_ai_{id}_api_key` (modèle général `connectors_{type}_{id}_api_key`) ; **priorité : variable d'environnement `{FOURNISSEUR}_API_KEY`, puis constante PHP, puis base** ; la clé est **masquée** à l'écran mais **non chiffrée** en base (chiffrement « à l'étude », ticket Trac #64789) | note + wpshout |
| **Client d'IA** | `wp_ai_client_prompt()` : fonction indépendante du fournisseur ; kit PHP sous-jacent ; classe d'enveloppe `WP_AI_Client_Prompt_Builder` qui renvoie `WP_Error` ; les clés enregistrées sont transmises au client (fonction privée `_wp_connectors_pass_default_keys_to_ai_client()`) | wpshout, developer.wordpress.org |

## 2. Ce qui vient d'extensions ou de services tiers (à ne pas attribuer à WordPress)

- Les **fournisseurs eux-mêmes** (Anthropic, Google, OpenAI) sont des **extensions séparées** : le cœur n'embarque aucun fournisseur (wpshout) ; le bouton « Installer » de la capture installe l'extension du fournisseur.
- La carte « extension IA » (génération d'images mises en avant, texte alternatif, titres, extraits) est une **extension** qui consomme les connecteurs.
- Les **coûts**, quotas, conditions d'usage et confidentialité des données dépendent du fournisseur et de l'abonnement de l'utilisateur.
- Des extensions tierces ajoutent d'autres cartes et un bouton « Tester la connexion » (fiche wordpress.org) : ce test n'est **pas** natif.

## 3. Limites et cas particuliers établis

- **Pas de chiffrement** ni de rotation / retrait de clé natifs ; clé **globale au site** : n'importe quelle extension du site peut la lire, y compris une clé fournie par variable d'environnement ou constante ; **aucun cloisonnement par extension**.
- Permissions : la note ne les décrit pas ; un commentaire du mainteneur dit que la clé est un réglage du site entier ; un guide indique que le contrôle de capacité d'administrateur est exigé (non confirmé par la note).
- Aucune API REST décrite pour les connecteurs ; interface JavaScript des autres méthodes d'authentification « prévue, pas encore disponible ».
- Problèmes ouverts signalés en commentaires : la vérification préalable de la clé bloque les points d'accès personnalisés qui exigent d'autres en-têtes ; les connecteurs `none` n'apparaissaient pas.

## 4. Pratiques de sécurité et d'interface à retenir (et à dépasser)

À reproduire : une carte par fournisseur, état clair, lien vers la page des clés du fournisseur, clé masquée, priorité environnement > configuration, découverte automatique des fournisseurs, surcharge contrôlée du registre, refus des identifiants en doublon.
À faire mieux dans Kolakisa (différences d'architecture) :

| WordPress 7.0 | Kolakisa |
|---|---|
| Clé en clair en base (masquée à l'écran) | **Chiffrée** (AES-256-GCM, liée à la connexion), jamais renvoyée au navigateur |
| Une clé pour tout le site | **Une connexion par site** ; la connexion centrale n'est utilisée par un site que si elle est **explicitement partagée** |
| Pas de test natif | **Test de connexion réel et non destructif**, résultat et date conservés ; l'état « connecté » n'existe qu'après un test réussi |
| Pas de rotation / retrait | **Révocation** des identifiants, désactivation, suppression avec effacement des secrets |
| Aucun contrôle des appels sortants décrit | **Une seule couche réseau** : HTTPS, nom d'hôte déclaré, anti-adresses internes, pas de redirection, délai, taille bornée |
| Aucun cloisonnement entre extensions | Les modules passent par `invoke()` (contrat, validation, limites, journal) et ne voient **jamais** le secret |
| Bascule entre fournisseurs non décrite | **Préférence explicite** par fonction et par site ; **jamais de basculement automatique** |

Sources : [Introducing the Connectors API in WordPress 7.0](https://make.wordpress.org/core/2026/03/18/introducing-the-connectors-api-in-wordpress-7-0/) · [WPShout — WordPress AI Connectors API](https://wpshout.com/wordpress-ai-connectors-api/) · [developer.wordpress.org — _wp_connectors_pass_default_keys_to_ai_client()](https://developer.wordpress.org/reference/functions/_wp_connectors_pass_default_keys_to_ai_client/) · [Kinsta — WordPress 7.0](https://kinsta.com/blog/wordpress-7-0/).
