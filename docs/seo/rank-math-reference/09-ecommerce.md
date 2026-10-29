# 09 - SEO e-commerce (WooCommerce, EDD, autres) selon Rank Math et Google

Date de consultation : 2026-10-29. Mentions : **[officiel]**, **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO seulement quand la source le dit. Les pages de comparaison (woocommerce-seo-feature-comparison, free-vs-pro) sont rendues **sans cases cochées** : seules les mentions « PRO » écrites en toutes lettres sont retenues.

## 1. Plateformes prises en charge
- **WooCommerce** : module dédié (Paramètres généraux > WooCommerce), schéma « WooCommerce Product », variables, tests d'analyse de contenu. [officiel]
- **Easy Digital Downloads (EDD)** : schéma Product pour les téléchargements (URL, nom, catégorie, description, SKU, taxe, image, prix, devise, vendeur Personne/Organisation issu des réglages Local SEO). Doublons possibles avec le schéma natif d'EDD 3.0 (ticket de support, correctif non confirmé). Pages datées (~1 250 jours). [observation : synthèse de recherche rankmath.com ; kb/edd-product-schema non lue]
- Autres plateformes e-commerce (Shopify, etc.) : Rank Math est un plugin WordPress ; aucune prise en charge documentée dans les pages lues. [officiel : absence]

## 2. Schéma Product WooCommerce [officiel : kb/woocommerce-product-schema, kb/product-schema]
Construit à partir des données Woo ; type disponible uniquement pour les produits Woo. Correspondances :
| Donnée | Source |
|---|---|
| name, SKU, URL | nom, onglet Inventaire, permalien |
| description | description courte |
| category | catégorie (principale si plusieurs) |
| image | image produit, galerie seulement si image principale |
| price | prix promo si promotion active, sinon prix normal ; devise = devise de la boutique (émise si prix défini) |
| priceValidUntil | date de fin de promotion ; sinon dernier jour de l'année suivante |
| availability | InStock / OutOfStock / BackOrder (la page écrit « OutStock ») |
| itemCondition | toujours NewCondition |
| GTIN | type choisi dans les réglages, saisi dans l'onglet Inventaire |
| poids, dimensions, TVA | onglet Expédition ; réglages de taxe Woo |
| brand | choisie parmi une taxonomie dans les réglages Rank Math |
| aggregateRating / review | avis clients approuvés (note, nombre, texte, date, auteur, échelle 1-5) |
Champs éditables du type Product générique : nom, emplacement d'affichage (shortcode), description, SKU, marque, offres (prix numérique, devise ISO 4217, disponibilité InStock/SoldOut/Preorder, validité), avis. [officiel]

### Niveaux
- **PRO** (explicites) : URL produit, URL de marque, **GTIN**, **MPN**, type additionnel, fabricant (depuis données Organisation), Pros/Cons (avis éditoriaux seulement), **produits variables** (productGroupID, variesBy, hasVariant), marque personnalisée, choix de la clé GTIN, balise OG `product:retailer_item_id`, tests d'analyse de contenu dédiés produits, « Noindex Hidden Products » (selon synthèse de recherche, observation). Gratuit : clé GTIN par défaut, marque issue de taxonomies.
- Pros/Cons indisponibles pour WooCommerce et EDD selon synthèse de recherche [observation] (contradiction avec la page Product qui les liste en PRO).

## 3. Identifiants GTIN / ISBN / MPN [officiel : kb/gtin-mpn-woocommerce]
- Réglage « Global Identifier » (GTIN, GTIN-8, -12, -13, -14, ISBN, MPN) ; section étiquetée **PRO**. Saisie par produit dans l'onglet Inventaire (champs GTIN/UPC/EAN/ISBN) ; **chaque variation** doit avoir son numéro ; option d'étiquette affichée en front ; les anciens identifiants stockés par Rank Math migrent vers le champ Woo.
- Google : GTIN (`gtin`, `gtin8/12/13/14`, `isbn`), `mpn`, `brand.name`, `sku` sont **recommandés** (pas requis) pour les fiches marchands. [officiel Google : merchant-listing]

## 4. Variations
- Rank Math PRO : ProductGroup (`productGroupID`, `variesBy`, `hasVariant`) et Offer par variation. [officiel : woocommerce-product-schema ; comparaison Woo]
- Google : chaque variante avec URL propre, `isVariantOf`/`inProductGroupWithID`, `variesBy` parmi color, size, suggestedAge, suggestedGender, material, pattern ; ID unique par variante et par groupe ; balisage dans le HTML initial (le JS rend les crawls Shopping moins fréquents/fiables). [officiel Google : product-variants, product-snippet]

## 5. Politiques retours et expédition [officiel : kb/merchant-return-and-shipping-policy]
- Niveau organisation : template personnalisé inséré dans le schéma Organization (**PRO**, via Schema Templates). Niveau produit : filtres PHP (`rank_math/snippet/rich_snippet_product_entity` pour produits simples, `rank_math/json_ld` pour variables) ; le niveau produit **prime**. Champs : pays applicable, fenêtre de retour (finie, jours), méthode, frais, type de remboursement ; expédition : tarif, devise, pays, délai de traitement et de transit. Exemples de la page incohérents (US/USD vs PK/PKR) : les valeurs doivent être adaptées.
- Google : `hasMerchantReturnPolicy` et `hasShippingService` au niveau Organization pour les conditions standard ; offre-niveau pour surcharger ; documentation du balisage d'expédition marchand publiée le 12 nov. 2025 ; `returnPolicyCountry` requis dans les exemples de retours (14 mars 2025). [officiel Google : organization, updates]

