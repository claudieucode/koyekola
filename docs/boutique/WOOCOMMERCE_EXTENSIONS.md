# Extensions WooCommerce : fonctionnalités, données et proposition pour Kolakisa

Source de l'ensemble : catalogue https://woocommerce.com/products/ et documentation https://woocommerce.com/documentation/plugins/ (chaque extension a sa page `https://woocommerce.com/products/<nom>/` et sa doc). Lecture web partielle pendant cette session : résumés rédigés de mémoire à partir de ces pages, à revérifier avant décision (tarifs, noms de fonctions). Statut : [E] extension officielle payante sauf mention contraire ; [T] tiers.

Pour chaque extension : Fonctions / Cas d'usage / Données / Dépendances / Pertinence / Proposition (N = natif dans le cœur Kolakisa, M = module activable par site).

## Ventes récurrentes et réservations
### Subscriptions [E] — https://woocommerce.com/products/woocommerce-subscriptions/
- Fonctions : produits d'abonnement simples/variables, périodicité (jour à an), frais d'inscription, essai gratuit, date de synchronisation (jour fixe), expiration, renouvellements automatiques ou manuels, mise à niveau/rétrogradation, pause, changement de mode de paiement, relances d'échec avec nouvelles tentatives, factures de renouvellement, remises récurrentes.
- Cas : box mensuelle, SaaS, abonnement presse. Données : table `abonnements` (client, produit, statut, période, prochaine échéance, jeton de paiement, historique des renouvellements). Dépendances : passerelle avec jetons et prélèvement serveur (Stripe, PayPal), planificateur.
- Pertinence : élevée à terme. Proposition : M (P1/P2), nécessite file de tâches planifiées et Stripe.

### Bookings [E] — https://woocommerce.com/products/woocommerce-bookings/
- Fonctions : réservation d'un créneau/jour/nuit, durée fixe ou variable, capacité, personnes, ressources, disponibilité par règles (jours, plages, blocage), tampon avant/après, confirmation manuelle, synchronisation Google Agenda, rappels, acompte.
- Données : ressources, règles de disponibilité, réservations (début, fin, statut, personnes). Pertinence : élevée pour services (coiffure, location). Proposition : M, calendrier + API de disponibilité.

### Memberships [E] — https://woocommerce.com/products/woocommerce-memberships/
- Fonctions : plans d'adhésion achetables, restriction de contenu (pages, produits, catégories, vidéos), remises membres, expiration, adhésion gratuite, contenus à diffusion progressive (drip), e-mails.
- Données : plans, règles d'accès, adhésions utilisateur. Pertinence : forte pour sites de contenus/formation. Proposition : M, avec contrôle d'accès générique du CMS.

### Wait list / Waitlist [E/T] — https://woocommerce.com/products/woocommerce-waitlist/
- Fonctions : inscription e-mail sur produit en rupture, alerte automatique au retour en stock, statistiques. Données : liste (produit, e-mail, date). Proposition : N léger (P1), dépend d'e-mails.

## Personnalisation produit
### Product Add-Ons [E] — https://woocommerce.com/products/product-add-ons/
- Fonctions : champs supplémentaires par produit ou global (texte, zone de texte, case, sélection, boutons radio, fichier, quantité, personnalisation), prix additionnel fixe/pourcentage/par caractère, obligatoire, conditions d'affichage.
- Données : groupes de champs (portée produits/catégories), valeurs stockées en méta de ligne de commande. Proposition : N (P0/P1) : « options personnalisées » sur la ligne du panier avec impact prix.

### Composite Products [E] — https://woocommerce.com/products/composite-products/
- Fonctions : kit configurable étape par étape (composants avec choix de produits, quantités, remises, prix assemblé ou fixe, conditions de validité, affichage progressif/tabulaire). Données : produit composite + composants + options. Proposition : M (P2).

### Product Bundles [E] — https://woocommerce.com/products/product-bundles/
- Fonctions : lot de produits existants vendu ensemble, prix fixe ou calculé, remise, quantités min/max, mise en page de l'offre, stock combiné. Proposition : N simplifié (P1), car très fréquent (packs).

