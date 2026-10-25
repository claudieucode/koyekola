# Journal d'activité — audit et refonte

## État initial (audit)
**Deux journaux écriture seule**, tous deux protégés par des déclencheurs SQL (UPDATE/DELETE refusés) :
1. `mk_audit_logs` (CMS, migration 001 + `site_id` migration 082) — écrit par `src/marketing/audit.js recordAudit` depuis ~300 types d'actions (pages, formulaires, rôles, sites, modules, réglages, connexions de l'équipe, clés d'API…) ; lu dans **CMS → Outils → Journal d'activité** (avant : tableau de 100 lignes, 4 colonnes, sans filtre ni détail ni site) ; portée par site appliquée côté serveur (`scopeSql`, permission `audit.read` pour un accès limité).
2. `audit_log` (plateforme de formation, `src/services/auditLog.js`) — formations, offres, codes promo, certificats, quiz, commandes, outils ; lu dans **Centre de gestion → Journal d'activité** (filtres texte + type seulement).
Points faibles relevés : acteur absent affiché « Système » (même pour un compte supprimé) ; aucun filtre de période/acteur/niveau/site, aucune pagination ni détail ; types `category` et `tools` enregistrés mais non filtrables ; pas d'index pour la période ou l'acteur ; pas de trace de déconnexion ni d'export ; `audit_log.ip` conservé en clair (non affiché).
Non existants, non inventés : champ « résultat » dans `mk_audit_logs` (l'échec est porté par le nom de l'action), identifiant de corrélation, gravité stockée, alertes automatiques, purge/archivage.

## Ce qui a été fait
- **Lecture** (`src/marketing/auditJournal.js`, `src/marketing/web/auditJournal.js`) : filtres serveur (recherche texte et n° d'événement, niveau, catégorie, acteur, site pour l'équipe, période à l'heure de Paris), pagination 25/50/100, filtres actifs retirables, conservation des filtres vers le détail et au retour, page de détail (informations remasquées à la lecture, événements du même élément), export CSV (mêmes filtres et portée, 5 000 lignes max, cellules neutralisées contre l'injection de formules, **l'export est lui-même tracé** `audit.exported` sans son contenu).
- **Niveau déduit** du nom de l'action (non stocké) : *Alerte* (échecs et refus : `auth.login_failed`, `auth.login_refused`, `api_key.out_of_scope`, `*.failed`, `*.blocked`) ; *Sensible* (rôles, accès, sites, extensions, webhooks, clés, réglages, mots de passe/sessions, effacement de données, thèmes, connexions de l'équipe) ; *Courant* sinon. Toujours affiché avec un mot et une icône. Les trois niveaux sont une partition exacte de la base.
- **Acteur honnête** : compte supprimé → « Compte supprimé (n° …) » ; aucun compte → « Aucun compte associé (système, visiteur ou action automatique) ».
- **Instrumentation** : déconnexion d'un compte de l'équipe (`auth.logout`) ; export du journal (`audit.exported`). Les connexions d'élèves ne sont pas journalisées (choix existant, volume).
- **Performance** : migration 109 (index période, action, acteur). Mesuré sur 30 000 lignes : liste 36 ms, catégorie page 300 : 48 ms, acteur 3 ms, niveau+période 54 ms (machine de test, SQLite local).
- **Centre de gestion** : filtres résultat et période, types Catégories/Outils, détails repliables, compteur.

## Sécurité, confidentialité, isolation
Portée serveur (`ctx.siteScope`) pour la liste, le détail par identifiant (404 hors portée), l'export et les listes de filtres ; accès limité sans `audit.read` = 403. Secrets : masqués avant écriture (`redact`) et remasqués à l'affichage et à l'export ; IP = empreinte non réversible dans `mk_audit_logs`. Écriture seule garantie par la base (testé) — **mais** quiconque a accès au fichier SQLite ou peut supprimer les déclencheurs peut modifier l'historique : le journal n'est ni infalsifiable ni signé.

## Conservation
Aucune purge ni archivage automatique : le journal grandit sans limite. Les sauvegardes quotidiennes de la base le contiennent. Une politique (durée, archivage annuel) reste à décider.

## Reporté
Identifiant de corrélation et champ résultat dans le modèle ; alertes (seuils, notification) ; couverture complète des opérations (liste non exhaustive : voir la recherche par catégorie) ; unification des deux journaux ; masquage de l'IP dans `audit_log` ; test navigateur automatisé (contrôle visuel fait en script Chrome).
