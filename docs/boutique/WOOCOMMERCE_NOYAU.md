# WooCommerce : le noyau (natif) et ce qu'il faut en retenir pour Kolakisa

Statut des sources : les sites cités n'ont pas pu tous être relus en direct pendant cette session (la lecture web a été partielle : la page d'accueil d'aide Elementor et le dossier docs Store API de GitHub n'ont rien donné d'exploitable). Le contenu ci-dessous est un résumé rédigé avec mes mots à partir de la documentation officielle telle que je la connais ; chaque section indique l'URL à rouvrir pour vérifier le détail. Tout ce qui est « natif » vient du plugin WooCommerce gratuit.

Légende : [N] natif WooCommerce, [E] extension officielle (souvent payante), [T] tiers.

Sources générales :
- https://woocommerce.com/documentation/woocommerce/
- https://developer.woocommerce.com/
- https://github.com/woocommerce/woocommerce (dossier `docs/`)
- https://woocommerce.github.io/woocommerce-rest-api-docs/

---

## 1. Architecture et modèle de données
Source : https://developer.woocommerce.com/docs/ et https://github.com/woocommerce/woocommerce/tree/trunk/docs

WooCommerce est un plugin WordPress. Il s'appuie sur le modèle WordPress (articles, métadonnées, taxonomies, utilisateurs) et ajoute ses propres tables.

Données historiques (CPT = types de contenu personnalisés) :
- `product` et `product_variation` : produits et variations (dans `wp_posts` + `wp_postmeta`).
- `shop_order`, `shop_order_refund` : commandes et remboursements (ancien stockage).
- `shop_coupon` : coupons.
- Taxonomies : `product_cat` (catégories, hiérarchiques), `product_tag` (étiquettes), `product_type`, `product_visibility`, `product_shipping_class`, et une taxonomie `pa_*` par attribut global.
- Tables `wc_*` / `woocommerce_*` : `wc_product_meta_lookup` (prix, stock, SKU, notes pour tri/filtre rapides), `wc_product_attributes_lookup`, `wc_customer_lookup`, `wc_order_stats`, `wc_order_product_lookup`, `wc_order_coupon_lookup`, `wc_order_tax_lookup` (alimentent Analytics), `wc_download_log`, `wc_webhooks`, `wc_tax_rate_classes`, `woocommerce_order_items` / `woocommerce_order_itemmeta` (lignes de commande), `woocommerce_tax_rates` / `woocommerce_tax_rate_locations`, `woocommerce_shipping_zones` / `_zone_locations` / `_zone_methods`, `woocommerce_sessions` (paniers invités), `woocommerce_api_keys`, `woocommerce_downloadable_product_permissions`, `woocommerce_payment_tokens(+meta)`, `woocommerce_log`.

HPOS (High-Performance Order Storage) : depuis WooCommerce 8.2 c'est le stockage par défaut des commandes. Tables dédiées `wc_orders`, `wc_order_addresses`, `wc_order_operational_data`, `wc_orders_meta`. Raison : performances et fin du mélange commandes/articles. Mode « synchronisation » possible avec l'ancien stockage pendant la migration.
=> Leçon Kolakisa : une commande doit être une table dédiée (adresses, lignes, totaux, statut, méta clef/valeur), jamais un contenu « générique ». Prévoir des tables de recherche dénormalisées pour les rapports.

Objets métier : WooCommerce passe par des classes « CRUD » (`WC_Product`, `WC_Order`, `WC_Customer`, `WC_Coupon`, `WC_Cart`, `WC_Session`) avec un « data store » interchangeable. Équivalent Node : services + dépôts (repositories).

---

## 2. Types de produits
Source : https://woocommerce.com/document/managing-products/ (et sous-pages « product types »)

[N] Simple (un SKU, un prix) ; Variable (variations par combinaison d'attributs) ; Groupé (« grouped » : page qui liste des produits enfants, achetés séparément) ; Externe/affilié (bouton vers un site tiers, prix informatif) ; options « Virtuel » (pas d'expédition) et « Téléchargeable » (fichiers) valables pour simple et variation.
[E] Abonnement, Réservation, Composite, Bundle, Carte-cadeau… (voir WOOCOMMERCE_EXTENSIONS.md).

