# Matrice des écarts — boutique Kolakisa face à WooCommerce

Référence WooCommerce : version 9.x (connaissance du 12/11/2026), cœur + extensions officielles courantes + tiers usuels.
Colonne « Référence » : **natif** = dans WooCommerce cœur ; **officielle** = extension éditée par Automattic/WooCommerce (souvent payante) ; **tiers** = extension communautaire/commerciale.
Colonne « État actuel » : voir légende de `AUDIT_EXISTANT.md` (opérationnel testé / partiel / défectueux / absent).
Colonne « Action » : garder (rien à faire) / compléter (étendre l'existant) / reconstruire (le refaire proprement) / créer (n'existe pas).
Priorité : P0 = bloquant pour vendre en sécurité ; P1 = attendu par un vendeur ; P2 = confort ; P3 = optionnel.
Le moteur est SQLite synchrone, multi-site, en centimes entiers : toute action reste additive (voir DONNEES_ET_MIGRATION.md).

Tests existants (23 fichiers, ~270 cas) : `boutique-{abonnements,age,briques,comparateur,creneaux,liste-cadeaux,membre,rdv}`, `programme20-5-boutique-{moteur,serveur,builder,navigateur}`, `programme21-10-ecommerce-builder{,-http,-navigateur}`, `programme21-securite-regen-boutique`, `commerce-par-site`, `themes-boutique`, `paiement-stripe`, `cms-commerce{,-web}`, `site-web-commerce`, `editeur-boutique`, `fiche-produit-bout-en-bout`, `theme-builder-fiche-produit-100`, `theme-builder-archives-produits-bibliotheque`.

