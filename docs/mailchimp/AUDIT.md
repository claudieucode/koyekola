# Intégration Mailchimp — Phase 0 : audit de l'existant

*2026-10-30, branche `mailchimp-integration` (issue de `main` 3abf0fd1). Audit en lecture seule : aucun code applicatif modifié.*

## 1. Constat principal
Kolakisa n'est pas « une application d'emailing à brancher sur Mailchimp » : c'est un CMS + LMS qui contient **déjà une plateforme d'e-mailing complète** (`src/marketing`, ~108 migrations, ~700 fichiers de tests) conçue pour égaler Mailchimp fonctionnellement (`docs/email-marketing/00…14`, `EMAIL_MARKETING_*.md`). **Aucun appel à l'API Mailchimp n'existe** : « mailchimp » n'apparaît que dans la documentation et dans des noms de tests (`marketing-refonte-mailchimp.test.js`). Intégrer Mailchimp signifie donc **un connecteur vers un service externe, à côté du moteur interne**, pas un remplacement.

## 2. Stack
| Élément | Réalité |
|---|---|
| Runtime | Node ≥ 22.12 (24 en local), Express 4, EJS, sessions `express-session` |
| Base | `node:sqlite` (synchrone), migrations numérotées `src/marketing/migrations` (dernière : 123), transactions `db/tx.js` (SAVEPOINT) |
| Front | EJS + JavaScript natif (`public/js`), CSS maison (`cms.css`) ; aucun framework front |
| Dépendances | express, ejs, nodemailer, sanitize-html, htmlparser2, pdfkit, multer, bcryptjs, `@anthropic-ai/sdk`. **Pas de client HTTP tiers** (fetch natif via `connectors/http.js`), **pas de lib de cron/queue** |
| Tests | `node --test`, vrais serveurs et bases ; Chrome/Firefox pour l'UI |
| Auth / droits | Sessions, organisations → sites (`site_id NULL` = principal), rôles et permissions (`organizations.js`), clés d'API (`mk_api_keys`) |
| Secrets | `ENCRYPTION_KEY` (AES-256-GCM lié à un contexte, `security/crypto.js`), stockés dans `mk_settings` |

## 3. Ce qui existe déjà et recouvre le brief
| Besoin du brief | Existant | Fichiers |
|---|---|---|
| Audiences, contacts, statuts, tags, propriétés (merge fields) | `mk_lists`, `mk_list_members`, `mk_contacts`, `mk_tags`, `mk_contact_tags`, `mk_property_defs` ; import CSV avec rejets, export, fusion, doublons | `audience/*`, `import/*` |
| Segments | moteur unique | `segments/` |
| Campagnes, A/B, planification, test, RSS | `mk_campaigns`, `mk_campaign_recipients`, `mk_messages`, `mk_rss_campaigns` ; A/B avec test du Z, pause auto sur plaintes/rebonds | `sending/*`, `rss/` |
| Modèles | 15 modèles, éditeur de blocs, lint, contrôle des liens, versions | `templates/*` |
| Automatisations | moteur à graphe, journal, simulation, historique | `automations/*` |
| Rapports | stats, comparaison, attribution, rapports enregistrés | `analytics/*`, `sending/stats.js` |
| Formulaires, landing pages, sondages | `mk_forms`, `mk_landing_pages`, `mk_surveys` | `forms/`, `landing/` |
| Webhooks | **sortants** (`mk_webhook_endpoints`, secret chiffré, anti-SSRF, relances) ; entrants : suivi d'envoi (Resend) uniquement | `webhooks/*`, `sending/webhooks.js` |
| E-commerce | boutique native par site (`mk_shop_*`) | `shop/` |
| Conformité | consentements, suppressions, désinscriptions, préférences, effacement | `compliance/*` |
| File de travaux | `mk_jobs` + worker (bail, relance avec gigue, abandon) | `queue/jobs.js`, `worker.js` |
| **Cadre de connecteurs externes** | registre d'adaptateurs, `mk_connections` (par organisation et site), secrets chiffrés, test de connexion, journal sans secret, capacités typées, client HTTP durci | `src/services/connectors/*` |
| Planification périodique | `setInterval` dans `marketing/index.js` ; pas de cron | |