Champs communs : nom, slug, description longue, description courte, galerie d'images + image mise en avant, catégories, étiquettes, statut (publié, brouillon, en attente, privé), visibilité catalogue (boutique + recherche, boutique seule, recherche seule, masqué), mise en avant (« featured »), note d'achat, ordre du menu, activation des avis, ventes liées (upsells), ventes croisées (cross-sells), attributs personnalisés.
Données de prix : prix régulier, prix promo, dates de début/fin de promo, statut taxe (taxable/livraison seule/aucune), classe de taxe.
Inventaire : SKU, gérer le stock (oui/non), quantité, seuil de rupture bas, statut stock (en stock / rupture / en commande), précommandes autorisées (non/avec notification/oui), vente individuelle (1 par commande).
Expédition : poids, L×l×H, classe d'expédition.
Téléchargeable : liste de fichiers (nom + URL), limite de téléchargements, expiration en jours.

## 3. Attributs et variations
Source : https://woocommerce.com/document/managing-products/ (sections Attributes / Variable products)
- Attributs globaux (taxonomie réutilisable, avec « termes », archives optionnelles, tri) et attributs personnalisés propres à un produit.
- Variation = combinaison d'attributs marqués « utilisés pour les variations ». Chaque variation peut surcharger : SKU, prix, promo, stock, poids, dimensions, classe d'expédition, image, description, téléchargements. « N'importe quel » = joker.
- Limite connue : 50 variations générées en un clic (par lot), recherche de variation via table de correspondance.
=> Kolakisa : tables `attributs`, `valeurs_attribut`, `produits_attributs`, `variations` (avec JSON de combinaison unique indexé).

## 4. Stocks
Source : https://woocommerce.com/document/managing-products/#inventory
- Gestion au niveau produit ou variation (une variation peut hériter du parent).
- Statuts : instock, outofstock, onbackorder.
- Réduction du stock à la commande payante/en traitement ; restauration à l'annulation/remboursement/échec ; « stock retenu » pendant le paiement (réservation par durée, option « Conserver le stock (minutes) », défaut 60) pour éviter la survente.
- Notifications : stock bas, rupture (e-mail admin). Option masquer les produits en rupture. Format d'affichage du stock (toujours / seulement si bas / jamais).
=> Kolakisa : mouvements de stock journalisés (table `stock_mouvements`), réservation à durée limitée, verrou transactionnel au moment de la validation.

## 5. Commandes
Source : https://woocommerce.com/document/managing-orders/
Statuts natifs : `pending` (en attente de paiement), `processing` (en cours), `on-hold` (en attente), `completed` (terminée), `cancelled`, `refunded`, `failed`, plus `checkout-draft` (brouillon technique des blocs) et `trash`. Statuts personnalisés possibles par code.
Transitions typiques : pending -> processing (paiement reçu, ou -> completed si tout virtuel/téléchargeable) ; pending -> on-hold (virement, chèque) ; on-hold -> processing ; processing -> completed (expédié) ; * -> cancelled ; processing/completed -> refunded ; pending -> failed (paiement refusé). Chaque transition déclenche des hooks (e-mails, stock, droits de téléchargement, ventes de coupons).
Contenu : numéro, date, client (ou invité), adresses facturation/livraison, lignes (produit, variation, qté, sous-total, total, taxes, méta), frais (« fees »), lignes de livraison, lignes de taxe, coupons appliqués, totaux (remise, livraison, taxe, total), méthode de paiement, ID de transaction, devise, IP et user-agent, note client, clés (`order_key`).
Notes de commande : privées (équipe) ou « note au client » (envoie un e-mail), avec auteur et date ; les changements de statut en génèrent automatiquement.
Remboursements : objets distincts (liés à la commande), montant total ou partiel, par ligne (quantité + montant + taxe), motif, option « remettre en stock », remboursement automatique via la passerelle (si supporté) ou manuel.
Actions : renvoyer e-mails, régénérer droits de téléchargement, recalculer, créer commande manuelle (admin), modifier tant que non payée.
Création : checkout, admin, REST.

## 6. Clients
Source : https://woocommerce.com/document/managing-customers/ (docs « customers » et « Analytics > Customers »)
Compte WordPress de rôle `customer` (ou invité). Données : e-mail, nom, adresses facturation/expédition, téléphone, pays/état, historique commandes, total dépensé, nombre de commandes, date dernière activité, jetons de paiement enregistrés. Table `wc_customer_lookup` pour Analytics (aussi pour invités). Création de compte au paiement (option), génération de mot de passe, inscription depuis « Mon compte ».

