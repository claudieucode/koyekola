# KOLAKISA — Palier 3 : CMS indépendant par site — Phase A (audit et inventaire)

Rapport en lecture seule. Aucun code, aucune migration, aucune donnée n'a été modifié. Branche de travail locale : `cms-independant` (créée à partir de `ddaf510`).

## 1. État du dépôt vérifié
- `HEAD` = `origin/main` = `ddaf510` (Palier 2 déployé). Aucun commit d'une autre session depuis. Dernière migration marketing : **071** (la 070 et la 071 sont appliquées en production : journal du 12/10 « Migration marketing 071 appliquée »).
- **Palier 2 non clos** : l'audit de la base de production (Centre de gestion → Sauvegardes → Audit des sites) n'a pas encore été transmis. Les décisions de migration du Palier 3 dépendent de ces nombres (voir §6).

## 2. Mécanismes multisite déjà en place (à réutiliser, pas à recréer)
- **Convention** : `site_id` NULL = site principal ; un nombre = un site de `mk_sites`. Les pages, composants, tunnels, listes, segments, modèles d'e-mail, menus (`nav_menus`), apparence (`appearance_*`), redirections (`seo_redirects`), historique d'adresses (`cms_url_history`) et révisions (`cms_revisions`) la suivent déjà.
- **Contexte de site** : calculé côté serveur à chaque requête (`src/services/siteContext.js`, `req.mk.site`, `ctx.canOn`). Le site est déduit de l'adresse (`/site-web/sites/:id`), de la ressource elle-même (page → son `site_id`) ou de `?site=` — puis **vérifié** (existence, supprimé/archivé, droits). Jamais cru sur parole.
- **Palier 2** : 7 déclencheurs SQL (étape↔page, parent↔page, accueil↔site, déplacement), domaines (421, 404 pour site retiré, blog/formations du site principal jamais servis sur le domaine d'un site), audit des sites.
- **SEO d'un site** : `mk_sites.settings.seo.publicUrl` + colonnes SEO des pages ; canonical, sitemap, robots.txt, JSON-LD déjà calculés à partir du site de la requête (`req.seoBase`).

## 3. Inventaire des entités

Légende : **Rattachement** = colonne de site fiable ? · **Contexte** = les opérations utilisent déjà le contexte de site ?

| Entité | Tables | Rattachement | Contexte | Risque d'accès croisé aujourd'hui | Modification nécessaire |
|---|---|---|---|---|---|
| **Pages** | `mk_landing_pages` (+ `mk_page_versions`, `mk_page_tests`) | OUI (`site_id`) | OUI (palier 2) | Faible (corrigé au palier 2) | Aucune structurelle ; vérifier recherche, duplication, import/export |
| **Composants** | `mk_web_components` | OUI | OUI | Faible | Aucune |
| **Menus / apparence** | `nav_menus`, `nav_locations`, `nav_items`, `appearance_*` | OUI (`nav_items` via son menu) | OUI | Faible | Vérifier seulement |
| **Redirections / URL** | `seo_redirects`, `cms_url_history` | OUI | OUI | Faible | Aucune |
| **Articles** | `posts` (46 colonnes), `post_revisions`, `post_autosaves`, `post_slug_history`, `blog_block_trash`, `blog_comments` | **NON** | NON (écran `/site-web/articles` global ; `routes/blog.js` publie tout) | **Élevé** : un seul blog pour tout, ouvert à toute personne ayant `articles.*` | `site_id` sur `posts` (+ dérivés) |
| **Catégories / étiquettes** | `taxonomy_terms` (UNIQUE `taxonomy,slug`), `taxonomy_relations` (`content_type,content_id,term_id`) | **NON** | NON | **Élevé** : une catégorie attribuable à n'importe quel article ; unicité des slugs globale | `site_id` sur `taxonomy_terms` ; unicité par site ; contrôle article↔terme de même site |
| **Médias CMS** | `mk_media` (UNIQUE `organization_id,path`) | **NON** (organisation seulement) | NON | **Élevé** : `/site-web/medias*` liste, modifie, supprime tous les fichiers ; usage détecté sur tous les sites | `site_id` + règle des fichiers partagés |
| **Médias du blog** | `media` (UNIQUE `path`, `/uploads/blog`) | **NON** | NON | Moyen (blog seulement) | à décider avec les articles |
| **Formulaires** | `mk_forms` (UNIQUE `organization_id,slug`), `mk_form_files`, `mk_pending_confirmations` | **NON** | NON | **Élevé** : `/formulaires` global ; une page d'un site peut intégrer le formulaire d'un autre ; soumissions visibles de tous | `site_id` sur `mk_forms` ; unicité par site ; page↔formulaire de même site |
| **Soumissions / contacts** | `mk_contacts` (`origin_site_id` existe déjà), `mk_events`(site_id), `mk_form_files` | Partiel (origine du contact) | Partiel | Contacts et consentements au niveau de l'organisation | **Décision métier** (voir D3) — je ne touche à rien |
| **Modèles de pages** | `mk_page_templates` | **NON** | NON | Moyen : modèle d'un site appliqué à un autre | `site_id` (+ statut « global ») |
| **Blocs enregistrés** | `mk_saved_blocks` | **NON** | NON | Faible | idem |
| **Modèles d'e-mail** | `mk_templates` | OUI | OUI (palier 16) | Faible | Aucune |
| **SEO du site principal** | `seo_meta` (clé `entity_type,entity_key`), `seo_settings`, `seo_*` | **NON** | NON | Moyen : concerne formations, pages fixes, catégories d'articles, auteurs = site principal | Voir D5 |
| **SEO des pages CMS d'un site** | colonnes `seo` des pages, `mk_sites.settings.seo` | OUI | OUI | Faible | Aucune |
| **Pages fixes du blog** | `site_pages` (slug) | NON | NON | Faible (À propos, FAQ… du site principal) | Aucune (site principal par nature) |
| **Blocs réutilisables du blog** | `blog_reusable_blocks` | NON | NON | Faible | avec les articles |
| **Formations, commandes, utilisateurs, offres, certificats…** | `courses`, `orders`… | NON | — | Hors périmètre | Aucune (plateforme d'apprentissage, site principal) |

## 4. Risques d'accès croisé constatés (côté serveur)
1. `/marketing/site-web/medias*` : toute personne avec `forms.read/write` agit sur **tous** les médias de l'organisation, quel que soit le site. Les personnes limitées à un site sont bloquées par la règle générale « seules les adresses de SES sites », mais `/site-web/medias` n'a pas d'identifiant de site → fermé pour elles ; l'équipe de l'organisation voit tout. Pas de fuite vers l'extérieur, mais aucune séparation entre sites pour l'équipe.
2. `/formulaires*` : même constat ; une page d'un site peut référencer n'importe quel formulaire (`mk_landing_pages.form_id`, noeud de formulaire).
3. `/site-web/articles*` et taxonomies : un seul espace. Slugs de catégories uniques globalement (deux sites ne peuvent pas avoir « actualités »).
4. `mediaUsage()` cherche l'usage d'un fichier dans **tous** les sites (utile : permet de classer les médias partagés).
5. Les fichiers eux-mêmes (`/uploads/marketing/<org>/…`, `/uploads/blog/…`) sont servis publiquement par chemin : c'est le comportement voulu pour des médias publiés ; l'isolation visée est celle de la bibliothèque, des opérations et des références, pas du chemin public.

## 5. Stratégie proposée (à valider) — Phase B
**Principe** : colonne `site_id` NULLABLE ajoutée de façon additive, sans toucher aux lignes existantes. **NULL = site principal**, comme pour les pages. Les données historiques restent donc exactement où elles sont (aucune attribution arbitraire) et l'ancien code continue de fonctionner. Contraintes de cohérence par **déclencheurs SQL** (comme au palier 2) et par le service (contrôle côté serveur), unicités par site via index partiels.

Ordre proposé (changements cohérents, testables, réversibles) : (1) médias CMS, (2) formulaires, (3) modèles/blocs, (4) articles + catégories (+ SEO associé si D1 = oui), chacun avec migration propre, tests d'accès croisé, retour arrière.

## 6. Données ambiguës — à mesurer AVANT toute migration
Rattacher « tout au site principal » est sûr pour ce qui n'est référencé que par le site principal. Ambigu : un média, un formulaire, un modèle ou un bloc **déjà utilisé par une page d'un autre site**. Proposition : étendre l'audit en lecture seule (écran déjà existant) pour compter, sans donnée personnelle, ces cas : médias/formulaires/modèles référencés par un site non principal, et par plusieurs sites. Ces éléments seraient marqués « à décider » et laissés intacts (aucune réécriture), puis une règle explicite (privé / partagé) serait appliquée après votre décision.

## 7. Décisions nécessaires (Phase B)
- **D1 — Articles.** Le blog actuel est unique et n'est volontairement pas servi sur le domaine d'un site (palier 2). Un site doit-il avoir **son propre blog** (articles + catégories, servis sur son domaine) ? *Recommandation : oui — articles et catégories par site (NULL = blog du site principal), et blog public servi sur le domaine du site à partir de ses propres articles.*
- **D2 — Médias.** Chaque site a sa médiathèque. Un fichier déjà utilisé par plusieurs sites devient-il « partagé » (visible de tous les sites, non supprimable tant qu'utilisé) ? *Recommandation : oui, indicateur explicite « partagé », jamais déduit automatiquement.*
- **D3 — Formulaires et contacts.** Formulaires par site : oui (recommandé). Les **contacts et consentements** restent communs à l'organisation et gardent `origin_site_id` (comportement actuel inchangé) : à confirmer ; toute autre portée est une décision métier que je ne prends pas.
- **D4 — Modèles et blocs.** Pour les **bibliothèques de conception** (modèles de pages, blocs enregistrés), NULL = « global, partagé par tous les sites » (comme une bibliothèque de design), et un site peut avoir ses modèles privés. *Recommandation : oui.* (À l'inverse, pour articles/formulaires/médias, NULL = site principal seulement.)
- **D5 — SEO.** Les réglages SEO globaux (`seo_settings`, `seo_meta`) concernent le site principal. Si D1 = oui, le SEO des catégories/étiquettes d'un site exige `site_id` dans `seo_meta` (clé élargie). *Recommandation : suivre D1.*
- **D6 — Palier 2.** Transmettre le résultat de l'audit des sites de la production avant de migrer (il peut révéler des cas ambigus déjà présents).

Rien n'est modifié tant que ces points ne sont pas tranchés.
