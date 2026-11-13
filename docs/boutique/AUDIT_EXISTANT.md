# Audit de l'existant — boutique Kolakisa (moteur Programme 20.5 et suites)

Date de l'audit : 12/11/2026. Branche `boutique-audit` (basée sur `origin/main`). Audit en lecture seule : aucun code modifié.
Méthode : lecture du code, des migrations SQL et des tests ; les docs existantes (`docs/KOLAKISA_ECOMMERCE_*.md`, `docs/cms-commerce.md`) n'ont PAS servi de preuve.

Légende des états :
- **Opérationnel testé** : branché de bout en bout (base → service → route → vue) ET couvert par un test automatisé.
- **Opérationnel non testé** : branché de bout en bout, aucun test trouvé.
- **Partiel** : une partie du besoin seulement, ou branché mais avec un manque important.
- **Défectueux** : branché mais comportement faux ou dangereux (voir PROBLEMES_CONSTATES.md).
- **Absent** : rien dans le code.

Deux commerces distincts coexistent :
1. **Boutique multi-site « Programme 20.5 »** (tables `mk_shop_*`, code `src/marketing/shop/*`, routes `/boutique`) — c'est l'objet principal de cet audit.
2. **Commerce de formations** (tables `orders`, `order_items`, `order_refunds`, `checkout_sessions`, `coupons`, `offers` de `src/config/database.js` ; routes `src/routes/cart.js`, `orders.js`, `stripeWebhook.js` ; `src/services/payments.js`) — vend des cours, sans site, sans stock, sans variantes. Les deux partagent uniquement le client Stripe (`src/services/payments.js`) et l'adresse `/stripe/webhook`.

Moteur : SQLite (better-sqlite3 synchrone, `AUTOINCREMENT`, `datetime('now')`), Express 4 + EJS. Migrations marketing dans `src/marketing/migrations/*.sql` (121, 122, 127, 131, 133 à 139 pour la boutique).

---

## 1. Produits et types

