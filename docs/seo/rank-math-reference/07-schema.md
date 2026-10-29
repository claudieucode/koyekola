# 07 - Données structurées (Schema / JSON-LD) selon Rank Math et Google

Date de consultation : 2026-10-29. Mentions : **[officiel]**, **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO uniquement quand la source le dit. Attention : la page officielle « Free vs PRO » est rendue sans cases cochées dans l'extraction : la matrice par offre n'est donc **pas** vérifiable ici.

## 1. Fonctionnement du module Schema de Rank Math

- Module « Schema (Structured Data) » à activer dans Rank Math SEO > Tableau de bord > Modules. Sortie en **JSON-LD**. [officiel : kb/rich-snippets, kb/website-schema]
- Type par défaut par type de contenu (articles, pages, types personnalisés) dans Titres et Méta ; modifiable par contenu (onglet Schema de la meta box ou barre latérale Gutenberg). Le défaut ne crée pas de schéma rétroactif sur le contenu existant : il définit le point de départ de chaque contenu. [officiel]
- Générateur de schéma, templates, plusieurs schémas par page : **PRO**. En gratuit : un schéma, essentiellement via les types par défaut et les blocs. [officiel : kb/rich-snippets]
- Types automatiques : ProfilePage sur pages d'auteur, CollectionPage sur archives, SiteNavigationElement lié à la table des matières, WebSite (avec SearchAction), BreadcrumbList. [officiel]
- **Fusion automatique** des schémas compatibles ; il faut choisir un schéma principal compatible pour viser un résultat enrichi (ex. Review fusionné dans Recipe). [officiel : kb/schema-selection-guide]
- **Variables** (de base, avancées, article, terme, auteur, WooCommerce, BuddyPress) résolues au rendu ; les variables WooCommerce ne marchent que sur pages WooCommerce. [officiel]
- **Éditeur avancé (PRO)** : une fois activé, le schéma ne s'édite plus que là. **Schéma personnalisé (PRO)** : propriétés et groupes de propriétés. **Import (PRO)** depuis URL, HTML ou JSON-LD collé. **Code Validation (PRO)** : affiche le JSON-LD (brouillon enregistré d'abord pour résoudre les variables), envoie le code (pas l'URL) au Rich Results Test ; pour les types non supportés par Google, utiliser validator.schema.org. [officiel]
- **Templates globaux (PRO)** avec conditions d'affichage : inclure/exclure/insérer ; cibles : site entier, archives (auteur, recherche, catégorie, étiquette, taxonomie), contenus singuliers (par type, catégorie, étiquette, format, contenu). Les exclusions l'emportent ; singulier/archives l'emportent sur « site entier » ; « Insert » ajoute des propriétés à un schéma existant (ex. Organization). [officiel : kb/schema-templates, kb/rich-snippets]
- Graphe de connaissances : réglages Titres et Méta > Local SEO > « Person or Company » (Personne/Organisation), nom du site et nom alternatif utilisés par le schéma WebSite. [officiel]
- `sameAs` : profils sociaux (Titres et Méta > Social Meta > « Additional Profiles »), profils d'auteur (champs du profil utilisateur). [officiel : kb/sameas-schema]

## 2. Types proposés par Rank Math

Source de la liste : guide de sélection (40+ types, **niveaux non indiqués** dans la page lue) et recherche rankmath.com (synthèse de moteur, [observation]).

| Type | Niveau (si dit) | Remarque |
|---|---|---|
| Article, NewsArticle, BlogPosting | gratuit [observation] | Speakable (PRO) en sous-partie |
| Book, Course, Event, Job Posting (+ Estimated Salary), Music, Person, Product, Recipe, Restaurant, Service, Software, Video, WebPage, WebSite, Breadcrumb, Local SEO (Logo), Review | gratuit (types listés dans la page rich-snippets) | Course : voir §4 |
| FAQ, HowTo | listés gratuits ; HowTo via générateur = PRO, gratuit via bloc éditeur [observation] | Voir §5 : restreints/retirés par Google |
| Dataset, FactCheck, Movie, Podcast, About & Mentions, ItemList, Carousel, Q&A Page, Speakable | **PRO** [officiel : kb/rich-snippets] | |
| Custom Schema, import, templates, multi-schémas | **PRO** | |
| Education Q&A/Quiz, Practice Problem, Learning Video, Vehicle listing | listés sans lien | Retirés par Google (§5) |
| Q&A | bbPress uniquement | |
| GTIN/ISBN/MPN | PRO pour la configuration globale (WooCommerce) | |
Comptages variables selon les pages Rank Math (20+, 18 prédéfinis + 6 extras, 840+ supportés, 193 sous-types LocalBusiness) : incohérents entre pages. [observation]

## 3. Exigences Google (consultées 2026-10-29)

Règles générales : JSON-LD recommandé (Microdata/RDFa acceptés) ; ne marquer que le contenu visible ; reflet fidèle du contenu principal ; propriétés requises présentes ; types les plus spécifiques ; images crawlables/indexables ; ne pas bloquer par robots.txt/noindex ; violations = action manuelle (perte d'éligibilité, pas de pénalité de classement) ; markup valide ne garantit pas l'affichage. [officiel Google : sd-policies]

| Fonctionnalité | Requis | Recommandé / règles |
|---|---|---|
| Article/NewsArticle/BlogPosting | aucun | headline, author (Person/Organization, une entrée par auteur, nom seul, url ou sameAs), datePublished, dateModified (ISO 8601 + fuseau), image (≥50 000 px, ratios 16:9, 4:3, 1:1) |
| Product snippet | name + (review OU aggregateRating OU offers) | offers (price requis dans Offer ; priceCurrency, availability, priceValidUntil), aggregateRating, review ; AggregateOffer : lowPrice + priceCurrency ; pages d'un seul produit (ou variantes), pas de listes/catégories ; prix avec point décimal ; balisage dans le HTML initial de préférence ; Offer par devise sur URL distincte |
| Merchant listing | priceCurrency requis (≠ snippet) | détails non listés sur la page lue ; politiques retours/expédition : voir Organization |
| Course list | name, description (affichage 60 car.) ; liste : itemListElement, position, url unique | provider (Organization) |
| Organization | aucun | name, legalName, url, logo (≥112x112, fond blanc), address, contactPoint, sameAs, identifiants (iso6523Code préféré), hasMerchantReturnPolicy, hasShippingService, hasMemberProgram ; sur l'accueil ou une page « À propos » ; sous-type le plus spécifique (OnlineStore plutôt qu'OnlineBusiness) |
| BreadcrumbList | itemListElement ≥2 ListItem (item, name ; position à fournir) | chemin utilisateur typique, pas copie de l'URL ; résultats desktop uniquement (changelog 22 janv. 2025) |
| VideoObject | name, thumbnailUrl, uploadDate | contentUrl (préféré à embedUrl), description, duration, hasPart (Clip), regionsAllowed, interactionStatistic, creator/author (ajout 24 sept. 2026) |
| Local business | voir `08-local-seo.md` | |

## 4. Course et formations (cas Kolakisa)
- Google : le résultat « Course list » (carrousel/liste) existe encore dans la galerie ; la documentation « Course info » a été retirée le 9 sept. 2025 (changelog). [officiel Google : search-gallery, updates]
- Rank Math : champs Headline (requis), emplacement d'affichage, description, fournisseur (Personne/Organisation, nom, URL), mode (Online/Onsite/Blended), charge de travail ISO 8601 **ou** planning (durée, répétition, dates), Offres (catégorie Free/Partially Free/Subscription/Paid, prix, devise), Avis (note, min, max), Pros/Cons **PRO**, Carrousel automatique **PRO**. Avertissement officiel Rank Math : Google « abandonne progressivement » Course ; pas d'effet sur le classement. La page cite « ISO 8601 » pour la devise alors que le standard attendu est ISO 4217 : à ne pas reproduire. [officiel : kb/course-schema]

## 5. Restrictions actuelles des résultats enrichis (Google)
- **FAQ** : restreint en sept. 2023 aux sites gouvernementaux/santé reconnus ; **déprécié le 8 mai 2026** (« n'apparaîtra plus dans Google Search à partir du 7 mai 2026 ») ; documentation **supprimée le 15 juin 2026**. [officiel Google : developers.google.com/search/updates ; la page /faqpage redirige vers le journal]
- **HowTo** : résultat enrichi retiré sur mobile et desktop (documentation supprimée, entrée de sept. 2023). [officiel Google]
- **Retraits 2025-2026** : Special announcement (31 juil. 2025), documentation Course info, Estimated salary, Learning video, Vehicle listing, retirées le 9 sept. 2025 ; Practice problem déprécié 5 nov. 2025, retiré 6 janv. 2026 ; Book actions et ClaimReview signalés par bannières en juin 2025 (statut final non vérifié) ; Dataset limité à Dataset Search. [officiel Google : updates]
- La galerie actuelle (25 fonctions) ne contient plus FAQ, HowTo, ClaimReview, Sitelinks search box, Course info. [officiel Google : search-gallery]
- Rank Math reconnaît lui-même la dépréciation de FAQ, Course, FactCheck et de la sitelinks search box, et rappelle que Google peut utiliser des données non éligibles aux résultats enrichis. [officiel Rank Math]
- Autres changements Google utiles : avis (obligation de commentaire et d'auteur recommandés, jan. 2025 ; règle sur avis incités, juil. 2026), politiques marchand retours/expédition au niveau organisation (nov. 2025), `Product.category`, programme de fidélité (juin 2025). [officiel Google : updates]
- Conséquence : conserver FAQ/HowTo en sémantique éditoriale si utile, mais ne pas en attendre de résultat enrichi (**hypothèse**).

## 6. Dépendance WordPress / pertinence Kolakisa
| Élément | WP ? | Pertinence |
|---|---|---|
| Sortie JSON-LD par type de page | Non (JSON-LD standard) | Très élevée : générateur serveur par entité (formation, produit, article, organisation) |
| Fusion/graphe `@id` | Non | Élevée |
| Variables et templates avec conditions | Implémentation WP | Moyenne : mapping des champs du CMS |
| Éditeur avancé, import, schéma personnalisé | Interface WP | Faible/moyenne : champ JSON-LD brut avec validation |
| Validation via Rich Results Test | Service externe Google | Élevée en test manuel |
| Types Dataset/Movie/Podcast... | Non | Faible |
| Course + Product + Organization + Breadcrumb + VideoObject + Article | Non | Très élevée pour un e-commerce de formations |
[colonne pertinence : hypothèse]

## Lacunes
- Matrice Free/PRO exacte non lisible (free-vs-pro et pricing sans cases) ; niveaux par type non confirmés hors mentions explicites.
- Non lues : pages Rank Math par type (Person, Recipe, Event, Job, Software, Review, Video, Service, Speakable, Carousel, ItemList), kb/schema-selection-guide colonnes Google/Bing (cases perdues), kb/earning-star-ratings-in-serps.
- Journal Google lu sur ses 100 000 premiers caractères seulement ; statut final de ClaimReview et Book actions non vérifié ; la suppression de la sitelinks search box n'est déduite que de l'absence dans la galerie.
- Pages Google FAQ/HowTo : redirigent vers le journal ; texte dédié inaccessible.
- schema.org non consulté directement.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/rich-snippets/ ; /kb/schema-selection-guide/ ; /kb/schema-templates/ ; /kb/website-schema/ ; /kb/sameas-schema/ ; /kb/course-schema/ ; /kb/product-schema/ - officiel
- https://rankmath.com/free-vs-pro/ ; https://rankmath.com/pricing/ - officiel (cases illisibles)
- Recherche rankmath.com (types free/PRO) - observation
- https://developers.google.com/search/updates - officiel Google
- https://developers.google.com/search/docs/appearance/structured-data/search-gallery ; /sd-policies ; /article ; /product-snippet ; /course ; /organization ; /breadcrumb ; /video ; /faqpage ; /how-to - officiel Google
