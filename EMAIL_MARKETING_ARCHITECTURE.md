# EMAIL MARKETING KOLAKISA — Architecture proposée

> **Statut : VALIDÉ (« go » de l'utilisateur) — jalon M0 réalisé, M1 à venir.** Voir « État d'avancement » en fin de document.
> Ce document décrit ce qui a été observé dans KOLAKISA (état réel au moment de l'analyse), ce que je propose de construire, et les décisions qui vous appartiennent.

---

## 0. Ce qui a été observé (faits, pas hypothèses)

| Sujet | Constat réel |
|---|---|
| Backend | Node ≥ 22.12, **Express 4**, un seul processus, ~6 700 lignes (vues + JS) |
| Frontend | **Rendu serveur EJS** + JavaScript sans framework (aucun React/Vue). Un éditeur Tiptap est empaqueté avec esbuild pour les formulaires de formation |
| Base de données | **SQLite** (`node:sqlite`, `DatabaseSync` : appels **synchrones**), 1 fichier `data/KOYEKOLA.db`, 27 tables, 35 index |
| Sessions | `express-session` avec un magasin maison dans la table `sessions` (SQLite) |
| Authentification | Cookie de session, mots de passe `bcryptjs`, **deux rôles** : `etudiant`, `formateur` (1 formateur aujourd'hui). Pas de jetons d'API, pas de OAuth |
| Sécurité existante | En-têtes de sécurité, contrôle Origin/Referer contre le CSRF (`sameOriginOnly`), limiteur de débit réutilisable (`createRateLimiter`), erreurs génériques, téléversements en liste blanche |
| E-mail actuel | `nodemailer` en SMTP (`SMTP_*`), **2 e-mails seulement** : bienvenue après achat, notification de contact. Envoi direct dans la requête, **rien n'est enregistré** (ni journal, ni file, ni statut) |
| Paiement | **Simulé** (`POST /commande` crée `orders` + `order_items` + `enrollments` dans une transaction). Stripe est prévu à l'Étape 4 du LMS, pas encore fait |
| Tâches planifiées | **Aucune** (aucun `setInterval`, aucun cron, aucun worker) |
| Consentement marketing | **Inexistant** : le formulaire d'inscription ne demande que pseudo, e-mail, mot de passe. Aucune case « newsletter » |
| Champs manquant pour le CRM | `users` n'a ni prénom/nom, ni pays, ni langue, ni téléphone, ni `last_login` |
| Données du LMS | 5 utilisateurs, 2 formations, 6 commandes (démo). Tests : 567 (`node:test`, serveur réel sur dossiers temporaires) |

### Événements métier qui existent déjà *dans le code* (mais sans bus d'événements)
| Événement | Où il naît | Remarque |
|---|---|---|
| `user_registered` | `src/routes/auth.js` (insertion dans `users`) | |
| `user_logged_in` | `src/routes/auth.js` (connexion réussie) | `last_login` n'est pas enregistré |
| `course_purchased` / `course_enrolled` | `src/routes/orders.js` (dans la transaction de commande) | Point d'accroche idéal : montant, formations, utilisateur |
| `lesson_completed` | `src/routes/learning.js` (auto à 90 %, bouton, quiz réussi) | 3 chemins différents |
| `quiz_attempted` | `src/routes/learning.js` | |
| `course_completed` | **Dérivé** (toutes les leçons faites), pas d'événement | À calculer |
| `review_posted` | `src/routes/courses.js` | |
| `favorite_added` | `src/routes/favorites.js` | |
| `contact_message_received` | `src/routes/pages.js` | |
| `course_started` | **Absent** (première ligne de `lesson_state` = équivalent) | À dériver |
| `certificate_generated` | **Absent** (le certificat est calculé à l'affichage, pas stocké) | À créer si voulu |
| `checkout_started` / `checkout_abandoned` | **Impossible aujourd'hui** : le panier vit dans la session, jamais enregistré | Demande d'enregistrer le panier |
| `user_inactive` | Dérivable de `lesson_state.updated_at` | Demande une tâche planifiée |

---

## 1. Architecture proposée

**Un monolithe modulaire** : le module marketing vit **dans la même application Express**, sous `/marketing`, avec ses propres tables préfixées `mk_`, son propre routeur, ses propres services et ses propres tests. Les frontières sont nettes (aucun accès direct aux tables du LMS depuis le marketing, sauf par un « pont » unique), ce qui permettra plus tard de l'extraire en service indépendant.

Pourquoi pas un service séparé tout de suite : un seul hébergement (Hostinger), une seule base à sauvegarder, une seule authentification, pas de réseau entre les deux. Le coût d'un service séparé (déploiement, jetons, latence, deux bases) n'est pas justifié pour 5 utilisateurs. Le découpage en modules garde la porte ouverte.

```
KOLAKISA (Express)
├── LMS existant (inchangé)
│     └── pont : src/marketing/bridge/koyekola.js   ← seul endroit qui connaît le LMS
│           émet des événements (user_registered, course_purchased…)
└── src/marketing/                                   ← nouveau, isolé
      contacts/  lists/  segments/  templates/  campaigns/  automations/
      events/  analytics/  forms/  settings/  providers/  deliverability/
      domains/  unsubscribe/  preferences/  api/  webhooks/  queue/  audit/
      routes (UI /marketing/*, API /api/v1/*, public /t/* /u/* /f/*)
```

Trois « surfaces » de routes, avec des règles de sécurité différentes :

| Surface | Adresses | Authentification | CSRF / origine |
|---|---|---|---|
| Interface d'administration | `/marketing/*` | session + rôle + organisation | contrôle d'origine existant |
| API | `/api/v1/*` | **clé d'API** (jamais de cookie) | pas de CSRF (pas de cookie), limitation de débit par clé |
| Public | `/t/*` (clics/ouvertures), `/u/*` (désinscription), `/f/*` (formulaires) | jeton signé dans l'adresse | exemptions **explicites et étroites** |

Deux points techniques à traiter dès le départ, sinon les formulaires intégrés ne marcheront pas : l'en-tête global `X-Frame-Options: SAMEORIGIN` empêche l'intégration en `iframe` sur d'autres sites (à remplacer par `frame-ancestors` **uniquement** sur `/f/*`), et le contrôle d'origine bloque les envois venant d'un autre site (à exempter **uniquement** pour `/f/:slug/submit`, protégé par jeton, champ piège et limitation de débit).

### Le cycle d'un envoi
```
Campagne ──> Audience (segment) ──> destinataires matérialisés (mk_campaign_recipients)
        ──> file de travaux (mk_jobs, idempotente) ──> worker (par lots, débit limité)
        ──> fournisseur d'envoi ──> (webhooks du fournisseur) ──> événements e-mail
        ──> statistiques / désinscriptions / rebonds / suppression
```

---

## 2. Technologies existantes réutilisables

| Besoin | Réutilisé de KOLAKISA | À ajouter |
|---|---|---|
| Serveur, routes, vues | Express, EJS, structure `src/routes`, `views/` | — |
| Base | SQLite `node:sqlite`, index, transactions | **Système de migrations versionnées** (il n'existe pas : le schéma est aujourd'hui créé/modifié dans `database.js`) |
| Authentification / rôles | sessions, `requireAuth`, `requireInstructor`, `bcryptjs` | organisations, rôles marketing, **clés d'API** |
| Sécurité | `securityHeaders`, `sameOriginOnly`, `createRateLimiter`, `UserError`, allow-lists de téléversement | signature HMAC, chiffrement AES-256-GCM des secrets, protection SSRF des webhooks sortants |
| E-mail | `nodemailer` + `SMTP_*` (peut servir de premier fournisseur « SMTP ») | interface `EmailProvider` + un fournisseur API |
| HTML sûr | `sanitize-html`, moteur Markdown sûr | nettoyage du HTML d'e-mail, moteur de variables sécurisé |
| Éditeur de texte | Tiptap (déjà empaqueté) pour les blocs texte | éditeur de blocs d'e-mail |
| Design | système « Éditorial net » (`style.css`), icônes maison, composants (cartes, boutons, badges, accordéon) | gabarit « marketing » avec barre latérale ; graphiques (SVG maison, sans grosse bibliothèque) |
| Tests | `node:test`, aides `startServer`/`Client`, 567 tests | tests unitaires des moteurs (segments, gabarits, file, automations) |
| Sauvegarde | `scripts/sauvegarde.js` | inclure les tables `mk_*` (même fichier) |

Ce qui ne peut **pas** être réutilisé tel quel : le SMTP direct dans la requête (bloquerait le serveur : `node:sqlite` est synchrone), et le magasin de sessions (inutile pour l'API).

---

## 3. Nouvelles tables (SQLite, toutes préfixées `mk_`, toutes avec `organization_id`)

Regroupées par domaine. Je n'en crée que le nécessaire ; ce qui peut se ranger dans une colonne JSON ne devient pas une table.

**Organisation & accès** : `mk_organizations`, `mk_org_members` (utilisateur LMS ↔ organisation, rôle `owner|admin|editor|viewer`), `mk_api_keys` (hachées, jamais en clair), `mk_audit_logs`, `mk_settings`, `schema_migrations`.

**Audience** : `mk_contacts`, `mk_property_defs` (propriétés personnalisées : nom, type, options), `mk_contact_property_values` (valeurs, indexées), `mk_lists`, `mk_list_members`, `mk_tags`, `mk_contact_tags`, `mk_segments` (conditions en JSON).

**Consentement & conformité** : `mk_consents` (preuve : date, source, adresse IP tronquée, texte présenté), `mk_unsubscribes` (portée : global ou par liste/catégorie), `mk_suppressions` (rebonds durs, plaintes, désinscriptions : liste noire absolue), `mk_preference_categories`, `mk_contact_preferences`.

**Contenu** : `mk_templates` (blocs en JSON + HTML rendu), `mk_forms`, `mk_form_submissions`.

**Envoi** : `mk_campaigns`, `mk_campaign_variants` (A/B), `mk_campaign_recipients`, `mk_messages` (un envoi = une ligne : identifiant fournisseur, statut), `mk_message_events` (délivré, ouvert, cliqué, rebond, plainte…), `mk_links` (liens suivis), `mk_domains`, `mk_provider_settings` (clé chiffrée).

**File & événements** : `mk_jobs` (file), `mk_events` (bus d'événements), `mk_outbox` (événements LMS à traiter).

**Automatisation** : `mk_automations` (graphe en JSON), `mk_automation_runs` (un contact dans un scénario), `mk_automation_run_log`.

**Intégrations sortantes** : `mk_webhook_endpoints`, `mk_webhook_deliveries`.

**Revenus** : `mk_attributions` (clic → achat).

≈ 35 tables. Détail complet, types, index, contraintes d'unicité : `EMAIL_MARKETING_DATABASE.md` (à produire à la Phase 2).

### Décision d'architecture n°1 — même fichier SQLite ou fichier séparé ?
**Recommandation : même fichier `KOYEKOLA.db`**, tables `mk_*`. Raison : le pont LMS écrit l'événement (`course_purchased`) **dans la même transaction** que la commande, donc jamais de commande sans événement. Avec deux fichiers, ce n'est plus atomique (SQLite en mode WAL n'offre pas d'atomicité entre bases attachées). Inconvénient : la base grossit avec `mk_message_events`. Compensation : une couche « dépôts » (repositories) pour tout accès aux données, afin de migrer vers PostgreSQL le jour où il le faudra (voir §10).

### Contacts ≠ utilisateurs
Un **contact** (marketing) n'est pas un **utilisateur** (LMS). Un prospect qui remplit un formulaire est un contact sans compte. Le lien se fait par l'e-mail (normalisé, unique par organisation) et un `lms_user_id` facultatif. Le statut marketing est **séparé** : `subscribed`, `unsubscribed`, `bounced`, `complained`, `suppressed`, **`unknown`** (aucune preuve de consentement).

---

## 4. Nouvelles API

Préfixe `/api/v1`, JSON, clé d'API dans `Authorization: Bearer mk_live_…`, limitation de débit par clé, pagination par curseur, réponses d'erreur homogènes.

| Ressource | Points d'accès principaux |
|---|---|
| `contacts` | `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/:id`, `POST /contacts/import`, `POST /contacts/:id/tags`, `…/lists` |
| `lists`, `tags` | CRUD + membres |
| `segments` | CRUD, `GET /segments/:id/preview` (compte, jamais la liste complète) |
| `templates` | CRUD, `POST /templates/:id/render` (test avec données) |
| `campaigns` | CRUD, `POST /campaigns/:id/test`, `…/schedule`, `…/send`, `…/pause`, `…/cancel`, `GET …/stats` |
| `automations` | CRUD, `POST …/activate`, `…/deactivate`, `GET …/runs` |
| `events` | **`POST /events`** (idempotent via `Idempotency-Key`) |
| `analytics` | `GET /analytics/overview`, `/campaigns/:id`, `/deliverability` |
| `webhooks` | CRUD des points d'accès, journal des livraisons |

Points publics (sans clé) : `GET /t/o/:token.gif`, `GET /t/c/:token`, `GET/POST /u/:token`, `GET/POST /preferences/:token`, `GET /f/:slug`, `POST /f/:slug/submit`, `GET /embed/form.js`.

Documentation : `EMAIL_MARKETING_API.md`.

---

## 5. Système d'événements

Structure unique : `mk_events(id, organization_id, name, contact_id, email, occurred_at, source, metadata JSON, idempotency_key UNIQUE)`.

- **Émission** : `emit(name, payload, {idempotencyKey})` insère l'événement puis crée les travaux nécessaires. Depuis le LMS, l'événement est inséré **dans la même transaction** que le changement métier (commande, inscription…), via le pont.
- **Filet de sécurité** : un travail de « rattrapage » compare régulièrement les tables du LMS (`orders`, `enrollments`, `lesson_progress`) aux événements déjà enregistrés, et rejoue ceux qui manquent (idempotent grâce à la clé `source:id`). Même un plantage entre l'écriture et l'émission ne perd rien.
- **Idempotence** : une clé unique par événement (`order:123`, `lesson_progress:456`) ; rejouer deux fois donne un seul événement.
- **Consommateurs** : le moteur d'automatisation (déclencheurs), les webhooks sortants, les statistiques, le journal d'activité récente.
- **Événements de départ** (branchés sur ce qui existe) : `user_registered`, `user_logged_in`, `course_purchased`, `course_enrolled`, `lesson_completed`, `course_completed` (dérivé), `quiz_attempted`, `review_posted`, `favorite_added`, `form_submitted`. **À créer dans le LMS** (petites modifications ciblées) : `checkout_started`/`checkout_abandoned` (enregistrer le panier), `last_login`, `certificate_generated`.

---

## 6. Système d'automatisation

- **Définition** : un graphe (nœuds + liens) stocké en JSON dans `mk_automations`, versionné (modifier un scénario actif ne perturbe pas les contacts en cours : ils terminent sur la version d'origine).
- **Déclencheurs** : événement, tag ajouté/retiré, contact ajouté à une liste, formulaire soumis, date précise, anniversaire, inactivité (tâche planifiée).
- **Nœuds** : envoyer un e-mail, attendre (durée ou date), condition (`email ouvert ?`, `tag ?`, propriété), ajouter/retirer un tag, ajouter/retirer d'une liste, modifier une propriété, webhook, notification interne, fin.
- **Exécution** : `mk_automation_runs` (contact × scénario × version × nœud courant × `wake_at`). Un travail de la file réveille le run à `wake_at`, exécute le nœud, programme le suivant. **Aucun processus ne « dort » en mémoire** : tout survit à un redémarrage.
- **Garde-fous** : unicité `(automation_id, contact_id, trigger_event_id)` (jamais deux fois pour le même événement) ; politique de ré-entrée configurable (une seule fois / après X jours) ; un contact désinscrit, suspendu ou sans consentement ne reçoit **aucun** e-mail marketing (vérifié au moment de l'envoi, pas seulement à l'entrée) ; limite de profondeur/boucles ; pause d'un scénario possible.
- **Séquences** : cas particulier simple (liste ordonnée « Jour 0, 1, 3, 7, 14 ») compilée en graphe.
- Documentation : `EMAIL_MARKETING_AUTOMATIONS.md`.

---

## 7. Système d'envoi

### Fournisseur (abstraction `EmailProvider`)
Interface : `send(message)`, `verifyWebhook(req)`, `parseWebhookEvents(body)`, `getDomainStatus(domain)`, `capabilities`. Implémentations :

| Fournisseur | Rôle |
|---|---|
| `console` | développement et tests : n'envoie rien, écrit dans un journal |
| `smtp` | réutilise `nodemailer` et les `SMTP_*` déjà présents (bon pour démarrer, peu d'événements de retour) |
| **fournisseur API principal** | recommandation : **Resend** (API simple, webhooks signés, vérification de domaine par API, palier gratuit) ; **Amazon SES** ensuite si le volume monte (moins cher, plus de configuration) |

Variables : `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `WEBHOOK_SECRET`, `ENCRYPTION_KEY`.

### File d'envoi (`mk_jobs`, dans SQLite)
Pourquoi pas Redis/BullMQ : l'hébergement visé (Hostinger Node) ne garantit ni Redis ni processus séparé. Une file dans SQLite avec bail (« lease ») fait le travail jusqu'à plusieurs centaines de milliers d'envois, et reste migrable vers une vraie file plus tard grâce à l'interface.

- Table : `id, organization_id, type, payload, state (pending|running|done|failed|dead), run_at, attempts, max_attempts, locked_by, locked_until, last_error, idempotency_key UNIQUE`.
- **Réservation atomique** par lots (`UPDATE … RETURNING`), **bail** avec expiration : un worker qui plante rend ses travaux au bout de N minutes.
- **Nouvelle tentative** avec délai exponentiel + aléa, plafonnée ; au-delà → `dead` (visible dans la page de diagnostic, rejouable à la main).
- **Idempotence d'envoi** : clé `campaign:{id}:contact:{id}[:variant]` → impossible d'envoyer deux fois le même message, même si le travail est rejoué.
- **Limitation de débit** : seau à jetons par organisation/fournisseur (ex. 100 e-mails/minute), configurable, et respect du 429 du fournisseur (ralentissement automatique).
- **Traitement par petits lots** : `node:sqlite` est synchrone ; un lot de 25–50 par tick évite de bloquer les requêtes du LMS.
- **Où tourne le worker** : dans le même processus (boucle `setInterval` démarrée au lancement), avec un verrou pour qu'il n'y en ait qu'un.

### Distinction marketing / transactionnel
Deux « flux » aux règles différentes : le **transactionnel** (confirmation d'achat, reçu, mot de passe, certificat) est envoyé même si le contact est désinscrit du marketing, n'a **ni lien de désinscription marketing ni suivi des clics par défaut**, passe en priorité haute et sur une adresse d'expéditeur distincte. Le **marketing** exige consentement, lien de désinscription, en-têtes `List-Unsubscribe` + `List-Unsubscribe-Post` (désinscription en un clic, exigée par Gmail/Yahoo pour les envois en volume), et respecte la liste de suppression. Les 2 e-mails actuels (`nodemailer` direct) migreront vers le flux transactionnel, avec journal et nouvelles tentatives.

---

## 8. Analytics

- **Source de vérité** : `mk_message_events` (append-only) ; les tableaux de bord lisent des **compteurs pré-agrégés** (`mk_campaign_stats`, mis à jour par le worker) pour rester rapides à 100 000+ contacts.
- **Mesures** : envoyés, délivrés, ouvertures, clics, rebonds, plaintes, désinscriptions ; taux de délivrance/rebond/plainte/désinscription/clic ; par campagne, par segment, par jour.
- **Clics** : chaque lien est réécrit en `/t/c/:token` ; le jeton signe `(message_id, link_id)` ; **l'URL de destination est lue en base** (jamais dans l'adresse) → pas de redirection ouverte. Le suivi peut être désactivé par campagne.
- **Ouvertures** : pixel invisible `/t/o/:token.gif`, désactivable. **Limite documentée dans l'interface** : la protection de la vie privée d'Apple Mail (MPP) et certains clients pré-chargent les images ; le taux d'ouverture est **indicatif, pas fiable**. Le taux de clic est la mesure d'engagement recommandée. On ne dira jamais « lu » mais « ouverture détectée ».
- **Attribution du revenu** (méthode documentée) : *dernier clic dans une fenêtre de 7 jours* (configurable) : un achat est rattaché à la dernière campagne cliquée par ce contact avant l'achat. Affiché comme « revenu **attribué** (dernier clic, 7 j) », jamais comme « causé par l'e-mail ». Aucun clic → aucune attribution.
- **Alertes** de délivrabilité : seuils configurables (ex. plaintes > 0,1 %, rebonds durs > 2 %).

---

## 9. Sécurité

| Risque | Mesure |
|---|---|
| Fuite entre organisations | `organization_id` **obligatoire** sur chaque table, appliqué par la couche « dépôts » (aucune requête sans organisation), tests dédiés « organisation A ne voit jamais B » |
| Clés d'API | générées aléatoirement, **stockées hachées** (SHA-256), préfixe visible, portée (lecture/écriture), révocables, dernière utilisation enregistrée |
| Secrets (clé fournisseur, secret webhook) | chiffrés **AES-256-GCM** avec `ENCRYPTION_KEY`, jamais dans le code ni dans Git, jamais renvoyés par l'API |
| Injection dans les gabarits | moteur de variables **maison à grammaire fermée** (variables plates de contact, `if/else/endif`, quelques filtres), **aucun `eval`**, aucun accès aux objets internes ; toutes les valeurs sont échappées ; tests avec charges piégées |
| XSS dans l'éditeur | HTML des blocs assaini (liste blanche, comme les textes riches existants) |
| Redirection ouverte | destinations lues en base, jetons signés HMAC |
| Webhooks sortants | signature `HMAC-SHA256(timestamp.corps)`, horodatage (anti-rejeu), nouvelles tentatives, **blocage SSRF** (adresses privées/locales interdites), délai maximal |
| Webhooks entrants (fournisseur) | vérification de signature obligatoire ; événements rejoués = sans effet (idempotence) |
| Import CSV | taille et lignes limitées, lecture en flux, échappement contre l'injection de formules à l'export, jamais de chargement complet en mémoire |
| Énumération / abus | limitation de débit par clé et par IP, formulaires publics : champ piège + jeton + limitation |
| Injection SQL | requêtes préparées partout ; le moteur de segments génère du SQL **paramétré** à partir d'une grammaire fermée (jamais de texte libre) |
| Traçabilité | `mk_audit_logs` (qui, quoi, ressource, quand, métadonnées) sur toute action d'administration |
| Désinscription | jetons signés ; page « une seule action » ; jamais d'envoi à un contact désinscrit (vérifié à l'enfilage **et** à l'envoi) |

Documentation : `EMAIL_MARKETING_SECURITY.md`.

---

## 10. Scalabilité — ce qui est réaliste

| Contacts | Faisabilité avec l'architecture proposée |
|---|---|
| 1 000 – 10 000 | Sans difficulté (SQLite + index + pagination) |
| 100 000 | **Réaliste** : pagination, comptes pré-calculés, segments évalués côté base, envois en lots. Point de vigilance : `mk_message_events` (des millions de lignes) → agrégats + purge/archivage |
| 1 000 000 | **Pas avec SQLite et un seul processus.** Nécessite PostgreSQL, un worker séparé, une vraie file. L'architecture le **prépare** (dépôts, file abstraite, aucune requête SQLite spécifique dans le métier) mais ne le **fait pas** |

Règles appliquées dès le début : jamais plus de N lignes au navigateur, pagination par curseur, index sur `(organization_id, email)`, `(organization_id, status)`, files/segments matérialisés à l'envoi, traitement par lots. Test de charge prévu à 100 000 contacts (Phase 18).

---

## 11. Roadmap d'implémentation (par jalons livrables)

Je propose de **modifier l'ordre** de vos 18 phases sur un point : **la conformité (consentement, désinscription, liste de suppression) passe avant le premier envoi**, et la sécurité/les tests sont **continus** (chaque phase se termine par ses tests) au lieu d'être repoussés à la fin.

| Jalon | Phases | Contenu | Taille | Résultat visible |
|---|---|---|---|---|
| **M0 Fondations** | 1–2 | Migrations versionnées, organisations, couche « dépôts », journal d'audit, bus d'événements, squelette de la file, paramètres | M | Rien pour l'utilisateur, tout pour la solidité |
| **M1 Audience** | 3–4 (+ conformité 21/22/20) | Contacts, import CSV avec aperçu/mapping/doublons, propriétés perso, listes, tags, **segments AND/OR/NOT**, consentement, désinscription, liste de suppression, préférences | L | Gérer et segmenter ses contacts |
| **M2 Contenu** | 5 | Gabarits, moteur de variables sécurisé, éditeur de blocs, aperçu bureau/tablette/mobile | L | Créer un e-mail sans coder |
| **M3 Envoi** | 6–9 | Fournisseur (`console` + `smtp` + API), campagnes, file/worker/débit/reprises, retours (rebonds, plaintes) via webhooks, suivi clics/ouvertures, stats de base | XL | **Envoyer une vraie campagne**, la suivre |
| **M4 Lien KOLAKISA** | 10 (+ 13-14) | Pont LMS, événements réels, automatisations, séquences, e-mails transactionnels séparés | XL | Séquence de bienvenue après achat |
| **M5 Croissance** | 11–14 | Tableaux de bord, formulaires et popups, tests A/B, attribution du revenu, API + clés, webhooks sortants | XL | Capter des contacts, mesurer les ventes |
| **M6 Durcissement** | 15–18 | Délivrabilité/domaines (SPF, DKIM, DMARC), diagnostic/observabilité, sauvegarde/restauration, test de charge 100 000, documentation finale | L | Prêt pour la production |

*Tailles relatives (M = moyenne, L = grande, XL = très grande), pas des durées : la durée dépend du rythme de validation.*

**Chaque phase** suivra votre règle §51 : explication → fichiers → risques → implémentation → tests → vérification de non-régression du LMS → résumé. La suite complète actuelle (567 tests) doit rester verte après chaque phase.

**Migrations** : dossier `migrations/` numéroté (`001_…sql`), table `schema_migrations`, application transactionnelle au démarrage, **sauvegarde automatique de la base avant toute migration**, jamais de modification manuelle en production.

---

## 12. Limites et décisions qui vous appartiennent

### Ce que le logiciel ne peut pas garantir
1. **La délivrabilité** (arriver en boîte de réception) dépend de la réputation du domaine, de SPF/DKIM/DMARC, de la qualité de la liste et de la montée en charge progressive (« warm-up »). Le logiciel affiche l'état, alerte et explique ; il ne peut pas la garantir.
2. **Les ouvertures** ne sont pas fiables (voir §8).
3. **La conformité juridique** n'est pas automatique. Le logiciel fournit les mécanismes (consentement, preuves, désinscription, suppression, export des données) ; l'administrateur reste responsable des règles applicables dans les pays de ses contacts. Document : `EMAIL_MARKETING_SECURITY.md` + section « Responsabilités » de `EMAIL_MARKETING_SETUP.md`.
4. **L'hébergement** : sur Hostinger, un processus Node peut être arrêté quand il est inactif ou redéployé. Les envois planifiés dépendent d'un processus vivant. **À vérifier auprès de l'hébergeur** (comme pour la persistance des données), ou ajouter un appel régulier externe (ex. un service de ping toutes les minutes) qui réveille le worker.
5. **Le rendu dans tous les clients e-mail** (Outlook, Gmail, Apple Mail…) ne peut pas être testé automatiquement ici : je génère du HTML compatible (tableaux, styles en ligne) et je le vérifie dans un navigateur ; une vérification manuelle sur vos vrais clients reste nécessaire.

### Un point de conformité qui existe déjà aujourd'hui
Vos 5 utilisateurs actuels **n'ont donné aucun consentement marketing** (le formulaire d'inscription n'en demande pas). Je propose de les importer avec le statut **`unknown`** : ils recevraient les e-mails **transactionnels** mais **aucune campagne** tant qu'ils n'ont pas coché une case d'abonnement. Cela suppose d'ajouter, dans le LMS, une **case d'abonnement facultative, non pré-cochée** à l'inscription.

### Décisions à valider (avec ma recommandation)
1. **Fournisseur d'envoi** → Resend pour démarrer (SES plus tard si le volume l'exige).
2. **Base et file** → même fichier SQLite + file dans SQLite (limite réaliste : ~100 000 contacts) ; migration PostgreSQL planifiée si vous visez le SaaS multi-clients à grande échelle.
3. **Multi-organisations** → colonne `organization_id` partout **dès maintenant**, mais **une seule organisation (KOLAKISA)** et aucune interface d'inscription de clients : le SaaS complet (facturation, quotas, isolation renforcée) est un projet distinct.
4. **Éditeur d'e-mail** → éditeur de blocs (ajout, réorganisation par glisser-déposer natif **et** boutons, aperçu 3 tailles) qui produit du HTML d'e-mail compatible ; pas de bibliothèque tierce lourde.
5. **Moteur de gabarits** → maison, à grammaire fermée (plus sûr et plus simple à tester qu'une bibliothèque).
6. **Ordre** → conformité avant le premier envoi (voir §11).
7. **Portée de la première livraison** → viser d'abord **M0 → M3** (envoyer une vraie campagne proprement), puis M4 (automatisations liées au LMS).
8. **Modifications du LMS acceptées** → case d'abonnement à l'inscription, enregistrement de `last_login`, enregistrement du panier (pour « panier abandonné »), branchement des événements dans `auth.js`, `orders.js`, `learning.js`, `courses.js`.

---

## 13. Documents qui seront produits (avec les phases)

`EMAIL_MARKETING_ARCHITECTURE.md` (ce document) · `EMAIL_MARKETING_DATABASE.md` (Phase 2) · `EMAIL_MARKETING_SETUP.md` (M3) · `EMAIL_MARKETING_API.md` (M5) · `EMAIL_MARKETING_AUTOMATIONS.md` (M4) · `EMAIL_MARKETING_DELIVERABILITY.md` (M6) · `EMAIL_MARKETING_SECURITY.md` (continu) · `EMAIL_MARKETING_TESTING.md` (continu).

---

## 14. État d'avancement

### M0 Fondations — RÉALISÉ (658 tests verts, dont 91 pour le module marketing)
| Élément | Fichiers |
|---|---|
| Migrations versionnées + sauvegarde automatique | `src/marketing/db/migrate.js`, `src/marketing/migrations/001…, 002…` |
| Organisations, membres, rôles, permissions | `src/marketing/organizations.js` |
| Dépôt de données isolé par organisation | `src/marketing/db/repository.js` |
| Journal d'audit (écriture seule, valeurs sensibles masquées) | `src/marketing/audit.js` |
| Réglages + secrets chiffrés (AES-256-GCM) | `src/marketing/settings.js`, `src/marketing/security/crypto.js` |
| File de travaux (bail, reprises, idempotence) + worker | `src/marketing/queue/jobs.js`, `worker.js` |
| Bus d'événements (atomique avec l'action métier, idempotent) | `src/marketing/events/bus.js` |
| Point d'entrée, branchement au démarrage | `src/marketing/index.js`, `server.js` |

### Écarts par rapport à la proposition initiale (décidés en cours de route, pour de bonnes raisons)
1. **Pas de table `mk_outbox`** : `mk_events` joue déjà ce rôle (`processed_at` vide = à distribuer). Une table de moins, une source de vérité de moins.
2. **États d'un travail : `pending / running / done / dead`** (et non `failed`) : un échec récupérable repasse en `pending` avec un délai ; `dead` = abandonné (tentatives épuisées ou erreur définitive), conservé pour le diagnostic et rejouable à la main.
3. **Instants en millisecondes** dans `mk_jobs` et `mk_events` (texte lisible ailleurs) : voir `EMAIL_MARKETING_DATABASE.md`.
4. **Le module ne bloque jamais le LMS** : si une migration marketing échoue, elle est annulée, l'erreur est affichée, le module se déclare « indisponible » et le site continue.
5. **Worker désactivé par défaut** (`MARKETING_WORKER=on` pour l'activer) : aucun traitement en arrière-plan tant qu'aucune fonctionnalité n'en a besoin.

### Vérification sur la vraie base (copie et base réelle)
Migrations appliquées automatiquement sur la base de développement, avec sauvegarde préalable de chaque étape ; intégrité « ok », 0 violation de clé étrangère, données du LMS intactes ; événement émis depuis un autre processus traité par le worker du serveur, doublon détecté, travail inconnu abandonné et journalisé.

### M1 Audience — RÉALISÉ (888 tests verts, dont 321 pour le module marketing)
| Élément | Fichiers |
|---|---|
| Contacts, propriétés typées, listes, étiquettes (e-mail normalisé, statut protégé) | `src/marketing/audience/`, migration 003 |
| **Conformité** : consentement prouvé, désinscription (globale/liste), liste de suppression, préférences, garde d'envoi `isSendable`, jetons signés | `src/marketing/compliance/`, `security/tokens.js`, migration 004 |
| Segments ET / OU / NON (grammaire fermée → SQL paramétré) + catalogue pour l'éditeur | `src/marketing/segments/`, migration 005 |
| Import CSV : aperçu, correspondance, analyse à blanc, doublons, tranches reprenables, job `import.run` | `src/marketing/import/`, migration 006 |
| Pont LMS : comptes existants → contacts « unknown » ; case facultative, non cochée, à `/inscription` | `src/marketing/bridge/lms.js`, `src/routes/auth.js`, `views/register.ejs` |
| Interface `/marketing` (accès par rôle) et constructeur visuel de segments | `src/marketing/web/`, `views/marketing/`, `public/js/marketing-segments.js` |
| Pages publiques `/u/:token` (désinscription) et `/preferences/:token` | `src/marketing/web/public.js`, `views/marketing-public/` |

**Décisions notables de M1** (détail dans `EMAIL_MARKETING_CONFORMITE.md`) : un `GET` ne désinscrit jamais (les aperçus de liens ouvrent les URL) ; l'import ne crée aucun consentement sauf déclaration explicite avec preuve ; pas d'événement par contact importé (un seul `contacts.imported`) ; XLSX non pris en charge (exporter en CSV) ; import de plus de 5 000 lignes réservé au worker.

Vérifié sur la vraie base : 6 migrations appliquées avec sauvegarde préalable, intégrité « ok », 0 violation de clé étrangère, les 5 comptes du LMS sont devenus 5 contacts « unknown » sans aucun consentement, données du LMS intactes ; interface, constructeur de segments et assistant d'import essayés dans un vrai navigateur (bureau et mobile, aucune erreur console).

### M2 Contenu — RÉALISÉ (1017 tests verts, dont 450 pour le module marketing)
| Élément | Fichiers |
|---|---|
| Moteur de gabarits à grammaire fermée (variables, filtres, if/elif/else) | `src/marketing/templates/engine.js` |
| Blocs → HTML d'e-mail (tableaux, styles en ligne), pied légal automatique, conditions d'affichage | `templates/blocks.js` |
| Version texte automatique, contrôle qualité | `templates/text.js`, `templates/lint.js` |
| Contexte de rendu en liste blanche, catalogue de variables, adresse de l'organisation | `templates/context.js` |
| Modèles : CRUD, versions (20), concurrence optimiste, duplication, rendu, aperçu, modèles de départ | `templates/index.js`, `templates/starters.js`, migration 007 |
| E-mail de test (équipe uniquement, `[TEST]`, liens factices, 10/heure) | `templates/testSend.js` |
| Pages `/marketing/modeles` + éditeur par blocs (boutons et glisser-déposer, aperçu bureau/tablette/mobile isolé en iframe `sandbox`) | `web/templates.js`, `views/marketing/template-editor.ejs`, `public/js/marketing-editor.js` |

**Décisions notables de M2** (détail dans `EMAIL_MARKETING_MODELES.md`) : rendu en deux temps (le modèle est compilé une fois en « morceaux de confiance + variables », seules les variables sont échappées à chaque destinataire — sûr et rapide pour 100 000 envois) ; conditions interdites *dans* un texte Markdown (ordre sûr « Markdown d'abord, valeurs ensuite ») mais permises sur un bloc entier ; aucune variable dans l'adresse d'un lien ; HTML jamais saisi ni stocké.

**Limites** : rendu Outlook/Gmail/Apple Mail non testable ici (toujours s'envoyer un test) ; pas de téléversement d'images ; pas de glisser-déposer tactile (boutons ↑ ↓).

Vérifié sur la vraie base : migration 007 appliquée avec sauvegarde préalable, intégrité « ok », 0 violation, données du LMS intactes ; éditeur essayé dans un vrai navigateur (ajout de blocs, insertion de variable, réorganisation par boutons et par glisser-déposer réel, aperçu avec un vrai contact, erreur de bloc, enregistrement au clavier, conflit de version, mobile sans débordement).

### M3 Envoi — RÉALISÉ (1118 tests verts, dont 551 pour le module marketing)
| Élément | Fichiers |
|---|---|
| Fournisseurs `console` (défaut) / `smtp` / `resend` (erreurs normalisées, clé jamais journalisée, idempotence) | `src/marketing/sending/providers/` |
| Réglages d'envoi (clés chiffrées, débit, plafond quotidien) | `sending/config.js` |
| Campagnes, audience (règle « joignable » unique), contrôle avant envoi | `sending/campaigns.js`, `audience.js`, `preflight.js`, `compliance/sendable.js`, migration 008 |
| Lancement, envoi par lots, conformité par message, reprises, pause/annulation, tâche `campaign.dispatch` | `sending/dispatch.js`, `builder.js` |
| Suivi (clics, ouvertures, désinscription attribuée), webhooks signés (livré, rebond, plainte → suppression), statistiques | `sending/tracking.js`, `webhooks.js`, `stats.js`, `web/tracking.js`, `web/webhooks.js` |
| Pages `/marketing/campagnes`, `/marketing/envoi` | `web/campaigns.js`, `views/marketing/campaign*.ejs`, `send-settings.ejs` |

**Décisions notables de M3** (détail dans `EMAIL_MARKETING_ENVOI.md`) : fournisseur `console` par défaut (rien ne part sans choix explicite) ; conformité revérifiée pour chaque message ; jamais de rejeu automatique d'un envoi interrompu (un doublon est pire qu'un échec signalé) ; débit et plafond calculés depuis la base ; contenu et destinataires figés au lancement ; confirmation du lancement par saisie du nombre de destinataires ; webhooks lus en corps brut (signature) avant l'analyse JSON du site.

**Limites** : délivrabilité non garantissable (SPF/DKIM/DMARC à configurer chez le fournisseur) ; ouvertures indicatives ; SMTP sans plaintes ni rebonds différés ; le worker doit tourner ; test A/B, automatisations, attribution du revenu : M4/M5.

Vérifié : sur la vraie base (migration 008 avec sauvegarde, intégrité « ok », aucun message, aucune campagne) ; de bout en bout avec un vrai worker (3 messages envoyés par le fournisseur console) ; interface essayée dans un vrai navigateur (contrôle, confirmation, avancement, statistiques, mobile sans débordement).

### M4 Pont LMS et automatisations — RÉALISÉ (1185 tests verts, dont 618 pour le module marketing)
| Élément | Fichiers |
|---|---|
| Pont LMS → événements (lecture par curseurs, initialisation sans historique, idempotent, tâche récurrente 30 s) | `src/marketing/bridge/events.js`, migration 009 |
| Variables « événement » dans les modèles (titre, montant, liens du site) | `templates/context.js`, `templates/blocks.js` |
| Scénarios : déclencheurs, étapes validées, contrôle avant activation, activation avec contenu figé, pause/reprise | `src/marketing/automations/` (`catalog.js`, `steps.js`, `service.js`) |
| Moteur reprenable (attentes en base), conformité par e-mail, pannes, pas de boucle | `automations/engine.js`, `jobs.js` |
| E-mail transactionnel (sans désinscription marketing, suppression respectée, sans plafond quotidien) | `sending/builder.js`, `automations/engine.js` |
| Pages `/marketing/automatisations` (éditeur d'étapes), `/marketing/evenements` (pont, flux) | `web/automations.js`, `views/marketing/automation*.ejs`, `events.ejs`, `public/js/marketing-automation.js` |

**Décisions notables de M4** (détail dans `EMAIL_MARKETING_AUTOMATIONS.md`) : le pont **lit** le LMS et ne le modifie pas (zéro risque de régression sur inscriptions et achats ; délai ~30 s) ; l'historique n'émet jamais d'événement ; les deux e-mails existants du site restent inchangés (pas de double envoi) ; un contact entre une fois dans un scénario ; scénarios linéaires avec sorties conditionnelles ; les actions d'un scénario n'émettent pas d'événement.

**Vérifié** : parcours réel avec un vrai worker (inscription sur le site → événement → scénario transactionnel → e-mail envoyé, historique sans effet) ; éditeur d'étapes dans un vrai navigateur ; vraie base (migration 009 avec sauvegarde, aucun curseur/événement/message).

### Prochain jalon : M5 Croissance
Formulaires et popups d'inscription (avec consentement prouvé), tests A/B, attribution du revenu (dernier clic, 7 jours), API avec clés, webhooks sortants signés, tableaux de bord.

## 15. Refonte de l'interface (phase R0 — terminée)

Décisions : EJS + JavaScript natif (pas de React), interface en français, coque autonome (ni en-tête ni pied du site), graphiques SVG faits main, aucun bloc « HTML libre ».

- **Registre de navigation** `src/marketing/web/nav.js` : source unique du menu, du fil d'Ariane et du bouton principal contextuel. Une entrée `soon` (Tests A/B, Formulaires, Pop-ups, Domaines, API, Webhooks, Analytics…) est prévue avec sa phase mais **jamais affichée**. Une section sans entrée permise disparaît ; une section à une seule entrée devient un lien direct. Toute clé `active` d'une route doit exister dans le registre (test).
- **Coque** `views/marketing/partials/top.ejs` / `bottom.ejs` : menu latéral repliable (état mémorisé, `localStorage` + attribut `html[data-sidebar]`), tiroir sur mobile (Échap, voile, piège de focus), barre du haut (fil d'Ariane, bouton principal selon le droit, menu utilisateur avec « Mon espace », « Voir le site », déconnexion).
- **Design system** `public/css/marketing.css` + `public/js/mk/shell.js` : cartes de chiffres, pastilles de statut, onglets, états vides, squelettes, barre de filtres/recherche, tableau de données (tri, sélection, cartes sur mobile), pagination, étapes, progression, confirmation (`data-mk-confirm`), toasts, info-bulles. Page de référence : `/marketing/composants` (administrateurs, absente du menu).
- Les tests de design (`refonte-design`, `etape0-design`) couvrent désormais `marketing.css`.
- Suite : R1 Accueil (le tableau de bord actuel affiche encore « envoi pas encore disponible », texte périmé), R2 Contacts, R3 Segments, R4 Campagnes… Aucune route ni donnée n'a été modifiée.

## 16. Refonte de l'interface (phase R1 — Accueil, terminée)

- **Module de données** `src/marketing/overview/index.js` (`getOverview`) : lecture seule, une organisation à la fois. Contacts (total, joignables via `sendableSql`, nouveaux et désinscrits sur 30 jours, bloqués), croissance sur 8 semaines glissantes, campagnes (agrégats de la période, 5 récentes ; les campagnes système `kind='automation'` sont exclues), automatisations, préparation à l'envoi (8 vérifications), alertes, activité récente (campagnes terminées, imports, événements KOLAKISA).
- **Honnêteté des chiffres** : aucun envoi sur la période → taux affiché « — » (jamais « 0 % ») ; ouvertures non mises en avant (indicatives) ; seuils d'alerte identiques à `sending/stats.js` (rebond 2 %, plainte 0,1 %, au moins 20 messages).
- **« Prêt pour un vrai envoi ? »** (administrateurs) : clé de chiffrement, fournisseur (le mode « console » est présenté comme un mode test), expéditeur, adresse postale, traitement en arrière-plan, SITE_URL en https, modèle, contact joignable. La note précise que cela **ne garantit pas la délivrabilité** (SPF/DKIM/DMARC restent à configurer côté DNS).
- **Alertes** triées (erreurs d'abord) et filtrées par permission : clé absente, travaux définitivement en échec (`queue.manage`), campagne en échec, rebonds/plaintes élevés, passages de scénario en échec, worker désactivé alors que des envois ou scénarios l'attendent.
- **Graphique** `web/charts.js` : SVG fait main, accessible (`role="img"` + `aria-label` récapitulatif), valeurs échappées, sans dépendance.
- Le texte périmé « envoi pas encore disponible » a été supprimé ; la répartition par statut de l'ancien tableau de bord est conservée.

## 17. Refonte de l'interface (phase R2 — Contacts, terminée)

- **Recherche** `audience.searchContacts(ctx, criteria, { sort, dir, page, pageSize })` : pages numérotées (25/50/100), tri sur liste blanche (`SORTS` : e-mail, nom, statut, source, ajout, dernière activité ; départage stable par identifiant ; « jamais actif » toujours en fin), filtres : statut, liste, étiquette, source, joignables (même fragment SQL que `isSendable`, `sendableSql`), ajoutés depuis N jours. Aucun texte utilisateur n'est copié dans le SQL ; toute valeur invalide est ignorée. Les listes internes (membres d'une liste, etc.) gardent la pagination par curseur.
- **Actions groupées** `audience/bulk.js` (éditeurs) : ajouter/retirer une étiquette (tout ou rien, 200 contacts au plus, autre organisation refusée) ; ajout/retrait de liste via `addToList`/`removeFromList`. Aucune ne touche au statut ni au consentement. L'adresse de retour est limitée aux pages `/marketing/contacts`.
- **Export CSV** `audience/export.js` (administrateurs, `contacts.export`) : mêmes filtres que la liste, par lots de 1 000, BOM UTF-8, formules neutralisées, journal d'audit `contacts.exported` (sans adresse).
- **Fiche** : chiffres (e-mails reçus/cliqués, scénarios en cours, dernière activité) et **chronologie** `audience/timeline.js` (création, consentements, désinscriptions, listes, étiquettes, e-mails envoyés/cliqués/rebonds, scénarios, événements KOLAKISA ; les événements déjà représentés ne sont pas doublés ; liens filtrés par permission).
- **Interface** : tableau `mk-datatable` avec en-têtes triables (`aria-sort`), cartes sur mobile, filtres secondaires repliables sur mobile, barre d'actions groupées, pagination numérotée accessible.

## 18. Refonte de l'interface (phase R3 — Segments, listes, étiquettes, propriétés, terminée)

- **Critères « Activité KOLAKISA »** (`segments/engine.js`) : `event:lms.*` avec comparateurs `happened`, `never`, `at_least` (N fois), `within_days`, `not_within_days` (les deux négatifs suivent la convention « NON (positif) », donc incluent les contacts sans activité), et un filtre optionnel `course` (identifiant de formation ; pour une commande, recherche dans `items[]`). **« Montant dépensé »** (`lms_spent`, en euros, somme des commandes terminées en centimes ; une commande gratuite est un achat). Seuls les événements du pont LMS sont acceptés ; `course` est refusé ailleurs.
- **Le module marketing ne lit toujours jamais les tables du LMS** : les segments s'appuient sur `mk_events` (déjà alimenté par le pont) et la liste des formations proposées est déduite de ces événements. **Limite documentée dans l'interface** : l'activité antérieure à l'activation du pont n'est pas incluse.
- **Migration 010** : index `mk_events(organization_id, contact_id, name)` (sans lui, chaque contact parcourrait tous les événements de l'organisation).
- **Éditeur** : aperçu **en direct** (attente de 400 ms, une seule réponse utile : les réponses périmées sont ignorées), effectif + part de l'audience + joignables + échantillon, résumé en français, choix de la formation, notes sur les limites. Toujours en JavaScript natif, sans HTML injecté.
- **Segments** : liste avec effectif, joignables, part de l'audience, usages (campagnes hors scénarios) ; duplication (`Copie de … (n)`) ; suppression avec confirmation qui annonce les campagnes concernées ; segment cassé signalé sans faire échouer la page ; bouton « Voir les contacts ».
- **Contacts filtrés par segment** : `?segment=ID` (le serveur compile la définition ; un segment inconnu ou cassé est ignoré ; l'export reprend le filtre). `audience.filters` accepte un fragment `custom` **construit par le serveur uniquement**.
- **Listes** : effectif et joignables (désinscription par liste comprise) ; **étiquettes** : effectif, suppression confirmée ; **propriétés** : nombre de contacts renseignés.

## 19. Refonte de l'interface (phase R4 — Campagnes, terminée)

- **Liste** `sending/list.js` : onglets (Toutes, Brouillons, Programmées, En cours = envoi + pause, Envoyées, Interrompues = annulées + échec) avec effectifs, recherche par nom, tri sur liste blanche (nom, statut, destinataires, envoyés, clics, création), pages de 10/25/50 ; les campagnes système des scénarios (`kind='automation'`) en sont exclues. Modèle et cible supprimés → libellé de repli, jamais d'erreur.
- **Création guidée en 7 étapes** : 1 Nom, 2 Destinataires (effectif joignable en direct via `POST /marketing/campagnes/apercu-cible`), 3 Modèle (objet affiché), 4 Suivi — saisies avant la création du brouillon (une étape à la fois avec JavaScript, tous les blocs visibles sans) ; puis 5 Test, 6 Contrôle avant envoi, 7 Envoi sur la page du brouillon. `sending/wizard.js` (`wizardSteps`, calcul pur) donne l'état de chaque étape, la progression et l'étape courante ; la saisie est conservée en session après une erreur de création.
- **Blocage de l'envoi** : l'étape « Envoi » est signalée bloquée avec les raisons, le bouton est désactivé, et — surtout — `startCampaign` refuse toujours côté serveur tant que le contrôle avant envoi a des erreurs ; la confirmation par saisie du nombre de destinataires et la case de consentement restent exigées. Le test d'envoi est facultatif.
- **Test d'envoi d'une campagne** : mêmes garde-fous que celui des modèles (destinataire = membre de l'équipe, 10 par heure et par utilisateur, aucune erreur brute du serveur de messagerie) ; un test réussi est journalisé (`campaign.test_sent`) et valide l'étape 5 de CETTE campagne seulement.
- **Duplication** (`duplicateCampaign`) : « Copie de X (n) », mêmes réglages, brouillon vierge (compteurs à zéro, contenu figé effacé).
- Page d'une campagne lancée : cartes de chiffres et barre de progression du système ; suppression avec confirmation.

## 20. Refonte de l'interface (phase R5 — Modèles : bibliothèque et éditeur v2, terminée)

- **Nouveaux blocs** (`templates/blocks.js`) : citation, liste (puces, numéros, coches), réseaux sociaux (liens texte, 8 réseaux, https seulement, sans doublon), vidéo (miniature cliquable + lien « Regarder la vidéo » : un e-mail ne lit pas de vidéo), formation du catalogue. **Aucun bloc « HTML libre »** (décision R0) ; un type inconnu est refusé.
- **Bloc formation** : l'instantané (titre, sous-titre, prix, adresse de la page et de l'image) est pris dans le catalogue **à l'enregistrement** (`templates/courses.js`, lecture seule via `bridge/catalog.js`) puis conservé dans le modèle : la compilation ne touche jamais au LMS, un envoi de 100 000 messages n'en dépend pas, et un prix modifié plus tard ne change pas un e-mail déjà rédigé sauf « actualiser » explicite. Un instantané dont l'identifiant ne correspond pas est rechargé (jamais cru). L'éditeur récupère les instantanés dans la réponse d'enregistrement. `SITE_URL` est requis pour construire le lien.
- **Bibliothèque** (`templates/starters.js`, `library.js`, `categories.js`) : 15 modèles répartis en 8 catégories (Général, Bienvenue, Lettre d'information, Formation, Promotion, Événement, Relance, Transactionnel), tous vérifiés par les tests (prêts à l'envoi, variables avec valeur par défaut, aucune adresse réelle : « exemple.fr » à remplacer). Les 4 modèles transactionnels utilisent les variables d'événement (pour les automatisations). Page `/marketing/modeles/bibliotheque` : aperçus réels dans des iframes isolées (`sandbox`, chargées à la demande) servies par `/marketing/modeles/bibliotheque/:key/apercu` avec une politique de sécurité restrictive (`default-src 'none'`, aucun script).
- **Catégorie d'un modèle** : migration 011 (colonne `category`, simple rangement sans effet sur l'envoi) ; validée à l'enregistrement, versionnée, conservée à la duplication.
- **Liste** : onglets par catégorie avec effectifs, recherche (nom et objet), filtre par type, tri sur liste blanche, « utilisé par » (campagnes), suppression confirmée qui annonce les campagnes concernées.
- **Éditeur v2** : trois colonnes (palette de 12 blocs en 4 groupes · volets « Contenu » / « Réglages » · aperçu), insertion après le bloc sélectionné, glisser-déposer depuis la palette et entre blocs (zone « à la fin »), **annuler / rétablir** (instantanés du modèle entier, frappe regroupée par seconde, 100 niveaux ; Ctrl+Z / Ctrl+Maj+Z / Ctrl+Y hors des champs de saisie, ceux-ci gardant l'annulation native du navigateur), suivi de l'état « enregistré » sur l'historique. Toujours aucune donnée injectée comme HTML.

## 21. Refonte de l'interface (phase R7 — Analytics, terminée)

- **Module de données** `src/marketing/analytics/index.js` (`getAnalyticsOverview`) : lecture seule, une organisation à la fois, période choisie parmi 7/30/90 jours (30 par défaut, toute autre valeur y retombe). Source de vérité : `mk_message_events` (journal ajouté seulement) plutôt que les compteurs de `mk_campaigns` — les totaux de la période ne dépendent donc pas d'une campagne encore en cours d'envoi, contrairement à `campaignFigures` de l'Accueil (fenêtre glissante fixe de 30 jours, non paramétrable).
- **Mesures** : envoyés, délivrés, ouvertures/clics (uniques ET bruts, robots exclus — même définition que `sending/tracking.js`), rebonds, plaintes, désinscriptions ; taux « — » quand rien n'a été envoyé (jamais un faux 0 %, §8 de ce document). **Signal de seuil** (`flags.highBounce`/`highComplaint`) : mêmes seuils que `sending/stats.js` (2 % / 0,1 %), actifs seulement au-delà de 20 envois sur la période — pas une alerte au sens de l'Accueil, un simple badge contextuel sur la carte concernée.
- **Tendance** : envois par jour (7 ou 30 jours) ou par semaine (90 jours, sinon 90 barres illisibles), buckets glissants explicites (pas de calcul générique arrondi).
- **Campagnes et liens de la période** : campagnes `kind='campaign'` terminées dans la fenêtre (`finished_at`), 50 au plus (signalé si tronqué) ; liens les plus cliqués agrégés sur ces mêmes campagnes, triés par clics uniques.
- **Page** `/marketing/analytics` (`web/analytics.js`, permission `analytics.read` — déjà présente au catalogue de permissions, jamais utilisée avant cette phase ; niveau `viewer`, comme l'Accueil) : onglets de période en liens (même patron que les onglets de campagnes), état vide explicite si aucun envoi, cartes de chiffres, graphique, deux tableaux (campagnes, liens). Entrée de navigation `analytics` passée de `soon` (« Vue d'ensemble », R7) à `live` dans `nav.js` ; `revenue` (attribution du revenu, dernier clic 7 jours) reste `soon` — hors périmètre de cette phase, demande une logique clic → achat qui n'existe pas encore.
- **Défauts trouvés et corrigés en vérifiant dans un vrai navigateur** (le graphique SVG partagé `web/charts.js` n'avait jamais été essayé au-delà de 8 barres avant cette phase) : (1) au-delà de 10 barres, un libellé par barre se chevauchait — un espacement régulier des libellés a été ajouté (`labeledIndices`), avec suppression des valeurs au-dessus des barres dans ce cas (elles se chevaucheraient aussi) ; (2) le dernier libellé forcé pouvait tomber à 1-2 barres du précédent libellé espacé et les deux se chevauchaient quand même — corrigé en retirant le libellé précédent s'il est trop proche du dernier plutôt que d'empiler les deux ; (3) un libellé centré sur la barre de bord (première ou dernière) pouvait dépasser le `viewBox` et être rogné silencieusement par le navigateur — corrigé en ancrant le premier libellé à gauche (`text-anchor="start"`) et le dernier à droite (`"end"`) au lieu de les centrer, pour qu'ils grandissent toujours vers l'intérieur. Ces trois correctifs bénéficient à tout graphique du module, y compris celui de l'Accueil (aucune régression : mêmes tests, plus de nouveaux).

**Vérifié** : 90 tests dédiés (`marketing-r7-analytics-data.test.js`, `marketing-r7-analytics-web.test.js`, plus l'extension de `marketing-r1-accueil.test.js` pour le graphique partagé), isolation entre organisations testée ; page essayée dans un vrai navigateur avec de vraies données (bureau et mobile) avant ET après chaque correctif du graphique, jusqu'à confirmation visuelle qu'aucun libellé ne se chevauche ni n'est rogné.

## 22. Jalon M5 — Intégrations, partie 1 : clés d'API (terminée)

Demandée par l'utilisateur comme suite de la refonte « façon Mailchimp » (voir §21, même contexte de décision), avec
sa propre définition confirmée : « Intégrations » = l'API + les webhooks sortants du jalon M5 déjà prévu, pas des
connecteurs tiers (Zapier, Shopify…) hors périmètre pour une application mono-créateur. Scindée en deux tranches
volontairement (comme Analytics/Revenus en R7) : cette phase livre les clés d'API et une API minimale (contacts,
événements) ; les webhooks **sortants** restent à construire séparément (nav toujours `soon`).

- **Migration 012** : `mk_api_keys` (organisation, nom unique par organisation, préfixe affiché, **empreinte SHA-256 de la
  clé — jamais la clé elle-même**, portée `read`/`write`, horodatages de création/dernière utilisation/révocation).
- **`src/marketing/api/keys.js`** : `createApiKey` (renvoie la clé complète **une seule fois**, jamais récupérable
  ensuite, ni par l'interface ni par l'API), `listApiKeys` (jamais l'empreinte), `revokeApiKey` (effet immédiat, revérifié
  à chaque requête — pas seulement à la connexion), `authenticate` (empreinte → organisation + portée, `last_used_at`
  mis à jour au plus une fois par minute pour ne pas écrire à chaque requête d'une clé très active).
- **`src/marketing/api/router.js`** — `/api/v1`, monté dans `server.js` **avant** la session et `sameOriginOnly` (une
  clé n'est jamais un cookie : l'API n'a donc ni CSRF ni notion d'origine à vérifier, conforme à la table « Surfaces »
  du §1 de ce document) : authentification obligatoire sur toute la surface, limite de 120 requêtes/minute **par clé**
  (`createRateLimiter`, réutilisé du LMS), réponses homogènes `{ data }` / `{ error: { code, message } }`.
  Points d'accès (détail et limites : `EMAIL_MARKETING_API.md`) : `GET/POST /contacts` (pagination par curseur ; le
  statut d'abonnement n'est **jamais** modifiable par l'API, mêmes règles que partout ailleurs — seule la conformité le
  change), `GET /contacts/:id`, `POST /events` (idempotent via `Idempotency-Key`, réutilise directement `bus.emit()`
  qui acceptait déjà `source: "api"` sans aucune modification : ce point d'accès existait en germe depuis M0).
- **Page** `/marketing/api` (permission `api_keys.manage`, réservée aux administrateurs) : création avec révélation
  unique de la clé (retirée de la session **avant** l'appel à `res.render` — un retrait après aurait laissé une fenêtre
  où un rechargement pendant le rendu asynchrone montrait encore la clé complète ; bogue trouvé et corrigé par les
  tests de cette phase), liste (préfixe seulement), révocation confirmée. Entrée `api` du menu « Intégrations » passée
  de `soon` à `live` ; `webhooks` y reste `soon`.
- **Décision délibérée, documentée dans l'interface et dans `EMAIL_MARKETING_API.md`** : les événements envoyés par
  l'API ne sont pas encore utilisables comme critère de segment (le moteur de segments n'accepte que `event:lms.*`,
  §18) — étendre cette liste blanche est un choix séparé, pas un oubli.

**Vérifié** : 60 tests dédiés (`marketing-api-keys.test.js` données, `marketing-api-router.test.js` bout en bout —
authentification, portées, pagination, idempotence, révocation immédiate, isolation entre organisations, **vrai test
du plafond de débit à 120 requêtes** —, `marketing-api-web.test.js` interface) ; page essayée dans un vrai navigateur
(bureau et mobile, création, réaffichage sans la clé complète, nom en double, révocation).

## 23. Jalon M5 — Intégrations, partie 2 : webhooks sortants (terminée)

Fin des Intégrations commencées en §22 : KOLAKISA notifie maintenant un système externe de ses propres événements
(l'inverse de l'API). Décision d'architecture : **aucune nouvelle table de livraisons** — `mk_jobs` (file déjà
outillée : réservation, bail, reprises à délai croissant, abandon, rejeu manuel) sert directement de journal, lu par
`json_extract()` sur son `payload` pour l'écran de diagnostic. Même choix minimaliste que « pas de `mk_outbox` » au
jalon M0 (§14) : une source de vérité de moins à garder synchronisée.

- **Migration 013** : `mk_webhook_endpoints` seule (nom unique par organisation, adresse, secret **chiffré**
  AES-256-GCM comme les autres secrets du module, tableau JSON d'événements abonnés ou `["*"]`, actif/en pause).
- **`src/marketing/webhooks/`** :
  - `catalog.js` — événements abonnables : repris **exactement** des noms déjà émis ailleurs dans le module (grep de
    tous les `bus.emit()` existants, pas une liste inventée) : les 7 déclencheurs LMS déjà connus des automatisations
    (§6) plus `contact.created/subscribed/unsubscribed/suppressed`, `tag.added`, `list.member_added`,
    `contacts.imported`, `campaign.sent`.
  - `endpoints.js` — création (secret `whsec_…` généré, **transaction** : si le chiffrement échoue après l'écriture
    initiale — typiquement `ENCRYPTION_KEY` absente —, la ligne créée est annulée avec lui plutôt que de laisser un
    webhook au secret vide en base ; **bogue trouvé en essayant dans un vrai navigateur puis corrigé**, voir plus
    bas), validation stricte de l'adresse (http/https seulement, aucun identifiant intégré) et des événements
    (catalogue fermé), révélation du secret **à la demande, séparée de la liste** (contrairement à une clé d'API, un
    secret de webhook reste re-consultable indéfiniment : le code qui vérifie les signatures en a besoin en continu,
    pas une seule fois).
  - `delivery.js` — signature `HMAC-SHA256("{timestamp}.{corps}")` (même principe que Stripe, vérifiable par le
    destinataire, exemple de code dans `EMAIL_MARKETING_API.md`) ; **blocage SSRF résolu à CHAQUE tentative d'envoi**
    (pas seulement à la création du webhook, pour ne rien laisser passer si la résolution DNS change entre-temps) —
    adresses RFC1918, boucle locale, lien-local IPv4/IPv6 (dont `169.254.169.254`, l'adresse « métadonnées » cloud),
    multidiffusion ; documenté comme une liste utile mais **non exhaustive**, pas un pare-feu complet. Une réponse
    `4xx` du destinataire est une erreur **définitive** (`UnrecoverableError`, sa faute, aucune reprise) ; `5xx` ou
    panne réseau sont repris normalement par `mk_jobs`.
  - `index.js` — assemble `endpoints` + `catalog` + `delivery`, comme `automations/index.js`.
  - Branché sur le bus (`bus.on("*", webhooksOut.eventHandler(...))`, comme les automatisations) et sur le worker
    (`webhooksOut.jobHandlers()` fusionné aux autres, type de travail `webhook.deliver`) dans `src/marketing/index.js`.
- **Page** `/marketing/webhooks` (liste + création par cases à cocher) et `/marketing/webhooks/:id` (configuration,
  révélation du secret, dernières livraisons avec bouton « Rejouer » sur les livraisons abandonnées via
  `jobs.retryDead`), permission `webhooks.manage`. Entrée `webhooks` du menu « Intégrations » passée de `soon` à
  `live` — le triplet Intégrations (KOLAKISA, Clés d'API, Webhooks) est maintenant complet.

**Deux vrais bogues trouvés en essayant dans un vrai navigateur, puis corrigés** (comme au jalon R7, aucun n'était
visible dans les tests écrits avant de regarder l'écran) :
1. **Création sans `ENCRYPTION_KEY` valide** : la ligne était insérée AVANT le chiffrement du secret (qui a besoin de
   l'identifiant généré par l'INSERT pour son contexte de chiffrement, `organisation:webhook:id`) ; si le chiffrement
   échouait ensuite, la ligne restait en base avec un secret vide, invisible dans l'interface (redirection vers la
   liste, pas la fiche) mais bien présente. Corrigé : la clé de chiffrement est validée **avant** toute écriture, et
   toute la création est enveloppée dans une transaction (`db/tx.js`, déjà utilisé ailleurs dans le module) qui
   annule la ligne si le chiffrement échoue malgré tout.
2. Même bogue de fenêtre course que pour les clés d'API (§22) sur la révélation du secret — corrigé avec la même
   méthode (retirer de la session AVANT `res.render`, jamais après).

**Vérifié** : 60 tests dédiés (`marketing-webhooks-endpoints.test.js`, `marketing-webhooks-delivery.test.js` — dont
19 cas d'adresses IPv4/IPv6 privées vs publiques, DNS rebinding, 4xx vs 5xx —, `marketing-webhooks-web.test.js`) ;
page essayée dans un vrai navigateur (bureau et mobile) avant ET après le correctif de la transaction, avec une vraie
clé de chiffrement, jusqu'à confirmation que la création aboutit et que le secret s'affiche correctement.

## 24. Jalon M5 — Capture, partie 1 : formulaires d'inscription publics (terminée)

Premier moyen de faire grandir l'audience depuis le site public lui-même (jusqu'ici, les seuls contacts venaient des
comptes LMS existants ou d'un import manuel). Décision d'architecture centrale : **aucun raccourci de conformité**
— un contact créé par un formulaire suit EXACTEMENT le même chemin qu'ailleurs (`audience.upsertContact` puis
`compliance.recordConsent`, déjà construits aux jalons M0/M1), pas une logique dupliquée. Seul ajout : une colonne
`form_id` nullable sur `mk_consents` (migration 014) pour savoir quel formulaire précis est à l'origine d'une preuve
de consentement — extension d'une table existante plutôt qu'une nouvelle table de « soumissions », même choix
minimaliste que pour les livraisons de webhooks (§23).

- **Migration 014** : `mk_forms` (nom, adresse `slug` unique par organisation, brouillon/publié, champs facultatifs
  en JSON, texte de consentement, liste optionnelle **sans clé étrangère** — même raison que `mk_campaigns.target_id`,
  supprimer une liste ne doit jamais casser un formulaire —, compteurs `view_count`/`submit_count`) ; `mk_consents.form_id`.
- **`src/marketing/forms/index.js`** : catalogue fermé de champs facultatifs (prénom, nom, téléphone, société — l'adresse
  est TOUJOURS demandée, jamais dans cette liste) ; adresse générée depuis le nom (minuscules, sans accents, suffixe
  numérique si déjà prise) ; `submitForm` orchestre upsert + preuve de consentement + ajout de liste (silencieusement
  ignoré si la liste a été supprimée depuis) + compteur, sans jamais lever d'exception pour une entrée utilisateur
  invalide (page publique : erreurs renvoyées en `{ ok:false, reason }`, jamais un plantage visible).
- **Page publique** `/f/:slug` (`web/formsPublic.js`) : même protection que le formulaire de contact déjà existant du
  site (`src/routes/pages.js`) — champ piège invisible (`.hp-field`, classe déjà utilisée ailleurs), 5 soumissions par
  heure et par IP. **N'exige pas `ENCRYPTION_KEY`** (aucun jeton signé n'est en jeu ici, contrairement à la
  désinscription) : un formulaire fonctionne même sur un serveur qui n'a pas encore configuré l'envoi réel. La page de
  remerciement (`?envoye=1`) n'incrémente jamais le compteur de vues (ce n'est pas une nouvelle visite du formulaire,
  sinon la conversion serait artificiellement à moitié de sa vraie valeur).
- **Page d'administration** `/marketing/formulaires` + `/marketing/formulaires/:id` (permission `forms.read`/`forms.write`,
  déjà présentes au catalogue de permissions, jamais utilisées avant cette phase) : création, édition (nom, champs,
  liste, message de remerciement), publier/dépublier, suppression, chiffres (vues, inscriptions, taux de conversion
  — `—` si aucune vue, jamais un faux 0 %). Entrée `forms` du menu « Capture » passée de `soon` à `live` ; `popups`
  y reste `soon` — prochaine tranche naturelle (même formulaire, présentation et déclenchement différents).
- **Portée volontairement scindée, comme les précédentes phases M5** : pas de script `/embed/form.js` pour intégrer
  le formulaire sur un AUTRE site (v1 = une page sur koyekola.fr elle-même, qu'on peut lier depuis n'importe où —
  suffisant pour l'objectif « faire grandir l'audience depuis le site public », sans la complexité d'une exemption
  CSRF/`frame-ancestors` pour un site tiers, documentée comme prochaine tranche possible si le besoin se présente).

**Un vrai bogue trouvé en écrivant le formulaire public lui-même, corrigé avant tout test** (pas trouvé par le
navigateur cette fois — repéré en relisant le HTML de la page publique juste écrite) : la case de consentement
n'était vérifiée que côté navigateur (`required` HTML), jamais recontrôlée côté serveur — un envoi direct (hors
formulaire, ex. `curl`) aurait pu créer un contact « abonné » sans que la case ait réellement été cochée, cassant
la preuve même que ce système est censé garantir. Corrigé : `req.body.consent` est maintenant revérifié dans
`formsPublic.js` avant tout appel à `submitForm`.

**Vérifié** : 38 tests dédiés (`marketing-forms-data.test.js`, `marketing-forms-public.test.js` — champ piège, plafond
de débit réel à 5/heure, case de consentement forcée, page de remerciement qui ne recompte pas la vue —,
`marketing-forms-web.test.js`) ; parcours complet essayé dans un vrai navigateur (créer → cocher un champ → publier →
ouvrir la page publique → s'inscrire → page de remerciement), bureau et mobile, contact et compteurs vérifiés
directement en base après coup.

## 25. Jalon M5 — Capture, partie 2 : pop-ups (terminée)

Suite directe des formulaires (§24), choisie sans reposer de question (« continue » de l'utilisateur, delegation déjà
actée). Décision d'architecture : **aucun nouvel objet** — un pop-up est un formulaire existant avec des réglages
d'affichage en plus (4 colonnes ajoutées à `mk_forms`, migration 015) ; même adresse `/f/:slug` en repli, même texte
de consentement, mêmes champs, même `submitForm`. Conséquence directe de la décision « pas de raccourci de
conformité » du §24 : un contact inscrit par pop-up suit exactement le même chemin qu'un contact inscrit par la page
du formulaire — aucune duplication de logique à auditer séparément.

- **Migration 015** : `mk_forms.popup_enabled/popup_trigger/popup_trigger_value/popup_frequency_days`. Sans `CHECK`
  (SQLite valide mal les contraintes ajoutées après coup) : validation faite dans `forms/index.js`, comme le reste du
  module — une valeur hors bornes ou un déclencheur inconnu **retombe sur un défaut sûr plutôt que d'échouer** (c'est
  un réglage secondaire, jamais un motif pour bloquer l'enregistrement du formulaire).
- **`forms.getActivePopup(db, organizationId)`** : le pop-up publié le plus récemment mis à jour, un seul à la fois
  (plusieurs superposés serait une mauvaise expérience) ; `ORDER BY updated_at DESC, id DESC` — `id` en second
  critère car `updated_at` (précision à la seconde) peut être identique pour deux mises à jour rapprochées, ce qui a
  rendu le premier essai du test correspondant non déterministe.
- **`GET /f/popup.json`** (public, avant `/f/:slug` dans l'ordre des routes — sinon Express prendrait « popup.json »
  pour une adresse de formulaire) : le pop-up actif, ou `{ form: null }`.
- **`public/js/popup.js`** : sans dépendance, comme `main.js`. Chargé sur **chaque page publique** du site
  (`views/partials/footer.ejs`) ; s'exclut lui-même sur `/f/*` et `/marketing/*`. Trois déclencheurs (délai, %
  défilé, intention de sortie — la souris qui remonte vers le haut de la fenêtre) ; mémorisation **uniquement dans le
  navigateur** (`localStorage`, jamais le serveur) pour ne pas revoir le même pop-up avant le délai choisi — cohérent
  avec le reste du module (aucun suivi de visiteur anonyme). **Soumission en AJAX, jamais une redirection de page**
  (`X-Mk-Popup: 1`) : la personne reste sur l'article qu'elle lisait, le message « Merci ! » s'affiche à la place du
  formulaire dans la même superposition. La page `/f/:slug` autonome continue de fonctionner par redirection normale
  pour qui y arrive directement (même route, même `submitForm`, une seule branche de code selon la présence de l'en-tête).
- **Page d'administration** : pas de nouvelle page — un panneau « Pop-up sur le site » sur la fiche du formulaire
  existant (`/marketing/formulaires/:id`). Entrée `popups` retirée du registre de navigation (elle n'a jamais été une
  page à part ; y laisser une entrée « à venir » aurait annoncé une page qui ne viendra jamais).

**Vérifié** : 20 tests dédiés (`marketing-popups-data.test.js`, `marketing-popups-public.test.js`, plus 2 tests
ajoutés à `marketing-forms-web.test.js` pour le panneau d'administration) ; pop-up essayé sur une vraie page du
catalogue dans un vrai navigateur (bureau et mobile) : apparition au délai configuré, inscription sans quitter la
page, message de remerciement affiché en place, contact et compteur vérifiés en base ensuite.

## 26. Automatisations — embranchements réels et condition « e-mail ouvert / cliqué » (terminée)

Demandé explicitement par l'utilisateur (schéma fourni : nouveau contact → attendre → « Bienvenue » → ouvert ? →
e-mail A ou e-mail B), avant de continuer sur le reste de la feuille de route M5. Jusqu'ici (§6, M4), une condition
ne pouvait que **continuer** ou **sortir** du scénario — jamais deux suites différentes ; et elle ne savait vérifier
que l'appartenance à un segment, jamais si un e-mail avait été ouvert ou cliqué.

- **`automations/steps.js`** : une condition a maintenant un `check` (`segment` par défaut, `opened`, `clicked`) et,
  pour les deux derniers, un `ref` (numéro d'une étape « e-mail » qui la précède, dans le même scénario). Ses deux
  issues, `onTrue` et `onFalse`, acceptent chacune `"next"`, `"exit"`, ou **le numéro d'une étape PLUS LOIN** dans la
  liste — jamais en arrière (un saut arrière créerait une boucle dont un contact pourrait ne jamais sortir ; refusé à
  la validation). C'est un embranchement réel : les deux chemins peuvent continuer différemment et se retrouver (ou
  non) plus loin, comme dans le schéma demandé (e-mail A se termine par « Fin » avant l'e-mail B, pour ne jamais y
  tomber par glissement).
- **`automations/engine.js`** : la vérification « ouvert »/« cliqué » relit directement `mk_messages` (colonnes
  `open_count`/`click_count`) pour la campagne système de l'étape `ref` et ce contact — pas de détour par les
  segments, qui n'ont pas accès à cette donnée au niveau du message. La boucle d'exécution gagne une branche `jump`
  (en plus de `next`/`exit`/`pause`/`retry` déjà là) : elle reprend à l'index visé plutôt qu'à `index + 1`.
- **Fait constaté en écrivant les tests, pas seulement pour les tests — cela vaut en production** : le moteur
  enchaîne les étapes **sans s'arrêter** tant qu'aucune n'attend (§6). Une condition posée juste après l'e-mail
  qu'elle vérifie, sans attente entre les deux — exactement comme le schéma fourni, au pied de la lettre — s'évalue
  donc **dans le même passage que l'envoi**, avant que quiconque ait matériellement pu l'ouvrir : elle vaudrait
  toujours « non ». Documenté dans `EMAIL_MARKETING_AUTOMATIONS.md` et rappelé dans l'éditeur ; l'automatisation de
  démonstration construite pour vérifier cette phase insère une attente de 3 jours entre l'envoi et la vérification.
- **Éditeur** (`public/js/marketing-automation.js`) : sélecteur du type de condition, sélecteur de l'e-mail concerné
  (uniquement les étapes « e-mail » antérieures), et deux sélecteurs « Si oui » / « Sinon » listant les étapes
  disponibles PLUS LOIN par leur numéro et leur type — recalculés à chaque rendu, donc toujours à jour avec la liste
  actuelle. Aucune modification serveur au-delà de `steps.js`/`engine.js` : les routes existantes transmettent déjà
  les étapes telles quelles.

**Vérifié** : 8 tests dédiés (`marketing-automations-branching.test.js`, y compris le schéma exact demandé rejoué de
bout en bout avec le fournisseur `console`, ouverture simulée via `sending/tracking.js#recordOpen`, isolation entre
deux passages, refus d'un saut arrière) ; les 36 tests existants du jalon M4 toujours verts (format rétrocompatible :
une condition sans `check` reste un contrôle de segment, `onFalse: "exit"|"continue"` toujours accepté). Construit et
enregistré via l'éditeur réel dans un vrai navigateur (3 modèles, 7 étapes, embranchement configuré à la souris),
contrôle avant activation passé au vert après enregistrement.

## 27. Éditeur graphique des scénarios — canevas de nœuds/arêtes, phase 1 (terminée)

Demandé explicitement par l'utilisateur : remplacer la liste verticale d'étapes (repliée en cartes, avec « Si
oui »/« Sinon » réglés par numéro d'étape) par un **vrai canevas visuel** façon Klaviyo/n8n — nœuds déplaçables,
connexions tirées à la souris, zoom/pan, panneau latéral pendant que le canevas reste visible, sans jamais faire
grandir la page avec le nombre d'étapes. Décision prise avec l'utilisateur (AskUserQuestion) : **Drawflow** (librairie
JS pure, DOM natif, sans dépendance), le projet n'ayant pas React ; plan en 3 phases, celle-ci est la phase 1.

- **Le format qui s'exécute ne change pas.** `automations/engine.js` continue de ne lire QUE `steps` (liste plate,
  curseur `step_index`) — c'est délibéré : ce moteur est déjà couvert par ~80 tests, le réécrire pour exécuter un
  graphe directement aurait été un risque inutile pour ce que la demande visait (l'ÉDITION, pas l'exécution). Le
  canevas est une **vue** au-dessus de ce même modèle.
- **`automations/graph.js`** (nouveau) : traducteur bidirectionnel entre le format canonique d'édition
  `{ nodes: [{id, type, data, position}], edges: [{id, source, target, sourceHandle?}] }` (`id` = chaîne stable,
  jamais une position dans un tableau — un nœud garde son identité même déplacé ou réordonné) et le format `steps`.
  - `stepsToGraph()` : lit `steps`, place le nœud `trigger` puis un nœud par étape (positions calculées en grille si
    aucune position mémorisée), une arête par enchaînement naturel (`i → i+1`), et pour une condition deux arêtes
    (`sourceHandle: "true"|"false"`) vers les cibles de `onTrue`/`onFalse` — ajoute un nœud `exit` si une branche sort
    du scénario.
  - `graphToSteps()` : tri topologique (Kahn), **restreint aux nœuds atteignables depuis `trigger`** — un nœud posé
    sur le canevas mais jamais relié est silencieusement ignoré, pas une erreur (l'utilisateur peut préparer un
    embranchement avant de le raccorder). Une boucle (arête vers un nœud déjà placé dans l'ordre) est refusée avec un
    message clair, ordre sinon déterministe (`Array.sort()` sur les identifiants à indegree nul, jamais dépendant de
    l'ordre d'insertion). `ref` d'une condition (identifiant du nœud e-mail visé) se résout vers l'INDEX de ce nœud
    dans l'ordre calculé.
  - Colonne `mk_automations.canvas` (migration `016_canvas.sql`, `TEXT NOT NULL DEFAULT ''`, sans `CHECK` — SQLite
    gère mal `ALTER TABLE ADD COLUMN ... CHECK`, validé en JS comme pour les webhooks/pop-ups, §23/§25) : le canevas
    **déjà enregistré** (positions choisies par la personne) prime toujours ; une automatisation créée avant cette
    phase n'en a pas — `stepsToGraph()` en calcule un à la volée à l'ouverture, jamais stocké tant que rien n'est
    enregistré depuis l'éditeur.
  - `automations/steps.js`/`engine.js` gagnent un `next` générique optionnel sur **toute** étape (pas seulement les
    conditions) — nécessaire pour qu'une arête du canevas puisse sauter au-delà de l'étape suivante naturelle. Un
    `jumpTarget()` partagé interdit tout saut vers l'arrière (index ≤ position actuelle), qu'il vienne d'une
    condition ou de ce nouveau `next` — même garde-fou anti-boucle qu'au §26, généralisé.
- **`views/marketing/automation.ejs`** : le bloc `#au-steps`/`.mk-blocks` + `#au-add` est remplacé par
  `#au-flow` (zone de canevas, hauteur fixe `70vh` avec plancher `480px` — **ne grandit jamais**, quel que soit le
  nombre d'étapes) et `#au-panel` (panneau latéral, toujours visible, contenu vide tant qu'aucun nœud n'est
  sélectionné). Les panneaux « Déclencheur » séparé disparaît : le **nœud déclencheur** (toujours présent, non
  supprimable) porte maintenant le nom du scénario, l'événement et son filtre — un seul endroit pour régler le début
  du scénario, cohérent avec le fait que le déclencheur est visuellement le premier nœud du graphe. Les panneaux
  « Contrôle avant activation », « Actions » et « Statistiques » sont **inchangés**.
- **`src/editor/automation-flow.js`** (nouveau, bundlé en IIFE minifié par esbuild vers
  `public/js/automation-flow.js` — `npm run build:automation-flow`, même schéma que l'éditeur Tiptap, §-related
  `scripts/build-editor.js` : le fichier construit est livré dans le dépôt, l'hébergeur ne compile rien) :
  - Un nœud Drawflow par étape + un pour `trigger`, HTML minimal (icône + titre + sous-titre) **rempli uniquement en
    `textContent`** après création — jamais de donnée utilisateur interpolée dans le gabarit HTML passé à
    `addNode()`, pour ne jamais dépendre d'un échappement HTML manuel (le sous-titre, seule partie dynamique visible
    sur la carte, n'est jamais injecté comme balisage).
  - Le panneau latéral reprend, par type d'étape, les mêmes champs que l'ancien éditeur linéaire (modèle, durée/unité,
    condition + segment/e-mail concerné, étiquette, liste) — mêmes garde-fous déjà éprouvés (pas de modèle → message,
    pas de segment → message, etc.).
  - **Étiquettes « Oui »/« Non »** : Drawflow ne sait pas étiqueter une arête elle-même ; affichées à la place comme
    labels de PORT sur le nœud condition (à côté de chaque sortie) — un choix délibéré de la phase 1, plus simple
    qu'un rendu SVG personnalisé sur la ligne, et tout aussi lisible.
  - **Le nœud déclencheur ne peut pas être supprimé** : Drawflow ne propose pas de blocage par nœud ; écouté via
    l'événement `nodeRemoved` et **recréé immédiatement** s'il vient de disparaître (avec ses dernières données),
    message d'erreur temporaire affiché.
  - Enregistrement : traduit l'état vivant de Drawflow (`editor.export()`) vers le format canonique `{nodes,edges}`
    (l'identifiant stable de chaque nœud voyage dans `data._id`, jamais recalculé depuis l'id numérique que Drawflow
    attribue) et l'envoie en `canvas` ; le serveur en dérive `steps` via `graphToSteps()` (§ ci-dessus) — le client
    n'exécute plus lui-même la traduction graphe → étapes, contrairement à une tentative où cette logique aurait pu
    être dupliquée côté navigateur.
  - Zoom avant/arrière/`100 %` via les méthodes natives de Drawflow ; **« Ajuster à l'écran »** est fait main (pas
    fourni par la librairie) : calcule la boîte englobante des nœuds et pose `transform` directement.
- **CSS** (`public/css/marketing.css`) : Drawflow est utilisé **sans son thème par défaut** (`dist/drawflow.min.css`
  n'est pas chargé) — seules les règles de positionnement strictement nécessaires au fonctionnement (nœuds en
  `position: absolute`, ports, SVG des connexions) sont reprises à la main, puis entièrement redessinées avec les
  jetons `mk-*` du reste de l'admin (cartes, couleurs, `--shadow-sm`, `--radius-lg`…).
- **`public/js/marketing-automation.js`** (l'ancien éditeur linéaire) est **supprimé** : plus aucune vue n'y fait
  référence, remplacé intégralement par `automation-flow.js`.

**Hors phase 1, prévu pour la suite** (le plan en 3 phases a été présenté et validé avant de coder) :
mini-carte, rangement automatique, bouton « + » d'insertion directement sur une flèche (phase 2) ; annuler/rétablir,
dupliquer un nœud, raccourcis clavier (phase 3).

**Vérifié** : `marketing-automations-graph.test.js` (13 tests : steps→graph, graph→steps, refus de boucle, nœud
orphelin ignoré, réconvergence de deux branches sur un même nœud, résolution de `ref`, et un aller-retour complet
avec les 7 étapes réelles du scénario de démonstration « Bienvenue avec branchement » construit au §26) ;
`marketing-automations-branching.test.js` (12/12, le `next` généralisé ne casse rien du comportement déjà couvert) ;
`marketing-automations.test.js` (44/44, le format `steps` stocké n'a pas changé) ; `marketing-interface-5.test.js`
étendu (nouveau balisage `#au-flow`/`#au-panel` à la place de `#au-steps`, aller-retour canevas complet via une
requête HTTP réelle). Suite complète (`npm test`, 1764 tests) verte.

**Vérification en vrai navigateur (Playwright + Chromium)**, avec un scénario reconstruit à l'identique du
« Bienvenue avec branchement » du §26 (7 étapes, mêmes modèles). Trois défauts réels trouvés et corrigés par cette
vérification — aucun n'était couvert par les tests automatisés, tous auraient affecté chaque personne utilisant
l'éditeur :
1. **La palette d'ajout d'étape était absente de la vue** (`#au-add` référencé par le script mais jamais posé dans
   `automation.ejs`) : au chargement, le script plantait sur un `appendChild` sur `null` — exception non rattrapée
   qui interrompait tout le reste de son exécution (les écouteurs zoom, enregistrement, sélection de nœud, jamais
   attachés). L'éditeur semblait fonctionner (le canevas s'affichait) mais **rien n'était cliquable ni
   enregistrable**. Corrigé en ajoutant le conteneur manquant à la vue.
2. **Le panneau latéral ne s'ouvrait jamais** : Drawflow émet l'identifiant du nœud sélectionné en chaîne
   (`"5"`, tiré de l'id DOM) alors qu'`addNode()` renvoie un nombre (`5`) — la comparaison stricte (`===`) échouait
   toujours. Corrigé en comparant les deux côtés convertis en chaîne.
3. **Sous-titre grammaticalement incorrect** de la condition « ouvert »/« cliqué » (« E-mail a ouvert un e-mail
   précédent ») : corrigé (« Le contact a ouvert… »).

Une quatrième correction, trouvée à la même occasion mais **hors de ce nouveau code** (dans `graph.js`, écrit avant
cette vérification) : le calcul de position par défaut zigzaguait sur 3 colonnes en X tout en empilant une ligne par
étape en Y (`Math.floor(i / 1)`, qui ne divise jamais rien) — un scénario de 7 étapes s'étalait donc inutilement en
largeur sans que la hauteur en profite. Simplifié en une colonne unique, cohérent avec le nœud de sortie qui
supposait déjà cette disposition.

Après ces corrections, confirmé dans un vrai navigateur : les 8 nœuds (déclencheur + 7 étapes) et leurs 7 connexions
s'affichent correctement avec les bons libellés (modèle, durée, condition, branches Oui/Non en repères de port) ;
clic sur un nœud → panneau latéral rempli et cohérent avec ses données (testé sur le nœud condition : sélecteur de
condition, sélecteur d'e-mail concerné listant les 3 e-mails du scénario) ; glisser un nœud change sa position ;
« Enregistrer » persiste réellement (vérifié par un rechargement complet de la page, position conservée, pas de
retour à la disposition calculée par défaut) ; ajouter une étape depuis la palette fonctionne et persiste (testé sur
« Ajouter une étiquette », y compris l'édition de son champ dans le panneau) ; zoom avant/arrière/100 %/ajuster à
l'écran ne lèvent aucune erreur ; hauteur de page inchangée avant/après (le canevas ne s'allonge jamais avec le
nombre d'étapes) ; « Contrôle avant activation » passe au vert après enregistrement ; **zéro erreur JavaScript** dans
la console sur l'ensemble du parcours. Donnée de vérification nettoyée après coup (scénario temporaire supprimé de
la vraie base locale).
**Non confirmé en automatisé** : créer une NOUVELLE connexion en tirant à la souris entre deux ports (le tracé d'une
liaison, mécanique 100 % native de Drawflow, jamais interceptée par notre code). Plusieurs tentatives de glisser
synthétique (Playwright) n'ont pas réussi à déclencher la création côté Drawflow, sans qu'aucune erreur ne soit
levée ; les connexions déjà présentes au chargement, elles, s'affichent, se déplacent et survivent à
l'enregistrement sans problème — seule la création d'une connexion neuve via glisser-déposer reste à confirmer
manuellement (30 secondes dans un vrai navigateur).

### 27bis. Icônes du canevas passées au design plat (2026-09-24)

Demande de l'utilisateur après revue de la phase 1 : les icônes des nœuds (posées en emoji ⚡✉️⏱🔀🏷📋⏹ pour aller
vite en phase 1) tranchaient avec le reste du site, qui utilise déjà un jeu d'icônes SVG « flat design » unique
(`src/utils/icons.js`, style ligne façon Feather, explicitement « à la place des emojis » selon son propre
commentaire). Remplacées par ce même registre, jamais dupliqué : `src/editor/automation-flow.js` fait
`import { icon } from "../utils/icons"` (module isomorphe, sans rien de spécifique à Node, bundlé par esbuild comme
Drawflow) — un seul jeu d'icônes, un seul endroit où l'ajouter. Nouvelles entrées ajoutées au registre : `minus`,
`gitBranch` (condition/embranchement), `stopCircle` (fin), `maximize` (ajuster à l'écran). Icônes colorées par type
de nœud, cohérent avec la couleur du filet gauche de la carte (déclencheur=vert, condition=ambre, fin=gris, reste en
bleu accent). Deux autres endroits corrigés au passage pour la même raison (glyphes bruts « −/+ » et « × », jamais
de vrais emojis mais incohérents avec le reste) : les boutons de zoom de `automation.ejs` et le bouton de retrait
d'étiquette de `contact.ejs`. Volontairement laissé de côté : le ✓ dans `templates/blocks.js` (contenu HTML envoyé
dans un e-mail, pas une icône d'interface — le support SVG des clients de messagerie est trop inégal) et deux
boutons « ✕ » dans `marketing-editor.js` (glyphe simple sans couleur, déjà proche du flat design, conversion à
faible valeur ajoutée).

**Bogue trouvé et corrigé en vérifiant visuellement** : la règle CSS structurelle copiée de Drawflow
`.mk-flow-canvas .drawflow svg { position: absolute; ... }` (destinée aux `<svg class="connection">` qui tracent les
liaisons) ciblait TOUT élément `<svg>` dans le canevas — donc aussi les icônes de carte, elles aussi des `<svg>`.
Résultat : chaque icône sortait du flux normal, sa case parente s'effondrait à 0×0, et elle se plaquait par-dessus
le titre au lieu de le précéder avec un espace. Corrigé en limitant le sélecteur à `svg.connection` (la classe
réellement posée par Drawflow sur ses lignes, confirmée en lisant sa source). Vérifié en vrai navigateur (capture
d'écran) : icônes bien espacées, colorées, zéro erreur JavaScript ; suite complète repassée au vert.

## 28. Parité Mailchimp — audit, matrice et tranche A (2026-09-24)

Demande explicite : faire évoluer les automatisations vers une parité fonctionnelle avec Mailchimp (Customer
Journeys / « Marketing Automation Flows » depuis juin 2025), en s'appuyant sur sa documentation publique réelle —
jamais en inventant une fonctionnalité, et en présentant le plan avant de coder (règle explicitement demandée).

**Audit KOLAKISA (relu ligne par ligne, pas de mémoire)** : le moteur (`automations/engine.js`) est plus complet que
prévu — historique pas à pas déjà écrit en base (`mk_automation_log`, jamais lu avant cette phase), retry avec
backoff exponentiel, idempotence garantie (`UNIQUE(automation_id, contact_id)`), garde-fou anti-boucle (100 étapes
max par passage), pause automatique sur erreur de configuration. Le moteur de **segments** (`segments/engine.js`,
`segments/catalog.js`) supporte déjà une logique **ET/OU/NON imbriquée** (profondeur 5, 100 nœuds) avec un vrai
catalogue d'opérateurs par type de champ — déjà réutilisable par une condition d'automatisation via `check:
"segment"`, simplement jamais exposé de façon *inline* dans l'éditeur (il fallait choisir un segment déjà
enregistré). Écarts réels identifiés : un seul déclencheur par scénario (Mailchimp : jusqu'à 3), catalogue de
déclencheurs fermé (pas d'événement personnalisé libre via l'API), pas d'attente « jusqu'à un événement » (seulement
des délais relatifs fixes), pas de fuseau horaire par contact, pas de split en pourcentage, et — le plus rentable à
corriger — deux fonctionnalités dont la DONNÉE existait déjà en base mais qu'aucun écran n'affichait : l'historique
détaillé d'un passage, et le détail envois/clics par e-mail du scénario.

**Recherche Mailchimp (documentation publique, sourcée)** : rebranding « Customer Journey Builder » → « Marketing
Automation Flows » (juin 2025). Confirmé : jusqu'à 3 déclencheurs par flux, 5 filtres par déclencheur, jusqu'à 200
étapes (offre Standard+) ; distinction **règles** (split conditionnel jusqu'à 5 conditions, split en pourcentage,
délai, attendre-un-déclencheur) vs **actions** (e-mail, étiquette/dé-étiquette, mettre à jour le contact,
désabonner, archiver, webhook) ; **un flux actif ne peut pas être édité sans le mettre en pause d'abord** — exactement
le principe déjà en place dans KOLAKISA ; rapports avec détail par étape (envois/ouverture/clic) et revenus
attribués (nécessite une intégration e-commerce, donc **non applicable** à KOLAKISA tant qu'il n'y a pas de paiement
réel — Étape 4, toujours en attente). Aucune mention d'un « nœud objectif/goal » trouvée dans la documentation
actuelle : ne sera pas inventé.

**Tranche A livrée (gains rapides, zéro changement de schéma)** :
- **Historique détaillé d'un passage** : nouvelle page `/marketing/automatisations/:id/passages/:runId`
  (`views/marketing/automation-run.ejs`, `service.js#runDetail`) — lit enfin `mk_automation_log`, déjà alimenté par
  le moteur à chaque étape franchie depuis le jalon M4. Lien « Voir le journal » ajouté à chaque ligne du tableau
  « Derniers passages ».
- **Détail par e-mail du scénario** : `automationStats()` calculait déjà `steps` (envois/clics uniques par étape
  figée) sans que la vue ne l'affiche — tableau ajouté dans « Statistiques ».
- **Dupliquer un scénario** : `service.js#duplicateAutomation` — toujours un nouveau brouillon indépendant (jamais
  actif, jamais les campagnes système ni les passages de l'original), nom rendu unique automatiquement (« … (copie)
  », « … (copie 2) »…).
- **Contrôle avant activation lié au nœud fautif** : les erreurs de modèle portent maintenant leur numéro d'étape
  et l'identifiant du modèle concerné ; un bouton « Voir l'étape sur le canevas » centre et sélectionne le bon nœud
  (`automation-flow.js#centerOnNode`/`selectNode`) au lieu de laisser chercher à l'œil.
- Libellés de type d'étape déplacés dans `src/utils/stepLabels.js` (module isomorphe, zéro dépendance) partagé par
  le serveur (contrôle, rapport, journal) ET le client (bundle esbuild) — même principe que `src/utils/icons.js`,
  pour ne jamais avoir deux listes à tenir à jour.

**Vérifié** : 17 tests dans `marketing-interface-5.test.js` (dont 3 nouveaux : journal d'un passage avec isolation
et 404, erreur de modèle liée à l'étape avec le bon `data-au-goto-template`, duplication avec numérotation
automatique du nom) ; suite complète au vert. Vérifié en vrai navigateur : lien journal et bouton Dupliquer présents
sur la page, journal affichant les vraies lignes enregistrées, duplication réelle créant un second scénario
indépendant — zéro erreur JavaScript. Donnée de vérification nettoyée après coup.

## 29. Parité Mailchimp — tranche B : condition ET/OU construite directement dans le canevas (2026-09-24)

Jusqu'ici, une condition « segment » ne pouvait que RÉFÉRENCER un segment déjà enregistré sur la page Segments —
jamais construire une logique ET/OU à la volée, contrairement au split conditionnel de Mailchimp (jusqu'à 5
conditions, choisies sur place). Le moteur le permettait déjà (`segments/engine.js`, ET/OU/NON imbriqués) ; il
manquait seulement l'accès depuis le panneau du nœud.

- **`web/automations.js`** : le paiement de la page inclut maintenant `segmentCatalog` (`segments/catalog.js#fieldCatalog`,
  le même catalogue de champs/comparateurs que la page Segments — mêmes noms de champs, mêmes comparateurs, même
  format de définition `{op, rules}`) : une condition construite ici est structurellement identique à un segment
  enregistré, entièrement interchangeable avec lui côté moteur.
- **`automation-flow.js`** : la condition « segment » propose maintenant un choix — « Choisir un segment déjà
  enregistré » (comportement existant, inchangé) ou « Construire une condition ici (ET / OU) » (nouveau). En mode
  construction : sélecteur ET/OU, une ligne par critère (case NON, champ groupé par catégorie, comparateur adapté au
  type de champ, contrôle de valeur adapté — texte/nombre/plage/date/liste déroulante selon le cas), ajout/suppression
  de critère. **Volontairement une réimplémentation compacte plutôt qu'un partage de code** avec
  `public/js/marketing-segments.js` (le constructeur de la page Segments) : les deux panneaux n'ont pas la même
  mise en page (page pleine largeur avec aperçu en direct vs panneau latéral étroit) et forcer une abstraction
  commune aurait contraint les deux inutilement ; le FORMAT de données, lui, reste rigoureusement identique.
  Simplification assumée par rapport au constructeur complet de la page Segments : pas de filtre « formation
  concernée » sur les critères d'activité KOLAKISA (kind: event, supportsCourse) — le critère porte sur toutes les
  formations confondues quand construit ici.
- **Sous-titre du nœud** : affiche désormais « N critère(s) (ET/OU) » en mode construction (au lieu d'un « Segment :
  — » trompeur), ou le nom du segment en mode « déjà enregistré », inchangé.

**Bogue trouvé et corrigé en vérifiant dans un vrai navigateur** — le plus subtil de cette phase : `editor.getNodeFromId()`
(Drawflow) renvoie **un clone JSON à chaque appel**, jamais la même référence (confirmé en lisant sa source :
`JSON.parse(JSON.stringify(...))`). Le premier jet relisait les données via `getNodeFromId()` à chaque
enregistrement (`commit()`) — la ligne ajoutée par « + Ajouter un critère » (mutation en mémoire d'un clone
précédent) disparaissait donc silencieusement : le clic ne levait aucune erreur, mais rien n'était jamais
sauvegardé, ni même reflété dans l'affichage. Corrigé en ne lisant l'état du nœud qu'UNE SEULE fois à l'ouverture du
panneau, puis en gardant cette même référence comme unique source de vérité pour toute la durée de vie du panneau —
exactement le même écueil que la comparaison de type rencontrée au §27 (id numérique vs chaîne), une deuxième leçon
sur les hypothèses implicites de l'API de Drawflow à vérifier systématiquement dans sa source plutôt que dans sa
documentation (incomplète sur ce point).

**Vérifié** : nouveau test dans `marketing-interface-5.test.js` (catalogue fourni au client, aller-retour complet
d'une définition personnalisée sans segment enregistré, rejet d'un champ inexistant avec le numéro d'étape) ; suite
complète au vert. Vérifié en vrai navigateur : bascule de mode, ajout d'un critère (champ/comparateur/valeur),
persistance confirmée après enregistrement + rechargement (sous-titre et panneau cohérents), zéro erreur
JavaScript. Donnée de vérification nettoyée après coup.

## 30. Parité Mailchimp — tranche C (partie 1, sans changement de schéma) : événement personnalisé, tirage aléatoire, mettre à jour un champ, attendre jusqu'à un événement (2026-09-24)

Quatre des cinq points de la tranche C ne demandaient PAS de migration — livrés ensemble ; seul le multi-déclencheur
(plusieurs événements par scénario) reste, lui, à faire (changement de schéma, voir la fin de cette section).

- **Déclencheur = événement personnalisé libre.** `validateTrigger()` (`service.js`) n'exige plus que l'événement
  soit dans le catalogue `TRIGGERS` fermé : un nom syntaxiquement valide (même motif que celui déjà appliqué en
  écriture par `events/bus.js#NAME` : minuscules/chiffres/« _ »/« . », 2 à 64 caractères) suffit désormais — ce qui
  débloque un scénario déclenché par un événement envoyé via `POST /api/v1/events` (déjà construit à M5, jamais
  utilisable comme déclencheur jusqu'ici). Un champ libre « …ou un événement personnalisé » (remplace le menu s'il
  est rempli, jamais l'inverse — pas besoin de JavaScript pour les distinguer) ajouté à la fois au formulaire de
  création (`automations.ejs`) et au panneau du nœud déclencheur dans le canevas.
- **Tirage aléatoire (`split`).** Nouveau type d'étape à deux sorties « A »/« B » (pourcentage 1-99, `Math.random()`),
  même mécanique de branchement qu'une condition — `graph.js` généralisé (`BRANCH_FIELDS`/`BRANCH` désormais une
  table plutôt qu'un `if` dédié à `condition`, réutilisée à l'identique côté client dans `automation-flow.js`).
- **Mettre à jour un champ (`update_field`).** Réutilise `audience/contacts.js#updateContact` et
  `audience/properties.js#setContactProperties`, déjà là et déjà sûrs (jamais l'e-mail ni le statut, seul le module
  de conformité les change) — aucune nouvelle logique d'écriture, juste une étape qui les appelle. Champ texte du
  contact (prénom/nom/téléphone/société/pays/langue/source) ou propriété personnalisée (`property:<clé>`).
- **Attendre jusqu'à un événement (`wait_for_event`).** Techniquement une attente ORDINAIRE (même réveil par date en
  base) — la seule différence : `onEvent()` (`engine.js`) reconnaît maintenant, en plus de démarrer de nouveaux
  passages, les passages DÉJÀ en cours pour ce même contact dont l'étape qui les a mis en pause est un
  `wait_for_event` correspondant à l'événement reçu, et ramène leur `wake_at` à maintenant pour qu'ils reprennent
  tout de suite plutôt que d'attendre le délai maximal. **Toujours un délai maximal obligatoire** (jamais une
  attente indéfinie, conformément à la règle explicite du cahier des charges : un contact ne doit jamais pouvoir
  rester bloqué pour toujours) — si l'événement n'arrive jamais, le scénario reprend quand même une fois le délai
  écoulé.

**Bogue trouvé et corrigé en écrivant le code (avant tout test)** : le premier jet de la traduction canevas → étapes
côté client réutilisait `sourceHandle: "true"/"false"` pour la sortie A/B d'un tirage aléatoire, alors que
`graph.js` (serveur) attend `"a"/"b"` pour ce type précis — une divergence silencieuse qui aurait fait qu'un split
enregistré perde toujours sa branche « B » (résolue en sortie du scénario) sans qu'aucune erreur ne le signale.
Corrigé en faisant porter les noms de handle par la même table de configuration (`BRANCH`) des deux côtés, avec un
commentaire explicite reliant les deux fichiers — la table elle-même empêche desormais la divergence de revenir
silencieusement si un type y est ajouté sans y penser des deux côtés à la fois.

**Vérifié** : nouveaux tests unitaires du moteur (`marketing-automations.test.js` : split déterministe via
`Math.random` neutralisé le temps du test, mise à jour d'un champ texte ET d'une propriété, refus de modifier
l'e-mail/le statut, attente avec réveil au délai maximal ET réveil anticipé par un événement correspondant,
événement sans rapport ignoré) ; nouveaux tests `graph.js` (traduction dans les deux sens du type `split`, jamais
confondu avec `condition`) ; tests web étendus (déclencheur personnalisé accepté si bien formé, refusé sinon, le
champ libre l'emporte sur le menu). Suite complète au vert. Vérifié en vrai navigateur : les 3 nouveaux types de
nœud + le déclencheur personnalisé créés, réglés, enregistrés puis relus après rechargement — sous-titres et
panneaux cohérents à chaque étape, zéro erreur JavaScript. Donnée de vérification nettoyée après coup.

## 31. Parité Mailchimp — tranche C (partie 2, dernier point) : plusieurs déclencheurs par scénario (2026-09-24)

Dernier point de toute la mission de parité Mailchimp. Jusqu'à 3 déclencheurs par scénario (même limite que les
flux d'automatisation Mailchimp, offre Standard+) — n'importe lequel démarre le passage, chacun avec son propre
filtre.

- **Migration 017.** `trigger_event`/`trigger_filter` (colonnes existantes) restent EN PLACE, toujours mises à jour
  — elles reflètent désormais le PREMIER déclencheur, jamais indépendamment de la nouvelle colonne. `triggers`
  (JSON, 1 à 3 entrées `{event, filter}`) devient la source de vérité complète. Choix délibéré : une liste JSON
  dans la même ligne plutôt qu'une table séparée — cohérent avec `steps`/`trigger_filter`/`canvas`, déjà stockés
  ainsi sur cette même table ; évite une jointure, et le nombre d'entrées est de toute façon borné à 3. Backfill
  fait dans la migration elle-même (`json_array(json_object(...))`), pas de script à part : chaque scénario
  existant se retrouve avec exactement son ancien déclencheur unique dans la nouvelle liste, rien ne change pour
  lui tant qu'il n'est pas modifié.
- **`service.js#validateTriggers`** : 1 à 3 entrées, jamais deux fois le même événement dans un même scénario
  (ambigu : lequel des deux filtres s'appliquerait ?). `updateAutomation` accepte soit `patch.triggers` (liste
  complète, envoyée par le nœud déclencheur du canevas — remplace tout), soit, pour compatibilité,
  `patch.triggerEvent`/`patch.triggerFilter` qui ne touchent QUE le premier déclencheur et laissent les
  éventuels 2e/3e inchangés.
- **`engine.js#onEvent`** : la requête SQL utilise `json_each(a.triggers)` pour trouver, au niveau de la base
  (pas en relisant chaque automatisation en JS), tout scénario actif dont N'IMPORTE LEQUEL des déclencheurs
  correspond à l'événement reçu — puis retrouve en JS lequel a matché pour appliquer SON filtre à lui (pas
  forcément celui du premier).
- **Nœud déclencheur du canevas** (`automation-flow.js`) : une section répétée par déclencheur configuré (titre
  « Déclencheur N sur M » dès qu'il y en a plus d'un), chacune avec son propre sélecteur/champ personnalisé/filtre,
  un bouton « Retirer » par ligne (sauf s'il n'en reste qu'un) et un bouton « + Ajouter un déclencheur (N/3) » qui
  disparaît à 3/3. Sous-titre du nœud : « <1er déclencheur> (+ N autres) » quand il y en a plus d'un.
- **Piège de nommage repéré et documenté en écrivant le code** (pas un bogue, mais une source de confusion réelle) :
  `data.triggers` (fermeture globale du script, le CATALOGUE `{clé: {label, filters}}`) et `d.triggers` (données du
  nœud déclencheur précis, la LISTE des 1 à 3 déclencheurs configurés) portent le même nom à des portées
  différentes — commenté explicitement aux deux endroits où ça pourrait prêter à confusion, plutôt que renommé
  (un renommage aurait fallu toucher soit le payload serveur existant, soit le catalogue déjà utilisé ailleurs
  dans ce fichier).

**Vérifié** : nouveaux tests moteur (déclenchement par n'importe lequel des 3 déclencheurs avec son propre filtre,
4 déclencheurs refusés, doublon d'événement refusé, liste vide refusée, mise à jour du seul premier déclencheur
préserve les autres vs. remplacement complet de la liste) ; test web (aller-retour complet via le canevas, colonne
miroir vérifiée) ; suite complète au vert. Vérifié en vrai navigateur : ajout de 2 déclencheurs supplémentaires
(un du catalogue, un personnalisé), bouton « + » qui disparaît à 3/3, sous-titre « (+ 2 autres) » persistant après
enregistrement et rechargement, retrait d'un déclencheur qui renumérote correctement les autres — zéro erreur
JavaScript. Donnée de vérification nettoyée après coup.

**C'était le dernier point de la mission de parité Mailchimp** (§28 à §31) : audit, matrice, tranches A/B/C toutes
livrées et vérifiées.

## 32. Audit UI/UX — cohérence du design system, passe sur l'Accueil (2026-09-24)

Demande explicite : garantir la cohérence visuelle du design system marketing avant toute série de demandes page par
page, puis une première passe concrète sur la page Accueil (alertes, checklist « Premiers pas », graphique, états
vides). Consigne du cahier des charges : auditer d'abord, ne jamais fabriquer un problème qui n'existe pas.

**Audit du système existant (avant toute modification)** : le système est déjà largement centralisé — tokens dans
`:root` (`style.css`), échelle d'espacement déjà définie côté marketing (`--mk-space-1` à `-6`, soit 4/8/12/16/24/32
— exactement la logique demandée), une seule famille de boutons `.btn`, un seul système d'icônes SVG (`icons.js`,
jamais d'emoji depuis le §27bis), une seule sidebar/coque (`nav.js` + `partials/top.ejs`), `.mk-panel`/`.mk-table`/
`.badge`/`.mk-empty` déjà partagés entre les pages.

**Vérifié — PAS un bogue** (mesuré précisément avant de conclure, pas supposé) : l'alignement des chevrons de
sous-menu de la sidebar, explicitement signalé comme cassé, est en réalité déjà correct — `.mk-nav-label` en
`flex: 1 1 auto` pousse naturellement le chevron à une position identique quelle que soit la longueur du libellé
(même principe que `margin-left: auto`, déjà en place). Mesuré en vrai navigateur sur "Audience"/"Campagnes"/
"Intégrations" : position strictement identique (12px du bord droit, même hauteur) sur les trois. Rien changé ici.

**Améliorations concrètes livrées** (composants partagés modifiés une fois, jamais un correctif isolé à une page) :
- **Composant Alert** (`.mk-flash`, utilisé par TOUTE la coque marketing — bandeau de haut de page ET alertes de
  l'accueil) : passait d'un simple fond coloré à une vraie structure icône + corps + action, avec un bouton
  « Voir » plutôt qu'un lien texte perdu dans la phrase. `.mk-flash-warn` avait aussi un bug mineur trouvé au
  passage (`border-left-color` seul sur un composant à bordure pleine : 3 des 4 côtés gardaient la mauvaise
  couleur) — corrigé.
- **Checklist « Premiers pas »** : remplacée par un vrai composant d'onboarding (`.mk-onboarding`), pastilles
  numérotées rondes, titres en vraie hiérarchie (`h3`), séparateurs entre étapes — sans afficher de fausse
  progression (aucune étape marquée « faite » : la donnée ne permet pas de le savoir de façon fiable pour l'instant,
  donc rien n'est inventé, conformément à la règle « ne fabrique pas de données »).
- **Graphique « Nouveaux contacts par semaine »** (`web/charts.js`) : une semaine à zéro se traçait sur 1px, la
  même couleur que le trait de l'axe — invisible en pratique, donnant l'impression de semaines manquantes plutôt
  que de zéros réels. Bogue réel trouvé en regardant le graphique rendu (pas visible en lisant le code seul).
  Corrigé à 3px, clairement visible sans dominer les vraies valeurs.
- **État vide « Campagnes récentes »** : remplacé un `<p>` de texte par le composant `.mk-empty` déjà utilisé
  ailleurs dans l'app (ex. `/marketing/api`) — icône + titre + description + bouton, plutôt qu'une nouvelle
  variante. Nouvelle classe `.mk-empty-sm` ajoutée pour un usage en carte (padding réduit) sans dupliquer le
  composant.

**Vérifié** : suite complète au vert (tests de conception : orphan classes, palette, tailles de police) ; test du
graphique mis à jour pour refléter le nouveau comportement voulu (3px, pas 1px) — pas une régression, un changement
assumé et documenté. Vérifié en vrai navigateur à 1440/1280/1024/768/390px : aucun débordement horizontal, aucune
erreur JavaScript, captures d'écran comparées avant/après à chaque largeur.

## 33. Audit UI/UX — passe sur Audience → Contacts (2026-09-24)

Deuxième page traitée dans le même système (voir §32). Audit complet AVANT modification (`contacts.ejs` +
`web/admin.js` + CSS relus intégralement) — cette page s'est révélée beaucoup plus mature que le cahier des charges
ne le supposait : titre avec compteur discret déjà conforme, hiérarchie des boutons déjà correcte, panneau de
filtres avec les 6 champs demandés déjà là, barre d'actions groupées déjà fonctionnelle (sélection, étiquette,
liste), DEUX états vides déjà présents (aucun contact du tout vs aucun résultat de filtre), et — élément non anticipé
en lisant le cahier des charges — **le tableau se transforme déjà en cartes empilées sur mobile** (`data-label` +
CSS), exactement ce que la section 26 du cahier des charges demandait sans savoir que c'était déjà fait.

**Améliorations réelles livrées** :
- **Indicateur de tri visuel** : les en-têtes triables n'affichaient AUCUN indicateur tant qu'ils n'étaient pas la
  colonne active (juste un lien texte) — ajouté un repère discret (⇅) sur toute colonne triable, remplacé par une
  flèche colorée (▲/▼) sur la colonne active. Toujours du CSS pur (`content` sur `::after`, garde la sécurité
  « jamais de donnée insérée comme HTML » du reste du projet), jamais un caractère brut dans le texte du libellé.
- **Filtres actifs en puces retirables** : chaque filtre actif (Statut, Liste, Étiquette, Segment, Source, Ajoutés,
  Joignables) s'affiche maintenant sous la barre de recherche en puce cliquable qui le retire individuellement
  (`Statut : Pas de consentement ×`), en plus du bouton « Réinitialiser » déjà existant pour tout effacer d'un coup.
- **Bogue réel de lisibilité trouvé en regardant le tableau rendu** (pas en lisant le code) : la colonne Source
  affichait « Ims » — en réalité la valeur réelle est `lms` (le pont KOLAKISA), mais le « l » minuscule se lit comme
  un « I » majuscule dans la police du site. **La donnée elle-même n'a pas été touchée** (interdiction explicite du
  cahier des charges de changer une donnée pour l'esthétique) : un nouvel helper d'AFFICHAGE
  `mkh.sourceLabel()` (même principe que `statusLabel()`, déjà existant) traduit les codes connus
  (`manual`/`import`/`form`/`lms`/`signup`/`api`) en libellés lisibles, avec repli sur la valeur brute pour toute
  source inconnue (ex. fournie librement par l'API) — jamais une donnée inventée.

**Vérifié — pas retouché, déjà conforme** : alignement des colonnes, hauteur des lignes, pagination (« 1–5 sur 5 »
déjà au bon format), badges de statut déjà à point coloré cohérent, sidebar/breadcrumb déjà cohérents avec le reste
de l'app, boutons déjà de la même famille partagée.

**Vérifié** : suite complète au vert ; nouveau texte de police corrigé une fois (0,76rem, pas 0,7rem — sous 12px,
même garde-fou que d'habitude). Vérifié en vrai navigateur à 1440/1280/1024/768/390px : zéro débordement, zéro
erreur JavaScript, puce de filtre cliquée en vrai (retire bien CE filtre, conserve les autres dans l'adresse).

## 34. Audit UI/UX — passe sur Audience → Listes (2026-09-24)

Troisième page traitée dans le même système (voir §32-33). Contrairement à Contacts, cette page était encore au
stade « primitif » décrit par le cahier des charges : formulaire de création affiché en permanence (`name` +
`description` + bouton, toujours visibles même sans besoin), gros bloc « Aucune liste » en bordure pointillée, et
un tableau minimal sans tri ni recherche. Audit du code (`lists.ejs`, `web/admin.js`, `audience/lists.js`,
`nav.js`) et de la base réelle (0 liste actuellement) AVANT modification.

**Composants réutilisés tels quels** (rien réinventé) : `.mk-dropdown`/`.mk-menu` du menu utilisateur du bandeau,
réutilisé pour le menu d'actions par ligne (« ⋮ ») ; `data-mk-confirm` (boîte de confirmation déjà existante pour
la suppression, `<dialog>` natif) ; `.mk-search`/`.mk-filterbar` de Contacts pour la recherche ; `.mk-dialog`
(déjà utilisé pour les confirmations) étendu en `.mk-modal` pour le formulaire de création ; le fil d'Ariane et le
bouton principal du bandeau (`nav.js` → « Nouvelle liste ») déjà générés automatiquement, inchangés.

**Composants génériques ajoutés à `shell.js` / au design system** (réutilisables par les prochaines pages) :
- **Modal générique** (`data-mk-modal-open` / `data-mk-modal` / `data-mk-modal-close`) : `<dialog>` natif (piège le
  focus et gère Échap nativement, comme la confirmation), fermeture au clic sur le fond, et ouverture par ancre
  d'URL (`#nouvelle`) pour que le bouton déjà existant du bandeau fonctionne sans changement.
- **Message de champ obligatoire personnalisé** (`data-mk-required-message`) : « Le nom de la liste est
  obligatoire. » au lieu du message générique du navigateur.
- **Callout d'information neutre** (`.mk-callout`) : n'existait pas — `.mk-note`/`.mk-warn` existants sont tous les
  deux des composants d'AVERTISSEMENT (fond jaune/rouge), inadaptés à une information neutre sur le consentement.
- Icône **`moreVertical`** (menu ⋮) ajoutée à `src/utils/icons.js`, absente jusqu'ici.

**Changements fonctionnels réels** :
- Création déplacée dans un modal (masquée par défaut) ; en cas de nom en double, le message d'erreur existant
  (flash serveur, inchangé) s'affiche ET le modal se rouvre automatiquement pour ne pas perdre le fil.
- État vide reconstruit : surface discrète (bordure pleine, pas de pointillés — changement appliqué à `.mk-empty`
  globalement, donc profite aussi à Contacts/Segments/Accueil) + exemples concrets + bouton.
- Recherche et **tri fonctionnel** ajoutés côté serveur (`audience/lists.js#listListsWithStats` accepte désormais
  `q`/`sort`/`dir`, rétrocompatible — appelé sans argument ailleurs, comportement par défaut inchangé) ; en-têtes
  triables avec le même indicateur visuel (⇅ / ▲ / ▼) que Contacts.
- Menu d'actions par ligne limité aux capacités RÉELLES du backend (**pas d'invention de fonctionnalité** :
  `audience/lists.js` n'a ni renommage, ni duplication, ni archivage — `mk_lists` n'a pas de colonne de statut) :
  Ouvrir, Voir les contacts, Exporter (CSV, filtre `?liste=` déjà supporté par la route d'export existante), et
  Supprimer (avec confirmation). « Modifier »/« Dupliquer »/« Archiver » du cahier des charges volontairement
  omis pour cette raison, plutôt que fabriqués.
- États de chargement/erreur du cahier des charges (skeleton, « Réessayer ») : cette page est intégralement
  rendue côté serveur avant l'affichage (pas de chargement asynchrone après coup) — un skeleton n'aurait rien à
  squeletter ; non ajouté pour ne pas fabriquer un état qui n'existe pas techniquement.

**Bogue de mise en page trouvé et corrigé en vérifiant sur mobile** : une cellule à deux lignes (nom + description)
se retrouvait compressée en colonne trop étroite (mot coupé « Newslette-r ») à cause de `justify-content:
space-between` appliqué à 3 éléments flexibles au lieu de 2 — corrigé au niveau du composant partagé
(`.mk-datatable td:has(.mk-sub)`), donc corrige aussi Segments qui a le même motif.

**Régression détectée et corrigée avant de conclure** : un test existant (`marketing-r3-segments-web.test.js`)
vérifiait `id="nouvelle"` sur l'ancien formulaire inline et le texte brut des en-têtes (`<th>Liste`) — mis à jour
pour refléter le nouveau modal (id conservé sur le `<dialog>`) et les en-têtes désormais triables (liens), sans
changer ce que le test protège réellement.

**Vérifié** : suite complète au vert (1779/1779, y compris le scanner de classes orphelines). Vérifié en vrai
navigateur à 1440/1280/1024/768/390px : zéro débordement, zéro erreur JavaScript ; création, doublon détecté +
modal rouvert, tri, recherche (avec et sans résultat), suppression avec annulation puis suppression réelle,
testés en conditions réelles puis données de test nettoyées de la base.

## 35. Audit complet de la plateforme + première tranche de corrections réelles (2026-09-25)

L'utilisateur a collé une mission de refonte totale (35 sections) : auditer TOUT le module marketing (pas une
page à la fois), distinguer le réel du placeholder, corriger le backend si nécessaire, ne jamais afficher un faux
succès. Contrairement aux missions précédentes, il ne demandait pas de plan à valider avant d'agir — audit puis
exécution directe.

**Audit lecture seule** (deux passes en parallèle, 8 sous-systèmes) confirmant l'état RÉEL du code (jamais supposé) :

- **Campagnes, automatisations, envoi, pont LMS** : réels et complets de bout en bout (cycle de vie complet des
  campagnes avec vrais statuts SQL CHECK, moteur d'automatisation avec vraie exécution pas-à-pas, 3 fournisseurs
  d'envoi réels dont `console` — un no-op HONNÊTE qui le journalise clairement, jamais un faux succès). **Aucune
  façade trouvée.** `MARKETING_WORKER=off` et le fournisseur `console` par défaut sont des GARDE-FOUS DÉLIBÉRÉS,
  documentés en commentaires FR partout dans le code — pas des bugs, contrairement à ce que le cahier des charges
  supposait (il les traitait comme « un problème fonctionnel à corriger »). Je ne les ai PAS « activés » de force :
  cela nécessite de vraies informations que je n'ai pas (identifiants SMTP/Resend) et forcer le worker romprait la
  sécurité voulue (aucun envoi accidentel en développement).
- **Analytics, clés d'API, webhooks sortants, conformité, import CSV** : également réels sur l'essentiel (vraies
  requêtes SQL sur de vraies tables, jamais de données fabriquées). Écarts RÉELS confirmés et corrigés dans cette
  tranche (voir ci-dessous). Le seul vrai reproche du cahier des charges qui s'est avéré FAUX à la vérification :
  l'import CSV n'est PAS limité à « choisir un fichier + lire le fichier » — c'est déjà un flux à 7 étapes complet
  (mapping de colonnes, analyse à blanc, prévisualisation, résumé, confirmation, reprise sur échec, rapport de
  rejets téléchargeable) ; seule l'étape 1 (sélection) manquait réellement de glisser-déposer.
- **Formulaires** : nuancé — la création initiale est bien pauvre (nom + texte de consentement seulement), mais la
  page de détail permet déjà réellement de configurer champs (catalogue fermé de 4), liste de destination, message
  de remerciement, pop-up. Manquent réellement : champs personnalisés libres, tags à la soumission, redirection
  personnalisable, double opt-in — non traités cette tranche (backlog, voir plus bas).

**Corrections réelles livrées cette tranche** :
- **Étiquettes et Propriétés** (`tags.ejs`, `properties.ejs`) : même passage au modal de création que Listes
  (§34), réutilisant tel quel le composant Modal générique déjà construit — formulaire de création qui n'encombre
  plus la page en permanence. Propriétés : le champ Options n'apparaît plus que pour le type « Choix » (nouveau
  petit composant réutilisé `data-mk-op`/`data-mk-show-for`, déjà existant dans `shell.js` mais jamais utilisé).
- **Conformité** : la liste de suppression n'avait aucune recherche ni filtre (cahier des charges §16, confirmé
  manquant par l'audit) — ajouté `q` (sous-chaîne d'adresse) + filtre par motif, côté serveur
  (`compliance/suppression.js#listSuppressions`), avec état « aucun résultat » distinct.
- **Webhooks sortants** : aucun moyen de tester une configuration sans déclencher un vrai événement métier (§15,
  confirmé manquant). Ajouté un bouton « Envoyer un test » qui met en file une VRAIE livraison HTTP signée, par le
  même mécanisme que n'importe quel événement réel (`webhooks/delivery.js#sendTestEvent`) — jamais un faux succès
  affiché : le résultat (livré / erreur / point d'accès en pause) apparaît ensuite dans « Dernières livraisons »
  comme tout événement.
- **Import CSV** : nouveau composant réutilisable **Zone de dépôt de fichier** (`shell.js` : `data-mk-dropzone`,
  glisser-déposer + sélection classique, aperçu nom/taille, bouton retirer, erreur de taille avant l'envoi) —
  générique, prêt à être réutilisé par une future page qui accepterait un fichier.
- Correction cosmétique globale déjà faite au §34 (`.mk-empty` sans bordure pointillée) confirmée cohérente : la
  bordure pointillée du nouveau composant Dropzone, elle, reste un choix DÉLIBÉRÉ — c'est la convention universelle
  pour une zone de dépôt, contrairement à un état vide.

**2 bogues réels trouvés par mes propres tests, avant tout signalement utilisateur** (écrits pour verrouiller le
nouveau comportement, comme le veut la pratique du projet) :
1. Le filtre par motif de la liste de suppression comparait contre la mauvaise valeur (`Object.values(REASONS)` au
   lieu de `Object.keys(REASONS)`) — `mk_suppressions.reason` stocke la clé saisie (« manual »), pas la valeur
   mappée sur `mk_contacts.status` (« suppressed ») ; le filtre « Blocage manuel » n'aurait jamais rien filtré.
   Corrigé avant tout signalement, grâce au test écrit dans la foulée.
2. `sendTestEvent` utilisait `Date.now()` seul comme suffixe de clé d'idempotence : deux tests cliqués très vite
   (même milliseconde) auraient silencieusement fusionné en une seule livraison (`INSERT OR IGNORE`). Corrigé en
   ajoutant un aléa (`crypto.randomBytes`), détecté par le test « deux tests successifs » qui a échoué à la
   première exécution.

**Vérifié** : suite complète au vert (1785/1785 — 6 nouveaux tests). Vérifié en vrai navigateur : création
étiquette/propriété via modal, recherche de conformité (avec/sans résultat), création + test réel d'un webhook
(nécessite `ENCRYPTION_KEY` — testé sur un serveur temporaire jetable avec une clé générée pour l'occasion, jamais
écrite dans le `.env` réel de l'utilisateur, tuée et données de test nettoyées ensuite), glisser-déposer et sélection
classique d'un fichier CSV avec un vrai import de bout en bout. Zéro erreur JavaScript partout.

**Ce qui reste (backlog honnête, pas traité cette tranche — mission bien plus vaste qu'une session)** :
- Passe UI/UX page par page pour le reste du produit (Campagnes, Modèles, Automatisations, Analytics, Webhooks
  liste, Clés d'API, Événements KOLAKISA) — seules Accueil/Contacts/Listes/Étiquettes/Propriétés/Conformité ont
  reçu la passe de cohérence visuelle complète jusqu'ici.
- Message humanisé pour `MARKETING_WORKER=off` (cahier des charges §17 : distinguer message technique pour
  l'admin vs message humain pour l'utilisateur) — actuellement le même message technique s'affiche partout
  (honnête, mais pas encore « humanisé » comme demandé).
- Automatisations : pas d'action « webhook » en tant qu'étape de scénario (le webhook sortant existe mais comme
  fonctionnalité séparée basée sur les événements du bus).
- Clés d'API : permissions binaires seulement (lecture/écriture globale), pas de scopes granulaires par ressource
  ni d'expiration programmable.
- Formulaires : champs personnalisés libres, tags à la soumission, redirection personnalisable, double opt-in.
- Responsive : vérifié uniquement sur les pages retravaillées cette tranche, pas sur l'ensemble de la plateforme.

## 36. Audit du site complet + suite du backlog §35 : message humanisé, création en modale, réouverture après erreur (2026-09-25)

**Audit réel en navigateur** (Chrome via Playwright, copie jetable de la base, serveur temporaire port 3099) :
138 pages visitées sous trois profils (visiteur, élève, formateur avec l'espace marketing), chacune à 1440 px puis
390 px — statut HTTP, erreurs JavaScript, débordement horizontal, images cassées, un seul `<h1>`. Résultat : zéro
erreur serveur, zéro erreur JavaScript. Un seul vrai défaut : sur une leçon avec pièce jointe, un nom de fichier
long sans espace (`VIVEA_CDC_standard_Bilan_de_competences_2024.pdf`) poussait le bouton de téléchargement à 419 px
sur un écran de 390 px (défilement horizontal de toute la page). Corrigé dans `style.css` (`.attachment-list .btn` :
`max-width: 100%` + `overflow-wrap: anywhere`). Faux positif écarté : l'image « vide » de « Nouvelle formation »
est l'aperçu de miniature, masqué (`hidden`) tant qu'aucun fichier n'est choisi.

**Message « traitement automatique indisponible » humanisé partout** (backlog §35, cahier des charges §17). Le
composant `partials/worker-note.ejs` existait déjà sur trois pages ; sept autres endroits affichaient encore
`MARKETING_WORKER=off` en premier. Nouvelle source unique `src/marketing/workerNotice.js` (`workerHuman(conséquence)`
+ `WORKER_DETAIL`), utilisée par : contrôle avant envoi d'une campagne, vérifications d'un scénario (les
avertissements portent désormais un champ `detail` facultatif, affiché replié), liste « Prêt pour un vrai envoi ? »
de l'accueil (champ `tech`), réglages d'envoi, page Événements, message après lancement d'une campagne, refus d'un
gros import. Les messages flash acceptent maintenant un détail technique facultatif (`attempt()` accepte
`{ text, detail }`, `MarketingError` un 3ᵉ argument `detail`) rendu dans le même `<details>` « Détails techniques ».
Les codes stables (`worker_off`, `worker_required`) sont inchangés.

**Création en fenêtre modale sur Automatisations, Formulaires, Webhooks et Clés d'API** (même composant que
Listes/Étiquettes/Propriétés, §34-35) : plus de formulaire de création affiché en permanence ; bouton principal du
bandeau (ajouté pour Webhooks et Clés d'API, ancres `#nouveau` / `#nouvelle` déjà gérées) ; bouton de création dans
l'état vide ; état vide d'Automatisations passé de l'ancien `.empty-state` au composant `.mk-empty`. Webhooks : les
15 cases d’événements, auparavant en vrac (plusieurs par ligne, mal alignées), sont en grille (`.mk-check-grid`,
2 colonnes dès qu'il y a la place, code technique sous le libellé) avec « Tous les événements » mis à part ; variante
`.mk-modal-wide`. Le corps de toute modale défile désormais quand il dépasse l'écran, boutons toujours visibles.

**2 défauts réels du composant modale trouvés en regardant la capture** (existaient déjà sur Listes/Étiquettes/
Propriétés) : après une création refusée, (1) le message d'erreur restait caché derrière le fond sombre de la modale
rouverte, (2) tout ce qui avait été saisi était perdu — alors que le commentaire du code promettait le contraire.
Corrigé une fois pour toutes dans `shell.js` : le partial `modal-reopen.ejs` (remplace le script recopié trois fois)
pose un marqueur `data-mk-modal-reopen` ; la modale se rouvre avec une copie du message d'erreur en tête et les
valeurs saisies (gardées le temps d'un aller-retour dans `sessionStorage`, jamais mot de passe ni fichier, effacées
dès la page suivante). Vérifié en vrai navigateur sur Webhooks (nom, adresse et case cochée restaurés) et Listes
(doublon de nom).

**Tests (1799/1799, +14)** : 2 nouveaux fichiers écrits d'abord en rouge — `marketing-worker-humain.test.js` (7 endroits : message
humain présent, variable absente hors du détail replié) et `marketing-creation-modale.test.js` (4 pages : formulaire
uniquement dans la modale, bouton du bandeau, état vide, réouverture, grille d'événements, création toujours
fonctionnelle, lecteur sans bouton).

**Reste du backlog §35 (inchangé)** : passe visuelle Campagnes/Modèles/Analytics/Événements (libellés humains des
événements dans le tableau) ; action « webhook » dans les scénarios ; scopes d'API granulaires et expiration ;
formulaires (champs libres, tags à la soumission, redirection, double opt-in).

## 37. Passe UI/UX — page Événements lisible, chevron des sections repliables (2026-09-25)

Suite directe du §36 (backlog : « libellés humains des événements »). **Campagnes** vérifiée d'abord, pas refaite :
la page était déjà complète (onglets par statut avec effectifs, recherche, tri avec l'indicateur ⇅/▲/▼ partagé via
`.mk-datatable`, pagination, duplication) ; seule la formulation du message « traitement indisponible » a été
alignée (« rétabli » comme partout).

**Événements** — uniquement l'affichage, aucune donnée modifiée :
- chaque événement porte son libellé français (`mkh.eventLabel`, repris du catalogue existant
  `webhooks/catalog.js`, source unique des noms réellement émis — rien de recopié), le code technique restant visible
  en petit en dessous ; « Événement personnalisé » pour un nom libre envoyé par l'API ;
- nouvelle colonne Date (`mkh.fdatetime` : millisecondes ou `datetime('now')` SQLite → « 25/09/2026 14:30 ») ;
  origine traduite (`mkh.eventSourceLabel` : « Site KOLAKISA », « Marketing », « API »…) ; état en badge
  (Traité / En attente) ;
- le tableau technique du pont (identifiants lus) passe dans une section repliable, sources traduites (Comptes,
  Commandes…) et dates lisibles (avant : `2026-09-25 09:15:00` brut) ; en clair, une seule ligne « Dernière lecture
  du site : … » ;
- état vide passé à `.mk-empty` ; message de synchronisation humanisé (même `workerNotice` que le §36).

**Composant partagé `.mk-advanced`** : le titre d'une section repliable n'avait aucun repère visuel (marqueur natif
masqué par `display:flex`) — il ressemblait à un simple intertitre. Ajout d'un chevron (› fermé, ⌄ ouvert, sans
animation si l'utilisateur a demandé moins de mouvements) : profite à toutes les sections repliables du module.

**Tests (1803/1803, +4)** : `marketing-evenements-lisibles.test.js`, écrit d'abord en rouge. Vérifié en vrai
navigateur à 1440 et 390 px (tableau transformé en cartes sur mobile, aucun débordement, aucune erreur JavaScript).

**Reste du backlog** : passe visuelle Modèles et Analytics ; action « webhook » dans les scénarios ; scopes d'API et
expiration ; formulaires (champs libres, tags à la soumission, redirection, double opt-in).

## 38. Passe UI/UX — Modèles et Analytics (fin de la passe visuelle du module) (2026-09-25)

Audit sur captures d'abord (Analytics vide sur les vraies données : activité fictive créée UNIQUEMENT dans une copie
jetable de la base, supprimée ensuite).

**Modèles** :
- création en modale (même composant que partout, id `creer` conservé : l'ancre du bouton du bandeau et les tests
  existants restent valables ; curseur placé directement dans le champ Nom à l'ouverture) ; l'état vide propose
  « Créer un modèle » en plus de la bibliothèque ;
- actions de ligne dans un menu ⋮ (composant `.mk-dropdown`/`.mk-menu` de Listes) : Ouvrir, Dupliquer, Supprimer
  (en rouge, confirmation inchangée) — auparavant deux boutons texte nus sur chaque ligne, « Supprimer » à portée
  de clic accidentel.

**Analytics** :
- nouvel histogramme en colonnes HTML `columnChart()` (`web/charts.js`) : le SVG `barChart()` a un viewBox fixe
  (480×180), donc sur grand écran il restait étroit et centré, et sur mobile tout rétrécissait, texte compris ; les
  dates se chevauchaient (« 27/08 30/08 »). Le nouveau s'étire sur toute la largeur, texte à taille réelle ; valeur
  écrite au-dessus de chaque colonne non vide (masquée sur mobile seulement quand les colonnes sont trop étroites,
  `is-dense`) et en infobulle ; libellés espacés (10 au plus, 4 sur mobile — un sous-ensemble, jamais un libellé en
  plus qui chevaucherait). `barChart()` reste utilisé par l'accueil (8 barres, aucun problème) ; `labeledIndices`
  est partagé entre les deux ;
- « Campagnes de la période » en pleine largeur (les noms se coupaient en deux lignes dans une demi-colonne), liens
  les plus cliqués en dessous.

**Composants partagés améliorés au passage** : onglets `.mk-tabs` sur une seule ligne qui défile de côté sur petit
écran (au lieu d'un onglet orphelin sur une 2ᵉ ligne — profite aussi à Campagnes et Modèles) ; chiffres clés
`.mk-stats` deux par ligne sur mobile (six cartes empilées une à une = très long défilement ; profite aussi à
l'accueil).

**Défaut trouvé par un test existant** : la valeur au-dessus des colonnes était à 11,5 px ; le garde-fou
d'accessibilité du projet (« aucun texte de moins de 12 px ») l'a refusé → remonté à 12 px.

**Tests (1812/1812, +9)** : `marketing-modeles-analytics.test.js`, écrit d'abord en rouge. Un premier jet de
`columnChart` affichait 12 libellés au lieu de 10 au plus (libellés mobiles pas inclus dans ceux du grand écran) —
détecté par ce test avant toute capture. Vérifié en vrai navigateur à 1440 et 390 px sur les trois périodes
(7/30/90 jours) : graphique à pleine largeur, aucun chevauchement, aucun débordement, zéro erreur JavaScript.

**La passe visuelle page par page du module marketing est terminée.** Reste (fonctionnel) : action « webhook » dans
les scénarios ; scopes d'API et expiration ; formulaires (champs libres, tags à la soumission, redirection, double
opt-in).

## 39. Formulaires, suite (partie 1) : propriétés comme champs, étiquettes à l'inscription, redirection (2026-09-25)

Backlog §35 « formulaires ». Scindé en deux parties : celle-ci (sans envoi d'e-mail) et le double opt-in (partie 2,
à faire : e-mail de confirmation, lien signé, statut « en attente » — dépend d'un vrai envoi, désactivé en local).

**Aucun système parallèle** : les « champs libres » réutilisent les **Propriétés** déjà définissables sur les
contacts (`audience/properties.js` : types texte, nombre, date, oui/non, choix), et les étiquettes le mécanisme
existant (`tagContact`, création à la volée).

**Migration 018** (`018_formulaires_suite.sql`, colonnes AJOUTÉES seulement, valeurs par défaut = comportement
d'avant) : `mk_forms.property_fields` (JSON de clés), `tags` (JSON de noms), `redirect_url`. Appliquée sur la base
réelle au redémarrage du serveur de dev, après la sauvegarde automatique `AVANT-MIGRATION-…-v018.db`.

**Règles (validées côté serveur, `forms/index.js`)** :
- propriétés : 10 au plus, chacune doit exister ; affichées avec le bon type de champ (date → sélecteur de date,
  choix → liste, oui/non → case) ; champs publics préfixés `prop_` (jamais de collision avec `email`, `consent` ou le
  champ piège `website`) ; toutes facultatives pour le visiteur ; **valeurs vérifiées AVANT toute création** (une
  date impossible ne laisse ni contact ni consentement à moitié enregistrés), message avec le libellé de la
  propriété, saisie conservée ; une propriété supprimée depuis est ignorée (le formulaire continue de marcher) ;
- étiquettes : texte séparé par des virgules, 5 au plus, 64 caractères, dédoublonnées sans tenir compte de la casse,
  posées APRÈS l'enregistrement du consentement ;
- redirection : adresse http(s) complète sans identifiants, ou chemin du site `/…` (jamais `//…`, `/\…`,
  `javascript:`, `data:`…). S'applique au formulaire en page (et au faux succès du champ piège, pour ne rien
  révéler à un robot) ; le **pop-up affiche toujours son message de remerciement** et ne fait jamais quitter la page.
- ancien appelant de `updateForm` sans ces réglages : valeurs actuelles conservées, jamais effacées.

**Pop-up** : `popup.json` décrit les propriétés (type, options) ; `popup.js` rend les mêmes types de champ. Au passage,
ajout d'`escAttr()` : l'`esc()` existant n'échappait pas les guillemets, sans conséquence jusqu'ici (seules des clés
sûres allaient dans des attributs) mais les options de liste saisies par l'équipe y vont désormais.

**Tests (1824/1824, +12)** : `marketing-forms-suite.test.js`, écrit d'abord en rouge (une adresse IP distincte par
inscription de test via l'en-tête du mandataire : la limite de 5 inscriptions/heure/IP reste intacte). Vérifié en
vrai navigateur sur une copie jetable de la base : configuration par l'interface (redirection `javascript:` refusée
avec message clair), inscription en page (arrivée sur `/catalogue`, 4 propriétés et 2 étiquettes enregistrées),
inscription par le pop-up (propriété + étiquettes, visiteur resté sur l'accueil), zéro erreur JavaScript.

## 40. Refonte de l'interface marketing « façon Mailchimp », palette bleue conservée (2026-09-25)

Demande : refonte complète de l'interface de la partie marketing, à l'identique de Mailchimp, en gardant le thème
bleu, sans toucher à rien d'autre. **Reproduit : l'ergonomie et le langage visuel de Mailchimp** (menu latéral
clair, bouton « Créer » unique, surfaces plates à filets fins, onglets soulignés, typographie très hiérarchisée).
**Pas reproduit, volontairement : sa marque** (logo, jaune, polices propriétaires payantes, illustrations) —
contraire à la palette bleue demandée et protégé.

**Périmètre strict** : `public/css/marketing.css` (chargé UNIQUEMENT dans l'espace marketing), la coque
`views/marketing/partials/top.ejs` (bouton « Créer », couleur de barre du navigateur) et un texte descriptif de la
page Composants. `style.css` n'a pas été modifié : le site public, l'espace élève et l'espace formateur sont
intacts. Les composants partagés avec le site (panneaux, tableaux, boutons, champs, badges) sont restylés
**uniquement sous `.mk-body`**. Aucune route, donnée ni fonctionnalité modifiée.

**Ce qui change** :
- jetons propres à l'espace (`--mk-bg`, `--mk-surface`, `--mk-border`, `--mk-border-strong`, `--mk-r-sm` 6 px,
  `--mk-r` 8 px, `--mk-r-lg` 12 px, `--mk-pop`…) — les jetons globaux du site (et leurs tests) restent inchangés ;
- menu latéral blanc à filet droit (au lieu du bleu nuit), entrée active sur fond bleu très clair avec barre
  d'accent ; **bouton « Créer »** en tête : menu des 8 créations (campagne, modèle, scénario, formulaire, contact,
  import, liste, segment), **filtré selon les droits** (un lecteur ne le voit pas), chaque entrée menant à l'écran de
  création existant (page dédiée ou modale ouverte par l'ancre d'URL) ; composant menu déroulant existant réutilisé
  (clavier : flèches, Échap) ; en mode réduit, le menu s'ouvre à droite de l'icône ;
- barre du haut blanche et sobre, fil d'Ariane à barres obliques (masqué sur téléphone, où le grand titre suffit) ;
- cartes, tableaux, filtres, états vides : plats, filet fin, sans ombre ; ombres réservées aux menus et dialogues ;
- onglets soulignés (au lieu de blocs pleins) ; pastilles de statut à point rond ; alertes à filet coloré à gauche ;
- titres de page en police d'affichage, harmonisés même hors `.mk-head` (Nouvelle campagne, Nouveau contact…).

**Bogue corrigé au passage** (existait avant) : en mode menu réduit, le sous-menu de la section ouverte restait
affiché et rogné (« Ca… », « Mo… ») — une règle plus spécifique l'emportait sur celle qui le masquait.

**Vérifié** : galerie de 18 pages × 2 largeurs (1440 et 390 px) avant/après sur une copie jetable de la base, aucun
débordement, aucune erreur JavaScript ; bouton « Créer » à la souris et au clavier (flèche puis Entrée → page
Modèles avec la modale de création ouverte), mode réduit, tiroir mobile. Tests : 1830/1830 (+6,
`marketing-refonte-mailchimp.test.js`), dont les garde-fous existants (contraste, texte ≥ 12 px, focus visible,
ombres douces teintées).

## 41. Clone fonctionnel de Mailchimp — phase 1 : navigation et Campagnes (2026-09-26)

Demande : « 100 % Mailchimp en design, en disposition des textes, en fonctionnalités des éléments », refonte totale,
sans garder les anciens éléments. Reproduit : l'organisation, la disposition et le fonctionnement des écrans de
Mailchimp. Non reproduit (marque protégée) : logo, nom, polices propriétaires, illustrations, textes mot pour mot.
Découpage en phases vérifiées : 1) navigation + Campagnes (ce §) ; 2) Audience ; 3) Automatisations et Modèles ;
4) Analytics/rapports, formulaires, intégrations, paramètres.

**Navigation** (`web/nav.js`) : ordre Mailchimp — Accueil, Campagnes (Toutes les campagnes, Modèles d'e-mails),
Automatisations, Audience (Tous les contacts, Listes, Segments, Étiquettes, Propriétés, **Formulaires
d'inscription**, Importer des contacts), Analytics, Intégrations, **Paramètres** (Réglages d'envoi, Conformité) en
bas. Sections « Capture », « Délivrabilité » et « Conformité » supprimées (leurs pages sont rangées ci-dessus).

**Liste des campagnes** : colonnes Campagne (« E-mail classique · modifié/terminé/programmé le … · modèle »),
Statut, Destinataires (cible + effectifs), Ouvertures (« non suivies » quand le suivi est désactivé, jamais un faux
0 %), Clics, Créée le ; bouton **Modifier** (brouillon) ou **Voir le rapport** (lancée) + menu ⋮ (Dupliquer,
Supprimer quand c'est permis). `openRate` ajouté aux lignes (`sending/list.js`).

**Création** (`campaign-new.ejs`) : l'assistant en 7 étapes est remplacé par une carte unique « Créer un e-mail »
(nom, destinataires, modèle ; suivi des clics activé par défaut), puis la liste de contrôle. Noms de champs et
garanties inchangés (modèle marketing et cible toujours exigés à la création).

**Brouillon = liste de contrôle** (`campaign.ejs`) : en-tête « Terminer plus tard · Envoyer un test · Envoyer » +
menu ⋮ (Renommer, Dupliquer, Supprimer). Six éléments avec état (prêt / à corriger / à vérifier) : Destinataires
(modifiable sur place), Expéditeur (commun à toutes les campagnes → Réglages d'envoi), Objet + texte d'aperçu
(définis dans le modèle → éditeur), Contenu (vignette réelle de l'e-mail + « Modifier le design » + changer de
modèle), Paramètres et suivi (modifiable sur place), Heure d'envoi (choisie dans la fenêtre d'envoi). Chaque ligne
s'ouvre sur place (`<details>`) ; ses formulaires ne modifient que leur réglage (les autres repartent en champs
cachés). Les erreurs du contrôle avant envoi s'affichent dans la ligne concernée ; celles de configuration
(clé de chiffrement, adresse du site…) dans un bloc « À régler avant l'envoi ». Fenêtres : Envoyer un test (équipe
uniquement, « un test a déjà été envoyé » quand c'est le cas), Renommer, **Prêt à envoyer ?** (programmation
facultative, confirmation par le nombre de destinataires + case de consentement : garde-fous inchangés, le serveur
refuse toujours un lancement non prêt). Nouvelle route d'aperçu isolé d'un modèle enregistré
`GET /marketing/modeles/:id/apercu` (même en-têtes de sécurité que l'aperçu de la bibliothèque). Campagne lancée :
page de suivi conservée, titre « Rapport de campagne ».

**Tests (1830/1830)** : `marketing-r4-campagnes-web.test.js` réécrit pour décrire la liste de contrôle au lieu des
7 étapes, **mêmes protections** (test réservé à l'équipe, limite 10/h, confirmation par le nombre, envoi bloqué et
refusé par le serveur en cas d'erreur, saisie conservée, lecteur sans action) ; `marketing-r0-coque.test.js` mis à
jour pour la nouvelle organisation du menu. Le garde-fou « aucune classe orpheline » a signalé deux classes
construites dynamiquement / sans style — corrigé. Vérifié en vrai navigateur (1440 et 390 px, copie jetable).

## Éditeur de scénarios : réglages par boîte de dialogue (2026-10-04)

Le panneau latéral droit de l'éditeur (`#au-panel`) est supprimé : le canevas occupe toute la largeur.

- **Bloc** : clic (sans glisser) → boîte de dialogue « Modifier » ; bouton « ⋯ » → menu Modifier / Dupliquer /
  Supprimer (déclencheur : Modifier seulement ; « Fin » : Dupliquer / Supprimer, aucune fenêtre vide ; scénario actif :
  « Voir les réglages », fenêtre en lecture seule).
- **Fichiers** : `src/editor/automation/ui.js` (champs, boîte de dialogue `.mk-dialog`, menu `.mk-menu`),
  `src/editor/automation/stepEditors.js` (un éditeur par type + `validate()` qui reprend les règles de `steps.js`),
  `src/editor/automation-flow.js` (canevas, menu, persistance). Confirmation : `window.mkConfirm` (shell.js).
- **Brouillon** : la fenêtre modifie une copie des données du nœud ; Annuler / × / Échap / clic sur le fond ne changent
  rien (confirmation si modifié). « Enregistrer » valide, remplace les données du nœud, puis **enregistre aussitôt le
  scénario** (même route `POST /marketing/automatisations/:id`, sans rechargement). Dupliquer et Supprimer aussi. Le
  bouton « Enregistrer » du haut reste pour les déplacements et connexions.
- **Aucun changement de format** (`canvas` / `steps`) ni de migration ; le moteur (`engine.js`) n'est pas touché. Seul
  ajout côté serveur : `tags` (étiquettes existantes) dans les données de l'éditeur.
- Non proposés car absents du moteur : désactivation d'une étape, unité « semaines ».
- `public/js/marketing-automation.js` (ancien éditeur linéaire, plus chargé par aucune page) est retiré du dépôt.

**Vérifié** : suite complète ; parcours navigateur des 12 types d'étape (ouvrir, annuler, modifier, enregistrer, résumé,
base, rechargement, connexions intactes), menu au clavier, validation, dupliquer/supprimer, lecture seule, mobile.

### Palette d'actions latérale (2026-10-04)

La rangée horizontale « + Étape » au-dessus du canevas est remplacée par une palette à gauche
(`src/editor/automation/palette.js`, rendue dans `<aside id="au-palette">`) : en-tête « Actions », recherche (sans
accents, avec synonymes : « attente » → Attendre / Attendre jusqu'à), 5 catégories repliables, mode réduit (icônes +
infobulles, mémorisé dans le navigateur), tiroir sur petit écran (bouton « + Ajouter une étape »). Absente en lecture seule.

- **Ajout** (`addStep` dans `automation-flow.js`) : clic → après l'étape sélectionnée sur le canevas, sinon à la fin du
  parcours principal (avant une éventuelle « Fin ») ; reliée automatiquement (insérée entre l'étape d'avant et sa suite,
  sortie libre d'une condition/d'un tirage), étapes du dessous décalées. Glisser-déposer : sur une étape → insérée
  après elle ; ailleurs → posée sous le pointeur, non reliée. Mêmes appels Drawflow qu'à la main (`addConnection`,
  `removeSingleConnection`), même format `canvas`.
- **Nouvelle étape** : sa fenêtre s'ouvre (« Ajouter l'étape ») ; Annuler la retire et remet connexions et positions ;
  « Fin » (sans réglage) est enregistrée directement. Chaque ajout validé enregistre le scénario (même route).
- Pas d'« Envoyer un SMS » : ce n'est pas une étape du moteur (`steps.js`).
- Corrigés au passage : le fond du canevas n'était pas reconnu par Drawflow (classe `parent-drawflow` pas en première
  position → ni désélection ni déplacement du canevas hors de la zone dessinée) ; « Ajuster à l'écran » et le centrage
  ignoraient l'origine du zoom de Drawflow (centre) → étapes hors cadre dès que le zoom changeait.

### Studio d'automatisation : insérer ≠ configurer (2026-10-04)

- **Registre central** `src/editor/automation/registry.js` : libellé, description, catégorie, icône, valeurs
  d'insertion, titre de configuration, résumé du bloc, « configurée ? » — utilisé par la palette, les blocs et la
  configuration (plus aucune liste dupliquée). Icônes ajoutées à `utils/icons.js` : calendarClock, userPen,
  tagPlus/tagMinus, listPlus/listMinus.
- **Palette = insérer** : un clic ou un glisser-déposer crée l'étape (reliée, enregistrée), AUCUNE fenêtre. Les
  valeurs d'insertion ne choisissent rien à la place de la personne (pas de « premier modèle » imposé) : le bloc
  affiche « Non configuré » (bordure pointillée, pastille). « Ajouter un déclencheur » (palette et ⋯ du déclencheur)
  ouvre la configuration du déclencheur avec une nouvelle ligne.
- **Clic sur un bloc / ⋯ → Configurer = grande interface** (`ui.js#openStepDialog`) : colonne résumé (icône, état
  Configurée / À configurer, résumé en direct) + formulaire par sections. E-mail : destinataire, expéditeur réel
  (réglages d'envoi), modèle + objet, suivi des clics, aperçu réel (`/marketing/modeles/:id/apercu`). Condition /
  tirage : où mènent les deux chemins sur le canevas. Fermeture avec modifications : Continuer / Abandonner /
  Enregistrer. Échec d'enregistrement : fenêtre gardée ouverte, étape remise comme avant, « Réessayer ».
- **Serveur — brouillon incomplet** (`graph.js#incompleteNodes`) : un schéma dont des étapes RELIÉES n'ont pas encore
  leur réglage obligatoire est enregistré (`canvas`, nom, déclencheurs) ; les `steps` exécutées restent celles
  d'avant ; la réponse liste `incomplete` ; `automationPreflight` ajoute l'erreur « étapes à configurer » →
  activation refusée. Une donnée INVALIDE (champ inconnu…) reste refusée en 400. Aucun changement de schéma SQL.
- **Zoom** : contrôle vertical (+ / niveau en % = retour à 100 % / − / ajuster), limites désactivées ; zoom manuel
  20 %–160 %, « Ajuster à l'écran » descend jusqu'à 10 % pour un grand scénario.
- Non proposés (absents du moteur) : Désactiver une étape, Envoyer un SMS, Webhook, « Attendre jusqu'à » une date/heure
  (l'étape existante attend un ÉVÉNEMENT avec un délai maximal).

## Éditeur d'e-mails v3 : canevas réel, médiathèque, enregistrement automatique (2026-10-04)

- **Disposition** (`views/marketing/template-editor.ejs`, `public/js/marketing-editor.js`, CSS `.mk-b-*`) : barre
  d'outils (retour, nom modifiable, état d'enregistrement, annuler/rétablir, prévisualiser, test, Enregistrer, Plus :
  versions/dupliquer/supprimer) · onglets Blocs / Structure / Médias / Styles / Message / Vérification · canevas =
  RENDU RÉEL de l'e-mail · réglages du bloc sélectionné. Mise en page selon la largeur de l'éditeur (requêtes de
  conteneur) : 4 zones, puis réglages en panneau superposé (le canevas lui laisse la place), puis mobile (feuille).
- **Canevas** : `POST /marketing/modeles/apercu` avec `annotate: true` → chaque bloc porte `data-mk-block` ; un bloc
  incomplet est rendu à sa place avec son problème (`blockErrors`) au lieu de faire échouer l'aperçu. Rendu dans une
  iframe `sandbox="allow-same-origin"` (aucun script) que l'éditeur décore : contour, étiquette, mini-barre (monter,
  descendre, modifier, dupliquer, masquer, supprimer), ligne d'insertion. Le rendu d'ENVOI reste strict et non annoté.
- **Glisser-déposer** : bloc de la palette → emplacement exact ; réordonnancement (structure, Alt+flèches) ; fichiers de
  l'ordinateur → médiathèque → bloc Image (ou remplace l'image d'un bloc Image visé ; PDF → bouton de téléchargement).
  Vidéo, SVG, format inconnu : refus expliqué, jamais d'acceptation silencieuse.
- **Médiathèque** (`src/marketing/media/index.js`, migration `024_medias.sql`, routes `/marketing/medias`) : type lu
  dans le fichier (signature), dimensions lues dans l'en-tête, 5 Mo/image, 10 Mo/PDF, stockage `UPLOADS_DIR/marketing/
  <organisation>/`, adresse publique permanente servie avec nosniff. Recherche, filtre, texte alternatif, suppression
  refusée si un modèle l'utilise (le fichier reste sur le disque s'il a servi dans une campagne lancée).
- **Bloc masqué** (`hidden: true`) : enregistré, estompé dans l'éditeur, jamais envoyé.
- **Enregistrement automatique** (2,5 s après la dernière modification, `autosave: true`) : contenu enregistré à chaque
  fois ; l'historique (20 versions) ne garde au plus qu'un instantané toutes les 10 minutes ; l'enregistrement manuel
  crée toujours une version. État affiché : Enregistré / Enregistrement… / Modifications non enregistrées /
  « N blocs à compléter · non enregistré » / Impossible d'enregistrer (+ Réessayer). Conflit de version → 409.
- **Non proposés** (le moteur ne les rend pas) : sections imbriquées, 3–4 colonnes ou colonnes contenant des blocs,
  galerie, image + texte, produit/coupon/bannière, contenu conditionnel autre que « Condition d'affichage » par bloc,
  HTML/code libre (refusé volontairement), réglages responsive distincts par appareil. Fonctionnalités nécessitant une
  implémentation dans le moteur de rendu (`templates/blocks.js`).
