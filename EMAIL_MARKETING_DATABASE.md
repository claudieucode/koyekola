# EMAIL MARKETING KOYEKOLA — Base de données

> Ce document décrit ce qui **existe réellement** (jalon M0) et ce qui est **prévu** (phases suivantes).
> Source de vérité : les fichiers `src/marketing/migrations/*.sql`.

## 1. Conventions

| Règle | Détail |
|---|---|
| Préfixe | Toutes les tables du module s'appellent `mk_…` : aucune collision avec le LMS, repérage immédiat |
| Isolation | Toute table de données porte `organization_id NOT NULL` ; **tout accès passe par `createRepository(db, organizationId)`** (`src/marketing/db/repository.js`), qui impose l'organisation à chaque requête |
| Couplage avec le LMS | Les colonnes qui désignent un utilisateur du LMS (`user_id`, `lms_user_id`) n'ont **pas de clé étrangère** : le marketing ne bloque jamais la gestion des comptes (ex. `npm run seed` efface les utilisateurs) |
| Instants | `mk_jobs` et `mk_events` : **millisecondes** (entiers), pratiques pour les délais et testables sans horloge. `mk_audit_logs`, `mk_settings`, `mk_organizations`… : texte `datetime('now')` (UTC), lisible directement |
| Secrets | Jamais en clair : AES-256-GCM, lié à `organisation:nom` (`ENCRYPTION_KEY`) |
| SQL | Requêtes préparées uniquement ; noms de tables/colonnes vérifiés contre le schéma réel |

## 2. Migrations

- Fichiers `NNN_nom_en_minuscules.sql` dans `src/marketing/migrations/`, appliqués **dans l'ordre**, **un par transaction**, au démarrage du serveur.
- Table `schema_migrations (scope, version, name, checksum, applied_at)`. Le `scope` vaut `marketing` (le LMS pourra avoir le sien).
- **Une migration appliquée ne se modifie jamais** (son empreinte SHA-256 est vérifiée) : on crée une nouvelle migration.
- Une nouvelle migration doit avoir un numéro **supérieur** à la dernière appliquée.
- Échec : la migration est **annulée entièrement**, le module marketing se déclare indisponible (erreur affichée dans les journaux), le LMS continue de fonctionner.
- **Sauvegarde automatique avant toute migration** sur une base qui contient déjà des données : `data/backups/AVANT-MIGRATION-<date>-v<version>.db` (copie cohérente `VACUUM INTO`). Si la copie est impossible, la migration **n'est pas appliquée**. Les 10 plus récentes sont conservées ; `npm run sauvegarde` ne les touche pas.

