# Mailchimp — documentation des fonctionnalités intégrées à Kolakisa

*Généré par `node scripts/mailchimp-doc.js` à partir du catalogue réel du code (`src/marketing/mailchimp/catalog.js`, `transactional.js`) : ce document ne peut pas diverger du code, un test le vérifie.*

## Lire ce document sans se tromper

- **Ce qui est vérifié** : chaque opération ci-dessous est testée de bout en bout (méthode, chemin, paramètres et corps reçus par le serveur Mailchimp **simulé** `tests/fake-mailchimp.js`). Les chemins, méthodes et champs obligatoires proviennent de la documentation publique de l'API Marketing v3 telle que connue du rédacteur.
- **Ce qui n'est PAS vérifié** : aucun appel n'a été fait vers le vrai service Mailchimp (aucune clé n'était disponible). Avant de s'y fier en production, passer le parcours « Connexion → Synchronisation → petite campagne de test » avec une clé réelle (voir `README_MAILCHIMP.md`).
- **Exemples de réponses** : fournis pour les opérations principales ; pour les autres, la réponse est le JSON renvoyé par Mailchimp (sans le bloc `_links`), toujours enveloppé par Kolakisa dans `{ "ok": true, "data": … }`.

## Principes communs

| Sujet | Règle |
|---|---|
| Authentification Mailchimp | HTTP Basic (identifiant quelconque, clé d'API en mot de passe). L'hôte dépend du centre de données porté par la clé : `https://<dc>.api.mailchimp.com/3.0` (dc extrait de `…-us21`). |
| Limite de débit | Mailchimp limite à **10 connexions simultanées** par compte (et coupe une requête après 120 s) — pas « 10 requêtes par seconde ». Kolakisa plafonne à **8** requêtes simultanées (10 au maximum quoi qu'on configure) et met les autres en attente. |
| Nouvelles tentatives | `429` : toujours réessayé (3 fois maximum, en respectant `Retry-After`, sinon 0,5 s · 1 s · 2 s avec gigue). `5xx` et pannes réseau : réessayés pour GET, PUT, PATCH, DELETE **jamais pour POST** (risque de doublon : un envoi ou une création). |
| Pagination | `count` (1 à 1000) et `offset`. Les lectures complètes (synchronisation, export) parcourent toutes les pages. |
| Enveloppe de réponse | `{ "ok": true, "data": … }` ou `{ "ok": false, "error": { "code", "message" (français), "detail"? } }`. |
| Droits | Permission `mailchimp.manage` (administrateur de l'organisation) ; jamais ouvert à un accès limité à un site. Toute requête qui modifie exige l'en-tête `X-Requested-With: fetch`. |
| Actions irréversibles | Envoi, planification, suppressions, suppression définitive, publication : refusées (`409 confirm_required`) sans `confirm: true` (corps) ou `?confirm=1` (requête). |
| Identifiants | Chaque identifiant de chemin est validé (audience : 10 caractères hexadécimaux ; membre : adresse e-mail ou empreinte MD5 de 32 caractères ; autres : lettres, chiffres, `_`, `-`, `.`). Un paramètre de requête non prévu est refusé. |
| Consentement | Kolakisa reste maître des consentements : voir `INTEGRATION_PLAN.md` §4 (le plus restrictif gagne). |

### Erreurs

| HTTP Mailchimp | Code Kolakisa | Statut renvoyé | Message (extrait) |
|---|---|---|---|
| 401, ou 403 « clé invalide » | `auth_invalid` | 422 | La clé d'API Mailchimp est refusée (invalide ou révoquée)… |
| 403 | `forbidden` | 422 | Mailchimp refuse cette action pour ce compte (droits ou offre insuffisants) |
| 404 | `not_found` | 404 | Élément introuvable chez Mailchimp… |
| 400 / 422 | `invalid_request` (champ fautif cité) | 400 | Mailchimp a refusé la demande (données invalides)… |
| 400 « Member Exists » | `member_exists` | 422 | Ce contact est déjà présent dans l'audience |
| 400 « compliance state » | `compliance_state` | 422 | Mailchimp refuse de réabonner cette adresse… |
| 429 | `rate_limited` | 429 | Mailchimp limite le nombre de requêtes simultanées… |
| 5xx | `server_error` | 502 | Mailchimp est momentanément indisponible |
| délai dépassé / réseau | `timeout` / `network` | 504 / 502 | Mailchimp n'a pas répondu à temps / Impossible de joindre Mailchimp |

## Couverture des fonctionnalités demandées

Chaque ligne renvoie aux opérations qui la réalisent. « COMPOSITE » = opération composée de Kolakisa (voir plus bas) ; « TX » = Transactionnel.

### LISTES / AUDIENCES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Créer, modifier, supprimer une audience | `audiences.create`, `audiences.update`, `audiences.delete` | Disponible |
| Récupérer toutes les audiences | `audiences.list`, `audiences.get` | Disponible |
| Statistiques d'une audience (ouverture, désinscription, croissance) | `audiences.get`, `audiences.growth`, `audiences.activity`, `audiences.clients`, `audiences.locations`, `audiences.abuse` | Disponible |
| Segments : créer, modifier, supprimer, lister | `segments.create`, `segments.update`, `segments.delete`, `segments.list`, `segments.get`, `segments.members`, `segments.batch`, `segments.addMember`, `segments.removeMember` | Disponible |
| Tags : ajouter, supprimer, lister | `tags.search`, `members.tags`, `members.tagsUpdate`, `segments.create`, `segments.batch` | Disponible |
| Groupes d'intérêts | `interestCategories.list`, `interestCategories.create`, `interestCategories.update`, `interestCategories.delete`, `interests.list`, `interests.create`, `interests.update`, `interests.delete` | Disponible |
| Merge fields (champs personnalisés) | `mergefields.list`, `mergefields.get`, `mergefields.create`, `mergefields.update`, `mergefields.delete` | Disponible |

### CONTACTS / MEMBRES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Ajouter un contact (abonnement) | `members.add`, `members.upsert` | Disponible |
| Désabonner un contact | `members.update` | Disponible |
| Mettre à jour un contact | `members.update`, `members.upsert` | Disponible |
| Supprimer définitivement | `members.deletePermanent` | Disponible |
| Historique d'activité d'un contact | `members.activity`, `members.events`, `members.goals`, `members.notes` | Disponible |
| Importer en masse | `audiences.batchSubscribe`, COMPOSITE:import CSV | Disponible |
| Archiver un contact | `members.archive` | Disponible |
| Contacts par statut (subscribed, unsubscribed, cleaned, pending) | `members.list` | Disponible |
| Vérifier si un e-mail existe | COMPOSITE:existence d'un contact | Disponible |
| Contacts supprimés (deleted members) | `members.list` | L'API ne liste que les contacts archivés (status=archived) ; un contact supprimé définitivement n'est plus lisible. |

### CAMPAGNES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Créer (regular, plaintext, rss, variate) | `campaigns.create` | Disponible |
| Modifier / dupliquer / supprimer | `campaigns.update`, `campaigns.replicate`, `campaigns.delete` | Disponible |
| Envoyer immédiatement | `campaigns.send` | Disponible |
| Planifier / annuler la planification | `campaigns.schedule`, `campaigns.unschedule` | Disponible |
| Envoyer un test | `campaigns.test` | Disponible |
| Pause / reprise d'une campagne RSS | `campaigns.pause`, `campaigns.resume` | Disponible |
| Lister avec filtres | `campaigns.list`, `campaigns.get` | Disponible |
| Résumé de campagne | `reports.get` | Disponible |
| Contenu HTML (lire / définir) | `campaigns.contentGet`, `campaigns.contentSet` | Disponible |
| Contrôle avant envoi | `campaigns.sendChecklist` | Disponible |

### TEMPLATES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Créer / modifier / supprimer un template HTML | `templates.create`, `templates.update`, `templates.delete` | Disponible |
| Lister (personnalisés + Mailchimp) | `templates.list`, `templates.get` | Disponible |
| Récupérer le HTML | `templates.defaultContent` | Disponible |
| Rendre un template avec des variables | COMPOSITE:aperçu de modèle | L'API Marketing n'a pas de point d'accès de rendu : Mailchimp rend les balises *|…|* à l'envoi. Kolakisa propose un aperçu LOCAL avec des valeurs d'exemple. |

### AUTOMATIONS

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Lister | `automations.list`, `automations.get` | Disponible |
| Démarrer / arrêter | `automations.start`, `automations.pause`, `automations.emailStart`, `automations.emailPause` | Disponible |
| Ajouter un contact | `automations.queueAdd`, `journeys.trigger` | Disponible |
| Supprimer un contact | `automations.removeSubscriber` | Disponible |
| E-mails d'une automation | `automations.emails`, `automations.email` | Disponible |
| File d'attente | `automations.queue`, `automations.queueGet` | Disponible |

### RAPPORTS & ANALYTICS

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Rapport global | `reports.get`, `reports.list` | Disponible |
| Ouvertures | `reports.opens` | Disponible |
| Clics | `reports.clicks`, `reports.clickMembers` | Disponible |
| Bounces durs et mous | COMPOSITE:rebonds, `reports.emailActivity` | Disponible |
| Désabonnements | `reports.unsubscribed` | Disponible |
| Abus | `reports.abuse`, `audiences.abuse` | Disponible |
| EepURL | `reports.eepurl` | Disponible |
| Domaines | `reports.domains` | Disponible |
| Géolocalisation | `reports.locations`, `audiences.locations` | Disponible |
| Performances des appareils | `audiences.clients` | L'API Marketing n'expose pas de répartition par appareil (mobile / ordinateur) : seule la répartition par application de messagerie est disponible. |
| Croissance d'audience | `audiences.growth` | Disponible |
| Comparaison de campagnes | COMPOSITE:comparaison | Disponible |
| Revenus des campagnes | `reports.productActivity`, `reports.get` | Disponible |
| Conseils et sous-rapports A/B | `reports.advice`, `reports.subReports` | Disponible |

### LANDING PAGES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Créer / modifier / supprimer | `landingPages.create`, `landingPages.update`, `landingPages.delete` | Disponible |
| Publier / dépublier | `landingPages.publish`, `landingPages.unpublish` | Disponible |
| Lister | `landingPages.list`, `landingPages.get`, `landingPages.content` | Disponible |
| Rapport | `landingPages.report`, `landingPages.reports` | Disponible |

### FORMULAIRES

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Récupérer le formulaire d'inscription | `audiences.signupForms` | Disponible |
| Modifier le formulaire (champs, style) | `audiences.signupFormCustomize`, `mergefields.create` | Disponible |
| Emails de confirmation (opt-in) | `audiences.update`, `members.add` | Double confirmation : option `double_optin` de l'audience, ou statut `pending` à l'ajout. Le TEXTE de l'e-mail de confirmation ne se modifie pas par l'API Marketing (interface Mailchimp). |

### WEBHOOKS

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Créer / supprimer / lister | `webhooks.create`, `webhooks.delete`, `webhooks.list`, `webhooks.get`, `webhooks.update` | Disponible |
| Événements subscribe, unsubscribe, profile, cleaned, upemail, campaign | COMPOSITE:réception des webhooks | Disponible |

### E-COMMERCE

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Boutiques | `stores.create`, `stores.update`, `stores.delete`, `stores.list`, `stores.get` | Disponible |
| Produits et variantes | `products.create`, `products.update`, `products.delete`, `products.list`, `products.get`, `variants.create`, `variants.update`, `variants.delete`, `variants.list` | Disponible |
| Commandes | `orders.create`, `orders.update`, `orders.delete`, `orders.list`, `orders.get` | Disponible |
| Clients e-commerce | `customers.create`, `customers.upsert`, `customers.delete`, `customers.list`, `customers.get` | Disponible |
| Rapport de revenus des campagnes | `reports.productActivity`, `reports.get` | Disponible |

### COMPTE

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Infos du compte | `account.info`, `account.ping` | Disponible |
| Domaines vérifiés | `account.domains`, `account.domainAdd`, `account.domainVerify`, `account.domainDelete` | Disponible |
| Applications autorisées | `account.apps` | L'API ne permet que de LISTER les applications autorisées ; leur révocation se fait dans Mailchimp. |
| Activité du compte | `account.activity` | Disponible |
| Utilisateurs du compte | — | NON DISPONIBLE : l'API Marketing v3 n'expose aucun point d'accès de gestion des utilisateurs du compte. |

### TRANSACTIONNEL (Mandrill)

| Fonctionnalité | Opérations | Remarque |
|---|---|---|
| Envoyer un e-mail transactionnel | TX:messages.send | Disponible |
| Utiliser un modèle | TX:messages.sendTemplate, TX:templates.render | Disponible |
| Suivi des messages | TX:messages.search, TX:messages.info, TX:messages.content | Disponible |
| Expéditeurs vérifiés | TX:senders.list, TX:senders.domains, TX:senders.addDomain, TX:senders.checkDomain, TX:senders.verifyDomain | Disponible |
| Webhooks transactionnels | TX:webhooks.list, TX:webhooks.add, TX:webhooks.update, TX:webhooks.delete | Disponible |
| Blacklist / whitelist | TX:rejects.list, TX:rejects.add, TX:rejects.delete, TX:allowlists.list, TX:allowlists.add, TX:allowlists.delete | Disponible |

## Opérations de l'API Marketing v3

157 opérations. Route interne = préfixe `/marketing/mailchimp/api` + route indiquée. Les paramètres de requête listés sont les seuls acceptés.

### Audiences

#### `audiences.list` — Lister toutes les audiences

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences`
- **Cas d'usage dans Kolakisa** : Écran « Audiences » : nom, effectif, taux d'ouverture et de clic de chaque audience.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `before_date_created`, `since_date_created`, `email`, `sort_field`, `sort_dir`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de requête :
`GET /marketing/mailchimp/api/audiences?count=10`

Exemple de réponse :
```json
{
  "ok": true,
  "data": {
    "lists": [
      {
        "id": "a1b2c3d4e5",
        "name": "Newsletter",
        "stats": {
          "member_count": 1250,
          "unsubscribe_count": 31,
          "open_rate": 0.42,
          "click_rate": 0.07
        }
      }
    ],
    "total_items": 1
  }
}
```

#### `audiences.get` — Détail d'une audience

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId`
- **Cas d'usage dans Kolakisa** : Fiche d'audience : coordonnées légales, rappel d'autorisation, statistiques.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.create` — Créer une audience

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/lists`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences`
- **Cas d'usage dans Kolakisa** : Créer l'audience qui recevra les inscrits d'un site Kolakisa.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`, `contact`, `permission_reminder`, `campaign_defaults`, `email_type_option`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "name": "Newsletter Kolakisa",
  "contact": {
    "company": "Ma société",
    "address1": "1 rue de la Paix",
    "city": "Paris",
    "state": "IDF",
    "zip": "75001",
    "country": "FR"
  },
  "permission_reminder": "Vous recevez ce message car vous vous êtes inscrit sur notre site.",
  "campaign_defaults": {
    "from_name": "Ma société",
    "from_email": "contact@example.com",
    "subject": "Actualités",
    "language": "fr"
  },
  "email_type_option": false
}
```

Exemple de réponse :
```json
{
  "id": "a1b2c3d4e5",
  "name": "Newsletter Kolakisa",
  "stats": {
    "member_count": 0
  }
}
```

#### `audiences.update` — Modifier une audience

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId`
- **Cas d'usage dans Kolakisa** : Changer le nom, l'expéditeur par défaut ou activer la double confirmation (double_optin).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.delete` — Supprimer une audience

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId`
- **Cas d'usage dans Kolakisa** : Retirer une audience devenue inutile (irréversible chez Mailchimp : tous ses membres disparaissent).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.growth` — Historique de croissance mensuel

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/growth-history`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/croissance`
- **Cas d'usage dans Kolakisa** : Graphique d'évolution des abonnés (existing, imports, optins).
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `sort_field`, `sort_dir`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.activity` — Activité quotidienne récente (jusqu'à 180 jours)

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/activity`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/activite`
- **Cas d'usage dans Kolakisa** : Courbe des 30 derniers jours : inscriptions, désinscriptions, e-mails envoyés.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.locations` — Répartition géographique des abonnés

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/locations`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/localisations`
- **Cas d'usage dans Kolakisa** : Carte des pays d'où viennent les abonnés.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.clients` — Clients de messagerie utilisés

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/clients`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/clients`
- **Cas d'usage dans Kolakisa** : Répartition par application de messagerie (Gmail, Apple Mail…) : la seule vue « appareils » exposée par l'API.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.abuse` — Plaintes (signalements d'abus) de l'audience

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/abuse-reports`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/plaintes`
- **Cas d'usage dans Kolakisa** : Surveiller la réputation d'expéditeur.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.batchSubscribe` — Ajouter / mettre à jour des contacts en masse

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/lot`
- **Cas d'usage dans Kolakisa** : Import CSV (jusqu'à 500 contacts par appel).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `members`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "members": [
    {
      "email_address": "ana@example.com",
      "status": "subscribed",
      "merge_fields": {
        "FNAME": "Ana"
      }
    }
  ],
  "update_existing": true
}
```

Exemple de réponse :
```json
{
  "new_members": [],
  "updated_members": [
    {
      "id": "…",
      "email_address": "ana@example.com",
      "status": "subscribed"
    }
  ],
  "total_created": 0,
  "total_updated": 1,
  "error_count": 0,
  "errors": []
}
```

#### `audiences.signupForms` — Formulaires d'inscription hébergés

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/signup-forms`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/formulaires`
- **Cas d'usage dans Kolakisa** : Récupérer les formulaires d'inscription d'une audience.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `audiences.signupFormCustomize` — Personnaliser le formulaire d'inscription

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/signup-forms`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/formulaires`
- **Cas d'usage dans Kolakisa** : Modifier l'en-tête, le contenu et les styles du formulaire hébergé.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `mergefields.list` — Lister les champs personnalisés (merge fields)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/merge-fields`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/champs`
- **Cas d'usage dans Kolakisa** : Faire correspondre les propriétés de contact Kolakisa aux champs Mailchimp.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `type`, `required`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `mergefields.get` — Détail d'un champ

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/merge-fields/{mergeId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/champs/:mergeId`
- **Cas d'usage dans Kolakisa** : Afficher le type et les options d'un champ.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `mergefields.create` — Créer un champ

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/merge-fields`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/champs`
- **Cas d'usage dans Kolakisa** : Ajouter un champ (texte, nombre, date, adresse…).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`, `type`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "name": "Ville",
  "type": "text",
  "tag": "VILLE",
  "required": false
}
```

Exemple de réponse :
```json
{
  "merge_id": 5,
  "tag": "VILLE",
  "name": "Ville",
  "type": "text"
}
```

#### `mergefields.update` — Modifier un champ

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/merge-fields/{mergeId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/champs/:mergeId`
- **Cas d'usage dans Kolakisa** : Renommer ou changer les options d'un champ.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `mergefields.delete` — Supprimer un champ

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/merge-fields/{mergeId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/champs/:mergeId`
- **Cas d'usage dans Kolakisa** : Retirer un champ inutilisé (les valeurs sont perdues).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `interestCategories.list` — Lister les groupes d'intérêts

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/interest-categories`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/groupes`
- **Cas d'usage dans Kolakisa** : Centre de préférences : catégories proposées aux abonnés.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `type`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interestCategories.create` — Créer un groupe d'intérêts

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/interest-categories`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/groupes`
- **Cas d'usage dans Kolakisa** : Ajouter une catégorie (cases à cocher, menu, boutons radio).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `title`, `type`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "title": "Exemple",
  "type": "regular"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interestCategories.update` — Modifier un groupe d'intérêts

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/interest-categories/{categoryId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId`
- **Cas d'usage dans Kolakisa** : Renommer ou réordonner.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interestCategories.delete` — Supprimer un groupe d'intérêts

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/interest-categories/{categoryId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId`
- **Cas d'usage dans Kolakisa** : Retirer une catégorie obsolète.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `interests.list` — Lister les intérêts d'un groupe

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/interest-categories/{categoryId}/interests`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId/interets`
- **Cas d'usage dans Kolakisa** : Options choisies par les abonnés.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interests.create` — Créer un intérêt

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/interest-categories/{categoryId}/interests`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId/interets`
- **Cas d'usage dans Kolakisa** : Ajouter une option.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "name": "Exemple"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interests.update` — Modifier un intérêt

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/interest-categories/{categoryId}/interests/{interestId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId/interets/:interestId`
- **Cas d'usage dans Kolakisa** : Renommer une option.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `interests.delete` — Supprimer un intérêt

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/interest-categories/{categoryId}/interests/{interestId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/groupes/:categoryId/interets/:interestId`
- **Cas d'usage dans Kolakisa** : Retirer une option.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `segments.list` — Lister les segments (et les tags statiques)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/segments`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/segments`
- **Cas d'usage dans Kolakisa** : Cibler une campagne sur un segment.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `type`, `since_created_at`, `before_created_at`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.get` — Détail d'un segment

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/segments/{segmentId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/segments/:segmentId`
- **Cas d'usage dans Kolakisa** : Conditions et effectif.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.create` — Créer un segment

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/segments`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/segments`
- **Cas d'usage dans Kolakisa** : Segment dynamique (options.conditions) ou statique (static_segment = e-mails).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "name": "Clients Paris",
  "options": {
    "match": "all",
    "conditions": [
      {
        "condition_type": "TextMerge",
        "field": "VILLE",
        "op": "is",
        "value": "Paris"
      }
    ]
  }
}
```

Exemple de réponse :
```json
{
  "id": 112233,
  "name": "Clients Paris",
  "type": "saved",
  "member_count": 87
}
```

#### `segments.update` — Modifier un segment

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/segments/{segmentId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/segments/:segmentId`
- **Cas d'usage dans Kolakisa** : Changer les conditions ou le nom.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.delete` — Supprimer un segment

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/segments/{segmentId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/segments/:segmentId`
- **Cas d'usage dans Kolakisa** : Retirer un segment (les membres restent dans l'audience).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `segments.members` — Membres d'un segment

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/segments/{segmentId}/members`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/segments/:segmentId/membres`
- **Cas d'usage dans Kolakisa** : Voir qui sera ciblé.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `include_cleaned`, `include_transactional`, `include_unsubscribed`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.batch` — Ajouter / retirer des membres d'un segment statique en lot

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/segments/{segmentId}`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/segments/:segmentId/lot`
- **Cas d'usage dans Kolakisa** : Tagguer en masse (members_to_add / members_to_remove, 500 maximum).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.addMember` — Ajouter un membre à un segment statique

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/segments/{segmentId}/members`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/segments/:segmentId/membres`
- **Cas d'usage dans Kolakisa** : Ajouter un contact à un tag.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "email_address": "ana@exemple.fr"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `segments.removeMember` — Retirer un membre d'un segment statique

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/segments/{segmentId}/members/{hash}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/segments/:segmentId/membres/:hash`
- **Cas d'usage dans Kolakisa** : Retirer un contact d'un tag.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `tags.search` — Lister / rechercher les tags d'une audience

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/tag-search`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/tags`
- **Cas d'usage dans Kolakisa** : Filtres par tag dans l'écran Contacts.
- **Paramètres de requête (facultatifs)** : `name`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Contacts (membres)

#### `members.list` — Lister les contacts d'une audience (filtres par statut)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres`
- **Cas d'usage dans Kolakisa** : Tableau des contacts : subscribed, unsubscribed, cleaned, pending, transactional, archived.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `email_type`, `status`, `since_timestamp_opt`, `before_timestamp_opt`, `since_last_changed`, `before_last_changed`, `unique_email_id`, `vip_only`, `interest_category_id`, `interest_ids`, `interest_match`, `sort_field`, `sort_dir`, `since_last_campaign`, `unsubscribed_since`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de requête :
`GET /marketing/mailchimp/api/audiences/a1b2c3d4e5/membres?status=subscribed&count=50`

Exemple de réponse :
```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "id": "f3b…",
        "email_address": "ana@example.com",
        "status": "subscribed",
        "merge_fields": {
          "FNAME": "Ana",
          "LNAME": "Diallo"
        },
        "tags": [
          {
            "id": 1,
            "name": "client"
          }
        ]
      }
    ],
    "total_items": 1
  }
}
```

#### `members.get` — Détail d'un contact (l'adresse e-mail ou son empreinte MD5 sont acceptées)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash`
- **Cas d'usage dans Kolakisa** : Fiche contact ; vérifier si une adresse existe (404 = absente).
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.add` — Ajouter un contact (abonnement)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/members`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/membres`
- **Cas d'usage dans Kolakisa** : Inscrire un visiteur : status « subscribed » (ou « pending » pour la double confirmation).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`, `status`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "email_address": "ana@example.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "Ana"
  },
  "tags": [
    "site"
  ]
}
```

Exemple de réponse :
```json
{
  "id": "f3b…",
  "email_address": "ana@example.com",
  "status": "subscribed"
}
```

#### `members.upsert` — Ajouter ou mettre à jour (upsert)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PUT /3.0/lists/{listId}/members/{hash}`
- **Route Kolakisa** : `PUT /marketing/mailchimp/api/audiences/:listId/membres/:hash`
- **Cas d'usage dans Kolakisa** : Synchronisation idempotente d'un contact (status_if_new pour un nouveau).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "email_address": "ana@exemple.fr"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.update` — Mettre à jour un contact / désabonner

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/members/{hash}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/membres/:hash`
- **Cas d'usage dans Kolakisa** : Changer le nom, les champs ou le statut (« unsubscribed » pour désabonner).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "status": "unsubscribed"
}
```

Exemple de réponse :
```json
{
  "email_address": "ana@example.com",
  "status": "unsubscribed"
}
```

#### `members.archive` — Archiver un contact

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/members/{hash}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/membres/:hash`
- **Cas d'usage dans Kolakisa** : Retirer un contact de l'audience sans le détruire (réversible par réabonnement).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `members.deletePermanent` — Supprimer définitivement un contact

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/members/{hash}/actions/delete-permanent`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/membres/:hash/suppression-definitive`
- **Cas d'usage dans Kolakisa** : Droit à l'effacement (RGPD) : irréversible, l'adresse ne pourra plus être réimportée.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `members.activity` — Historique d'activité d'un contact

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}/activity-feed`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/activite`
- **Cas d'usage dans Kolakisa** : Fiche contact : ouvertures, clics, désabonnement.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `activity_filters`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.tags` — Tags d'un contact

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}/tags`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/tags`
- **Cas d'usage dans Kolakisa** : Afficher les tags.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.tagsUpdate` — Ajouter / retirer des tags d'un contact

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/members/{hash}/tags`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/membres/:hash/tags`
- **Cas d'usage dans Kolakisa** : {tags:[{name,status:'active'|'inactive'}]}.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `tags`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "tags": [
    {
      "name": "client",
      "status": "active"
    },
    {
      "name": "prospect",
      "status": "inactive"
    }
  ]
}
```

Exemple de réponse :
```json
null
```

#### `members.notes` — Notes d'un contact

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}/notes`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/notes`
- **Cas d'usage dans Kolakisa** : Historique de contact.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.noteAdd` — Ajouter une note

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/members/{hash}/notes`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/membres/:hash/notes`
- **Cas d'usage dans Kolakisa** : Consigner un échange.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `note`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "note": "Appel du 30 octobre"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.goals` — Objectifs atteints par un contact

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}/goals`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/objectifs`
- **Cas d'usage dans Kolakisa** : Suivi des conversions.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.events` — Événements personnalisés d'un contact

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/members/{hash}/events`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/evenements`
- **Cas d'usage dans Kolakisa** : Historique d'événements envoyés à Mailchimp.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `members.eventAdd` — Enregistrer un événement personnalisé

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/members/{hash}/events`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/membres/:hash/evenements`
- **Cas d'usage dans Kolakisa** : Alimenter les automatisations (achat, inscription à une formation).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "name": "Exemple"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Campagnes

