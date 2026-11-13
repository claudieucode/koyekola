# Données actuelles de la boutique et plan de migration

Audit du 12/11/2026, branche `boutique-audit`. Source : migrations `src/marketing/migrations/121, 122, 127, 131, 133 à 139` + `src/config/database.js` (formations). Aucune donnée de production lue : tout vient du code SQL.

## 1. Principes du modèle actuel

- Base **SQLite** (une seule), `PRAGMA foreign_keys = ON`, journal WAL (`src/config/database.js:5,687`). Pas de serveur de base distinct.
- Boutique = tables `mk_shop_*`, créées par migrations numérotées (`src/marketing/db/migrate.js`) : une transaction par migration, empreinte SHA-256 vérifiée (une migration appliquée ne se modifie JAMAIS), sauvegarde automatique `AVANT-MIGRATION-…db` (via `VACUUM INTO`, 10 conservées) avant toute migration sur une base contenant des données.
- **Portée** : chaque table métier porte `organization_id NOT NULL` et `site_id` (NULL = site principal). Les unicités utilisent `COALESCE(site_id, 0)`. Le serveur fournit la portée (`s = {db, organizationId, siteId}`), jamais le navigateur.
- **Montants** : entiers en plus petite unité de la devise (`*_cents`), taux de taxe en points de base (`rate_bp`, 2000 = 20 %). Aucun flottant stocké.
- **Dates** : texte `AAAA-MM-JJ HH:MM:SS` en UTC (`datetime('now')`) ; rendez-vous : heure « murale » de la boutique ; `mk_ai_shops` : entiers (millisecondes).
- **JSON dans des colonnes TEXT** : `tags`, `gallery`, `attributes`, `payment_methods`, `addresses`, `billing_address`, `shipping_address`, `tax_lines`, `countries` (zones), `product_ids` / `category_ids` (coupons), `options` (variantes), `weekdays` / `excluded_dates` (créneaux). Pratique mais non indexable ni filtrable en SQL propre.
- **Instantanés** : une ligne de commande copie nom, SKU, libellé de variante, prix, taxe (le produit peut changer ou disparaître : `product_id` sans clé étrangère sur `mk_shop_order_items`).

## 2. Tables (ordre fonctionnel)

Légende : PK = clé primaire ; FK = clé étrangère ; U = unicité ; I = index. « Portée » = présence de `organization_id` / `site_id`.

### 2.1 Cœur (migration 121)

