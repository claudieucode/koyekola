# Administration multi-sites de « Mon espace » (/formateur)

Un seul moteur (CMS + LMS), un contexte de gestion **par site**. Cette page décrit l'état initial, ce qui a été fait, les contrôles de sécurité, la migration et ses limites.

## 1. État initial (audit)

- Le multi-site existait seulement dans le CMS Marketing (`/marketing/site-web/sites/:id/...`, tables `mk_*`, `siteContext`, `cmsAccess`).
- Le tableau de bord `/formateur/*` ignorait la notion de site : ni sélecteur, ni `site_id` sur les tables du LMS (formations, FAQ, À propos, messages, support, journal). L'isolation n'était que par formateur (`instructor_id`).
- Convention du CMS : **site principal = `site_id NULL`** (aucun identifiant codé en dur). Les 14 `SELECT id FROM mk_organizations ORDER BY id LIMIT 1` supposent une seule organisation (inchangé, voir §6).
- Largeur : `.dash-content { max-width: 1240px; margin: 0 auto }` (`public/css/dashboard.css`) laissait un vide à droite sur grand écran.

## 2. Architecture

| Élément | Fichier | Rôle |
|---|---|---|
| Contexte de site | `src/services/dashSite.js` | `forRequest()` : site demandé (`?site=`, champ `site`, dernier choix en session) **revérifié à chaque requête** par `siteContext.resolve` ; repli sûr sur un site autorisé + message. `guardObject()` : un objet chargé appartient-il au site actif ? `bodySiteMatches()` : formulaires multipart. |
| Branchement | `src/middlewares/locals.js` | pose `req.dashSite`, `res.locals.dash.site`, badges par site, les redirections vers `/formateur` gardent le site. |
| Sélecteur | `views/partials/dash-open.ejs`, `public/js/dash-site.js`, `public/css/dashboard.css` | liste réelle (principal + sites actifs accessibles, nom, domaine), recherche au-delà de 6 sites, clavier (↑ ↓ Échap), protection des modifications non enregistrées, fonctionne sans JavaScript (liens). Absent des pages globales (Marketing, Profil, Sauvegardes). |
| Portée SQL | `src/services/siteScope.js` (`where`, `lit`) | une seule façon d'écrire « les lignes de CE site ». |
| Migration | `src/config/siteColumns.js` | `site_id` (nullable) sur `courses`, `faqs`, `contact_messages`, `support_tickets`, `audit_log` ; table `site_pages_by_site (site_id, slug)`. |

Règle d'identification : un `site_id` envoyé par le navigateur n'est qu'une **demande**. Pour chaque requête : session → site demandé → `siteContext.resolve` (droits sur CE site) → objet vérifié contre ce site → action. Un objet d'un autre site : GET = redirection vers son site s'il est accessible, sinon 404 ; écriture = 409 (jamais appliquée).

## 3. Matrice par onglet

Statuts : COMPLET / PARTIEL / VISUEL SEULEMENT / ABSENT / NON APPLICABLE. « Preuve » = test dans `tests/admin-multisite.test.js` (sauf mention).