#### `campaigns.list` — Lister les campagnes (filtres : statut, type, dates)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/campaigns`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/campagnes`
- **Cas d'usage dans Kolakisa** : Écran « Campagnes ».
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `type`, `status`, `before_send_time`, `since_send_time`, `before_create_time`, `since_create_time`, `list_id`, `folder_id`, `member_id`, `sort_field`, `sort_dir`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.get` — Détail d'une campagne

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/campaigns/{campaignId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/campagnes/:campaignId`
- **Cas d'usage dans Kolakisa** : Résumé, paramètres, destinataires.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.create` — Créer une campagne (regular, plaintext, rss, variate)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/campaigns`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes`
- **Cas d'usage dans Kolakisa** : Assistant de création. Type « variate » = test A/B ; « rss » exige rss_opts.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `type`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "type": "regular",
  "recipients": {
    "list_id": "a1b2c3d4e5"
  },
  "settings": {
    "subject_line": "Nos nouveautés",
    "title": "Newsletter novembre",
    "from_name": "Ma société",
    "reply_to": "contact@example.com"
  }
}
```

Exemple de réponse :
```json
{
  "id": "9f8e7d6c5b",
  "type": "regular",
  "status": "save",
  "settings": {
    "subject_line": "Nos nouveautés"
  }
}
```

#### `campaigns.update` — Modifier une campagne

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PATCH /3.0/campaigns/{campaignId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/campagnes/:campaignId`
- **Cas d'usage dans Kolakisa** : Changer l'objet, l'expéditeur, le segment.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.delete` — Supprimer une campagne

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `DELETE /3.0/campaigns/{campaignId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/campagnes/:campaignId`
- **Cas d'usage dans Kolakisa** : Supprimer un brouillon (impossible pour une campagne envoyée).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.replicate` — Dupliquer une campagne

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/replicate`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/dupliquer`
- **Cas d'usage dans Kolakisa** : Repartir d'une campagne existante.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.sendChecklist` — Liste de contrôle avant envoi

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/campaigns/{campaignId}/send-checklist`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/campagnes/:campaignId/verification`
- **Cas d'usage dans Kolakisa** : Bloquer l'envoi tant que la liste n'est pas « is_ready ».
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.send` — Envoyer immédiatement

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/send`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/envoyer`
- **Cas d'usage dans Kolakisa** : Envoi réel à toute l'audience ciblée : irréversible.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.schedule` — Planifier l'envoi

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/schedule`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/planifier`
- **Cas d'usage dans Kolakisa** : schedule_time en UTC, minutes multiples de 15 ; timewarp et batch_delivery selon l'offre.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `schedule_time`
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de requête :
```json
{
  "schedule_time": "2026-11-05T09:00:00+00:00",
  "confirm": true
}
```

Exemple de réponse :
```json
null
```

#### `campaigns.unschedule` — Annuler un envoi planifié

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/unschedule`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/deplanifier`
- **Cas d'usage dans Kolakisa** : Repasser la campagne en brouillon.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.test` — Envoyer un e-mail de test

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/test`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/test`
- **Cas d'usage dans Kolakisa** : Valider le rendu (test_emails : 5 adresses maximum).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `test_emails`, `send_type`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "test_emails": [
    "moi@example.com"
  ],
  "send_type": "html"
}
```

Exemple de réponse :
```json
null
```

#### `campaigns.pause` — Mettre en pause une campagne RSS

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/pause`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/pause`
- **Cas d'usage dans Kolakisa** : Suspendre l'envoi automatique d'un flux RSS.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.resume` — Reprendre une campagne RSS

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/resume`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/reprendre`
- **Cas d'usage dans Kolakisa** : Relancer l'envoi automatique.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.cancelSend` — Interrompre un envoi en cours

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/cancel-send`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/annuler-envoi`
- **Cas d'usage dans Kolakisa** : Réservé aux comptes payants ; les e-mails déjà partis ne sont pas rappelés.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.createResend` — Créer un renvoi aux non-ouvreurs

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/campaigns/{campaignId}/actions/create-resend`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/campagnes/:campaignId/renvoi`
- **Cas d'usage dans Kolakisa** : Relancer ceux qui n'ont pas ouvert.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.contentGet` — Lire le contenu (HTML et texte)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/campaigns/{campaignId}/content`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/campagnes/:campaignId/contenu`
- **Cas d'usage dans Kolakisa** : Prévisualiser / éditer.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaigns.contentSet` — Définir le contenu (html, plain_text, template, url)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PUT /3.0/campaigns/{campaignId}/content`
- **Route Kolakisa** : `PUT /marketing/mailchimp/api/campagnes/:campaignId/contenu`
- **Cas d'usage dans Kolakisa** : Éditeur HTML de l'assistant (étape 4).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "html": "<h1>Bonjour *|FNAME|*</h1><p>Notre actualité…</p><p><a href=\"*|UNSUB|*\">Se désabonner</a></p>"
}
```

