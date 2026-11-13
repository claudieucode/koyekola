# Passerelles de paiement (par site)

| Passerelle | Usage | Identifiants (saisis dans Boutique → Paiements, chiffrés) |
|---|---|---|
| **Stripe** | Carte bancaire | Clés propres au site (clé secrète + secret de webhook) ; à défaut, clés du serveur (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) |
| **PayPal** | Compte PayPal, cartes via PayPal | Client ID + secret (mode production ou bac à sable) |
| **Flutterwave** | **Mobile Money** (MTN, Orange, Airtel, M-Pesa… selon le pays) et cartes | Clé secrète + « hash secret » des webhooks |
| **Manuel** | Virement, paiement à la livraison | Instructions affichées ; confirmation par une personne ayant `shop.payments` |

## Principes de sécurité (communs)
1. **Aucune donnée de carte ni de compte Mobile Money** ne passe par Kolakisa : le client paie sur la page du fournisseur.
2. **Une page de succès ne prouve rien.** Une commande n'est « payée » qu'après relecture de l'état réel auprès du fournisseur (retour du client **et** webhook) et contrôle du **montant et de la devise** exacts ; tout écart → paiement en échec, jamais « payée ».
3. **Un message de webhook n'est jamais cru tel quel** : Stripe → signature HMAC ; Flutterwave → en-tête `verif-hash` ; PayPal → seul l'identifiant de commande est retenu, l'état est relu chez PayPal. Référence inconnue ou d'un autre site → ignorée.
4. **Idempotence** : rejouer un webhook ne crée ni second paiement, ni seconde facture.
5. **Identifiants** : chiffrés AES-256-GCM (`ENCRYPTION_KEY`), liés à l'organisation et au site, jamais ré-affichés (champ vide = valeur conservée), jamais écrits dans le journal.
6. **Isolation** : les identifiants et les webhooks d'un site n'ont aucun effet sur un autre.
7. **Remboursements** par l'API du fournisseur (Stripe, PayPal, Flutterwave) ; refus du fournisseur → rien n'est rendu, la commande reste intacte.

## Adresses de webhook (à renseigner chez le fournisseur)
`https://<domaine du site>/boutique/webhooks/stripe | paypal | flutterwave` (affichées dans l'onglet Paiements).

## Honnêteté sur la vérification
Les adaptateurs sont testés **contre de faux serveurs locaux** reproduisant les API documentées (aucun paiement réel). Ils n'ont **pas** été essayés avec de vrais identifiants PayPal ou Flutterwave : un premier essai en mode test (bac à sable) par le propriétaire du site reste nécessaire avant d'ouvrir le moyen au public. Les abonnements Stripe continuent d'utiliser les clés du serveur.

Tests : `tests/boutique-passerelles.test.js`, `tests/boutique-remboursements.test.js`. Migration : `151_boutique_passerelles.sql`.
