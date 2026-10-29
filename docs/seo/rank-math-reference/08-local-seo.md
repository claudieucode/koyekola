# 08 - SEO local (module Local SEO de Rank Math)

Date de consultation : 2026-10-29. Mentions : **[officiel]**, **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO seulement quand la source le dit.

## 1. Périmètre
Le module Local SEO configure les métadonnées d'entité (Personne ou Organisation / commerce local) injectées dans le JSON-LD et dans le graphe de connaissances, et fournit des blocs/shortcodes d'affichage. Rank Math rappelle de revendiquer d'abord la fiche Google Business Profile ; les horaires, adresse et téléphone doivent correspondre exactement à cette fiche. [officiel : kb/local-seo ; recherche rankmath.com pour la dernière phrase, observation]

## 2. Réglages généraux (indiqués « gratuit » par la page) [officiel : kb/local-seo]
| Réglage | Détail |
|---|---|
| Person ou Company | entité représentée par le site |
| Website Name / Alternate Name | nom du site pour Google, nom court/acronyme (sort en `alternateName`) |
| Nom de la personne/organisation | nom visé pour le Knowledge Panel |
| Description | texte détaillé |
| Logo | min. 112x112 px, carré préféré ; repli sur le logo du site |
| URL, Email | email surveillé |
| Adresse | pays en code ISO 3166-1 alpha-2 ; masqué si lieux multiples |
| Format d'adresse | mise en forme du shortcode |
| Type d'activité | sous-types LocalBusiness ; LegalService remplace Attorney (déprécié) ; OnlineStore/OnlineBusiness pour le 100 % en ligne ; « Store » conseillé pour e-commerce (kb/organization-schema) ; masqué si lieux multiples |
| Horaires et format 12/24 h | masqué si lieux multiples |
| Téléphone | un champ dans local-seo ; plusieurs numéros étiquetés par usage selon organization-schema (incohérence entre pages) ; masqué avec Person ou lieux multiples |
| Fourchette de prix | masqué si lieux multiples |
| Infos supplémentaires | raison sociale, date de fondation, ISO 6523, DUNS, LEI, NAICS, GLN, n° TVA, n° fiscal, effectif |
| Clé API Google Maps | requise pour la carte intégrée et la navigation |
| GeoCoordinates | latitude, longitude décimales |
| Pages À propos / Contact | balisées pour Google |
La page ne documente pas : « area served » au niveau global, ni réglage dédié Knowledge Graph hors Person/Organisation. [officiel : absence]

## 3. Fonctions PRO explicites [officiel : kb/local-seo, kb/multiple-locations]
- **Use Multiple Locations** : crée le type de contenu **RM Locations** (libellés, base d'URL et catégories personnalisables).
- Options : libellés Fermé/Ouvert 24/7, mesure km/miles, style de carte (hybride, satellite, plan, relief), nombre maximal de lieux dans le schéma, pays principal (précision du store locator), libellé d'itinéraire, détection de position, `parentOrganization` (« tous les lieux font partie de la même organisation »), recherche améliorée incluant les lieux.
- **Sitemap KML** des lieux (PRO).
- Par lieu (onglet Schema > LocalBusiness) : nom (défaut `%seo_title%`), type, image, email, téléphones principal/secondaire, adresse, coordonnées (≥5 décimales), fax, TVA, n° fiscal, n° Chambre de commerce (affiché mais **absent du schéma**), fourchette de prix, devises et moyens de paiement acceptés (types locaux seulement), horaires par groupes de jours + fuseau (24/7 désactive horaires et fuseau), **zone desservie** (jusqu'à 20 zones, villes ou codes postaux, dans ~2 h de route ; pas d'États, pays ni rayon).
- Remarque de recherche (observation, non vérifiée sur la page) : sans lieux multiples, le modèle LocalBusiness n'est dispo que sur les pages de lieux en gratuit ; un template personnalisé ne remplace pas le schéma Local SEO automatique, il faut le désactiver.

## 4. Affichage front [officiel : kb/location-data-shortcode, kb/local-seo]
- Bloc Gutenberg « Local Business by Rank Math » (types : adresse, horaires, carte, store locator) ; shortcodes `[rank_math_local]` et `[rank_math_contact_info]`.
- Attributs principaux : `type` (address, opening-hours, map, store-locator), `locations`, `terms`, `limit`, `search_radius` (défaut 10) ; horaires : `show_opening_hours`, `show_days`, `hide_closed_days`, `show_opening_now_label` (selon fuseau du visiteur) ; carte : style, taille, zoom, interactions, itinéraire, filtre de catégories, clustering, rayon, lieu le plus proche.
- Niveau du shortcode/bloc : non précisé ; la gestion de lieux multiples et le KML sont PRO.

## 5. Règles Google pertinentes
- **Données structurées LocalBusiness** : requis `address` (PostalAddress) et `name`. Recommandés : `geo` (≥5 décimales), `openingHoursSpecification` (`opens`/`closes` hh:mm:ss, `dayOfWeek`, `validFrom`/`validThrough`), `telephone` (indicatifs), `url` fonctionnelle du lieu, `priceRange` (<100 caractères), `department`, `menu`/`servesCuisine`, `aggregateRating`/`review` (seulement si le site collecte des avis sur d'autres commerces locaux). Sous-type le plus spécifique ; `additionalType` non supporté ; départements nommés « {magasin} {département} » ; horaires après minuit : fermeture < ouverture ; 24 h : 00:00-23:59 ; fermé : 00:00/00:00. [officiel Google : local-business]
- **Classement local (Google Business Profile)** : pertinence, distance, notoriété (liens, avis, notes) ; profil complet et vérifié, horaires à jour, avis ; impossible d'acheter un meilleur classement. [officiel Google : support.google.com/business/answer/7091]
- Organisation : logo ≥112x112, sous-type précis, `sameAs`, politiques retours/expédition (voir `07-schema.md`).

## 6. Dépendance WordPress / pertinence Kolakisa
| Fonction | WP ? | Pertinence |
|---|---|---|
| Entité Organisation/Person + JSON-LD | Non | Très élevée : une organisation par site (multi-sites) |
| Type de commerce, adresse, horaires, geo, sameAs | Non | Élevée si présence physique ; sinon OnlineStore/Organization |
| CPT RM Locations, sitemap KML | Oui (CPT) | Faible, sauf centres de formation physiques : table `locations` par site |
| Blocs/shortcodes carte, store locator | Oui (blocs, shortcodes) | Faible/moyenne : requiert clé Google Maps (service externe) |
| Pages À propos/Contact balisées | Non | Moyenne |
[colonne pertinence : hypothèse]

## Lacunes
- Page `kb/local-seo` : seulement sa description ; pas de captures. Niveau gratuit déduit de l'étiquette « PRO » absente (la page marque seulement PRO).
- Non lues : kb/add-localbusiness-schema-in-elementor/divi, blog/local-seo, tickets de support, kb/google-my-business ; Google Business Profile hors périmètre.
- Aucune documentation lue sur Local Pack ou avis Google dans Rank Math. Pas de comparaison des 193 sous-types.
- Contradictions entre pages : nombre de numéros de téléphone ; recommandation « Store » vs OnlineStore.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/local-seo/ - officiel
- https://rankmath.com/kb/multiple-locations/ - officiel
- https://rankmath.com/kb/organization-schema/ - officiel
- https://rankmath.com/kb/location-data-shortcode/ - officiel
- Recherche rankmath.com (résumé de résultats) - observation
- https://developers.google.com/search/docs/appearance/structured-data/local-business - officiel Google
- https://support.google.com/business/answer/7091 - officiel Google