Exemple de réponse :
```json
{
  "html": "<h1>Bonjour *|FNAME|*</h1>…",
  "plain_text": "…"
}
```

#### `campaigns.feedback` — Commentaires de relecture

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/campaigns/{campaignId}/feedback`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/campagnes/:campaignId/commentaires`
- **Cas d'usage dans Kolakisa** : Collaboration interne.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `campaignFolders.list` — Lister les dossiers de campagnes

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/campaign-folders`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/dossiers-campagnes`
- **Cas d'usage dans Kolakisa** : Classer les campagnes.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Modèles (templates)

#### `templates.list` — Lister les modèles (personnalisés + Mailchimp)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/templates`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/modeles`
- **Cas d'usage dans Kolakisa** : Galerie de modèles : type « user », « base » ou « gallery ».
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `created_by`, `since_date_created`, `before_date_created`, `type`, `category`, `folder_id`, `sort_field`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `templates.get` — Détail d'un modèle

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/templates/{templateId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/modeles/:templateId`
- **Cas d'usage dans Kolakisa** : Nom, type, miniature.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `templates.create` — Créer un modèle HTML personnalisé

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/templates`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/modeles`
- **Cas d'usage dans Kolakisa** : Publier un modèle de la bibliothèque Kolakisa dans Mailchimp (HTML inline, 1 Mo maximum).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `name`, `html`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "name": "Newsletter simple",
  "html": "<html><body><h1>*|MC:SUBJECT|*</h1><div mc:edit=\"corps\">Contenu</div></body></html>"
}
```

Exemple de réponse :
```json
{
  "id": 10045,
  "name": "Newsletter simple",
  "type": "user",
  "active": true
}
```

#### `templates.update` — Modifier un modèle

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `PATCH /3.0/templates/{templateId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/modeles/:templateId`
- **Cas d'usage dans Kolakisa** : Changer le nom ou le HTML.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `templates.delete` — Supprimer un modèle

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `DELETE /3.0/templates/{templateId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/modeles/:templateId`
- **Cas d'usage dans Kolakisa** : Retirer un modèle personnalisé.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `templates.defaultContent` — HTML / sections par défaut d'un modèle

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/templates/{templateId}/default-content`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/modeles/:templateId/contenu`
- **Cas d'usage dans Kolakisa** : Récupérer le HTML pour l'éditeur.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Automatisations

#### `automations.list` — Lister les automatisations classiques

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/automations`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations`
- **Cas d'usage dans Kolakisa** : Écran « Automatisations ».
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `before_create_time`, `since_create_time`, `before_start_time`, `since_start_time`, `status`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.get` — Détail d'une automatisation

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId`
- **Cas d'usage dans Kolakisa** : Statut, déclencheur, effectif.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.create` — Créer une automatisation classique

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/automations`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations`
- **Cas d'usage dans Kolakisa** : Séquence de bienvenue (trigger_settings.workflow_type, recipients.list_id).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `recipients`, `trigger_settings`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "recipients": {
    "list_id": "a1b2c3d4e5"
  },
  "trigger_settings": {
    "workflow_type": "welcomeSeries"
  }
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.start` — Démarrer tous les e-mails

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/actions/start-all-emails`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/demarrer`
- **Cas d'usage dans Kolakisa** : Activer l'automatisation.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `automations.pause` — Arrêter (mettre en pause) tous les e-mails

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/actions/pause-all-emails`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/arreter`
- **Cas d'usage dans Kolakisa** : Suspendre l'automatisation.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `automations.archive` — Archiver une automatisation

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/actions/archive`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/archiver`
- **Cas d'usage dans Kolakisa** : Retirer définitivement de la liste active.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `automations.emails` — E-mails d'une automatisation

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}/emails`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId/emails`
- **Cas d'usage dans Kolakisa** : Étapes de la séquence.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.email` — Détail d'un e-mail d'automatisation

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}/emails/{emailId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId`
- **Cas d'usage dans Kolakisa** : Délai, objet, statut.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.emailStart` — Démarrer un e-mail

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/emails/{emailId}/actions/start`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId/demarrer`
- **Cas d'usage dans Kolakisa** : Activer une étape.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `automations.emailPause` — Mettre un e-mail en pause

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/emails/{emailId}/actions/pause`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId/arreter`
- **Cas d'usage dans Kolakisa** : Suspendre une étape.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `automations.queue` — File d'attente d'un e-mail

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}/emails/{emailId}/queue`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId/file`
- **Cas d'usage dans Kolakisa** : Voir qui recevra l'e-mail.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.queueAdd` — Ajouter un contact à l'automatisation (file de l'e-mail)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/emails/{emailId}/queue`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId/file`
- **Cas d'usage dans Kolakisa** : Inscrire manuellement un contact.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "email_address": "ana@example.com"
}
```