### Restaurer une sauvegarde
1. Arrêter le serveur. 2. Copier le fichier choisi (ex. `data/backups/AVANT-MIGRATION-….db`) par-dessus `data/KOYEKOLA.db`. 3. Relancer : les migrations manquantes se réappliquent. (Les données créées après la sauvegarde sont perdues : faites d'abord une copie de la base actuelle.)

## 3. Tables implémentées

### Migration 001 — Fondations
| Table | Rôle | Points clés |
|---|---|---|
| `mk_organizations` | Une entreprise cliente (aujourd'hui : KOYEKOLA, `slug = koyekola`) | `status` `active`/`suspended` |
| `mk_org_members` | Qui accède à quelle organisation | PK `(organization_id, user_id)` ; rôle `owner > admin > editor > viewer` ; les formateurs du LMS deviennent `owner` au démarrage (jamais rétrogradés) |
| `mk_settings` | Réglages par organisation | PK `(organization_id, key)` ; `is_secret = 1` ⇒ valeur chiffrée |
| `mk_audit_logs` | Journal d'audit : qui, quoi, ressource, quand, métadonnées | **Écriture seule** (déclencheurs `RAISE(ABORT)` sur UPDATE/DELETE) ; une organisation qui a un journal ne peut pas être supprimée ; valeurs sensibles masquées avant écriture |

### Migration 002 — Événements et file
| Table | Rôle | Points clés |
|---|---|---|
| `mk_jobs` | File de travaux | `state` : `pending → running → done` ou `dead` ; `priority` 1 (urgent) à 9 ; bail (`locked_by`, `locked_until`) ; `attempts / max_attempts` ; `last_error` ; **unicité `(COALESCE(organization_id,0), idempotency_key)`** |
| `mk_events` | Bus d'événements | unicité `(organization_id, idempotency_key)` ; `processed_at` vide tant que l'événement n'est pas distribué ; `contact_id` rempli à partir de la phase Contacts |

Index : file → `(state, run_at, priority, id)` pour la réservation ; événements → par nom, par e-mail, et « en attente » (index partiel).

### Migration 003 — Audience
| Table | Rôle |
|---|---|
| `mk_contacts` | Contact : e-mail **normalisé** (unique par organisation), identité, `status` (`unknown` par défaut, `subscribed`, `unsubscribed`, `bounced`, `complained`, `suppressed`), dates d'activité, `lms_user_id` (sans clé étrangère) |
| `mk_property_defs` / `mk_contact_property_values` | Propriétés personnalisées typées (texte, nombre, date, oui/non, choix) ; une colonne de valeur par type, indexées |
| `mk_lists` / `mk_list_members` | Listes et appartenances (n'implique aucun consentement) |
| `mk_tags` / `mk_contact_tags` | Étiquettes (insensibles à la casse) |

### Migration 004 — Conformité
| Table | Rôle |
|---|---|
| `mk_consents` | Preuves de consentement **en écriture seule** : action (`granted`/`withdrawn`), source, texte exact présenté, IP **tronquée**, date. Suppression permise seulement quand le contact n'existe plus (droit à l'effacement) |
| `mk_suppressions` | Adresses jamais joignables (rebond, plainte, blocage manuel, effacement demandé), liées à l'**adresse** : réimporter un contact effacé ne le rend pas joignable |
| `mk_unsubscribes` | Désinscriptions actives, globales ou d'une liste |
| `mk_preference_categories` / `mk_contact_preferences` | Centre de préférences (pas de ligne = catégorie ouverte) |

### Migration 005 — Segments
`mk_segments` : définition JSON validée par une grammaire fermée (voir `src/marketing/segments/engine.js`). Un segment ne stocke pas ses contacts : il est recalculé à chaque usage.

### Migration 006 — Imports CSV
`mk_imports` (aperçu → exécution par tranches reprenables, compteurs, fichier conservé le temps de l'import puis vidé) et `mk_import_rejects` (lignes rejetées et raison, 1 000 au plus par import).

### Migration 007 — Modèles d'e-mails
`mk_templates` (nom unique par organisation, type marketing/transactionnel, objet, préheader, thème, pied de page, **blocs en JSON validé et normalisé** — jamais de HTML libre stocké — et numéro de version) et `mk_template_versions` (20 dernières versions, restaurables). Voir `EMAIL_MARKETING_MODELES.md`.

### Migration 008 — Envoi
`mk_campaigns` (cible liste/segment, **contenu figé au lancement**, options de suivi, état, **compteurs** incrémentés avec l'événement qui les cause), `mk_campaign_recipients` (destinataires matérialisés ; `UNIQUE(campagne, contact)`), `mk_messages` (un envoi = une ligne, `UNIQUE(campagne, contact)`, identifiant fournisseur), `mk_message_events` (journal ajouté seulement, `dedupe_key` pour les webhooks rejoués), `mk_links` (adresses suivies : la destination d'un clic est lue ici). Les lignes détaillées d'un contact partent en cascade avec lui ; les compteurs de campagne restent. Voir `EMAIL_MARKETING_ENVOI.md`.

### Migration 009 — Pont LMS et automatisations
`mk_bridge_cursors` (jusqu'où chaque table du LMS a été lue ; **sans curseur, la première lecture n'émet rien**), `mk_automations` (déclencheur, filtre, étapes en édition, **étapes figées à l'activation**), `mk_automation_runs` (un contact × un scénario, `UNIQUE`, étapes d'origine conservées, date de réveil), `mk_automation_log` (journal des étapes). Les e-mails d'un scénario passent par des **campagnes « système »** (`mk_campaigns.kind = 'automation'`, `automation_id`, une par étape d'e-mail et par activation) : suivi, webhooks, désinscription et statistiques réutilisent le code des campagnes. Voir `EMAIL_MARKETING_AUTOMATIONS.md`.

## 4. Invariants garantis (et testés)

- Une organisation ne lit, ne modifie ni ne supprime jamais les lignes d'une autre.
- Un travail n'est réservé que par un seul worker à la fois ; un worker qui plante rend ses travaux (bail expiré) ; un travail abandonné trop souvent devient `dead`.
- Une même clé d'idempotence ne crée jamais deux travaux ni deux événements (par organisation).
- Un événement et son travail de distribution sont créés **ensemble ou pas du tout** (y compris dans la transaction d'une commande du LMS).
- Un événement déjà traité n'est jamais redistribué, même si son travail est rejoué.
- Le journal d'audit ne se modifie pas ; un secret ne se lit pas hors de son organisation et de son nom.
- **Le statut d'un contact ne change que par le module de conformité** (consentement prouvé, désinscription, suppression) : ni un import, ni l'API, ni une synchronisation, ni une modification manuelle ne peut abonner quelqu'un.
- **Un désinscrit n'est réabonné que par lui-même** (formulaire, centre de préférences, inscription, commande) ; une adresse bloquée (rebond, plainte) ne l'est jamais automatiquement.
- Un contact « abonné » sans preuve de consentement, ou dont l'adresse est en liste de suppression, est refusé par `isSendable()` (la seule porte vers l'envoi marketing).
- Un compte du LMS n'est jamais un consentement : les comptes existants sont des contacts « unknown ».
- Les preuves de consentement ne se modifient ni ne se suppriment directement.
- **Un message ne part que si `isSendable()` l'accepte AU MOMENT de l'envoi** ; le calcul en masse de l'audience (`sendableSql`) donne exactement les mêmes contacts (test d'invariant). Aucun doublon : `UNIQUE(campagne, contact)`.
- **L'historique du LMS ne déclenche jamais d'événement** (curseurs initialisés à la fin) ; chaque événement du pont a une clé d'idempotence ; les actions d'un scénario n'émettent aucun événement (pas de boucle).
- Un contact entre une fois dans un scénario ; marketing : consentement revérifié avant chaque e-mail ; transactionnel : liste de suppression respectée.
- Un modèle ne peut lire que la liste blanche de variables (contact, propriétés de SON organisation, organisation, liens système) ; un modèle marketing contient toujours le lien de désinscription.

## 5. Tables prévues (ajoutées phase par phase, jamais en avance)

| Jalon | Tables |
|---|---|
| M1 Audience | **réalisé** (migrations 003 à 006, voir ci-dessus) |
| M2 Contenu | **réalisé** (migration 007) |
| M3 Envoi | **réalisé** (migration 008 ; réglages du fournisseur dans `mk_settings`, clés chiffrées). Reste : `mk_campaign_variants` (A/B, M5), `mk_domains` (M6) |
| M4 Automatisation | **réalisé** (migration 009) |
| M5 Croissance | `mk_forms`, `mk_form_submissions`, `mk_api_keys`, `mk_webhook_endpoints`, `mk_webhook_deliveries`, `mk_attributions`, `mk_campaign_stats` |

## 6. Volumes visés et limites (SQLite)

| Contacts | Faisabilité |
|---|---|
| ≤ 100 000 | Réaliste (index sur `(organization_id, email)` et `(organization_id, status)`, pagination par curseur, segments évalués par la base, envois par lots) |
| 1 000 000 | Demande PostgreSQL et un worker séparé. L'architecture le prépare (dépôts, file abstraite) sans le faire |

`mk_message_events` sera la table qui grossit le plus : agrégats pré-calculés pour les tableaux de bord, purge/archivage des anciens événements bruts.
