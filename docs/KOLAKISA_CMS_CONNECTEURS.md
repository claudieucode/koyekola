# KOLAKISA CMS — Réglages → Connecteurs (mission CONNECTEURS-01, étape 1 : socle et premiers connecteurs)

Branche `connecteurs-01`, issue de `origin/main` (`1255798`). Référence WordPress : `KOLAKISA_CMS_CONNECTEURS_REFERENCE_WORDPRESS.md`. Ce document décrit l'état **réel**.

## 1. Audit de l'existant

| Intégration | Où elle vivait | Stockage des secrets | État |
|---|---|---|---|
| **IA (Anthropic)** | `services/aiCore.js`, `marketing/ai` (e-mails, SMS, studio de pages), `services/blogAi.js` (éditeur d'articles) | **variable d'environnement** `ANTHROPIC_API_KEY` (unique, pour toute la plateforme) | fonctionnel, mais clé unique, invisible, non testable depuis le CMS ; **aucun autre fournisseur** |
| **E-mail (Resend / SMTP)** | `marketing/sending` | clé chiffrée dans `mk_settings` (`email.api_key`) ; SMTP : variables d'hébergement | fonctionnel, géré par Marketing → Envoi et Domaines (SPF, DKIM, DMARC) |
| **SMS (Twilio)** | `marketing/sms` | jeton chiffré (`sms.auth_token`) | fonctionnel, géré par Marketing → SMS |
| **Paiements (Stripe)** | `services/payments.js` | variables d'hébergement `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | fonctionnel, non modifiable depuis le CMS |
| **SEO (PageSpeed, Search Console, GA4)** | `seo/integrations.js` | adresses configurables par variables ; jetons gérés dans le module SEO | fonctionnel, non repris ici |
| **Webhooks entrants/sortants, réseaux sociaux** | `marketing/web/webhooks.js`, `marketing/social` | secrets chiffrés par module | fonctionnels, non repris ici |

Coffre existant **réutilisé** : `marketing/settings.js` + `security/crypto.js` (AES-256-GCM, secret lié à `organisation:clé`, clé `ENCRYPTION_KEY` hors base). Activation par site : `siteModules` (module « ai »). **Redondances** : aucune table de connexions n'existait ; chaque module portait sa configuration. **Défaut** : clé IA unique pour toute la plateforme, sans test ni état.

## 2. Architecture retenue (`src/services/connectors/`)

- **Registre** (`index.js`) : un fichier par fournisseur dans `adapters/` ; chargement **limité à ce dossier du dépôt** (aucun code n'est chargé parce qu'un nom apparaît en base ou dans une requête) ; `register()` valide le contrat et refuse un doublon ; identifiants `^[a-z0-9-]{2,40}$`.
- **Contrat d'un adaptateur** : `id, name, provider, category, version, description, longDescription, baseUrl` (HTTPS, **nom d'hôte déclaré**), `docsUrl, credentialsUrl, auth.method, requirements[], costNote, privacyNote, fields[]` (types `secret | text | select | boolean | number`, formats validés), `capabilities{ nom → fonction }`, `test()` (non destructif), `limits.perMinute` (facultatif).
- **Capacités** (`capabilities.js`) : contrats stables, entrées validées, **sortie normalisée** identique pour tous les fournisseurs. Réelle aujourd'hui : `text.generate` (texte, modèle, jetons). Aucune capacité n'est déclarée sans implémentation.
- **Couche réseau unique** (`http.js`) : aucun adaptateur n'appelle `fetch`. HTTPS seulement, nom d'hôte égal à celui déclaré (jamais une adresse IP littérale, jamais d'identifiants dans l'adresse), **refus des adresses privées / locales / lien-local** (résolution DNS vérifiée), **aucune redirection**, délai (20 s), taille de réponse bornée (2 Mo), JSON seulement, statuts normalisés (`auth_invalid`, `permission_denied`, `quota_exceeded`, `rate_limited`, `model_not_found`, `unavailable`, `timeout`, `network`, `response_too_large`, `invalid_response`…), messages nettoyés des secrets. Les clés voyagent en **en-têtes**, jamais dans l'adresse. Seule exception, pour les tests : `CONNECTOR_API_BASE_<ID>`, **ignorée en production**.
- **Connexions** (migration 100) : `mk_connections` (une ligne par organisation, site et connecteur ; `site_id NULL` = niveau central ; configuration non secrète en JSON ; **noms** des secrets seulement) et `mk_connector_prefs`. Secrets : `mk_settings` sous `connector.<id>.<champ>`, chiffrés, jamais renvoyés.
- **États** (distincts, jamais un seul statut ambigu) : *Disponible* (catalogue) · *Indisponible* (prérequis technique absent : `ENCRYPTION_KEY`) · *Configuré* (enregistré, non testé) · *Connecté* (**dernier test réussi**) · *En erreur* · *Désactivé* · *En attente d'autorisation* (réservé aux flux OAuth, non utilisé : aucun connecteur OAuth livré).
- **Moteur** (`configure`, `test`, `setDisabled`, `revokeSecrets`, `remove`, `setShared`, `setPreference`, `invoke`, `status`, `credentialsFor`) : toute modification de configuration ou de secret **invalide l'ancien test** ; un secret illisible est traité comme manquant (message clair, aucune erreur technique).
- **Priorité central / site** (explicite) : un site utilise **sa propre** connexion ; à défaut, la connexion centrale **seulement si l'équipe l'a partagée** (désactivé par défaut, jamais visible par le site) ; un site qui désactive sa connexion **ne retombe pas** en silence sur la centrale.
- **Fournisseurs multiples** : préférence par fonction et par niveau ; sans préférence et plusieurs fournisseurs connectés → **refus explicite** ; **aucun basculement automatique** (coûts, données, préférences du site) : une panne est signalée.
- **Limites d'usage** : 30 demandes par minute et par connexion (réglable par adaptateur) ; validation des entrées avant tout appel.

