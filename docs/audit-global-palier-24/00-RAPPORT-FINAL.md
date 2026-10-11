# Palier 24 — Audit global, transversal et architectural de KOLAKISA : rapport final

*Date : 2026-10-11. Audit en **lecture seule** : aucun code du produit, aucune migration, aucune dépendance, aucune configuration modifiés ; rien n'est poussé ni déployé. Dossier : `docs/audit-global-palier-24/`. Sondes : `audit-global/`.*

Fichiers : `01-matrice-sante-modules` (+ .csv) · `02-matrice-integration` (+ .csv) · `03-registre-anomalies` (+ .csv) · `04-fausses-fonctionnalites` · `05-sources-de-verite` · `06-plan-palier-25-tests-integration` · `07-plan-palier-26-corrections-transversales` · `08-criteres-sortie-palier-27` · `09-preuves-et-methode`.

---

## 1. Résumé exécutif

- **État réel** : KOLAKISA est un système large et cohérent dont la partie **CMS, éditeur, droits, SEO, URL, contacts, tunnels, analytics et A/B est solidement prouvée en environnement de test** (suite automatisée de 4 020 tests, 4 014 réussis ; 96 fichiers de tests Chrome (tous relancés un par un, tous réussis seuls) ; 360 routes d'administration × 6 profils sans écart de permission ; 107 écrans sans erreur serveur). **En revanche, tout ce qui touche au monde réel — paiement, envoi d'e-mails/SMS, tâches de fond — n'est pas démontrable en production** et au moins un élément est visiblement non configuré.
- **Aucune anomalie critique (P0) confirmée.** Quatre anomalies **élevées (P1)** :
  1. **G-01 — Paiement** : en production, `POST /stripe/webhook` répond **503** (« webhook non configuré ») : le secret de signature est absent. Le paiement par carte en production est **non validé**.
  2. **G-02 — Tâches de fond** : scénarios, e-mails programmés, détection d'abandon et pont boutique ne tournent que si `MARKETING_WORKER=on` ; **valeur de production invérifiable**, et aucun point de santé ne permet de le savoir.
  3. **G-03 — Articles** : **seul le compte créateur peut écrire**. Un correctif complet est prêt et validé en copie jetable (290 tests) mais **non appliqué** (autorisation de modifier les droits requise).
  4. **G-04 — Travail non fusionné** : 3 branches portent des commits absents de `origin/main` (dont 9 commits de l'éditeur) ; ils n'existent que sur ce Mac.
- **Intégrations** : 27 relations examinées → 16 validées par preuve (en test), 10 partiellement vérifiées, 1 présente mais non validée (webhook Stripe), 0 cassée, 0 absente. **Aucune n'est validée par un flux réel de production.**
- **Limites majeures de l'audit** : variables d'environnement, fournisseurs externes, données de production et sauvegardes de l'hébergeur hors de portée (voir §3).
- **Recommandation** : ne pas considérer KOLAKISA prêt pour la production avant le palier 25 (essais réels avec des comptes de test) et la clôture des critères du palier 27 (`08-criteres-sortie-palier-27.md` : 0 critère entièrement atteint à ce jour, 4 partiels).

## 2. Périmètre examiné

- **Code** : 62 626 lignes de JavaScript serveur (`src`), 15 300 lignes de vues EJS, 20 100 lignes de JavaScript public ; 58 fichiers de migration marketing (numérotés jusqu'à `069_pages_programmees.sql`) ; 155 tables ; 356 fichiers de tests.
- **Routes** : 681 routes extraites automatiquement (65 fichiers) ; 360 routes d'administration sondées par profil ; 107 écrans parcourus ; 32 requêtes négatives sur la surface publique.
- **Rapports précédents** : `docs/cms-*.md` (20 documents), `docs/audit-parite-wordpress/` (palier 23), audits de l'éditeur (`docs/KOLAKISA_*`), historique `git` (plus de 460 commits sur `origin/main`), 56 copies de travail du dépôt.
- **Environnements** : serveurs de test jetables ; production en lecture seule.

## 3. Périmètre non vérifié

NON VÉRIFIÉ — PREUVE INSUFFISANTE : variables d'environnement de production (worker, fournisseur d'envoi, Stripe, Twilio, IA, SMTP) ; envoi réel d'e-mails et de SMS ; paiements et webhooks signés des fournisseurs ; données de production ; sauvegardes de l'hébergeur et restauration en production ; performance en production ; 86 types de widgets individuellement ; navigation clavier complète ; fidélité visuelle éditeur/public ; revue SQL ligne à ligne. Détail et raisons : `09-preuves-et-methode.md`.

## 4. État des paliers précédents

| Palier | Sujet | Commit(s) sur `origin/main` | Document | Tests | Statut confirmé |
|---|---|---|---|---|---|
| 0 | Audit initial / protection de l'existant | aucun commit « palier 0 » | `docs/KOLAKISA_EDITOR_INITIAL_AUDIT.md`, `docs/editeur-pages-audit.md` (audits de l'éditeur) | — | **Non retrouvé comme tel** (audits partiels de l'éditeur seulement) |
| 1 | Coque du CMS | a8bc503 (+1) | — | cms-interface | Réalisé (preuve : tests, 107 écrans) |
| 2 | Pages | 3ba56cf (+1) | — | cms-pages | Réalisé |
| 3 | Médiathèque | 30d7071 (+1) | — | cms-media | Réalisé |
| 4 | Articles | 1e06fe3 (+1) | cms-articles.md | cms-articles | Réalisé (rédaction réservée au créateur : G-03) |
| 5 | Taxonomies | 763afbe | cms-taxonomy.md | cms-taxonomy | Réalisé |
| 6 | Commentaires | 8539f08 | cms-comments.md | cms-comments | Réalisé |
| 7 | Navigation | c80e30f | cms-navigation.md | cms-navigation | Réalisé |
| 8 | Apparence | 6b0d068 | cms-appearance.md | cms-appearance | Réalisé (double source de styles : D-05) |
| 9 | Utilisateurs / droits | 14c4700 | cms-utilisateurs.md | cms-users | Réalisé ; copie parallèle `cms-roles` non fusionnée (D-11) |
| 10 | Historique / corbeille | 7bf54d8 | cms-revisions.md | cms-revisions | Réalisé |
| 11 | SEO | 4a626c6 | cms-seo.md | cms-seo, seo-* | Réalisé |
| 12 | URL / redirections | 974de24 | cms-urls.md | cms-urls | Réalisé |
| 13 | Outils | 7682ed5 | cms-outils.md | cms-outils | Réalisé (sauvegarde : G-09) |
| 14 | Paramètres | 09866aa | cms-parametres.md | cms-parametres | Réalisé |
| 15 | Contact Core | bb7ecd0 | cms-contacts.md | cms-contacts-* | Réalisé |
| 16 | Email Engine | 3356d21 | cms-email-engine.md | cms-email-engine* | Réalisé en test ; envoi réel non vérifiable (G-02) |
| 17 | Automation Engine | 805c4be | cms-automation-engine.md | cms-automation-engine* | Réalisé en test ; worker non vérifiable (G-02) |
| 18 | CMS ↔ Tunnel | 1d096aa | cms-tunnel.md | cms-tunnel* | Réalisé (sans paiement : G-06) |
| 19 | Orchestration | 0f02c94 (+1) | cms-orchestration.md | cms-orchestration* | Réalisé en test |
| 20 | Commerce | bf50d1a (+1) | cms-commerce.md | cms-commerce* | Réalisé en test ; production non validée (G-01) |
| 21 | Analytics | 6870fca | cms-analytics.md | cms-analytics* | Réalisé |
| 22 | A/B testing | 61bc16d, 784051a (messages « feat(ab) ») | cms-ab-testing.md | cms-abtest* | Réalisé |
| 23 | Audit de parité WordPress | 01dd32f + corrections e72109f, c05dfb5, d318aae | docs/audit-parite-wordpress/ | cms-remediation | Réalisé ; AN-01 (articles) en attente d'autorisation |

**Vérification indépendante du palier 23** : rapport présent et recoupé ; ses constats ont été confirmés par les sondes du palier 24 (permissions, surface publique). Contradictions relevées : voir `09-preuves-et-methode.md`.

## 5. Cartographie architecturale

- **Pile** : Node ≥ 22 (`node:sqlite`, mode WAL), Express 4, EJS, SQLite ; sessions `express-session` avec **stockage SQLite** ; pas de framework front ; JavaScript public par fichier.
- **Points d'entrée** : `server.js` (ordre des intergiciels : webhooks à corps brut → analyse des formulaires → sécurité → sites/domaines → sessions → routes) ; routeur `/marketing` (administration, une seule barrière d'accès `cmsAccess`) ; routes publiques (`/p`, `/blog`, `/f`, `/t`, `/u`, `/w`, `/go`, `/s`) ; API `/api/v1` (clé), `/api/mobile` (jeton).
- **Moteurs centraux** : Contact Core, bus d'événements `mk_events` + file `mk_jobs`, moteur de pages commun, `cmsAccess`, moteur de réglages, résolveur d'URL, Email Engine, Automation Engine.
- **Modules** : CMS (pages, articles, taxonomies, médias, commentaires, navigation, apparence, outils, paramètres), Tunnels, Commerce, Analytics, A/B, SMS, formulaires, sondages, score, réseaux sociaux, IA, formations.
- **Tâches de fond** : worker marketing (`MARKETING_WORKER=on`), tâches SEO (`SEO_JOBS`), copie quotidienne de la base, promotion des pages programmées (à la première visite, sans worker).
- **Fournisseurs** : e-mail (console / SMTP / Resend, défaut « console » = rien ne part), SMS (Twilio), paiement (Stripe), IA (Anthropic), Search Console / PageSpeed.
- **Sécurité en place** : refus de démarrer en production sans `SESSION_SECRET` solide ; limiteur de connexion ; limiteurs de débit sur 14 points publics ; webhooks fermés (404) sans secret ; signature Stripe HMAC avec tolérance d'horodatage et comparaison à temps constant.

## 6. Inventaire des sources de vérité

Voir `05-sources-de-verite.md` : 10 responsabilités avec leur propriétaire, 11 doublons constatés (D-01 à D-11, jamais fusionnés), et la liste des données à portée « organisation » (sans site).

## 7. Matrice de santé des modules

Voir `01-matrice-sante-modules.md` : **24 modules — 15 validés (en environnement de test), 9 partiels, 0 défaillant, 0 non vérifié.** Les « partiels » sont : coque (commandes désactivées), Page Builder (pas de copie locale), articles (G-03), apparence (deux sources de styles), outils (sauvegarde), droits (2FA, Lecteur), Email Engine, Automatisations, Commerce, SMS et fonctions annexes (envoi/paiement réels non vérifiables).

## 8. Matrice d'intégration

Voir `02-matrice-integration.md` : 27 relations (les 15 demandées et 12 supplémentaires). Résultat : 16 validées par preuve, 10 partiellement vérifiées, 1 présente mais non validée, 0 cassée. **Toutes les preuves sont en test jetable** : aucune relation n'est prouvée par un flux réel de production.

## 9. Registre des fausses fonctionnalités potentielles

Voir `04-fausses-fonctionnalites.md` : 12 éléments. **Aucune donnée fictive affichée comme réelle ni succès sans traitement n'a été trouvé** sur les 107 écrans parcourus. Les cas notables : commandes « Notifications » / « Aide » désactivées et honnêtes, sélecteur de site actif absent, permission `articles.edit_own` sans effet pratique, e-mails/paiements/worker non vérifiables en production, événements du CMS émis sans abonné.

## 10. Registre des anomalies

Voir `03-registre-anomalies.md` : **20 anomalies — P0 : 0 · P1 : 4 · P2 : 12 · P3 : 4.**

| P1 | G-01 paiement en production non validé (webhook 503) · G-02 tâches de fond non vérifiables · G-03 rédaction des articles réservée au créateur · G-04 travail non fusionné (3 branches) |
|---|---|
| P2 | G-05 multi-site incomplet · G-06 tunnel sans paiement/upsell/downsell · G-07 systèmes parallèles · G-08 pas de supervision · G-09 sauvegardes même disque · G-10 suite non verte · G-11 pas de 2FA, CSRF faible · G-12 pas de copie locale du Page Builder · G-13 pas d'API de contenu · G-14 pas de variantes d'image · G-15 le Lecteur voit contacts et revenus · G-16 événements du CMS non branchés |
| P3 | G-17 dépendance indirecte · G-18 limites de mesure annoncées · G-19 documentation obsolète · G-20 ergonomie mineure |

## 11. Sécurité et isolation des sites

- **Sain (prouvé en test)** : aucune route d'administration ouverte à un anonyme (360/360) ni à un compte hors équipe (360/360) ; aucune écriture permise à un Lecteur hors aperçus et préférences ; échappement du texte saisi ; dépôts de fichiers dangereux refusés ; aucun fichier sensible exposé (`/.env`, `/server.js`, `/data/…db`, `/.git/config`, traversée de dossiers : tous 404) ; API sans clé = 401 ; webhooks fermés sans secret ; cookies de session `httpOnly`, `SameSite=Lax`, `Secure` automatique ; en-têtes de sécurité dont HSTS en production ; secrets absents du dépôt.
- **Isolation** : forte sur pages, tunnels, e-mails, automatisations, redirections, réglages, outils, tests A/B (IDOR testés) ; **partielle** sur le reste (G-05) ; les commandes ne sont jamais montrées à un membre de site.
- **Risques** : G-01, G-11 (pas de 2FA, CSRF par en-tête), G-15 (Lecteur), G-17 (1 vulnérabilité haute indirecte), CSP partielle. **Aucune opération de sécurité destructive n'a été lancée.**

## 12. Performance et maintenabilité

- **Mesures disponibles** (machine de développement chargée, base de test — ordre de grandeur, pas garantie de production) : pages d'administration 0,7–1,8 s en Chrome (~515 Ko décodés) ; blog à 1 000 articles 26–460 ms ; sitemap 82 Ko en 90–160 ms ; éditeur 1,3–2,6 s et 1,2–1,8 Mo.
- **Qualité** : 0 erreur de syntaxe (`node --check` sur tous les fichiers de `src`, `scripts`, `server.js`) ; aucun linter ni typage configuré ; toutes les dépendances déclarées sont utilisées ; tests : 356 fichiers.
- **Limites** : requêtes lentes en production « non mesurées » ; pas de supervision (G-08) ; tests Chrome sensibles à la charge (G-10).
- **Aucune optimisation réalisée.**

## 13. Risques de régression — zones à protéger impérativement

1. **Gardes d'accès successifs** : `routes/pages.js` (garde `/formateur`) puis `routes/blog.js` ; toute modification des droits doit rejouer la matrice 360 × 6.
2. **Numérotation des migrations** : unique, vérifiée juste avant l'envoi (incident 067) ; `tests/audit-corrections.test.js`.
3. **Éditeur (Page Builder)** : `public/js/marketing-editor.js` et ses 96 tests Chrome ; plusieurs sessions y travaillent.
4. **Ordre des intergiciels de `server.js`** : webhooks à corps brut avant l'analyse JSON ; sécurité avant routes ; promotion des pages programmées ajoutée au palier 23.
5. **Journal d'événements** : déclencheurs SQL d'immuabilité, clés d'idempotence (une modification casserait les garanties « une seule fois »).
6. **Consentement** : contrôles à l'envoi (`sendableSql`, `isSendable`) ; cookie `kw_consent`.
7. **Résolveur d'URL / sitemap / redirections** : liens déjà partagés.
8. **Stripe** : vérification de signature, idempotence, relecture du statut dans la transaction.
9. **Sauvegardes** : `VACUUM INTO` et script de restauration.

## 14. Plan des tests d'intégration du palier 25

`06-plan-palier-25-tests-integration.md` : 18 scénarios (T01–T18) avec prérequis, données, étapes, résultats attendus et critères d'acceptation ; ⚠ T05–T09 et T16 demandent des comptes de test externes. **Non exécutés.**

## 15. Plan de corrections transversales du palier 26

`07-plan-palier-26-corrections-transversales.md` : 8 groupes par cause racine (configuration invérifiable → droits → travail non fusionné → persistance → multi-site → doublons → qualité → événements/API), avec dépendances, risque, tests et retour arrière. **Non exécuté.**

## 16. Critères de sortie du palier 27

`08-criteres-sortie-palier-27.md` : 14 critères mesurables. État actuel : **0 atteint, 4 partiels, 10 non atteints.** Aucune mise en production n'est autorisée par ce plan.

## 17. Décisions nécessaires

| # | Décision | Impact |
|---|---|---|
| D1 | Le multi-site doit-il couvrir blog, médias, contacts, commandes ? | G-05, plus gros chantier |
| D2 | Autoriser l'application du correctif des articles multi-auteurs (`audit-parite/patch-articles-multi-auteurs.diff`) | G-03 |
| D3 | Un Lecteur doit-il voir contacts et revenus ? | G-15 |
| D4 | Lancer les essais réels du palier 25 avec des comptes de TEST (Stripe, e-mail, SMS) : qui les fournit ? | G-01, G-02, T05–T09 |
| D5 | Le propriétaire peut-il lire/indiquer l'état de production : worker, fournisseur d'envoi, clé et webhook Stripe ? (jamais lu par moi) | G-01, G-02 |
| D6 | Branches non fusionnées (`espacement`, `inspecteur-editeur`, `cms-roles`) : fusionner ou abandonner ? | G-04 |
| D7 | Le tunnel doit-il recevoir un paiement, des upsells/downsells ? (palier intermédiaire éventuel) | G-06 |
| D8 | Doublons D-01 à D-11 : lesquels gouverner ? | G-07 |
| D9 | Sauvegarde externe : quel stockage ? | G-09 |
| D10 | Politique de sécurité : 2FA obligatoire pour les administrateurs ? | G-11 |

## Score global

**Aucun pourcentage global n'est fourni** : la liste des modules et des relations est un choix d'audit, et la plupart des preuves viennent de tests écrits par la même équipe. Les seuls chiffres donnés sont des **décomptes par statut** (24 modules : 15 validés, 9 partiels ; 27 relations : 16 / 10 / 1 ; 20 anomalies : 4 P1, 12 P2, 4 P3). Ils ne prouvent pas la qualité du produit.

## Conclusion

KOLAKISA est **bien construit et bien testé dans ses environnements de test** ; il n'est **pas démontrable prêt pour la production**, principalement parce que le paiement, l'envoi et les tâches de fond n'ont jamais été éprouvés de bout en bout et que l'état de production est invérifiable de l'extérieur. **Je ne modifie rien, je ne lance pas le palier 25, et j'attends ton autorisation.**