### Min/Max Quantities [E] — https://woocommerce.com/products/minmax-quantities/
- Fonctions : quantité min/max/pas/groupe par produit, catégorie ou commande, valeur du panier, ignore pour certains rôles. Proposition : N (P0 simple : min/max/pas dans la fiche produit).

### Product Recommendations [E] — https://woocommerce.com/products/product-recommendations/
- Fonctions : moteurs de règles (achats ensemble, tendances, récemment vus, similaires, panier), emplacements (fiche, panier, e-mail), sans IA externe. Données : historique des vues et ventes. Proposition : M (P2) ; version simple « liés / ventes additionnelles » en natif (P0).

### Dynamic Pricing [E] — https://woocommerce.com/products/dynamic-pricing/
- Fonctions : remises par quantité, par rôle, par catégorie, « achetez X obtenez Y », tarification par panier, règles à dates. Données : règles ordonnées avec conditions et actions. Proposition : M (P1/P2), moteur de règles de prix à conception propre.

### Wholesale / Prix de gros [T] (le catalogue officiel propose plutôt Dynamic Pricing + Memberships ; plusieurs plugins tiers « Wholesale Suite »)
- Fonctions : rôle grossiste, prix par rôle, minimum de commande, taxes exonérées, formulaire d'inscription B2B. Proposition : M, bâti sur rôles + règles de prix.

## Monnaies, taxes, localisation
### Multi-currency / Currency Converter Widget [E, tiers majeurs : WPML/WCML, Aelia] — https://woocommerce.com/products/multi-currency/ (extension « WooCommerce Multi-Currency »)
- Fonctions : affichage et paiement en plusieurs devises, taux manuels ou automatiques, arrondis, par pays, sélecteur de devise. Données : taux, devises actives, prix par devise facultatif. Dépendance : service de taux de change (clé API). Proposition : M (P1) ; le modèle de prix doit stocker la devise de base.

## Marketing, fidélité, e-mails
### Points & Rewards [E] — https://woocommerce.com/products/woocommerce-points-and-rewards/
- Fonctions : gains de points à l'achat/avis/inscription, taux de conversion, remise via points, plafonds, expiration, journal. Données : grand livre de points par client. Proposition : M (P2).

### Gift Cards [E] — https://woocommerce.com/products/gift-cards/
- Fonctions : produit carte-cadeau (montants), envoi programmé par e-mail avec code, solde utilisable au panier (comme un moyen de paiement), recharge, suivi. Proposition : M (P1/P2).

### Wishlists [E/T] — https://woocommerce.com/products/woocommerce-wishlists/
- Fonctions : listes de souhaits multiples, publiques/privées, partage, ajout au panier. Proposition : N ou M (P1).

### Abandoned Cart [T majeurs ; officiel : "AutomateWoo" et "Jilt"] — https://woocommerce.com/products/automatewoo/
- Fonctions (AutomateWoo [E]) : workflows déclencheurs/conditions/actions (relance panier abandonné, e-mail après achat, anniversaires, coupons uniques, SMS via extension). Données : paniers persistants avec e-mail capté, journal de workflows. Dépendances : service d'e-mails. Proposition : M (P1) : panier abandonné + coupon automatique.

### Advanced Notifications [E] — https://woocommerce.com/products/advanced-notifications/
- Fonctions : alertes e-mail par règle (nouvelle commande par produit/catégorie à un fournisseur, stock bas). Proposition : N (P1) via routage des e-mails par produit.

### Product Reviews Pro (Product Reviews Pro, ancien « Product Reviews Pro ») [E] — https://woocommerce.com/products/woocommerce-product-reviews-pro/
- Fonctions : avis avec photos/vidéos, questions-réponses, contributions, votes utiles, filtres, demandes d'avis automatiques après achat. Proposition : M (P1/P2).

### Product Vendors [E] — https://woocommerce.com/products/product-vendors/
- Fonctions : marketplace : vendeurs avec comptes, produits par vendeur, commissions, paiements PayPal, tableau de bord vendeur, notification. Données : vendeurs, commissions par ligne, versements. Proposition : M (P2), forte complexité.

## Expédition
### Shipment Tracking [E] — https://woocommerce.com/products/shipment-tracking/
- Fonctions : saisie du transporteur et du numéro de suivi sur la commande, liens, e-mail client, section « Mon compte ». Proposition : N (P0/P1), simple.

