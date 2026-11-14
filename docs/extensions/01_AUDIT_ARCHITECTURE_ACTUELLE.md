# Extensions — Phase 1 : audit de l'architecture actuelle

Audit en lecture seule, fait sur `origin/main` (commit `e6539f94`). Aucun fichier n'a été modifié ni déplacé. Chaque constat cite le fichier qui le prouve.

## 1. Résumé en cinq phrases
1. Un **socle « modules par site » existe déjà** (lot R7) : un registre fermé de 6 modules, une table `mk_site_modules`, une garde de routes par expression régulière, une page d'activation par site. Il ne faut **pas le remplacer**, il faut le faire grandir.
2. Un menu **« Extensions » existe déjà** dans la navigation du CMS (icône `plug`, une seule rubrique « Modules », lecture seule, réservée à l'équipe).
3. **Commerce** vit dans `src/marketing/shop` (27 fichiers, ~4 300 lignes) et 58 tables `mk_shop_*` ; **le module « commerce » ne ferme que la boutique publique, l'API, les webhooks et les widgets — pas les écrans d'administration ni le menu « Boutique »**. C'est l'écart principal avec votre demande.
4. Le **LMS** est une application plus ancienne, à la racine (`src/routes/courses|learning|instructor|cart|orders…`, ~2 150 lignes, 30 tables sans préfixe), rattachée aux sites par `mk_course_sites` ; il est déjà « fermé par défaut » sur le public d'un site sans module, mais **n'a aucune entrée dans le menu du CMS** (il vit sous `/formateur`).
5. Le registre est **codé en dur** (`Object.freeze` dans `siteModules.js`) : il n'y a ni manifeste, ni version, ni dépendances, ni point d'entrée déclaré, ni historique propre. C'est ce qu'il faut construire.

## 2. Socle existant : le lot R7 « modules par site »
| Élément | Fichier | Ce qu'il fait |
|---|---|---|
| Registre fermé | `src/marketing/siteModules.js` | `MODULES` = sms, ai, social, scoring, commerce, lms (libellé, phase, `ready`) |
| Table | `src/marketing/migrations/084_modules_par_site.sql` | `mk_site_modules(site_id, organization_id, module, enabled, updated_by, updated_at)`, clé `(site_id, module)`, déclencheurs : le site doit appartenir à l'organisation, champs immuables |
| Sémantique | idem | **pas de ligne = désactivé** ; **site principal = jamais soumis** (toujours actif) ; désactiver ne supprime rien |
| Garde de routes | `siteModules.ROUTES` + `denies()` + `web/index.js:52` | seuls les accès **limités à un site** sont refusés ; l'équipe n'est jamais bloquée. Regex : sms, social, scoring, ia, `commerce → /revenus` seulement |
| Garde de services | `assertEnabled(ctx, module)` | utilisée par SMS, IA boutique, revenus |
| Écran d'activation | `web/siteModules.js`, `views/marketing/site-modules.ejs` | `/site-web/sites/:id/modules`, permission `sites.modules` + équipe seulement |
| Journal | `recordAudit` (`site_module.enabled/disabled`) | une trace par changement (n'échoue jamais bloquante) |
| Matrice | `web/cmsData.js moduleMatrix`, `cmsScreens.extensions` | tableau sites × modules en lecture seule |
| Tests | `tests/modules-par-site.test.js` (213 lignes), `lms-par-site*.test.js` | à rejouer comme référence avant tout changement |

Limites du socle, par rapport à votre demande :
- registre non extensible sans modifier le noyau (liste dans le code) ;
- aucune notion de manifeste, version, compatibilité, dépendances entre extensions, permissions déclarées, menus déclarés, tâches, hooks ;
- activation **non atomique** (un `INSERT … ON CONFLICT`, sans étapes) et sans confirmation ;
- historique limité au journal d'audit général (pas de vue « Historique et activité » par extension) ;
- pas de cache de l'état d'activation (une requête SQL par contrôle).

## 3. Module Commerce (Boutique)
**Code** : `src/marketing/shop/*` (catalog, orders, cart, customers, payments, gateways, subscriptions, appointments, giftLists, invoices, refunds, reports, reviews, downloads, access, deliverySlots, abandoned, compare, wishlist, seo, notify…), `src/marketing/web/shopAdmin.js` (admin), `shopPublic.js` (public), `shopRdv.js`, `shopAbonnements.js`, `shopWebhooks.js`, `src/marketing/api/shop.js` (API), `src/marketing/ai/shop/*`, `web/aiShop.js`, `bridge/commerce.js`, `revenue/index.js`, widgets `pages/widgets/shop.js`.
**Données** : migrations 121 → 152 (boutique, avis, comparateur, âge, créneaux, accès membre, rendez-vous, listes cadeaux, abonnements, remboursements, factures, téléchargements, taxes/expédition, paniers abandonnés, passerelles, promotions) = **58 tables `mk_shop_*`**. Chaque table porte `organization_id` et `site_id` (NULL = site principal, index unique `COALESCE(site_id,0)` sur les réglages).
**Où le module « commerce » est vérifié aujourd'hui** (relevé complet) : boutique publique (`shopPublic.js:66`, 404), webhooks (`shopWebhooks.js:21`), API (`api/shop.js:33`, 403), IA boutique (`ai/shop/project.js`), revenus (`revenue/index.js:118`), widgets de pages (`widgets/shop.js`, `footer.js`, `pages/query.js`), plan du site (`seo/sitemap.js:97`), assistant de modèles (`templateCatalog.js:196`).
**Où il n'est PAS vérifié** :
- `shopAdmin.js` : `route()` applique `need(permission)` et le site de l'espace, **pas** le module ; `moduleOn` est seulement passé à la vue (affichage). Les écrans `/boutique/*` d'un site restent donc ouverts si la personne a `shop.*`.
- `cmsNav.js:73` : le groupe « Boutique » est **écrit en dur** dans le registre de navigation, et `ABILITY` (l. 324-327) le déclare « ouvert » pour tout site.
- `shopRdv.js`, `shopAbonnements.js` : héritent de la garde publique, mais leurs écrans d'admin héritent de `shopAdmin.js` (même écart).
- `siteModules.ROUTES.commerce` ne couvre que `/revenus`.
**Permissions** : `shop.read`, `shop.write`, `shop.orders`, `shop.payments`.

## 4. Module LMS (Formations)
**Code** : `src/routes/courses.js` (356), `learning.js` (467), `instructor.js` (838), `cart.js`, `orders.js`, `tunnelOffers.js`, `support.js`, `favorites.js` ; services `lmsSites.js`, `courses`, `offers`, `courseCategories`, `certificates` ; pont `marketing/bridge/lms.js` ; automatisations `automations/library/formation.js|courses.js` ; gabarits `marketing/templates/courses.js`.
**Données** : `courses`, `sections`, `lessons`, `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `enrollments`, `lesson_progress`, `reviews`, `orders`, `order_items`, `certificates`, `coupons`, `offers`… (schéma créé dans `src/config/database.js`, sans préfixe `mk_`). Rattachement à un site : table `mk_course_sites(course_id, site_id)` (migration 119) ; **formation sans ligne = site principal**. Sections, leçons, inscriptions, progression, quiz et certificats héritent du site par leur formation.
**Isolation** : `req.lmsSite` est déduit du **domaine** (`lmsSites.attach`, `server.js:74`), jamais de la requête. Domaine de site **sans** module `lms` actif → `0` → rien n'est visible (fermé par défaut). Chaque route filtre par `scopeSql`/`belongsTo`.
**Administration** : sous `/formateur` (`requireInstructor`), avec les rôles hérités de l'ancienne application (`users.role`), **séparés** du système de permissions du CMS (`/marketing`). Aucune entrée « Formation » dans `cmsNav.js`.
**Écart avec votre demande** : pas de menu « Formation » piloté par l'activation ; l'espace `/formateur` n'est pas masqué quand le module est désactivé pour le site (seul le contenu public l'est) ; les rôles enseignants/étudiants ne passent pas par `effectivePermissions`.

## 5. Multisite, permissions, navigation
- **Contexte de site** : `siteContext.resolve` (par requête, jamais d'état partagé), `req.mk = { site, siteId, siteOnly, can, ctx{ siteScope | siteFilter } }` (`web/index.js`). `siteScope` est imposé par le serveur pour un accès limité à un site.
- **Permissions** : `access.effectivePermissions(user, {organizationId, siteId})`, catalogue dans `services/cmsAccess.js`, `permission` (`sites.modules`, `shop.*`) vérifiée par `need()` sur chaque route.
- **Navigation** : registre unique `cmsNav.js` (groupes + `ABILITY` qui dit ce que chaque entrée devient dans l'espace d'un site : `link / open / central / bientôt`) ; le menu du site principal et celui d'un site sont deux présentations du même registre. **Rien n'y est dynamique** : les entrées sont des littéraux.
- **Journal** : `audit.js` / `auditJournal.js` (`recordAudit`), historique général.
- **Migrations** : fichiers SQL numérotés `src/marketing/migrations/001…152`, appliqués au démarrage ; la 143 (`identity_mode`) et la 152 sont les plus récentes. Les migrations du LMS sont dans `config/database.js` + `config/siteColumns.js` (ajouts de colonnes idempotents).
- **Déploiement** : un envoi sur `main` met `kolakisa.com` à jour (Hostinger Git) ; un test d'isolation est exigé avant (`CLAUDE.md`).

## 6. Dépendances entre modules (à ne pas casser)
| Consommateur | Dépend de | Effet d'une désactivation |
|---|---|---|
| Plan du site (`sitemap.js`) | commerce | produits retirés (déjà géré) |
| Widgets de pages / pied de page | commerce | rendu vide (déjà géré) |
| Theme Builder « boutique » (pages) | commerce | modèles sans effet public |
| Automatisations (`library/commerce`, `formation`, `courses`) | commerce, lms | scénarios « indisponibles » (`availability.js`) |
| Scoring des contacts | commerce, lms (événements) | événements ignorés |
| Ponts `bridge/commerce.js`, `bridge/lms.js` | les deux | à rendre sensibles à l'état d'activation |
| Assistant de site (`siteWizard`) | tous (`kind: "module"`) | il active déjà les modules via `setEnabled` |
| IA boutique, Revenus | commerce | `assertEnabled` déjà en place |

## 7. Risques identifiés
1. **Régression sur le site principal** : il n'est jamais soumis à l'activation ; la nouvelle architecture doit préserver cette règle ou migrer explicitement (décision à valider).
2. **Écrans d'admin ouverts malgré la désactivation** (Commerce, LMS) : nouvelle garde serveur à ajouter ; elle change un comportement visible → tests de non-régression.
3. **Menus en dur** : passer à un menu calculé touche `cmsNav.js`, fichier partagé sensible ; modification à faire seule, avec `git fetch` et relecture du diff.
4. **Deux systèmes de droits** (marketing vs `/formateur`) : le LMS ne sera pas « permissionné » par le noyau sans pont.
5. **LMS sans préfixe de table** : impossible de le déplacer/renommer sans risque ; on garde les tables telles quelles.
6. **Activation atomique** : SQLite synchrone (better-sqlite3) permet une vraie transaction ; les effets de bord hors base (cache, fichiers) doivent être faits après validation.
7. **Charge** : une requête SQL par contrôle d'activation ; à remplacer par un cache par site invalidé à chaque changement.