## 3. Connecteurs livrés

| Connecteur | Capacité | Authentification | Test de connexion (non destructif) | Vérifié |
|---|---|---|---|---|
| **Anthropic** | `text.generate` (API Messages) | clé d'API (`x-api-key`) | liste des modèles puis lecture du modèle choisi | contre un **faux serveur** (contrat, erreurs) ; **non testé avec une vraie clé** |
| **OpenAI** | `text.generate` (Chat Completions) | clé d'API (`Authorization: Bearer`) | lecture du modèle choisi | idem |
| **Google (Gemini)** | `text.generate` (generateContent) | clé d'API en-tête `x-goog-api-key` | lecture du modèle choisi | idem |
| **E-mail, SMS (Twilio), Stripe** | — (gérés par leurs modules) | — | — | **état réel affiché** (lu à leur configuration) avec lien vers leur écran ; non dupliqués |

Les noms de modèle proposés par défaut sont des **suggestions modifiables** : chaque test de connexion vérifie auprès du fournisseur que le modèle existe et que la clé y a accès.

## 4. Intégration avec les modules

`services/connectors.invoke(ctx, scope, capability, input)` est la **seule porte** d'accès aux fournisseurs pour un module ; `status()` dit honnêtement si une fonction est disponible (bouton grisé avec la raison). **Migré** : l'assistant d'IA marketing (`marketing/ai`) lit désormais la clé du connecteur du site (ou de la connexion centrale partagée), puis, à défaut, `ANTHROPIC_API_KEY` (comportement historique inchangé, 36 tests existants inchangés). **Non migré** : l'éditeur d'articles (`blogAi`, niveau plateforme), SEO, e-mail, SMS, Stripe (voir §7).

## 5. Sécurité

Droits côté serveur recalculés pour le niveau demandé (`settings.read` pour voir ; `settings.write` pour agir ; `settings.sensitive` pour enregistrer, révoquer ou supprimer un secret ; partage : équipe seulement) ; niveau central fermé aux accès limités à un site ; secrets d'un site inaccessibles à un autre même avec l'identifiant (revérification de la portée de chaque ligne) ; un secret copié d'une ligne à l'autre est illisible (contexte lié) ; journal d'audit (`connection.*`) **sans secret** ; aucune valeur secrète dans l'API, la page, les messages d'erreur ni la base de connexions ; interface sans injection de HTML.

## 6. Ajouter un fournisseur (procédure)

1. Créer `src/services/connectors/adapters/<id>.js` (copier un adaptateur existant) : métadonnées, `baseUrl` HTTPS, champs, `capabilities`, `test()`.
2. Si la fonction n'a pas de contrat : l'ajouter dans `capabilities.js` (entrées validées, sortie normalisée).
3. Ajouter `tests/…` (faux serveur local : succès, clé refusée, modèle absent, quota, indisponible).
4. Aucune modification de l'interface, des routes ou du moteur : le catalogue, la fiche, le formulaire, le test, les droits et l'isolation viennent du contrat. **Connecteurs personnalisés par adresse libre : refusés** (risque SSRF) ; toute API sur mesure passe par un adaptateur validé du dépôt.

## 7. Non fait / dépendances externes

- **OAuth 2.0** (Search Console, Analytics…), stockage distant de fichiers, traduction, génération d'**images**, paiements et logistique comme connecteurs natifs : non livrés (aucune simulation) ; le gabarit (états, contrat, secrets) est prêt, chaque fournisseur demande son adaptateur et sa vérification.
- Migration des secrets existants (Resend, Twilio, jeton d'IA de l'éditeur d'articles, Stripe) vers le coffre commun : à faire fournisseur par fournisseur sans casser leurs écrans.
- Les trois connecteurs d'IA dépendent d'un compte, d'une clé et d'un crédit chez le fournisseur ; ils n'ont **pas été essayés avec une vraie clé** dans cette livraison.
- `ENCRYPTION_KEY` doit être définie sur le serveur : sans elle, le catalogue affiche « Indisponible » avec la raison.