| Onglet | Portée | Avant | Après | Preuve |
|---|---|---|---|---|
| Vue d'ensemble | par site | ABSENT | COMPLET (formations, élèves, ventes, activité, à traiter du site) | « vue d'ensemble et Centre de gestion » |
| Mes formations | par site | ABSENT | COMPLET (liste, création, modification, duplication — copie dans le site de l'original —, publication, archivage, suppression) | formations, objets |
| Chapitres | par site (via la formation) | ABSENT | COMPLET (chapitres, leçons, pièces jointes, quiz : garde de site sur chaque chargeur) | chapitres |
| Catégories | par site (texte de `courses.category`) | ABSENT | COMPLET ; la redirection 301 commune d'un renommage n'est créée que pour le site principal | catégories |
| Messages | par site (`contact_messages.site_id`) | ABSENT | COMPLET ; le formulaire public enregistre le site du domaine servi | messages |
| Blog | par site (`mk_content_sites`) | PARTIEL | COMPLET pour la liste, la création (site actif) et l'ouverture d'un article ; l'éditeur et ses API gardent leur contrôle existant | blog |
| Support | par site | ABSENT | COMPLET : ticket rattaché au site de sa formation, sinon du domaine ouvert ; liste, réponse, clôture, priorité par site | support |
| SEO | principal : suite centrale ; site : espace SEO du site | PARTIEL | PARTIEL : un site secondaire ouvre son **espace SEO propre** du CMS (réglages, métadonnées, indexation, sitemap, robots, 404, redirections) ; écritures centrales refusées (409) | SEO |
| Marketing | hors périmètre | — | NON APPLICABLE : aucun fichier de `src/marketing/web` ni `views/marketing` modifié par ce chantier | « marketing » |
| Centre de gestion | par site (sauf Sauvegardes, globale) | ABSENT | COMPLET en lecture par site : ventes, élèves, analytics, ressources, activité/notifications ; codes promo : restent au niveau du compte (liés au formateur) | vue d'ensemble |
| Journal d'activité | par site | ABSENT (global) | COMPLET : chaque entrée porte `site_id` (site actif), filtre par site ; le principal garde l'historique antérieur | journal |
| FAQ | par site (questions générales) | ABSENT | COMPLET dans l'administration ; les questions d'une formation suivent le site de la formation | FAQ |
| Page À propos | par site | ABSENT | COMPLET dans l'administration (table `site_pages_by_site`) | À propos |
| Apparence | thème du tableau de bord = compte ; apparence du site = CMS | VISUEL (pas d'apparence de site) | COMPLET : préférences du compte inchangées + accès direct au personnalisateur du site sélectionné | apparence |
| Profil et paramètres | global (compte) | COMPLET | inchangé, volontairement sans sélecteur | « sélecteur : absent » |

## 4. Layout

`.dash-content` : `max-width: none; margin: 0; min-width: 0` — la zone occupe toute la largeur après la barre latérale ; les largeurs de lecture (`ch`) restent portées par les composants. Le sélecteur de site : liste bornée à la largeur de l'écran (`min(380px, 100vw - 32px)`), cibles 44 px, pleine largeur ≤ 760 px. Aucune couleur écrite en dur dans les ajouts (jetons `--dash-*`).

## 5. Migration et retour arrière

Additive et idempotente (exécutée au démarrage par `database.js`) : colonnes nullables (les lignes existantes restent au site principal), index `idx_<table>_site`, table `site_pages_by_site`. Aucune suppression ni renommage. Pas de clé étrangère déclarée vers `mk_sites` (les bases de test et les services isolés n'ont pas les tables `mk_*` ; l'intégrité est tenue par `siteContext`). Les sites sont supprimés « en douceur » (`deleted_at`) : leurs lignes restent cohérentes.

Retour arrière (après sauvegarde) : `DROP INDEX idx_<table>_site; ALTER TABLE <table> DROP COLUMN site_id;` pour les cinq tables, puis `DROP TABLE site_pages_by_site;`. Le code qui lit `site_id` serait alors à retirer.

## 6. Limites connues

- **Pages publiques** : la FAQ et À propos publiques restent servies par le domaine principal (`MAIN_SITE_ONLY` dans `siteHost.js`) ; l'administration par site est complète, la diffusion sur le domaine d'un site secondaire n'est pas encore branchée.
- **Slugs de formations** : `courses.slug` reste unique sur toute la plateforme (comme `posts.slug`).
- **Codes promo et offres** : au niveau du compte formateur (non rattachés à un site).
- **Médiathèque du blog** (table `media`) : rattachée au site principal dans Ressources ; les médias des sites sont ceux de `mk_media`.
- **Organisation unique** : `SELECT id FROM mk_organizations ORDER BY id LIMIT 1` (14 occurrences) et `syncInstructorMembers` (tout formateur = propriétaire) supposent une seule organisation ; la gestion de plusieurs organisations indépendantes est un chantier à part.
- **Accès limité par site** : `/formateur/*` reste réservé au rôle `formateur` (propriétaire de l'organisation) ; les comptes à accès limité à un site utilisent l'espace du CMS.
- **Deux onglets, deux sites** : le site actif est mémorisé en session ; chaque formulaire soumis par JavaScript porte le site affiché (champ `site`), et toute écriture sur un objet d'un autre site est refusée (409). Sans JavaScript, c'est le dernier site choisi qui s'applique.
- **Sauvegardes, audit des sites** (`/formateur/gestion/sauvegardes*`) : globaux à l'installation, ouverts à tout formateur (voir `docs/audit-centre-gestion.md` §3).

## 7. Tests

`tests/admin-multisite.test.js` : migration, sélecteur (sites réels, indicateur de site actif, repli sur identifiants forgés/inconnus/archivés/injection), accès (anonyme, élève), isolation formations / chapitres / catégories / messages / FAQ / À propos / support / journal / blog / SEO, champ `site` contradictoire, liens profonds, apparence, Marketing inchangé, layout.
