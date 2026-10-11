# KOLAKISA — Palier 0 : audit architectural (lecture seule)

Date : 2026-10-11 · Base auditée : `KOYEKOLA-deploy` (HEAD 7a6f804). Aucun code, schéma ni donnée modifié.
Limites : audit par migrations, schémas et routes, pas par lecture exhaustive du code. Ce qui n'est pas établi est marqué **NON DÉTERMINÉ**.

## 1. Résumé exécutif
- Un début de multi-site existe déjà : `mk_sites`, `site_id` sur de nombreuses tables, `mk_site_members` (rôle par site), routage par domaine (`siteHost.js`, `urls.js`), permissions par site (`cmsAccess.effectivePermissions(user, {siteId})`).
- Il est partiel : le côté marketing/pages/Page Builder est multi-site (organisation unique) ; le LMS et le blog (`users`, `courses`, `orders`, `posts`, `taxonomy_*`, table `media`) sont globaux, sans `site_id` ni `organization_id`.
- Convention actuelle : `site_id NULL` = « site principal » (migrations 061–064).
- Pas de RLS : la base est SQLite (`node:sqlite`), pas Supabase. L'isolation repose sur `organization_id`, `site_id` et les permissions du code.
- Recommandation : ne pas créer un second système de sites ; généraliser `mk_sites`.

