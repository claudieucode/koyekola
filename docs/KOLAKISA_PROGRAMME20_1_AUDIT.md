# Programme 20.1 — Audit du CMS existant

Audit du **commit `b27d7c25`** (`origin/main` au 2026-10-29), branche de travail `docs/programme20-1-audit` (worktree isolé, propre : 0 modification). Aucune ligne de code applicatif n'a été modifiée ; seuls des documents sont ajoutés.

## 1. État du dépôt
- Checkout partagé de l'utilisateur : branche `livraison-refonte`, **arbre propre (0 fichier modifié ou non suivi)**, 2 commits d'avance et 158 de retard sur `origin/main`, 41 worktrees, 32 branches distantes (nombreuses sessions parallèles). Il n'a pas été touché.
- Conséquence : tout travail doit partir de `origin/main` à jour et revérifier les numéros de migration (dernier = **114**, 99 fichiers ; numéros 043, 050-059, 076-078 et 092 absents, 092 étant un script manuel `scripts/r9`).
- Documents existants de phases précédentes réutilisés (non refaits) : `KOLAKISA_THEME_BUILDER_*`, `KOLAKISA_WIDGETS_*`, `elementor-reference/`, `KOLAKISA_PALIER12_*` à `17_*`, `KOLAKISA_MULTISITE_DOMAINES.md`, `site-builder-2026-10-18/`.

## 2. Méthode et preuves
Quatre revues de code parallèles (noyau ; widgets/thèmes ; commerce/modules/permissions/données ; logiciels de référence), puis **vérifications croisées par le relecteur** : l'affirmation « `siteBundle` n'existe pas » d'une revue était **fausse** (il existe : `src/services/tools/siteBundle.js`) et a été corrigée ; `listPages` sans filtre de portée (P2) relu et confirmé dans le code (`pages/index.js:259-272`, `web/landing.js:396,473`) ; une source de l'étude de référence rouverte (hiérarchie des modèles WordPress) : conforme. Légende : ✅ opérationnel (preuve lue) · 🟡 partiel · ❌ absent · ❓ non vérifié.

## 3. Tests réellement exécutés (2026-10-29)
60 fichiers de tests non navigateur liés au CMS (pages, composants, thèmes, widgets, apparence, modèles, isolation, domaines, site-menu, site-builder), `node --test --test-concurrency=2`, serveur réel et base temporaire : **856 tests, 851 réussis, 5 échoués, 0 annulé, 0 ignoré** (18 min).
Les **5 échecs** sont des tests devenus obsolètes sur `main` : `site-menu-c1-unitaire` (3) et `site-menu-c1` (2) figent le nombre d'entrées du menu (80, 70+10, 68, SEO = 9) alors que le lot « SEO lot 2 » (autre session, commit `e98b0cfa`) a ajouté 4 entrées (`seo/connexions`, `seo/liens-internes`, `seo/positions`, `seo/transfert`) : 84 au lieu de 80, SEO 13 au lieu de 9. Ce n'est pas une régression de l'application ; **non corrigé ici** (hors périmètre d'un audit, propriété d'un autre chantier). Nombre de fichiers de test du dépôt : 659 entrées ; **non exécutés** : les ≈ 176 tests navigateur, le reste des fichiers (≈ 600), tout test de charge ou de production.

## 4. Problèmes détectés (synthèse ; détails dans les parties A–C)
| # | Gravité | Constat vérifié |
|---|---|---|
| P1 | **Haute** | `mk_landing_pages.slug` UNIQUE global ; noms de pages/composants/modèles uniques par organisation : deux sites ne peuvent pas avoir chacun `/contact` ni « Accueil » ; message d'erreur qui ignore le site (fuite d'existence). Corriger = reconstruction de table (« R6 lot 5 », procédure **manuelle**, état en production **non vérifié**). |
| P2 | Faible/moyenne (à confirmer par test) | `listPages(ctx)` appelé sans filtre de portée dans la liste de liens de l'éditeur : un accès limité à un site peut recevoir nom et slug des pages **publiées** d'autres sites. |
| P3 | Moyenne | Modèles de thème = réglage d'**organisation** (`mk_settings`), pas par site, alors que le reste est multi-sites. |
| P4 | Moyenne | Deux systèmes d'en-tête/pied (composants pour les sites ; `appearance` pour le principal) ; deux stockages du même schéma de styles ; deux tables d'historique de page. |
| P5 | Moyenne | Commerce non isolé par site (`orders`, `offers`, `coupons`, `enrollments` sans `site_id`) ; aucun produit générique ; pas de TVA ; devise EUR fixée. |
| P6 | Moyenne | Aucune permission dédiée « créer un site / gérer thèmes / importer un modèle » (tout passe par `forms.write`). |
| P7 | Faible | Module `lms` activable sans aucun effet (`ready:false`) ; 5 stockages de « morceau réutilisable » ; composants sans historique ; `registerCondition`/`registerTemplateType` jamais appelés hors test ; commentaire périmé dans `services/payment.js` ; `siteCarry` réécrit le HTML rendu par regex. |
| P8 | Faible | Documents obsolètes : 92/86 widgets annoncés (94 réels), « kits de site : absents » (5 packs existent), éditeur « ~6 200 lignes » (8 644), « aucun HTML/CSS libre » (widget HTML assaini et CSS validé existent). |
| P9 | Info | La CI (`tests.yml`) ne bloque pas le déploiement (push `main` → Hostinger). |
**Aucune interface à résultat simulé** trouvée dans le périmètre lu ; les écrans non prêts affichent « Bientôt » sans donnée.

## 5. Limites de l'audit
Lecture statique pour l'essentiel ; aucun test navigateur exécuté ; base de production, hébergeur, DNS, HTTPS et état de la reconstruction R6 **non vérifiés** ; `nodes.js`, rendus `_node.ejs`, inspecteur, `themeRender`, vues EJS, routes du blog et la plupart des 659 tests seulement survolés ; la qualité visuelle des 160 thèmes n'a pas été jugée ; comptes obtenus par `require` en Node.

---
# Détail des revues

## A. Noyau CMS : sites, pages, éditeur, rendu

Base : branche docs/programme20-1-audit, commit b27d7c25. Lecture seule. Légende : ✅ opérationnel (preuve lue dans le code) / 🟡 partiel / ❌ absent / ❓ non vérifié.
Les affirmations sont toutes tirées du code lu ; « non exécuté » signifie que je n'ai lancé ni serveur ni test.

### 1. Cartographie du dépôt

| Élément | Constat | Preuve |
|---|---|---|
| Premier niveau | `server.js`, `src/` (config, editor, marketing, middlewares, routes, seo, services, shared, utils), `views/`, `public/` (js, css, fonts), `scripts/`, `tests/` (659 fichiers dont 176 `*navigateur*`), `docs/`, `node_modules` | ls |
| Point d'entrée | `server.js` (267 l.) : Express, EJS, compression, `express-session` | server.js:1-267 |
| Base | SQLite natif `node:sqlite` (`DatabaseSync`) | src/config/database.js:1-4 |
| Schéma LMS/CMS | `CREATE TABLE IF NOT EXISTS` + `ALTER` conditionnels dans `database.js` (917 l.) : users, courses, posts, site_pages, media, nav_menus/items/locations, appearance_*, cms_revisions... | database.js:11-846 |
| Schéma marketing | 99 migrations SQL numérotées, appliquées dans une transaction avec sauvegarde `VACUUM INTO` préalable et empreinte vérifiée | src/marketing/db/migrate.js:1-60 ; src/marketing/index.js:23 |
| Dernier numéro | **114** (`114_composants_revision.sql`). Numéros absents : 043, 050-059, 076-078, 092 (092 = script manuel hors migrations : `scripts/r9/092_site_maitre_ligne_dediee.down.sql`, `scripts/r9-migrer-site-maitre.js`) | ls migrations |
| Sessions | table `sessions` via `SqliteStore` maison, cookie 30 j, httpOnly, sameSite lax | src/config/sessionStore.js:7-79 ; server.js:141-148 |
| Vues | EJS, `view cache` activé en permanence (compilation unique, vidé à chaud hors production) | server.js:61-65 |
| Montage (ordre) | securityHeaders, canonicalHost, `siteHost.attachSite`, scheduler des pages programmées, indexingGuard, normalizePaths (72-75) -> webhooks bruts -> `express.json` 1 Mo sur `/marketing/pages` puis 100 ko ailleurs (82-83) -> `/api/v1` -> statiques -> SEO redirects -> `siteIsolation`, permalinks, `homeRouting`, `siteRouting`, `movedFallback` (128-132) -> session (141) -> `refreshSessionUser`, `injectLocals`, `sameOriginOnly`, maintenance -> routes LMS/blog/pages -> `/marketing` = `marketingWeb.admin` (188) puis `marketingWeb.publicRoutes` (189) | server.js |
| Routeurs marketing | `createMarketingRouters` : `admin` (barrière d'accès + ~60 sous-routeurs, ex. landing:86, siteWeb:87, siteSpace:89, siteEditor:108) et `publicRoutes` (landingPublic:139...) | src/marketing/web/index.js:20-147 |
| Tables clés du moteur de pages | `mk_sites` (036 + 045 settings, 042 header/footer, 070 slug/corbeille), `mk_landing_pages` (027 + 036/044/047/064/069), `mk_page_versions` (036), `mk_web_components` (036 + 044/067/114), `mk_page_templates` (042 + 093 site_id/shared), `mk_site_members` (049), `mk_site_modules` (084), `mk_site_domains` (113), `mk_content_sites` (075), `cms_themes` (094), `mk_page_tests` (040), `cms_revisions` (database.js:746), `nav_menus` (database.js:776) | migrations |

Écart document/code : `perf-page-builder.md` annonce `page-builder.js` à « ~6 200 lignes » ; il en fait **8 644** (+ ~2 900 l. de modules satellites `page-builder-*.js`).

### 2. Gestion des sites

Contexte : un « site » = ligne `mk_sites`. **Site principal = `site_id NULL`** (convention partout : siteScope.js:5-18). Une ligne dédiée `is_primary=1` n'existe qu'après le script manuel R9-3, et n'est jamais ouvrable comme site ordinaire (primarySite.js:1-26, index.js:70-76).

| Fonction | État | Preuve / remarque |
|---|---|---|
| Création | ✅ | `createSite` : **une seule ligne `mk_sites`** (nom, slug, description, type, design system `DEFAULT_TOKENS` par défaut) + journal d'audit ; pas de page, menu, composant, modèle ni domaine. Un domaine de plateforme n'est ajouté que si `PLATFORM_DOMAIN` est défini (pages/index.js:494-508). Route `POST /site-web/sites` (siteWeb.js:64). Conforme à `site-builder-2026-10-18/01-audit-et-plan.md` §1 ; test `tests/site-builder-vierge.test.js` (non exécuté). Aucun site « à partir d'un modèle » à la création (le choix de pack/modèle est une action séparée) |
| Packs de site (modèle de site) | 🟡 | 5 packs (`formation-en-ligne`, `service-professionnel`, `lancement-produit`, `entreprise`, `evenement`) = pages issues de gabarits + menu + brouillon de styles (pages/sitePacks.js:4-27, importés via Apparence -> Templates, web/templatesLibrary.js). Le doc site-builder (§2) disait « kits de site : ❌ » : **écart, les packs existent** ; pas d'export/import d'un site complet |
| Réglages | ✅ | `updateSite`, `saveSiteDesign` (révision `settings_revision`), page réglages, `reglages.json` (siteWeb.js:113-205 ; pages/index.js:510-585) ; tokens + `siteSettings.js` (298 l.) |
| Archiver / restaurer | ✅ | `archiveSite` met toutes les pages publiées en `unpublished` (index.js:641-650). **Restaurer ne republie rien** (index.js:651-666) |
| Suppression / corbeille | ✅ | suppression logique (`deleted_at`) seulement d'un site archivé, confirmation par saisie du nom, récupération possible (index.js:711-728 ; siteWeb.js:272-296). Aucune suppression physique |
| Duplication | ✅ | `duplicateSite` : réglages + (option) pages copiées en brouillon, nouveaux slugs, en-tête/pied/variantes clonés, accueil remappé ; **ne copie pas** médias, tunnels, articles, menus, formulaires, modèles, domaines (index.js:667-710) |
| Navigation entre sites | ✅ | « Mes sites » (`/site-web/sites`, siteWeb.js:51), « Mes sites » du profil pour accès limité (`/site-web/mes-sites`), espace `/site-web/sites/<id>/<module>` et `/site-web/principal/<module>` (siteSpace.js:114-161) |
| Domaines | 🟡 | registre `mk_site_domains` (verified/pending/disabled, canonique, TXT `_kolakisa-verify`, états DNS/TLS) ; **seuls les domaines `verified` d'un site actif sont servis** (urls.js:73-91 ; siteDomains.js ; web/siteDomains.js). Vérification TXT réelle mais **HTTPS/certificats non provisionnés par l'app** (`tls_status` = contrôle, pas émission) ; wildcard plateforme dépend de `PLATFORM_DOMAIN`. Voir `KOLAKISA_MULTISITE_DOMAINS.md` |
| Utilisateurs / rôles par site | ✅ | `mk_site_members` (rôles admin/editor/author/contributor/viewer ou `mk_roles`), triggers de validation (049:42-58) ; `cmsAccess.effectivePermissions(user,{siteId})` ; écran `web/siteUsers.js` ; invitations par site |
| Modules par site | 🟡 | `mk_site_modules`, registre fermé sms/ai/social/scoring/commerce/lms ; `lms` a `ready:false` ; pas de ligne = désactivé ; principal jamais soumis ; garde `denies()` dans la barrière admin (siteModules.js:12-50 ; web/index.js:52). Ne concerne **pas** pages/éditeur |
| Contexte d'administration par site | ✅ | `siteContext.resolve` recalculé **à chaque requête** (pas d'état global), non révélateur d'existence, gère supprimé/archivé (siteContext.js:25-39). Le site vient de l'**adresse** (`routeScopes.siteOfRequest`) : `req.mk.site/siteId`, `ctx.siteScope` (accès limité) ou `ctx.siteFilter` (équipe) (web/index.js:35-48). `siteScope.where/lit` pour le SQL (siteScope.js) |
| Même moteur, contexte indépendant ? | ✅ avec réserve | Oui : mêmes services/routeurs, site fixé par l'URL ; les écrans « délégués » (`cmsNav.DELEGATED`, ~40 modules : thèmes, polices, widgets, styles, menus, SEO, listes, tunnels, paramètres...) sont servis par réécriture interne de l'URL avec `?site=<id>` imposé (siteSpace.js:170-203). Réserve : (a) `siteCarry.js` réinjecte `site=` en **réécrivant le HTML rendu par regex** (siteCarry.js:1-50), fragile ; (b) les noms de pages/composants sont uniques à l'organisation (voir §6) ; (c) certains réglages restent d'organisation (modèles de thème, §5) |

