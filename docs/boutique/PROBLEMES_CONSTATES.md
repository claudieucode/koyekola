# Problèmes constatés — boutique Kolakisa

Audit du 12/11/2026 (branche `boutique-audit`, lecture seule, aucun code modifié). Chaque point cite `fichier:ligne` (numéros relevés sur `origin/main` à cette date).
Niveaux : **Critique** (argent ou données personnelles en danger), **Élevé** (bug réel visible d'un client ou d'un vendeur), **Moyen** (risque ou limite à traiter), **Faible** (dette).
« Confirmé par lecture » = le défaut découle directement du code ; « non reproduit » = aucun test d'exploitation n'a été lancé (l'audit ne modifie rien et n'écrit pas de test).

## 1. Failles et risques de sécurité

### 1.1 Critique — Prise de contrôle d'un compte « invité » par pré-inscription (aucune vérification de l'e-mail)
- `src/marketing/shop/customers.js:36-41` (`register`) : si un client « invité » existe déjà pour cet e-mail (créé automatiquement par une commande, `ensureGuest`, `customers.js:45-51`, appelé à `shopPublic.js:422`), n'importe qui connaissant l'adresse peut « s'inscrire » avec cette adresse et définir un mot de passe : le compte invité est activé et lié à l'historique des commandes de la victime. `shopPublic.js:490-494` (`/compte`) affiche alors les commandes avec leur jeton `k` (nom, adresse de livraison, articles, total) ; `shopPublic.js:510-523` connecte immédiatement l'inscrit sans aucun e-mail de confirmation.
- Variante « pré-piratage » : l'attaquant s'inscrit d'abord avec l'e-mail de la victime ; quand la victime commande plus tard en invitée avec cet e-mail, `ensureGuest` retrouve le compte de l'attaquant et la commande lui est rattachée (`shopPublic.js:422`).
- Effet de bord : le message « Un compte existe déjà avec cette adresse » (`customers.js:40`) révèle l'existence d'un compte (énumération), contrairement à la réinitialisation qui répond de façon identique (`shopPublic.js:540`).
- Confirmé par lecture ; non reproduit ; aucun test ne couvre ce cas (`programme20-5-boutique-moteur.test.js:401` ne teste que mot de passe court / doublon / réinitialisation).
- Correctif attendu (à faire plus tard) : activer un compte invité seulement après un lien envoyé par e-mail ; ne jamais rattacher une commande invitée à un compte non vérifié.

### 1.2 Élevé — Blocage du stock par commandes « paiement manuel » jamais expirées
- `src/marketing/shop/orders.js:270` : `expireStale` ignore volontairement `payment_method = 'manual'`. Une commande manuelle réserve le stock (`orders.js:48-55`) et n'est jamais annulée automatiquement. Aucune limitation de débit sur `POST /boutique/commande` (`shopPublic.js:406`) ni sur `POST /boutique/panier/ajouter` (`shopPublic.js:384`) ; le client « invité » n'a besoin que d'un e-mail et d'une adresse. Un visiteur malveillant peut vider tout le stock géré d'une boutique (qui a activé le paiement manuel) avec quelques requêtes, et faire grimper `next_order_number`.
- Confirmé par lecture ; non reproduit.

### 1.3 Élevé — Aucune limitation de débit sur le panier, la caisse, les avis, la liste de souhaits
- Seuls la connexion, l'inscription, la réinitialisation (`shopPublic.js:39-40,497,512,531`), les rendez-vous, abonnements et invitations utilisent `createRateLimiter`. `createCart` (`shop/cart.js:18`) crée une ligne `mk_shop_carts` par requête sans cookie : croissance de la base sans borne, et aucune purge des paniers (`status = 'open'`) n'existe.
- Confirmé par lecture ; non reproduit.

