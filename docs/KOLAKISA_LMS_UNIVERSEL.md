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
| Rattachement formation → site | **migration 119, `services/lmsSites.js`** | **NOUVEAU (service + tests)** | pas encore utilisé par les routes |
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

## 4. Livré (état au 2026-10-27)

**Données** : migration `119_cours_par_site.sql` (initialement 112, puis 115 : renumérotée car `main` a pris 112 à 118) (table `mk_course_sites`, vide à la création, aucune donnée existante touchée).
**Service** : `services/lmsSites.js` — `contextFor/attach` (contexte de site `req.lmsSite` déduit du DOMAINE, jamais de la requête : `null` principal, id = site avec module actif, `0` = domaine sans module : tout fermé), `scopeSql`, `belongsTo`, `assignCourse`, `siteChoices`, `purgeOrphans`.
**Routes filtrées par site** : catalogue, accueil LMS, catégories, fiche, plan, PDF, avis (`routes/courses.js`) ; espace étudiant, progression, notes, « terminer », quiz, certificats, « mes cours », favoris de la liste (`routes/learning.js`) ; panier, commande, favoris (`cart.js`, `orders.js`, `favorites.js`) ; catégories de l'en-tête (`middlewares/locals.js`) ; plan du site XML par domaine (`seo/sitemap.js`).
**Domaines** : `siteHost.siteIsolation` sert `/cours`, `/catalogue`, `/categorie`, `/panier`, `/commande`, `/favoris` sur le domaine d'un site **seulement si son module « lms » est actif**. Le retour Stripe revient sur le domaine du site (`siteBase(req)`).
**Administration** : écran de la formation (`/formateur/cours/:id/modifier`) → carte « Site de la formation » (rattachement à un site dont le module est actif, jamais de déplacement silencieux). Activation du module : écran « modules par site » existant (`lms.ready = true`).
**CMS / page builder** : le pont `bridge/catalog.js` (sélecteurs et blocs « formation », e-mails) et la source de requête `courses` des pages respectent `ctx.siteScope` / le site de la page ; l'éditeur de pages d'un site ne propose que les formations de ce site.
**Tests** : `lms-par-site-unitaire.test.js` (13 verts), `lms-par-site.test.js` (10 verts, serveur réel : 2 sites + principal ; mutation vérifiée : retirer le garde casse 3 tests), `modules-par-site.test.js` (14 verts).

## 5. Limites réelles et reste à faire
- **Administration réservée à l'équipe** : créer/modifier des formations passe toujours par `/formateur` (compte créateur de la plateforme). Un administrateur limité à un site ne peut pas encore gérer ses formations lui-même ; il n'y a pas d'écran « Formations » dans l'espace d'un site. Les écrans `/formateur/gestion` (élèves, ventes, analytique) sont ceux du créateur : leurs chiffres ne sont pas filtrés par site.
- **Rôle enseignant par site** : non modélisé (`users.role` reste global).
- **Slug de formation** : reste unique sur toute la plateforme (choix de sécurité : une adresse désigne toujours une seule formation) ; l'unicité par site est possible plus tard.
- **Déplacement d'une formation entre sites** (ou retour au principal) : volontairement non proposé (inscriptions, avis, commandes existants).
- **Autres lecteurs de `courses` non filtrés par site** (outils internes de l'équipe) : audit SEO/garde de publication (`seo/guard.js`, `seo/entities.js`), liens du blog (`services/blog.js`), à-propos, menus (`services/navigation.js`), automatisations (`marketing/web/automations.js`), pont d'événements. Ils servent l'équipe ; aucune donnée n'est exposée à un visiteur ou à un administrateur limité à un site. À traiter si ces outils deviennent accessibles aux administrateurs de site.
- **Vérification publique d'un certificat** (`/certificat/verifier/<code>`) : volontairement globale (code non devinable).
- **Paiement** : Stripe réutilisé tel quel ; non testé ici avec de vraies clés (les tests utilisent des formations gratuites). Remboursements et webhooks inchangés.
- **Blocs CMS dédiés** (carte, programme, barre de progression…) : le bloc « formations du catalogue » existant est filtré par site ; pas de nouveaux blocs créés.
- Test préexistant en échec sur `main`, non lié : `site-espace.test.js` / `controles-contrat.test.js` (« dernière migration = 109 » alors que 110-112 existent).