### 3. Pages et contenus

Modèle (une seule table pour pages de site, atterrissage et étapes de tunnel) : `mk_landing_pages` (027/036/044/047/064/069).

| Colonne | Rôle |
|---|---|
| `organization_id, name (UNIQUE par org), slug (UNIQUE global)` | identité ; **le slug est global à la base, pas par site** |
| `sections` (JSON), `theme` (JSON), `title`, `description`, `seo` (JSON) | **contenu EN LIGNE** |
| `draft` (JSON `{sections,title,description,theme,seo}`) NULL = rien en cours | **brouillon** ; `working = draft || published` (pages/index.js:79-87) |
| `revision` | compteur de concurrence : toute écriture de brouillon/discard/publication l'incrémente |
| `status` draft/published/unpublished, `published_at`, `scheduled_at`, `archived_at` | cycle de vie ; archive = corbeille |
| `kind` landing/page/step, `site_id`, `parent_id` (même site, trigger 071), `form_id`, `tags`, `indexable`, `header_mode/header_component_id` | rattachements |

| Fonction | État | Preuve |
|---|---|---|
| Brouillon / publication | ✅ | `saveDraft` (CAS sur `revision`, erreur `conflict` -> 409) index.js:149-168 ; `publish` : preflight, version dans `mk_page_versions` (sauf contenu identique), transaction, historique borné `MAX_VERSIONS`, ajout auto au menu à la 1re publication (index.js:178-203) |
| Aperçu | 🟡 | `GET /pages/:id/apercu` rend le brouillon, **connexion + `forms.read` requis** (web/landing.js:270-273, 264-269). Aperçu de version/révision (306-322). **Pas de lien d'aperçu partageable par page.** Le « jeton partagé » `?kwshare=` n'existe que pour le **personnalisateur d'apparence** (customizerPreview.js:15-22, locals.js:75) : il fige des réglages de style d'un site, pas un brouillon de page |
| Versions + restauration | ✅ | `mk_page_versions` (versions publiées) + `cms_revisions` (brouillons, avant-restauration) ; restaurer = recopier dans le **brouillon** après sauvegarde de l'état courant (index.js:276-295 ; revisions.js:1-17, 311) ; comparaison élément par élément (`/versions/:n/comparer`, landing.js:255) |
| Permaliens | 🟡 | page : `/p/<slug>` ; sur domaine de site : `/<slug>` ou `/` si accueil (urls.js:139-148). Anciennes adresses -> 301 (`movedFallback`, `cmsPages.redirectSource`). **Slug unique global** (landing/index.js:47-53) : deux sites ne peuvent pas avoir `/contact` chacun |
| Duplication | ✅ | `duplicatePage` (index.js:377-396) : nouvel id de section, nom « (copie) », brouillon non conservé (copie du `working` comme contenu publié mais `status` draft), formulaire refusé si autre site |
| Déplacement entre sites | ✅ | `movePage` avec contrôles composants/formulaires/tunnels/liens parents (index.js:613-640) |
| Corbeille | ✅ | `archivePage` / `restorePage`, gardes tunnel / modèle de thème / test A/B (index.js:398-418) ; vue commune `revisions.trashList` |
| Programmation | ✅ | `scheduled_at`, promotion à la 1re visite après l'heure (pas de tâche de fond) (index.js:215-256 ; server.js:73) |
| Import / export page | ✅ | `kolakisa-page@1`, revalidé comme une saisie (index.js:1081-1100) |
| Articles / blog | ✅, **modèle séparé** | table `posts` (slug global, `page_key` pour la page « À propos ») ; appartenance à un site par `mk_content_sites` (075), pas de colonne `site_id` sur `posts`. Les pages et les articles sont deux familles distinctes ; seuls liens : page « des articles » choisie dans Réglages -> Lecture (`postsPageOf`, siteHost.js:144-148), modèles de thème, widgets `posts/querylist`. `services/sitePages.js` = page « À propos » en HTML (LMS), **sans rapport avec le Page Builder** malgré son nom |
| Cohérence enregistré <-> rendu | ✅ | `normalizeContent` valide **tout** (grammaire fermée) à l'enregistrement du brouillon ET au rendu du canevas ; le rendu publié relit `sections` en base à chaque requête, `Cache-Control: no-store` (landingPublic.js:30-37). Pas de cache de sortie HTML. Les composants « synchronisés » sont résolus au rendu (voir §5) |

### 4. Éditeur visuel