### 1.4 Moyen — Jeton de consultation d'une commande placé dans l'URL, sans expiration
- `src/marketing/shop/view.js:9-15` : jeton = HMAC(id, numéro, date) ; il circule en paramètre `?k=` (`shopPublic.js:423-424`, e-mails d'abonnement `subscriptions.js:35`). Il fuit via l'historique du navigateur, les journaux de proxy, l'en-tête `Referer` si la page charge une ressource externe, et ne peut pas être révoqué. Il donne accès à nom, adresses, articles, créneau.
- Confirmé par lecture.

### 1.5 Moyen — Adresse du site prise dans l'en-tête `Host`
- `shopPublic.js:124,287,327,429,477,535` construisent `origin = ${req.protocol}://${req.get("host")}` utilisé dans les URL de retour Stripe et dans le lien d'e-mail de réinitialisation (`shopPublic.js:535`). Un en-tête `Host` forgé peut faire pointer le lien de réinitialisation envoyé à la victime vers un autre domaine (« host header poisoning »). L'app est multi-domaines et dépend de l'hôte pour choisir le site, donc la protection dépend de la configuration du proxy ; `canonicalHost` (`middlewares/security.js:22-33`) ne traite que `www.`.
- Risque probable, non reproduit.

### 1.6 Moyen — Secret de repli `"kolakisa-dev"` dans cinq modules
- `shop/view.js:7`, `shop/subscriptions.js:21`, `shop/appointments.js:14`, `shop/age.js:8` : `ENCRYPTION_KEY || SESSION_SECRET || "kolakisa-dev"`. En production `server.js:33-39` refuse de démarrer sans `SESSION_SECRET` solide, donc le risque est limité aux environnements locaux ou à `SITE_URL` non https hors production ; mais si `ENCRYPTION_KEY` est posée avec une valeur faible elle prime. Les jetons de commande/abonnement/rendez-vous/âge dépendent tous de la même clé : la faire tourner invalide tous les liens envoyés.
- Mitigé ; dette.

### 1.7 Moyen — Plusieurs sessions Stripe ouvertes pour une même commande (double encaissement)
- `shopPublic.js:469-485` (`POST …/payer`) appelle `payments.start` qui crée une NOUVELLE session Checkout (`shop/payments.js:31-39`) sans expirer la précédente (31 min de validité). Le client peut payer deux fois ; le second paiement trouve la commande déjà payée (`orders.js:184` renvoie `already`) et l'argent reste encaissé sans commande ni remboursement automatique.
- Confirmé par lecture ; non reproduit.

### 1.8 Moyen — Montant reçu différent : commande marquée « échouée » alors que l'argent est encaissé
- `orders.js:185-189` : en cas de montant ou devise différents, la commande passe à `payment_status = 'failed'` avec un événement `payment_mismatch` ; aucune alerte au vendeur, aucun remboursement. Le stock reste réservé (la commande reste `pending`).
- Confirmé par lecture (testé : `programme20-5-boutique-moteur.test.js:365`, mais le test ne vérifie que l'état, pas le traitement de l'argent).

### 1.9 Faible — Limite « par client » des coupons contournable
- `shop/cart.js:107-109` compte les utilisations par adresse e-mail exacte : `a+1@x.fr`, `a+2@x.fr` passent. Les coupons ne sont pas liés au compte client.

### 1.10 Faible — Hachage de mot de passe synchrone
- `shop/customers.js:15-27` utilise `crypto.scryptSync` : chaque connexion/inscription bloque la boucle d'événements de tout le serveur (CMS compris) quelques dizaines de millisecondes ; la limitation de débit (10 essais / 15 min par e-mail+IP) réduit mais n'écarte pas l'effet avec des e-mails variés.

### 1.11 Faible — Pas de CAPTCHA ni de vérification anti-robot (inscription, avis, rendez-vous, commande invitée).

### 1.12 Information — Points sûrs vérifiés
Prix recalculés par le serveur (`cart.js:121-193`) ; total attendu comparé (`orders.js:107`) ; signature Stripe HMAC avec tolérance (`services/payments.js:61-75`) ; idempotence des webhooks (`payments.js:83-86`) ; jetons de panier/session hachés ; `sameOriginOnly` (`server.js:158`) ; échappement EJS de la description (`views/boutique/produit.ejs:29`) ; JSON-LD échappé (`shop/seo.js` `safeJson`) ; clés Stripe jamais envoyées au navigateur.

## 2. Bugs fonctionnels

### 2.1 Élevé — Le stock n'est pas remis après un remboursement
- `orders.js:249-257` (admin « remboursée ») et `payments.js:99-107` (webhook `charge.refunded`) changent le statut et les paiements mais n'appellent jamais `releaseStock` ni ne créent de mouvement. Le stock des articles remboursés (et non renvoyés) reste décompté. Non testé.

### 2.2 Élevé — « Remboursée » dans l'admin ne rembourse rien
- `orders.js:255` écrit « Remboursement enregistré (à effectuer chez le fournisseur de paiement) » : aucun appel Stripe n'existe pour la boutique (`grep refund` : seul le webhook entrant). Le client reçoit pourtant l'e-mail « Votre commande a été remboursée » (`shopAdmin.js:175`, `notify.js:32`) alors que le remboursement n'a peut-être pas été fait. Le libellé et l'e-mail peuvent induire le client en erreur. Non testé.

### 2.3 Moyen — Remboursement partiel non représenté
- `payments.js:106` : un remboursement partiel Stripe ajoute seulement un événement texte ; la commande reste « payée », sans montant remboursé conservé. Les rapports futurs ne pourront pas le retrouver autrement qu'en lisant des notes. `grep order_refunds` : la table n'existe que pour les formations.

### 2.4 Moyen — Mise à jour d'un statut, d'une catégorie, d'une zone, d'une taxe, d'un coupon : édition impossible
- `shopAdmin.js:207` appelle `catalog.saveCategory(s, req.body)` sans identifiant (la fonction `saveCategory(s, input, id)` sait modifier, `catalog.js:91`) : une « modification » d'une catégorie échoue sur le doublon de slug. Zones/méthodes/taxes/coupons n'ont que création et suppression (`shopAdmin.js:229-258`). Contournement : supprimer et recréer (une suppression de catégorie détache les produits : `mk_shop_product_categories` CASCADE).

### 2.5 Moyen — Carnet d'adresses du compte client inutilisable
- `customers.js:94-100` (`updateProfile`) sait enregistrer jusqu'à 10 adresses mais `shopPublic.js:552-556` ne passe que `name` et `phone` : le carnet reste toujours vide, aucune adresse n'est proposée à la caisse.

### 2.4bis Moyen — Expiration des commandes en attente non fiable
- `shopPublic.js:396` : `orders.expireStale` n'est exécutée que lorsqu'un client ouvre la page de caisse de CE site. Une boutique peu visitée garde du stock réservé pendant des heures ou des jours par des commandes carte abandonnées. Aucune tâche de fond pour la boutique.

### 2.6 Moyen — Paiement échoué : stock et coupon non rendus
- `orders.js:210-220` : `markPaymentFailed` sans `cancel=true` laisse la commande `pending` avec stock et coupon consommés (`used_count`, `orders.js:133`) ; ils ne sont rendus qu'à l'expiration (carte) ou jamais (manuel). Le webhook `checkout.session.async_payment_failed` appelle sans `cancel` (`payments.js:96-98`).

### 2.7 Faible — Widget « Panier » (`cart`) trompeur
- `src/marketing/pages/widgets/cart.js:5-21` affiche le panier de FORMATIONS (`visitor.cartIds`, `getCourse`) et non celui de la boutique ; un créateur qui cherche « Panier » dans l'éditeur pour une boutique peut le choisir par erreur. Le bon élément est `shopcart` (« Panier, commande et compte »).

### 2.8 Faible — Journaux écrits mais jamais lisibles
- `mk_shop_stock_movements` (`catalog.js:278`, `orders.js:54,66,297`) et `mk_shop_notifications` (`notify.js:41`) : aucune page ne les affiche ; `mk_shop_carts.status = 'abandoned'` n'est jamais posé ; `mk_shop_customers.marketing_opt_in` n'est jamais alimenté.

### 2.9 Faible — E-mails en texte brut codé en dur
- `shop/notify.js:10-52` : pas de HTML, pas de logo, montant formaté `toFixed(2)` en point décimal (`notify.js:7`) alors que le site affiche `Intl fr-FR` (virgule) ; l'e-mail administrateur affiche le `payment_status` brut (`notify.js:33`, ex. « unpaid »).

### 2.10 Faible — Produits « digitaux » sans fichier
- `catalog.js:8,145` : `digital` supprime la livraison mais ne livre rien : après paiement, le client ne reçoit aucun contenu. Un vendeur qui crée un produit « numérique » croit vendre un téléchargement.

### 2.11 Faible — Pas de liste de produits d'un attribut, pas de marque, étiquettes sans page d'admin ; `tags` filtrés par `LIKE` sur JSON (`catalog.js:323`) : faux positifs possibles sur des libellés contenant des guillemets échappés.

## 3. Intégration manquante (fonctions annoncées ou attendues mais non branchées)

| Manque | Preuve |
|---|---|
| Aucun événement de commande vers Contact Core, automatisations, webhooks sortants, revenus | `grep mk_shop` hors `shop/`, `web/shop*`, `ai/shop`, migrations : seulement `pages/widgets`, `themeBuilder/publication.js`, `routes/stripeWebhook.js`, `templateCatalog.js`. `bridge/commerce.js:1-25` lit `orders`/`order_items` des formations. |
| Effacement et export RGPD des clients de boutique | `src/services/privacy/erasure.js` : aucune référence à `mk_shop_*`. Un client de boutique ne peut pas être effacé par l'outil existant : ses commandes, adresses et e-mails restent. |
| Produits et catégories absents du sitemap | `src/seo/sitemap.js` ne mentionne aucune table boutique. |
| Panier/caisse/compte non éditables dans le Theme Builder | `themeBuilder/types.js:3` déclare les vues `account` et `shop_page` ; aucun type ne les utilise. |
| Clés Stripe uniques pour tous les sites | `shop/stripeClient.js`, `services/payments.js` (variables d'environnement). |
| Pas de menu latéral pour Avis, Rendez-vous, Abonnements, Accès, Listes cadeaux, Catégories | `web/cmsNav.js:72-79` (4 entrées) ; accessibles par onglets seulement (`views/marketing/boutique/_head.ejs`). Les permissions d'affichage du menu et les onglets ne sont pas filtrés de la même façon (l'onglet s'affiche pour tous ; les routes exigent `shop.read`). |

## 4. Dettes techniques

1. **Duplication** : `siteCond`/`siteArgs`/`json`/`clean` recopiés dans `catalog.js`, `store.js`, `orders.js`, `customers.js`, `access.js`, etc. ; trois copies du calcul de secret. À mutualiser sans changer le comportement.
2. **Gros fichiers de routes** : `shopPublic.js` (563 lignes) mélange catalogue, panier, caisse, compte, avis, listes, âge ; `shopAdmin.js` (311) concentre l'administration ; la logique de présentation et les règles sont mêlées.
3. **Passerelles non enfichables** : `PROVIDERS` est un objet figé de deux entrées (`payments.js:10-13`), `METHODS = ["stripe","manual"]` figé (`store.js:5`), `switch` d'événements Stripe dans `handleStripeEvent`. Ajouter PayPal/Mobile Money oblige à modifier le cœur.
4. **Contraintes `CHECK` figées** sur les statuts (migration 121) : ajouter un statut de commande oblige à recréer la table (voir `DONNEES_ET_MIGRATION.md`).
5. **JSON dans les colonnes** (tags, attributs, adresses, zones) : non indexables.
6. **Recherche `LIKE '%…%'`** sur 5 colonnes + sous-requête sur variantes (`catalog.js:315-318`) ; tri par prix par sous-requête corrélée (`catalog.js:310-312`). Lent au-delà de quelques milliers de produits ; aucune mesure faite ici.
7. **`hiddenIds`** (`access.js:223`) recalculé et injecté en `json_each` à chaque requête catalogue.
8. **Aucun planificateur** pour la boutique : expiration, relances, rappels de rendez-vous, abonnement impayé reposent sur des requêtes de visiteurs ou des webhooks.
9. **Tests de navigateur** (`programme20-5-boutique-navigateur`, `programme21-10-*-navigateur`) dépendent de Chrome et sont lents ; ils n'ont pas été relancés ici.
10. **Documents périmés possibles** : `docs/KOLAKISA_ECOMMERCE_*.md` n'ont pas été utilisés comme preuve ; à confronter à ce rapport avant diffusion.
11. **Abonnements jamais exécutés contre le vrai Stripe** (aveu dans `shop/subscriptions.js:6`) : les appels utilisent un faux Stripe injecté en test ; un test en mode test Stripe réel reste à faire avant toute vente.
12. **Deux moteurs de commerce** (formations et boutique) avec deux jeux de coupons, deux paniers, deux webhooks sur la même URL `/stripe/webhook` (`routes/stripeWebhook.js:26-42` aiguille par `client_reference_id` `shop:<id>` ou intention de paiement) : un événement mal classé serait traité par le mauvais moteur.

## 5. Ce qui fonctionne bien (pour ne pas le casser)

Isolation multi-site, calcul des totaux en entiers avec répartition exacte (`calc.js:8-17`), réservation de stock atomique, idempotence de commande et de webhooks, machine à états stricte, confirmation de paiement par source authentifiée seulement, modèles de fiche produit et d'archive (200), constructeur de boutique par IA, comptes clients isolés par site.

## 6. Résultats des tests exécutés (12/11/2026)

Commande exécutée (une seule, lecture seule, aucun fichier du dépôt modifié) :

```
TEST_START_TIMEOUT_MS=300000 node --test --test-timeout=280000 \
  tests/boutique-*.test.js \
  tests/programme20-5-boutique-moteur.test.js tests/programme20-5-boutique-serveur.test.js tests/programme20-5-boutique-builder.test.js \
  tests/commerce-par-site.test.js tests/paiement-stripe.test.js tests/themes-boutique.test.js \
  tests/programme21-10-ecommerce-builder.test.js tests/programme21-securite-regen-boutique.test.js
```

Résultat exact rapporté par le lanceur : **tests 299, suites 45, pass 299, fail 0, cancelled 0, skipped 0, todo 0 ; durée 706 106 ms (environ 11 min 46 s).**

Fichiers couverts (16) : `boutique-abonnements`, `boutique-age`, `boutique-briques`, `boutique-comparateur`, `boutique-creneaux`, `boutique-liste-cadeaux`, `boutique-membre`, `boutique-rdv`, `programme20-5-boutique-moteur`, `programme20-5-boutique-serveur`, `programme20-5-boutique-builder`, `commerce-par-site`, `paiement-stripe` (commerce de formations + webhook), `themes-boutique`, `programme21-10-ecommerce-builder`, `programme21-securite-regen-boutique`.

NON exécutés (par durée et dépendance au navigateur Chrome) : `programme20-5-boutique-navigateur`, `programme21-10-ecommerce-builder-http`, `programme21-10-ecommerce-builder-navigateur`, `cms-commerce`, `cms-commerce-web`, `site-web-commerce`, `editeur-boutique`, `fiche-produit-bout-en-bout`, `theme-builder-fiche-produit-100`, `theme-builder-archives-produits-bibliotheque`, `theme-builder-catalogue*`. Leur état n'est donc PAS vérifié par cet audit.

Lecture honnête de ce résultat :
- 299 succès prouvent que ce qui est testé fonctionne ; ils ne prouvent rien sur ce qui n'est pas testé. Les défauts des sections 1 et 2 (pré-inscription, stock non remis au remboursement, remboursement non exécuté, double session Stripe, stock bloqué par commandes manuelles, absence de limitation de débit) n'ont AUCUN test : leur absence d'échec n'est pas une preuve d'absence de défaut.
- Les tests d'abonnement utilisent un faux serveur Stripe (`stripeClient.setClient` / `STRIPE_API_BASE` local) : aucun test n'a touché le vrai Stripe.
- Durée : certains fichiers (`boutique-age`, `boutique-comparateur`, `boutique-creneaux`, `boutique-liste-cadeaux`, `boutique-abonnements`) mettent 190 à 220 s à démarrer lorsqu'ils tournent en parallèle ; ce n'est pas un échec, mais un coût de démarrage du serveur de test (d'où `TEST_START_TIMEOUT_MS=300000`). À surveiller : un délai de démarrage plus court ferait échouer ces fichiers.

