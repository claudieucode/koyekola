# KOLAKISA CMS — Utilisateurs : finalisation (mission UTILISATEURS-01)

Branche `utilisateurs-01`, issue de `origin/main` (`b6451be`). Ce document décrit l'état **réel**.

## 1. Audit

| Rubrique | Site principal (équipe) | Dans le menu d'un site, avant | Maintenant |
|---|---|---|---|
| Tous les utilisateurs | **Fonctionnel** : liste, recherche, filtres (rôle, statut, site), tri, pagination, fiche, rôle, statut, accès par site, retrait | liste en lecture seule (nom, rôle, date) | **fiche et actions locales** (voir §3) |
| Inviter | fonctionnel (e-mail, rôle, site) | « Bientôt » | **ouvert**, pour CE site |
| Rôles | fonctionnel (création, copie, modification, suppression protégée) | « Bientôt » | **ouvert en lecture** (rôles communs) |
| Permissions | fonctionnel (matrice par rôle) | « Bientôt » | **ouvert en lecture** |
| Invitations | liste sans filtre, état supposé | « Bientôt » | **ouvert**, filtres, états réels |

Défauts trouvés et corrigés : message « un e-mail part » sans vérifier l'envoi ; aucune limite d'envoi ; compte créé hors transaction ; lien utilisable deux fois en requêtes simultanées ; aucune revérification à l'acceptation ; **une personne dotée de « Attribuer des rôles » pouvait rétrograder ou retirer un administrateur d'un site** (la vérification ne regardait que le rôle d'équipe de la cible, pas son rôle sur le site).

## 2. Invitations (centrales et locales)

- **Migration 099** (additive) : `invited_name`, `message`, `mail_id`, `send_error`, `send_count`, `last_sent_at`. Retour arrière : `ALTER TABLE mk_invitations DROP COLUMN …`.
- **Jeton** : 24 octets aléatoires, jamais stocké (empreinte SHA-256), jamais écrit dans le journal d'audit ni le message ; valable 1 à 30 jours (7 par défaut) ; usage unique par écriture conditionnelle.
- **État réel de l'envoi** relu dans la file d'envoi (`mail_outbox`) : *en file d'envoi*, *envoyé* (= accepté par le serveur d'envoi, jamais « lu »), *échec d'envoi* (avec le motif). Sans serveur d'e-mail, le message le dit et donne le lien à transmettre.
- **États de l'invitation** : en attente, acceptée, expirée, révoquée — distincts de l'état d'envoi. (Pas d'état « brouillon » : l'invitation est créée au moment de l'envoi.)
- **Limites** : 30 invitations par heure et par inviteur ; 60 s entre deux envois ; 6 envois par invitation. Renvoyer ou renouveler crée un nouveau jeton et invalide l'ancien.
- **Acceptation atomique** (`acceptInvitation`) : compte, accès et état « acceptée » dans une transaction ; revérifie la validité, l'existence du rôle, le site actif et que la personne qui a invité a **encore** tous les droits de ce rôle ; sinon rien n'est accordé et aucun compte orphelin n'est créé.
- **Liste** : recherche (e-mail, nom), état, rôle, site (central), pagination, actions Renvoyer / Renouveler / Révoquer (confirmation).

## 3. Administration locale d'un site (`/sites/<id>/equipe…`)

Fichiers : `src/marketing/web/siteUsers.js`, `views/marketing/site-users.ejs`, `src/marketing/web/inviteFlow.js`, `cmsAccess.js` (`listSiteMembers`, `siteMemberDetail`, périmètre `scopeSiteId`), `routeScopes.js`, `cmsNav.js`.

- **Liste** des seules personnes ayant un rôle sur CE site (jamais l'équipe centrale ni un autre site), recherche, filtres (rôle, statut du compte), tri, pagination.
- **Fiche** : profil, accès depuis, dernière connexion / activité (données réellement collectées), rôle sur le site, **permissions effectives sur ce site**, historique des opérations de ce site.
- **Actions** : changer le rôle sur le site, retirer l'accès **à ce site seulement** (le compte, les autres sites et l'équipe ne changent pas). Le statut du **compte** (suspendre, désactiver) et l'équipe de l'organisation restent à l'administration centrale ; il n'y a pas de suppression de compte (les contenus, commandes et historiques ne sont jamais effacés).
- **Inviter / Invitations** : le site est imposé par le serveur (champ de formulaire ignoré) ; jamais « toute l'équipe » ; jamais un rôle supérieur au sien ; une invitation d'un autre site est introuvable.
- **Rôles / Permissions** : lecture (les rôles sont communs à l'organisation : créer ou modifier se fait depuis le site principal).

## 4. Contrôles de sécurité

Droits recalculés **côté serveur pour CE site** (rôle d'équipe + rôle de site) ; site vérifié par `siteTarget` (jamais l'identifiant du navigateur) ; une personne d'un autre site est « introuvable » ; jamais plus de droits que soi (attribution, invitation, **et désormais modification d'une personne dont le rôle de site dépasse les siens**) ; jamais soi-même ; dernier Super administrateur protégé ; site archivé en lecture seule ; double envoi bloqué (navigateur et serveur) ; audit sans secret.

## 5. Registre et tests

| # | Fonction | Preuve |
|---|---|---|
| U1 | Invitation : jeton haché, validité, message, file d'envoi | `utilisateurs-invitations` |
| U2 | État d'envoi réel, jamais « envoyé » à tort | `utilisateurs-invitations` ; Chrome « inviter » |
| U3 | Limites (heure, délai, nombre) | `utilisateurs-invitations` |
| U4 | Acceptation atomique, usage unique (simultané), revalidation | `utilisateurs-invitations` |
| U5 | Équipe locale : liste, filtres, pagination, fiche | `utilisateurs-site` ; Chrome |
| U6 | Rôle / retrait locaux, escalade, auto-modification, cible plus dotée | `utilisateurs-site` |
| U7 | Accès croisé entre sites (personne, invitation, site forgé) | `utilisateurs-site` |
| U8 | Invitations locales : périmètre, renvoi, révocation | `utilisateurs-site` |
| U9 | Rôles et permissions en lecture, aucune écriture depuis un site | `utilisateurs-site` |
| U10 | Navigation, formulaires, confirmation, double clic, 390 px, mouvement réduit | `utilisateurs-site-navigateur` |

## 6. Limites

- Pas de création / modification de rôle depuis un site (les rôles sont partagés : le faire d'un site changerait les autres) ; pas de « permissions complémentaires » par invitation (le modèle n'a que le rôle).
- Pas de révocation de session individuelle : un compte suspendu perd immédiatement tous ses droits du CMS (testé), mais les sessions ne sont pas listées.
- Pas de suppression définitive de compte depuis ces écrans (conservation des données) ; « Retirer l'accès » est la seule opération.
- La liste d'équipe d'un site n'affiche pas l'équipe de l'organisation (accès à tous les sites), volontairement.
- Un e-mail « envoyé » est accepté par le serveur d'envoi ; Kolakisa ne sait pas s'il est arrivé en boîte de réception ni lu.