| Aspect | Constat | Preuve |
|---|---|---|
| Quel éditeur | `public/js/page-builder.js`, **8 644 lignes**, vanilla IIFE, + 11 modules satellites (effects, direct, ai, quality, snap, reset, theme, menu, shortcuts, rules ; ≈ 2 900 l.), vue `views/marketing/page-builder.ejs` (301 l.), `public/css/page-builder.css` (2 247 l.). **Un seul éditeur** pour site principal, sites, composants (en-tête/pied) et étapes de tunnel | page-builder.ejs:282-299 |
| Chargement | `GET /pages/:id/editeur` -> `openEditor` : JSON `pb-boot` (contenu, `spec` = `nodes.editorSpec()`, composants, blocs, modèles, formulaires, liens...) ; scripts `defer` | web/landing.js:427-446, 349-410 |
| Structure du document | `sections[]` (30 max) ; 16 types de section (hero, text, image, list, course, button, quote, form, features, faq, cta, video, testimonials, divider, **layout**, component) ; la section **`layout`** contient un **arbre d'éléments** (400 max, profondeur 8) de 94 types (dont 27 « widgets personnalisés » `pages/widgets/*`) : container/columns/column/grid/stack/group, heading, text, image, button, tabs, accordion, posts, querylist, signupform, html... Chaque nœud : `{id,type,props,styles{desktop,tablet,mobile,wide},states,name,hidden,locked,anchor,interactions,audience}` | sections.js:13,44-190 ; nodes.js:17-18,436,1034,1730-1760 |
| Canevas | **iframe** `srcdoc` affichant le **rendu serveur réel** (`POST /pages/:id/rendu` envoie TOUT le document, EJS le rend) ; mise à jour en place section par section (`patchCanvas`), rechargement complet si sections interactives | page-builder.js:5271-5420 ; landing.js:506-519 |
| Glisser-déposer | HTML5 drag natif : sources (palette, blocs, composants), calques, canevas ; règles de placement (`Placement`) ; magnétisme, règles, guides, grille | page-builder.js:491-612, 1137-1160, 1469-1540, 5497 |
| Panneau de propriétés | inspecteur par type (Contenu / Style / Avancé), styles par écran et par état (survol/focus/clic), `NumericControl`, couleurs, fond, bordure, ombre, Style Studio (classes globales du site) | page-builder.js:959-1110, 2765-4480 |
| Arborescence | « Calques » (renommer, masquer, verrouiller, glisser, dupliquer, supprimer, recherche) + mode « Structure » (blocs façon Gutenberg, Ctrl+Maj+E) | page-builder.js:1111, 5971, 8501 |
| Annuler / rétablir | `change()` capture le document JSON complet ; **150 étapes** ; frappes groupées par clé ; historique libellé ; **persiste au rechargement** (`localStorage pb-history-<page>`) | page-builder.js:227-330 |
| Autosave | 1 s après la dernière modification, `PUT .../brouillon` du document complet, une requête à la fois, copie locale `pb-backup-<id>`, nouvel essai 5-25 s, **409 -> blocage + message + copie conservée**, 422 -> élément fautif surligné, `beforeunload` protégé | page-builder.js:8269-8341 |
| Responsive | écrans desktop / tablette / mobile / grand écran (`wide`), héritage descendant, points de rupture réglables **par site** (`siteSettings.breakpointsOf`, défaut 1023/767/1920) ; cadre iframe aux largeurs 1280/820/390/1920 | page-builder.js:6274-6310 ; nodes.js:1924 |
| Raccourcis | Ctrl+S, Z/Y, K (palette de commandes), C/X/V, D, G, Alt+C/V (style), Maj+H/L, zoom, outils V/H/T/I/B, R/Maj+R/G/M | page-builder.js:8505-8554 |
| Clair/sombre | 3 modes (clair/sombre/système) + 3 habillages (classic/custom/navy) de l'**interface** de l'éditeur, jamais le canevas ; stockés en `localStorage` | page-builder.js:6896-6970 |
| Gros documents | limites dures 30 sections / 400 éléments / body JSON 1 Mo (pages) ; chaque modification renvoie **tout** le document au serveur (rendu complet, anti-rebond 30-150 ms adaptatif). Mesures dans `perf-page-builder.md` (chargement 400 él. ≈ 1,7 s sur machine chargée) ; **non remesuré** par moi | page-builder.js:5271-5278 ; perf-page-builder.md |
| Autres | IA (`page-builder-ai.js`), composants globaux (en-tête/pied éditables dans le même éditeur), Création guidée (23 gabarits, 22 patterns), médiathèque, SEO de page, tests A/B, personnalisation par public | page-builder.js:7201-7600 ; web/landing.js |

**Réutilisable tel quel par un futur Site Builder** : ✅ tout le document (grammaire `nodes.js`/`sections.js`), l'éditeur, le rendu EJS, composants, patterns, gabarits, packs. 🟡 à adapter : l'éditeur d'une **page** à la fois (pas d'éditeur multi-pages / de site), l'envoi du document entier à chaque frappe (coût en gros documents), l'autosave du composant limité à 100 ko (§6).

### 5. Moteur de rendu

