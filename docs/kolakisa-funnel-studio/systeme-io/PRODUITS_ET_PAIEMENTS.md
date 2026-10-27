# Produits et paiements

Préfixe `H` = https://help.systeme.io/article/

## 1. Page « Order form »

Source : H252-how-to-create-an-order-form-payment-page.
- Création : Add step > Type = « Order form » > modèle > Save > page de configuration > **Edit page**.
- Champ obligatoire : **Choose offer type** = produit numérique ou physique.
- Ressource remise après paiement (produit numérique) : **Courses**, **Course bundles**, **Tags**, **Communities**, **Calendar events** (paiement d'un événement calendrier ; impossible sur upsell/downsell/order bump). Produit physique : choisir un produit existant.
- Plans tarifaires : un ou plusieurs, facultatif à la création mais nécessaire pour vendre (H247).
- Champs de saisie du formulaire de commande (facturation, adresse...) : non détaillés par les sources. À VÉRIFIER. Stripe exige Email et First Name sur les pages de paiement (H225-how-to-connect-your-stripe-account-to-systeme-io).
- Variante deux étapes : voir FORMULAIRES_ET_CONTACTS.md (H235).
- Éléments de page : Offer price, Physical product, Order bump, Coupon (H292, H154, H247).

## 2. Plans tarifaires (produits numériques)

Source : H153-how-to-create-and-configure-a-price-plan. Parcours : order form > Digital product > « + » > **Digital product name** > « + » plan > choisir un plan existant (puis Save) ou **Create a new one**.
Champs d'un plan : nom d'affichage tableau de bord, nom d'affichage Order Form, **statement descriptor**, type de plan.
Types :
- **One-time payment** : montant, comportement de la taxe.
- **Subscription** : essai gratuit (durée + unité jours/semaines/mois/années, 0 = aucun), coût, intervalle (ex. tous les 1 mois), tax behavior.
- **Payment plan** : comme l'abonnement + nombre total de paiements.
Limites : valeurs possibles du tax behavior, devises, maximums d'essai/paiements : non précisés. À VÉRIFIER. Pour les produits physiques le plan se crée avec le produit.
Stripe traite un payment plan comme un abonnement à échéances limitées (« Subscriptions » dans Stripe) (H225).

## 3. Produits physiques

Source : H292-how-to-create-and-sell-a-physical-product-on-systeme-io.
- Création : Assets > Physical products > Create.
- Champs : nom, description, SKU, taxe produit, comportement de la taxe (incluse/exclue), devise, prix, poids, inventaire, livraison (frais de port activables), images.
- Options/variantes : nom + valeurs (« + Add another option »), variantes auto-générées, prix de variante modifiable seulement s'il diffère, SKU/images/stock par variante. Limites de variantes : Free 50, Startup 100, Webinar 250, Unlimited sans limite.
- Mise en vente : tunnel Sell ou Custom, offre « Physical product », éléments Physical product + Offer price dans la section Paiement de l'éditeur. Suivi : Ventes > Commandes (filtres date, type, statut, produit).
- Limites : devise du tunnel = devise du produit ; systeme.io ne gère ni expédition ni logistique ; paiement à la livraison possible (article 2223 non lu) ; passerelles citées : PayPal, Stripe, Mollie, paiement à la livraison.

## 4. Coupons

Source : H247-how-to-create-and-add-a-coupon-code-to-your-order-form.
- Création : Assets > Coupons > Create. Champs : **Coupon name**, **Coupon code**, **Discount type** (montant fixe ou pourcentage), **Discount amount**, **Expiration** (sélecteur de calendrier ; une date saisie à la main rend le coupon inopérant), **Limit of use** (vide = illimité) ; **Coupon currency** s'ajoute pour un montant fixe.
- Règles : sur abonnement et payment plan, la réduction s'applique à chaque échéance ; gratuité = 100 % ou montant égal au prix.
- Insertion : order form > section **Coupons** > « + » > type + code > Save ; éditeur : glisser l'élément **Coupon**. Un plan tarifaire doit exister.
- Cumul de coupons, nombre max par formulaire, message d'erreur de code invalide : non documentés. À VÉRIFIER. L'API expose création/liste de coupons (H2323-how-to-create-a-public-api-key-on-systeme-io).

## 5. Passerelles de paiement

- Activation par tunnel : Funnel settings > cases **Credit card or debit card** et **PayPal** > Save (H307-how-to-activate-payments-by-stripe-or-paypal).
- Stripe : Settings > Payment Gateways > Connect > autorisation (H225). Moyens : carte (46 devises listées dans l'article), Apple Pay (bloqué si compte Stripe indien), iDEAL (EUR, NL), Bancontact (EUR, BE), Klarna, Multibanco (EUR, PT). SEPA requis pour iDEAL/Bancontact. Frais non mentionnés.
- Autres passerelles listées (articles non lus) : PayPal (132), Razorpay (1752), Secure and Pay (2967), Flutterwave (1810), Mercado Pago (2096), Xendit (2225), Mollie (1965), GoCardless (2146), paiement à la livraison (2223). Source : https://help.systeme.io/category/538-payments. Capacités à vérifier une par une.
- Commission de transaction : « 0 % de frais de transaction » pour Stripe/PayPal selon https://systeme.io/pricing (frais des passerelles non inclus). À VÉRIFIER.
- Fraude : Stripe Radar (article 4450) non lu. Abonnement en échec (1661) non lu. Factures automatiques (250/318) non lues. Remboursements : « How to refund a customer » citée dans H151, non lue.
- Taxes : seul le « tax behavior » apparaît. Calcul TVA/OSS : non documenté. À VÉRIFIER.

## 6. Après achat

- Ressource donnée : accès cours / pack / communauté / tag (H252). Livraison de produit numérique par e-mail : article 294 non lu.
- Récapitulatif : élément **Order Summary** uniquement sur « Sales Thank You » (H352-how-to-add-the-order-summary-on-the-thank-you-page).
- Déclencheur « New sale » / webhook `customer.sale.completed` : voir EMAILS_ET_AUTOMATISATIONS.md et INTEGRATIONS_ET_API.md.
