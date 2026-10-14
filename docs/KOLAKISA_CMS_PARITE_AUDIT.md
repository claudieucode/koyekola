# KOLAKISA — audit de parité du CMS : site principal / site créé (Palier 3, après B1)

> **Statut :** audit en lecture seule. Aucune fonctionnalité modifiée, aucune migration, aucune donnée de production touchée, rien de poussé ni déployé.
> **Base auditée :** `553539c` (B1 déployé le 14/10/2026), branche `cms-independant`.
> **Méthode :** (1) lecture du code (`cmsNav.js`, `siteSpace.js`, `siteWeb.js`, services et routes de chaque module) ; (2) **sonde automatique** : un serveur de test local, une base d'essai, deux sites de test (« Alpha », « Beta »), chaque entrée des deux menus interrogée en tant que créateur du compte ; les observations brutes sont dans `docs/preuves/parite-observations.json` ; (3) inventaire des 155 tables (`tests/fixtures/inventaire-tables-sites.json`) ; (4) décompte des fichiers de tests par module.
> **Limite de méthode :** la sonde constate les réponses HTTP, les titres, les redirections, la coque affichée (bandeau de site) et si le contenu change avec le site demandé. Elle ne remplace pas une validation visuelle connectée en production, qui reste à faire (voir §9).

## 1. Le constat en une page

Le problème signalé est **réel et mesuré** : le menu d'un site créé n'a que **26 entrées dans 12 groupes**, contre **66 entrées dans 14 groupes** pour le site principal, et 9 des 26 sont « Bientôt ».

Il vient de trois causes distinctes, à ne pas confondre :

1. **Un choix de B1, reconnu insuffisant : le menu d'un site a été construit à part** (`buildSiteNav`, `cmsNav.js`), avec ses propres regroupements, au lieu de réutiliser le menu du site principal. C'est ce qui rend les deux espaces différents, y compris pour des modules pourtant prêts.
2. **Des modules dont le moteur sait déjà gérer un site, mais dont le menu d'un site ne les montre pas** : Outils (11 écrans, 1 seul proposé), Paramètres (11, 1 seul proposé), Utilisateurs (5, 1 proposé), Redirections (3, 1 proposé), Corbeille (non proposée), Apparence et Menus (moteur prêt, écrans câblés sur le principal seulement). **Pas de migration pour la plupart.**
3. **Des modules dont les données ne sont pas encore séparées par site** : Articles, Catégories/Étiquettes, Commentaires, Auteurs, Médias, Formulaires, Contacts, Modèles/Blocs, SEO (tables sans `site_id`). Ce sont B2 à B6. Les marquer « Bientôt » est **exact** ; les montrer comme « disponibles » sans séparation des données ferait fuiter ou mélanger des contenus entre sites.