| Fonction | État réel | Preuve | Tests |
|---|---|---|---|
| Produit simple (prix, prix promo daté, SKU unique par site, poids, dimensions, galerie, étiquettes, SEO) | Opérationnel testé | `shop/catalog.js:132-166` (`productFields`), migration 121 `mk_shop_products` | `programme20-5-boutique-moteur` (« produit simple », « validations », « promotion hors période ») |
| Produit variable (attributs + variantes, prix/stock/poids/image/SKU par variante) | Opérationnel testé | `catalog.js:220-262` (`saveVariant`, clé canonique `options_key`), table `mk_shop_variants` | `programme20-5-boutique-moteur` (« produit variable ») |
| Produit « numérique » (`digital`) | **Partiel** : seule la livraison est désactivée (`requires_shipping = 0`, `catalog.js:145`). Aucun fichier à télécharger, aucune clé de licence, aucun lien de téléchargement après achat. | `catalog.js:8`, absence de toute colonne fichier dans 121 | `programme20-5-boutique-moteur` (« produit numérique : aucune livraison exigée ») |
| Produit « téléchargeable » (`downloadable`) | Absent (type réservé dans le CHECK SQL, refusé par le service) | `catalog.js:8,134` | test « type non pris en charge » |
| Produit « groupé » (`grouped`) | Absent (même cas) | idem | idem |
| Produit externe/affilié, composite, bundle, réservation (WooCommerce Bookings) | Absent | — | — |
| Abonnement lié à un produit (formules par produit) | Opérationnel, **jamais essayé contre le vrai Stripe** (dit le code : `subscriptions.js:6`) ; testé avec faux Stripe | `shop/subscriptions.js`, migration 139 | `boutique-abonnements` (21 tests) |
| Personnalisation par ligne (gravure, initiales) | Opérationnel testé | `shop/personalization.js`, migration 131 | `boutique-briques` |
| Caractéristiques techniques + comparateur | Opérationnel testé | `shop/compare.js`, migration 133 | `boutique-comparateur` |
| Contrôle d'âge (16/18/21) par produit/catégorie | Opérationnel testé (déclaration sur l'honneur uniquement) | `shop/age.js`, migration 134 | `boutique-age` |
| Description riche (HTML) | **Partiel** : `description` est échappée à l'affichage (`views/boutique/produit.ejs:29` utilise `<%= %>`), donc texte brut seulement ; pas d'éditeur riche dans la fiche admin | `views/marketing/boutique/produit.ejs` | — |
| Images produit | **Partiel** : champ texte « adresse de la médiathèque » et textarea de galerie ; aucun sélecteur de médiathèque, aucun téléversement dans la fiche | `views/marketing/boutique/produit.ejs:28-29` | — |
| Suppression douce (`deleted_at`), brouillon / publié / archivé | Opérationnel testé | `catalog.js:212`, CHECK `status` | `programme20-5-boutique-moteur` (« brouillons et supprimés n'apparaissent jamais ») |
| Duplication de produit, modification en masse, corbeille/restauration | Absent | — | — |
| Produits liés (`relatedProducts`) | Partiel : « produits liés » = mêmes catégories ; pas de ventes additionnelles/croisées choisies | `catalog.js:360` | — |

## 2. Variations

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Attributs saisis par produit (`attributes` JSON `[{name, values}]`) | Opérationnel testé | `catalog.js:127`, `mk_shop_products.attributes` | moteur |
| Génération automatique de toutes les combinaisons | **Absent** : une variante se crée une par une (formulaire `/produits/:id/variantes`) | `shopAdmin.js:112-120` | — |
| Prix/promo/stock/poids/image/SKU par variante | Opérationnel testé | migration 121 `mk_shop_variants` | moteur |
| Unicité d'une combinaison | Opérationnel testé (index unique `product_id, options_key`) | 121 | moteur |
| Attributs globaux partagés (taxonomies) | **Absent** (les attributs sont du texte libre par produit) | — | — |
| Filtrage du catalogue par attribut | Absent (le widget `shopfilters` ne filtre que prix, stock, promotion, catégorie ; commentaire de `themeBuilder/catalog/product_archive.js:3` le confirme) | — | — |

## 3. Catégories, étiquettes, marques, attributs

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Catégories hiérarchiques (parent, slug unique, description, image, position) | Opérationnel testé (recherche par descendants) | `catalog.js:74-117`, `mk_shop_categories` | moteur (« catalogue : catégorie ») |
| Page admin des catégories (créer, supprimer) | **Partiel** : création/suppression ; la modification passe par le même formulaire (`saveCategory(input, id)` accepte `id` mais la route `POST /categories` n'en transmet pas : recréation seulement) | `shopAdmin.js:206-207` | — |
| Étiquettes (tags) | **Partiel** : simple liste JSON dans `mk_shop_products.tags` ; recherche par `LIKE` sur du JSON ; pas de table, pas de page d'administration, pas de comptage | `catalog.js:323`, migration 121 | moteur (indirect) |
| Marques | **Absent** (seulement `brand` dans le JSON-LD = nom de la boutique, `shop/seo.js`) | — | — |
| Attributs globaux | Absent | — | — |
| Classes d'expédition | Absent | — | — |
| Classes de taxe | Absent | — | — |

## 4. Stocks et mouvements

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Gestion de stock par produit et par variante | Opérationnel testé | `orders.js:48-55` (`reserve`, mise à jour conditionnelle jamais sous zéro) | moteur (« dernier article : un seul acheteur gagne ») |
| Stock réservé à la création de commande, rendu à l'annulation/échec/expiration, idempotent | Opérationnel testé | `orders.js:58-70` (`stock_released`) | moteur (« annulation », « paiement échoué ») |
| Ajustement manuel (+/-) avec journal | Opérationnel testé | `catalog.js:263-277` → `mk_shop_stock_movements` | — (non vu dans les tests ciblés) |
| Consultation du journal des mouvements | **Absent** : la table est écrite, jamais lue ni affichée (aucun `SELECT` hors tests) | recherche `stock_movements` dans `src/` et `views/` | — |
| Seuil de stock bas (`low_stock_threshold`) | **Partiel** : réglage enregistré (`store.js:35`) ; utilisé seulement pour un badge « stock bas » dans la liste admin des produits (`views/marketing/boutique/produits.ejs:16`) ; aucun affichage public, aucune alerte au vendeur, aucun e-mail | `store.js`, `produits.ejs` | — |
| Remise en stock après remboursement | **Défectueux** : un remboursement (manuel ou webhook) ne remet PAS le stock | `orders.js:249-257`, `payments.js:99-107` | non testé |
| Précommande / commande en attente de stock (backorder), « notifiez-moi » | Absent | — | — |
| Réservation de stock dans le panier | Absent (le stock n'est retenu qu'à la création de la commande) — choix défendable | `cart.js` | — |
| Inventaire multi-entrepôts, import/export de stock | Absent | — | — |

## 5. Commandes et machine à états

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Création depuis le panier : prix, remise, taxes, port recalculés côté serveur ; idempotence ; total attendu vérifié ; transaction | Opérationnel testé | `orders.js:75-141` | moteur (6 tests dont double soumission, total périmé) |
| Numérotation par site (préfixe + compteur) | Opérationnel testé | `orders.js:41-45`, `mk_shop_settings.next_order_number` | moteur |
| Statuts : pending → paid → processing → shipped → completed ; cancelled ; refunded | Opérationnel testé | `orders.js:12-20` (`TRANSITIONS`) | moteur (« transitions ») |
| Statuts personnalisés, « en attente » vs « en pause » (on-hold), « échouée », « brouillon » | **Absent** (7 statuts figés par un CHECK SQL ; l'échec de paiement est un `payment_status`) | migration 121 | — |
| Historique de commande (événements) | Opérationnel testé | `mk_shop_order_events`, `orders.js:37` | moteur |
| Notes de commande (privée / au client) | **Absent** comme fonction : seule la note du changement de statut est enregistrée | `shopAdmin.js:166-177` | — |
| Numéro de suivi | **Partiel** : un champ texte à l'expédition ; pas de transporteur, pas de lien de suivi, un seul colis | `orders.js:261` | — |
| Expédition partielle, plusieurs colis | Absent | — | — |
| Annulation d'une commande payée | Absent par conception (« une commande payée se rembourse », `orders.js:226`) | — | moteur |
| Modification d'une commande (lignes, adresse, frais) après création | Absent | — | — |
| Création de commande par l'administrateur (téléphone, devis) | **Absent** | — | — |
| Liste admin : filtre statut + recherche numéro/e-mail, pagination 25 | Opérationnel non testé en détail | `shopAdmin.js:155-160` | serveur (partiel) |
| Filtre par date, par paiement, par client ; export | Absent | — | — |
| Actions groupées, impression bordereau/étiquette | Absent | — | — |
| Expiration automatique des commandes en attente (60 min, hors paiement manuel) | **Partiel** : exécutée uniquement quand un client ouvre la page de caisse (`shopPublic.js:396`) ; aucune tâche de fond | `orders.js:268` | moteur (« commandes en attente trop anciennes ») |
| Paiement manuel : confirmation par un administrateur (`shop.payments`) | Opérationnel testé | `orders.js:244-248` | moteur |
| Commandes d'abonnement (réassort, créées « payées » à la facture Stripe payée) | Opérationnel testé (faux Stripe) | `orders.js:278-302` | abonnements |
| Créneau de livraison, déclaration d'âge, personnalisation copiés sur la commande | Opérationnel testé | `orders.js:116-128`, migrations 134, 135, 131 | créneaux, âge, briques |

## 6. Remboursements

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Passer une commande à « remboursée » par l'admin (droit `shop.payments`) | **Partiel / trompeur** : c'est un simple changement de statut ; **aucun appel à Stripe** — le message dit « à effectuer chez le fournisseur de paiement ». L'argent n'est pas rendu par Kolakisa. | `orders.js:249-257` | non testé (seul le webhook l'est) |
| Remboursement total annoncé par Stripe (webhook `charge.refunded`) → commande remboursée | Opérationnel testé | `payments.js:99-107` | moteur + serveur |
| Remboursement partiel | **Partiel** : un simple événement « refund_partial » dans l'historique, aucun montant stocké, aucune table de remboursements, statut inchangé | `payments.js:106` | — |
| Remboursement par ligne, remise en stock, avoir/note de crédit | Absent | — | — |
| Remboursement depuis l'admin vers Stripe | **Absent** | — | — |
| Remboursement des unités « offertes » d'une liste de cadeaux | Opérationnel testé | `giftLists.js:207` | liste-cadeaux |
| Retours (RMA) | Absent | — | — |

(Commerce de formations : table `order_refunds` alimentée par webhook, `services/payments.js:149` — enregistrement uniquement.)

## 7. Clients

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Clients de boutique distincts des utilisateurs de la plateforme, isolés par site | Opérationnel testé | `shop/customers.js`, `mk_shop_customers` | moteur (isolation), `commerce-par-site` |
| Inscription / connexion / déconnexion / réinitialisation (scrypt, jetons hachés, limitation de débit 10/15 min) | Opérationnel testé | `customers.js:15-93`, `shopPublic.js:490-550` | moteur (« compte client ») |
| **Vérification de l'e-mail à l'inscription** | **Défectueux / absent** : un compte « invité » peut être activé par n'importe qui connaissant l'e-mail (voir PROBLEMES §1) | `customers.js:36-43` | non testé |
| Client invité (créé au paiement) ; commande lisible par jeton signé ou compte | Opérationnel testé | `shopPublic.js:421-425`, `view.js` | serveur |
| Carnet d'adresses (JSON, 10 max) | **Partiel** : la fonction existe (`updateProfile` accepte `addresses`) mais la route `/compte/profil` ne transmet que nom et téléphone (`shopPublic.js:552-556`) ; pas d'adresses enregistrées utilisables au paiement | idem | — |
| Historique des commandes côté client | Opérationnel | `shopPublic.js:490-494`, `views/boutique/compte.ejs` | serveur |
| Fiche client admin (détail, commandes, notes), segmentation, groupes | **Absent** : liste (e-mail, nom, nb commandes, dépensé) + activer/désactiver seulement | `customers.js:101-117` | — |
| Lien avec Contact Core / audiences / automatisations / scoring | **Absent** : aucun code de la boutique n'écrit dans `mk_contacts` ni n'émet d'événement (`grep mk_shop` hors `shop/`, `web/shop*`, `ai/shop`) ; `bridge/commerce.js` lit les commandes de FORMATIONS seulement | `bridge/commerce.js` | — |
| Consentement marketing (`marketing_opt_in`) | Colonne présente, jamais alimentée ni lue par un parcours | migration 121 | — |
| Export / effacement RGPD des clients de boutique | **Absent** : `services/privacy/erasure.js` ne référence aucune table `mk_shop_*` | recherche | — |
| Accès membre, ventes privées | Opérationnel testé | `shop/access.js`, migration 136 | membre (10 tests) |
| Listes de souhaits | Opérationnel (cookie + client) | `shop/wishlist.js` | briques |
| Listes de naissance / cadeaux | Opérationnel testé | `shop/giftLists.js`, migration 138 | liste-cadeaux |
| Avis vérifiés (achat réel obligatoire, modération) | Opérationnel testé | `shop/reviews.js`, migration 131 | briques |

## 8. Paiements, passerelles, webhooks

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Stripe Checkout (hébergé) : un seul article « Commande N° » du total, session de 31 min | Opérationnel testé (faux serveur Stripe) | `shop/payments.js:18-48` | `paiement-stripe`, serveur |
| Clés Stripe **par site / par vendeur** | **Absent** : clés uniques du serveur (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` en variables d'environnement) ; tous les sites encaissent sur le même compte Stripe | `shop/stripeClient.js`, `services/payments.js` | — |
| Paiement manuel (virement, à la livraison) | Opérationnel testé | `payments.js:23-26` | moteur |
| PayPal, Apple Pay/Google Pay (hors Stripe), Mollie, Adyen, Mobile Money (Wave, Orange Money, M-Pesa), paiement à la livraison avec frais | **Absent** comme passerelle de boutique (les widgets `stripebutton`/`paypalbutton` ne sont que des liens vers des pages hébergées, sans commande ni stock : `widgets/paymentbuttons.js`) | — | tests widgets |
| Webhook Stripe : signature HMAC + tolérance de rejeu, idempotence par `event.id`, montant/devise vérifiés | Opérationnel testé | `services/payments.js:61-75`, `payments.js:69-113`, `routes/stripeWebhook.js` | moteur, serveur, `paiement-stripe` |
| Relecture de session au retour client | Opérationnel testé | `payments.js:51-60` | serveur |
| Paiement échoué / session expirée → annulation + stock rendu | Opérationnel testé | `payments.js:93-98` | moteur |
| Confirmation tardive après annulation (argent reçu) | Opérationnel testé | `orders.js:190-203` | moteur |
| Autorisation puis capture, 3-D Secure explicite, acomptes, paiement fractionné, cartes enregistrées | Absent (Checkout hébergé gère 3-D Secure) | — | — |
| Plusieurs sessions Stripe ouvertes sur une même commande | **Risque** : « Payer à nouveau » crée une nouvelle session sans fermer la précédente (`shopPublic.js:469-485`) → double encaissement possible, sans remboursement automatique | — | — |

## 9. Livraison

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Zones par liste de pays (une zone qui liste le pays l'emporte sur « tous pays ») | Opérationnel testé | `shop/calc.js:43`, `store.js:44-64` | moteur |
| Méthodes : forfait, gratuite dès un montant, selon le poids (tranche min/max) | Opérationnel testé | `calc.js:52-65`, `store.js:65-78` | moteur |
| Zones par région / code postal | Absent (la zone ne connaît que les pays) | — | — |
| Tarif par article, par classe d'expédition, par pourcentage, table de tarifs | Absent | — | — |
| Retrait en magasin (méthode dédiée) | **Partiel** : migration 132 « retrait_personnaliser » concerne la personnalisation ; aucune méthode « retrait » ; possible en forfait à 0 € | — | — |
| Créneaux de livraison (dont froid) avec capacité | Opérationnel testé | `shop/deliverySlots.js`, migration 135 | créneaux |
| Calcul de port en temps réel via transporteur (Colissimo, DHL…), étiquettes | Absent | — | — |
| Modification d'une méthode ou d'une zone existante | **Absent** : créer/supprimer seulement | `shopAdmin.js:229-243` | — |
| Frais calculés dans le panier avant saisie de l'adresse | Partiel (pays par défaut de la boutique) | `cart.js:162` | moteur |

## 10. Taxes

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Règles par pays (+ région facultative), priorité, port taxé ou non, prix TTC/HT | Opérationnel testé | `calc.js:27-40,73-117`, `store.js:85-100` | moteur |
| **Une seule règle de taxe par commande** (pas de taxes composées ni de taux par produit) | Limite structurelle | `cart.js:172-176` | — |
| Classes de taxe (taux réduit, exonéré par produit) | **Absent** | — | — |
| Numéro de TVA intracommunautaire, autoliquidation, OSS/guichet unique, exonération client | Absent | — | — |
| Modifier une règle existante | Absent (créer/supprimer) | `shopAdmin.js:244-251` | — |
| Taxes sur l'affichage panier/commande (lignes de taxes enregistrées sur la commande) | Opérationnel | `orders.js:121` `tax_lines` | moteur |

## 11. Coupons et promotions

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| Coupon % ou montant fixe ; minimum ; dates ; limite globale ; limite par client (par e-mail) ; restriction produits/catégories | Opérationnel testé | `cart.js:100-119`, `store.js:107-122` | moteur |
| Un seul coupon par panier | Limite | `mk_shop_carts.coupon_code` | — |
| Coupon de livraison gratuite, achetez X obtenez Y, remise par quantité, produits exclus, e-mails autorisés, cumul | Absent | — | — |
| Modifier / supprimer un coupon | **Absent** : création et activation/désactivation seulement | `shopAdmin.js:252-258` | — |
| Prix promotionnel daté par produit/variante | Opérationnel testé | `catalog.js:53-66` | moteur |
| Ventes privées à fenêtre horaire | Opérationnel testé | `access.js:179-192`, migration 136 | membre |
| Promotions automatiques sans code, remises par catégorie, ventes flash planifiées globales | Absent | — | — |
| Cartes cadeaux / avoirs | Absent | — | — |

## 12. Marketing

| Fonction | État | Preuve |
|---|---|---|
| Paniers abandonnés (statut `abandoned` existe dans le CHECK) | **Absent** : aucune détection ni relance ; le statut n'est jamais posé |
| Événements commerce vers Contact Core / automatisations / webhooks sortants (`order.created`, `order.paid`…) | **Absent** pour la boutique (le catalogue `webhooks/catalog.js` contient `order.refunded` etc. mais seul le pont formations les émet) |
| Attribution du chiffre d'affaires (`marketing/revenue`) | **Absent** pour la boutique (branché sur `lms.order_completed`) |
| Ventes additionnelles / croisées, produits fréquemment achetés ensemble | Absent |
| Flux produits (Google Merchant, Facebook, TikTok) | Absent |
| Pixel / Google Analytics e-commerce (view_item, add_to_cart, purchase) | Absent |
| SEO : JSON-LD Product + Offer + AggregateRating/Review + fil d'Ariane, titre/description SEO par produit | Opérationnel (testé dans les tests de fiche) — `shop/seo.js` |
| Sitemap des produits et catégories | **Absent** : `src/seo/sitemap.js` ne mentionne aucune table de boutique |
| Constructeur de boutique par IA (brief → structure → produits brouillons → pages → configuration ; annuler/rétablir ; CSV) | Opérationnel testé | `src/marketing/web/aiShop.js`, `src/marketing/ai/shop/*`, migration 122 |

## 13. Rapports et analytics

| Fonction | État |
|---|---|
| Tableau de bord boutique (chiffre d'affaires, commandes du jour, panier moyen, meilleures ventes) | **Absent** |
| Rapports ventes / clients / stock / taxes / coupons ; export CSV | **Absent** |
| Seule vue agrégée : colonnes « commandes » et « dépensé » de la liste clients (`customers.js:101`) et `adminList` des listes cadeaux / abonnements |
| Analytics du site (`marketing/analytics`) | Pas d'événement boutique |

## 14. Paramètres

| Fonction | État | Preuve |
|---|---|---|
| Ouverture de la boutique, devise (code 3 lettres libre), prix TTC/HT, taxes on/off, pays par défaut, achat invité, seuil de stock, préfixe de commande, e-mail de notification, avis (activer, publication automatique) | Opérationnel testé | `store.js:24-41` ; formulaire `reglages.ejs` |
| Moyens de paiement et ouverture réservés au droit `shop.payments` | Opérationnel testé | `shopAdmin.js:222` |
| Module « Commerce » activé par site (par l'équipe de l'organisation) | Opérationnel testé | `siteModules.js`, migration 084 | `commerce-par-site` |
| Multi-devises, conversion, pays de vente autorisés, pages légales (CGV, retours), numéro de commande personnalisable au-delà du préfixe, délai d'expiration des commandes réglable | Absent |

## 15. E-mails et notifications

| Fonction | État | Preuve | Tests |
|---|---|---|---|
| E-mails client : commande reçue, payée, paiement échoué, expédiée, mise à jour, annulée, remboursée | Opérationnel (texte brut) ; passe par la file `utils/outbox` ; « SMTP non configuré » journalisé sans mentir | `shop/notify.js:10-52` | serveur, moteur |
| E-mail « Nouvelle commande » à la boutique (`notify_email`) | Opérationnel | `notify.js:55-58` | serveur |
| E-mails rendez-vous, abonnements (dont lien de gestion) | Opérationnel | `notify.js:60-105` | rdv, abonnements |
| Modèles HTML personnalisables, variables, pièce jointe facture | **Absent** (texte brut codé en dur dans `notify.js`) | — | — |
| Alerte stock bas au vendeur, nouveau avis, relance panier abandonné, e-mail « expédiée » avec transporteur | Absent | — | — |
| Journal des notifications | Table `mk_shop_notifications` écrite ; **aucune page ne l'affiche** | migration 121 | — |

## 16. Factures

Absent. Aucune génération de facture ou de reçu PDF/HTML, aucune numérotation légale séquentielle sans trou, aucune mention légale (TVA, SIRET). `rg "facture|invoice"` ne trouve que les factures **Stripe** des abonnements (`mk_shop_sub_orders.stripe_invoice_id`).

## 17. Téléchargements

Absent (voir §1) : pas de fichiers protégés, pas de limite de téléchargements, pas d'expiration de lien.

## 18. Import / export

| Fonction | État |
|---|---|
| Import CSV de produits | **Partiel** : uniquement via le constructeur IA (`/boutique/ia/:id/csv/apercu` puis `csv/ajouter`), qui crée des brouillons puis les « applique » ; pas d'import direct, pas d'import de commandes/clients/coupons |
| Import depuis WooCommerce / Shopify | Absent (les importateurs existants `web/importers.js`, `imports.js` ne traitent pas la boutique) |
| Export produits / commandes / clients (CSV, JSON) | Absent |
| Script de démonstration `scripts/boutique-demo.js` (catalogue d'un thème de test) | Existe (hors production) |

## 19. API, webhooks, hooks, modules

| Fonction | État |
|---|---|
| API REST publique de la boutique (produits, commandes) avec clés | **Absent** (les clés d'API marketing ne portent aucune portée « shop ») |
| Webhooks sortants pour événements boutique | Absent |
| Hooks / filtres / système d'extensions comparable aux hooks WooCommerce | Absent (les « modules » de `siteModules.js` sont des interrupteurs par site, pas des extensions) |
| Webhook entrant Stripe | Opérationnel (voir §8) |
| JSON de panier `/boutique/panier.json`, `comparer.json`, `rendez-vous/creneaux.json` | Opérationnel (usage interne des pages) |

## 20. Permissions

Permissions déclarées dans `src/marketing/organizations.js:41` : `shop.read`, `shop.write`, `shop.orders` (rôle minimal « éditeur »), `shop.payments` (rôle « admin »). Appliquées route par route via `need(perm)` (`shopAdmin.js:50`).
- Les lectures de commandes/clients sont ouvertes à tout `shop.read` : les adresses et e-mails des clients sont visibles par un simple éditeur. **Partiel** (pas de séparation « voir commandes » vs « voir catalogue »).
- Le changement de statut `paid`/`refunded` exige `shop.payments` (testé).
- Site archivé : écriture refusée (`writable`), testé via `commerce-par-site`.
- Rôle « gérant de boutique » / « préparateur de commandes » dédiés : absent (rôles personnalisables par ailleurs).

## 21. Isolation multisite

Opérationnel testé et solide : toutes les tables portent `organization_id` + `site_id` ; chaque requête passe par `s = {db, organizationId, siteId}` fourni par le serveur (`siteCond`), jamais par le navigateur ; jetons de panier/session/ liste hachés et recherchés dans la portée du site ; numéros, SKU, slugs, coupons uniques par `(organisation, COALESCE(site_id,0))`. Tests : moteur (« commandes et clients invisibles depuis une autre boutique », « un jeton… ne vaut rien dans une autre », « boutique principale et boutiques de sites ne partagent aucune donnée »), `commerce-par-site`, `programme21-securite-regen-boutique`.
Limite : les mises à jour de stock par `id` seul (`orders.js:52,65`) s'appuient sur des identifiants issus de lignes déjà filtrées ; pas de défaut observé mais pas de ceinture supplémentaire.
Limite : les clés de paiement ne sont pas isolées par site (voir §8).

## 22. Sécurité

Points forts constatés : montants entiers en centimes ; prix recalculés côté serveur ; webhook signé avec tolérance de rejeu ; idempotence ; mots de passe scrypt avec sel ; jetons hachés SHA-256 ; limitation de débit sur connexion/inscription/réinitialisation ; `sameOriginOnly` global (CSRF) ; échappement EJS ; JSON-LD échappé (`seo.js safeJson`) ; en-têtes `no-store` sur panier/commande/compte.
Failles et dettes : voir `PROBLEMES_CONSTATES.md` (pré-inscription sur e-mail d'invité, secret de repli `"kolakisa-dev"`, jeton de commande dans l'URL, pas de limitation de débit sur le panier/la caisse, double session Stripe, remboursement sans retour de stock…).

## 23. Performances et index

- Index présents : liste produits `(organization_id, site_id, status, deleted_at)`, slug/SKU uniques partiels, commandes `(organization_id, site_id, status, created_at)`, jetons, FK indexées par la migration 127 (audit « D3 »).
- Absents ou faibles : recherche par `LIKE '%…%'` sur nom/SKU/description/étiquettes JSON (balayage complet, pas de FTS5) ; filtre par étiquette via `LIKE` sur JSON ; prix effectif calculé dans une sous-requête corrélée (`MIN` sur variantes) pour chaque produit à chaque tri ; `mk_shop_orders(email)` non indexé alors que la recherche admin s'en sert ; `mk_shop_customers` sans index sur `name` ; `hiddenIds` recalculé à chaque requête catalogue.
- `scryptSync` (synchrone) bloque la boucle d'événements pendant les connexions (cadre de 10 tentatives/15 min par e-mail et IP seulement).
- Aucun test de charge propre à la boutique ; `programme21-performance` ne cible pas le catalogue. Pas de pagination côté panier (inutile).

## 24. Theme Builder

| Élément | État | Preuve |
|---|---|---|
| Famille « Produit individuel » (`single_product`) : 100 modèles (10 familles × 10), identités fixes, étiquettes `{{product.*}}`, widgets `shopgallery/shopbuy/shopreviews/shopspecs/shopgrid` | Opérationnel testé | `themeBuilder/catalog/single_product.js`, `single_product/{A..J}.js` ; tests `fiche-produit-bout-en-bout`, `theme-builder-catalogue*`, `scripts/audit-fiche-produit.js` |
| Famille « Archives produits » (`product_archive`) : 100 compositions (10 familles × 10) | Opérationnel testé | `catalog/product_archive.js` ; `theme-builder-archives-produits-bibliotheque`, `scripts/audit-archives-produits.js` |
| Conditions d'affichage (produits, catégories, étiquettes, auteur, tout le magasin) | Opérationnel | `themeBuilder/conditions.js`, `match.js`, `publication.js:106-130` |
| Modèles pour **panier, caisse, mon compte, confirmation, 404 boutique** | **Absent** : les vues `account` et `shop_page` existent dans le registre (`types.js:3`) mais aucun type de modèle ne les utilise ; ces pages sont rendues par `views/boutique/*.ejs` fixes (habillées par l'en-tête/pied du thème et `site.assets`) |
| Modèle d'e-mail de commande | Absent |
| Pas de rendu de repli : sans modèle, la boutique affiche les vues EJS par défaut | Opérationnel |

## 25. Widgets e-commerce de l'éditeur (Page Builder) et leurs contrôles

Source : `src/marketing/pages/widgets/shop.js`, `cart.js`, `paymentbuttons.js`. Tous « operational », groupe « commerce ». Les widgets `shop*` lisent la boutique du SITE DE LA PAGE ; absents si module/boutique fermés (indice dans l'éditeur).

| Widget (type) | Contrôles (clé : nature) | État |
|---|---|---|
| Grille de produits (`shopgrid`) | title (texte) ; source (tous / vedette / promo / catégorie / suit la page…) ; category (adresse) ; count 1-24 ; columns 2-5 ; orderby (nouveautés, vedette, prix ↑↓, nom) ; layout (grille/liste) ; ratio d'image ; cardStyle (encadrée/sans cadre/fond doux) ; cartLabel ; optionsLabel ; badgeLabel ; empty ; + cases (prix, promo, bouton… via `bool(...)`) | Opérationnel testé (`editeur-boutique`, `programme20-5-boutique-builder`) |
| Ajouter au panier (`shopbuy`) | product (adresse ou produit de la page) ; label ; outLabel ; variantStyle (liste / boutons / pastilles) ; buyNowLabel ; cases (quantité, prix, SKU…) | Opérationnel testé |
| Panier, commande et compte (`shopcart`) | cartLabel ; checkoutLabel ; accountLabel ; cases | Opérationnel testé |
| Recherche de produits (`shopsearch`) | placeholder ; button ; cases | Opérationnel testé |
| Filtres de produits (`shopfilters`) | direction (ligne/colonne) ; resetLabel ; button ; cases (catégorie, prix, stock, promo, tri) | Opérationnel testé ; pas de filtre par attribut/marque/note |
| Galerie du produit (`shopgallery`) | layout (miniatures gauche/bas, empilé, grille…) ; ratio ; badgeLabel ; cases | Opérationnel testé |
| Avis clients (`shopreviews`) | title ; count 1-20 ; empty ; cases | Opérationnel testé |
| Caractéristiques (`shopspecs`) | title ; cases | Opérationnel testé |
| Panier (`cart`) | title ; showImage ; showTotal ; checkoutLabel ; cartLabel ; empty — **ne concerne que le panier de FORMATIONS** (lit `visitor.cartIds` et `getCourse`) | Opérationnel mais **n'est pas le panier de la boutique** |
| Bouton Stripe / Bouton PayPal | link (liste blanche de domaines) ; label ; size ; align ; fullWidth ; showIcon ; note ; newTab | Opérationnel testé ; liens externes, pas de commande ni de stock |

Widgets WooCommerce courants **absents** : titre du produit, prix, description, extrait, note moyenne, méta (SKU/catégories/étiquettes), fil d'Ariane, produits liés/ventes additionnelles/croisées (sauf via `shopgrid`), onglets d'informations, catégories de produits (liste/vignettes), produits récents/mieux notés/en promotion (partiellement via `shopgrid`), mini-panier, page panier, page caisse, mon compte, suivi de commande, ajout à la liste de souhaits, bouton de comparaison (dans les vues par défaut, pas en widget), compteur de résultats (existe côté archives : `archiveinfo`), tri (existe : `searchsort`), « notifiez-moi », bouton rapide « aperçu ».
Les étiquettes dynamiques `{{product.*}}` (id, title, priceLabel, regularLabel, url, image, category, sku, availability…) fournissent titre/prix/description dans les modèles (`shop/view.js productScope`).

## 26. Administration : pages et menus

Menu principal CMS (`web/cmsNav.js:72-79`) : Boutique → Produits (+ bouton « Nouveau produit »), Commandes, Clients, Réglages de la boutique. Les autres écrans se trouvent dans les onglets de `views/marketing/boutique/_head.ejs` (donc **pas** dans le menu latéral) : Catégories, Avis, Rendez-vous, Listes cadeaux, Abonnements, Accès membre.

| Page (route sous `/…/boutique`) | Fonctions | Permission |
|---|---|---|
| `` (produits) | liste, recherche, filtre statut, pagination | shop.read |
| `/produits/nouveau`, `/produits/:id` | fiche : champs, variantes, ajustement de stock, personnalisation, caractéristiques, âge, formules d'abonnement ; suppression | shop.write |
| `/categories` | créer, supprimer, âge minimum | shop.read / write |
| `/avis` | modérer, supprimer | shop.read / write |
| `/acces` | membres, codes d'invitation, règles, ventes privées | shop.read / write |
| `/listes-cadeaux` | lecture des listes (chiffres réels) | shop.read |
| `/commandes`, `/commandes/:id` | liste, détail, changer le statut (suivi à l'expédition), paiements, historique | shop.read / orders / payments |
| `/clients` | liste, activer/désactiver | shop.read / write |
| `/reglages` | boutique & paiement ; créneaux ; livraison (zones, méthodes) ; taxes ; coupons | shop.read / write / payments |
| `/rendez-vous`, `/rendez-vous/reglages` | types, disponibilités, exceptions, statuts, report | shop.read / write |
| `/abonnements` | liste, annulation par le vendeur | shop.read / orders |
| `/boutique/ia/*` (constructeur IA) | projets, assistant, CSV, application, publication | forms.*, shop.write, shop.payments, pages.publish |

Absents côté admin : tableau de bord, rapports, détail client, import/export, modification d'une zone/méthode/taxe/coupon, journal des mouvements de stock, journal des notifications, impression de commande, création de commande.

## 27. Boutique publique (routes `/boutique/*`)

Opérationnelles et testées (`programme20-5-boutique-serveur`, 29 tests ; `programme20-5-boutique-navigateur` en navigateur) : catalogue, recherche, catégorie, étiquette, fiche produit (`shopPublic.js:109-135`), panier (ajout, quantité, suppression, coupon, version anti-conflit, JSON), caisse (adresses, pays, méthode de livraison, créneau, âge, paiement, double soumission), retour de paiement, confirmation, nouvelle tentative de paiement, compte client, avis, souhaits, comparateur, accès membre, âge, listes cadeaux, rendez-vous, abonnements. Boutique servie selon l'hôte (`req.kwSite`), 404 neutre si module fermé ou boutique non ouverte.
Les pages sont rendues par des vues EJS par défaut OU par un modèle Theme Builder pour la fiche produit et l'archive seulement.

## 28. Synthèse des tests existants

~270 cas de test liés à la boutique répartis sur 23 fichiers (voir la liste en tête de MATRICE_ECARTS.md). Les résultats d'exécution du 12/11/2026 sont dans `PROBLEMES_CONSTATES.md`, section « Résultats des tests ».
Non couverts : remboursement manuel depuis l'admin, retour de stock au remboursement, remise en stock après annulation partielle, admin de zones/taxes/coupons en détail, rendu de toutes les vues EJS publiques en mode sombre/mobile (hors audits visuels), charge.
