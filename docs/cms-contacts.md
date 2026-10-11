# CMS KOLAKISA — Contact Core (palier 15)

## Audit de départ (ce qui existait)
Un système de contacts complet existait déjà dans le module marketing (jalons « Mailchimp ») : `mk_contacts` (adresse normalisée, unique par organisation), `mk_consents` (preuves en lecture seule), `mk_suppressions` / `mk_unsubscribes`, `mk_tags`, `mk_lists`, `mk_property_defs` + valeurs, `mk_contact_notes`, `mk_events` + bus d'événements idempotent, `mk_web_visitors` / `mk_web_events` (visiteurs anonymes → contact), un pont qui transforme déjà comptes et commandes en événements, la fiche contact avec chronologie, l'import et l'export CSV, les droits `contacts.*`.

**Décision : aucun second système.** Le palier 15 étend ce socle et le rend utilisable par tous les modules.

## Architecture
- `src/marketing/contactcore/index.js` — le point d'entrée UNIQUE : `identify`, `recordEvent`, `eventsOf`, `setLifecycle`, `setRecordStatus`, `findDuplicates`, `mergePreview`, `mergeContacts`, `consentProofs`, `maskContact`.
- `src/marketing/contactcore/hooks.js` — branche les commentaires sur le journal.
- Migration `061_contact_core.sql` (ajouts seulement) : colonnes `lifecycle_stage`, `record_status`, `origin_site_id`, `source_detail`, `job_title`, `normalized_phone`, `archived_at`, `merged_into_id` sur `mk_contacts` ; `site_id`, `object_type`, `object_id`, `actor_user_id` sur `mk_events` ; `format` et `multiple` sur `mk_property_defs` ; tables `mk_contact_aliases` et `mk_contact_merges`.

### Trois états, trois notions séparées
| Notion | Colonne | Qui la change |
|---|---|---|
| Abonnement marketing | `mk_contacts.status` (inchangé) | uniquement la conformité (consentement, désinscription, blocage) |
| Cycle de vie (métier) | `lifecycle_stage` : contact, prospect, abonné, membre, client, ancien client (+ étapes ajoutables via le réglage `contacts.lifecycle_stages`) | `identify` (à la création, jamais rétrogradé), `setLifecycle` |
| État de la fiche (technique) | `record_status` : active, inactive, archived, merged | `setRecordStatus`, fusion |

### Utilisateur ≠ contact ≠ consentement
- Le lien est explicite (`lms_user_id`) et refusé si l'adresse du compte diffère de celle de la fiche.
- Créer un compte, commenter ou soumettre un formulaire n'abonne jamais personne ; seule une case cochée enregistre une preuve (comportement existant, conservé).
- Une fiche archivée, inactive ou fusionnée n'est jamais jointe, ni par e-mail (`sendableSql`, `isSendable`) ni par SMS (`smsSendableSql`, `isSmsSendable`).

### Journal d'événements (ledger)
Un seul bus (`mk_events`). Écriture uniquement par `recordEvent` (validation du type, du contact, du site, de l'auteur, de l'objet, taille des données, idempotence). Un déclencheur SQL interdit de modifier le type, la date, la source, le site, l'objet ou l'auteur d'un événement ; restent modifiables `contact_id` (identification d'un anonyme, fusion), `email` et `metadata` (effacement). Lecture paginée par curseur (jamais toute la liste).
Anonyme → identifié : un événement reçu avec une adresse avant que la fiche n'existe est rattaché à la fiche à sa création (`identify`) ; le visiteur suivi est relié par `linkVisitor`.

### Doublons et fusion
Détection seule : même numéro normalisé (probable), même nom + entreprise (à vérifier). Fusion contrôlée par un administrateur : aperçu, confirmation obligatoire. La fiche absorbée est **conservée** (archivée, e-mail devenu alias du maître) ; champs vides, étiquettes, listes, propriétés, notes, événements et visites rejoignent le maître ; les preuves de consentement restent en lecture seule sur l'ancienne fiche et s'affichent sur le maître ; le statut d'abonnement du maître ne devient jamais plus permissif. **Pas de « défusion » pour l'instant.**

### Champs personnalisés
Types : texte, nombre, date, oui/non, choix, **choix multiple, URL, e-mail, téléphone** (stockés comme texte + format, ou choix + multiple : la contrainte de la table ne change pas). Validation côté serveur (URL http/https seulement, e-mail normalisé, téléphone E.164).

### Multi-site
Un contact appartient à l'**organisation** (explicite, c'est le modèle existant). `origin_site_id` indique le site d'origine ; les événements portent `site_id`. Une personne dont l'accès est limité à un site (`mk_site_members`) ne voit, en lecture seule et via `?site=`, que les contacts de CE site (origine ou événement sur ce site) ; les autres sites, les contacts de l'organisation et toute écriture lui sont fermés (403/404).

### Permissions (système du palier 9)
Nouvelles : `contacts.archive` (éditeur), `contacts.merge` (administrateur), `contacts.manage_fields` (éditeur), `contacts.view_sensitive` (lecteur), `events.view` (lecteur). Existantes réutilisées : `contacts.read/write/delete/import/export`, `compliance.manage` (consentements). Les rôles personnalisés existants gardent exactement leurs droits (migration). Sans `contacts.view_sensitive` : e-mail et téléphone masqués, recherche limitée aux noms, preuves détaillées et données d'événements masquées, export refusé.

### Intégrations réellement branchées
Inscription (fiche « membre », lien compte, `user.registered`) · formulaires (`identify` + `form.submitted` avec objet) · commentaires (`comment.created` / `comment.approved`, rattachés à une fiche existante, **aucune fiche créée**) · API `/api/v1/events` (désormais validée) · Outils → Export (type « Contacts », jamais coché d'office) · import CSV existant (inchangé).
Préparées seulement : checkout, commandes, tunnels, e-mailing, automatisations (elles émettent déjà des événements via le même bus ; il suffit d'appeler `recordEvent`).

## Limites connues
- Un contact a toujours une adresse e-mail (`email NOT NULL`) ; l'anonyme est un visiteur (`mk_web_visitors`), pas une fiche.
- Téléphone : normalisé seulement s'il peut l'être (indicatif connu) ; pas de doublon par e-mail « à l'alias » (`jean+x@…` = adresse distincte).
- Pas de défusion ; pas d'import de contacts par les Outils (l'import CSV existant reste la voie) ; pas de RLS (SQLite).
- Les événements rattachés à une adresse sans fiche sont conservés tant que la fiche n'est pas créée ou effacée (pas de purge automatique).
- La segmentation ne sait pas filtrer les champs « choix multiple ».
