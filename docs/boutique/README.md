# Boutique Kolakisa — documentation

Boutique multi-sites intégrée au CMS (module « Commerce » activé site par site). Tout est isolé par organisation et par site.

| Sujet | Document |
|---|---|
| État des lieux et écarts avec WooCommerce | AUDIT_EXISTANT, MATRICE_ECARTS, PROBLEMES_CONSTATES, WOOCOMMERCE_NOYAU, WOOCOMMERCE_EXTENSIONS, ELEMENTOR_WIDGETS_ECOMMERCE, SYNTHESE_FONCTIONNALITES_A_REPRODUIRE |
| Données et migrations | DONNEES_ET_MIGRATION, MIGRATIONS_ET_RETOUR_ARRIERE |
| Paiements | PASSERELLES_PAIEMENT (Stripe, PayPal, Flutterwave/Mobile Money, manuel) |
| Taxes et livraison | TAXES_EXPEDITION |
| Factures et avoirs | FACTURES_AVOIRS |
| Produits numériques | PRODUITS_TELECHARGEABLES |
| Rapports, paniers abandonnés, RGPD | RAPPORTS_PANIERS_RGPD |
| API, événements, webhooks | API_REST, EVENEMENTS_WEBHOOKS |
| Theme Builder et widgets | THEME_BUILDER_COMMERCE |
| Administration (coupons, commandes manuelles…) | GUIDE_ADMINISTRATION |
| Sécurité | SECURITE |
| Tests | TESTS |
| Développeurs | GUIDE_DEVELOPPEUR |
| Limites et reste à faire | LIMITES_ET_RESTE_A_FAIRE |

Principes : montants en centimes entiers, calculs côté serveur uniquement, aucune donnée bancaire stockée, migrations additives, aucun service externe déclaré fonctionnel sans identifiants.