| Table | Colonnes clés | Index / unicités | FK | Portée |
|---|---|---|---|---|
| `mk_shop_settings` | enabled, currency, prices_include_tax, tax_enabled, default_country, guest_checkout, low_stock_threshold, payment_methods (JSON), manual_instructions, notify_email, order_prefix, next_order_number, + (131) reviews_enabled, reviews_auto_publish | U `(organization_id, COALESCE(site_id,0))` ; I `site_id` (127) | org ; site CASCADE | oui |
| `mk_shop_categories` | parent_id, name, slug, description, image_url, position | U `(org, COALESCE(site,0), slug)` ; I `parent_id`, `site_id` | parent SET NULL ; site CASCADE | oui |
| `mk_shop_products` | type (simple, variable, digital, downloadable, grouped), status (draft, published, archived), name, slug, short_description, description, sku, price_cents, sale_price_cents, sale_starts_at/ends_at, manage_stock, stock_qty, weight_grams, length/width/height_mm, requires_shipping, image_url, gallery, tags, attributes, is_featured, seo_title/description, position, created_by, deleted_at | U partiel slug et SKU (`deleted_at IS NULL`) ; I `(org, site, status, deleted_at)`, `site_id` | org ; site CASCADE | oui |
| `mk_shop_product_categories` | PK `(product_id, category_id)` | I `category_id` | CASCADE des deux côtés | via produit |
| `mk_shop_variants` | product_id, sku, options (JSON), options_key, price_cents, sale_price_cents, manage_stock, stock_qty, weight_grams, image_url, active | U `(product_id, options_key)` ; U partiel SKU par site | product CASCADE | oui |
| `mk_shop_stock_movements` | product_id, variant_id, delta, reason (order, release, adjustment), order_id, user_id | I `(product_id, created_at)` | **aucune FK** | oui (sans FK) |
| `mk_shop_carts` | token_hash (SHA-256), customer_id, status (open, converted, abandoned), coupon_code, version | U `token_hash` ; I `(customer_id, status)`, `site_id` | org ; site CASCADE | oui |
| `mk_shop_cart_items` | cart_id, product_id, variant_id, quantity, + (131) custom_text | U `(cart_id, product_id, COALESCE(variant_id,0), COALESCE(custom_text,''))` ; I product_id, variant_id | cart CASCADE ; product CASCADE ; variant CASCADE | via panier |
| `mk_shop_customers` | email, password_hash (NULL = invité), name, phone, status, addresses (JSON), marketing_opt_in | U `(org, COALESCE(site,0), email)` ; I `site_id` | org ; site CASCADE | oui |
| `mk_shop_customer_tokens` | customer_id, kind (session, reset), token_hash, expires_at, used_at | U `token_hash` ; I customer_id | customer CASCADE | `site_id` seul |
| `mk_shop_shipping_zones` | name, countries (JSON), position | I site_id | org ; site CASCADE | oui |
| `mk_shop_shipping_methods` | zone_id, name, kind (flat, free_over, weight), cost_cents, min_subtotal_cents, min/max_weight_grams, active, position, + (135) requires_slot | I zone_id, site_id | zone CASCADE | oui |
| `mk_shop_tax_rules` | name, country (ou `*`), region, rate_bp (0 à 10000), applies_to_shipping, priority | I site_id | org ; site CASCADE | oui |
| `mk_shop_coupons` | code, kind (percent, fixed), value, min_subtotal_cents, starts_at, ends_at, max_uses, used_count, per_customer_limit, product_ids, category_ids, active | U `(org, COALESCE(site,0), code)` ; I site_id | org ; site CASCADE | oui |
| `mk_shop_coupon_redemptions` | PK `(coupon_id, order_id)`, customer_email | I order_id | coupon CASCADE ; order CASCADE | via coupon |
| `mk_shop_orders` | number, customer_id, email, status (7), payment_status (5), payment_method, currency, prices_include_tax, subtotal/discount/shipping/tax/total_cents, coupon_code, shipping_method_name, billing_address, shipping_address, tax_lines, tracking_number, idempotency_key, stock_released, paid_at, + (134) age_confirmed_at/min, + (135) delivery_slot_id/date/start/end | U `(org, COALESCE(site,0), number)` ; U `(…, idempotency_key)` ; I `(org, site, status, created_at)`, customer_id, site_id, `(delivery_slot_id, delivery_date)` | org ; site CASCADE ; customer (sans action) ; slot SET NULL | oui |
| `mk_shop_order_items` | order_id, product_id, variant_id, name, variant_label, sku, quantity, unit_price_cents, line_subtotal_cents, discount_cents, tax_cents, requires_shipping, weight_grams, + (131) custom_text, custom_label | I order_id | order CASCADE ; product/variant : **sans FK** (voulu) | via commande |
| `mk_shop_order_events` | order_id, kind, from_status, to_status, actor, note | I `(order_id, id)` | order CASCADE | via commande |
| `mk_shop_payments` | order_id, provider, provider_ref, provider_intent, amount_cents, currency, status (pending, succeeded, failed, cancelled, refunded), failure_reason | U partiel `(provider, provider_ref)` ; I order_id | order CASCADE | oui |
| `mk_shop_webhook_events` | PK `(provider, event_id)` | — | — | **globale, sans org/site** |
| `mk_shop_notifications` | order_id, event, recipient, status (queued, failed, not_configured), error | U partiel `(order_id, event, recipient)` si `queued` | order CASCADE | oui |

### 2.2 Briques de boutique (131, 133, 134, 135, 136)

| Table | Rôle | Remarques |
|---|---|---|
| `mk_shop_reviews` | avis, un par `(order_id, product_id)`, statut pending/published/rejected | liée à la commande : pas d'avis sans achat |
| `mk_shop_product_personalization` | réglage de personnalisation d'un produit | PK = product_id |
| `mk_shop_wishlists`, `mk_shop_wishlist_items` | souhaits par jeton de navigateur (+ client) | jeton haché |
| `mk_shop_product_specs` | caractéristiques (comparateur) | |
| `mk_shop_product_age`, `mk_shop_category_age` | âge minimum 16/18/21 | |
| `mk_shop_delivery_slots` | créneaux récurrents (JSON weekdays, capacité) | |
| `mk_shop_members`, `mk_shop_invitations`, `mk_shop_access_rules`, `mk_shop_sales`, `mk_shop_sale_targets` | accès membre, codes, règles, ventes privées | `access_rules` unique `(kind, target_id)` **sans portée dans l'unicité** (les identifiants sont globaux : sans conséquence) |

### 2.3 Rendez-vous (137), listes cadeaux (138), abonnements (139)

