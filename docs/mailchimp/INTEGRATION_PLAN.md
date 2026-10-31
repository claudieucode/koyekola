# Mailchimp — plan d'intégration (tel que réalisé)

Ce document décrit l'architecture **construite** (pas un projet) et les écarts assumés par rapport au cahier des charges. Il suit l'audit `AUDIT.md`.

## 1. Architecture retenue

**Un connecteur de synchronisation à côté du moteur interne**, pas un remplacement. Kolakisa possède déjà une plateforme d'e-mailing complète (audiences, segments, campagnes, consentements, suppressions, automatisations). Mailchimp s'y ajoute comme un **service externe** : Kolakisa reste la source des *consentements et des suppressions* ; Mailchimp reste la source de tout le reste (statistiques, contenus, campagnes qu'il envoie lui-même).

```
écran Marketing → Mailchimp (public/js/mailchimp*.js)
        │  fetch JSON, en-tête X-Requested-With, droit mailchimp.manage
        ▼
routes  src/marketing/web/mailchimp.js ── enveloppe { ok, data | error } ── codes HTTP
        │
        ├─ operations.js  ← catalog.js (156 opérations : validation, confirmation, journal d'audit)
        ├─ composite.js   (import/export CSV, existence, rebonds, comparaison, aperçu, tableau de bord)
        ├─ sync.js        (synchronisation Mailchimp ↔ Kolakisa)       ← scheduler.js (toutes les heures)
        ├─ inbound.js     (webhooks reçus : journal, application idempotente, rejeu)
        ├─ transactional.js (Mandrill, API distincte)
        └─ connection.js → client.js (HTTP : plafond de requêtes, tentatives, journal) → errors.js (messages français)
                                    │
                                    ▼
                  moteur interne existant : audience/contacts, compliance/consent, compliance/suppression, lists, tags
```

Pourquoi **pas** le cadre `services/connectors` : il est organisé autour de *capacités typées* (aujourd'hui `text.generate` pour l'IA) et d'un **hôte fixe par adaptateur** ; Mailchimp a un hôte par centre de données et des centaines d'opérations. Suivre le précédent déjà en place pour l'e-mail (Marketing → Envoi : écran, réglages et secrets propres, état affiché dans la carte « externe » du catalogue) évitait de déformer ce cadre. Le **même coffre** est réutilisé : `mk_settings` + AES-256-GCM (`security/crypto.js`).

## 2. Fichiers créés / modifiés
Voir `CHANGELOG.md` (liste exhaustive). Principes : un fichier par responsabilité, aucune dépendance npm ajoutée (`fetch`, `crypto`, `node:sqlite` natifs), tout en français.

## 3. Schéma de base de données (migration `124_mailchimp.sql`, additive)

| Table | Contenu | Clé |
|---|---|---|
| `mk_mc_audiences` | miroir des audiences : nom, effectifs, taux, **liste Kolakisa liée** (`local_list_id`), webhook installé, curseur de lecture des membres | (organisation, audience) |
| `mk_mc_members` | correspondance **contact ↔ membre** : statut Mailchimp connu, empreinte, date | (organisation, audience, contact) |
| `mk_mc_campaigns` | miroir des campagnes : statut, objet, envoi, rapport (JSON) | (organisation, campagne) |
| `mk_mc_events` | **webhooks reçus** : type, adresse, charge complète (16 Ko), état (`received`/`applied`/`ignored`/`failed`), détail, rejeux ; clé de déduplication unique | id ; unique (organisation, déduplication) |
| `mk_mc_requests` | **journal des appels sortants** : méthode, chemin masqué, statut, durée, tentatives, code d'erreur (30 jours) | id |
| `mk_mc_state` | dernière synchronisation : date, état, résumé, erreur, verrou `running_since` | organisation |
| `mk_mc_template_html` | HTML des modèles créés ou modifiés depuis Kolakisa (l'API Mailchimp ne renvoie **pas** le HTML d'un modèle) | (organisation, modèle) |
| `mk_mc_erased` | **empreintes** (SHA-256 et MD5) des personnes effacées chez Kolakisa : à supprimer définitivement chez Mailchimp et à ne jamais réimporter ; la ligne disparaît une fois Mailchimp nettoyé | (organisation, empreinte) |

Migration : **huit** tables, toutes additives.

**Clés d'API et configuration** : dans `mk_settings` (réglages existants), chiffrées : `mailchimp.api_key`, `mailchimp.webhook_token`, `mailchimp.transactional_key` (secrets) ; `mailchimp.account` (informations non secrètes du compte), `mailchimp.sync_enabled`.

**Portée « multi-tenant »** : une connexion par **organisation** (comme Marketing → Envoi). Un site précis n'a pas sa propre clé ; les sites sont reliés via les **listes** Kolakisa (qui portent déjà un `site_id`). Tout est filtré par organisation ; deux organisations ne voient jamais les données de l'autre (testé). Réalisé : un contact d'une organisation importé de Mailchimp n'apparaît jamais dans l'autre.

## 4. Synchronisation bidirectionnelle et conflits

Seules les audiences **liées** à une liste Kolakisa échangent des contacts. Les autres ne sont que *lues* (effectifs, statistiques).

| Sens | Règle |
|---|---|
| Mailchimp → Kolakisa | `subscribed` → contact créé/mis à jour, **consentement enregistré avec preuve** (source `mailchimp`, audience d'origine, date), ajouté à la liste liée · `unsubscribed` → désinscription · `cleaned` → liste de suppression « rebond » · `pending` → contact sans consentement · `archived`/`transactional` → ignorés · prénom/nom et tags repris |
| Kolakisa → Mailchimp | contact **abonné avec consentement** de la liste liée, inconnu de Mailchimp → abonné (jamais sans consentement) · contact désinscrit/rebondi/plaignant/supprimé que Mailchimp croit abonné → **désabonné** chez Mailchimp |
| Conflit | **Le plus restrictif gagne** pour tout ce qui touche au consentement. Une personne désinscrite (de Kolakisa **ou de la liste liée**), rebondie, plaignante, supprimée ou effacée chez Kolakisa n'est **jamais réabonnée** (même si Mailchimp la dit abonnée) ; son désabonnement est renvoyé à Mailchimp. Les opérations génériques d'abonnement (`members.add/upsert/update`, lot) sont refusées pour ces adresses. Pour le reste (nom, tags, statuts de campagne, chiffres), **Mailchimp fait autorité** |
| Effacement | Une personne effacée chez Kolakisa (droit à l'effacement) est **supprimée définitivement** chez Mailchimp à la synchronisation suivante (`delete-permanent`), jamais réimportée entre-temps ; les événements de webhook qui la citent (y compris comme ancienne adresse) sont anonymisés |
| Événements | Les contacts nés d'une synchronisation n'émettent **pas** les événements « abonné » / « ajouté à la liste » : aucune série de bienvenue Kolakisa ne part vers des personnes déjà abonnées chez Mailchimp |
| Campagnes | statut, objet, envoi lus ; rapports relus pour les campagnes envoyées dans les 7 derniers jours (et celles jamais lues) |
| Incrémental | `since_last_changed`, membres lus du plus ancien au plus récent ; le curseur n'avance qu'**après** l'envoi complet des désabonnements ; au-delà de 50 000 membres, chaque passe reprend là où la précédente s'est arrêtée ; recouvrement d'une minute ; « synchronisation complète » relit tout |
| Garde-fous | les lots de contacts rendent la main à l'event loop (le reste du site ne gèle pas) ; un envoi refusé par Mailchimp est mémorisé (pas de nouvel essai à chaque passe) ; verrou en base (pas deux synchronisations à la fois, périmé après 30 min) ; 2 000 envois vers Mailchimp au plus par audience et par passage ; 50 000 membres lus au plus ; erreurs d'une audience isolées des autres ; état `ok` / `partial` / `error` avec message |

Déclencheurs : minuteur horaire (`MAILCHIMP_SYNC_INTERVAL_MS`), bouton « Synchroniser maintenant », webhooks entrants (temps réel).

## 5. Erreurs, nouvelles tentatives et débit
- **Débit** : Mailchimp limite à **10 connexions simultanées** (pas 10 requêtes par seconde). Un sémaphore plafonne à 8 (10 maximum quoi qu'on configure), **partagé par organisation** : l'écran, la synchronisation et les webhooks se partagent le même plafond ; les autres requêtes attendent.
- **Tentatives** : `429` toujours réessayé (3 fois, `Retry-After` respecté, sinon 0,5 · 1 · 2 s + gigue) ; `5xx` et réseau réessayés **sauf pour un POST** (risque de doublon). Délai de 30 s par requête (60 s pour un contenu HTML).
- **Erreurs** : table de correspondance 400/401/403/404/429/5xx → code stable + message français actionnable (`errors.js`) ; champ fautif cité pour un 400 ; code HTTP interne cohérent.
- **Journal** : chaque appel est inscrit (sans clé, sans corps, empreinte de membre masquée) ; consultable dans l'onglet « Journal ».

## 6. Opérations asynchrones — écart assumé
Le brief demandait une file de travaux. La file existante (`mk_jobs`) n'est active qu'avec `MARKETING_WORKER=on`, ce qui n'est pas le cas par défaut : s'y appuyer aurait rendu la synchronisation **silencieusement inopérante** sur une installation standard. La synchronisation tourne donc **dans le processus** (minuteur + lancement manuel en arrière-plan) avec un **verrou en base** et un état consultable. Les imports de contacts sont découpés en lots de 500 (5 000 lignes au plus par import). Limite connue : si le serveur redémarre pendant une synchronisation, le verrou expire après 30 minutes et la suivante reprend (le curseur n'ayant pas avancé, rien n'est perdu).

## 7. Sécurité
| Sujet | Mesure |
|---|---|
| Clés d'API | validées en direct avant enregistrement (une clé refusée n'est jamais conservée), chiffrées AES-256-GCM liées à (organisation, réglage), jamais renvoyées, journalisées ni affichées ; illisibles depuis une autre organisation (testé) |
| **Webhooks entrants** | Mailchimp **ne signe pas** ses webhooks Marketing : **pas de HMAC possible**. Protection : jeton secret de 48 caractères dans l'adresse (comparaison à temps constant, 404 sans explication, rotation en un clic), audience connue obligatoire, déduplication, limite de 64 Ko, débit limité par IP, journal complet, rejeu |
| Droits | `mailchimp.manage` (administrateur de l'organisation), vérifié côté serveur sur **chaque** route ; accès limité à un site refusé |
| Requêtes inter-sites | cookie `SameSite=Lax` **et** en-tête `X-Requested-With: fetch` exigé pour toute modification |
| Injection | identifiants de chemin validés puis encodés, paramètres de requête sur liste blanche, corps JSON borné (profondeur, taille, clés `__proto__`/`constructor` refusées), CSV : formules de tableur neutralisées |
| Affichage | aucun HTML de Mailchimp injecté (textContent) ; aperçus d'e-mail dans un `iframe sandbox` sans script ; liens externes en `https` seulement, `rel="noopener noreferrer"` |
| Actions irréversibles | confirmation explicite côté serveur **et** dans l'écran (saisie du nom pour une suppression d'audience ou une suppression définitive) |
| Conformité | import CSV : sans attestation de consentement, contacts importés « en attente » (Mailchimp envoie la confirmation) ; personnes désinscrites/rebondies chez Kolakisa écartées de tout import |
| Mandrill | clé vérifiée avant conservation ; envoi refusé vers une adresse en rebond dur ou en plainte ; jamais réessayé |

## 8. Écarts par rapport au cahier des charges (liste complète)
1. **Pas de signature HMAC** des webhooks (elle n'existe pas côté Mailchimp) → jeton secret dans l'adresse (§7).
2. **« 10 requêtes par seconde »** → la vraie limite est de 10 connexions simultanées ; c'est elle qui est appliquée.
3. **File de travaux** → minuteur et verrou en base (§6).
4. **Routes `/api/mailchimp/…`** → `/marketing/mailchimp/api/…` (préfixe des écrans d'administration protégés par session et droits ; `/api/v1` est réservé aux clés d'API publiques).
5. **Webhook `POST /webhooks/mailchimp`** → `POST /webhooks/mailchimp/:organisation/:jeton` (l'organisation et le jeton font partie de l'adresse).
6. **Clé en `.env`** → saisie dans l'écran et chiffrée en base (comme les autres fournisseurs) ; `.env` ne porte que `ENCRYPTION_KEY`, `SITE_URL` et des options.
7. **« Mailchimp fait autorité »** → *sauf* pour le consentement et les suppressions (conformité) : le plus restrictif gagne.
8. **Fonctions que l'API ne propose pas** (non simulées, documentées dans `MAILCHIMP_DOC.md`) : gestion des utilisateurs du compte, révocation d'applications, répartition par appareil (seule la répartition par application de messagerie existe), rendu d'un modèle par l'API (aperçu local à la place), texte de l'e-mail de confirmation, création complète de parcours Customer Journeys.
9. **Export PDF** des rapports → impression du navigateur (« Enregistrer en PDF ») avec feuille de style d'impression ; l'export CSV est direct.
10. **Tests « avec des données réelles »** → impossibles sans clé : simulateur local fidèle aux formes de l'API ; **aucune validation contre le vrai Mailchimp n'est annoncée** (voir `TEST_RESULTS.md`).
