# KOLAKISA — Palier 2 : contexte de site et isolation des données

## 1. État initial (vérifié dans le code)
- SQLite (pas de Supabase, donc pas de RLS) ; une organisation ; `mk_sites` + `mk_site_members` (rôle par site) ; contrôle d'accès par adresse dans `src/marketing/web/index.js` (`siteOfRequest`) ; refus par défaut des écrans non rattachés à un site pour un accès limité à un site.
- Palier 1 en place (Site Manager, migration 070).
- Failles réelles trouvées par les tests d'accès croisé (corrigées) :
  1. une personne limitée au site A pouvait **déplacer sa page vers le site B ou vers le site principal** (champ `site_id` du formulaire d'enregistrement) : le droit n'était vérifié que sur le site d'origine ;
  2. une page du site A pouvait **embarquer un composant propre au site B** (`componentId` seulement contrôlé dans l'organisation) et donc afficher son contenu.

## 2. Modifications
- `src/services/siteContext.js` (nouveau) : `resolve(db, {userId, organizationId}, siteId, options)` → site vérifié + droits, ou refus (`invalid`, `not_found`, `deleted`, `archived`, `forbidden`) ; `canOn(...)` pour les opérations qui touchent un second site. Aucun état global : calculé à chaque requête.
- `src/marketing/web/index.js` : `req.mk.site` et `req.mk.siteContext` (contexte de la requête) ; `ctx.canOn(siteDestination, permission)` pour les services.
- `src/marketing/web/landing.js` : déplacer une page vers un autre site ou le site principal exige les droits d'écriture sur la destination.
- `src/marketing/pages/index.js` : un composant propre à un site ne s'insère que dans une page du même site (enregistrement du brouillon, import, déplacement de page) ; un composant global reste utilisable partout.
- `src/marketing/migrations/071_isolation_des_sites.sql` : 5 déclencheurs (étape de tunnel ↔ page du même site, page parente, page d'accueil du site). Additifs, aucune donnée touchée, valables pour les écritures futures ; retour arrière : `DROP TRIGGER`.
- `scripts/audit-sites.js` : contrôle en lecture seule (lignes par site, site principal, références orphelines, associations entre sites différents) à lancer avant/après migration et sur une copie de la production ; code de sortie 1 s'il y a une anomalie.
- Tests : `tests/isolation-des-sites.test.js` (22) ; `tests/cms-tunnel.test.js` adapté (la donnée « ancienne » invalide est maintenant refusée par la base : le test retire le déclencheur pour simuler une donnée d'avant).

## 3. Fonctionnement
- **Site actif** : l'adresse porte l'identifiant (`/marketing/site-web/sites/:id`, ou la ressource appartenant au site). L'identifiant est une demande, vérifiée à chaque requête (existence dans l'organisation, état, accès). Aucun cookie ni variable serveur ne mémorise « le site courant » : changer de site ou recharger ne peut donc pas mélanger deux sites.
- **Autorisations** : `cmsAccess.effectivePermissions` (rôle d'équipe + rôle sur CE site). Une personne limitée à un site n'ouvre que les adresses rattachées à ses sites ; tout le reste est refusé par défaut.
- **Site principal** : contenus sans `site_id` (NULL), réservé à l'équipe.

## 4. Classification des données (stratégie d'association)
| Catégorie | Tables | Décision |
|---|---|---|
| Propre à un site, isolé (colonne présente, contrôlé) | `mk_landing_pages`, `mk_web_components` (NULL = global), `mk_funnels`, `mk_lists`, `mk_segments`, `mk_templates`, `mk_campaigns`, `mk_automations`, `mk_page_tests`, `mk_web_events`, `mk_events`, `mk_conversions`, `nav_menus`, `nav_locations`, `appearance_*`, `seo_redirects` | déjà rattachés ; NULL = site principal, conservé |
| Propre à un site, **à rattacher au Palier 3** (pas de colonne aujourd'hui) | `posts`, `taxonomy_terms/relations`, `blog_comments`, `media`/`mk_media`, `mk_page_templates`, `mk_forms`, `seo_meta`, `seo_settings` | colonne nullable puis règles ; non fait ici faute d'usage (pas de colonne décorative) |
| Partagé, droits contrôlés | `mk_contacts` (organisation, `origin_site_id`), consentements et suppressions | décision métier requise (Palier 7) |
| Global | `users`, `mk_organizations`, `mk_roles`, catalogue des permissions, LMS (`courses`, `orders`…) | légitimement global |
Aucune donnée ancienne n'est attribuée à un site : tout ce qui n'avait pas de site reste « site principal ».

## 5. Données existantes et retour arrière
Aucune migration de données. La migration 071 n'ajoute que des déclencheurs. Le démarrage fait déjà une sauvegarde avant migration lorsque des données existent (`backupBeforeMigration`). Avant déploiement, lancer `node scripts/audit-sites.js <copie de la base>` sur la production : à défaut d'anomalie rien ne bloque ; sinon les lignes signalées sont à traiter à la main (le script ne modifie rien).

## 6. Limites restantes
- Articles, catégories, médias, formulaires, modèles de pages et réglages SEO (`seo_meta`) ne sont **pas encore isolés par site** (Palier 3).
- Pas de RLS (SQLite) : protection = contrôles serveur + 5 déclencheurs ; les déclencheurs ne couvrent que quelques associations.
- Le contexte vient de l'adresse (méthode par expressions régulières de `siteOfRequest`, héritée) : toute NOUVELLE route rattachée à un site doit y être déclarée, sinon elle est refusée pour un accès limité (sûr par défaut, mais à penser).
- Le script d'audit n'a pas été exécuté sur la base de production (inaccessible d'ici).
- Cache : le cache de domaines est invalidé aux changements de site ; aucun autre cache propre à un site n'a été trouvé, non audité en profondeur.
