# Programme 20.5 — E-commerce Builder : ce qui a réellement été développé

Base : `origin/main` (`bd794900`). Branche : `feat/programme-20-5-ecommerce`. Les Programmes 20.2, 20.3 et 20.4 **n'ont pas été fusionnés dans `main`** (seule une branche `feat/programme-20-2-site-builder` existe, non fusionnée ; 20.3 et 20.4 n'existent pas) : 20.5 ne dépend d'aucun d'eux et s'appuie sur le Theme Builder et le Page Builder **tels qu'ils sont sur `main`** (voir limites).

## Livré et prouvé par des tests
| Domaine | Livré | Preuve |
|---|---|---|
| Produits | simple, variable (variantes SKU/prix/stock), numérique ; catégories arborescentes ; promotions datées ; galerie ; SEO ; suppression douce | `programme20-5-boutique-moteur` |
| Stock | réservation transactionnelle, restitution, confirmation tardive, journal des mouvements | idem |
| Catalogue | recherche, catégorie, prix, stock, promo, tri, pagination — **en base** | moteur + serveur |
| Panier | serveur, cookie HttpOnly, version anti-concurrence, validations, indisponibilités | moteur + serveur + navigateur |
| Checkout | adresses, livraison, taxes, coupon, total attendu, **idempotence**, transaction | moteur + serveur |
| Commandes | cycle de vie à transitions contrôlées, historique, audit, annulation, expiration | moteur + serveur |
| Paiement | Stripe Checkout (faux Stripe local), webhook signé + idempotent, retour relu, échec, expiration, remboursement total ; paiement manuel | serveur |
| Clients | comptes propres à la boutique, invités, réinitialisation de mot de passe | moteur + serveur |
| Livraison / taxes / coupons | zones, 3 types de méthodes, règles de taxe par pays/région, coupons (%, fixe, minimum, dates, limites, produits) | moteur |
| Notifications | confirmation, paiement, échec, expédition, annulation, remboursement, alerte administrateur — via la file d'e-mails existante, avec journal | serveur |
| Administration | produits, variantes, stock, catégories, commandes, clients, réglages (paiement, livraison, taxes, coupons) | serveur |
| Boutique publique | `/boutique`, fiche, panier, commande, confirmation, compte | serveur + navigateur |
| Theme Builder | familles « Fiche produit » et « Catalogue / catégorie » dans le moteur existant, modèle limité au **même site** | `programme20-5-boutique-builder` |
| Page Builder | 5 éléments : Grille de produits, Ajouter au panier, Panier/commande/compte, Recherche, Filtres ; étiquettes `{{product.*}}` | builder |
| Isolation | par hôte, par adresse d'administration, par jeton ; module « Commerce » par site | moteur + serveur |
| Responsive | ordinateur 1280, tablette 820, mobile 375 : aucun débordement, contrôles ≥ 34 px, panier en cartes sur mobile | navigateur |

## Fichiers (voir le rapport final pour la liste complète)
Migration `121_boutique.sql` · `src/marketing/shop/*` (9 fichiers) · `src/marketing/web/shopAdmin.js`, `shopPublic.js` · `src/marketing/pages/widgets/shop.js` · vues `views/boutique/*`, `views/marketing/boutique/*`, `views/marketing-public/widgets/shop*.ejs` · `public/css/boutique.css`, extrait ajouté à `landing.css`, `public/js/boutique.js` · modifications ciblées de `organizations.js`, `cmsAccess.js`, `cmsNav.js`, `siteModules.js`, `themeTemplates.js`, `themeRender.js`, `dynamic.js`, `routes/stripeWebhook.js`, `services/payments.js` (+1 export).

## Ce qui n'est PAS livré
Voir `KOLAKISA_PROGRAMME20_5_REMAINING_ISSUES.md` (produits téléchargeables et groupés, remboursement émis depuis Kolakisa, autres passerelles, avis, upsells/cross-sells, import de produits, factures, etc.).
