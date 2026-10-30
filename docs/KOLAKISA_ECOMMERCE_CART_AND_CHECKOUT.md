# Boutique — panier, commande et checkout

## Panier (réel, côté serveur)
- Table `mk_shop_carts` / `mk_shop_cart_items`. Le navigateur garde un cookie `kola_cart` (HttpOnly, SameSite=Lax, `Secure` sous HTTPS, 30 jours) ; la base ne garde que l'**empreinte SHA-256** du jeton.
- Visiteur ou client : le panier est le même ; à la connexion il est rattaché au client. Il survit au changement de page et à l'actualisation. Sans JavaScript, tout fonctionne par redirections ; avec JavaScript, l'ajout se fait sans rechargement (`public/js/boutique.js`).
- Opérations : ajouter (les doublons fusionnent), changer la quantité (0 = retirer), retirer, code promotionnel.
- Validations serveur : quantité entière 1–99, produit publié, variante appartenant au produit (obligatoire pour un produit variable, interdite sinon), stock, 50 lignes au plus.
- **Modifications concurrentes** : le panier a une `version` ; si le formulaire porte une version périmée, l'opération est refusée (409) avec message.
- Produit retiré de la vente depuis l'ajout : signalé (« n'est plus disponible »), la commande est bloquée jusqu'à son retrait.

## Calcul (`cart.priceCart`)
Lignes (prix effectifs) → coupon (revérifié) → livraison (zone du pays, méthodes éligibles) → taxes (règle de la destination) → `calc.computeTotals`. Remise répartie ligne par ligne **au centime** (plus grand reste). Total = somme exacte des lignes affichées.

## Commande (`orders.createFromCart`)
Dans **une transaction** : relecture du panier ouvert, tarification complète, vérifications (boutique ouverte, moyen de paiement proposé, livraison, taxes, coupon, **total attendu**), numérotation, lignes (instantané), **réservation du stock**, coupon décompté, panier converti, historique. Tout ou rien.
- **Total périmé** : le formulaire renvoie le total affiché ; s'il diffère du total serveur → refus `price_changed` (409), le client revoit le nouveau total, rien n'est écrit.
- **Double soumission** : clé d'idempotence `cart:<id>:<clé>` ; un panier ne se convertit qu'une fois, toute nouvelle soumission renvoie **la même commande** (aucune seconde session de paiement, stock décompté une fois).
- **Dernier article** : deux acheteurs → un seul gagne, l'autre reçoit « stock insuffisant » sans commande.
- Une commande naît `pending` / `unpaid` : **jamais « payée » à la création**.

## Statuts et transitions (`orders.TRANSITIONS`)
`pending → paid | cancelled` · `paid → processing | shipped | refunded` · `processing → shipped | refunded` · `shipped → completed | refunded` · `completed → refunded` · `cancelled`, `refunded` terminaux.
- `pending → paid` à la main : **uniquement** pour le paiement **manuel**, avec `shop.payments`. Un paiement par carte ne se confirme que par le fournisseur.
- « Remboursée » à la main = **enregistrement** d'un remboursement fait chez le fournisseur (`shop.payments`) ; Kolakisa n'émet pas de remboursement.
- Toute modification est inscrite dans l'historique de la commande (qui, quand, note) **et** dans le journal d'audit (`shop_order.status_changed`).
- Commandes `pending` par carte depuis plus de 60 min : annulées automatiquement au passage en caisse suivant (`expireStale`), stock rendu. Les commandes de paiement manuel ne expirent pas.

## Parcours client
`/boutique` → fiche → panier (`/boutique/panier`) → commande (`/boutique/commande`) → paiement (Stripe ou instructions manuelles) → confirmation (`/boutique/commande/confirmation/<n°>?k=<jeton>`). Compte : inscription, connexion, commandes, mot de passe oublié (lien à jeton, 60 min, usage unique, réponse identique que le compte existe ou non). Commande sans compte : réglable (« invité »).

## Mise en cache
Pages de panier, commande, compte et toute requête non-GET : `Cache-Control: no-store`. Catalogue et fiches : `no-cache` (revalidation) — jamais de prix ou de stock servi sans revérification. Les requêtes de panier/caisse ne sont pas mises en cache applicatif.
