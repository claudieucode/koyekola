# Titan XXIII — LMS universel multi-sites (journal, audit, plan de reprise)

Branche : `feat/lms-universel` (issue de `origin/main` 67134ee5). **État : paliers A (audit) et B (socle de données) amorcés ; le moteur n'est PAS encore multi-sites de bout en bout. Rien n'est déployé.**

## 1. Audit (A) — ce qui existe réellement

**Moteur LMS** (SQLite, `src/config/database.js`, Express + EJS). Tables : `users` (globale, rôle `etudiant|formateur`), `courses` (slug **unique globalement**), `sections`, `lessons`, `lesson_attachments`, `lesson_state`, `lesson_notes`, `quizzes/quiz_questions/quiz_options/quiz_attempts`, `enrollments`, `lesson_progress`, `reviews`, `orders/order_items/order_refunds/checkout_sessions`, `coupons`, `offers`, `certificates`, `support_*`, `notifications`, `course_slug_history`. **Aucune n'a de `site_id`.**
Routes : `routes/courses.js` (catalogue, fiche, plan, PDF, avis), `learning.js` (lecteur, progression, quiz, certificats), `instructor.js` (création/édition), `gestion.js` + `services/gestion/*` (élèves, ventes, analytique, ressources), `cart.js`, `orders.js`, `stripeWebhook.js`. ~100 requêtes touchent `courses` (voir `grep "FROM courses|JOIN courses"`).

**CMS / sites** : `mk_sites` (organisation → sites), domaines (`middlewares/siteHost.js`, `services/urls.js`), **registre de modules par site déjà présent** (`marketing/siteModules.js`, table `mk_site_modules`, migration 084) où `lms` est déclaré avec `ready: false` (lot « R7-6.6 » jamais livré), rattachement de contenus à un site par table dédiée (`mk_content_sites`, migration 075, convention : **pas de ligne = site principal**), site principal = lignes à `site_id NULL`, droits par site (`services/cmsAccess.js`, `siteScope`), tests d'isolation (`tests/*-par-site*.test.js`, `isolation-des-sites*.test.js`).

**Blocage actuel du LMS sur les sites** : `siteHost.js` (`MAIN_SITE_ONLY`) renvoie 404 pour `/cours`, `/catalogue`, `/apprendre`, `/panier`, `/commande`… sur le domaine d'un site ; le parcours d'achat reste volontairement sur l'hôte principal (docs R7 lot 6.6).

## 2. Matrice de parité initiale (basée sur l'inventaire des tables et routes ; chaque ligne reste à vérifier à l'exécution)

| Fonction | Où | Statut | Remarque |
|---|---|---|---|
| Formations, sections, leçons, ordre | `instructor.js`, `courses.js` service | COMPLET (site principal) | Pas de site : slug global unique |
| Ressources / pièces jointes / vidéos protégées | `lesson_attachments`, `media.js` | COMPLET (principal) | Accès contrôlé par inscription ; à tester par site |
| Aperçu gratuit / non publié | `is_preview`, `published` | COMPLET (principal) | |
| Inscriptions, accès | `enrollments`, `orders` | COMPLET (principal) | Inscription = (user, cours) : hérite du site par le cours |
| Progression, notes de leçon, reprise | `lesson_progress`, `lesson_state`, `lesson_notes` | COMPLET (principal) | |
| Quiz, tentatives | `quizzes*`, `quiz_attempts` | COMPLET (principal) | |
| Certificats + vérification publique | `certificates`, `learning.js` | COMPLET (principal) | Code de vérification : à scoper |
| Avis | `reviews` | COMPLET (principal) | |
| Tableau de bord enseignant / élèves / ventes / analytique | `gestion.js`, `services/gestion/*` | COMPLET (principal) | Filtrage par site à ajouter partout |
| Paiement | Stripe (`payments.js`, webhook signé) | COMPLET, dépend de clés externes | Pas de 2e moteur ; commandes sans `site_id` |
| Notifications, support | `notifications`, `support_*` | PARTIEL | non scopés |
| Activation du module `lms` pour un site | `siteModules.js` | PARTIEL | déclaré, `ready:false` |
| Rattachement formation → site | **migration 112, `services/lmsSites.js`** | **NOUVEAU (service + tests)** | pas encore utilisé par les routes |
| Catalogue / fiche / espace étudiant **sur le domaine d'un site** | — | ABSENT | `MAIN_SITE_ONLY` les bloque |
| Blocs CMS « catalogue », « fiche », « programme »… | — | ABSENT | à brancher sur le système de widgets existant |
| Rôles enseignant/étudiant **par site** | `users.role` global | ABSENT | à modéliser (voir §3) |
| Tests d'isolation LMS bout en bout | — | ABSENT (unitaire du service seulement) | |