| Aspect | Constat | Preuve |
|---|---|---|
| Fonctions de rendu | `landing.viewModel(ctx, page)` (résout les données dynamiques, formations, attributs de mouvement, sommaire, CSS `pageCss`, polices) puis EJS `marketing-public/landing.ejs` -> `_sections.ejs` -> `_node-safe.ejs` -> `_node.ejs` | landing/index.js:389-421 ; views/marketing-public/*.ejs |
| Cache de sortie | ❌ aucun (réponse `no-store`) ; seul le cache des gabarits EJS et celui des domaines (`urls.loadSites`) | landingPublic.js:31 ; server.js:64 |
| Registre des types | sections : `sections.TYPES` (16) ; éléments : `nodes.NODE_TYPES` (94) + `CUSTOM_WIDGETS`/`registerWidget` ; propriétés de style : `STYLE_PROPS` ; sources dynamiques `{{post.title}}` : `dynamic.registerDynamicSource` ; modèles de thème : `registerTemplateType` | sections.js:44 ; nodes.js:436,1034,116 ; dynamic.js:17 ; themeTemplates.js:23 |
| Public = aperçu = canevas ? | ✅ **même gabarit** `marketing-public/landing` et même `viewModel` : public (`landingPublic.js:52-61`), aperçu (`landing.js:264-269`), canevas (`landing.js:506-519`, `builder:true`). Différences voulues : `preview` (liens non comptés, barre « Aperçu »), `builder` (identifiants de sélection, sections masquées visibles) ; seul le public applique en plus le filtrage par audience/visiteur, l'A/B, les événements et le consentement. Les trois appellent `withSiteParts` + `resolveSections` |
| En-tête / pied | **site** : composants `header_component_id`/`footer_component_id` de `mk_sites`, insérés comme 1re/dernière section (`withSiteParts`), exception par page (`header_mode` none/variant) (index.js:939-953). Menu auto `autoNav`. **Site principal : mécanisme différent** (`appearance.parts`, tables `appearance_configs`) : deux systèmes d'en-tête/pied coexistent | landing/index.js:421 ; customizerPreview.js:28-38 |
| Composants globaux `mk_web_components` | section JSON nommée ; `kind` standard/global, `site_id` NULL = partagé ; une instance `{type:"component",componentId}` est **résolue au rendu** (donc synchronisée), composant supprimé = section ignorée en silence ; brouillon de composant + « Mettre à jour » (067/114) | index.js:1102-1112, 737-930 |
| Données dynamiques | étiquettes `{{...}}` résolues au rendu (jamais de HTML, revalidées), éléments `posts`, `querylist`, `courselist`, `account`, `cart`... | dynamic.js:1-12 ; landing/index.js:385-420 |
| Modèles de thème (Theme Builder) | 8 familles (article, liste blog, auteur, formation, catégorie, étiquette, recherche, 404, static_page) ; affectations dans `mk_settings` clé `theme.templates` = **réglage d'organisation, pas de site** ; rendu via `themeRender.renderRegion` (blog et 404 du principal) | themeTemplates.js:1-22 ; server.js:190-196 |
| Thèmes | bibliothèque de **160 thèmes** (`themes/library`, `TARGET_TOTAL=160`, `manifests().length=160`) ; activer = écrire les `tokens` du site (`pages.saveSiteDesign`) ou publier l'apparence du principal | services/themes.js:1-12 |
| Sécurité du rendu | grammaire fermée, aucune valeur libre ; exceptions contrôlées : widget `html` assaini (permission `pages.code`), CSS de page `normalizePageCss` | nodes.js:688,1405 ; index.js:29-40 |

### 6. Problèmes vérifiés

| # | Problème | Gravité | Preuve |
|---|---|---|---|
| P1 | **Nom de page unique par organisation, et slug unique global** : un 2e site ne peut ni nommer sa page « Accueil » ni utiliser `/contact` si un autre site les a déjà (suffixe `-2`, ou erreur « Une page porte déjà ce nom »). Bloquant pour des sites indépendants créés à partir d'un même modèle ; la même contrainte vaut pour les composants (`UNIQUE(organization_id,name)`) | Haute | 027:7-8 ; landing/index.js:58-66,47-53 ; 036:56 ; pages/index.js:762 |
| P2 | **Fuite inter-sites probable dans l'éditeur** : `openEditor` construit la liste de liens avec `pages.listPages(ctx)` sans `siteId`, et `listPages` n'applique pas `ctx.siteScope` ; un accès limité à un site recevrait donc nom + slug des pages publiées des autres sites. Même appel à landing.js:473. **Code lu, non exécuté : à confirmer par test** | Moyenne | web/landing.js:396,473 ; pages/index.js:259-274 |
| P3 | Même fuite d'existence par message : l'erreur « Une page porte déjà ce nom » ignore le site | Faible | landing/index.js:64-65 |
| P4 | Sauvegarde du **brouillon de composant** (`PUT /site-web/composants/:id/brouillon`) soumise à la limite JSON par défaut de 100 ko, alors que les pages ont 1 Mo | Faible | server.js:82-83 ; web/landing.js:490 |
| P5 | `restoreSite` détecte les domaines repris par un autre site via l'ancien réglage `seo.publicUrl`, pas via le registre `mk_site_domains` : logique héritée, non alignée | Faible | pages/index.js:651-666 ; siteDomains.js:135 (miroir) |
| P6 | En-tête `siteHost.js` (l.2) et plusieurs docs disent « domaines enregistrés dans les réglages SEO » : faux depuis la migration 113 (registre) | Doc | siteHost.js:1-3 ; urls.js:79-91 |
| P7 | Code/texte périmé : `SOON_TEXT` (siteSpace.js:105-112) décrit des modules désormais délégués ; il ne reste qu'**une** entrée `kind:"soon"` (« Modèles et blocs », cmsNav.js:203) | Faible | cmsNav.js:203 |
| P8 | Deux mécanismes d'en-tête/pied (site principal = `appearance`, autres sites = composants) et deux tables d'historique de page (`mk_page_versions` + `cms_revisions`) : coût de maintenance et risque d'écart de comportement | Moyenne | customizerPreview.js:28 ; index.js:939 ; revisions.js:1-6 |
| P9 | `siteCarry` modifie le HTML rendu par expressions régulières pour conserver le site | Moyenne (fragilité) | siteCarry.js:1-50 |
| P10 | Doc périmés : `perf-page-builder.md` (« ~6 200 lignes » vs 8 644) ; `site-builder-2026-10-18` (« kits de site absents » vs 5 packs) ; `editeur-pages-audit.md` dit « aucun HTML/CSS libre » alors que le widget `html` assaini et le CSS de page existent (cadrés par permission/validation) | Doc | voir §1, §2, §5 |
| P11 | Aperçu d'une page non partageable (connexion obligatoire), alors que le brief mentionne un « jeton partagé » : ce jeton n'existe que pour le personnalisateur | Fonctionnel | customizerPreview.js:15-22 |
| P12 | Interfaces « simulées » : **aucune interface à résultat simulé trouvée** dans le périmètre lu ; les écrans non prêts affichent « Bientôt » sans donnée (siteSpace.js:128-132, comportement honnête). Domaines : états DNS/HTTPS = contrôles réels mais pas d'émission de certificat | - | - |

### 7. Limites de cet audit

- Rien exécuté (ni serveur, ni tests, ni bench) : les affirmations de fonctionnement viennent de la lecture du code ; les rapports de tests des docs ne sont pas revérifiés (❓).
- Lu en détail : server.js, siteHost.js, siteContext/siteScope/primarySite/siteEditor/sitePages (services), pages/index.js (≈ 80 %), landing/index.js (partiel), web/landing.js, landingPublic.js, siteSpace.js, siteWeb.js (routes), cmsNav.js (extraits), migrations 027/036/042/044/045/047/049/064/067/069/070/071/075/084/093/094/113/114, extraits de nodes.js/sections.js, en-têtes et zones clés de page-builder.js (sauvegarde, historique, raccourcis, canevas).
- Non lus ou seulement survolés : 90 % du corps de `nodes.js` (2 115 l.) et des 94 rendus `_node.ejs`, inspecteur et contrôles de style (l. 2765-4480), IA, médiathèque, `siteDomains.js` (vérification DNS détaillée), `urls.js` (résolution complète), `themeRender.js` et le branchement réel des modèles de thème dans le blog, `templatesLibrary`/`patternsLibrary`, tunnels, A/B, appearance/customizer, `siteSeo`, `routeScopes.js` (table des règles), cmsAccess (calcul fin des permissions), styles CSS, les 659 tests.
- Non vérifié : comportement navigateur réel (drag-and-drop, iframe, mobile/tactile), performances mesurées, multi-sites en production, DNS/HTTPS réels, P2 (fuite) non confirmée par exécution.


## B. Widgets, thèmes, Theme Builder, templates

Commit audité : b27d7c25 (branche docs/programme20-1-audit). Méthode : documents lus comme point de départ, puis vérifiés dans le code (lecture + chargement de modules en Node pour compter les registres ; aucun serveur, aucun test lancé, aucun code modifié).
Légende : ✅ opérationnel (preuve code) / 🟡 partiel / ❌ absent / ❓ non vérifié.

### 0. Constat de structure (à retenir)

Il y a DEUX modèles de contenu et QUATRE sens du mot « widget/template » :

| Terme | Ce que c'est réellement | Où |
|---|---|---|
| Widget du Page Builder | élément d'un arbre de nœuds (94 types) | `src/marketing/pages/nodes.js` (`WIDGETS`, `NODE_TYPES`), `pages/widgets/*.js` (27 widgets déclaratifs) |
| Section « legacy » | 16 types de sections plates (hero, features, faq, cta…) | `src/marketing/pages/sections.js:TYPES` |
| Widgets de site (zones) | 18 blocs dans 3 zones (sidebar, footer-1, footer-2) du site public/blog | `src/marketing/widgets/catalog.js`, `src/services/widgets.js` (table `cms_widget_layouts`), écran `web/widgets.js` |
| « Templates » | (a) modèles de thème = affectation page → famille (`pages/themeTemplates.js`) ; (b) bibliothèque de packs/gabarits/« Mes modèles » (`services/templateLibrary.js`) ; (c) modèles d'e-mails (`web/templates.js`, `marketing/templates/`) | trois systèmes sans lien entre eux, dont deux écrans portent le nom « Templates » dans Apparence |

### 1. Widgets

#### 1.1 Registre
| Point | Constat | Preuve |
|---|---|---|
| Registre Page Builder | ✅ 94 types : 67 intégrés + 27 déclaratifs (un fichier = un widget, gabarit EJS obligatoire, vérifié au démarrage) | `nodes.js` (WIDGETS = 94, mesuré par `require`) ; `pages/widgets/index.js:check/load` ; `views/marketing-public/widgets/` = 27 .ejs |
| Catégories | 8 : structure 8, texte 11, média 10, interaction 15, marketing 35, avancé 2, dynamique 10, formations/commerce 3 (+ groupes d'affichage layout/basic/general/form/site/commerce/social/advanced) | `nodes.js:CATEGORIES`, `WIDGET_GROUPS` |
| Description d'un widget déclaratif | champs typés (text, textarea, number, select, bool, link, image, icon, color, items), version + `migrate[n]`, `validate`, `complete` (contrôle de publication), `status` (operational/partial/dependency), `dependencies` | `pages/widgets/index.js:7-40` |
| Styles | responsive desktop/wide(1920)/tablet(1023)/mobile(767) ; états hover/focus/active ; `STYLE_PROPS` ≈ 110 propriétés ; classes globales ; mouvement, masques, défilement/souris ; visibilité par public/planning | `nodes.js` (`BREAKPOINTS`, `STATES`, `STYLE_PROPS`, `MOTION`, `SCROLL_FX`, `AUDIENCES`) |
| Contenu dynamique | sources, filtres, conditions extensibles, boucles (`querylist`) | `nodes.js:dynamic`, `registerCondition` (nodes.js:1313), `pages/dynamic.js`, `pages/query.js` |
| Rendu public | ✅ un seul rendu serveur par EJS, partagé aperçu/public | `views/marketing-public/_node.ejs`, `_node-safe.ejs`, `_sections.ejs` ; `src/marketing/landing/` |
| Éditeur | ✅ `public/js/page-builder.js` (8 644 lignes) + 10 modules `page-builder-*.js` | `public/js/` |
| Tests | ✅ ~35 fichiers `tests/widgets-*`, `editeur-widgets*`, `site-widgets*`, `apparence-widgets*` (contrat, parties, imbriqués, navigateur) | `tests/widgets-contrat.test.js` etc. (non exécutés ici) |

#### 1.2 Widgets les plus importants (vérifiés présents)
Structure : container, grid, columns, stack, group, tabs, accordion, toggle. Texte/média : heading, text, image, gallery, video, audio, button, icon, html (assaini : `sanitizeHtmlBlock`), embed. Marketing : signupform, pricing, countdown, testimonial(+carousel), cta, flipbox, beforeafter, marquee, lottie. Dynamique : posts, querylist, postcontent, postmeta, postterms, postnav, authorbox, archiveinfo, postcomments, dyntext. Site : menu, cmsmenu, breadcrumb, search, account, sitelogo, sitetitle, sitemap, copyright. Formations/commerce : course, courselist, courserating, addtocart, cart, minicart. Tous les nœuds ont des « parties stylables » pour une cinquantaine d'entre eux (doc INVENTORY : 50 ; non recompté).

#### 1.3 Écarts vs Elementor
| Sujet | État | Preuve |
|---|---|---|
| Inventaire de parité | 🟡 110 lignes ; 53 présentes, 26 « absent → ajouté », 7 non faites/exclues volontairement (Facebook commentaires, Stripe/PayPal, shortcode, SVG, conditions propres aux modèles d'article, écrans supplémentaires portable/paysage) | `docs/KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.md` (généré par script) |
| Onglets/accordéons imbriqués | 🟡 `tabs`/`accordion` = texte ; l'accordéon à volets libres existe comme mode de conteneur (EL-F006) | `docs/KOLAKISA_THEME_BUILDER_LIMITATIONS.md` L3 ; non revérifié dans le rendu |
| Popup/formulaire de connexion/panier comme modèles | ❌ pas de moteur de modèle pour ces écrans | THEME_BUILDER_INVENTORY §1.4 |
| Widgets Pro absents ou non retrouvés dans le registre | ❓ non cherchés un à un (formulaire multi-étapes, slider « Slides » = `slides` présent, code highlight = `code`, etc.) ; la comparaison exhaustive n'a pas été refaite |
| Zones de widgets du site (sidebar, 2 pieds) | 🟡 18 blocs seulement, 3 zones fixes, pas de visibilité conditionnelle ; la zone `footer-1/2` est rendue par `views/partials/footer.ejs` et `landing.ejs`, `sidebar` par `views/blog/{index,show}.ejs` | `marketing/widgets/catalog.js:11-19`, `middlewares/locals.js:78` |

Écart document ↔ code : `KOLAKISA_WIDGETS_INVENTORY.md` annonce 92 types (Marketing 33, 25 personnalisés) ; `WIDGETS-INVENTAIRE.md` annonce 86 types / 83 descriptions ; le code charge **94** (Marketing 35, 27 personnalisés). Les chiffres des documents sont périmés (de 2 à 8 widgets).

### 2. Thèmes, styles, identité

#### 2.1 Structure d'un thème
| Point | Constat | Preuve |
|---|---|---|
| Format | ✅ paquet de DONNÉES JSON : `key, name, version (semver), author, description, api (=1), tokens`. Tout champ inconnu est refusé ; jetons revalidés en mode strict ; 64 Ko max ; « kolakisa » réservé | `marketing/themes/catalog.js:11-47` |
| Bibliothèque | ✅ **160 thèmes** (cible 160, 21 catégories, `problems()` vide) ; fiches `themes/library/specs/*.js` (23 fichiers) → manifestes + site de démonstration (pages composées d'éléments natifs via `compose.js`) + visuels SVG générés (`art.js`, route `/themes-art/<thème>/<slot>.svg`) | `themes/library/index.js`, mesuré par `require` ; `web/themeArtPublic.js` |
| Catalogue | 160 = bibliothèque ; 5 thèmes « historiques » (ocean, ardoise, savane, foret, editorial) sont remplacés par leurs fiches de même clé si présentes | `catalog.js:62-66` |
| Pas de code | ✅ aucun PHP/JS/CSS libre dans un thème ; « fichiers de thème » = vues JSON virtuelles (theme.json, tokens/*.json, CSS compilé en lecture seule), liste fermée de chemins, 50 révisions | `services/themeFiles.js:1-30`, `web/themes.js:198-232` |
| Activation | ✅ par site : site Page Builder → `pages.saveSiteDesign` (`mk_sites.tokens`) ; site principal → `appearance.setDraft+publish` (`appearance_configs`) ; vérifié après écriture, retour arrière possible (`revert`) ; table `cms_themes` par site | `services/themes.js:1-8,141+`, migration 094 |
| Ce qu'un thème NE contient PAS | ❌ ni en-tête/pied de page, ni modèles (single/archive…), ni CSS, ni réglages de site (logo, mode sombre) : seulement les jetons. Les en-têtes/pieds/pages ne viennent que de l'option « pages de démonstration » (brouillons) | `themes.installDemo` (themes.js:286), `catalog.js:KNOWN` |
| Import de paquet | ✅ `installPackage` (JSON collé/fichier), validation stricte ; sommes de contrôle `checksumOf` | `web/themes.js:82-105`, `catalog.parsePackage` |

#### 2.2 Tokens de design (un seul schéma)
`pages/tokens.js` : `colors` (10 : primary, secondary, accent, background, surface, text, muted, success, warning, error) + `customColors` (jusqu'à 30), `fonts` (rôles heading/body/button/link), `type` (h1–h6, body, caption, button : taille, graisse, interligne, espacement, transformation, style, couleur), `typeExtra`, `link`, `list`, `buttons`, `images`, `forms`, `space` (xs→xxl : 4/8/16/32/56/96), `radius`, `shadow`, `border`, `sizes`. Référence de couleur `token:<clé>` → variables `--kw-*`. ✅
- Stockage JSON : sites Page Builder `mk_sites.tokens` ; site principal `appearance_configs` (même schéma, `services/appearance.js:1-12`). 🟡 **deux stockages** pour un seul schéma.
- Réglages hors design system : `mk_sites.settings` (`pages/siteSettings.js` : identité description/logo/logo mobile/favicon, arrière-plan, mise en page + breakpoints, visionneuse, transitions de page, responsive tablette/mobile, `dark`, CSS personnalisé, SEO, lecture, commentaires).
- Priorité CSS documentée et codée : jetons globaux → styles du thème (`themeCss.js`, sélecteurs `:where()`) → classes/styles de l'élément `.kw-n-<id>` → CSS du site → CSS de la page (`pages/themeCss.js:1-10`, `services/appearance.js:7-9`). ✅

#### 2.3 Personnalisateur, polices, clair/sombre, variantes
| Sujet | État | Preuve |
|---|---|---|
| Personnalisateur | ✅ 107 réglages dans un catalogue fermé (`add(...)`), 15 panneaux (identité, couleurs, typographie, mise en page, arrière-plan, images, formulaires, appareils, mode sombre, palette, en-tête, menus, pied, boutons, CSS) ; brouillon par site (`cms_customizer_drafts`, verrou optimiste), versions (40), planification, partage par lien, restauration. Ce n'est pas un 2e moteur : écrit dans les moteurs existants | `services/customizer.js:1-60`, `web/customizer.js` (routes l.74-177) ; `web/styles.js` = même service |
| Polices | ✅ 1 775 familles Google Fonts auto-hébergées (manifeste) + téléversement WOFF2/WOFF/TTF/OTF (format lu dans les octets), rattachées PAR SITE ; Font Manager | `services/siteFonts.js:1-15`, `utils/fontLibrary.js`, `web/fonts.js`, `public/js/font-manager.js` |
| Mode sombre | 🟡 sites Page Builder : `dark.mode` off/auto (suit `prefers-color-scheme`) + 5 couleurs ; **site principal : absent** ; pas de logo sombre | `siteSettings.js:26,153-155` ; `customizer.js:216-226` |
| Variantes de thème / palettes | 🟡 palettes de départ (`services/stylePalettes.js`), styles prédéfinis (`pages/stylePresets.js`), 12 « styles » de thème en bibliothèque ; pas de notion de variante de thème (couleur/typo alternatives d'un même thème) | `themes/library/index.js:STYLES` |
| Identité graphique GLOBALE par site | ✅ **oui, existe** : jetons + réglages + polices + logos + favicon + palette nommée, tous portés par `site_id` (sameScope) et édités via Personnaliser/Styles ; + thème actif par site (`cms_themes`) | `services/customizer.js`, `siteScope.js` |
| Charte « kit de marque » dédiée (logo+palette+voix exportable) | ❌ pas d'objet « brand kit » distinct ; ❓ `web/kit.js` n'a pas été ouvert (nom ambigu) |

### 3. Theme Builder

#### 3.1 Ce qui EXISTE (✅ sauf mention)
| Capacité | Preuve |
|---|---|
| En-tête et pied de page globaux par site (Page Builder) : un composant par rôle, `mk_sites.header_component_id/footer_component_id` ; rendu autour des sections de chaque page | `pages/index.js:931-975` (`siteParts`, `withSiteParts`, `setSiteParts`), migration 044 |
| Variantes d'en-tête par page : modes `inherit/none/variant` | `pages/index.js:977-997` (`HEADER_MODES`, `setPageHeader`, `createHeaderVariant`) |
| Composants réutilisables `standard` (copie) ou `global` (instances liées), portée un site ou tous, table `mk_web_components` | migrations 036, 067, 114 ; `pages/index.js:729+` |
| Brouillon / aperçu privé / « Mettre à jour » (révision, 409 sur conflit) : au niveau du COMPOSANT (`draft`, `version`, `revision`) ; aperçu d'un brouillon d'en-tête via `draftId` et `previewParts` (AsyncLocalStorage, requête seule) | `pages/index.js:801-830`, `services/previewParts.js`, migration 067/114 |
| En-tête/pied « structurés » du site public principal (logo, annonce, CTA, colonnes…) : brouillon → publication, 30 révisions, restauration | `services/appearance.js` ; `web/appearanceEditor.js:95-160` |
| Modèles de thème (voir 3.3) | `pages/themeTemplates.js` |
| Éditeur du site : navigateur de pages, parties globales, aperçu par appareil, publication, autour du vrai Page Builder (`?cadre=1`) | `web/siteEditor.js`, `services/siteEditor.js` |
| Zones de widgets de site (sidebar, 2 pieds) | §1.3 |

#### 3.2 Ce qui N'EXISTE PAS
| Absent | Détail |
|---|---|
| ❌ Modèle « page individuelle » commun | aucun gabarit « contenu de la page » ; seule `/a-propos` couverte (`static_page`) — THEME_BUILDER_LIMITATIONS L4 |
| ❌ Modèle produit, panier, connexion, popup, recherche GLOBALE, archive de types de contenu personnalisés | pas de types de contenu personnalisés ; `search_results` ne couvre que le blog (`blog.js`) |
| ❌ Conditions d'affichage avec EXCLUSION | seules des inclusions (catégorie, étiquette, article précis, public) ; pas de « sauf », pas de combinaison ET/OU, pas de condition par page/URL/rôle/date pour un modèle ; 30 affectations max |
| ❌ Modèles propres à UN site | `theme.templates` est un réglage d'ORGANISATION (`mk_settings`, `ctx.organizationId`), pas par `site_id` (`themeTemplates.js:6,31-36`). Les familles ciblées sont celles du blog/cours/404 du site principal ; les sites Page Builder n'ont pas de modèle d'archive/single |
| ❌ Historique des composants | compteur de version seulement (LIMITATIONS L6) |
| ❌ Brouillon + publication pour l'en-tête/pied du site entier en une seule opération (c'est par composant) | 🟡 à confirmer fonctionnellement |
| 🟡 En-tête/pied du site public (blog) hors Page Builder | réglé par champs, pas avec les widgets du catalogue (LIMITATIONS L5) |

#### 3.3 Notion de « modèle avec conditions » : OUI (✅), un seul endroit
`pages/themeTemplates.js` : 9 familles (`single_post, blog_archive, category_archive, tag_archive, author_archive, search_results, static_page, single_course, not_found`) ; chaque affectation = {id, type, pageId, category?, tag?, postId?, audience?}. Résolution `pick()` par score déterministe (article précis 8 > catégorie 4(+0,5 si principale) > étiquette 2 > public 1 ; égalité = ordre d'affectation) ; `explain()` donne la raison d'application/rejet (même règle) ; repli sur l'affichage d'origine si aucun modèle EN LIGNE ; une page-modèle ne peut pas être archivée sans détachement (`guardPageRemoval`, appelé `pages/index.js:402`) ; extension `registerTemplateType`. Branché dans `routes/blog.js:208,381`, `routes/courses.js:248`, `routes/pages.js:47`, `server.js:194` via `web/themeRender.js:renderRegion`. Écrans : `web/appearanceEditor.js:164` (Apparence › Templates) ET `web/siteWeb.js:73-104` (« Modèles de thème »).

### 4. Templates et bibliothèque

| Élément | État | Format / preuve |
|---|---|---|
| Thèmes complets | ✅ 160, voir §2 | JSON `tokens` |
| Packs de site | ✅ 5 packs (formation-en-ligne, service-professionnel, lancement-produit, entreprise, evenement) = palette + 2 polices + pages issues de gabarits + menu ; importer = pages en BROUILLON + menu (nom libre) + brouillon de styles ; une transaction, jeton d'idempotence (`cms_template_imports`), rien d'existant remplacé | `pages/sitePacks.js`, `services/templateLibrary.js:1-12,85` |
| Gabarits de pages | ✅ ≈ 20 gabarits intégrés (lead, vente, webinaire…) en sections natives, textes d'invite sans faux chiffres | `pages/templates.js` |
| « Mes modèles » (`savePageTemplate`) | ✅ table `mk_page_templates` (migrations 042, 093), privé à un site (`site_id`) ou partagé (`shared=1`, organisation) ; contenu revalidé par `normalizeContent`, composants résolus ; même nom remplacé dans le même site seulement | `pages/index.js:1051-1075`, route `web/siteWeb.js:401` |
| Patterns | ✅ intégrés (`pages/patterns.js`) + compositions d'un site (`appearance_patterns`, corbeille) ; insertion = sections natives avec nouveaux ids ; ≤ 12 sections | `services/patternLibrary.js`, `web/patternsLibrary.js` |
| Blocs réutilisables | ✅ `services/reusableBlocks.js` (194 l.) ❓ non lu en détail ; recoupe composants et patterns (voir §6) |
| Export/import de PAGE | ✅ format `kolakisa-page@1` ; import = NOUVELLE page, contenu revalidé comme une saisie | `pages/index.js:1080-1100` |
| Export/import de SITE | 🟡 outil global d'export `kolakisa-site@1` (JSON, asynchrone, contrôle de fuite de secrets) + importeurs (WXR…) dans Outils ; **`siteBundle` EXISTE** (`src/services/tools/siteBundle.js`, format `kolakisa-site-bundle@1`, magic `KKSITE1`) : export / inspection / plan / restauration d'UN site avec ses médias (types `site`, `settings`, `pages`, `menus`, `redirects`; ≤ 500 fichiers, 400 Mo, sommes SHA-256, chemins d'origine jamais utilisés) — mais **sans** thème actif, modèles de thème, composants globaux, patterns ni « Mes modèles » ; `siteCarry.js` n'est PAS de l'import/export (il propage `?site=` dans les liens) *(correction apportée à la revue : le premier relevé de cette section se trompait sur `siteBundle`)* | `web/tools.js:9-11,29`, `docs/KOLAKISA_EXPORT_CONTENU.md`, `web/siteCarry.js:1-6` |
| Éditeur de fichiers de thème | ✅ (virtuel, §2.1) | `services/themeFiles.js` |
| Isolation par site | ✅ pour thèmes, polices, patterns, widgets, templates (`sameScope`, site vérifié côté serveur, routes classées dans `routeScopes.js` avec test qui échoue si une route n'est pas déclarée) ; ❌ pour les modèles de thème (organisation) et 🟡 composants/« shared » (visibles de tous les sites) | `services/siteScope.js`, `web/routeScopes.js:1-15`, `pages/index.js` |
| Validation à l'import | ✅ thème (strict, champs inconnus refusés, 64 Ko), pack/gabarit/page (normalisation du moteur) ; ❓ pas de signature/provenance des paquets externes (seul `checksumOf`) |

### 5. Compatibilité éditeur ↔ modèles ↔ rendu public
| Lien | État | Preuve |
|---|---|---|
| Éditeur ↔ rendu public | ✅ mêmes structures (nœuds/sections normalisés par `nodes.js`/`sections.js`, rendu EJS commun) ; l'aperçu de widget de site réutilise `renderBlock` | `widgets.js:previewBlock`, `_node.ejs` |
| Modèles de thème ↔ éditeur | ✅ un modèle = une page du Page Builder (mêmes publications/versions/100 révisions) ; étiquettes `{{post.*}}`, `{{course.*}}`, `{{query.*}}` | `themeRender.js:postScope` |
| Thèmes/packs/gabarits ↔ éditeur | ✅ produisent des sections natives (`compose.js`, `templates.js`) : modifiables ensuite | `compose.js:1-4` |
| Deux formats coexistent | 🟡 sections plates (16 types) et arbres de nœuds (94 types, type `layout`) dans la même page ; les gabarits/packs utilisent surtout les sections plates, la bibliothèque de thèmes les nœuds | `sections.js:TYPES`, `compose.js` |
| Widgets de site (zones) ↔ Page Builder | ❌ catalogue distinct (18 blocs, `cleanBlock/renderBlock`), aucun partage de code avec `nodes.js` | `marketing/widgets/catalog.js` |
| Thème (jetons) ↔ rendu | ✅ lu par les deux moteurs (`mk_sites.tokens`, `appearance_configs`) | `themes.js` « vérifié après écriture » |

### 6. Problèmes vérifiés, duplications, code mort
1. Documents périmés : 92/86 types annoncés contre 94 réels (§1.3). Les docs THEME_BUILDER_* datent de la branche `theme-builder` (octobre) et pointent des numéros de ligne (`blog.js:178/340`) qui ont bougé (aujourd'hui `blog.js:208/381`) ; le bandeau « 9.1 » corrige le brouillon d'en-tête mais l'AUDIT/LIMITATIONS conservent des passages d'avant.
2. Même service, deux écrans pour les modèles de thème : `web/appearanceEditor.js:164-173` et `web/siteWeb.js:73-104` (risque de dérive d'UI).
3. Trois « Templates » homonymes (modèles de thème / bibliothèque / e-mails) ; la navigation Apparence › Templates mène à la bibliothèque (`templatesLibrary.js`) alors que `/site-web/apparence/templates` est l'affectation de modèles de thème : confusion de libellés.
4. Recouvrements de réutilisation : composants (`mk_web_components`), patterns (`appearance_patterns`), blocs réutilisables (`services/reusableBlocks.js`), « Mes modèles » (`mk_page_templates`), blocs enregistrés (`/modeles/blocs-enregistres`, e-mails) : cinq stockages de « morceau réutilisable ». ❓ lien exact de `reusableBlocks` non établi.
5. Deux stockages de jetons (`mk_sites.tokens` / `appearance_configs`) pour un schéma unique ; deux jeux d'en-tête/pied (composants vs configuration structurée) selon le site.
6. Modèles de thème au niveau organisation alors que toute l'application est multi-sites (§3.2).
7. Dette connue non traitée : composants sans historique (L6), tests familles par famille non écrits (L7), isolation inter-organisations non testée (L8), Safari/Firefox/tactile non testés (L9) — selon le document, non revérifié.
8. Code mort : aucun trouvé avec certitude. `registerTemplateType` et `registerCondition` ne sont appelés que par un test (`tests/editeur-dynamique.test.js:104`) : points d'extension non utilisés en production. `editorTheme.js` est un thème PERSONNEL de l'interface de l'éditeur d'articles (user_prefs), sans rapport avec les thèmes de site : homonymie, pas de code mort.
9. `public/css/marketing-themes.css`, `kola-*.css` : ❓ non audités (hors périmètre CSS).

### 7. Limites de cet audit
- Aucun test ni serveur lancé : « ✅ » = présence et cohérence dans le code, pas exécution. Les comptes viennent de `require` en Node (registres), pas de la base de données réelle (pas d'inspection des lignes `cms_themes`, `mk_sites`, etc.).
- Lecture partielle : `nodes.js` (2 115 l.), `page-builder.js` (8 644 l.), `pages/index.js`, `services/navigation.js`, `reusableBlocks.js`, `web/kit.js`, `landing/`, vues EJS et CSS lus par extraits ou non lus ; rendu public widget par widget et accessibilité non vérifiés.
- Comparaison Elementor fondée sur l'inventaire généré du dépôt (non rejouée contre Elementor).
- Catalogue de 160 thèmes : validité de chaque thème testée par `problems()` (vide) mais qualité visuelle, contrastes et pages de démonstration non regardés.
- Dates/numéros de migration (094 thèmes, 114 composants) lus dans les fichiers ; leur application en base non vérifiée.


## C. E-commerce, modules, permissions, données, tests, déploiement
Audit en lecture, commit b27d7c25 (branche docs/programme20-1-audit). Légende : ✅ opérationnel (preuve dans le code) / 🟡 partiel / ❌ absent / ❓ non vérifié.
Aucune exécution (ni serveur ni tests) : « ✅ » = code lu, pas comportement observé. Aucun secret lu ni copié.

### 1. E-commerce

#### 1.1 Ce que la plateforme vend réellement
La plateforme vend des FORMATIONS (LMS), rien d'autre. Les « produits » du Page Builder sont des formations rebaptisées : `src/marketing/pages/dynamic.js:70-80` enregistre « course » et « product » comme une seule source (commentaire « même source, deux noms »).

| Capacité | État | Preuve |
|---|---|---|
| Vente de formations | ✅ | `courses` (prix `price_cents`) ; `src/routes/orders.js`, `src/services/payments.js` |
| Produits physiques / numériques génériques (stock, variantes, expédition, SKU) | ❌ | aucune table `products` ; `src/config/database.js` ne contient que courses/orders/order_items/offers/coupons |
| Catalogue produits, catégories de produits, archives produits | 🟡 | `/catalogue` + `/categorie/<slug>` sur `courses.category` (TEXT libre) : `src/routes/courses.js:54-116` ; filtres q / category / level / sort. Pas de taxonomie produit (les `taxonomy_terms` servent aux articles) |
| Panier | 🟡 | session HTTP `req.session.cart` (`src/routes/cart.js:9-40`), connexion obligatoire (`requireAuth`), quantité implicite 1, pas de variantes |
| Commande | ✅ | `src/routes/orders.js` (`/commande`, `/commande/retour/:ref`, `/commande/code-promo`, `/commande/confirmation/:id`) |
| Paiement Stripe | ✅ | `src/services/payments.js` : Stripe Checkout hébergé via `fetch`, aucune dépendance (package.json sans SDK Stripe), montants calculés serveur (l.3), montant revérifié (l.86), idempotent, transaction `BEGIN IMMEDIATE` (l.94) |
| Webhook Stripe | ✅ | `src/routes/stripeWebhook.js` monté sur `/stripe` avec corps brut (`server.js:79`) ; signature HMAC + tolérance 300 s (`payments.js:61-73`) ; événements : checkout.session.completed / async_payment_succeeded / async_payment_failed / expired, charge.refunded |
| Remboursements | 🟡 | simple TRACE (`order_refunds`, `payments.js:149`) ; ne touche ni commande ni accès |
| Paiement hors Stripe | 🟡 | « démo » : `src/services/payment.js` (`PAIEMENT_SIMULE=1` ou `NODE_ENV=test`) valide une commande payante sans débit. Le commentaire d'en-tête de ce fichier (« Aucun prestataire… ») est périmé depuis l'arrivée de payments.js |
| Coupons | ✅ | table `coupons` (percent / fixed, bornes de dates, max_uses, par formation) ; propriété = `instructor_id`, code UNIQUE global (`database.js:480-494`) |
| Offres promo datées | ✅ | `src/services/offers.js` + `pricing.js` (prix effectif = la moins chère, jamais supérieure au standard) |
| TVA / taxes / factures | ❌ | aucune occurrence tva/vat/tax dans payments, orders, cart, pricing ; devise fixée `eur` (`payments.js:11`) ; seuil 0,50 € |
| Comptes clients | 🟡 | table `users` unique et globale (élève = client), `/mes-cours`, `/compte` ; pas de compte client propre à un site, pas d'achat invité (connexion exigée) |
| Page de confirmation | ✅ | `/commande/confirmation/:id` ; e-mail d'achat + notification (`payments.js:131-135`) |
| Tunnels de vente avec étapes de paiement | ✅ | `src/marketing/funnels/index.js:21-35` types `order`, `upsell`, `downsell` (une offre = une formation publiée) ; `src/routes/tunnelOffers.js` (`/tunnel/offre/:sid`, `/payer`, `/refuser`) ; sans `STRIPE_SECRET_KEY` l'offre s'affiche mais ne se paie pas (l.5, l.73). Limite documentée : l'upsell redemande la carte (l.6) |
| Blocs commerce dans le Page Builder | 🟡 | `src/marketing/pages/nodes.js:798` `addtocart` (POST réel `/panier/ajouter/:id`), `courserating`, groupe « commerce » (nodes.js:1007-1012 : producttitle, productprice, productimage, productshort, productmeta, productrelated), `catfilter` source posts/courses, source dynamique `user.cart_count` |

#### 1.2 Isolation par site du commerce : ABSENTE
- `orders`, `order_items`, `checkout_sessions`, `order_refunds`, `offers`, `coupons`, `enrollments` n'ont PAS de `site_id` (`src/config/siteColumns.js:7` : seules courses, faqs, contact_messages, support_tickets, audit_log reçoivent `site_id`). Une seule boutique, un seul compte Stripe, un seul panier de session.
- `courses.site_id` existe (nullable) mais ni `cart.js` ni `orders.js` n'y font référence (grep `site_id` : zéro occurrence dans routes/cart, orders, courses, payments).
- Le module « commerce » (`siteModules.js:21`) ne garde QUE l'écran d'administration `/revenus` (`ROUTES.commerce`), pas la boutique publique.

#### 1.3 Dépendances manquantes pour des modèles Theme Builder « produit / catalogue / panier / paiement / compte »
(Constat, rien à développer ici.)
1. Entité produit générique (type, prix, stock, médias, variantes) : ❌. Seules les formations existent ; les modèles produit du thème devraient se lier à `courses`.
2. Archives produits/catégories dédiées : 🟡 routes `/catalogue`, `/categorie/...` rendues par des vues EJS du site principal (`views/`), pas par le moteur de pages/thèmes — ❓ non vérifié si elles sont pilotées par un modèle de thème.
3. Commande/paiement par site : ❌ (voir 1.2). Un site secondaire ne peut pas encaisser sur son domaine : session et cookie sont liés à l'hôte.
4. Compte client par site : ❌ (users global).
5. TVA, factures, expédition, multi-devises : ❌.
6. Invité (achat sans compte) : ❌.
7. Pages système (panier, commande, confirmation, compte) : ce sont des vues EJS fixes (`views/cart.ejs`, etc.), pas des pages éditables ; le Page Builder n'a que des BLOCS d'achat.

### 2. Modules par site
Source : `src/marketing/siteModules.js` (table `mk_site_modules`, migration 084).

| Module | `ready` | Garde réelle |
|---|---|---|
| sms, ai, social, scoring, commerce | true | écran d'admin gardé par regex de chemin (`ROUTES`, l.26-32) + `assertEnabled` dans les services |
| lms | **false** | aucun écran ni garde : activer ne change rien (l.22) ❌ |

- Mécanisme : pas de ligne = désactivé ; **site principal toujours actif** (`isEnabled`, l.43) ; activation par l'ÉQUIPE seulement (`setEnabled` l.65, route `src/marketing/web/siteModules.js:17-35`, permission `sites.modules` = admin + contrôle `teamOnly`). Désactiver ne supprime aucune donnée. Audit `site_module.enabled/disabled`.
- Effet : garde de routes dans `web/index.js:52` (403 « module non activé » pour un accès limité à un site) ; menus filtrés via `cmsNav.js:60` / `cmsData.js:118`. L'équipe n'est jamais bloquée.
- Portée : registre FERMÉ de 6 modules, uniquement des moteurs marketing. Les pages publiques /s/, /go/, /e/ ne sont pas concernées. Il n'existe pas de module « boutique », « thème », « blog » : un futur Site Builder devrait ajouter des clés au registre (test `tests/modules-par-site.test.js`).
- Isolation : `UNIQUE(site_id, module)` (upsert `ON CONFLICT (site_id, module)`), contrôle `organization_id` à chaque lecture/écriture.

### 3. Permissions

#### 3.1 Rôles
- Rôles d'ÉQUIPE (`mk_org_members.role` : viewer < editor < admin < owner), `src/marketing/organizations.js:4`.
- Rôles SYSTÈME (code, non modifiables) : owner « Super administrateur », admin, editor, author, contributor, viewer (`src/services/cmsAccess.js:70-77`).
- Rôles PERSONNALISÉS : table `mk_roles` (organisation, key, permissions JSON), permissions filtrées sur `ASSIGNABLE` ; `members.manage` et `organization.delete` jamais attribuables (`OWNER_ONLY`, l.38). Rôle inconnu = aucune permission (l.97).
- Rôles de SITE : `mk_site_members (site_id, user_id, role, + mode add/limit)` ; trigger refusant un rôle inexistant (049:51). Mode « limit » = plafond (intersection) pour un membre d'équipe (`cmsAccess.js:104-118`, migration 073).
- Permission effective : `cmsAccess.effectivePermissions`, calculée à chaque requête, jamais en cache global (`siteContext.js:1-12`). Pas de réponse qui révèle l'existence d'un site sans accès (`siteContext.js:39`).

#### 3.2 Carte utile à un futur Site Builder
| Action | Permission (rôle min.) | Où vérifiée |
|---|---|---|
| Créer un site | `forms.write` (editor) | `web/siteWeb.js:64` |
| Voir sites/pages | `forms.read` (viewer) | siteWeb.js (19 usages) |
| Publier une page | `pages.publish` (editor) | siteWeb.js, siteEditor.js |
| Supprimer définitivement une page | `pages.delete` (admin) | siteWeb.js |
| Code personnalisé dans les pages | `pages.code` (admin) | organizations.js:19 |
| Tunnels | `funnels.read` / `funnels.write` (viewer / editor) | funnels.js |
| Thèmes : lister | `appearance.read` (viewer) | web/themes.js (9) |
| Thèmes : installer/activer/publier | `appearance.publish` (admin) ; styles `appearance.styles` ; import de thème `forms.write` | themes.js |
| Templates / parties / patterns | `appearance.templates`, `.parts`, `.patterns` (editor) | appearanceEditor.js |
| Importer du contenu | `tools.import` (admin) ; écraser `tools.overwrite` (admin) ; contacts `contacts.import` | importers.js, imports.js |
| Domaines d'un site | `sites.domains` (admin) | siteDomains.js (6) ; `domains.manage` pour l'envoi/domaines d'organisation |
| Activer des modules | `sites.modules` (admin) + équipe seule | siteModules.js |
| Clés API / webhooks | `api_keys.manage`, `webhooks.manage` (admin) | apiKeys.js |
| Équipe et rôles | `users.*` (admin), `roles.manage` | — |
| Réglages sensibles (domaine, indexation, accueil) | `settings.sensitive` (admin) | — |

#### 3.3 Garde-fous constatés
- Anti-escalade : `assertCanGrantRole` (cmsAccess.js:319) — jamais plus de droits que soi.
- Site principal (`site_id NULL`) réservé à l'équipe (siteContext.js:31).
- Table déclarative des portées de routes `src/marketing/web/routeScopes.js` ; un test énumère les routes montées et ÉCHOUE si l'une n'est classée dans aucune famille (en-tête l.4-6 ; `tests/portee-des-routes.test.js`).
- Site archivé/supprimé refusé sauf demande explicite (siteContext.js:40-41).
- Triggers SQL d'isolation (migration 071) : étapes de tunnel, parents de pages, accueil de site, déplacement de page ou tunnel entre sites.
- Limite : « `forms.write` » est la permission fourre-tout pour créer site, pages, formulaires ET importer un thème : pas de permission dédiée `sites.create`, `themes.install` ou `templates.import` ❌ (à créer si le produit le demande).

### 4. Données (sites, pages, composants, thèmes, templates, versions)

| Table | Clés / colonnes notables | site_id ? | Contraintes / index | Migration |
|---|---|---|---|---|
| `mk_sites` | id, organization_id, name, slug, status (active/archived), tokens JSON (design system), home_page_id, header/footer_component_id, site_type, deleted_at | (la table EST le site) | UNIQUE(organization_id,name) ; UNIQUE partiel (organization_id,slug) WHERE slug NOT NULL (070) ; triggers 071 | 036, 070 |
| `mk_landing_pages` (= toutes les pages : landing/page/step) | slug, name, sections JSON (en ligne), theme, draft JSON, revision, kind, parent_id, archived_at, seo JSON, scheduled_at, header_component_id | `site_id` NULLABLE (NULL = pas de site / principal) | `slug UNIQUE` GLOBAL + UNIQUE(organization_id,name) (027) ; index site, parent, liste, planification | 027, 036, 047, 069 |
| `mk_page_versions` | page_id, number, content JSON, reason (publish/import) | via la page | UNIQUE(page_id,number) ; CASCADE | 036 |
| `mk_web_components` | name, section JSON, kind (standard/global), draft, version, revision, variant_of | `site_id` NULLABLE (NULL = global) | UNIQUE(organization_id,name) (donc nom unique TOUS sites confondus) | 036, 067, 114 |
| `mk_page_templates` (« Mes modèles ») | name, contenu | `site_id` + `shared` (hérités = 1) | UNIQUE(organization_id,name) encore actif | 042, 093 |
| `cms_themes` | theme_key, manifest, checksum, source (catalogue/import), active, previous_key/tokens | `site_id` NULLABLE | UNIQUE(COALESCE(site_id,0),theme_key) ; UNIQUE PARTIEL actif (COALESCE(site_id,0)) WHERE active=1 | 094 |
| `cms_theme_revisions` | theme_key, file_path | site_id | index (site_id,theme_key,file_path,id) | 105 |
| `appearance_configs / _revisions / _patterns` | tokens, styles, parties, templates (config d'apparence du site principal) | site_id NULL = principal | UNIQUE(COALESCE(site_id,0)) ; patterns : (COALESCE(site_id,0), name NOCASE) WHERE deleted_at IS NULL | `src/config/database.js:695-768` (hors migrations .sql) |
| `cms_revisions` | historique de contenus CMS | site_id | index site | database.js:746 |
| `nav_menus / nav_items / nav_locations` | menus | site_id NULL = principal | UNIQUE(COALESCE(site_id,0),slug) / name / location | database.js:776-825 |
| `mk_site_domains` | host, status, is_canonical | site_id | UNIQUE(host) WHERE verified ; UNIQUE(site_id,host) WHERE pending ; UNIQUE(site_id) WHERE canonical+verified | 113 |
| `mk_site_members`, `mk_site_modules`, `mk_roles` | voir §2-3 | site_id | PK(site_id,user_id) ; UNIQUE(site_id,module) ; UNIQUE(organization_id,key) | 049, 084 |
| `mk_content_sites`, `mk_contact_sites` | association contenu/contact ↔ site | site_id | — | 075, 080 |
| Autres tables par site | courses, faqs, contact_messages, support_tickets, audit_log, `site_pages_by_site` (clé site_id,slug), media, forms, sms, social, scoring, seo, widgets… | site_id nullable | `siteColumns.js`, migrations 074-101 | — |

- Dernier numéro de migration : **114** (`114_composants_revision.sql`) ; 99 fichiers (`ls | wc -l` = 99). Numéros ABSENTS : 043, 050-059, 076-078, 092 (le chargeur accepte les trous, il n'exige que l'unicité : `db/migrate.js:35-39`).
- Moteur : `src/marketing/db/migrate.js` — fichiers `NNN_nom.sql`, une transaction par migration, empreinte (checksum) : modifier une migration déjà appliquée est interdit, sauvegarde `AVANT-MIGRATION-*` avant toute migration sur une base contenant des données (l.1-9, 16, 45-50).
- Deux systèmes de schéma coexistent : migrations .sql (module marketing) ET DDL/ALTER inline dans `src/config/database.js` + `src/config/siteColumns.js`. Une nouvelle table de thème/template peut donc naître des deux côtés : à trancher.

#### Risques de migration pour étendre ces tables
1. `site_id NULL = site principal` : toute nouvelle contrainte d'unicité doit utiliser `COALESCE(site_id,0)` (sinon NULL ≠ NULL en SQLite et les doublons passent). Modèle déjà en place sur cms_themes, nav_*, appearance_*.
2. `mk_landing_pages.slug UNIQUE` global et `mk_web_components UNIQUE(organization_id,name)` / `mk_page_templates UNIQUE(organization_id,name)` : deux sites ne peuvent pas avoir la même adresse de page ni le même nom de composant/modèle. La reconstruction « unicité par site » existe (`src/services/reconstructionTables.js:23`, `reconstructionRun.js`) mais est une PROCÉDURE MANUELLE (« R6 lot 5 ») ; son état en production est ❓ non vérifié.
3. SQLite : `ALTER TABLE ADD COLUMN` seulement (pas de DROP/ALTER de contrainte) ; changer une UNIQUE = reconstruire la table (risque pour les triggers 071 et les clés étrangères `ON DELETE CASCADE/SET NULL`).
4. Les triggers 071 (même site pour parent, étapes, accueil) bloquent des UPDATE : toute opération « déplacer / dupliquer / importer un site » doit les respecter.
5. Les colonnes JSON (`sections`, `draft`, `tokens`, `manifest`) n'ont ni schéma ni contrainte SQL : la validation est en code (`pages/sections.js`, `nodes.js`) ; un format de template devra être versionné en code.
6. `UPDATE mk_page_templates SET shared = 1` (093) et `UPDATE mk_web_components SET kind='global'` (067) sont des migrations de données ; les rejouer sur une base modifiée est exclu (empreinte), mais les nouvelles doivent être idempotentes.
7. Sauvegarde automatique avant migration : si la copie échoue, la migration n'est pas appliquée (db/migrate.js:9) — prévoir l'espace disque (VACUUM INTO).
8. Pas de table dédiée « template de site », « kit de démarrage » ni « version de thème » : seuls `cms_themes` (une ligne par site+thème), `cms_theme_revisions` (par fichier) et `mk_page_versions` (par page). ❌ pour les versions de composants (un seul `draft` + `version`, pas d'historique).

### 5. API

| Surface | Routes | Auth / portée | État |
|---|---|---|---|
| API publique `/api/v1` (`server.js:85`, `src/marketing/api/router.js`) | GET/POST `/contacts`, `/contacts/:id`, POST `/events`, GET `/overview`, `/campaigns`, `/campaigns/:id`, POST `/campaigns/:id/<action>`, GET `/lists` ; 404 JSON par défaut | clé API (`mk_api_keys`, hachée, `keys.js`), scopes `read` / `write` seulement (keys.js:10) ; portée `reach` = organisation OU site (`api/scope.js`, migration 072) | ✅ marketing uniquement ; ❌ AUCUNE route pages / sites / thèmes / commerce |
| Mobile `/api/mobile` | POST `/login`, GET `/me` | session mobile (`api/mobile-auth.js`) | 🟡 minimal |
| Webhooks sortants | `mk_webhook_endpoints`, `web/webhooksOut.js` ; entrants `/webhooks` (corps brut, server.js:77) | gestion `webhooks.manage` | ✅ |
| Stripe entrant | POST `/stripe/webhook` | signature HMAC | ✅ |
| JSON internes de l'éditeur (session + permission, hors /api) | `/marketing/site-web/editeur-du-site/etat`, `…/publier` ; `/personnaliser/{rendu,brouillon,annuler,publier,restaurer,planifier,deplanifier}` ; `/widgets/{enregistrer,apercu}` ; `/patterns`, `/patterns/apercu`, `/patterns/pages/:id/sections` ; `/marketing/pages/*` (JSON 1 Mo, server.js:82) | cookie de session + `sameOriginOnly` (server.js:154) + permission de la route (§3) | ✅ |
- Règle de portée : la portée d'une clé vient UNIQUEMENT de l'enregistrement de la clé, jamais d'un paramètre (`api/scope.js:1-3`) ; tentative hors portée journalisée `api_key.out_of_scope`.
- Conséquence pour un Site Builder : toute automatisation externe (CI de thèmes, import par API) exigerait de nouvelles routes ET de nouveaux scopes (aujourd'hui seulement read/write global).

### 6. Tests
- Volume : 659 entrées dans `tests/` ; 519 fichiers utilisent `startServer` ; 176 fichiers « *navigateur* » (Chrome pilote).
- Commande : `npm test` = `node --test --test-concurrency=1 "tests/*.test.js"` (package.json). Un seul fichier : `node --test tests/<fichier>.test.js`. `ENCRYPTION_KEY` factice requise en CI (tests.yml). Node >= 22.12 (CI : Node 24).
- Convention : `node:test` ; serveur réel lancé par `startServer(extraEnv)` dans `tests/helpers.js:193` (avec reprise sur échec) ; aides spécialisées `marketing-helpers.js`, `helpers-editeur-navigateur.js`, `widgets-helpers.js`. Les tests navigateur sont « non exécutables » (comptés réussis) si Chrome/jsdom/sharp manquent (docs/KOLAKISA_PALIER_2_DEPLOIEMENT.md, résultats).

| Thème | Fichiers représentatifs |
|---|---|
| Isolation / sécurité | `isolation-des-sites.test.js`, `isolation-des-sites-caches.test.js`, `centre-gestion-isolation.test.js`, `palier12-isolation-composants.test.js`, `site-scope-portee.test.js`, `portee-des-routes.test.js`, `palier17-securite.test.js`, `palier17-ssrf-csv-unitaire.test.js`, `securite-sessions.test.js`, `etape0-securite.test.js`, `responsive-isolation-navigateur.test.js` |
| Modules / permissions / API | `modules-par-site.test.js`, `portee-api-webhooks(.test|-unitaire.test).js`, `marketing-api-keys|router|web.test.js`, tests `*role*` (9 fichiers) |
| Pages / Site Builder | `pages-01-liste`, `pages-02-nouvelle-page`, `page-builder-editeur|modele|reset|performance-navigateur`, `site-builder-vierge`, `site-manager-central`, `site-espace*`, `site-menu-*`, `site-web-commerce`, `site-web-editeur` |
| Éditeur de blocs | 25+ fichiers `editeur-blocs-*` (navigateur, Firefox, a11y, widgets, réutilisables-sites…) |
| Thèmes (15 fichiers *theme*) / composants | `composants-cycle-de-vie`, `composants-navigateur`, tests theme* |
| Domaines | `domaines-registre`, `domaines-inconnus`, `domaines-sites-independants`, `marketing-domaines` |
| Paiement / commerce | `paiement-stripe.test.js`, `tunnel-paiement.test.js`, `etape0-commande.test.js`, `site-web-commerce.test.js` |
- Scripts d'audit obligatoires pour toute modification visuelle (CLAUDE.md) : `scripts/audit-interface.js`, `audit-qualite.js`, `audit-editeurs.js`, `audit-responsive.js`.

### 7. Déploiement
- Fichiers : `DEPLOIEMENT-HOSTINGER.md` (RACINE du dépôt, pas dans docs/), `docs/KOLAKISA_PALIER_2_DEPLOIEMENT.md`, `.github/workflows/tests.yml`.
- Flux : push sur `main` → Hostinger redéploie depuis GitHub sans attendre la CI (en-tête de tests.yml : « Hostinger publie le site dès l'envoi ») ; le workflow `Tests` (push main, pull_request, manuel, Node 24, `npm ci`, `npm test`, timeout 40 min) ne bloque donc PAS la mise en ligne. Retour arrière par `git revert` (jamais de réécriture de l'historique), Hostinger redéploie.
- Node ≥ 22.12 (SQLite intégré), hébergement Node.js Hostinger (offres Business/Cloud) ou VPS. Santé : `/sante`. Sauvegardes : `npm run sauvegarde`, sauvegarde « Avant mise à jour » et « AVANT-MIGRATION-* ».
- Variables d'environnement (NOMS uniquement) :
  - Base : `NODE_ENV`, `SITE_URL`, `PORT`, `SESSION_SECRET` (refus de démarrer en ligne si faible), `ENCRYPTION_KEY`, `DATA_DIR`, `UPLOADS_DIR`.
  - Paiement : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_BASE` (tests), `PAIEMENT_SIMULE` (démo — danger en production). Le code lit aussi `STRIPE_SECRET` et `STRIPE_API_KEY` (alias présents dans le code, ❓ usage à confirmer avant de documenter).
  - Multisite : `HOTES_AUTORISES`, `PLATFORM_DOMAIN`, `KOLAKISA_DOMAIN_VERIFY`, `ALLOW_INDEXING`.
  - E-mail : `SMTP_HOST|PORT|USER|PASS|SECURE|FROM`, `CONTACT_EMAIL`. IA : `ANTHROPIC_API_KEY`. Travaux : `MARKETING_WORKER`, `SEO_JOBS`, `SAUVEGARDE_AUTO`.
- Au démarrage : migrations marketing appliquées automatiquement (avec sauvegarde si la base contient des données) ; worker marketing seulement si `MARKETING_WORKER=on` (server.js:261).
- Multi-domaine réel : DNS/HTTPS ne dépendent pas du code. Domaine client = TXT `_kolakisa-verify.` + A/CNAME ; sous-domaines de plateforme = DNS générique `*.domaine` ET certificat couvrant `*.domaine` (docs/KOLAKISA_MULTISITE_DOMAINES.md:56-57) — le wildcard est noté comme manquant dans la mémoire du projet ; ❓ non vérifié ici.

### 8. Problèmes détectés (vérifiés par lecture) et limites de l'audit
| # | Constat | Gravité | Preuve |
|---|---|---|---|
| P1 | Commerce NON isolé par site (orders, checkout, offers, coupons, enrollments sans `site_id`) ; la boutique est celle du site principal | Haute pour un Theme Builder commerce | siteColumns.js:7, grep site_id sur routes/cart, orders, payments |
| P2 | Module `lms` activable mais sans effet (`ready:false`, aucune route gardée) : l'interface peut laisser croire qu'il agit | Moyenne | siteModules.js:22 |
| P3 | `mk_landing_pages.slug UNIQUE` global + noms de composants/modèles uniques par organisation : collisions entre sites ; correctif = reconstruction manuelle R6 | Moyenne | 027_pages_atterrissage.sql:8,21 ; 042/093 ; reconstructionTables.js:23 |
| P4 | Pas de permission dédiée (créer site / installer thème / importer template) : tout passe par `forms.write` | Moyenne | cmsAccess.js GROUPS « pages » ; siteWeb.js:64 |
| P5 | Commentaire périmé : `payment.js` dit « aucun prestataire de paiement » alors que Stripe est branché (payments.js) | Basse | payment.js:1-4 |
| P6 | Remboursement Stripe : trace seulement, accès et commande inchangés (décision manuelle) | Basse (documentée) | payments.js:146-148 |
| P7 | Pas de TVA ni de facture ; devise unique EUR | Moyenne si vente publique | payments.js:11 |
| P8 | La CI ne bloque pas le déploiement (Hostinger publie à chaque push main) | Moyenne | tests.yml:1-3 |
| P9 | Deux sources de schéma (migrations .sql et DDL inline `database.js` / `siteColumns.js`) | Moyenne (risque de dérive) | database.js:695-825 vs migrations/ |
| P10 | Trous dans la numérotation des migrations (043, 050-059, 076-078, 092) — sans effet fonctionnel, mais à connaître avant de choisir « 115 » | Basse | listing migrations |
| P11 | Alias `STRIPE_SECRET` / `STRIPE_API_KEY` lus dans le code mais non documentés dans le guide Hostinger | Basse, ❓ | grep process.env |

Limites de cet audit : lecture statique seule (aucun test, serveur ou navigateur lancé) ; je n'ai pas lu les vues EJS (`views/`) ni les routes du blog ; le contenu de la base de production, l'état réel de la reconstruction R6 et la configuration Hostinger/DNS/HTTPS sont ❓ ; le nombre de tests (« ~2 500 » dans tests.yml, « 4898 » dans le doc palier 2) diverge selon la source et n'a pas été recompté ; `src/routes/orders.js` lu en partie (routes et mode de paiement), pas ligne à ligne ; web/webhooks.js et web/funnels.js non inspectés pour leurs permissions détaillées.

