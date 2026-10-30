# KOLAKISA — Documentation technique de référence (Palier 19)

*Date : 2026-10-29. Fondée sur le code de `origin/main` (commit `b27d7c25`), sur l'audit global du palier 24 (`docs/audit-global-palier-24/`), les paliers 25 à 26 et les audits de sécurité du palier 17. Chaque affirmation est vérifiée dans le code ; ce qui ne l'est pas est marqué **NON ÉTABLI**. Ce document décrit l'état **réel**, pas une architecture cible.*

> **Numérotation des paliers.** Dans ce dépôt, le « palier 18 » est le chantier **CMS ↔ Tunnel** (commit `1d096aa`), pas un audit global. L'audit global est le **palier 24** ; ses suites sont le palier 25 (tests d'intégration), le palier 26 (corrections) et les critères de sortie « palier 27 » (`docs/audit-global-palier-24/08-criteres-sortie-palier-27.md`). Ce palier 19 s'appuie donc sur ces documents. **Aucun rapport de « palier 18 = audit global » n'existe** : voir `KOLAKISA_PALIER19_FINAL_REPORT.md`.

## Guides détaillés

| Sujet | Document |
|---|---|
| Installation, configuration, variables d'environnement | `docs/KOLAKISA_INSTALLATION_AND_CONFIGURATION.md` |
| Déploiement et retour arrière | `docs/KOLAKISA_DEPLOYMENT_RUNBOOK.md` |
| Sauvegarde et restauration | `docs/KOLAKISA_BACKUP_AND_RESTORE.md` |
| Préparation à la production (matrice, risques) | `docs/KOLAKISA_PRODUCTION_READINESS_CHECKLIST.md` |
| Exploitation, journaux, diagnostic | `docs/KOLAKISA_OPERATIONS_AND_TROUBLESHOOTING.md` |
| Rapport final du palier | `docs/KOLAKISA_PALIER19_FINAL_REPORT.md` |
| Guide d'hébergement (Hostinger, pas à pas) | `DEPLOIEMENT-HOSTINGER.md` |
| Audit global, registre des anomalies | `docs/audit-global-palier-24/` |
| Sécurité (isolation, limites) | `docs/KOLAKISA_PALIER17_*.md` |

## 1. Pile technique (vérifiée)

- **Exécution** : Node.js ≥ 22.12 (`package.json` → `engines`), qui fournit `node:sqlite`. La CI utilise Node 24 ; le guide d'hébergement recommande Node 24.
- **Serveur** : Express 4, vues EJS (rendu serveur), pas de framework front. JavaScript public écrit fichier par fichier dans `public/js/` ; quelques bundles sont **générés puis versionnés** (voir §4).
- **Base de données** : SQLite (module `node:sqlite`, mode WAL), un seul fichier `KOLAKISA.db`. Sessions stockées dans la même base (`src/config/sessionStore.js`, table `sessions`).
- **Fichiers envoyés** : disque local (`UPLOADS_DIR`), jamais dans la base.
- **Aucune file externe, aucun cache externe, aucun service de journaux** : tout tourne dans un seul processus Node.

## 2. Organisation du code

| Dossier | Rôle |
|---|---|
| `server.js` | Point d'entrée : ordre des intergiciels, démarrage, tâches de fond |
| `src/config/` | Chemins de données, schéma du LMS (`database.js`), sessions, création du compte formateur (`bootstrap.js`) |
| `src/middlewares/` | Sécurité (en-têtes, origine, limiteurs), hôtes et sites (`siteHost.js`), téléversement (`upload.js`), session utilisateur |
| `src/routes/` | Routes publiques et LMS (formations, panier, blog, comptes, webhooks Stripe…) |
| `src/services/` | Services partagés : paiement, e-mail, sauvegardes, santé, domaines, confidentialité, outils CMS |
| `src/marketing/` | Module CMS/marketing : migrations SQL, pages, articles, médias, contacts, e-mails, automatisations, tunnels, commerce, analytics, A/B, API `/api/v1` |
| `src/seo/` | SEO : sitemap, redirections, audits, intégrations Google |
| `src/editor/` | Sources des éditeurs compilés (articles, formations, code de thème) |
| `views/` | Gabarits EJS (administration, site public, e-mails) |
| `public/` | CSS, JS public, polices, images |
| `scripts/` | Sauvegarde, restauration, audits, builds, scripts de recette |
| `tests/` | Suite automatisée (654 fichiers `*.test.js`) |
| `docs/` | Documentation et rapports par palier |

## 3. Composants et responsabilités

- **CMS/Core (moteur partagé)** : Contact Core, bus d'événements `mk_events` et file `mk_jobs`, moteur de pages commun, `cmsAccess` (une seule barrière d'accès à l'administration `/marketing`), moteur de réglages, résolveur d'URL, Email Engine, Automation Engine. Source : audit palier 24 §5, recoupé avec `src/marketing/`.
- **LMS** : formations, chapitres, achats, certificats, quiz, blog. Le schéma est créé par `src/config/database.js` à chaque démarrage (sans suivi de version, voir §6).
- **Sites et domaines** : `mk_site_domains` ; un domaine n'est routé que s'il est **vérifié** par un enregistrement TXT `_kolakisa-verify.<hôte>` (`src/services/siteDomains.js`). Le certificat HTTPS d'un domaine personnalisé relève de l'hébergeur ; l'application ne fait que le contrôler.
- **Fournisseurs externes** : e-mail (SMTP ou fournisseur configuré dans l'interface ; défaut « console » = rien ne part), SMS (Twilio, configuré dans l'interface), paiement (Stripe), IA (Anthropic), Google (Search Console, Analytics, PageSpeed), vidéo (Bunny Stream, facultatif).

