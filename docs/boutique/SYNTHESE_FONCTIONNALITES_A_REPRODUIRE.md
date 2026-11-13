# Fonctionnalités boutique à reproduire dans Kolakisa (priorisées)

Base : WOOCOMMERCE_NOYAU.md, WOOCOMMERCE_EXTENSIONS.md, ELEMENTOR_WIDGETS_ECOMMERCE.md (même dossier). Principe : chaque site (multi-site) a sa boutique isolée ; les fonctions P1/P2 sont des modules activables par site. « Ext. » = dépendance externe.

## P0 : indispensable (boutique minimale crédible)
| Domaine | Fonction | Ext. |
|---|---|---|
| Catalogue | Produits simple, variable (attributs, variations avec prix/stock/image/UGS), virtuel, téléchargeable, externe | non |
| Catalogue | Catégories hiérarchiques, étiquettes, images multiples, descriptions, SEO (slug, méta), statuts, visibilité | non |
| Catalogue | Import/export CSV de produits | non |
| Prix | Prix normal/promo avec dates, devise du site, affichage TTC/HT | non |
| Stock | Gestion par produit/variation, statuts, rupture, précommande, réservation pendant paiement, journal des mouvements | non |
| Panier | API panier (invité par jeton + client), quantités, min/max/pas, coupon, estimation de livraison | non |
| Checkout | Une page : contact, adresses, livraison, paiement, note, conditions, création de compte optionnelle | non |
| Commandes | Statuts (en attente, en cours, en attente de confirmation, terminée, annulée, remboursée, échouée), notes, remboursements partiels, e-mails, recherche/filtre, création manuelle | non |
| Clients | Compte, historique, adresses, mot de passe, export/effacement (RGPD) | non |
| Coupons | Pourcentage, fixe panier, fixe produit, expiration, minimum, limites d'usage, exclusions, livraison gratuite | non |
| Taxes | Classes, taux par pays/région/CP, TTC/HT, arrondi documenté, taxe sur livraison | non |
| Livraison | Zones, forfait (+ formules), gratuite sous condition, retrait en boutique, classes d'expédition | non |
| Paiement | Interface fournisseur ; virement, paiement à la livraison ; Stripe (webhook, remboursement) | Stripe : clés + webhook |
| E-mails | Confirmation, expédition/terminée, remboursement, nouveau compte, mot de passe, alerte admin ; modèles éditables, journal | SMTP/fournisseur e-mail |
| Documents | Facture PDF numérotée, bon de livraison | non |
| Téléchargements | Droits par commande, limites, expiration, service sécurisé | non |
| Admin | Tableau de bord ventes, rapports simples (CA, commandes, produits), paramètres boutique par onglets | non |
| Front | Widgets : grille produits, carte produit (boucle), catégories, fiche produit complète, mini-panier, panier, paiement, compte, résumé commande, fil d'Ariane, recherche, filtres, tri, notifications ; modèles Theme Builder (produit, archive, panier, paiement, compte, merci) | non |
| Plateforme | API REST v1 interne (produits, commandes, clients, coupons) avec clés ; webhooks sortants signés (order.*, product.*, customer.*) ; bus d'événements | non |
| Sécurité | Isolement par site, protection CSRF/nonce panier, idempotence des paiements | non |

## P1 : important
| Fonction | Ext. |
|---|---|
| PayPal ; mobile money régional (Orange Money, MTN, Wave, CinetPay, Flutterwave, Paystack) | comptes/clés par fournisseur |
| Avis clients (note, achat vérifié, modération, photos) | non |
| Options produit personnalisées (add-ons : texte, choix, fichier, prix additionnel) | non |
| Packs / bundles simples | non |
| Prix par quantité et par rôle, règles de remise (dynamic pricing de base), grossistes B2B | non |
| Table de tarifs de livraison (poids/prix/destination), suivi de colis | non |
| Transporteurs (Colissimo, Mondial Relay, DHL) : tarifs/étiquettes/suivi | compte transporteur + clé API |
| Panier abandonné (capture e-mail + relance + coupon unique) | service e-mail |
| Liste de souhaits ; alerte retour en stock (waitlist) | e-mail |
| Multi-devises avec sélecteur | service de taux (clé API) |
| Suivi marketing : GA4, pixel Meta, flux Merchant Center (dataLayer + XML) | IDs/comptes |
| Analytics complets (produits, catégories, coupons, taxes, stock, clients) + export CSV | non |
| Statuts personnalisés ; champs checkout personnalisables ; règles de paiement/livraison conditionnelles | non |
| Marques (taxonomie) ; produits liés/ventes additionnelles/croisées | non |
| Notifications avancées par e-mail (fournisseur, stock bas) | non |
| Cartes-cadeaux | non (e-mail) |
| Newsletter (Mailchimp, Brevo, Klaviyo) | comptes/clés |
| Carrousel produits, bouton d'ajout collant, vus récemment | non |

## P2 : avancé
| Fonction | Ext. |
|---|---|
| Abonnements et renouvellements récurrents | Stripe/PayPal avec jetons ; tâches planifiées |
| Réservations (calendrier, ressources, acomptes) | Google Agenda optionnel |
| Adhésions et contenus restreints | non |
| Marketplace multi-vendeurs (commissions, versements) | PayPal/Stripe Connect |
| Produits composites | non |
| Points et récompenses | non |
| Moteur de recommandations | non |
| Square, Amazon Pay, terminal de vente (POS) | comptes |
| Taxes automatiques (TVA UE/OSS) | service externe éventuel |
| Comparateur, aperçu rapide, constructeur de packs | non |
| Livraison multi-adresses, retrait multi-lieux | non |
| Données clients enrichies, segments, workflows marketing (type AutomateWoo) | e-mail/SMS |

## Ordre de réalisation conseillé
1. Modèle de données et API panier/checkout/commandes (P0 noyau), tests de calcul (taxes, coupons, livraison, arrondis).
2. Widgets et modèles Theme Builder produit/archive/panier/paiement/compte.
3. Paiements (Stripe puis hors-ligne puis mobile money), e-mails, factures.
4. Modules P1 un par un, derrière un interrupteur par site.

## Points de vigilance
- Les calculs d'argent en entiers (plus petite unité) avec devise ; taxes et arrondis testés cas par cas.
- Webhooks de paiement : signature, idempotence, rejeu.
- RGPD : export/effacement/rétention dès le départ.
- Réutiliser le Theme Builder, le moteur de conditions et les jetons de design existants plutôt que d'en créer d'autres (voir CLAUDE.md du projet).
- Les rapports de l'autre audit (code existant de la boutique) doivent être croisés avec ce document pour savoir ce qui est déjà couvert.