### Table Rate Shipping [E] — https://woocommerce.com/products/table-rate-shipping/
- Fonctions : tarifs par lignes de conditions (poids, prix, quantité, classe, destination), calcul par commande/article/ligne/classe, options (abandonner, annuler). Proposition : N (P1) via « règles de tarif » dans les zones.

### Transporteurs (UPS, FedEx, USPS, DHL Express, Royal Mail, Canada Post, Australia Post, Sendcloud/Boxtal [T]) — https://woocommerce.com/product-category/woocommerce-extensions/shipping-methods/
- Fonctions : tarifs en temps réel, étiquettes, suivi. Dépendances : compte transporteur et clé API. Proposition : M par transporteur ciblé (France/Afrique : Colissimo, Mondial Relay, DHL).

## Paiements
### Stripe [E gratuit] — https://woocommerce.com/products/stripe/
- Fonctions : cartes, 3D Secure (SCA), Apple/Google Pay, SEPA, iDEAL, Bancontact, etc., enregistrement de cartes, remboursements, webhooks. Dépendance : compte Stripe + clés + webhook. Proposition : M/N P0 (paiement en ligne de référence).

### PayPal Payments [E gratuit] — https://woocommerce.com/products/woocommerce-paypal-payments/
- Fonctions : PayPal, Pay Later, cartes (ACDC), Apple Pay, boutons sur fiche/panier. Dépendance : compte PayPal Business (client ID/secret, webhook). Proposition : P0/P1.

### Square [E gratuit] — https://woocommerce.com/products/square/
- Fonctions : cartes, synchronisation d'inventaire avec Square POS. Proposition : P2.

### Amazon Pay [E] — https://woocommerce.com/products/pay-with-amazon/
- Fonctions : connexion et paiement avec compte Amazon. Proposition : P2.

### WooPayments [E gratuit] — https://woocommerce.com/products/woopayments/ — solution intégrée limitée à certains pays. Proposition : non retenue (dépendance fournisseur).

### Mobile money / passerelles africaines [T] (Orange Money, MTN MoMo, Wave, CinetPay, PayDunya, Flutterwave, Paystack) — pertinent pour le public Kolakisa : à prévoir comme modules de paiement dédiés.

## Statistiques et intégrations
### Google Analytics / Google Listings & Ads / Facebook / Pinterest / TikTok [E gratuit] — https://woocommerce.com/products/google-analytics/ ; https://woocommerce.com/products/google-listings-and-ads/ ; https://woocommerce.com/products/facebook/
- Fonctions : événements e-commerce (view_item, add_to_cart, begin_checkout, purchase), flux produits pour Merchant Center, pixel Meta et API de conversion. Dépendances : identifiants GA4/Meta/Merchant. Proposition : M (P1) : « suivi marketing » par site (dataLayer + flux produit XML).

### Mailchimp / Klaviyo / Brevo [E/T] — synchronisation clients, paniers, abonnement newsletter. M (P1).

### Autres extensions importantes
- Product CSV Import Suite / import-export natif : import CSV natif [N] (produits). Proposition : N P0.
- Order Status Manager [E] : statuts personnalisés + e-mails ; P2.
- Customer/Order/Coupon CSV Export [E] ; P1.
- Cart Add-ons, Checkout Field Editor [E] : champs de checkout personnalisables ; P1.
- Conditional Shipping and Payments [E] : masquer des méthodes selon règles ; P1.
- Name Your Price, Product Bundles, Free Gift Coupons, Smart Coupons [E] : coupons avancés ; P2.
- PDF Invoices & Packing Slips [T populaire], Print Invoices [E] : factures PDF ; P0/P1 (légal en France).
- Shipping Multiple Addresses, Local Pickup Plus [E], Order Barcodes ; P2.
- Subscriptions Downgrade ; non listé.
- Jetpack / WooCommerce Tax / Shipping (étiquettes USPS/DHL) : spécifique USA, non retenu.
- Brands [E gratuit] : taxonomie marque ; P1 (N).
- Product Filters / Layered Nav [N/E] : filtres produits ; P0.
- Points d'intégration POS : Square, "WooCommerce POS" [T] ; P2.