## 6. Exigences Google : Product snippet vs fiche marchand
- **Product snippet** : `name` + (`review` ou `aggregateRating` ou `offers`) ; Offer : `price` requis ; `priceCurrency`, `availability`, `priceValidUntil` recommandés ; prix 0 autorisé pour gratuit.
- **Merchant listing** : `name`, `image`, `offers` (Offer, pas AggregateOffer ; le marchand est le vendeur) ; `price` **> 0** et `priceCurrency` requis ; page où l'on peut acheter ; un seul produit/ses variantes (pas de pages catégorie/liste) ; au plus un `sku`, `availability`, `itemCondition`, `url` ; prix barré via `priceType` StrikethroughPrice sur l'ancien prix uniquement ; `priceValidUntil` passé peut bloquer l'affichage ; une devise par URL ; produits réglementés/interdits exclus. [officiel Google : product-snippet, merchant-listing]
- Avertissements Search Console et correctifs Rank Math : « offers/review/aggregateRating » (pas d'avis, ou schéma Product sur pages catégorie > activer « Remove Snippet Data » pour Product categories) ; marque manquante (Select Brand ; marque personnalisée PRO) ; SKU manquant (champ Woo) ; priceValidUntil manquant (dates de promo ; valeur par défaut Rank Math) ; GTIN/marque absents (PRO). [officiel : kb/either-offers-review-or-aggregaterating-should-be-specified]

## 7. Réglages SEO WooCommerce de Rank Math
Liste (niveau non confirmé hors mention PRO) [officiel : kb/woocommerce-seo-feature-comparison, synthèse de recherche] : retirer base produit / base catégorie / slugs parents ; retirer la balise generator ; retirer le schéma sur les archives boutique ; catégorie de marque ; ajouter marque, prix, devise, disponibilité (balises Open Graph `product:*`) ; images de galerie dans `og:image` et le sitemap ; exclure les produits cachés du sitemap ; **noindex des produits cachés (PRO)** et de la taxonomie dont tous les produits sont cachés ; variables propres aux produits ; description courte dans l'analyse de contenu ; fil d'Ariane ; redirection personnalisée de produit (désactivable : kb/disable-custom-product-redirection, non lue).

## 8. Contenu dupliqué et indexation
Canoniques automatiques, titres/descriptions uniques (produits, variations, taxonomies), noindex des archives, de la pagination et des recherches. Paramètres d'URL et navigation à facettes **non traités**. Détail : `06-technical-seo.md`. [officiel : kb/woocommerce-duplicate-content-issues]

## 9. Avis et notes
Avis Woo intégrés au schéma ; test d'analyse « les clients peuvent-ils laisser un avis ». Google : n'accepter que les notes avec commentaire et nom d'auteur (recommandation janv. 2025) ; règle sur les avis incités non divulgués (24 juil. 2026) ; ne pas utiliser plusieurs manières d'indiquer l'élément évalué (nov. 2025). [officiel Google : updates]

## 10. Dépendance WordPress / pertinence Kolakisa
| Fonction | WP/Woo ? | Pertinence |
|---|---|---|
| Product + Offer + AggregateRating JSON-LD | Non (concept) | Très élevée : une formation vendue = Product (ou Course + Offer) |
| Mapping prix promo, devise, disponibilité, validité | Mapping Woo | Élevée : champs natifs du catalogue |
| GTIN/MPN/brand | Non | Moyenne : formations sans GTIN ; marque = organisme formateur ; ISBN pour livres |
| Variations (ProductGroup) | Woo | Faible/moyenne : sessions, formats |
| Politiques retours/expédition | Non | Moyenne : remboursement ; expédition inutile pour produits numériques (**hypothèse**) |
| Noindex produits cachés, sitemap exclusions | Woo | Élevée : produits non publiés |
| Suppression de bases d'URL | Woo/WP | Faible |
| Open Graph product:* | Non | Moyenne |
| Retrait du schéma Product des pages liste | Non | Élevée : éviter Product sur catalogues |
[colonne pertinence : hypothèse]

## Lacunes
- Cases Free/PRO illisibles sur woocommerce-seo-feature-comparison, free-vs-pro, pricing.
- Non lues : kb/edd-product-schema, kb/content-analysis-tests-for-product-pages, kb/disable-custom-product-redirection, kb/review-schema, kb/earning-star-ratings-in-serps ; Google : fin (27 000 car.) de la page merchant-listing, pages shipping/return dédiées.
- Facettes/paramètres d'URL, produits numériques (digital goods) et feeds Merchant Center : pas de documentation Rank Math trouvée.
- Aucun support documenté de plateformes non-WordPress.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/woocommerce-product-schema/ ; /kb/product-schema/ ; /kb/gtin-mpn-woocommerce/ ; /kb/merchant-return-and-shipping-policy/ ; /kb/woocommerce-seo-feature-comparison/ ; /kb/woocommerce-duplicate-content-issues/ ; /kb/either-offers-review-or-aggregaterating-should-be-specified/ - officiel
- https://rankmath.com/blog/woocommerce-seo/ - officiel (blog)
- Recherches rankmath.com (EDD, réglages Woo) - observation
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet ; /merchant-listing ; /product-variants ; /organization ; https://developers.google.com/search/updates - officiel Google
