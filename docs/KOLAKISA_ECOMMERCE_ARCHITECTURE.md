# Kolakisa — Moteur de boutique : architecture (Programme 20.5)

## 1. Point de départ (audit réel, avant intervention)
| Sujet | État constaté dans le code (`origin/main`, commit `bd794900`) |
|---|---|
| Produits | Seulement les **formations** (`courses`, prix en centimes). Pas de produit générique, de variantes, de stock, de poids, de livraison, de taxes. |
| Panier | Session du visiteur (`req.session.cart`), **connexion obligatoire**, formations uniquement. |
| Commande | `orders` / `order_items`, créées après paiement confirmé (Stripe) ; **sans `site_id`** (voir `docs/cms-commerce.md`, test R7 : le parcours LMS reste sur l'hôte principal). |
| Paiement | Stripe Checkout hébergé (`src/services/payments.js`) : signature de webhook vérifiée, idempotence, relecture directe de la session. **Réutilisé** par la boutique. |
| Coupons / offres | `coupons`, `offers` pour les formations seulement. |
| E-mail | File d'envoi `src/utils/outbox.js` (réessais, journal, « SMTP non configuré » = message ignoré, jamais « envoyé »). **Réutilisée**. |
| Widgets | 94 éléments de page ; « Panier » et « Bouton d'achat » ne concernent que les formations. Étiquettes `{{product.*}}` = alias de `course`. |
| Modèles de thème | 9 familles, conditions et priorité déterministes, réglage d'organisation (`mk_settings` `theme.templates`). Aucune famille produit. |
| Permissions | Aucune permission commerce dédiée. |

Conclusion : **aucun moteur transactionnel générique n'existait**. Il a été construit à côté du commerce des formations (qui n'est ni modifié ni remplacé), en réutilisant Stripe, la file d'e-mails, le journal d'audit, les modules par site, les domaines, le Theme Builder et le registre de widgets.

## 2. Principes
1. **Un seul moteur CMS** ; la boutique d'un site = des lignes portant `organization_id` + `site_id` (site principal = `site_id NULL`, comme le reste du CMS). Aucune instance par boutique.
2. **Le site vient du serveur**, jamais du navigateur : côté public, `req.kwSite` (hôte vérifié par le registre des domaines) ; côté administration, l'adresse `/site-web/sites/<id>/boutique…` ou `/site-web/principal/boutique…` revérifiée (`res.locals.siteSpace` + `req.mk.site`).
3. **Le navigateur n'envoie que des identifiants et des quantités.** Prix, remises, stock, taxes, livraison et total sont recalculés dans `shop/cart.js` à chaque affichage et à la création de la commande.
4. **Aucun moteur parallèle** : mêmes éditeur, rendu, publication, thèmes et modèles que le reste du CMS.
5. **Migration additive** (`116_boutique.sql`) : aucune table existante modifiée.

## 3. Modules
```
src/marketing/shop/
  calc.js       calculs purs (remise, taxes, livraison, totaux)         — sans base
  catalog.js    produits, variantes, catégories, requêtes de catalogue
  store.js      réglages, zones/méthodes de livraison, taxes, coupons
  cart.js       panier serveur + tarification complète (priceCart)
  orders.js     création de commande, stock, idempotence, cycle de vie, paiement confirmé
  payments.js   passerelles (interface unique) : stripe, manual
  customers.js  clients de boutique (distincts des utilisateurs de la plateforme)
  notify.js     notifications commerciales (file d'e-mails + journal)
  view.js       présentation, jeton de consultation d'une commande, cookies
src/marketing/web/shopAdmin.js    administration (produits, commandes, clients, réglages)
src/marketing/web/shopPublic.js   boutique publique /boutique…
src/marketing/pages/widgets/shop.js   5 éléments de page branchés sur ce moteur
```

## 4. Données (`116_boutique.sql`)
`mk_shop_settings`, `_categories`, `_products`, `_product_categories`, `_variants`, `_stock_movements`, `_carts`, `_cart_items`, `_customers`, `_customer_tokens`, `_shipping_zones`, `_shipping_methods`, `_tax_rules`, `_coupons`, `_coupon_redemptions`, `_orders`, `_order_items`, `_order_events`, `_payments`, `_webhook_events`, `_notifications`.
Toutes les tables « racines » portent `organization_id` et `site_id` ; les unicités (slug, SKU, code coupon, e-mail client, numéro de commande, clé d'idempotence) passent par `COALESCE(site_id, 0)` : **deux boutiques peuvent avoir le même slug, le même SKU ou le même code**. Les tables enfants (lignes, événements) sont atteintes uniquement par leur parent déjà filtré par boutique.

## 5. Isolation
- Chaque fonction de service reçoit une **portée** `{ db, organizationId, siteId }` et toutes les requêtes la filtrent (`site_id IS NULL` ou `site_id = ?`).
- Le panier est retrouvé par le **hachage SHA-256 du jeton** *dans la boutique de l'hôte* : le jeton d'un site est inconnu sur un autre.
- Les clients (`mk_shop_customers`) sont propres à une boutique ; leurs sessions aussi.
- L'accès à une commande par son acheteur exige un **jeton HMAC** (lié à la commande) ou la session du client propriétaire.
- Le module « Commerce » doit être activé **pour le site** (équipe de l'organisation) **et** la boutique ouverte, sinon 404 neutre.
- Un modèle de thème « produit » n'est appliqué que s'il appartient au **même site** (`pick(…, { siteId })`).

## 6. Permissions (nouvelles, dans `organizations.js` et `cmsAccess.js`)
| Permission | Rôle minimal | Usage |
|---|---|---|
| `shop.read` | éditeur | voir produits, stocks, commandes, clients |
| `shop.write` | éditeur | produits, catégories, livraison, taxes, coupons, réglages |
| `shop.orders` | éditeur | préparer, expédier, terminer, annuler |
| `shop.payments` | administrateur | ouvrir la boutique, choisir les moyens de paiement, confirmer un paiement manuel, enregistrer un remboursement |

## 7. Ce qui est réutilisé / ajouté / non fait
Réutilisé : Stripe (`services/payments.js`, +1 export), webhook (`routes/stripeWebhook.js`, aiguillage `shop:`), file d'e-mails, `recordAudit`, `siteModules` (module existant « commerce »), `siteHost`, `themeTemplates`/`themeRender` (+ option `siteId`), `dynamic.js` (étiquettes), registre de widgets, `cmsNav`.
Non fait : voir `KOLAKISA_PROGRAMME20_5_REMAINING_ISSUES.md`.
