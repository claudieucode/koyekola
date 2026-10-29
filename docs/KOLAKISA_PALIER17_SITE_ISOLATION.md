# Palier 17 — modèle d'isolation multi-sites (observé)

- **Identité** : session (cookie par hôte, sans attribut `domain`) → compte relu en base à chaque requête (`sessionUser.js`).
- **Organisation** : toutes les tables marketing portent `organization_id` ; un membre d'équipe (`mk_org_members`, rôles viewer < editor < admin < owner, plus rôles personnalisés) voit tous les sites.
- **Site courant** : déterminé côté serveur — hôte (`siteHost.js` → registre `mk_site_domains`, hôte inconnu = 421) pour le public ; pour l'administration, `?site=` / champ `site` **validé** contre `mk_site_members` par `siteContext.resolve` (jamais cru). Un accès limité à un site obtient `ctx.siteScope` (entier imposé par le serveur).
- **Ressources** : `site_id` (NULL = site principal). `siteScope.js` fournit l'unique façon d'écrire « les lignes de ce site » en SQL ; `routeScopes.js` classe chaque route montée (un test échoue si une route n'est pas classée) ; les services (`pages`, `audience`) ajoutent une défense en profondeur (`inScope`, `assertSiteScope`, `siteAccess`).
- **Contacts** : lecture = contacts associés au site (`mk_contact_sites`), écriture = origine du site (décision D2) ; équipe = tout.
- **API** : clé hachée, `reach` organisation ou site (site actif exigé) ; lien avec l'état du créateur depuis ce palier.
- **Domaines** : un hôte vérifié = un seul site ; un domaine ne sert jamais le site principal en repli.
- **Frontières vérifiées par test (Palier 17)** : liste de site A ↔ contact de site B ; composants (création/globalisation/déplacement) ; redirections ; comptes sans appartenance ; clés d'API ↔ compte. Tests préexistants : `isolation-des-sites*`, `palier12-isolation-composants`, `contacts-par-site-unitaire`, `domaines-*`.
- **Non vérifié par exécution** : médias référencés dans une section de page, aperçu du personnalisateur désignant un composant d'un autre site, modèles/packs importés, concurrence réelle.