## A. Produits et types

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Produit simple | Opérationnel testé | Natif | Aucun sur le fond ; pas de description riche (texte brut) | Garder (+ compléter l'éditeur) | P1 |
| Produit variable | Opérationnel testé | Natif | Variantes créées une par une, pas de génération de combinaisons | Compléter | P1 |
| Produit groupé | Absent (type réservé) | Natif | Totalité | Créer | P2 |
| Produit externe / affilié | Absent | Natif | Totalité | Créer | P3 |
| Produit virtuel (sans livraison) | Opérationnel (`digital` : requires_shipping=0) | Natif | Pas de distinction virtuel/téléchargeable | Garder | P2 |
| Produit téléchargeable (fichier, limite, expiration) | Absent | Natif | Aucun fichier, aucun lien sécurisé | Créer | P0 (si vente numérique) |
| Clés de licence | Absent | Officielle (Software Add-on) / tiers | Totalité | Créer | P3 |
| Produit composite / bundle / kit | Absent | Officielle (Composite, Bundles) | Totalité | Créer | P3 |
| Réservation / rendez-vous | Opérationnel testé (module rendez-vous propre) | Officielle (Bookings) | Pas d'acompte ni de paiement du créneau | Compléter | P2 |
| Abonnement produit | Opérationnel testé en faux Stripe, jamais en réel | Officielle (Subscriptions) | Pas d'essai gratuit, frais d'inscription, rattrapage, abonnement à produits multiples | Compléter (valider en réel) | P1 |
| Adhésion / accès membre | Opérationnel testé | Officielle (Memberships) | Pas de plans à durée/expiration, pas de contenu restreint hors boutique | Compléter | P3 |
| Description riche, extrait, onglets | Partiel (texte brut) | Natif | Pas d'éditeur riche ni d'onglets personnalisés | Compléter | P1 |
| Galerie / image par variante | Partiel (URL saisies à la main) | Natif | Pas de sélecteur de médiathèque ni de glisser-déposer | Compléter | P1 |
| Vidéo produit | Absent | Natif (WP embed) / tiers | Totalité | Créer | P3 |
| Statuts brouillon/publié/archivé | Opérationnel testé | Natif (brouillon, en attente, privé, publié) | Pas « privé » ni programmation de publication | Compléter | P2 |
| Visibilité catalogue (cachée, recherche seule) | Absent | Natif | Totalité (sauf règles d'accès membre) | Créer | P2 |
| Produit mis en avant | Opérationnel | Natif | Aucun | Garder | — |
| Duplication de produit | Absent | Natif | Totalité | Créer | P1 |
| Corbeille et restauration de produit | Absent (suppression douce sans écran de restauration) | Natif | Pas d'écran corbeille | Compléter | P2 |
| Modification rapide / en masse | Absent | Natif | Totalité | Créer | P1 |
| Ventes additionnelles / croisées choisies | Absent (liés = même catégorie) | Natif | Totalité | Créer | P2 |
| Notes d'achat (message après achat) | Absent | Natif | Totalité | Créer | P3 |
| Personnalisation (gravure, texte) | Opérationnel testé | Officielle (Product Add-Ons) | Seulement un champ texte | Compléter | P2 |
| Options produit avancées (cases, listes à prix) | Absent | Officielle (Product Add-Ons) | Totalité hors texte | Créer | P3 |
| Contrôle d'âge | Opérationnel testé (déclaratif) | Tiers | Pas de vérification d'identité (assumé) | Garder | P3 |
| Comparateur de produits | Opérationnel testé | Tiers (YITH Compare) | Aucun | Garder | — |
| Liste de souhaits | Opérationnel | Tiers (YITH, TI Wishlist) | Pas de partage ni notification | Garder | P3 |

## B. Variations, attributs, taxonomies

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Attributs personnalisés par produit | Opérationnel (texte libre) | Natif | OK | Garder | — |
| Attributs globaux (taxonomies partagées) | Absent | Natif | Totalité | Créer | P1 |
| Génération automatique des variations | Absent | Natif | Totalité | Créer | P1 |
| Prix/promo/stock/poids/dimensions par variation | Partiel (pas de dimensions ni description par variante) | Natif | Dimensions, description | Compléter | P2 |
| Échantillons couleur / image (swatches) en fiche | Opérationnel (widget `shopbuy` : pastilles) | Tiers (Variation Swatches) | Pas de couleurs liées à des termes globaux | Compléter | P3 |
| Filtres par attribut dans le catalogue | Absent | Natif (widgets de filtre) | Totalité | Créer | P1 |
| Catégories hiérarchiques | Opérationnel testé | Natif | Pas de modification depuis l'admin (route sans id), pas de vignette de catégorie dans l'admin | Compléter | P1 |
| Étiquettes (tags) | Partiel (JSON dans le produit) | Natif | Pas de table, pas d'admin, recherche `LIKE` | Reconstruire | P2 |
| Marques | Absent | Natif depuis 9.6 (taxonomie Brands) / officielle | Totalité | Créer | P2 |
| Classes d'expédition | Absent | Natif | Totalité | Créer | P1 |
| Classes de taxe | Absent | Natif | Totalité (cf. section G) | Créer | P0 |
| Ordre manuel des produits | Partiel (`position`, non éditable en glisser-déposer) | Natif | Interface | Compléter | P3 |

## C. Stocks

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Gestion de stock par produit/variante | Opérationnel testé | Natif | Aucun | Garder | — |
| Réservation atomique à la commande (jamais sous zéro) | Opérationnel testé | Natif (réserve de stock de caisse depuis 8.x) | Meilleur que beaucoup de configs Woo | Garder | — |
| Remise en stock à l'annulation/échec | Opérationnel testé | Natif | Aucun | Garder | — |
| Remise en stock au remboursement | Défectueux (jamais remis) | Natif (case par ligne au remboursement) | Bug de comptage | Reconstruire (dans le futur flux de remboursement) | P0 |
| Journal des mouvements | Partiel (écrit, jamais affiché) | Tiers / natif limité (notes de commande) | Aucune interface | Compléter | P1 |
| Seuil stock bas | Partiel (badge admin) | Natif (e-mail stock bas / rupture) | Pas d'e-mail ni de tableau | Compléter | P1 |
| Précommande (backorder) autorisée / notifiée | Absent | Natif | Totalité | Créer | P2 |
| Statut de stock manuel (en stock / rupture / sur commande) sans quantité | Absent | Natif | Totalité | Créer | P1 |
| Quantité min / max / pas par produit, vente à l'unité | Absent (MAX_QTY global) | Natif (vente individuelle) / tiers | Totalité | Créer | P2 |
| Notification « prévenez-moi » à la remise en stock | Absent | Tiers | Totalité | Créer | P3 |
| Inventaire multi-entrepôts / emplacements | Absent | Tiers | Totalité | Créer | P3 |
| Import/export de stock en masse | Absent | Natif (CSV) | Totalité | Créer | P1 |

## D. Commandes

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Création depuis panier, recalcul serveur, idempotence | Opérationnel testé | Natif | Aucun | Garder | — |
| Machine à états (7 statuts) | Opérationnel testé | Natif (8 statuts + personnalisés) | Pas de « en attente de stock », « échouée », statuts personnalisés | Compléter | P2 |
| Notes de commande privées / au client | Absent | Natif | Totalité | Créer | P1 |
| Historique des événements | Opérationnel testé | Natif (notes système) | Aucun | Garder | — |
| Modification de commande (lignes, frais, adresses) | Absent | Natif | Totalité | Créer | P1 |
| Création de commande par l'admin | Absent | Natif | Totalité | Créer | P1 |
| Recherche et filtres (date, client, paiement, produit) | Partiel (statut, numéro, e-mail) | Natif | Filtres date/paiement/client/produit | Compléter | P1 |
| Actions groupées (changer de statut, imprimer, supprimer) | Absent | Natif | Totalité | Créer | P1 |
| Expédition partielle / plusieurs colis | Absent | Officielle (Shipment Tracking, Shipping) | Totalité | Créer | P2 |
| Numéro de suivi + transporteur + lien | Partiel (texte unique) | Officielle (Shipment Tracking) | Transporteur, lien, plusieurs numéros | Compléter | P1 |
| Impression bordereau/étiquette | Absent | Officielle (Shipping Labels) / tiers | Totalité | Créer | P2 |
| Bon de livraison / liste de préparation | Absent | Tiers (PDF Invoices & Packing Slips) | Totalité | Créer | P2 |
| Expiration automatique des commandes en attente | Partiel (déclenchée par la page de caisse) | Natif (tâche planifiée « hold stock ») | Pas de tâche de fond | Reconstruire | P1 |
| Commande de réassort d'abonnement | Opérationnel testé (faux Stripe) | Officielle (Subscriptions) | Valider en réel | Garder | P1 |
| Pièces jointes / champs personnalisés de commande | Absent (seulement personnalisation par ligne) | Natif (méta) | Totalité | Créer | P3 |
| Consultation de commande par jeton (invité) | Opérationnel testé | Natif (clé de commande) | Jeton dans l'URL non expirant | Compléter | P1 |
| Suivi de commande public (formulaire n° + e-mail) | Absent | Natif (shortcode order tracking) | Totalité | Créer | P2 |

## E. Remboursements et retours

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Remboursement total annoncé par Stripe | Opérationnel testé | Natif | Aucun | Garder | — |
| Remboursement depuis l'admin vers la passerelle | Absent (simple statut) | Natif (remboursement automatique via passerelle) | Pas d'appel Stripe | Créer | P0 |
| Remboursement partiel (montant, par ligne) | Absent (événement texte) | Natif | Pas de table, pas de montant | Créer (table `mk_shop_refunds`) | P0 |
| Remboursement manuel (hors ligne) | Partiel (statut « remboursée ») | Natif | Pas de montant partiel | Compléter | P0 |
| Remise en stock au remboursement | Défectueux | Natif | Voir §C | Reconstruire | P0 |
| Avoir / note de crédit | Absent | Tiers (PDF Invoices) | Totalité | Créer | P2 |
| Retours / RMA / garantie | Absent | Officielle (Returns and Warranty) | Totalité | Créer | P3 |
| Litige / contestation (chargeback) | Absent (aucun événement `charge.dispute.*` traité) | Natif via passerelle (notes) | Totalité | Créer | P1 |

## F. Clients

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Comptes clients isolés par site | Opérationnel testé | Natif (utilisateurs WP) | Aucun | Garder | — |
| Vérification de l'e-mail avant activation d'un compte existant | Défectueux (pré-inscription possible) | Natif (WP : lien d'activation optionnel, `woocommerce_registration_generate_password`) | Faille | Reconstruire | P0 |
| Connexion, réinitialisation, limitation de débit | Opérationnel testé | Natif | Aucun | Garder | — |
| Tableau de bord « Mon compte » (commandes, adresses, détails) | Partiel (commandes, nom, téléphone) | Natif | Adresses, détails du compte, mot de passe, téléchargements | Compléter | P1 |
| Carnet d'adresses utilisé à la caisse | Absent (fonction `updateProfile` ignorée par la route) | Natif | Branchement | Compléter | P1 |
| Fiche client admin (commandes, adresses, notes, total) | Absent | Natif (Clients, WooCommerce Analytics) | Totalité | Créer | P1 |
| Segments / groupes / étiquettes de clients | Absent | Tiers | Totalité | Créer | P2 |
| Lien client ↔ Contact Core, audiences, automatisations | Absent | Tiers (AutomateWoo, Mailchimp for Woo) | Totalité | Créer (pont) | P1 |
| Consentement marketing à la caisse | Partiel (colonne jamais alimentée) | Natif (case newsletter via extensions) | Branchement | Compléter | P1 |
| Export / effacement RGPD des données de boutique | Absent | Natif (outils de confidentialité WP) | Totalité | Créer | P0 |
| Invité / commande sans compte | Opérationnel testé | Natif | Aucun | Garder | — |
| Connexion sociale, mot de passe sans mot de passe | Absent | Tiers | Totalité | Créer | P3 |
| Avis vérifiés avec modération | Opérationnel testé | Natif | Pas de réponse du vendeur, pas de photos, pas de « utile » | Garder | P3 |
| Programme de fidélité / points | Absent | Officielle (Points & Rewards) / tiers | Totalité | Créer | P3 |
| Liste cadeaux / naissance | Opérationnel testé | Tiers (YITH Gift List) | Aucun | Garder | — |

## G. Taxes

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Règles par pays/région, prix TTC ou HT | Opérationnel testé | Natif | Pas de code postal/ville | Compléter | P1 |
| Plusieurs taux sur une même commande (taxes composées, par produit) | Absent (une seule règle par commande) | Natif | Limite structurelle | Reconstruire | P0 |
| Classes de taxe (standard, réduit, zéro) | Absent | Natif | Totalité | Créer | P0 |
| Exonération client / numéro de TVA / autoliquidation | Absent | Natif (exonération) / officielle (EU VAT) | Totalité | Créer | P1 |
| TVA UE (guichet OSS), seuil de distance | Absent | Officielle (EU VAT Number) / tiers | Totalité | Créer | P2 |
| Calcul automatique (Stripe Tax, TaxJar) | Absent | Officielle (Automated Taxes) | Totalité | Créer | P3 |
| Modifier une règle existante | Absent (créer/supprimer) | Natif | Interface | Compléter | P2 |
| Lignes de taxe sur la commande et sur les e-mails | Partiel (stockées, pas affichées en e-mail) | Natif | Affichage | Compléter | P1 |

## H. Livraison

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Zones par pays | Opérationnel testé | Natif | Pas de région/code postal/joker | Compléter | P1 |
| Forfait, gratuite dès X, selon poids | Opérationnel testé | Natif (forfait, gratuite, retrait) | OK | Garder | — |
| Tarif par article / pourcentage / classes d'expédition | Absent | Natif | Totalité | Créer | P1 |
| Retrait en magasin (méthode + créneau + lieu) | Partiel (forfait à 0 €) | Natif (Local pickup, blocs) | Méthode dédiée, adresse du point | Créer | P1 |
| Créneaux de livraison avec capacité | Opérationnel testé | Tiers | Aucun | Garder | — |
| Livraison selon les dimensions / volume | Absent (dimensions stockées, non utilisées) | Tiers | Totalité | Créer | P3 |
| Tarifs temps réel transporteurs (Colissimo, DHL, UPS) | Absent | Officielle (UPS, USPS, FedEx, DHL) / tiers | Totalité | Créer | P2 |
| Étiquettes d'expédition | Absent | Officielle (Shipping) | Totalité | Créer | P2 |
| Modifier zones/méthodes | Absent (créer/supprimer) | Natif | Interface | Compléter | P1 |
| Plusieurs adresses de livraison / livraison à plusieurs destinataires | Absent | Officielle (Multiple Shipping) | Totalité | Créer | P3 |
| Pays autorisés à la vente / à l'expédition séparément | Absent | Natif | Totalité | Créer | P2 |

## I. Paiements

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Stripe Checkout hébergé | Opérationnel testé (faux Stripe) | Officielle (WooCommerce Stripe) | Clés globales, un seul article | Compléter | P0 |
| Clés Stripe par site / Stripe Connect | Absent | Officielle (Stripe) / tiers (Connect) | Totalité ; indispensable en multi-site | Créer | P0 |
| Paiement manuel (virement, chèque, à la livraison) | Opérationnel testé | Natif (BACS, chèque, COD) | Pas de frais de COD, pas de coordonnées bancaires structurées | Compléter | P2 |
| PayPal | Absent (liens hébergés dans le Page Builder seulement) | Officielle (PayPal Payments) | Totalité | Créer | P1 |
| Apple Pay / Google Pay / Link | Absent (Stripe Checkout peut les afficher selon la configuration du compte, non vérifié) | Officielle | Non vérifié | Compléter | P2 |
| Mollie, Adyen, Square, Klarna, Alma, SumUp | Absent | Officielles / tiers | Totalité | Créer | P3 |
| Mobile Money (Wave, Orange Money, MTN, M-Pesa), CinetPay, FedaPay, PayDunya, Flutterwave | Absent | Tiers | Totalité ; pertinent pour la cible Kolakisa | Créer | P1 |
| Autorisation puis capture | Absent | Natif (selon passerelle) | Totalité | Créer | P3 |
| Cartes enregistrées / paiement en un clic | Absent | Officielle (Stripe) | Totalité | Créer | P3 |
| Acompte / paiement échelonné | Absent | Officielle (Deposits) / tiers | Totalité | Créer | P2 |
| Webhooks signés, idempotents, rejeu | Opérationnel testé | Natif (selon passerelle) | Aucun | Garder | — |
| Fermeture des sessions Stripe d'une commande lors d'un nouvel essai | Défectueux (double encaissement possible) | Natif | Bug | Reconstruire | P0 |
| Événements de litige (`charge.dispute.*`) | Absent | Officielle (Stripe) | Totalité | Créer | P1 |
| Plusieurs devises, conversion | Absent | Officielle (Multi-Currency) | Totalité | Créer | P2 |

## J. Coupons et promotions

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Coupon % / fixe, dates, limites, minimum, restrictions produit/catégorie | Opérationnel testé | Natif | OK | Garder | — |
| Coupon fixe par produit (remise par ligne), maximum de dépense, produits exclus, e-mails autorisés | Absent | Natif | Totalité | Créer | P2 |
| Livraison gratuite par coupon | Absent | Natif | Totalité | Créer | P1 |
| Cumul de coupons / usage individuel | Absent (un coupon par panier) | Natif | Totalité | Créer | P2 |
| Modifier / supprimer un coupon | Absent | Natif | Interface | Compléter | P1 |
| Limite par client réellement fiable | Partiel (comptée par e-mail, contournable avec alias +) | Natif (e-mails de facturation) | Faiblesse connue | Compléter | P2 |
| Promotions automatiques (achetez X, obtenez Y, remises par quantité/panier) | Absent | Officielle (Dynamic Pricing) / tiers | Totalité | Créer | P2 |
| Prix promo programmé par produit | Opérationnel testé | Natif | OK | Garder | — |
| Ventes flash globales / privées | Opérationnel testé (privées) | Tiers | Ventes publiques globales absentes | Compléter | P3 |
| Cartes cadeaux / crédits en boutique | Absent | Officielle (Gift Cards) | Totalité | Créer | P2 |
| Prix par rôle / grossiste / B2B | Absent | Tiers / officielle (B2B) | Totalité | Créer | P3 |

## K. Marketing

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Paniers abandonnés (détection + relance e-mail) | Absent (statut prévu, jamais posé) | Tiers (AutomateWoo, CartFlows, Mailchimp for Woo) | Totalité | Créer | P1 |
| Événements commerce vers automatisations / Contact Core | Absent | Tiers (AutomateWoo) | Totalité | Créer | P0 |
| Webhooks sortants boutique | Absent | Natif | Totalité | Créer | P1 |
| Attribution du CA aux campagnes | Absent (formations seulement) | Tiers | Totalité | Créer | P2 |
| Sitemap produits / catégories | Absent | Natif (via WP/Yoast) | Totalité | Créer | P0 |
| JSON-LD produit, avis, fil d'Ariane | Opérationnel testé | Natif / Yoast WooCommerce SEO | Pas de GTIN/MPN/marque réelle | Compléter | P2 |
| Flux produits Google Merchant / Meta / TikTok | Absent | Officielle (Google Listings & Ads, Facebook) | Totalité | Créer | P1 |
| Pixel et événements e-commerce (GA4, Meta) | Absent | Officielle (Google Analytics, Facebook) | Totalité | Créer | P1 |
| Recommandations / produits similaires | Partiel (même catégorie) | Natif + tiers | Algorithme | Compléter | P3 |
| Avis demandés après achat par e-mail | Absent (formulaire d'avis existe, pas de demande) | Tiers (Customer Reviews) | Totalité | Créer | P2 |
| Parrainage / affiliation | Absent | Officielle (AffiliateWP tiers) | Totalité | Créer | P3 |
| Bannières promotionnelles, barre d'annonce, compte à rebours | Hors boutique (Page Builder) | Tiers | — | Garder | — |
| Constructeur de boutique par IA | Opérationnel testé | Aucun équivalent natif | Avantage Kolakisa | Garder | — |

## L. Rapports et analytics

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Tableau de bord ventes (CA, commandes, panier moyen) | Absent | Natif (Analytics, Rapports) | Totalité | Créer | P0 |
| Rapport produits / catégories / coupons / taxes / stock | Absent | Natif | Totalité | Créer | P1 |
| Rapport clients (nouveaux / récurrents, valeur vie) | Absent | Natif | Totalité | Créer | P2 |
| Export CSV des rapports et des commandes | Absent | Natif | Totalité | Créer | P1 |
| Comparaison de périodes | Absent | Natif | Totalité | Créer | P2 |
| Funnel (vue produit → panier → caisse → achat) | Absent | Tiers / GA4 | Totalité | Créer | P2 |
| Indicateurs à l'accueil de l'admin (commandes à traiter) | Absent | Natif (widget d'état) | Totalité | Créer | P1 |

## M. Paramètres

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Ouverture, devise, TTC/HT, pays par défaut, achat invité | Opérationnel testé | Natif | OK | Garder | — |
| Adresse de la boutique, pays de vente, pays d'expédition | Partiel (pays par défaut seulement) | Natif | Pays autorisés | Compléter | P1 |
| Pages légales (CGV, retours, confidentialité) liées à la caisse + case à cocher | Absent | Natif (page des conditions) | Totalité | Créer | P0 |
| Format des prix (décimales, séparateurs, position du symbole) | Partiel (`Intl` fr-FR fixe) | Natif | Réglages | Compléter | P2 |
| Format du numéro de commande | Partiel (préfixe + compteur) | Natif (ID) / tiers | Séparateur, annuel | Compléter | P3 |
| Délai d'expiration des commandes en attente réglable | Absent (60 min fixe) | Natif | Totalité | Créer | P2 |
| Mode maintenance de boutique / fermeture temporaire avec message | Partiel (ouverte/fermée, 404 neutre) | Natif (mode « Coming soon ») | Message dédié | Compléter | P2 |
| Réglages de caisse (champs requis, téléphone, entreprise, notes) | Absent | Natif | Totalité | Créer | P1 |
| Comptes (invité, création à la caisse, délai de conservation) | Partiel (invité seulement) | Natif | Totalité | Compléter | P2 |
| Réglages par thème de boutique | Opérationnel (migration 129/130) | — | — | Garder | — |

## N. E-mails, factures, téléchargements

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| E-mails transactionnels de commande (7 événements) | Opérationnel, texte brut | Natif (modèles HTML) | Pas de HTML, pas de personnalisation | Compléter | P1 |
| Modèles personnalisables (logo, couleurs, texte) | Absent | Natif | Totalité | Créer | P1 |
| E-mails admin : nouvelle commande | Opérationnel | Natif | Autres événements (annulation, échec) absents | Compléter | P2 |
| Alerte stock bas / rupture | Absent | Natif | Totalité | Créer | P1 |
| Journal des e-mails de boutique | Partiel (table écrite, pas d'écran) | Tiers (WP Mail Logging) | Écran | Compléter | P2 |
| Facture / reçu numéroté PDF | Absent | Tiers (PDF Invoices) / officielle | Totalité ; obligation légale selon le pays | Créer | P0 |
| Numérotation légale séquentielle des factures | Absent | Tiers | Totalité | Créer | P0 |
| Mentions légales (TVA, SIRET, RCS) sur documents | Absent | Tiers | Totalité | Créer | P0 |
| Téléchargements sécurisés (limites, expiration) | Absent | Natif | Totalité | Créer | P0 (numérique) |
| SMS de commande | Absent (module SMS marketing existe ailleurs) | Tiers | Branchement | Créer | P3 |

## O. Import / export

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Import CSV de produits (mise à jour par SKU, variations) | Partiel (via constructeur IA, brouillons) | Natif | Pas d'import direct ni de mise à jour | Créer | P1 |
| Export CSV produits / commandes / clients | Absent | Natif | Totalité | Créer | P0 |
| Import depuis WooCommerce / Shopify / WordPress | Absent | Tiers | Totalité | Créer | P2 |
| Import / export de coupons, de zones de livraison, de taxes | Absent | Natif (taxes CSV) | Totalité | Créer | P3 |
| Sauvegarde / transfert de boutique entre sites | Absent | Tiers | Totalité | Créer | P3 |

## P. API, webhooks, hooks, extensions

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| API REST produits / commandes / clients (clés, portées) | Absent | Natif (REST v3, Store API) | Totalité | Créer | P1 |
| Webhooks sortants (commande créée, payée, remboursée…) | Absent | Natif | Totalité | Créer | P1 |
| Hooks / filtres / extensions tierces | Absent | Natif (actions/filtres) | Pas de système d'extension | Créer (événements internes d'abord) | P2 |
| Webhook entrant Stripe | Opérationnel testé | Natif | OK | Garder | — |
| Passerelles enfichables (interface `PROVIDERS`) | Partiel (objet figé à 2 entrées, `payments.js:10`) | Natif (classe passerelle) | Ouvrir à un registre | Compléter | P1 |
| Intégration CRM / compta (Sage, QuickBooks, Odoo) | Absent | Officielle / tiers | Totalité | Créer | P3 |

## Q. Permissions et sécurité

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Permissions `shop.read/write/orders/payments` | Opérationnel testé | Natif (capacités `manage_woocommerce`, `edit_shop_orders`) | Pas de séparation lecture catalogue / lecture commandes | Compléter | P2 |
| Rôles « gérant de boutique » / « préparateur » | Absent | Natif (Shop manager, Customer) | Totalité | Créer | P2 |
| Journal d'audit des actions admin boutique | Opérationnel (recordAudit) | Tiers | Pas sur toutes les routes (catégories, coupons : partiel) | Compléter | P2 |
| Isolation multi-site | Opérationnel testé | Multisite WP (isolation partielle) | Avantage Kolakisa | Garder | — |
| Limitation de débit panier / caisse / avis | Absent (connexion seulement) | Tiers (WAF) | Totalité | Créer | P1 |
| Jeton de commande hors URL / expiration | Défectueux (dans l'URL) | Natif (clé de commande dans l'URL aussi) | À améliorer | Compléter | P1 |
| Secret de repli `kolakisa-dev` | Défectueux | — | Faille de configuration | Reconstruire | P0 |
| Protection anti-spam / anti-bot (captcha) sur inscription, avis | Absent | Tiers | Totalité | Créer | P2 |
| Conformité PCI | Opérationnel (aucune carte chez nous : Stripe hébergé) | Dépend de la passerelle | OK | Garder | — |

## R. Performances et indexation

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Index des clés étrangères | Opérationnel (migration 127) | Natif (tables HPOS) | OK | Garder | — |
| Recherche plein texte | Partiel (`LIKE '%…%'`) | Natif (WP search) / tiers (FiboSearch, ElasticPress) | Pas de FTS5, pas de tolérance fautes | Reconstruire | P1 |
| Recherche par étiquette | Partiel (`LIKE` sur JSON) | Natif (taxonomie indexée) | Lent à grande échelle | Reconstruire | P2 |
| Tri par prix | Partiel (sous-requête corrélée) | Natif (table de recherche de produits) | Coût O(n×variantes) | Compléter (colonne dénormalisée) | P2 |
| Index `mk_shop_orders(email)` et `(payment_status)` | Absent | Natif | Recherche admin lente | Créer | P2 |
| Mise en cache des listes publiques | Partiel (`Cache-Control: no-cache`, pas de cache serveur) | Tiers (cache de page) | Totalité | Créer | P3 |
| `scryptSync` bloquant | Défectueux (perf) | — (bcrypt WP) | Passer à `crypto.scrypt` asynchrone | Compléter | P2 |
| Tâches planifiées (expiration, relances, abonnements) | Absent (pas de planificateur boutique) | Natif (Action Scheduler) | Totalité | Créer | P1 |
| Tests de charge boutique | Absent | — | — | Créer | P3 |

## S. Theme Builder, éditeur, interface

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Modèles de fiche produit (100) | Opérationnel testé | Elementor Pro / blocs Woo | Avantage | Garder | — |
| Modèles d'archives produits (100) | Opérationnel testé | Elementor Pro | Avantage | Garder | — |
| Modèle de panier | Absent (vue EJS fixe) | Elementor Pro (Cart) / blocs | Totalité | Créer | P1 |
| Modèle de caisse | Absent (vue EJS fixe) | Elementor Pro (Checkout) / blocs | Totalité | Créer | P1 |
| Modèle « Mon compte » | Absent (vue `account` déclarée mais sans type) | Elementor Pro (My Account) | Totalité | Créer | P1 |
| Modèle de confirmation / merci | Absent | Elementor Pro (Purchase Summary) | Totalité | Créer | P2 |
| Modèle d'e-mail de commande | Absent | Tiers (Email Customizer) | Totalité | Créer | P1 |
| Widget titre produit / prix / description / note / méta / fil d'Ariane / onglets | Absent (étiquettes `{{product.*}}` seulement) | Elementor Pro (Product widgets) | Totalité | Créer | P1 |
| Widget catégories de produits, mini-panier, ajout aux souhaits, comparaison, produits liés, upsells | Absent | Elementor Pro | Totalité | Créer | P1 |
| Widget panier de la boutique | Absent (`cart` = panier des formations) | Elementor Pro (Cart) | Confusion de nom | Reconstruire (renommer + nouveau) | P1 |
| Widgets grille, achat, panier/compte, recherche, filtres, galerie, avis, caractéristiques | Opérationnel testé | Elementor Pro | OK | Garder | — |
| Filtre par attribut, marque, note | Absent | Natif (blocs de filtre) | Totalité | Créer | P1 |
| Aperçu avec données d'exemple | Opérationnel (page.demoShop) | Natif | OK | Garder | — |

## T. Administration (écrans)

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Menu Boutique (4 entrées) + onglets cachés | Partiel (Avis, Rendez-vous, Abonnements, Accès, Listes dans des onglets seulement) | Menu WooCommerce complet | Navigation | Compléter | P2 |
| Assistant de configuration (onboarding) | Absent côté boutique (le constructeur IA joue ce rôle) | Natif (Setup wizard) | Totalité hors IA | Créer | P2 |
| État du système / vérifications de santé boutique | Absent | Natif (Statut) | Totalité | Créer | P2 |
| Notifications d'action requise (commandes à expédier) | Absent | Natif | Totalité | Créer | P1 |
| Édition d'une zone, méthode, taxe, coupon | Absent | Natif | Interface | Compléter | P1 |
| Édition en ligne des variantes (tableau) | Partiel (formulaire un par un) | Natif | Ergonomie | Compléter | P1 |
| Sélecteur de médiathèque dans la fiche produit | Absent | Natif | Totalité | Créer | P0 |

## U. Multi-site, internationalisation, accessibilité

| Fonctionnalité | État actuel | Référence WooCommerce | Écart | Action | Priorité |
|---|---|---|---|---|---|
| Une boutique par site, module activable | Opérationnel testé | Multisite WP | Avantage | Garder | — |
| Catalogue partagé entre sites / duplication de boutique | Absent | Tiers | Totalité | Créer | P3 |
| Traduction des produits (multilingue) | Absent | Tiers (WPML, Polylang) | Totalité (existe un doc `KOLAKISA_AI_ECOMMERCE_INTERNATIONALIZATION.md` : à vérifier) | Créer | P2 |
| Formats régionaux (adresses, code postal, téléphone) | Partiel (pays + champs fixes) | Natif (locales par pays) | Validation par pays | Compléter | P2 |
| Accessibilité des vues de boutique | Partiel (audits visuels existants, non revérifiés ici) | Natif (blocs accessibles) | À auditer | Compléter | P2 |
| Commerce de formations (cours) | Opérationnel testé (système séparé) | LearnDash / LifterLMS + Woo | Deux moteurs séparés, deux coupons, deux paniers | Compléter (convergence à décider) | P2 |