Exemple de réponse :
```json
{
  "id": "…",
  "email_address": "ana@example.com",
  "list_id": "a1b2c3d4e5"
}
```

#### `automations.queueGet` — Un contact dans la file

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}/emails/{emailId}/queue/{hash}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId/emails/:emailId/file/:hash`
- **Cas d'usage dans Kolakisa** : Vérifier l'inscription d'un contact.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.removed` — Contacts retirés de l'automatisation

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/automations/{automationId}/removed-subscribers`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/automatisations/:automationId/retires`
- **Cas d'usage dans Kolakisa** : Historique des retraits.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `automations.removeSubscriber` — Retirer un contact de l'automatisation

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/automations/{automationId}/removed-subscribers`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/automatisations/:automationId/retires`
- **Cas d'usage dans Kolakisa** : Arrêter la séquence pour un contact (définitif pour cette automatisation).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "email_address": "ana@exemple.fr",
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `journeys.trigger` — Déclencher une étape de parcours client (Customer Journeys)

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/customer-journeys/journeys/{journeyId}/steps/{stepId}/actions/trigger`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/parcours/:journeyId/etapes/:stepId/declencher`
- **Cas d'usage dans Kolakisa** : Faire entrer un contact dans un parcours via une étape « API ».
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `email_address`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "email_address": "ana@exemple.fr"
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