Un défaut de cohérence s'y ajoute (observé, §5) : **depuis le menu d'un site, 9 écrans sur 26 (Emailing ×6, Tests A/B, Analytics, Santé du site) sortent de la coque du site** (pas de bandeau d'identité ni de menu du site). Le site reste le bon, mais l'impression est celle d'un autre CMS.

## 2. Inventaire A — CMS du site principal (66 entrées de menu, 14 groupes)

Source : `SECTIONS` de `src/marketing/web/cmsNav.js`. Toutes les adresses sont sous `/marketing/site-web/…` sauf indication. « HTTP » = réponse observée par la sonde. État : voir légende en §4.

| Groupe | Entrée | Route | HTTP | Moteur / service | Portée des données | Permission | État | Tests |
|---|---|---|---|---|---|---|---|---|
| Mes sites | Mes sites | `…/sites` | 200 | pages/index.js (createSite, archiveSite, deleteSite…) · web/siteWeb.js | organisation (liste de tous les sites) | `forms.read` | complète et vérifiée | gestionnaire-de-sites, isolation-des-sites, site-espace |
| Site principal | Tableau de bord du site principal | `…` | 200 | web/siteWeb.js (GET /site-web) | site principal (site_id NULL) | `forms.read` | complète et vérifiée | site-web-* |
| Pages | Pages | `/marketing/pages` | 200 | pages/index.js · web/landing.js | par site (mk_landing_pages.site_id ; NULL = principal) | `forms.read` | complète et vérifiée | isolation-des-sites, site-espace |
| Articles | Tous les articles | `…/articles` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Ajouter | `…/articles/ajouter` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Brouillons | `…/articles/brouillons` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Programmés | `…/articles/programmes` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Publiés | `…/articles/publies` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Corbeille | `…/articles/corbeille` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Catégories | `…/articles/categories` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `taxonomies.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Étiquettes | `…/articles/etiquettes` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `taxonomies.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Articles | Auteurs | `…/articles/auteurs` | 200 | services/blog.js, articles.js, taxonomy.js · web/articles.js | GLOBALE : tables posts/taxonomy_* sans site_id | `articles.read` | complète et vérifiée | cms-articles, blog-hub (13 fichiers) |
| Médias | Médias | `…/mediatheque` | 200 | marketing/media/index.js · web/mediaLibrary.js | GLOBALE : media / mk_media sans site_id | `media.read` | complète et vérifiée | 12 fichiers |
| Navigation | Navigation | `…/navigation` | 200 | services/navigation.js (22 réf. site_id) · web/navigation.js | moteur prêt pour un site (nav_menus.site_id) ; écran limité au principal (refuse tout menu dont site_id n'est pas NULL) | `navigation.read` | complète et vérifiée | 8 fichiers |
| Apparence | Éditeur du site | `…/apparence` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | Templates | `…/apparence/templates` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | Patterns | `…/apparence/patterns` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | Styles | `…/apparence/styles` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | En-tête | `…/apparence/en-tete` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | Pied de page | `…/apparence/pied-de-page` | 200 | services/appearance.js (46 réf. site_id) · web/appearanceEditor.js (appelle toujours appearance.*(null)) | moteur prêt pour un site (appearance_configs.site_id) ; écran câblé sur le principal seulement | `appearance.read` | complète et vérifiée | 6 fichiers |
| Apparence | Menus | `…/apparence/menus` | 200 | services/navigation.js (22 réf. site_id) · web/navigation.js | moteur prêt pour un site (nav_menus.site_id) ; écran limité au principal (refuse tout menu dont site_id n'est pas NULL) | `navigation.read` | complète et vérifiée | 8 fichiers |
| Commentaires | Tous | `…/commentaires` | 200 | services/comments.js · web/comments.js | GLOBALE : blog_comments sans site_id | `comments.read` | complète et vérifiée | 5 fichiers |
| Commentaires | En attente | `…/commentaires/en-attente` | 200 | services/comments.js · web/comments.js | GLOBALE : blog_comments sans site_id | `comments.read` | complète et vérifiée | 5 fichiers |
| Commentaires | Approuvés | `…/commentaires/approuves` | 200 | services/comments.js · web/comments.js | GLOBALE : blog_comments sans site_id | `comments.read` | complète et vérifiée | 5 fichiers |
| Commentaires | Indésirables | `…/commentaires/indesirables` | 200 | services/comments.js · web/comments.js | GLOBALE : blog_comments sans site_id | `comments.read` | complète et vérifiée | 5 fichiers |
| Commentaires | Corbeille | `…/commentaires/corbeille` | 200 | services/comments.js · web/comments.js | GLOBALE : blog_comments sans site_id | `comments.read` | complète et vérifiée | 5 fichiers |
| Utilisateurs | Tous les utilisateurs | `…/utilisateurs` | 200 | services/cmsAccess.js (24 réf.) · web/users.js (filtre ?site=) | organisation + rôle PAR SITE (mk_site_members) | `users.view` | complète et vérifiée | 12 fichiers |
| Utilisateurs | Inviter | `…/utilisateurs/ajouter` | 200 | services/cmsAccess.js (24 réf.) · web/users.js (filtre ?site=) | organisation + rôle PAR SITE (mk_site_members) | `users.create` | complète et vérifiée | 12 fichiers |
| Utilisateurs | Rôles | `…/utilisateurs/roles` | 200 | services/cmsAccess.js (24 réf.) · web/users.js (filtre ?site=) | organisation + rôle PAR SITE (mk_site_members) | `users.view` | complète et vérifiée | 12 fichiers |
| Utilisateurs | Permissions | `…/utilisateurs/permissions` | 200 | services/cmsAccess.js (24 réf.) · web/users.js (filtre ?site=) | organisation + rôle PAR SITE (mk_site_members) | `users.view` | complète et vérifiée | 12 fichiers |
| Utilisateurs | Invitations | `…/utilisateurs/invitations` | 200 | services/cmsAccess.js (24 réf.) · web/users.js (filtre ?site=) | organisation + rôle PAR SITE (mk_site_members) | `users.view` | complète et vérifiée | 12 fichiers |
| SEO | Vue générale | `…/seo` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Analyse SEO | `…/seo/analyse` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Meta | `…/seo/meta` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Indexation | `…/seo/indexation` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Sitemap | `…/seo/sitemap` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Schema | `…/seo/schema` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Open Graph | `…/seo/open-graph` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Robots | `…/seo/robots` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| SEO | Erreurs 404 | `…/seo/404` | 200 | web/cmsScreens.js (lecture) + liens vers l'Espace SEO /formateur/seo · src/seo/* | GLOBALE : seo_meta, seo_settings sans site_id ; écrans en lecture seule | `forms.read` | partielle | cms-seo |
| Redirections | Redirections | `…/redirections` | 200 | services/urls.js, seo/redirects.js · web/urls.js (?site=) | par site (seo_redirects.site_id, cms_url_history) | `redirects.view` | complète et vérifiée | 9 fichiers |
| Redirections | Liens cassés | `…/liens-casses` | 200 | services/urls.js, seo/redirects.js · web/urls.js (?site=) | par site (seo_redirects.site_id, cms_url_history) | `redirects.view` | complète et vérifiée | 9 fichiers |
| Redirections | Permaliens et adresses | `…/permaliens` | 200 | services/urls.js, seo/redirects.js · web/urls.js (?site=) | par site (seo_redirects.site_id, cms_url_history) | `redirects.view` | complète et vérifiée | 9 fichiers |
| Tests A/B | Tests A/B | `…/tests-ab` | 200 | web/pageTests.js | par site (mk_page_tests, via la page) | `forms.read` | complète et vérifiée | 8 fichiers |
| Outils | Santé du site | `…/outils` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.view` | complète et vérifiée | 8 fichiers |
| Outils | Corbeille | `…/corbeille` | 200 | services/revisions.js (23 réf.) · web/history.js | par site (cms_revisions.site_id) | `revisions.view` | complète et vérifiée | 2 fichiers |
| Outils | Importer | `…/outils/importer` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.import` | complète et vérifiée | 8 fichiers |
| Outils | Exporter | `…/outils/exporter` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.export` | complète et vérifiée | 8 fichiers |
| Outils | Sauvegardes | `…/outils/sauvegardes` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.view` | complète et vérifiée | 8 fichiers |
| Outils | Diagnostic | `…/outils/diagnostic` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.view` | complète et vérifiée | 8 fichiers |
| Outils | Informations système | `…/outils/systeme` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.view` | complète et vérifiée | 8 fichiers |
| Outils | Maintenance | `…/outils/maintenance` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.maintenance` | complète et vérifiée | 8 fichiers |
| Outils | Caches | `…/outils/cache` | 200 | services/tools/caches.js | n/a | `tools.cache` | partielle | écran « Bientôt » dans le principal lui-même |
| Outils | Outils de contenu | `…/outils/contenu` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.content` | complète et vérifiée | 8 fichiers |
| Outils | Journal d'activité | `…/outils/logs` | 200 | services/tools/* (65 réf. site_id) · web/tools.js (withSite) | par site (?site=) | `tools.view` | complète et vérifiée | 8 fichiers |
| Paramètres | Général | `…/parametres` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Lecture | `…/parametres/lecture` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Commentaires | `…/parametres/commentaires` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Médias | `…/parametres/medias` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Permaliens | `…/parametres/permaliens` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | SEO | `…/parametres/seo` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Confidentialité | `…/parametres/confidentialite` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Indexation | `…/parametres/indexation` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Emailing | `…/parametres/emailing` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Tunnels | `…/parametres/tunnels` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |
| Paramètres | Avancé | `…/parametres/avance` | 200 | services/settings/index.js (39 réf.) · web/settings.js (?site=) | par site avec défauts de l'organisation | `settings.read` | complète et vérifiée | 12 fichiers |

## 3. Inventaire B — CMS d'un site créé dans « Mes sites » (26 entrées de menu, 12 groupes)

Source : `siteSections()` de `cmsNav.js` et `web/siteSpace.js`. Site d'essai « Alpha ». « Coque » = l'écran s'affiche dans l'espace du site (bandeau d'identité + menu du site). « Filtre site » = le contenu observé change selon le site demandé.

| Groupe | Entrée | Route | HTTP | Déclaré | Coque du site | Filtre site | Remarque |
|---|---|---|---|---|---|---|---|
| Tableau de bord | Tableau de bord | `…/sites/1/tableau-de-bord` | 200 | actif | oui | — | Compteurs de CE site |
| Pages | Pages | `…/sites/1/pages` | 200 | actif | oui | — | Propre au site |
| Pages | Composants | `…/sites/1/composants` | 200 | actif | oui | — | Propres au site + globaux visibles |
| Articles | Articles | `…/sites/1/articles` | 200 | Bientôt | oui | — | Données non séparées par site (blog) → « Bientôt » exact |
| Articles | Catégories et étiquettes | `…/sites/1/categories` | 200 | Bientôt | oui | — | Données non séparées par site (blog) → « Bientôt » exact |
| Articles | Commentaires | `…/sites/1/commentaires` | 200 | Bientôt | oui | — | Données non séparées par site (blog) → « Bientôt » exact |
| Médias | Médias | `…/sites/1/medias` | 200 | Bientôt | oui | — | Médias non séparés → « Bientôt » exact |
| Formulaires et contacts | Formulaires | `…/sites/1/formulaires` | 200 | Bientôt | oui | — | Formulaires/contacts non séparés → « Bientôt » exact |
| Formulaires et contacts | Contacts | `…/sites/1/contacts` | 200 | Bientôt | oui | — | Formulaires/contacts non séparés → « Bientôt » exact |
| Apparence | Design du site | `…/sites/1/reglages#design` | 200 | actif | oui | non observé | Lien vers la fiche du site (ancre) — même moteur |
| Apparence | En-tête et pied de page | `…/sites/1/reglages#entete` | 200 | actif | oui | non observé | Lien vers la fiche du site (ancre) — même moteur |
| Apparence | Menus | `…/sites/1/navigation` | 200 | Bientôt | oui | — | Moteur prêt (nav_menus.site_id), écran absent → « Bientôt » exact mais évitable |
| Apparence | Modèles et blocs | `…/sites/1/modeles` | 200 | Bientôt | oui | — | Modèles/blocs non séparés → « Bientôt » exact |
| Emailing | Listes | `/m/listes?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Emailing | Segments | `/m/segments?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Emailing | Modèles d'e-mail | `/m/modeles?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Emailing | Campagnes | `/m/campagnes?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Emailing | Automatisations | `/m/automatisations?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Emailing | Tunnels | `/m/tunnels?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Mesure | Tests A/B | `…/tests-ab?site=1` | 200 | actif | **non** | non observé | Écran partagé ouvert avec ?site=… : sort de la coque |
| Mesure | Analytics | `/m/analytics/global?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| SEO et adresses | SEO | `…/sites/1/seo` | 200 | Bientôt | oui | — | SEO non séparé → « Bientôt » exact |
| SEO et adresses | Redirections | `…/sites/1/redirections` | 200 | actif | oui | — | Propres au site (seo_redirects.site_id) |
| Équipe | Équipe du site | `…/sites/1/equipe` | 200 | actif | oui | — | Rôles de CE site (mk_site_members) |
| Outils | Santé du site | `…/outils?site=1` | 200 | actif | **non** | oui | Écran partagé ouvert avec ?site=… : sort de la coque |
| Réglages | Réglages du site | `…/sites/1/reglages` | 200 | actif | oui | — | Fiche du site : design, en-tête, pied, accès |

« non observé » ne veut pas dire « non filtré » : sur la base d'essai, ces écrans n'ont pas de données qui diffèrent entre Alpha et Beta. Le filtrage de ceux-là est établi par lecture du code (tableau §4).

## 4. Matrice de parité

Légende : **V** complète et vérifiée (existe, répond, tests présents) · **P** partielle · **A** absente · **N** non vérifiée · **D** défectueuse. *« Vérifiée » = réponse observée par la sonde + fichiers de tests existants ; ce n'est pas une recette fonctionnelle de chaque bouton.*

### 4.1 Fonctions du CMS de base (référence WordPress)

| Fonction | Site principal | Site créé (menu actuel) | Moteur prêt pour un site ? | Écart / travail |
|---|---|---|---|---|
| Tableau de bord | V | V | oui | — |
| Pages (liste, création, édition, publication) | V | V | oui | — |
| Composants réutilisables | V | V | oui | — |
| Apparence : design system, styles, en-tête, pied de page | V | P (design et en-tête via la fiche du site ; Templates/Patterns/Styles absents) | oui (appearance_configs.site_id, 46 réf.) | Câbler l'écran « Apparence » sur le site demandé ; vérifier le rendu public par site |
| Menus / navigation | V | A (« Bientôt ») | oui (nav_menus.site_id, 22 réf.) | Lever la restriction « site_id NULL » de l'écran ; emplacements de menu par site |
| Redirections, liens cassés, permaliens | V | P (Redirections seulement) | oui (urls.js, redirects.js) | Exposer Liens cassés et Permaliens dans le menu du site (déjà filtrés par ?site=) |
| Utilisateurs, rôles, permissions, invitations | V | P (« Équipe du site » seulement) | oui (rôle par site, ?site=) | Exposer Inviter/Rôles/Permissions/Invitations pour ce site |
| Outils : santé, importer, exporter, sauvegardes, diagnostic, maintenance, journal, contenu | V (Caches : « Bientôt ») | P (« Santé du site » seulement, hors coque) | oui (withSite sur 16 routes sur 25) | Exposer les écrans déjà filtrés ; garder dans la coque du site |
| Corbeille / révisions | V | A | oui (cms_revisions.site_id) | Ajouter l'entrée, filtrée par site |
| Paramètres (général, lecture, confidentialité, indexation, e-mail, tunnels, avancé) | V | P (« Réglages du site » = fiche du site) | oui (settings, ?site=, défauts hérités) | Exposer les 11 écrans pour le site, en indiquant ce qui est hérité |
| Articles (liste, brouillons, programmés, publiés, corbeille, auteurs) | V | A (« Bientôt », B5) | NON (posts sans site_id) | Migration + moteur : lot B5 |
| Catégories et étiquettes | V | A (« Bientôt », B5) | NON (taxonomy_* sans site_id) | Lot B5 |
| Commentaires | V | A (« Bientôt », B5) | NON (blog_comments sans site_id) | Lot B5 |
| Médias | V | A (« Bientôt », B2) | NON (media/mk_media sans site_id) | Lot B2 : médiathèque par site + partage explicite |
| SEO (méta, indexation, sitemap, schema, Open Graph, robots, 404) | P (écrans en lecture seule + Espace SEO réservé au créateur) | A (« Bientôt », B6) | NON (seo_meta/seo_settings sans site_id) | Lot B6 |
| Formulaires et contacts | V (menu Marketing) | A (« Bientôt », B4) | NON (mk_forms, mk_contacts sans site_id) | Lot B4 |
| Modèles et blocs de pages | V | A (« Bientôt », B3) | NON (mk_page_templates, mk_saved_blocks) | Lot B3 |

### 4.2 Modules Kolakisa déjà développés (au-delà du CMS de base)

| Module | Site principal | Site créé | Remarque |
|---|---|---|---|
| Emailing : listes, segments, modèles d'e-mail, campagnes, automatisations, tunnels | V | V mais **hors coque** (6 écrans) | Moteur filtré par site (Palier 16-17) — à réintégrer dans la coque du site |
| Tests A/B | V | V mais hors coque | Contexte de site par ?site= (Palier 22) |
| Analytics | V | V mais hors coque | Couche de lecture centrale filtrée par site (Palier 21) |
| Commerce, Contact Core | non vérifié ici | non vérifié ici | Hors des deux menus audités ; l'isolation de mk_contacts est le lot B4 |
| Sondages, SMS, RSS, réseaux sociaux, étiquettes, rapports, désinscriptions | V | non couverts | 11 tables « à décider » (hors plan B2-B6) — décision à prendre |

### 4.3 Extensions tierces ou futures

Kolakisa n'a **pas** de système d'extensions ni de thèmes tiers (décision D11 : réutiliser les modules existants). Aucune parité n'est donc revendiquée avec les extensions WordPress. Les « extensions » d'un site sont les modules Kolakisa du §4.2, activés ou non par les permissions du rôle.

### 4.4 Fonctions propres à la gestion de sites (ce que fait Local by Flywheel, pas WordPress)

Écran « Mes sites » (`web/siteWeb.js`, lignes 51-251) : créer, dupliquer (avec ou sans pages), archiver, restaurer, supprimer (corbeille, suppression logique), récupérer, ouvrir l'espace du site, changer de site depuis la barre du haut. **Complète pour ce périmètre (V).** Absents, et non prévus ici : démarrer/arrêter un site, base de données par site, certificats, instantanés de site entiers, clonage vers un autre serveur (ce sont des fonctions d'hébergement local, pas de CMS).

## 5. Écarts observés, classés

| # | Écart | Preuve | Gravité | Type |
|---|---|---|---|---|
| E1 | Deux menus de structures différentes (12 groupes / 26 entrées contre 14 / 66) | §2 et §3 ; `buildSiteNav` ≠ `buildCmsNav` | Haute (objectif produit) | Conception B1 |
| E2 | Outils, Paramètres, Utilisateurs, Redirections, Corbeille : 1 entrée au lieu de 3 à 11 alors que le moteur filtre déjà par site | §4.1 ; `tools.js` 16/25 routes `withSite`, `settings.js` et `users.js` acceptent `?site=` | Haute | Menu incomplet, sans migration |
| E3 | 9 écrans sur 26 sortent de la coque du site (Emailing ×6, Tests A/B, Analytics, Santé du site) | Colonne « Coque du site » du §3 | Moyenne | Incohérence d'affichage |
| E4 | Apparence et Menus : moteur prêt, écrans câblés sur le principal (`appearance.*(null)`, refus des menus non NULL) | `appearanceEditor.js` lignes 64-160 ; `navigation.js` ligne 21 | Moyenne | Câblage à faire ; rendu public par site à vérifier |
| E5 | Articles, Catégories, Commentaires, Médias, Formulaires, Contacts, Modèles/Blocs, SEO : données non séparées | Inventaire des tables : a-isoler-B2 à B6 (20 tables) | Haute mais déjà planifiée | B2-B6, avec migration |
| E6 | 11 tables « à décider » sans propriétaire dans le plan | Inventaire : classe `a-decider` | Moyenne | Décision produit requise |
| E7 | Le site principal, ouvert via son « espace », mène à des écrans historiques hors coque | `docs/preuves/parite-observations.json`, clé `principalEspace` : 22 entrées sur 26 avec coque=0 | Basse | Compatibilité D15 respectée, cohérence visuelle à unifier |
| E8 | SEO du principal : écrans en lecture seule, actions réservées au créateur (Espace SEO `/formateur/seo`) | `cmsScreens.js` lignes 67-96 | Basse (hors périmètre site) | Existant |

Aucune fonction **défectueuse** (réponse en erreur, bouton sans effet) n'a été observée dans les deux menus : 66 sur 66 et 26 sur 26 répondent en 200, et les modules « Bientôt » n'affichent aucune donnée ni action.

## 6. Architecture cible

**Principe :** un seul menu CMS, rendu pour un contexte (« site principal » ou « site N »). Chaque entrée porte son état réel pour ce contexte : *disponible* (elle s'ouvre, filtrée par ce site), *hérité* (réglage commun affiché comme tel), ou *indisponible* (« Bientôt », avec le lot qui l'ouvrira).

1. **Réutiliser le registre `SECTIONS`** comme source unique : le menu d'un site en est une projection (mêmes groupes, mêmes libellés, mêmes permissions), où chaque entrée est annotée par un champ `portée` (`site` | `héritée` | `bientôt:B?`). `buildSiteNav` disparaît au profit de cette projection. Pas de second registre.
2. **Garder la coque du site sur les écrans partagés** : quand une adresse porte `?site=N` (ou l'équivalent `/sites/N/…`), le contexte de site de la requête (`res.locals.siteSpace`, déjà en place) active le bandeau et le menu du site. Les écrans existants n'ont pas à être réécrits.
3. **Routes** : conserver les adresses historiques du principal (D15) et les adresses `/sites/:id/<module>` déjà livrées ; ajouter, pour les modules prêts, des redirections propres vers l'écran partagé avec le site fixé par l'adresse (jamais par un paramètre libre), ce qui supprime le risque d'oublier `?site=`.
4. **Contrôle serveur systématique** (déjà acquis) : l'identité du site vient de l'adresse vérifiée, pas du client ; `effectivePermissions(utilisateur, site)` décide de chaque entrée.
5. **Données** : aucune nouvelle table pour le lot P1-P2 ; les lots B2-B6 gardent leur plan de migration (essai de reconstruction préalable, décision D8).

### Risques

| Risque | Mitigation |
|---|---|
| Régression du site principal en unifiant les menus | Projection construite à partir du registre existant ; tests de menu du principal inchangés ; adresses historiques conservées |
| Fuite entre sites en exposant plus d'écrans | N'exposer que les écrans déjà filtrés par site ; test d'isolation A/B pour **chaque** écran ajouté (modèle de `site-espace.test.js`) |
| Un écran partagé qui ignore `?site=` | Test d'inventaire : tout écran du menu d'un site doit changer de contenu avec le site ou être marqué « hérité » |
| Apparence/Menus par site sans rendu public correspondant | Vérifier d'abord le chemin de rendu public ; sinon laisser « Bientôt » |
| Migrations B2-B6 | Inchangé : essai de reconstruction concluant avant production |

## 7. Plan de livraison par lots (proposition, rien n'est lancé)

| Lot | Contenu | Migration | Critères d'acceptation mesurables |
|---|---|---|---|
| **P1** | Menu unique : le menu d'un site reprend les 14 groupes du principal ; entrées prêtes exposées (Outils ×11, Paramètres ×11, Utilisateurs ×5, Redirections ×3, Corbeille, Tests A/B, Emailing, Analytics) ; coque du site conservée sur tous les écrans partagés | **aucune** | 100 % des entrées du principal présentes dans le menu d'un site avec un état exact ; 0 écran du site hors coque ; 0 fuite A/B sur chaque écran ajouté ; suite complète sans nouvelle régression |
| **P2** | Apparence (styles, patterns, en-tête, pied) et Menus par site : câblage de l'écran sur le site, test du rendu public par site | **aucune** (colonnes existantes) à confirmer | Modifier l'apparence du site A ne change pas B ni le principal ; publication/annulation par site |
| **B2** | Médias par site, partage explicite | oui (reconstruction) | Plan B2 existant |
| **B3** | Modèles et blocs privés/globaux | oui | Plan B3 existant |
| **B4** | Formulaires, contacts, consentements | oui | Plan B4 existant |
| **B5** | Blog : articles, catégories/étiquettes, commentaires, auteurs | oui | Plan B5 existant |
| **B6** | SEO par site, défauts globaux | oui | Plan B6 existant |
| **À décider** | 11 tables sondages/SMS/RSS/réseaux/étiquettes/rapports/désinscriptions | à étudier | Décision produit avant tout code |

**Ordre recommandé : P1 → P2 → B2 → B3 → B4 → B5 → B6.** P1 règle l'écart visible immédiatement, sans migration ni risque pour les données ; P2 est le plus gros gain restant sans migration ; B2-B6 restent les chantiers de données.

### Plan de tests

- Test d'inventaire généré à partir du registre : pour chaque entrée du menu d'un site, réponse attendue (200/403), coque du site, état déclaré = état observé.
- Test d'isolation A/B pour chaque écran exposé (même méthode que `tests/site-espace.test.js`, 25 tests).
- Test Chrome réel : menu du site, bascule de site, téléphone 375 px sans défilement horizontal.
- Régression du principal : tests existants de menu et de routes inchangés.
- Suite complète avant chaque livraison ; échecs préexistants (SMS « double confirmation » ; décalage de 46 px du canvas) documentés tels quels.

## 8. Ce qui fonctionne, ce qui manque, ce qu'il faut faire

**Fonctionne déjà (observé) :** ouverture d'un site depuis « Mes sites » ; tableau de bord, Pages, Composants, Redirections, Équipe, Réglages propres au site ; Emailing, Tests A/B, Analytics, Santé du site filtrés par site ; isolation entre sites vérifiée par 25 tests de sécurité ; modules non prêts honnêtement marqués « Bientôt » ; site principal intact avec ses adresses historiques.

**Manque réellement :** (a) un menu de site aussi complet que celui du principal pour tout ce dont le moteur est déjà prêt (P1) ; (b) Apparence et Menus par site (P2) ; (c) la séparation des données de Médias, Modèles, Formulaires, Contacts, Blog et SEO (B2-B6) ; (d) une décision sur 11 tables de modules annexes.

**À faire pour atteindre l'objectif :** P1 puis P2 (sans migration), puis B2 à B6 avec essais de reconstruction. L'objectif « mêmes fonctionnalités compatibles » est atteignable **sans fausse fonctionnalité** : les entrées restent « Bientôt » tant que leurs données ne sont pas séparées.

## 9. Éléments non vérifiés

- Rendu visuel connecté en production des deux menus (la sonde tourne sur une base d'essai) : à confirmer par une capture réelle.
- Le **rendu public** d'une apparence ou d'un menu propre à un site (P2) n'a pas été étudié en détail : à examiner avant de câbler.
- « Filtre site : non observé » (§3) pour Tests A/B et certains écrans : établi par le code, pas par des données différentes.
- Les droits de rôles limités à un site (éditeur, lecteur) sur les entrées nouvellement exposées : à tester par entrée au lot P1.
- Aucune parité avec les extensions tierces WordPress n'est revendiquée ni mesurée.