- Rendez-vous : `mk_shop_appt_settings`, `_types`, `_rules`, `_exceptions`, `mk_shop_appointments` (unicité `(org, site, start_at)` pour les non annulés).
- Listes cadeaux : `mk_shop_gift_lists`, `_items` (CHECK `offered <= wanted`), `_cart_links`, `_order_lines`.
- Abonnements : `mk_shop_sub_plans`, `_sub_products`, `mk_shop_subscriptions`, `_sub_orders` (U sur `stripe_invoice_id`), `_sub_events`.

### 2.4 Constructeur IA (122)

`mk_ai_shops` (brief, analyse, plan, structure, **brouillons de produits**, config proposée, `applied_json`), `mk_ai_shop_events`, `mk_ai_shop_states` (undo/redo). Ne contient aucune donnée commerciale vivante.

### 2.5 Commerce de formations (distinct, `src/config/database.js`)

`orders` (user_id, total_cents), `order_items` (course_id, price_cents), `order_refunds` (stripe_refund_id unique), `checkout_sessions` (ref, stripe_session_id, items_json, coupon, total), `coupons` (par formateur, `code UNIQUE`), `offers`. **Aucune** portée site/organisation. Ces tables ne doivent PAS être fusionnées avec `mk_shop_*` sans décision explicite (voir §6).

### 2.6 Tables liées hors boutique

`mk_site_modules` (migration 084) : interrupteur du module « commerce » par site. `mk_sites` (parents de tous les `site_id`). Theme Builder : `mk_tb_*` (publication des modèles `single_product` / `product_archive`, conditions par catégorie/étiquette de produit lues dans `mk_shop_categories` et `mk_shop_products.tags`, `themeBuilder/publication.js:106-130`).

## 3. Particularités et risques du modèle

