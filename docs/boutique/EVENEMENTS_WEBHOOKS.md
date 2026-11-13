# Événements de la boutique, webhooks et automatisations

Chaque fait important de la boutique est écrit dans le journal d'événements du module marketing (`mk_events`, source `shop`) puis distribué par la file de travaux aux **automatisations** et aux **webhooks sortants** abonnés (Marketing → Intégrations → Webhooks).

| Événement | Quand |
|---|---|
| `shop.order_created` | Commande créée (avant paiement) |
| `shop.order_paid` | Paiement confirmé (webhook signé, relecture du fournisseur ou confirmation manuelle) |
| `shop.order_status_changed` | Tout changement de statut (`from`, `to` dans les métadonnées) |
| `shop.order_shipped` | Passage à « expédiée » |
| `shop.order_cancelled` | Annulation |
| `shop.refund_created` | Remboursement (partiel ou total) |
| `shop.customer_registered` | Création d'un compte client |
| `shop.stock_low` | Le stock d'un produit passe sous le seuil de la boutique |
| `shop.cart_abandoned` | Panier inactif au-delà du délai réglé |

Métadonnées d'une commande : `orderId, number, status, paymentStatus, paymentMethod, currency, totalCents, taxCents, shippingCents, discountCents, coupon, from, to`. Chaque événement porte l'e-mail du client (rattachement au contact), le site et une **clé d'idempotence** (le même fait rejoué n'est jamais émis deux fois).

## À savoir
- La distribution se fait par la file : elle exige que le worker marketing soit actif (`MARKETING_WORKER=on`), comme pour tous les événements du module.
- Une erreur d'émission n'interrompt **jamais** une commande (elle est journalisée).
- Les webhooks sortants signent leurs envois (voir la documentation du module Webhooks).

Tests : `tests/boutique-api-evenements.test.js`.