## 7. Coupons
Source : https://woocommerce.com/document/coupon-management/
Types : pourcentage, montant fixe sur le panier, montant fixe sur le produit. (Les coupons « X acheté, Y offert » sont des extensions.)
Champs généraux : code (insensible à la casse), description, montant, livraison gratuite (condition : méthode « livraison gratuite exige un coupon » ), date d'expiration.
Restrictions d'utilisation : dépense minimale, dépense maximale, usage individuel (non cumulable avec d'autres coupons), exclure les articles en promo, produits, produits exclus, catégories, catégories exclues, e-mails autorisés (liste, vérifiée au paiement).
Limites : par coupon, par utilisateur, nombre d'articles auxquels limiter la remise (pour les remises « par produit »).
Règles : le coupon s'applique sur prix avant taxe ou après selon configuration des taxes ; remises appliquées dans l'ordre des coupons ; un « fixed cart » est réparti proportionnellement sur les lignes ; l'activation globale se règle dans Réglages > Général (« Activer les codes promo »), option « calculer les remises séquentiellement ». Usages comptés à la validation de commande.
Données REST : `code, amount, discount_type, date_expires, usage_count, individual_use, product_ids, excluded_product_ids, usage_limit, usage_limit_per_user, limit_usage_to_x_items, free_shipping, product_categories, excluded_product_categories, exclude_sale_items, minimum_amount, maximum_amount, email_restrictions, used_by`.