## 4. Démarrage, tâches de fond, build

Ordre au démarrage (`server.js`) : variables d'environnement (`dotenv`) → schéma LMS (`src/config/database.js`) → **refus de démarrer en production sans `SESSION_SECRET` solide** (`process.exit(1)`) → création du compte formateur si demandée → **migrations marketing** (`initMarketing`) → Express → `app.listen`. Au `listen` : file d'envoi d'e-mails, sauvegarde quotidienne, purge des visites, tâches SEO (`SEO_JOBS`), et — **seulement si `MARKETING_WORKER=on`** — worker marketing et pont boutique.

Tâches de fond : un seul processus ; aucun planificateur externe. La promotion des pages programmées se fait à la première visite après l'heure prévue (sans worker).

**Bundles générés et versionnés dans git** : `public/js/course-editor.js`, `blog-editor.js`, `seo-fun.js`, `theme-code-editor.js` (`npm run build:editor`) et `automation-flow.js` (`npm run build:automation-flow`). L'hébergeur n'a **rien à compiler** (commande de build vide). Conséquence : toute modification de `src/editor/` exige de relancer le build **et** de commiter le résultat ; **aucun contrôle automatique ne vérifie que les bundles sont à jour**.

## 5. Flux essentiels

1. **Requête publique** : hôte → `attachSite` (site propriétaire du domaine) → `hostPolicy`/`siteIsolation` (421 si hôte inconnu) → en-têtes de sécurité → session → routes. Le site principal et chaque site client sont séparés par `site_id` (NULL = site principal).
2. **Administration** : `/marketing` (CMS) et `/formateur` (LMS) ; sélecteur de site `?site=` validé côté serveur contre `mk_site_members` ; permissions vérifiées côté serveur.
3. **Achat** : panier → Stripe Checkout → webhook signé `POST /stripe/webhook` → commande, accès, événement. **Sans `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`, aucun paiement réel n'est possible en ligne** (état de production : voir checklist).
4. **E-mail marketing / automatisations** : événement → file `mk_jobs` → worker (si `MARKETING_WORKER=on`) → fournisseur d'envoi.
5. **Publication d'une page** : brouillon (révisions) → publication → rendu serveur identique pour le canevas, l'aperçu et le site public.

## 6. Base de données et migrations (résumé)

Trois mécanismes distincts — détail dans `KOLAKISA_DEPLOYMENT_RUNBOOK.md` §6 :

1. **Migrations SQL numérotées du module marketing** (`src/marketing/migrations/`, 99 fichiers, numéros 001 à 114 avec trous) : appliquées **uniquement au démarrage**, chacune dans sa transaction, suivies dans `schema_migrations` avec somme de contrôle ; une **copie `AVANT-MIGRATION-*.db`** est créée avant toute migration en attente (si la base contient des utilisateurs).
2. **Schéma du LMS** : `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ADD COLUMN` conditionnels à **chaque démarrage**, sans suivi ni sauvegarde préalable.
3. **Migration « R9 »** hors runner (`scripts/r9/`), appliquée à la main sur une base donnée.

Vérifié le 2026-10-29 : démarrage d'un serveur sur une base restaurée à blanc → les 99 migrations sont appliquées, 114 est la dernière version, la copie `AVANT-MIGRATION-*` est créée, `/sante` répond `ok`. Voir le rapport.

## 7. Limites architecturales connues

- **Un seul processus, un seul disque** : base, fichiers et sauvegardes automatiques sont sur le même disque (`src/services/backups.js`). Perdre le disque = tout perdre, sauf copie téléchargée à la main.
- **Compteurs de limitation de débit et de connexion en mémoire** : remis à zéro à chaque redémarrage, non partagés entre instances (`src/middlewares/security.js`).
- **Pas de jeton CSRF** : seule défense, le contrôle `Origin`/`Referer` (`sameOriginOnly`) plus `SameSite=Lax` ; une requête sans ces en-têtes passe (palier 17, limite 11).
- **CSP minimale** : `object-src 'none'; base-uri 'self'; frame-ancestors 'self'` ; `script-src` n'est pas restreint.
- **Doublons de sources de vérité** D-01 à D-11 jamais fusionnés (`docs/audit-global-palier-24/05-sources-de-verite.md`).
- **Une migration marketing en échec n'empêche pas le démarrage** : le module marketing est alors inactif (`marketing.ready=false`) alors que `/sante` répond quand même `ok`.
- **Pas de préproduction permanente** : seulement des outils de répétition (`scripts/r9/`).
- Les 13 limites de sécurité du palier 17 restent ouvertes : `docs/KOLAKISA_PALIER17_LIMITATIONS.md`.
