# 02 — Titres, méta-descriptions, variables, modèles, canonical, robots

Consulté le 2026-10-29. Qualification : officiel / observation / hypothèse.

## 1. Architecture des réglages et priorité

Officiel (https://rankmath.com/kb/advanced-tab/) : les réglages d'un contenu sont « locaux » et prennent le pas sur les réglages « globaux » de Titres & Meta. Hiérarchie observée dans les pages :
1. Valeur saisie dans la méta-boîte du contenu (titre, description, robots, canonical, redirection).
2. Modèle du type de contenu / de la taxonomie / de la page spéciale (Titres & Meta).
3. Réglages globaux (robots global, séparateur, capitalisation, image OG).
4. Pour les robots : choix « Par défaut » (hérite du global) ou « Personnalisé ».

Les réglages Titres & Meta ne sont pas enregistrés automatiquement (bouton « Save Changes ») ; le bouton de réinitialisation remet **toutes** les sections par défaut (officiel : https://rankmath.com/kb/titles-and-meta/). Les sections sont : Global Meta, Local SEO, Social Meta, Homepage, Authors, Misc Pages, Post Types (articles, pages, pièces jointes, produits, forums…), Taxonomies, Groups (BuddyPress), RM Locations (**PRO**).

## 2. Réglages globaux (Global Meta)

| Réglage | Comportement documenté | Niveau |
|---|---|---|
| Robots Meta | Cases No Index, No Archive, No Snippet, No Follow, No Image Index ; recommandé : tout désactivé | Gratuit (non étiqueté PRO) |
| Advanced Robots Meta | Longueur d'extrait, durée de prévisualisation vidéo, taille d'image (large, standard, aucune) ; défaut -1 (illimité) pour extrait et vidéo | idem |
| Noindex des archives vides (catégories/étiquettes) | Recommandé activé | idem |
| Séparateur | Caractère prédéfini ou personnalisé, inséré par `%sep%` | idem |
| Capitaliser les titres | Recommandé activé | idem |
| Réécriture des titres | N'apparaît que si le thème ne gère pas `title-tag` | idem (spécifique WP) |
| Miniature OpenGraph de repli | 1200×630 recommandé | idem |
| Type de carte Twitter | Résumé ou résumé avec grande image | idem |
| Filigranes d'images sociales | Filigrane personnalisé / par défaut | **PRO** |

Source : https://rankmath.com/kb/titles-and-meta/ (officiel).

## 3. Variables (officiel : https://rankmath.com/kb/variables/)

Utilisables dans les champs de titre/description (méta-boîte et Titres & Meta). Les variables fonctionnent dans titre et description, pas dans l'URL (officiel : `kb/general-tab/`).

- **Site** : `%sep%`, `%sitename%` (titre du site), `%sitedesc%` (slogan), `%search_query%` (pages de recherche uniquement).
- **Date/heure courantes** : `%currentdate%`, `%currentday%`, `%currentmonth%`, `%currentyear%`, `%currenttime%`, `%currenttime(format)%` (format de date WordPress).
- **Compteur** : `%count(nom)%` (incrémenté à chaque usage dans la page).
- **Pièces jointes** : `%filename%` ; `%imagealt%`, `%imagetitle%` (**PRO**).
- **Organisation** (module Local SEO) : `%org_name%`, `%org_logo%`, `%org_url%`.
- **Contenu** : `%title%`, `%parent_title%`, `%excerpt%` (généré si absent), `%excerpt_only%` (vide si pas d'extrait), `%url%`, `%post_thumbnail%`, `%id%`, `%date%`/`%date(format)%`, `%modified%`/`%modified(format)%`, `%pt_single%`, `%pt_plural%`.
- **Catégories/étiquettes** : `%category%`, `%categories%`, `%categories(limit=… & separator=… & exclude=…)%`, `%tag%`, `%tags%`, `%tags(…)%`.
- **Taxonomies/termes** : `%term%`, `%term_description%`, `%customterm(taxonomie)%`, `%customterm_desc(taxonomie)%`.
- **Auteur** : `%userid%`, `%name%`, `%user_description%`.
- **Mots-clés** : `%focuskw%` (principal), `%keywords%` (tous, séparés par virgules).
- **Champs personnalisés** : `%customfield(nom)%`.
- **Pagination** : `%page%` (affiché dès la page 2, ex. « Page 3 Of 5 »), `%pagenumber%`, `%pagetotal%`.
- **Mots aléatoires** : `%randomword(a|b|c)%`, `%randomword_np(a|b|c)%` (**PRO**).
- **BuddyPress** : `%group_name%`, `%group_desc%`. **WooCommerce** : `%wc_price%`, `%wc_sku%`, `%wc_shortdesc%`, `%wc_brand%`.
- **Variables personnalisées** : crochet PHP `rank_math/vars/register_extra_replacements` (spécifique WordPress).

Pertinence Kolakisa : le moteur de gabarits à variables est **directement transposable** (hypothèse : une table de remplacement évaluée côté serveur au rendu). Limite : les noms de variables sont ceux de Rank Math ; la fonction de repli de `%excerpt%` (génération automatique) n'est pas détaillée (longueur, algorithme non documentés).

## 4. Modèles par type de contenu

Officiel (`kb/titles-and-meta/`) — la plupart des types partagent :
- Titre et description « single » (modèles) ; schéma par défaut (type, titre/headline, description, type d'article : Article, Blog Post, News Article) ; autodétection de vidéo et génération d'image (**PRO**) ;
- robots et robots avancés (défaut ou personnalisé) ;
- suggestions de liens internes (par titres ou mots-clés) ; taxonomie principale (fil d'Ariane) ;
- partage Slack enrichi ; « Add SEO Controls » (méta-boîte) ; édition en masse (Désactivée / Activée / Lecture seule) ; champs personnalisés pris en compte dans l'analyse ; filigrane par défaut (**PRO**).
- Spécifiques : pièces jointes (nécessite de désactiver la redirection des pièces jointes), forums/sujets/réponses (bbPress), téléchargements (EDD), produits (WooCommerce : schéma Product, Slack avec prix/disponibilité), emplacements RM (**PRO**, nécessite Organisation + « Use Multiple Locations »), groupes BuddyPress.
- Valeurs recommandées par l'article pour articles : robots « Index » uniquement.

## 5. Modèles par taxonomie et archives

- **Taxonomies** (catégories, étiquettes, étiquettes de sujet, catégories/étiquettes de téléchargements EDD, catégories/étiquettes de produits WooCommerce, catégories d'emplacements **PRO**) : titre et description d'archive, robots/avancés, Slack, Add SEO Controls, édition en masse, « Remove Snippet Data » (retire le schéma des archives, utile si noindex), filigrane (**PRO**).
- **Accueil** : titre, description, robots (défaut/personnalisé), titre/description/miniature Facebook.
- **Auteurs** : activer/désactiver (désactiver redirige vers l'accueil), base d'URL `/author/` modifiable, robots (au moins noindex recommandé), titre/description, partage Slack, contrôles SEO sur le profil.
- **Pages spéciales (Misc)** : archives par date (la plupart des sites devraient les désactiver ; robots noindex recommandé), titre 404, titre des résultats de recherche, noindex des résultats de recherche (recommandé), noindex des sous-pages, noindex des pages uniques paginées, noindex des pages protégées par mot de passe (recommandé).
- Social Meta (optionnels) : page Facebook, auteur/admin/app Facebook (le champ d'« authorship » est noté comme possiblement abandonné), compte Twitter pour `twitter:creator`, profils additionnels (un par ligne, `sameAs` de l'Organisation).
- Local SEO : renvoie à un guide séparé, non lu.

## 6. Robots meta et directives avancées

Rank Math (officiel, `kb/advanced-tab/`) :
- Six cases : Index (défaut), No Index, No Follow, No Archive, No Image Index, No Snippet. Index et No Index s'excluent.
- Avancé : Max Snippet (caractères, défaut -1), Max Video Preview (secondes, défaut -1), Max Image Preview (trois niveaux ou aucun).
- Googlebot-News Index (**PRO**) : visible seulement si le News Sitemap est activé et le type de contenu ajouté ; n'affecte que Google News.
- Rank Math gère la balise robots meta ; l'article de comparaison X-Robots-Tag ne décrit pas de gestion d'en-têtes `X-Robots-Tag` par Rank Math (officiel, `kb/robots-meta-tag-vs-x-robots/`).

Règles du moteur (officiel Google, https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) :
- Directives prises en charge : `noindex`, `nofollow`, `none`, `nosnippet`, `indexifembedded`, `max-snippet`, `max-image-preview` (none/standard/large), `max-video-preview`, `notranslate`, `noimageindex`, `unavailable_after`.
- **`noarchive`, `nocache` et `nositelinkssearchbox` sont ignorés par Google Search** (donc la case « No Archive » n'a pas d'effet côté Google ; effet éventuel sur d'autres moteurs : non documenté ici).
- Règle conflictuelle : la plus restrictive gagne ; une page bloquée par robots.txt ne laisse pas lire ses méta (les consignes sont ignorées).
- `max-snippet:0` équivaut à `nosnippet` ; `-1` = pas de limite.
- Les directives de robots meta ne limitent pas en général les données structurées (exception : `description` de certains balisages d'article).

Limites constatées : Rank Math n'expose pas `unavailable_after`, `notranslate`, `indexifembedded` dans les pages lues (**observation** — absence dans les articles consultés, non une preuve d'absence dans le produit).

## 7. Canonical

- Défaut : URL courante du contenu, canonical auto-référent ; champ vide = URL courante (officiel : `kb/advanced-tab/`, extraits `kb/how-to-change-canonical-url/`).
- Surcharge : champ « Canonical URL » de l'onglet Avancé (mode avancé requis).
- Effet de bord documenté : un canonical personnalisé retire l'URL du sitemap (officiel : `kb/url-not-in-sitemap/`, `kb/fix-sitemap-issues/`).
- Édition en masse du canonical et filtre « Custom Canonical URL » : **PRO** (officiel : `kb/bulk-editing-in-rank-math/`).
- Aucun canonical par bloc (observation d'un ticket de support).
- Règles Google (officiel, https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) : canonical = signal, pas ordre ; préférer des URL absolues ; redirections et `rel=canonical` sont des signaux forts, l'inclusion dans le sitemap un signal faible ; ne pas utiliser robots.txt ni noindex pour canonicaliser ; un seul canonical par page ; inclure l'auto-référence.
- **Lacune** : comportement détaillé pour pages paginées, taxonomies, termes, pagination : non documenté dans les pages lues.

## 8. Titres et descriptions : règles de l'éditeur

- Aperçu SERP éditable (titre, permalien, description) avec barre de longueur et vérificateur de largeur en pixels (bureau seulement) ; aperçu mobile/bureau (officiel : `kb/general-tab/`).
- Google (officiel) : le titre affiché est généré à partir de plusieurs sources (balise title, titre visible, h1, `og:title`, ancres, données structurées `WebSite`) ; pas de limite en caractères mais troncature à la largeur ; description : utilisée seulement parfois, pas de limite imposée (https://developers.google.com/search/docs/appearance/title-link et `.../snippet`).
- Chiffres de Rank Math (50 caractères mobile / 60 bureau pour le titre ; 120–160 pour la description) sont des **recommandations Rank Math**, pas des règles Google (officiel Rank Math, `kb/score-100-in-tests/`).

## 9. Édition en masse (rappel)
Colonnes SEO dans les listes (titre, description) gratuites ; édition avancée (robots, canonical, mot-clé principal, modèles) **PRO** ; CSV **PRO** (officiel : `kb/bulk-editing-in-rank-math/`).

## 10. Pertinence pour Kolakisa
- Fort : modèles + variables, héritage global → type → contenu, robots global/par page, canonical auto-référent, noindex automatique des archives vides/recherche/pages protégées, aperçu SERP.
- Faible/spécifique WP : réécriture `title-tag`, `rank_math/vars`, taxonomies WooCommerce/EDD/bbPress, Slack enrichi.
- **Hypothèse** : prioriser les règles Google ci-dessus (directives réellement supportées) plutôt que d'imiter la case « No Archive ».

## 11. Sources
| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/titles-and-meta/ | 2026-10-29 | officiel (lu en deux parties : 0–100 000 et 100 000–fin) |
| https://rankmath.com/kb/variables/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/advanced-tab/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-tab/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/robots-meta-tag-vs-x-robots/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/how-to-change-canonical-url/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/bulk-editing-in-rank-math/ | 2026-10-29 | officiel |
| https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/appearance/title-link | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/appearance/snippet | 2026-10-29 | officiel (Google) |

## 12. Lacunes
- Modèles par défaut de titres/descriptions livrés par Rank Math (valeurs initiales) : non listés dans les pages lues.
- Algorithme de génération automatique de description (longueur, nettoyage) : non documenté.
- Canonical des pages paginées/taxonomies : non documenté.
- Pages `kb/canonical-urls/`, `kb/meta-box-general-tab/`, `kb/advanced-robots-meta/` : HTTP 404 (URL devinées).
- Non lus : guide Local SEO, RFC 9309 (non consultée dans ce document), spécifications Open Graph (voir doc 07 réservé).
- Section Docs « Developers » (filtres/hooks) non explorée.
