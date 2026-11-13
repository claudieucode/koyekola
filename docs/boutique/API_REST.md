# API REST de la boutique — `/api/v1/shop`

Authentification : clé d'API (`Authorization: Bearer mk_live_…`), créée dans Marketing → Intégrations. Jamais de cookie.

## Portée
- **Clé de site** : la boutique de ce site, rien d'autre (le paramètre `site_id` est ignoré).
- **Clé d'organisation** : boutique du site principal, ou d'un site de l'organisation avec `?site_id=<id>` (vérifié).
- Le module **Commerce** doit être activé pour le site, sinon `403 module_disabled`.
- Clé **lecture** : GET seulement. Clé **écriture** : modifications. Limite : 120 requêtes par minute et par clé.
- Réponses : `{ "data": … }` ou `{ "error": { "code", "message" } }`. Montants en centimes entiers.

## Routes
| Méthode | Route | Effet |
|---|---|---|
| GET | `/shop/products?q&status&page&per_page` | Produits (100 max par page) |
| GET | `/shop/products/:id` | Un produit avec variantes et catégories |
| POST | `/shop/products` | Crée un produit (mêmes règles que l'administration) |
| PATCH | `/shop/products/:id` | Modifie un produit |
| POST | `/shop/products/:id/stock` | `{ delta, variant_id? }` : ajuste le stock (jamais sous zéro) |
| GET | `/shop/orders?status&q&page` | Commandes |
| GET | `/shop/orders/:id` | Commande, lignes, taxes, remboursements |
| POST | `/shop/orders/:id/status` | `{ status, tracking?, note? }` : processing, shipped, completed, cancelled (commande non payée) |
| GET | `/shop/customers?q&page` | Clients |
| GET | `/shop/reports/summary?from&to` | Chiffres de la période, meilleurs produits, statuts |

## Ce que l'API ne fait volontairement pas
Confirmer un paiement et **rembourser** : refusés (`403 forbidden`). Ces actes exigent la permission `shop.payments` dans l'administration ou la confirmation du fournisseur de paiement. Aucun accès aux mots de passe, jetons ni données de carte (jamais stockées).

## Codes d'erreur
`400` valeur invalide · `401` clé absente/invalide · `403` lecture seule / module désactivé / acte interdit · `404` introuvable (aussi pour un objet d'un autre site) · `409` transition de statut ou stock impossible · `429` trop de requêtes.

Tests : `tests/boutique-api-evenements.test.js`.
