# Palier 20 — Commerce ↔ Contact Core ↔ Email ↔ Automation

## A. Audit (ce qui existait réellement)
| Sujet | État |
|---|---|
| Produits | Les **formations** (`courses`, prix en centimes). Pas de variantes, de stock, de taxes ni de livraison : ce sont des produits numériques. |
| Panier | **Dans la session** (`req.session.cart`), connexion obligatoire. Pas de panier enregistré en base. |
| Commande | `orders` / `order_items` (SQLite) créées **uniquement** après paiement confirmé (Stripe), ou gratuites, ou démonstration hors production. |
| Paiement | Stripe Checkout hébergé (aucune donnée de carte chez nous) ; `checkout_sessions` ; webhook **signé**, idempotent (statut relu dans la transaction). |
| Coupons / offres | `coupons`, `offers` : logique de prix dans `services/pricing.js` et `gestion/sales.js` (non dupliquée). |
| Remboursements | **N'existaient pas** (ni table, ni webhook, ni écran). |
| Abonnements récurrents | N'existent pas. |
| Achat sans compte | N'existe pas (connexion obligatoire). |
| Contact Core | Existant ; le compte est relié au contact par `mk_contacts.lms_user_id` + adresse. |
| Pont boutique → événements | Existant (`bridge/events.js`) : `lms.order_completed`, `purchase.completed` (palier 19), `lms.cart_added`, `lms.checkout_started` (visiteur connu et consenti). |
| E-mail d'achat | `mailer.js` (file d'e-mails du site) : séparé de l'Email Engine ; conservé tel quel (confirmation d'achat historique). |
| Multi-site | Les commandes et formations n'ont **pas** de `site_id`. |

## B. Décisions (réutiliser, ne rien dupliquer)
- **Pas de second système** : aucun nouveau contact, événement, file, consentement ou moteur d'e-mail.
- **Commerce reste propriétaire** des commandes, paiements et remboursements. Le Contact Core ne reçoit que des **événements** (référence `object_type = order`) ; la fiche contact **lit** les commandes en direct (aucune copie).
- **Rattachement commande ↔ contact** par le compte (`user_id` → `lms_user_id` + adresse). Pas de colonne `contact_id` sur `orders` : la résolution est calculée (aucune migration risquée sur les commandes existantes).
- **Achat réel uniquement** : `purchase.completed` vient de la commande créée après confirmation de Stripe — jamais d'une page « merci ».

## C. Ajouts
- Table `order_refunds` (trace de ce que Stripe annonce) + webhook `charge.refunded` signé, idempotent (identifiant de remboursement Stripe UNIQUE). Ne modifie ni la commande ni les accès.
- Nouvelle source du pont `order_refunds` → événements **`refund.completed`**, **`order.partially_refunded`**, **`order.refunded`** (total remboursé cumulé calculé à chaque remboursement).
- **`cart.abandoned`** : formation ajoutée au panier (contact connu, suivi consenti), ni page de commande ni achat après N heures (**réglable**, Paramètres → Tunnels, 24 h par défaut). Détection par la tâche récurrente existante.
- **`payment.failed`** : sessions de paiement en échec (raison non sensible), une fois par session.
- **Cycle de vie** : le premier achat réel passe le contact en « Client » (étape existante), sans rétrogradation.
- Métadonnées d'achat : `courseIds`, `courseId` (commande d'une formation), `couponCode`. Filtre de déclencheur « Formation achetée » (vaut aussi pour une commande de plusieurs formations).
- Segments : conditions `cart.abandoned`, `payment.failed`, `refund.completed`, `order.refunded`, `order.partially_refunded` (même moteur de segments).
- Fiche contact : panneau **Commerce** (commandes réelles, total net des remboursements, abandons). Fiche commande : **« Voir le contact »**, remboursements, mode de paiement honnête (Stripe ou sans paiement réel — l'ancien libellé « Simulé » était faux pour les paiements Stripe).
- E-mails : variable `{{event.refund_amount}}` ; `{{event.order_id}}`, `{{event.order_total}}`, `{{event.course_title}}` existaient (système de variables unique : espace `event.*`).

## D. Événements (journal unique `mk_events`)
Réutilisés : `lms.cart_added`, `lms.checkout_started`, `checkout.abandoned`, `lms.order_completed`, `purchase.completed`, `funnel.*`, `email.*`.
Nouveaux : `cart.abandoned`, `payment.failed`, `refund.completed`, `order.refunded`, `order.partially_refunded`.
Non créés (l'objet n'existe pas) : `product.viewed`/`added_to_cart` (couverts par `lms.course_viewed`/`cart_added`), `cart.created/updated`, `product.removed_from_cart`, `coupon.*` (le coupon est dans `couponCode` de l'achat), `subscription.*`, `payment.started`.

## E. Idempotence
Webhook : session déjà payée → ignorée ; remboursement : identifiant Stripe UNIQUE ; événements : clés `refund.completed:<id>`, `cart.abandoned:<contact>:<événement>`, `payment.failed:<ref>`, `purchase.completed:order:<id>`. Un scénario ne peut entrer qu'une fois par contact.

## F. Limites réelles
Pas d'achat sans compte, de variantes, de stock, d'abonnements récurrents, de factures ni de remboursement lancé depuis KOLAKISA (le remboursement se fait dans Stripe, KOLAKISA en prend acte). Commandes non rattachées à un site : le panneau Commerce n'est pas montré à une personne limitée à un site. Un visiteur n'ayant pas accepté la mesure n'a pas d'événement de panier. E-mail d'achat historique (`mailer.js`) distinct de l'Email Engine.