## 4. Écarts réels par rapport au brief
1. **Le cadre de connecteurs ne connaît que la capacité `text.generate`** (4 adaptateurs IA). Il n'y a ni capacité d'audience/campagne, ni adaptateur d'e-mail externe. Il faut **étendre ce cadre** (nouvelles capacités + un adaptateur Mailchimp), pas créer un second système de clés/chiffrement.
2. **Pas de synchronisation, pas de table de correspondance** entre objets locaux et objets Mailchimp (liste ↔ audience, contact ↔ membre, campagne ↔ campagne). À créer (migration 124 ou suivante, numéro à reverifier avant écriture).
3. **Pas de point d'entrée de webhooks entrants génériques** ; il faut une route publique dédiée avec journal.
4. **Pas de planificateur horaire** robuste : à construire sur `mk_jobs`, pas avec une nouvelle bibliothèque.
5. **Multi-tenant** : tout est borné par organisation et site (`siteTarget`, `routeScopes`, tests d'isolation). Une connexion Mailchimp doit l'être aussi (une clé par organisation/site), ce que `mk_connections` permet déjà.
6. Docs et noms d'écrans existants à respecter : « Marketing », « Connecteurs », « Webhooks » (`views/marketing/connectors.ejs`, `webhooks.ejs`).

## 5. Points du brief à corriger avant de bâtir dessus
| Point du brief | Réalité à confirmer en Phase 1 | Conséquence |
|---|---|---|
| « Vérifier la signature HMAC des webhooks Mailchimp » | À ma connaissance, **les webhooks Mailchimp Marketing ne sont pas signés**. Les protections usuelles : un jeton secret dans l'URL du webhook, vérification que l'audience/le contact existent, et revérification de l'état par appel API | Je ne prétendrai pas à une signature HMAC inexistante ; je mettrai un jeton secret par webhook (comparaison à temps constant) + relecture API |
| « Limite 10 requêtes/seconde » | La limite documentée est de **10 connexions simultanées** (et un délai d'attente de 120 s), pas 10 req/s | Limiteur de **concurrence** (≤ 10, par défaut 8) + backoff sur 429 |
| « Landing pages, Authorized apps, Account users, Transactional (Mandrill) » | Les landing pages, les applications autorisées et l'activité de compte existent dans l'API Marketing, mais « utilisateurs du compte » n'a probablement pas de point d'accès. **Mandrill/Transactional est une API distincte** (clé et facturation séparées, module complémentaire payant) | À vérifier endpoint par endpoint dans la doc officielle ; ce qui n'existe pas sera marqué « non disponible dans l'API », pas simulé |
| « ZÉRO placeholder, tout testé avec données réelles » | **Aucune clé Mailchimp n'est disponible** dans cet environnement | Les tests utiliseront un faux serveur Mailchimp local (contrats de l'API) ; rien ne sera annoncé « validé contre Mailchimp » sans clé réelle |
| « Mailchimp fait autorité » en cas de conflit | Contredit la règle actuelle : le moteur interne gère consentements et suppressions (conformité) | Exception à décider (voir §7) : un désabonnement ou une plainte ne doit jamais être annulé par une synchro |

## 6. Dépendances
Rien à ajouter : `fetch` natif, `crypto` natif, `mk_jobs` pour la file. Variables d'environnement : `ENCRYPTION_KEY` (existe déjà) ; la clé Mailchimp se saisit dans l'écran (chiffrée en base), pas dans `.env` (comme les autres connecteurs). Éventuellement `PUBLIC_BASE_URL` pour l'adresse des webhooks (à vérifier dans `urls.js`).

## 7. Décisions à prendre avant la Phase 2
1. **Nature de l'intégration** : (a) *connecteur de synchronisation* (recommandé) : Kolakisa reste la source des contacts et des consentements, Mailchimp reçoit/renvoie audiences, membres, campagnes, rapports ; (b) *console Mailchimp complète* : l'application pilote Mailchimp à la place du moteur interne (double emploi avec l'existant, conformité à deux endroits).
2. **Autorité en cas de conflit** : recommandation — désabonnements, plaintes et rebonds : le plus restrictif gagne ; autres champs : Mailchimp.
3. **Périmètre de la première livraison** : l'ensemble du brief représente plusieurs programmes ; ordre proposé : connexion + audiences/membres + webhooks entrants + synchro → campagnes/modèles → rapports → automatisations → landing pages/formulaires/boutiques → compte. Transactional (Mandrill) en dernier, séparé.

## 8. Ce qui n'a pas été fait
Phase 1 et suivantes non commencées. Aucun appel réseau vers Mailchimp. Aucune lecture de la documentation officielle à ce stade (les points §5 sont à vérifier).

## 9. Décisions retenues pour la suite (autonomie accordée par l'utilisateur)
Les trois décisions du § 7 ont été tranchées selon les recommandations de l'audit :
1. **Connecteur de synchronisation** (pas une console qui remplace le moteur interne).
2. **Le plus restrictif gagne** pour le consentement, les désinscriptions, rebonds, plaintes et suppressions ; Mailchimp fait autorité pour le reste.
3. **Tous les lots** ont été réalisés dans l'ordre proposé (connexion, audiences et membres, webhooks, synchronisation → campagnes et modèles → rapports → automatisations → pages, formulaires, boutiques → compte → Transactionnel).

L'architecture réalisée, ses écarts avec le cahier des charges et les raisons sont dans `INTEGRATION_PLAN.md` ; les preuves dans `TEST_RESULTS.md`.