## 8. Taxes
Source : https://woocommerce.com/document/setting-up-taxes-in-woocommerce/
- Activer les taxes ; saisie des prix TTC ou HT ; calcul basé sur adresse client (livraison, facturation) ou adresse de la boutique ; classe d'expédition de taxe ; arrondi par ligne ou au sous-total (option « arrondir les taxes au niveau de la ligne ») ; décimales de prix ; affichage boutique/panier TTC ou HT ; suffixe d'affichage (« TTC »).
- Classes : standard, taux réduit, taux zéro, + personnalisées. Chaque classe a une table de taux importable en CSV.
- Taux : pays, état, code postal(s) (listes, jokers, plages), ville, taux %, nom, priorité, « composé » (taxe sur taxe), « livraison » (s'applique à la livraison). Plusieurs taux de priorités différentes s'additionnent ; même priorité : le premier correspondant.
- Prix inclus : la taxe est extraite du prix ; si le client est dans une zone à autre taux, WooCommerce peut ajuster pour conserver le prix affiché (règle « correspondance de taxe de la boutique »).
- Exonération : par client (extension) ou par pays ; TVA UE/OSS : extension dédiée ou réglages tiers [E/T].
- [N] Taxes automatiques : service Jetpack/WooCommerce Tax (États-Unis surtout).
=> Kolakisa : modèle `taux_taxe (pays, region, cp, ville, taux, priorité, compose, livraison, classe)` + calcul déterministe et testé (arrondi par ligne vs total à documenter).

## 9. Livraison
Source : https://woocommerce.com/document/setting-up-shipping-zones/ ; https://woocommerce.com/document/flat-rate-shipping/ ; https://woocommerce.com/document/free-shipping/ ; https://woocommerce.com/document/local-pickup/
- Zones : ensemble régions/pays/codes postaux, avec une liste ordonnée de méthodes ; la première zone correspondante gagne ; zone « Reste du monde » implicite.
- Méthodes natives : Forfait (flat rate : coût fixe, formules avec `[qty]`, `[cost]`, `[fee percent="10" min_fee="" max_fee=""]`, coût par classe d'expédition, option « par commande » ou « par classe »), Livraison gratuite (conditions : aucune, coupon, minimum, minimum OU coupon, minimum ET coupon), Retrait en magasin (local pickup, coût optionnel, taxable ; version « blocs » avec lieux multiples).
- Classes d'expédition : étiquettes pour produits (volumineux, fragiles) qui modifient le tarif forfaitaire.
- Calcul : au panier selon adresse (ou estimation par pays/CP), regroupe les colis (un colis par défaut), taxe sur livraison selon réglages, option « expédier uniquement à l'adresse de facturation », destinations de livraison (tous pays, certains pays, facturation).
- Résultat : lignes `shipping` dans la commande, plusieurs colis possibles via code.
- [E] Table Rate Shipping, UPS, FedEx, USPS, DHL, Royal Mail, Canada Post, Australia Post, Shipping Multiple Addresses, Shipment Tracking (voir extensions).

## 10. Paiements
Source : https://woocommerce.com/document/payments/ ; https://developer.woocommerce.com/docs/ (payment gateway API)
- Passerelles natives : virement bancaire (BACS), chèque, paiement à la livraison (COD), + WooPayments (extension officielle gratuite, cartes, portefeuilles, devises multiples, litiges ; disponibilité par pays), PayPal Payments (officiel).
- Types de passerelles : formulaire sur site (carte, jetons), redirection (hébergée chez le prestataire), iframe, hors ligne.
- Flux standard : checkout -> création commande `pending` -> `process_payment()` renvoie `success` + URL de redirection ou ordre -> notification serveur (webhook/IPN) -> `payment_complete()` met la commande en processing/completed et réduit le stock -> retour client page « commande reçue ». En cas d'échec : `failed`, message, panier conservé.
- Remboursements : méthode `process_refund` de la passerelle.
- Jetons enregistrés (carte) : table payment_tokens.
- Webhooks passerelle : fournis par chaque fournisseur (Stripe `payment_intent.succeeded`, etc.), souvent via endpoint `wc-api=<id>`. Signature à vérifier, idempotence obligatoire.
- Réglages : activer, ordre (glisser), titre, description, instructions e-mail, restrictions pays/livraison, mode test/production.
=> Kolakisa : interface « fournisseur de paiement » (créer paiement, confirmer, rembourser, webhook) ; au minimum virement/COD + Stripe + PayPal ; dépend de clés API.

## 11. E-mails transactionnels
Source : https://woocommerce.com/document/automated-emails-and-newsletters/ ; https://woocommerce.com/document/email-faq/
Clients : commande en attente (« on-hold »), en cours, terminée, remboursée (totale/partielle), facture/détails (manuel), note client, nouveau compte, réinitialisation de mot de passe, commande échouée (à l'admin). Admin : nouvelle commande, annulée, échouée. Chaque e-mail : activer, destinataire, objet, en-tête, contenu additionnel, type (HTML/texte/multipart). Réglages globaux : nom/adresse d'expéditeur, image d'en-tête, texte de pied, couleurs (fond, corps, base, texte). Templates remplaçables par thème. Éditeur de blocs d'e-mails en bêta récente.
=> Kolakisa : un moteur de modèles e-mail par événement, variables (`{order_number}` etc.), prévisualisation, journal d'envoi.

## 12. Comptes et confidentialité
Source : https://woocommerce.com/document/privacy-and-data-protection/ ; https://woocommerce.com/document/woocommerce-endpoints/
- « Mon compte » : endpoints `orders`, `downloads`, `edit-address`, `payment-methods`, `edit-account`, `lost-password`, `customer-logout`, `view-order`. Connexion/inscription, génération de mot de passe, création de compte au checkout ou après.
- Confidentialité : texte de politique, cases à cocher, durées de conservation (comptes inactifs, commandes en attente/échouées/annulées anonymisées après X mois), demande d'export (« exporter données personnelles ») et d'effacement via les outils WordPress (Outils > Exporter/Effacer), avec option de conserver les données comptables.
=> Kolakisa : exports JSON/CSV par client, anonymisation planifiée, consentements journalisés.

## 13. Produits téléchargeables
Source : https://woocommerce.com/document/digital-downloadable-product-handling/
Fichiers liés au produit/variation ; droits par commande (table de permissions : e-mail, clé, limite, expiration, compteur) ; méthodes de service de fichier (forcer le téléchargement, X-Accel/X-Sendfile, redirection) ; connexion requise option ; accès après paiement ou après « en cours » ; journal des téléchargements ; restriction par répertoire protégé.

## 14. Avis
Source : https://woocommerce.com/document/product-reviews/ (ou page « Reviews and ratings »)
Commentaires de type `review` sur produit ; note 1 à 5 (activable/obligatoire), mention « achat vérifié », modération (anti-spam, approbation), note moyenne et compteur stockés dans la méta produit.

## 15. Analytics et rapports
Source : https://woocommerce.com/document/woocommerce-analytics/
Rapports : Aperçu, Produits, Revenus, Commandes, Variations, Catégories, Coupons, Taxes, Téléchargements, Stock, Clients, Paramètres (statuts exclus, date d'attribution, import de données historiques). Filtres de période, comparaison, avancés, graphiques, export CSV. Basé sur les tables `wc_order_stats` & co. et des tâches planifiées (Action Scheduler).

## 16. Paramètres (onglets)
Source : https://woocommerce.com/document/woocommerce-settings/ (et pages par onglet)
- Général : adresse boutique, zones de vente/livraison, emplacement par défaut du client, activer taxes, activer coupons, calcul séquentiel, devise (symbole, position, séparateurs, décimales).
- Produits : page boutique, redirection ajout au panier, mise en page ; unités poids/dimensions ; avis ; Inventaire (gestion, durée de réservation, notifications, seuils) ; Produits téléchargeables.
- Taxes : voir section 8 (+ sous-onglets par classe).
- Expédition : zones, options (calculateur panier, destination), classes, retrait local.
- Paiements : liste/ordre des passerelles.
- Comptes et confidentialité : invité, création de compte, politique, rétention.
- E-mails : section 11.
- Intégration : clé API MaxMind (géolocalisation).
- Avancé : pages (panier, checkout, mon compte, conditions), points de terminaison, API REST (clés), webhooks, fonctionnalités (HPOS, blocs, stats), WooCommerce.com.
- Outils (Statut > Outils) : vider transients, effacer sessions, recréer tables, régénérer miniatures, recalculer compteurs, supprimer commandes de test, réinitialiser rôles, réinstaller pages. Statut : rapport système (environnement, base, plugins, modèles remplacés), Journaux, Tâches planifiées (Action Scheduler).

## 17. API REST v3
Source : https://woocommerce.github.io/woocommerce-rest-api-docs/ ; https://developer.woocommerce.com/docs/apis/
Base : `/wp-json/wc/v3/`. Authentification : HTTPS + clé consommateur/secret (Basic) ; OAuth 1.0a en HTTP ; l'authentification par application password WordPress. Pagination en-têtes `X-WP-Total`, `X-WP-TotalPages`, `per_page` (max 100), `page`, filtres `search`, `after`, `before`, `modified_after`, `orderby`, `order`, `status`.
Ressources : `products` (+ `variations`, `attributes` + `terms`, `categories`, `tags`, `shipping_classes`, `reviews`), `orders` (+ `notes`, `refunds`), `customers` (+ `downloads`), `coupons`, `taxes` (+ `classes`), `shipping/zones` (+ `locations`, `methods`), `shipping_methods`, `payment_gateways`, `settings` (groupes + options), `system_status` (+ `tools`), `webhooks`, `data` (pays, devises, continents), `reports` (ancien), `products/reviews`, et `wc-analytics` (non documenté, utilisé par l'admin). Opérations `batch` (create/update/delete jusqu'à 100).
Champs clés produit : `id,name,slug,type,status,featured,catalog_visibility,description,short_description,sku,price,regular_price,sale_price,date_on_sale_from/to,on_sale,purchasable,total_sales,virtual,downloadable,downloads,download_limit,download_expiry,external_url,button_text,tax_status,tax_class,manage_stock,stock_quantity,stock_status,backorders,backorders_allowed,backordered,sold_individually,weight,dimensions,shipping_required,shipping_taxable,shipping_class,reviews_allowed,average_rating,rating_count,related_ids,upsell_ids,cross_sell_ids,parent_id,purchase_note,categories,tags,images,attributes,default_attributes,variations,grouped_products,menu_order,meta_data`.
Champs clés commande : `id,parent_id,number,order_key,status,currency,date_created,discount_total,discount_tax,shipping_total,shipping_tax,cart_tax,total,total_tax,prices_include_tax,customer_id,customer_note,billing,shipping,payment_method,payment_method_title,transaction_id,date_paid,date_completed,line_items,tax_lines,shipping_lines,fee_lines,coupon_lines,refunds,set_paid,meta_data`.
Client : `email,first_name,last_name,username,billing,shipping,is_paying_customer,orders_count,total_spent,avatar_url`.

## 18. Webhooks
Source : https://woocommerce.com/document/webhooks/
Un webhook = nom, statut (actif/en pause/désactivé), sujet (topic), URL de livraison, secret (signature HMAC-SHA256 dans `X-WC-Webhook-Signature`), version d'API. Sujets : `coupon.created/updated/deleted/restored`, `customer.*`, `order.*`, `product.*`, et « action » personnalisée (`action.woocommerce_add_to_cart`…). En-têtes : `X-WC-Webhook-Topic`, `-Resource`, `-Event`, `-Signature`, `-ID`, `-Delivery-ID`. Désactivation automatique après échecs consécutifs (5). Livraison asynchrone.

## 19. Hooks et filtres principaux
Source : https://developer.woocommerce.com/docs/hooks/ ; https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/class-wc-order.php
Actions : `woocommerce_add_to_cart`, `woocommerce_cart_updated`, `woocommerce_before_calculate_totals`, `woocommerce_checkout_order_processed`, `woocommerce_payment_complete`, `woocommerce_order_status_{from}_to_{to}`, `woocommerce_order_status_{status}`, `woocommerce_new_order`, `woocommerce_thankyou`, `woocommerce_reduce_order_stock`, `woocommerce_email_*`, `woocommerce_before_single_product_summary`, `woocommerce_single_product_summary`, `woocommerce_after_shop_loop_item`…
Filtres : `woocommerce_get_price_html`, `woocommerce_product_get_price`, `woocommerce_cart_item_price`, `woocommerce_package_rates`, `woocommerce_available_payment_gateways`, `woocommerce_coupon_is_valid`, `woocommerce_add_to_cart_validation`, `woocommerce_checkout_fields`, `woocommerce_email_classes`, `woocommerce_product_tabs`, `woocommerce_order_statuses`…
=> Kolakisa : bus d'événements nommé (même nomenclature) + « filtres » asynchrones exposés aux modules activables par site.

## 20. Panier, Checkout, blocs et Store API
Sources : https://developer.woocommerce.com/docs/block-development/ ; https://github.com/woocommerce/woocommerce/tree/trunk/plugins/woocommerce/src/StoreApi ; https://developer.woocommerce.com/docs/apis/store-api/
- Blocs Cart et Checkout (par défaut pour les nouvelles boutiques) : panier avec lignes modifiables, coupon, estimation de livraison, totaux, passage ; checkout en une page (contact, adresses, livraison, paiement, note, conditions, inscription). Zones d'extension (« slots/fills », Inner Blocks, intégration IntegrationInterface) pour ajouter des champs.
- Store API : API publique sans clé, `/wp-json/wc/store/v1/`. Endpoints : `products`, `products/attributes`, `products/categories`, `products/tags`, `products/collection-data`, `products/reviews`, `cart` (GET), `cart/items` (CRUD), `cart/add-item`, `cart/update-item`, `cart/remove-item`, `cart/apply-coupon`, `cart/remove-coupon`, `cart/select-shipping-rate`, `cart/update-customer`, `cart/extensions`, `checkout` (GET/POST/PUT draft), `order/{id}`, `batch`. Sécurité : jeton `Cart-Token` (JWT) ou cookie de session + en-tête `Nonce`. Réponse du panier : items, coupons, shipping_rates, totals (prix en plus petite unité monétaire avec `currency_minor_unit`), needs_payment, needs_shipping, errors, extensions.
=> Kolakisa : exposer une API panier publique équivalente (sessions invité par jeton) : base des widgets panier, mini-panier et checkout.

## 21. Blocs produits (pour les widgets)
Source : https://woocommerce.com/document/woocommerce-blocks/
Blocs : Products (collection), Product Collection (filtres, requêtes, mises en page), All Products, Best Sellers, Featured, On Sale, Top Rated, Newest, Hand-picked, By Category, By Tag, By Attribute, Filtres (prix, attribut, stock, note, actif), Product Search, Mini-Cart, Customer Account, Reviews by Product, Single Product, Product Details... Modèle de blocs : Product Image Gallery, Add to Cart with Options, Product Price, Rating, Summary, Meta, SKU, Stock Indicator, Related Products, Breadcrumbs, Product Gallery.