### Rapports et analytics

#### `reports.list` — Rapports de toutes les campagnes envoyées

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports`
- **Cas d'usage dans Kolakisa** : Dashboard analytics global.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `type`, `before_send_time`, `since_send_time`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.get` — Rapport global d'une campagne (ouvertures, clics, rebonds, désabonnements, revenus)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId`
- **Cas d'usage dans Kolakisa** : Résumé de campagne.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de requête :
`GET /marketing/mailchimp/api/rapports/9f8e7d6c5b`

Exemple de réponse :
```json
{
  "ok": true,
  "data": {
    "id": "9f8e7d6c5b",
    "emails_sent": 1250,
    "opens": {
      "opens_total": 880,
      "unique_opens": 520,
      "open_rate": 0.416
    },
    "clicks": {
      "clicks_total": 140,
      "unique_clicks": 96,
      "click_rate": 0.077
    },
    "bounces": {
      "hard_bounces": 4,
      "soft_bounces": 9
    },
    "unsubscribed": 6,
    "ecommerce": {
      "total_revenue": 1840.5
    }
  }
}
```

#### `reports.opens` — Qui a ouvert, et quand

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/open-details`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/ouvertures`
- **Cas d'usage dans Kolakisa** : Tableau des ouvertures par contact.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `since`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.clicks` — Liens cliqués et nombre de clics

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/click-details`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/clics`
- **Cas d'usage dans Kolakisa** : Tableau des clics par lien.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.clickMembers` — Qui a cliqué sur un lien

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/click-details/{linkId}/members`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/clics/:linkId/membres`
- **Cas d'usage dans Kolakisa** : Détail par lien.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.emailActivity` — Activité par destinataire (ouvertures, clics, rebonds)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/email-activity`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/activite`
- **Cas d'usage dans Kolakisa** : Base des rapports de rebonds.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `since`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.sentTo` — Destinataires et statut de livraison

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/sent-to`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/destinataires`
- **Cas d'usage dans Kolakisa** : Savoir à qui la campagne a été envoyée.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.unsubscribed` — Désabonnements causés par la campagne

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/unsubscribed`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/desabonnements`
- **Cas d'usage dans Kolakisa** : Rapport des désabonnements.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.abuse` — Signalements d'abus

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/abuse-reports`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/plaintes`
- **Cas d'usage dans Kolakisa** : Suivre les plaintes.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.domains` — Performance par domaine de messagerie

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/domain-performance`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/domaines`
- **Cas d'usage dans Kolakisa** : Comparer gmail.com, orange.fr…
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.locations` — Localisation géographique des ouvertures

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/locations`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/localisations`
- **Cas d'usage dans Kolakisa** : Carte par pays.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.eepurl` — Activité des liens raccourcis EepURL

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/eepurl`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/eepurl`
- **Cas d'usage dans Kolakisa** : Suivi des partages sociaux.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.advice` — Conseils de performance

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/advice`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/conseils`
- **Cas d'usage dans Kolakisa** : Recommandations de Mailchimp.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.productActivity` — Revenus par produit

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/ecommerce-product-activity`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/produits`
- **Cas d'usage dans Kolakisa** : Rapport de revenus e-commerce d'une campagne.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `reports.subReports` — Sous-rapports (test A/B, variantes)

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reports/{campaignId}/sub-reports`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/rapports/:campaignId/sous-rapports`
- **Cas d'usage dans Kolakisa** : Comparer les variantes d'un test A/B.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Pages de destination (landing pages)

