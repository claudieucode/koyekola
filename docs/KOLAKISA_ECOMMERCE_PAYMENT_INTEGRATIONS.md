# Boutique — intégrations de paiement

## Architecture
`shop/payments.js` expose une interface unique (`start`, `reconcile`, `handleStripeEvent`) ; le moteur de commandes ne connaît aucun fournisseur. Chaque boutique choisit ses moyens (`mk_shop_settings.payment_methods`) ; un moyen non configuré n'est **pas proposé** aux clients.

| Fournisseur | État | Détail |
|---|---|---|
| **Stripe Checkout** | intégré, **testé contre un faux serveur Stripe local** ; **nécessite une configuration externe** | variables serveur `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` (compte Stripe de la plateforme ; une seule paire de clés, partagée par les boutiques). **Jamais testé contre le vrai Stripe, aucune transaction réelle.** |
| **Manuel** (virement, à la livraison) | opérationnel | la commande reste « en attente » ; un administrateur ayant `shop.payments` confirme la réception (confirmation + historique + audit). |
| Autres passerelles (PayPal, Mobile Money, etc.) | **absentes** | l'interface permet d'en ajouter ; aucune n'est implémentée. |

Devises : celle de la boutique (code à 3 lettres) est transmise à Stripe telle quelle ; **seul l'euro a été exercé en test**. Minimum Stripe : 0,50 (montant inférieur refusé avec message). Total à 0 : commande payée immédiatement (source « free »).

## Flux Stripe
1. Commande créée (`pending`) → `start` crée une session Checkout (ligne unique « Commande <n°> » au total serveur, `client_reference_id = shop:<id>`, expiration 31 min).
2. Échec de création : paiement `failed`, commande conservée, message clair, **rien n'est débité**, nouvelle tentative possible (`/commande/<n°>/payer`).
3. Retour du client : la page de retour **relit la session auprès de Stripe** ; elle ne conclut jamais d'après l'adresse de retour.
4. **Webhook signé** `POST /stripe/webhook` (même route que les formations, aiguillage sur `shop:`) : signature HMAC-SHA256 avec tolérance de 5 min, corps brut ; événements traités : `checkout.session.completed`, `…async_payment_succeeded`, `…async_payment_failed`, `…expired` (annule et rend le stock), `charge.refunded` (remboursement total → commande remboursée ; partiel → note d'historique).
5. **Idempotence** : l'identifiant d'événement est enregistré dans la même transaction que le traitement (`mk_shop_webhook_events`) ; un rejeu est ignoré. Une commande déjà payée n'est pas repayée.
6. **Contrôle du montant et de la devise** : un paiement dont le montant ou la devise diffère du total serveur ne marque **pas** la commande payée (statut `failed`, événement `payment_mismatch`).
7. **Confirmation tardive** (commande annulée puis payée) : commande rétablie, stock repris dans la limite du disponible, note inscrite.

## Sécurité
Secrets uniquement dans l'environnement du serveur (jamais en base, jamais dans une page ou un journal). Aucune donnée de carte ne transite par Kolakisa. Messages d'erreur du fournisseur journalisés côté serveur, jamais montrés au client. Webhook refusé (400) si la signature est invalide, (503) si le secret est absent.

## Ce qui reste à configurer (externe)
Compte Stripe, clés `sk_…` et secret de webhook, adresse `<SITE_URL>/stripe/webhook`, ajout des événements ci-dessus, e-mails (`SMTP_*`). Voir `KOLAKISA_PROGRAMME20_5_REMAINING_ISSUES.md`.