## 3. Décisions d'architecture (B)

1. **Pas de `site_id` dans les tables du LMS** : la table `mk_course_sites(course_id PK, organization_id, site_id)` suit la convention de `mk_content_sites` (migration additive, vide à la création, aucune donnée existante touchée, retour arrière documenté). Tout le reste (sections, leçons, quiz, inscriptions, progression, avis, certificats, lignes de commande) **hérite du site par la formation** → une seule source de vérité, aucun doublon.
2. **Site principal = formation sans ligne** : la production existante continue de fonctionner sans migration de données.
3. **Le site n'est jamais lu depuis la requête** : il vient du domaine résolu (`req.kwSite`) ou de la portée de la personne (`siteScope`). `lmsSites.belongsTo(db, courseId, siteId)` doit garder chaque route recevant un identifiant de formation/leçon/quiz.
4. **Slug de formation** : l'unicité globale doit devenir unique par site (changement d'index → étape dédiée, avec `course_slug_history` conservé).
5. **Identité** : compte global conservé ; inscriptions/progression sont déjà par formation donc par site. **Rôle enseignant par site** : à brancher sur `cmsAccess.siteMemberships` plutôt que sur `users.role`.
6. **Paiement** : réutiliser Stripe/commandes existants ; rattacher le site d'une commande via ses lignes (formation). Le parcours d'achat sur domaine de site demande une décision produit (retour Stripe sur le domaine du site) : **non tranché ici**.
7. `siteModules.MODULES.lms.ready` reste `false` tant que les routes ne sont pas scopées — l'activer avant exposerait un module à moitié isolé.

## 4. Fait dans cette tranche
- `migrations/112_cours_par_site.sql`, `services/lmsSites.js` (`siteOfCourse`, `scopeSql`, `belongsTo`, `assignCourse`, `purgeOrphans`), `tests/lms-par-site-unitaire.test.js` (10 tests verts : organisation cohérente, module obligatoire, aucune fuite A/B/principal, identifiants invalides/injectés → aucune formation, désactivation sans perte).
- Constat : `tests/site-espace.test.js` / `controles-contrat.test.js` épinglent « dernière migration = 109 » alors que 110 et 111 existent déjà sur `main` — échec **préexistant**, non causé par 112.

## 5. Reste à faire (ordre de reprise)
1. Brancher `scopeSql`/`belongsTo` dans `routes/courses.js`, `learning.js`, `instructor.js`, `gestion.js`, `services/gestion/*`, `cart/orders/payments`, `certificates`, `dashboard`, `account` (≈100 requêtes) ; le contexte de site vient d'un middleware serveur unique.
2. Index de slug par site ; rôle enseignant par site.
3. Ouvrir `/cours`, `/catalogue`, `/apprendre` sur le domaine d'un site pour les sites ayant `lms` activé (retirer de `MAIN_SITE_ONLY` sous condition) ; décision sur l'achat.
4. Écran « Formations » dans l'administration d'un site, bouton d'activation (le socle `setEnabled` existe).
5. Blocs CMS (catalogue, fiche, programme, espace étudiant) via le système de widgets.
6. Tests d'isolation HTTP bout en bout (liste du cahier des charges §9), puis `ready: true`.
7. Suite complète `npm test`, build, push, déploiement (voir `DEPLOIEMENT-HOSTINGER.md`).
