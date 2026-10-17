# KOLAKISA CMS — Palier 9 : utilisateurs, rôles, permissions

## Audit : ce qui existait
- **Comptes et session** : table `users` (LMS : étudiant / formateur), sessions `express-session`, `refreshSessionUser` (relit le compte à chaque requête), connexion/inscription/mot de passe oublié. **Réutilisés tels quels.**
- **Équipe et droits** : `mk_org_members` (rôle viewer < editor < admin < owner) + table `PERMISSIONS` (permission → rôle minimum) dans `marketing/organizations.js`, appliquée par TOUTES les routes du CMS via `need(permission)` / `req.mk.can()`. Le compte créateur (formateur) est Super administrateur. **Réutilisés : les clés de permission existantes sont conservées.**
- **Journal d'audit** `mk_audit_logs` (écriture seule, sans données sensibles) : **réutilisé**.
- **Courrier** (`utils/mailer.js`, file `mail_outbox`) : **réutilisé** pour les invitations.
- **Écrans** Utilisateurs / Rôles / Permissions : lecture seule, rôles fixes → remplacés par de vrais écrans.
- **Manquait** : statut de compte (suspension), rôles personnalisés, accès par site, invitations, garde-fous d'escalade, propriété des articles (les siens / tous). Les routes de pages ne tenaient pas compte du site.
- **RLS / Supabase** : sans objet (SQLite ; la frontière de sécurité est le serveur).

## Architecture (une seule logique)
`src/services/cmsAccess.js` : `effectivePermissions(utilisateur, { organizationId, siteId })` = union des permissions du **rôle d'équipe** (mk_org_members) et du **rôle sur le site** (mk_site_members). Un compte suspendu/désactivé n'a aucune permission. La barrière de `marketing/web/index.js` appelle cette fonction une fois par requête et fournit `req.mk.can()` : toutes les routes existantes (pages, articles, médias, taxonomies, commentaires, navigation, apparence…) sont donc protégées par le même calcul, sans réécriture.
Quand l'adresse vise un site (page `/pages/:id…`, fiche `/site-web/sites/:id…`, composant), les droits sont ceux de CE site ; une personne qui n'a que des accès de site n'ouvre que ses sites (et « Mes sites »).

## Modèles (migration 049 + colonnes `users`)
`mk_org_members.role` devient une clé de rôle (contrainte d'origine levée, lignes copiées) · `mk_roles` (rôles personnalisés + permissions) · `mk_site_members` (site, compte, rôle) · `mk_invitations` (jeton à usage unique, seule l'empreinte est conservée) · `users.status` (active | suspended | disabled), `last_login_at`, `last_seen_at`. Aucune donnée existante n'est modifiée.

## Rôles
Système (fixes, définis dans le code) : Super administrateur (owner), Administrateur, Éditeur, Auteur, Contributeur, Lecteur. Personnalisés : nom, description, permissions choisies par groupe ; modifiables ; supprimables s'ils ne sont plus attribués. `members.manage` et `organization.delete` ne s'attribuent à aucun rôle personnalisé.
Permissions disponibles : voir l'éditeur de rôle (groupes Utilisateurs/rôles, Pages/sites/formulaires, Articles, Taxonomies, Médias, Commentaires, Navigation, Apparence, Réglages, Marketing). **Chaque case correspond à une vérification réelle côté serveur.** Propriété : `articles.write` = tous les articles, `articles.edit_own` = les siens (corbeille, restauration, copie) ; publier et supprimer définitivement gardent leur droit propre.

## Garde-fous
Jamais plus de droits que soi (attribuer un rôle, créer/modifier un rôle, inviter) · jamais soi-même (rôle, statut, retrait, accès) · on ne modifie pas une personne qui a des droits qu'on n'a pas · le rôle qu'on porte ne se modifie pas · le dernier Super administrateur actif est protégé · un rôle encore attribué ne se supprime pas · suspendre/désactiver ferme les sessions ouvertes à la requête suivante.

## Écrans (CMS → Utilisateurs)
Tous (recherche, statut, rôle, site, tri, pagination) · fiche (compte, rôle, accès par site, statut, permissions effectives, activité) · Rôles · Permissions (matrice domaine × action alimentée par les droits réels, avec équivalent texte pour chaque case) · Inviter · Invitations · Mes sites.

## Journal d'audit
`user.invited`, `user.role_changed`, `user.status_changed`, `user.removed`, `site_access.granted/revoked`, `role.created/updated/deleted`, `invitation.accepted/revoked`. Les connexions ne sont pas encore journalisées (dernière connexion et activité sont sur le compte).

## Limites volontaires
Import/export d'utilisateurs · rôle par ressource précise (au-delà du site) · l'éditeur d'articles est ouvert aux rôles ayant `articles.write` (tous les articles) ou `articles.edit_own` (les leurs) depuis le palier 25 ; le reste de l'espace blog (liste du créateur, SEO, IA, apparence, bibliothèque) reste réservé au compte créateur · permissions du Page Builder = celles des pages (pas de second système) · la double authentification (les connexions de l'équipe sont journalisées depuis le palier 23) · la suppression définitive d'un compte du site (le CMS le retire de l'équipe).
