# Funnel Studio — Audit initial de KOLAKISA (état réel de `main`)

Date : 2026-10-27 · Dépôt `claudieucode/koyekola` · Branche `main` au commit `67134ee5` (828 commits).

> Une première version de cet audit, faite sur un clone local obsolète (79 commits), concluait à tort qu'il n'existait ni multi-sites, ni tunnels, ni moteur de pages. Elle a été écartée. Ce document décrit le code actuel.

## 1. Constat

KOLAKISA possède **déjà** un module Tunnels complet et intégré, construit en plusieurs phases (voir `docs/cms-tunnel.md`). Funnel Studio n'est donc pas une création from scratch : le travail consiste à **combler les écarts réels** par rapport à systeme.io, sans second moteur.

| Système | État | Où |
|---|---|---|
| Tunnels et étapes | ✅ | `src/marketing/funnels/` (index, events, analytics, abandon, templates), migrations 039 et 064, UI `views/marketing/funnels.ejs` / `funnel.ejs`, routes `src/marketing/web/funnels.js` |
| Moteur de pages commun (Site Web ⇄ Tunnels) | ✅ | `src/marketing/pages/*` ; une étape est une **référence** vers une page (jamais une copie) ; éditeur unique `/marketing/pages/:id/editeur` ; rendu `/p/<adresse>` |
| Multi-sites et isolation | ✅ | `mk_sites`, `site_id` sur tunnels, pages, formulaires, contacts, médias, thèmes… (migrations 070 à 101) ; le serveur refuse une page d'un autre site ; accès limité à un site |
| Droits | ✅ | `funnels.read` / `funnels.write`, `pages.publish`, `forms.write` (rôles personnalisables) |
| Formulaires, consentement, double opt-in | ✅ | `src/marketing/forms`, `mk_pending_confirmations` |
| Contacts / Contact Core, étiquettes, segments | ✅ | `audience`, `contactcore` |
| Emailing, automatisations, SMS | ✅ | déclencheurs `funnel.step_reached`, `funnel.completed`, etc. |
| Événements de tunnel | ✅ | `funnels/events.js` (entered, step_reached, step.completed, completed, cta.clicked, abandoned) |
| Statistiques par étape, abandon | ✅ | `funnels/analytics.js`, `abandon.js` ; ventes réelles par formation attribuées aux tunnels |
| Modèles de tunnels | ✅ (9) | `funnels/templates.js` |
| Tests A/B de pages | ✅ | `pages/abtests.js`, `/marketing/pages/:id/test-ab` |
| Paiement Stripe (formations) | ✅ | `services/payments.js`, `routes/orders.js`, webhook signé `routes/stripeWebhook.js`, remboursements tracés ; test `paiement-stripe.test.js` |
| Codes promo | ✅ (panier) | `coupons`, `sales.applyCoupon` |
| **Étapes de paiement dans un tunnel** (bon de commande, upsell, downsell, order bump) | ❌ → **réalisé dans ce jalon** | voir `MATRICE_PARITE.md` |
| Domaines personnalisés par tunnel | ❌ / infra | `src/marketing/domains` (domaines d'envoi e-mail) ; le routage par domaine public dépend de l'hébergement |
| Variables de page `{{funnel.*}}`, aperçu du tunnel entier, route de tunnel distincte | ❌ | listés comme limites dans `docs/cms-tunnel.md` |

## 2. Conventions du dépôt

Node ≥ 22.12, Express 4, EJS, SQLite natif. Migrations marketing `src/marketing/migrations/NNN_*.sql` (figées par test) ; tables du LMS créées dans `src/config/database.js` (colonnes ajoutées avec `PRAGMA table_info` + `ALTER`). Tests `node --test` (≈ 2 400), serveur réel + base temporaire (`tests/helpers.js`). Code et commentaires en français.

## 3. Risques de régression

- Le type d'étape est validé par le code (pas de `CHECK` SQL) : ajouter des types est sans migration.
- `describeStep` sert au rendu public, à la publication et à la santé du site : tout nouveau type doit renvoyer `path` et `live`.
- Le retour de paiement (`/commande/retour/:ref`) est partagé avec la boutique : le comportement historique (panier vidé, confirmation) est conservé quand la session ne vient pas d'un tunnel.