## 2–5. Architecture, frontend, backend, base
- Node ≥ 22.12, Express 4, EJS, SQLite (`data/KOYEKOLA.db`), sessions `express-session` + store SQLite, SQL direct (pas d'ORM), esbuild (éditeur d'articles Tiptap, flux d'automatisation). Déploiement Hostinger depuis `main`.
- Chaîne : navigateur → `server.js` (securityHeaders, canonicalHost, attachSite, indexingGuard, normalizePaths, redirections SEO, homeRouting/siteRouting, refreshSessionUser, injectLocals, maintenance) → routes LMS/blog (`src/routes`) ou CMS/marketing (`src/marketing/web`, monté sur `/marketing`) → services → SQLite.
- Éditeur de pages : JavaScript sans framework (`public/js/page-builder.js`, objet `PAGE` injecté, annulation interne).
- 57 migrations `src/marketing/migrations` (série 001–049 sans 043, puis 060–068). Tables LMS/blog/navigation/apparence créées dans `src/config/database.js` (875 lignes), hors migrations.
- Base locale vide (aucune table `mk_*`) : volumes de production **NON DÉTERMINÉS**.

## 6–8. CMS, pages, articles
- Pages : `mk_landing_pages` (`slug` UNIQUE global, `site_id` nullable, `kind` landing/page/step, `draft` JSON, `sections` = version en ligne, `revision`, `seo` JSON, `parent_id`, `header_mode`). Versions : `mk_page_versions`. Public : `GET /p/:slug`.
- Articles : `posts` (`slug` UNIQUE global, aucun `site_id` ni `organization_id`), `post_revisions`, `post_autosaves`, `post_slug_history`, `blog_comments` (générique), `taxonomy_terms/relations` (UNIQUE `(taxonomy, slug)` global). Auteur : **NON DÉTERMINÉ**.
- Menus : `nav_menus/items/locations` (`site_id` nullable). Apparence : `appearance_*` (`site_id`). Composants : `mk_web_components` (`site_id` nullable). Modèles : `mk_page_templates` (sans site).

## 9. Médias
`mk_media` (par organisation, corbeille douce, sans `site_id`) et `media` (ancien blog, sans rien). Usages calculés par recherche textuelle.

## 10–11. Utilisateurs et permissions
`users.role` ∈ etudiant/formateur ; `mk_org_members` (rôle d'équipe, rôles personnalisés `mk_roles`) ; `mk_site_members` (rôle par site, sans `owner`). Un compte peut avoir des rôles différents par site côté CMS. Les routes LMS n'utilisent pas ce système.

## 12–13. Éditeur et Site Web
Éditeur chargé par `GET /marketing/pages/:id/editeur` ; contexte « site courant + page courante » = `PAGE.siteId` + `PAGE.id`. Site Web : `siteWeb.js`, `cmsScreens.js`, `cmsNav.js` ; le domaine d'un site est `mk_sites.settings.seo.publicUrl` (https).

## 14–16. Emailing, SEO, Tunnel
- Emailing : `site_id` sur `mk_lists/segments/templates/campaigns/automations` ; `mk_contacts.origin_site_id` seulement ; formulaires, tags, consentements, suppressions globaux à l'organisation.
- SEO : `seo_settings`/`seo_meta` globaux ; `seo_redirects.site_id` ; `cms_maintenance` par portée `site:N` ; autres tables seo_* **NON DÉTERMINÉ**.
- Tunnel : moteur réel (`mk_funnels.site_id`, `mk_funnel_steps`, pages liées). Conversion : `mk_conversions`, `mk_order_attributions`.

## 17–18. Modules, routage, domaines
Pas de registre de modules ni de capacités (seulement `cmsNav.js`, registre de navigation, et un catalogue de permissions). Domaine → site via `urls.siteForHost` (site actif uniquement) ; `/` = accueil du site, `/<slug>` = page du site, `/p/<slug>` → 301. `slug` global : deux sites ne peuvent pas avoir la même adresse. `/blog`, `/cours`, `/catalogue` ignorent le site.

## 19–21. Templates, publication, sécurité
Brouillon dans `draft`, en ligne dans `sections`, historique `mk_page_versions`, rendu dynamique sans build ni cache de pages. Garde-fous : `need()`, rôles par site, anti-escalade, journal d'audit en lecture seule (déclencheurs).

## 22. À conserver
`mk_sites` + `mk_site_members` + `effectivePermissions` ; `urls.js` + `siteHost.js` ; `mk_landing_pages` + éditeur ; `mk_funnels.site_id` ; colonnes `site_id` de l'emailing ; `cmsNav.js` ; `mk_events.site_id` ; `cms_maintenance`.

## 23. À restructurer
| Élément | Problème | Direction | Risque |
|---|---|---|---|
| `posts` | pas de site, slug global | colonne site nullable puis unicité (site, slug) | Élevé |
| `taxonomy_*` | unicité globale | idem | Moyen |
| `media` / `mk_media` | deux médiathèques, pas de site | fusionner puis rattacher | Élevé |
| `mk_landing_pages.slug` | UNIQUE global | UNIQUE (site, slug) | Élevé |
| `site_id NULL` = principal | convention implicite | site principal explicite | Élevé |
| `seo_settings/meta` | globaux | clé par site | Moyen |
| formulaires/tags/consentements/suppressions | globaux | décision métier d'abord | Moyen–élevé |
| LMS | hors CMS | décision séparée | Élevé |
| organisation unique | `marketing.organizationId` | contexte multi-organisation | Moyen–élevé |

## 24. Manquants
Contexte de site unique (aujourd'hui `req.kwSite` côté public et `siteId` déduit de l'URL côté admin) ; registre de modules/capacités ; types de pages extensibles ; sélecteur de site global **NON DÉTERMINÉ** ; applications futures.

## 25. Risques
CRITIQUE : articles/taxonomies/médias sans site ; slug de page global. ÉLEVÉ : convention `NULL` ; consentements et suppressions globaux ; routes LMS aveugles au site. MOYEN : SEO global, modèles sans site, volumes de production inconnus. FAIBLE : trous de numérotation des migrations.

## 26–27. Cible et plan
Palier 1 lecture de la production · 2 contexte de site unique · 3 articles et taxonomies par site · 4 médias · 5 unicité des adresses · 6 site principal explicite · 7 données marketing (décision contacts) · 8 registre de modules · 9 applications.

## 28–32. Matrices
Voir le rapport présenté en session : dépendances, données, routes, API (`/api/v1` : site **NON DÉTERMINÉ**), permissions (articles et LMS sans isolation par site).

## 33. Diagramme
ACTUEL : domaine → attachSite → site → pages ; marketing par site (nullable) ; blog/LMS globaux.
CIBLE : Master → Site Manager (`mk_sites`) → contexte de site unique → CMS, modules, domaines.
CHEMIN : production → contexte → articles → médias → adresses → site principal → marketing → modules → applications.

## 34. Fichiers importants
`server.js`, `src/config/database.js`, `src/marketing/migrations/*.sql`, `src/middlewares/siteHost.js`, `src/services/urls.js`, `src/services/cmsAccess.js`, `src/marketing/web/index.js`, `siteWeb.js`, `cmsNav.js`, `cmsScreens.js`, `src/marketing/pages/cmsPages.js`, `src/marketing/landing/index.js`, `public/js/page-builder.js`, `src/services/articles.js`, `src/routes/blog.js`, `src/marketing/media/index.js`, `src/seo/store.js`, `src/seo/redirects.js`, `src/marketing/web/funnels.js`.