#### `landingPages.list` — Lister les landing pages

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/landing-pages`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/pages`
- **Cas d'usage dans Kolakisa** : Écran « Pages ».
- **Paramètres de requête (facultatifs)** : `sort_dir`, `sort_field`, `count`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.get` — Détail d'une landing page

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/landing-pages/{pageId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/pages/:pageId`
- **Cas d'usage dans Kolakisa** : Statut, URL publique.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.create` — Créer une landing page

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/landing-pages`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/pages`
- **Cas d'usage dans Kolakisa** : name, title, type « signup » ou « product » (store_id).
- **Paramètres de requête (facultatifs)** : `use_default_list`
- **Champs obligatoires du corps** : `type`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "type": "regular"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.update` — Modifier une landing page

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/landing-pages/{pageId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/pages/:pageId`
- **Cas d'usage dans Kolakisa** : Titre, nom, contenu.
- **Paramètres de requête (facultatifs)** : `use_default_list`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.delete` — Supprimer une landing page

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `DELETE /3.0/landing-pages/{pageId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/pages/:pageId`
- **Cas d'usage dans Kolakisa** : Retirer une page.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.publish` — Publier

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/landing-pages/{pageId}/actions/publish`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/pages/:pageId/publier`
- **Cas d'usage dans Kolakisa** : Mettre la page en ligne.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.unpublish` — Dépublier

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/landing-pages/{pageId}/actions/unpublish`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/pages/:pageId/depublier`
- **Cas d'usage dans Kolakisa** : Retirer la page de la ligne.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.content` — Contenu d'une landing page

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/landing-pages/{pageId}/content`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/pages/:pageId/contenu`
- **Cas d'usage dans Kolakisa** : Aperçu.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.reports` — Rapports de toutes les landing pages

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/reporting/landing-pages`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/pages-rapports`
- **Cas d'usage dans Kolakisa** : Visites et inscriptions.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `landingPages.report` — Rapport d'une landing page

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/reporting/landing-pages/{pageId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/pages/:pageId/rapport`
- **Cas d'usage dans Kolakisa** : Visites, désabonnements, conversions.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

### Webhooks

#### `webhooks.list` — Lister les webhooks d'une audience

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/webhooks`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/webhooks`
- **Cas d'usage dans Kolakisa** : Centre de webhooks.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `webhooks.get` — Détail d'un webhook

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/lists/{listId}/webhooks/{webhookId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/audiences/:listId/webhooks/:webhookId`
- **Cas d'usage dans Kolakisa** : Événements et sources.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `webhooks.create` — Créer un webhook (url, events, sources)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `POST /3.0/lists/{listId}/webhooks`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/audiences/:listId/webhooks`
- **Cas d'usage dans Kolakisa** : Événements : subscribe, unsubscribe, profile, cleaned, upemail, campaign.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `url`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "url": "https://exemple.fr/webhooks/mailchimp/1/<jeton>",
  "events": {
    "subscribe": true,
    "unsubscribe": true,
    "profile": true,
    "cleaned": true,
    "upemail": true,
    "campaign": true
  },
  "sources": {
    "user": true,
    "admin": true,
    "api": false
  }
}
```

Exemple de réponse :
```json
{
  "id": "ab12cd34",
  "url": "https://exemple.fr/webhooks/mailchimp/1/<jeton>",
  "events": {
    "subscribe": true
  },
  "sources": {
    "user": true
  }
}
```

#### `webhooks.update` — Modifier un webhook

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/lists/{listId}/webhooks/{webhookId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/audiences/:listId/webhooks/:webhookId`
- **Cas d'usage dans Kolakisa** : Changer les événements ou l'adresse.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `webhooks.delete` — Supprimer un webhook

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `DELETE /3.0/lists/{listId}/webhooks/{webhookId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/audiences/:listId/webhooks/:webhookId`
- **Cas d'usage dans Kolakisa** : Retirer un webhook.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

### E-commerce (boutiques Mailchimp)

#### `stores.list` — Lister les boutiques

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques`
- **Cas d'usage dans Kolakisa** : Relier une boutique à une audience.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `stores.get` — Détail d'une boutique

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId`
- **Cas d'usage dans Kolakisa** : Devise, audience, synchronisation.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `stores.create` — Créer une boutique

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/ecommerce/stores`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/boutiques`
- **Cas d'usage dans Kolakisa** : id, list_id, name, currency_code obligatoires.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `list_id`, `name`, `currency_code`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "id": "kolakisa-boutique",
  "list_id": "a1b2c3d4e5",
  "name": "Boutique Kolakisa",
  "currency_code": "EUR"
}
```

Exemple de réponse :
```json
{
  "id": "kolakisa-boutique",
  "name": "Boutique Kolakisa",
  "currency_code": "EUR"
}
```

#### `stores.update` — Modifier une boutique

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `PATCH /3.0/ecommerce/stores/{storeId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/boutiques/:storeId`
- **Cas d'usage dans Kolakisa** : Nom, domaine, devise.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `stores.delete` — Supprimer une boutique

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/ecommerce/stores/{storeId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/boutiques/:storeId`
- **Cas d'usage dans Kolakisa** : Efface produits, commandes et clients de la boutique chez Mailchimp.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `products.list` — Lister les produits

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/products`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/produits`
- **Cas d'usage dans Kolakisa** : Catalogue.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `products.get` — Détail d'un produit

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/products/{productId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/produits/:productId`
- **Cas d'usage dans Kolakisa** : Variantes et prix.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `products.create` — Ajouter un produit et ses variantes

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/ecommerce/stores/{storeId}/products`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/boutiques/:storeId/produits`
- **Cas d'usage dans Kolakisa** : id, title, variants[] obligatoires.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `title`, `variants`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "id": "exemple",
  "title": "Exemple",
  "variants": [
    {
      "id": "v1",
      "title": "Standard",
      "price": 49.9
    }
  ]
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `products.update` — Modifier un produit

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/ecommerce/stores/{storeId}/products/{productId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/boutiques/:storeId/produits/:productId`
- **Cas d'usage dans Kolakisa** : Titre, prix, image.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `products.delete` — Supprimer un produit

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/ecommerce/stores/{storeId}/products/{productId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/boutiques/:storeId/produits/:productId`
- **Cas d'usage dans Kolakisa** : Retirer du catalogue.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `variants.list` — Lister les variantes

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/products/{productId}/variants`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/produits/:productId/variantes`
- **Cas d'usage dans Kolakisa** : Tailles, couleurs.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `variants.create` — Ajouter une variante

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/ecommerce/stores/{storeId}/products/{productId}/variants`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/boutiques/:storeId/produits/:productId/variantes`
- **Cas d'usage dans Kolakisa** : id, title obligatoires.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `title`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "id": "exemple",
  "title": "Exemple"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `variants.update` — Modifier une variante

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/ecommerce/stores/{storeId}/products/{productId}/variants/{variantId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/boutiques/:storeId/produits/:productId/variantes/:variantId`
- **Cas d'usage dans Kolakisa** : Prix, stock.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `variants.delete` — Supprimer une variante

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/ecommerce/stores/{storeId}/products/{productId}/variants/{variantId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/boutiques/:storeId/produits/:productId/variantes/:variantId`
- **Cas d'usage dans Kolakisa** : Retirer.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `orders.list` — Lister les commandes

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/orders`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/commandes`
- **Cas d'usage dans Kolakisa** : Suivi des ventes.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `customer_id`, `has_outreach`, `campaign_id`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `orders.get` — Détail d'une commande

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/orders/{orderId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/commandes/:orderId`
- **Cas d'usage dans Kolakisa** : Lignes, client, attribution.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `orders.create` — Enregistrer une commande

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/ecommerce/stores/{storeId}/orders`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/boutiques/:storeId/commandes`
- **Cas d'usage dans Kolakisa** : Alimente le rapport de revenus des campagnes (campaign_id).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `customer`, `currency_code`, `order_total`, `lines`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "id": "exemple",
  "customer": {
    "id": "c1",
    "email_address": "ana@exemple.fr",
    "opt_in_status": true
  },
  "currency_code": "EUR",
  "order_total": 49.9,
  "lines": [
    {
      "id": "l1",
      "product_id": "p1",
      "product_variant_id": "v1",
      "quantity": 1,
      "price": 49.9
    }
  ]
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `orders.update` — Modifier une commande

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PATCH /3.0/ecommerce/stores/{storeId}/orders/{orderId}`
- **Route Kolakisa** : `PATCH /marketing/mailchimp/api/boutiques/:storeId/commandes/:orderId`
- **Cas d'usage dans Kolakisa** : Statut de paiement / livraison.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `orders.delete` — Supprimer une commande

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/ecommerce/stores/{storeId}/orders/{orderId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/boutiques/:storeId/commandes/:orderId`
- **Cas d'usage dans Kolakisa** : Annuler une commande saisie par erreur.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `customers.list` — Lister les clients e-commerce

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/customers`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/clients`
- **Cas d'usage dans Kolakisa** : Clients de la boutique.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`, `email_address`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `customers.get` — Détail d'un client

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/ecommerce/stores/{storeId}/customers/{customerId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/boutiques/:storeId/clients/:customerId`
- **Cas d'usage dans Kolakisa** : Total dépensé, commandes.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `customers.create` — Ajouter un client

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/ecommerce/stores/{storeId}/customers`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/boutiques/:storeId/clients`
- **Cas d'usage dans Kolakisa** : id, email_address, opt_in_status obligatoires.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `email_address`, `opt_in_status`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "id": "exemple",
  "email_address": "ana@exemple.fr",
  "opt_in_status": true
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `customers.upsert` — Ajouter ou mettre à jour un client

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `PUT /3.0/ecommerce/stores/{storeId}/customers/{customerId}`
- **Route Kolakisa** : `PUT /marketing/mailchimp/api/boutiques/:storeId/clients/:customerId`
- **Cas d'usage dans Kolakisa** : Synchronisation idempotente.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `id`, `email_address`, `opt_in_status`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "id": "exemple",
  "email_address": "ana@exemple.fr",
  "opt_in_status": true
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `customers.delete` — Supprimer un client

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/ecommerce/stores/{storeId}/customers/{customerId}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/boutiques/:storeId/clients/:customerId`
- **Cas d'usage dans Kolakisa** : Retirer.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

### Compte

#### `account.info` — Informations du compte

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/compte`
- **Cas d'usage dans Kolakisa** : Écran Connexion : nom, e-mail, offre, nombre d'abonnés.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.ping` — Test de santé de l'API

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mailchimp** : `GET /3.0/ping`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/compte/ping`
- **Cas d'usage dans Kolakisa** : Valider la clé en temps réel.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.apps` — Applications autorisées

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/authorized-apps`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/compte/applications`
- **Cas d'usage dans Kolakisa** : Lister les applications OAuth connectées.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.activity` — Activité récente du compte (Chimp Chatter)

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/activity-feed/chimp-chatter`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/compte/activite`
- **Cas d'usage dans Kolakisa** : Fil d'activité.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.domains` — Domaines d'expédition vérifiés

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `GET /3.0/verified-domains`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/compte/domaines`
- **Cas d'usage dans Kolakisa** : Vérifier que l'expéditeur est autorisé.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.domainAdd` — Ajouter un domaine à vérifier

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/verified-domains`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/compte/domaines`
- **Cas d'usage dans Kolakisa** : Envoie un code de vérification à l'adresse indiquée.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `verification_email`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "verification_email": "contact@exemple.fr"
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `account.domainVerify` — Vérifier un domaine avec le code reçu

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mailchimp** : `POST /3.0/verified-domains/{domain}/actions/verify`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/compte/domaines/:domain/verifier`
- **Cas d'usage dans Kolakisa** : Terminer la vérification.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `code`
- **Confirmation** : non requise

Exemple de corps (champs obligatoires) :
```json
{
  "code": "123456"
}
```

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

#### `account.domainDelete` — Supprimer un domaine

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `DELETE /3.0/verified-domains/{domain}`
- **Route Kolakisa** : `DELETE /marketing/mailchimp/api/compte/domaines/:domain`
- **Cas d'usage dans Kolakisa** : Retirer.
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : aucun
- **Confirmation** : obligatoire (`?confirm=1`) — sinon `409 confirm_required`

Réponse : le JSON de Mailchimp (en général vide, code 204 → `data: null`), enveloppé `{ "ok": true, "data": … }`.

### Lots (batches)

#### `batches.list` — Lister les lots d'opérations

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/batches`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/lots`
- **Cas d'usage dans Kolakisa** : Suivre les opérations groupées.
- **Paramètres de requête (facultatifs)** : `count`, `offset`, `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `batches.get` — État d'un lot

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `GET /3.0/batches/{batchId}`
- **Route Kolakisa** : `GET /marketing/mailchimp/api/lots/:batchId`
- **Cas d'usage dans Kolakisa** : Progression et URL des résultats.
- **Paramètres de requête (facultatifs)** : `fields`, `exclude_fields`
- **Champs obligatoires du corps** : aucun
- **Confirmation** : non requise

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

#### `batches.create` — Soumettre un lot d'opérations

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mailchimp** : `POST /3.0/batches`
- **Route Kolakisa** : `POST /marketing/mailchimp/api/lots`
- **Cas d'usage dans Kolakisa** : Opérations groupées (operations[] : method, path, body).
- **Paramètres de requête (facultatifs)** : aucun
- **Champs obligatoires du corps** : `operations`
- **Confirmation** : obligatoire (`confirm: true` dans le corps) — sinon `409 confirm_required`

Exemple de corps (champs obligatoires) :
```json
{
  "operations": [
    {
      "method": "GET",
      "path": "/lists",
      "operation_id": "op1"
    }
  ],
  "confirm": true
}
```

Réponse : le JSON de Mailchimp (voir la documentation officielle de la ressource), enveloppé `{ "ok": true, "data": … }`.

## Opérations composées (propres à Kolakisa)

Elles s'appuient sur les opérations ci-dessus et ajoutent des garanties (consentement, validation, lots, calcul local).

#### import CSV

- **Priorité** : CRITIQUE
- **Route** : `POST /marketing/mailchimp/api/audiences/:listId/import`
- **Description** : Import de 5 000 lignes au plus : adresses validées, doublons écartés, personnes désinscrites / rebondies / plaignantes chez Kolakisa écartées, lots de 500. Sans `attestConsent: true`, les contacts sont importés `pending` (Mailchimp envoie lui-même l'e-mail de confirmation).

Exemple de requête :
```json
{
  "rows": [
    {
      "email": "ana@exemple.fr",
      "FNAME": "Ana",
      "tags": "vip"
    }
  ],
  "attestConsent": true,
  "updateExisting": false,
  "tags": [
    "import"
  ]
}
```

Exemple de réponse :
```json
{
  "received": 1,
  "sent": 1,
  "created": 1,
  "updated": 0,
  "invalid": [],
  "blocked": 0,
  "duplicates": 0,
  "errors": [],
  "status": "subscribed"
}
```

#### export CSV

- **Priorité** : IMPORTANT
- **Route** : `GET /marketing/mailchimp/api/audiences/:listId/export.csv?status=subscribed`
- **Description** : Fichier CSV (BOM UTF-8, formules de tableur neutralisées).

Exemple de réponse :
`text/csv`

#### existence d'un contact

- **Priorité** : CRITIQUE
- **Route** : `GET /marketing/mailchimp/api/audiences/:listId/membres/:hash/existe`
- **Description** : Accepte l'adresse e-mail ou l'empreinte MD5.

Exemple de réponse :
```json
{
  "exists": true,
  "status": "subscribed",
  "email": "ana@exemple.fr"
}
```

#### aperçu de modèle

- **Priorité** : IMPORTANT
- **Route** : `POST /marketing/mailchimp/api/modeles/apercu`
- **Description** : Aperçu LOCAL : remplace les balises de fusion par des valeurs d'exemple (échappées).

Exemple de requête :
```json
{
  "html": "<p>Bonjour *|FNAME|*</p>",
  "variables": {
    "FNAME": "Camille"
  }
}
```

Exemple de réponse :
```json
{
  "html": "<p>Bonjour Camille</p>",
  "used": [
    "FNAME"
  ],
  "unknown": []
}
```

#### rebonds

- **Priorité** : CRITIQUE
- **Route** : `GET /marketing/mailchimp/api/rapports/:campaignId/rebonds`
- **Description** : Rebonds durs et mous d'une campagne (lus dans l'activité par destinataire).

Exemple de réponse :
```json
{
  "hard": [
    {
      "email": "x@exemple.fr",
      "at": "2026-10-30T10:00:00+00:00"
    }
  ],
  "soft": [],
  "total": 1
}
```

#### comparaison

- **Priorité** : IMPORTANT
- **Route** : `POST /marketing/mailchimp/api/rapports/comparer`
- **Description** : Compare 2 à 10 campagnes sur les mêmes indicateurs.

Exemple de requête :
```json
{
  "ids": [
    "9f8e7d6c5b",
    "1a2b3c4d5e"
  ]
}
```

Exemple de réponse :
```json
{
  "campaigns": [
    {
      "id": "9f8e7d6c5b",
      "sent": 100,
      "openRate": 0.3
    }
  ],
  "best": {
    "openRate": "9f8e7d6c5b",
    "clickRate": "1a2b3c4d5e"
  }
}
```

#### tableau de bord

- **Priorité** : CRITIQUE
- **Route** : `GET /marketing/mailchimp/api/tableau-de-bord?live=0`
- **Description** : Totaux, campagnes récentes, évolution sur 30 jours et alertes (rebonds ≥ 5 %, désabonnements ≥ 1 %, plaintes ≥ 0,1 % sur 7 jours, à partir de 100 envois).

Exemple de réponse :
```json
{
  "totals": {
    "audiences": 1,
    "contacts": 1250,
    "campaigns": 12,
    "avgOpenRate": 0.41,
    "revenue": 0
  },
  "alerts": []
}
```

#### liaison d'une audience

- **Priorité** : CRITIQUE
- **Route** : `POST /marketing/mailchimp/api/audiences/:listId/lier  ·  /delier`
- **Description** : Relie une audience à une liste Kolakisa (existante ou créée). Seules les audiences liées échangent des contacts.

Exemple de requête :
```json
{
  "create": true
}
```

Exemple de réponse :
```json
{
  "remoteId": "a1b2c3d4e5",
  "localListId": 12
}
```

#### synchronisation

- **Priorité** : CRITIQUE
- **Route** : `POST /marketing/mailchimp/api/sync`
- **Description** : Lance une synchronisation en arrière-plan (`full: true` relit tous les membres). L'état se lit par `GET /etat`.

Exemple de requête :
```json
{
  "full": false
}
```

Exemple de réponse :
```json
{
  "started": true
}
```

#### installation du webhook

- **Priorité** : CRITIQUE
- **Route** : `POST /marketing/mailchimp/api/audiences/:listId/webhooks/installer`
- **Description** : Crée (ou met à jour) chez Mailchimp le webhook qui pointe vers Kolakisa (sources user + admin, jamais api).

Exemple de requête :
```json
{}
```

Exemple de réponse :
```json
{
  "id": "ab12cd34",
  "created": true
}
```

#### réception des webhooks

- **Priorité** : CRITIQUE
- **Route** : `POST /webhooks/mailchimp/:organisation/:jeton`
- **Description** : Route PUBLIQUE appelée par Mailchimp (corps `application/x-www-form-urlencoded`). Voir la section « Webhooks entrants ».

Exemple de réponse :
```json
{
  "ok": true
}
```

#### journal des événements

- **Priorité** : IMPORTANT
- **Route** : `GET / POST /marketing/mailchimp/api/evenements  ·  /evenements/:id/rejouer`
- **Description** : Journal des événements reçus (filtres `type`, `status`, lecture incrémentale `after`) et rejeu d'un événement.

Exemple de réponse :
```json
{
  "events": []
}
```

#### journal des appels

- **Priorité** : IMPORTANT
- **Route** : `GET /marketing/mailchimp/api/journal-appels?limit=100`
- **Description** : Appels sortants (méthode, chemin masqué, statut, durée, tentatives), 30 jours.

Exemple de réponse :
```json
[]
```

## Webhooks entrants (Mailchimp → Kolakisa)

Mailchimp **ne signe pas** ses webhooks Marketing (il n'existe pas de signature HMAC à vérifier). Kolakisa protège donc le point d'entrée autrement :

1. l'adresse contient un **jeton secret** de 48 caractères, propre à l'organisation, chiffré en base et comparé à temps constant ; un jeton faux répond `404` sans explication ; il se régénère d'un clic (l'ancienne adresse cesse aussitôt de fonctionner) ;
2. l'événement doit concerner une **audience connue** (sinon enregistré « ignoré ») ;
3. chaque événement est **enregistré avec sa charge complète** avant d'être appliqué ; une clé de déduplication (organisation, type, date, adresse, identifiant) rend le traitement **idempotent** ;
4. la limite de corps est de 64 Ko (`413` au-delà) et le débit est limité par adresse IP ;
5. le webhook est créé avec les sources **user** et **admin** seulement : les écritures de Kolakisa par l'API ne reviennent pas en boucle.

Mailchimp teste l'adresse par un `GET` à la création : elle répond `200 ok` si le jeton est exact. Une fois le jeton validé, la réponse est toujours `200` (Mailchimp désactive un webhook qui répond en erreur) ; un événement en échec est conservé et peut être **rejoué** depuis l'écran.

| Événement | Effet dans Kolakisa |
|---|---|
| `subscribe` | contact créé ou retrouvé, consentement enregistré avec preuve (source `mailchimp`, audience d'origine), ajouté à la liste liée — **sauf** s'il est désinscrit, rebondi, plaignant ou supprimé chez Kolakisa : il reste désinscrit et son désabonnement est renvoyé à Mailchimp |
| `unsubscribe` | désinscription du contact (créé « désinscrit » s'il était inconnu : il ne sera jamais joignable) |
| `profile` | prénom et nom mis à jour (Mailchimp fait autorité) |
| `cleaned` | adresse placée en liste de suppression (rebond dur ; plainte si `reason = abuse`) |
| `upemail` | la nouvelle adresse est abonnée (preuve de consentement), l'ancienne est désinscrite |
| `campaign` | statut de la campagne mis à jour, rapport relu à la prochaine synchronisation |

Exemple (corps reçu, décodé) :
```json
{
  "type": "subscribe",
  "fired_at": "2026-10-30 10:00:00",
  "data": {
    "id": "8a25ff1d98",
    "list_id": "a1b2c3d4e5",
    "email": "ana@exemple.fr",
    "email_type": "html",
    "merges": {
      "EMAIL": "ana@exemple.fr",
      "FNAME": "Ana",
      "LNAME": "Diallo"
    },
    "ip_opt": "203.0.113.7"
  }
}
```

## Mailchimp Transactional (Mandrill)

**API distincte** de l'API Marketing : autre hôte (`https://mandrillapp.com/api/1.0/<catégorie>/<méthode>.json`), autre clé (SMTP & API Info de Transactional), autre facturation (module complémentaire payant de Mailchimp). Toutes les requêtes sont des `POST` JSON dont le corps contient la clé. Mandrill répond `HTTP 500` + `{ status: "error", name, message }` pour presque toutes les erreurs : Kolakisa les classe par `name` (`Invalid_Key` → `auth_invalid`, `PaymentRequired` → `quota`, `Unknown_*` → `not_found`, `ValidationError` → `invalid_request`).

Règles propres à Kolakisa : la clé est **vérifiée en direct** (`users/ping2`) avant d'être conservée chiffrée ; un envoi (`messages/send`, `send-template`) exige `confirm: true`, n'est **jamais réessayé** automatiquement, et est refusé avant tout appel si un destinataire a un **rebond dur ou une plainte** enregistrés chez Kolakisa (un destinataire simplement désinscrit du marketing reste autorisé : un reçu n'est pas du marketing) ; 50 destinataires au plus ; champs du message limités à une liste blanche.

Route : `POST /marketing/mailchimp/api/transactionnel/<opération>` (corps = champs Mandrill ; `PUT /marketing/mailchimp/api/transactionnel/cle` pour la clé).

#### `users.ping` — Test de santé de l'API Transactional

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/users/ping2.json`
- **Cas d'usage** : Valider la clé en direct.
- **Champs acceptés** : aucun
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `users.info` — Informations du compte (réputation, quota, envois)

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/users/info.json`
- **Cas d'usage** : Écran Transactionnel : réputation et envois restants.
- **Champs acceptés** : aucun
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `messages.send` — Envoyer un e-mail transactionnel

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/messages/send.json`
- **Cas d'usage** : Reçu, réinitialisation de mot de passe, confirmation de commande.
- **Champs acceptés** : `message`, `async`, `ip_pool`, `send_at`
- **Champs obligatoires** : `message`
- **Confirmation** : obligatoire (`confirm: true`)

Exemple de requête :
```json
{
  "message": {
    "subject": "Votre reçu",
    "from_email": "contact@exemple.fr",
    "from_name": "Ma société",
    "to": [
      {
        "email": "client@exemple.fr",
        "type": "to"
      }
    ],
    "html": "<p>Merci pour votre achat.</p>",
    "tags": [
      "recu"
    ]
  },
  "confirm": true
}
```

Exemple de réponse :
```json
[
  {
    "email": "client@exemple.fr",
    "status": "sent",
    "_id": "abc123",
    "reject_reason": null
  }
]
```

#### `messages.sendTemplate` — Envoyer avec un modèle transactionnel

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/messages/send-template.json`
- **Cas d'usage** : Reçu mis en forme par un modèle Mandrill (template_content / merge_vars).
- **Champs acceptés** : `template_name`, `template_content`, `message`, `async`, `ip_pool`, `send_at`
- **Champs obligatoires** : `template_name`, `message`
- **Confirmation** : obligatoire (`confirm: true`)

#### `messages.search` — Rechercher des messages envoyés

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/messages/search.json`
- **Cas d'usage** : Suivi des messages : par destinataire, tag, dates, statut.
- **Champs acceptés** : `query`, `date_from`, `date_to`, `tags`, `senders`, `api_keys`, `limit`
- **Champs obligatoires** : `query`
- **Confirmation** : non requise

#### `messages.info` — Détail d'un message envoyé

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/messages/info.json`
- **Cas d'usage** : Statut de livraison, ouvertures, clics d'un message.
- **Champs acceptés** : `id`
- **Champs obligatoires** : `id`
- **Confirmation** : non requise

#### `messages.content` — Contenu d'un message envoyé

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/messages/content.json`
- **Cas d'usage** : Réafficher un reçu envoyé (si conservé).
- **Champs acceptés** : `id`
- **Champs obligatoires** : `id`
- **Confirmation** : non requise

#### `messages.listScheduled` — Messages programmés

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/messages/list-scheduled.json`
- **Cas d'usage** : Voir les envois différés.
- **Champs acceptés** : `to`
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `messages.cancelScheduled` — Annuler un message programmé

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/messages/cancel-scheduled.json`
- **Cas d'usage** : Annuler un envoi différé.
- **Champs acceptés** : `id`
- **Champs obligatoires** : `id`
- **Confirmation** : obligatoire (`confirm: true`)

#### `senders.list` — Expéditeurs vérifiés

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/senders/list.json`
- **Cas d'usage** : Choisir une adresse d'expédition autorisée.
- **Champs acceptés** : aucun
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `senders.domains` — Domaines d'expédition

- **Priorité d'intégration** : CRITIQUE
- **Endpoint Mandrill** : `POST /api/1.0/senders/domains.json`
- **Cas d'usage** : Statut SPF / DKIM de chaque domaine.
- **Champs acceptés** : aucun
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `senders.addDomain` — Ajouter un domaine d'expédition

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/senders/add-domain.json`
- **Cas d'usage** : Déclarer un domaine à vérifier.
- **Champs acceptés** : `domain`
- **Champs obligatoires** : `domain`
- **Confirmation** : non requise

#### `senders.checkDomain` — Vérifier les enregistrements DNS d'un domaine

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/senders/check-domain.json`
- **Cas d'usage** : Contrôler SPF/DKIM après configuration DNS.
- **Champs acceptés** : `domain`
- **Champs obligatoires** : `domain`
- **Confirmation** : non requise

#### `senders.verifyDomain` — Vérifier un domaine par e-mail

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/senders/verify-domain.json`
- **Cas d'usage** : Terminer la vérification (mailbox + code).
- **Champs acceptés** : `domain`, `mailbox`
- **Champs obligatoires** : `domain`, `mailbox`
- **Confirmation** : non requise

#### `templates.list` — Modèles transactionnels

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/list.json`
- **Cas d'usage** : Galerie des modèles Mandrill.
- **Champs acceptés** : `label`
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `templates.info` — Détail d'un modèle

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/info.json`
- **Cas d'usage** : Code HTML publié et brouillon.
- **Champs acceptés** : `name`
- **Champs obligatoires** : `name`
- **Confirmation** : non requise

#### `templates.add` — Créer un modèle

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/add.json`
- **Cas d'usage** : Publier un modèle HTML de reçu.
- **Champs acceptés** : `name`, `from_email`, `from_name`, `subject`, `code`, `text`, `publish`, `labels`
- **Champs obligatoires** : `name`
- **Confirmation** : non requise

#### `templates.update` — Modifier un modèle

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/update.json`
- **Cas d'usage** : Mettre à jour le HTML.
- **Champs acceptés** : `name`, `from_email`, `from_name`, `subject`, `code`, `text`, `publish`, `labels`
- **Champs obligatoires** : `name`
- **Confirmation** : non requise

#### `templates.publish` — Publier le brouillon d'un modèle

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/publish.json`
- **Cas d'usage** : Mettre le brouillon en production.
- **Champs acceptés** : `name`
- **Champs obligatoires** : `name`
- **Confirmation** : obligatoire (`confirm: true`)

#### `templates.render` — Rendre un modèle avec des variables

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/templates/render.json`
- **Cas d'usage** : Aperçu d'un modèle avec merge_vars réels.
- **Champs acceptés** : `template_name`, `template_content`, `merge_vars`
- **Champs obligatoires** : `template_name`
- **Confirmation** : non requise

Exemple de requête :
```json
{
  "template_name": "recu",
  "template_content": [],
  "merge_vars": [
    {
      "name": "NOM",
      "content": "Camille"
    }
  ]
}
```

Exemple de réponse :
```json
{
  "html": "<p>Bonjour Camille</p>"
}
```

#### `templates.delete` — Supprimer un modèle

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/templates/delete.json`
- **Cas d'usage** : Retirer un modèle.
- **Champs acceptés** : `name`
- **Champs obligatoires** : `name`
- **Confirmation** : obligatoire (`confirm: true`)

#### `webhooks.list` — Webhooks transactionnels

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/webhooks/list.json`
- **Cas d'usage** : Centre de webhooks transactionnels.
- **Champs acceptés** : aucun
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `webhooks.add` — Créer un webhook transactionnel

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/webhooks/add.json`
- **Cas d'usage** : Recevoir send, hard_bounce, soft_bounce, open, click, spam, unsub, reject.
- **Champs acceptés** : `url`, `description`, `events`
- **Champs obligatoires** : `url`
- **Confirmation** : non requise

#### `webhooks.update` — Modifier un webhook

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/webhooks/update.json`
- **Cas d'usage** : Changer les événements.
- **Champs acceptés** : `id`, `url`, `description`, `events`
- **Champs obligatoires** : `id`, `url`
- **Confirmation** : non requise

#### `webhooks.delete` — Supprimer un webhook

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/webhooks/delete.json`
- **Cas d'usage** : Retirer.
- **Champs acceptés** : `id`
- **Champs obligatoires** : `id`
- **Confirmation** : obligatoire (`confirm: true`)

#### `rejects.list` — Liste de rejet (blacklist)

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/rejects/list.json`
- **Cas d'usage** : Adresses que Mandrill ne livrera plus (rebonds, plaintes, manuel).
- **Champs acceptés** : `email`, `include_expired`, `subaccount`
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `rejects.add` — Ajouter une adresse à la liste de rejet

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/rejects/add.json`
- **Cas d'usage** : Bloquer manuellement une adresse.
- **Champs acceptés** : `email`, `comment`, `subaccount`
- **Champs obligatoires** : `email`
- **Confirmation** : non requise

#### `rejects.delete` — Retirer une adresse de la liste de rejet

- **Priorité d'intégration** : IMPORTANT
- **Endpoint Mandrill** : `POST /api/1.0/rejects/delete.json`
- **Cas d'usage** : Débloquer une adresse (uniquement un rejet manuel).
- **Champs acceptés** : `email`, `subaccount`
- **Champs obligatoires** : `email`
- **Confirmation** : obligatoire (`confirm: true`)

#### `allowlists.list` — Liste d'autorisation (whitelist)

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/allowlists/list.json`
- **Cas d'usage** : Adresses jamais rejetées automatiquement.
- **Champs acceptés** : `email`
- **Champs obligatoires** : aucun
- **Confirmation** : non requise

#### `allowlists.add` — Ajouter à la liste d'autorisation

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/allowlists/add.json`
- **Cas d'usage** : Forcer la livraison pour une adresse.
- **Champs acceptés** : `email`, `comment`
- **Champs obligatoires** : `email`
- **Confirmation** : non requise

#### `allowlists.delete` — Retirer de la liste d'autorisation

- **Priorité d'intégration** : OPTIONNEL
- **Endpoint Mandrill** : `POST /api/1.0/allowlists/delete.json`
- **Cas d'usage** : Retirer.
- **Champs acceptés** : `email`
- **Champs obligatoires** : `email`
- **Confirmation** : obligatoire (`confirm: true`)

## Ce que l'API ne permet pas (et que Kolakisa ne simule pas)

- Gérer les **utilisateurs du compte** (aucun point d'accès dans l'API Marketing v3).
- **Révoquer** une application autorisée (lecture seule).
- Une répartition par **appareil** (mobile / ordinateur) : seule la répartition par application de messagerie existe (`audiences.clients`).
- Un **rendu** de modèle par l'API : Mailchimp rend les balises à l'envoi ; Kolakisa n'offre qu'un aperçu local avec des valeurs d'exemple.
- Modifier le **texte de l'e-mail de confirmation** de la double inscription (interface Mailchimp).
- Retrouver un contact **supprimé définitivement**.
- Créer des parcours **Customer Journeys** complets : l'API permet seulement de déclencher une étape de type API (`journeys.trigger`).