1. **Pas de table de remboursements** pour la boutique : un remboursement n'existe que comme statut (`status = refunded`, `payment_status = refunded`) et événement texte. Impossible de stocker un remboursement partiel, de réconcilier avec Stripe, de remettre le stock par ligne. (Les formations ont `order_refunds`.)
2. **`mk_shop_stock_movements` sans clé étrangère** et jamais lu : données mortes aujourd'hui ; utile comme base d'un journal d'inventaire.
3. **Une seule règle de taxe par commande** : `mk_shop_orders.tax_lines` (JSON) peut déjà contenir plusieurs lignes, mais `calc.computeTotals` n'en produit qu'une (+ port). Évoluer vers des classes de taxe demande de stocker la classe sur le produit sans toucher aux commandes existantes (leurs `tax_lines` restent valides).
4. **Clés de paiement hors base** (variables d'environnement serveur). Une passerelle par site demande une table de configuration chiffrée (le dépôt a déjà `ENCRYPTION_KEY`), à ajouter.
5. **Clients** : `mk_shop_customers.email` unique par site ; `marketing_opt_in` jamais écrit ; aucun lien vers `mk_contacts`. Une liaison suppose une colonne `contact_id` nullable ou une table de correspondance, jamais une copie.
6. **Statuts figés par CHECK SQL** (`orders.status`, `payments.status`…) : SQLite ne permet pas de modifier un CHECK ; ajouter un statut oblige à recréer la table (voir §5, risque).
7. **Types de produit figés par CHECK** : `downloadable` et `grouped` existent déjà dans le CHECK (aucune migration nécessaire pour les activer) ; tout autre type (external, bundle) exige une recréation de table.
8. **JSON de tags/attributs** : filtrage par `LIKE` ; migrer vers tables de taxonomie demande un remplissage depuis le JSON.
9. **`mk_shop_customer_tokens`** et **`mk_shop_webhook_events`** ne portent pas d'organisation ; la seconde grossit sans purge (aucune rétention).
10. **Aucune purge** des paniers `open` anciens, des jetons expirés ni des sessions : croissance sans borne.
11. **Index manquants probables** : `mk_shop_orders(email)`, `(organization_id, site_id, payment_status)`, `(organization_id, site_id, created_at)` seul pour les rapports par date ; `mk_shop_customers(organization_id, site_id, created_at)`.
12. **`mk_shop_order_items.product_id` sans FK** : un rapport « ventes par produit » doit tolérer des produits supprimés (suppression douce, donc rarement orphelin).
13. **Montants en INTEGER SQLite** (64 bits) : sans risque de dépassement réaliste.
14. **Secret dérivé** : jetons de commande/abonnement/rendez-vous = HMAC de `(id, numéro/e-mail, created_at)` avec `ENCRYPTION_KEY || SESSION_SECRET || "kolakisa-dev"` : changer la clé invalide tous les liens déjà envoyés, et le repli est faible (voir PROBLEMES).

## 4. Ce qu'il faut préserver (contrat de compatibilité)

- Les noms de tables et de colonnes `mk_shop_*` existantes, leurs contraintes et leurs index uniques (les tests, `shop/*`, `ai/shop/*`, `themeBuilder/publication.js`, `scripts/*` y accèdent directement).
- L'isolation `organization_id` + `site_id` + `COALESCE(site_id,0)` sur toute nouvelle table.
- Les montants entiers, les instantanés de lignes de commande, l'idempotence des commandes (`idempotency_key`) et des webhooks (`mk_shop_webhook_events`, `stripe_invoice_id` unique).
- La séparation clients de boutique / utilisateurs de la plateforme, et séparation boutique / formations.
- Les numéros de commande déjà émis (`number` unique, compteur `next_order_number`) : ne jamais réinitialiser.
- Le sens de `payment_status` / `status` : les commandes existantes doivent rester lisibles sans transformation.
- Les liens déjà envoyés par e-mail (`/boutique/commande/confirmation/<n>?k=…`, `/boutique/abonnements/<id>?k=…`, `/liste/<token>`, rendez-vous) : si le calcul des jetons change, **accepter les deux formes pendant une période de transition**.
- Les 100 + 100 modèles Theme Builder et leurs étiquettes `{{product.*}}` (`shop/view.js productScope`) : toute nouvelle donnée de produit doit s'AJOUTER à ce périmètre, pas le modifier.

## 5. Règles de migration additive (méthode à suivre pour toute évolution)

1. **Un fichier = une migration** `144_nom_en_minuscules.sql` (prochain numéro libre au 12/11/2026 : 144 ; vérifier avec `git fetch` car d'autres sessions ajoutent des migrations). Ne jamais éditer 121 à 143.
2. **Autorisé sans risque** : `CREATE TABLE`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN` avec valeur par défaut neutre (NULL ou 0), `INSERT` de données de référence.
3. **À éviter** : `DROP COLUMN`, renommer, changer un CHECK, changer un type. SQLite ne modifie pas un CHECK : il faut créer `x_new`, copier, supprimer l'ancienne, renommer (la migration 131 l'a fait pour un index unique). À réserver aux cas indispensables, avec test de copie et sauvegarde.
4. **Colonne ajoutée = comportement inchangé** : une commande/produit existant doit se comporter exactement comme avant tant que la nouvelle fonction n'est pas activée (modèle des migrations 134 à 139 : « un produit sans ligne ici n'est soumis à aucun contrôle »).
5. **Nouvelles fonctions derrière un réglage par site** (colonne `mk_shop_settings.xxx_enabled DEFAULT 0` ou module) pour pouvoir les couper sans migration inverse.
6. **Sauvegarde** : le mécanisme `AVANT-MIGRATION-…db` s'exécute seul avant toute migration sur une base non vide ; ne pas le désactiver. Avant un déploiement sur kolakisa.com, copier aussi la base manuellement (hPanel) — le déploiement Git de Hostinger applique les migrations au démarrage.
7. **Retour arrière** : pour chaque migration, écrire dans `scripts/migrations-retour-arriere/144_xxx.down.sql` (convention existante : 090, 091) :
   - tables nouvelles : `DROP TABLE nouvelle_table;` (dans l'ordre inverse des dépendances) ;
   - index nouveaux : `DROP INDEX IF EXISTS …;`
   - colonnes ajoutées : `ALTER TABLE … DROP COLUMN …` (SQLite ≥ 3.35, vérifier la version embarquée par better-sqlite3) ou laisser la colonne inerte ;
   - toujours terminer par `DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '144';`
   - le retour arrière n'est exécuté que hors production et après sauvegarde (convention déjà écrite dans l'en-tête de la migration 122).
8. **Test de migration** : ajouter un test qui (a) applique la migration sur une base peuplée par les helpers existants (voir les gabarits de `programme20-5-boutique-moteur.test.js`), (b) vérifie que les commandes anciennes se lisent à l'identique, (c) vérifie l'isolation de la nouvelle table entre deux sites.
9. **Remplissage de données (backfill)** par migration seulement s'il est déterministe, rapide et idempotent ; sinon par script `scripts/` exécutable à la main avec mode « à blanc ».

## 6. Évolutions prévisibles et leur forme additive

| Besoin | Forme additive recommandée | Risque |
|---|---|---|
| Remboursements (total/partiel/par ligne) | Nouvelle table `mk_shop_refunds(id, organization_id, site_id, order_id, payment_id, provider_refund_id UNIQUE, amount_cents, reason, restock, actor, created_at)` + `mk_shop_refund_lines(refund_id, order_item_id, quantity, amount_cents)`. Ne modifie pas `orders`. Rétro-remplissage des commandes déjà « refunded » : une ligne synthétique `provider_refund_id = 'legacy:<order_id>'` au montant total (script, non obligatoire) | Faible |
| Remise en stock au remboursement | Mouvement `reason = 'refund'` (champ libre, pas de CHECK) | Faible |
| Classes de taxe | `mk_shop_tax_classes` + colonne `mk_shop_products.tax_class_id NULL` (NULL = règle actuelle) + colonne `mk_shop_tax_rules.tax_class_id NULL` | Moyen (calcul à revoir, commandes anciennes inchangées) |
| Classes d'expédition | `mk_shop_shipping_classes` + `products.shipping_class_id NULL` + colonne sur méthodes | Moyen |
| Taxonomies (marques, étiquettes, attributs globaux) | Tables `mk_shop_terms`, `mk_shop_product_terms` ; **copier** les étiquettes JSON vers les tables par script, garder la colonne JSON en lecture jusqu'à validation | Moyen (double écriture à éviter : une seule source) |
| Téléchargements | `mk_shop_downloads(product_id, file_path, label)`, `mk_shop_download_grants(order_item_id, token_hash, remaining, expires_at)` ; le type `digital`/`downloadable` existe déjà dans le CHECK | Faible |
| Factures | `mk_shop_invoices(order_id UNIQUE, number, issued_at, …)` + compteur séquentiel par site (nouvelle colonne `mk_shop_settings.next_invoice_number`) ; numérotation sans trou dans une transaction | Moyen (légal) |
| Passerelles par site | `mk_shop_gateways(organization_id, site_id, provider, config_encrypted, enabled)` ; le champ `payment_methods` des réglages reste la liste d'activation | Moyen (chiffrement, rotation) |
| Clients ↔ contacts | `mk_shop_customers.contact_id` nullable + index ; remplissage par événement | Faible |
| Événements / webhooks sortants | Aucune table : émettre vers le bus existant (`marketing/events`, `webhooks/catalog.js`) depuis `orders.js` après commit | Faible |
| Paniers abandonnés | Pas de table : colonne `mk_shop_carts.email` + `reminded_at` (ADD COLUMN) | Faible |
| Notes de commande | Réutiliser `mk_shop_order_events` avec `kind = 'note'` + colonne `visible_to_customer INTEGER DEFAULT 0` | Faible |
| Statuts supplémentaires | Nécessite recréation de `mk_shop_orders` (CHECK) : préférer mapper le nouveau besoin sur `payment_status`/`events` ou ajouter une colonne `fulfillment_status` libre | Élevé si recréation |
| Produit externe / bundle | Recréation de `mk_shop_products` (CHECK du type) : repousser ; utiliser `grouped`/`digital` déjà admis | Élevé |
| Rapports | Pas de table : requêtes agrégées avec les index (ajouter `(organization_id, site_id, created_at)`) ; si lent, table de cumul journalier `mk_shop_daily_stats` reconstruisible | Faible |
| Fusion formations ↔ boutique | **Ne pas fusionner les tables** ; créer une vue/pont de lecture. Le commerce de formations n'a ni site ni organisation | Élevé |

## 7. Plan de déploiement type (pour toute évolution)

1. Écrire la migration + son `.down.sql` + le test (§5). 2. Exécuter localement : `npm test` ciblé boutique + `tests/isolation-*.test.js` + `tests/header-*`/`footer-*` (règle du dépôt après fusion de `main`). 3. Copier la base de production (hPanel) avant le déploiement. 4. Déployer ; la migration s'applique au démarrage avec sauvegarde automatique. 5. Vérifier une commande de test de bout en bout (manuel + Stripe en mode test). 6. Activer la nouvelle fonction site par site via son réglage. 7. En cas de problème : désactiver le réglage (retour immédiat), puis, si nécessaire, restaurer la sauvegarde `AVANT-MIGRATION-…db` (les commandes passées entre-temps seraient perdues : à éviter si des ventes ont eu lieu, préférer le correctif en avant).

## 8. Vérification à faire avant toute évolution lourde

- Version de SQLite embarquée par `better-sqlite3` (support `DROP COLUMN`, `RETURNING`, FTS5).
- Volume réel des tables en production (aucune mesure disponible ici).
- Existence éventuelle d'un second site réellement en vente (aucune donnée lue).
- Confirmer que le déploiement Git de Hostinger n'écrase pas le fichier `.db` (dossier `data/`).
