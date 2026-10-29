# 05 — Sitemaps (XML, index, images, vidéos, actualités, HTML, KML)

Consulté le 2026-10-29. Qualification : officiel / observation / hypothèse.

## 1. Règles actuelles des moteurs (référence)

Google (officiel, https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) :
- Formats : XML (le plus complet : images, vidéos, actualités, versions localisées), RSS 2.0 / mRSS / Atom 1.0 (seulement les URL récentes), texte (une URL par ligne).
- Limites : 50 Mo non compressé **ou** 50 000 URL par sitemap ; au-delà, scinder, avec éventuellement un fichier index.
- UTF-8 ; valeurs XML échappées ; URL absolues et qualifiées complètement ; inclure les URL canoniques.
- **`<lastmod>`** : utilisé seulement s'il est constamment exact ; doit refléter un changement significatif (contenu, données structurées, liens), pas un changement trivial (ex. année du copyright).
- **`<priority>` et `<changefreq>` sont ignorés par Google.**
- Portée : sauf soumission via Search Console, un sitemap ne couvre que les URL de son répertoire et en dessous ; racine recommandée.
- Soumission : Search Console, API, ligne `Sitemap:` du robots.txt, WebSub (RSS/Atom) ; c'est un indice, pas une garantie de crawl.

sitemaps.org (officiel, https://www.sitemaps.org/protocol.html) : `urlset`/`url`/`loc` obligatoires ; `lastmod`, `changefreq`, `priority` facultatifs (pris en charge de manière variable selon les moteurs) ; `loc` sous 2 048 caractères ; `lastmod` au format W3C Datetime (AAAA-MM-JJ accepté) ; `priority` de 0,0 à 1,0 (défaut 0,5) ; index : `sitemapindex` jusqu'à 50 000 sitemaps, même site uniquement ; échappement des caractères `& ' " > <` ; même protocole et hôte que le sitemap.

Images (officiel Google, `.../sitemaps/image-sitemaps`) : espace de noms `sitemap-image/1.1` ; `<image:image>` (jusqu'à 1 000 par `<url>`) avec `<image:loc>` obligatoire ; `caption`, `geo_location`, `title`, `license` retirés de la documentation (à ne pas utiliser) ; images sur un autre domaine (CDN) possibles si le domaine est validé dans Search Console ; robots.txt ne doit pas bloquer les images.

Vidéos (officiel Google, `.../sitemaps/video-sitemaps`) : obligatoires `thumbnail_loc`, `title`, `description` (2 048 caractères max), et `content_loc` ou `player_loc` (au moins un, différents de `<loc>`) ; facultatifs `duration` (1 à 28 800 s), `expiration_date`, `rating` (0,0 à 5,0), `publication_date`, `family_friendly`, `restriction`, `platform`, `requires_subscription`, `live`, `uploader` (255 caractères max), `tag` (32 max) ; retirés : `category`, `gallery_loc`, `price`, `tvshow`, attributs `autoplay`/`allow_embed`. Googlebot doit pouvoir accéder aux URL (pas bloquées par robots.txt).

Actualités (officiel Google, `.../sitemaps/news-sitemap`) : uniquement les articles des deux derniers jours ; jusqu'à 1 000 balises `<news:news>` par sitemap ; obligatoires `news:publication` (`news:name` identique à celui de news.google.com sans parenthèses, `news:language` ISO 639), `news:publication_date` (date de première publication, format W3C), `news:title` (titre tel qu'affiché, sans auteur/publication/date) ; ajouter aux sitemaps existants plutôt que recréer ; un sitemap vide est acceptable.

## 2. Ce que fait Rank Math

Source principale : https://rankmath.com/kb/configure-sitemaps/ (officiel). Rank Math génère à l'exécution un **index** `…/sitemap_index.xml` et des sous-sitemaps par type de contenu ; il omet `<priority>` et `<changefreq>` parce que Google ne les utilise plus (officiel). `<lastmod>` : **non discuté** dans les pages lues (voir Lacunes) ; l'article de dépannage ne le mentionne pas. Soumission : manuelle (Search Console, saisir `sitemap_index.xml`) ou automatique si Analytics/Search Console sont connectés (officiel : `kb/submit-sitemap-to-google/`) ; l'article ne mentionne ni Bing ni IndexNow (un article dédié Bing existe dans la catégorie, non lu).

### 2.1 Réglages généraux
| Réglage | Comportement | Niveau |
|---|---|---|
| Liens par sitemap | Maximum d'éléments par page de sitemap ; 200 recommandé (ancien défaut 1 000) ; limite dure Google 50 000 | Gratuit |
| Images dans les sitemaps | Activé par défaut ; recommandé | Gratuit |
| Inclure les images mises en avant | Recommandé | Gratuit |
| Images des champs ACF | Seulement si ACF installé et module actif | **PRO** |
| Exclure des articles | IDs séparés par virgules (articles, pages, types personnalisés) | Gratuit, **mode avancé** |
| Exclure des termes | IDs de termes | Gratuit, mode avancé |
| Inclure les termes vides | Archives sans contenu exclues par défaut (contenu pauvre) | Mode avancé |

### 2.2 Par type de contenu
Chaque onglet propose « Inclure dans le sitemap », « Inclure dans le sitemap HTML », et une liste de champs personnalisés pour images ; l'URL du sitemap s'affiche en haut de la page.
- **Auteurs** : seulement si archives d'auteurs activées et indexables ; recommandé pour sites multi-auteurs ; options : inclure auteurs sans articles, exclure des rôles, exclure des utilisateurs (par ID).
- **Articles, pages** : inclusion recommandée.
- **Pièces jointes** : par défaut exclues car la redirection vers le parent est active ; pour un sitemap de médias, désactiver cette redirection (Réglages généraux → Liens). Exclusion unitaire dans la médiathèque (case « Exclure cette pièce jointe du sitemap »).
- **Forums / sujets / réponses**, **produits** (WooCommerce) : inclusion recommandée si présents.
- **Catégories / étiquettes** : ne pas indexer les archives sans raison ; ne choisir qu'une des deux taxonomies. Autres taxonomies : produits, étiquettes de sujets.

### 2.3 Sitemaps spéciaux
| Sitemap | Niveau | Détails |
|---|---|---|
| **Actualités** | **PRO** | Module Sitemap requis. Nom de publication (identique à Google News), types de contenu, exclusion par termes (si Articles). Seuls les contenus des **2 derniers jours** (règle Google) ; jusqu'à **1 000 URL** par sitemap, scindé automatiquement ; schémas NewsArticle et Auteur générés ; images détectées ; `%sitename%` retiré des titres du sitemap ; propriétés genres, stock ticker et keywords retirées car plus nécessaires. Par contenu : « Googlebot-News Index » (Index/No Index) dans l'onglet Avancé. Contenus marqués News reçoivent le schéma NewsArticle même si Titres & Meta dit autrement (officiel : `kb/news-sitemap/`). |
| **Vidéo** | Page dédiée ne l'étiquette pas PRO ; la page de configuration et l'assistant le placent en **PRO** (officiel : `configure-sitemaps`, `how-to-setup`) | Modules Schema + Sitemap requis. Analyse du contenu principal et de champs personnalisés (un par ligne) ; YouTube détecté via l'API YouTube (clé facultative : sans clé, API publique par défaut avec limites et fiabilité réduite) ; Vimeo et vidéos auto-hébergées non confirmés par la page. Génère aussi un schéma Video (miniature, URL d'intégration, durée…). « Hide Sitemap » (désactivé par défaut) : visible pour les robots seulement. Types de contenu à analyser configurables. |
| **Local (KML)** | **PRO** | Module Local SEO & Knowledge Graph ; fichier KML créé à partir des emplacements multiples, inclus dans `local-sitemap.xml`. |
| **HTML** | Gratuit (la page parle de « version gratuite ») | Activé dans Sitemap Settings → HTML Sitemap ; affichage par shortcode ou page ; tri (date de publication, modification, alphabétique, ID) ; dates ; titres d'éléments ou titres SEO ; « Inclure dans le sitemap HTML » par type. Non soumissible à Search Console (formats acceptés : XML, RSS, mRSS, Atom, texte). Importable depuis AIOSEO. |

### 2.4 Exclusions et règles implicites
Raisons pour lesquelles une URL est absente (officiel, `kb/url-not-in-sitemap/`) : robots **noindex** ; **canonical personnalisé** pointant ailleurs ; ID dans « Exclure articles/termes » ; archive vide ; cache. Autres exclusions : désactiver « Inclure dans le sitemap » pour un type, exclusion des utilisateurs/rôles, pièce jointe unique, KML. L'article ne traite pas les pages protégées par mot de passe, le statut de publication ni les redirections (non documenté).

### 2.5 Dépannage documenté (`kb/fix-sitemap-issues/`)
Page blanche ou 404 (réenregistrer les permaliens, supprimer un fichier physique `sitemap_index.xml`), espace avant la déclaration XML (wp-config/functions), « Missing XML tag » si tout est exclu, règles de réécriture Apache/Nginx, blocage par robots.txt, erreur de format (espace de noms 0.9, guillemets droits), lenteur (ressources serveur : 1 000 variables d'entrée, 120 s, 512 M, 150 s), exclusion du cache. Personnalisation par filtres PHP (URL de base, slug de l'index, ajout d'URL via `rank_math/sitemap/{$type}_content` sur la première page seulement).

### 2.6 robots.txt
Rank Math ajoute par défaut une ligne `Sitemap:` vers `sitemap_index.xml` dans son robots.txt virtuel ; ajout manuel possible dans l'éditeur (officiel : `kb/add-sitemaps-to-robots-txt/`). Cas multisite non traité.

## 3. Dépendance WordPress et pertinence Kolakisa
- Structure (index + sous-sitemaps par type, découpage par N URL, exclusion par ID/termes/rôles, inclusion des images) : **entièrement transposable**. Les règles Google/sitemaps.org ci-dessus s'appliquent telles quelles.
- Spécifique WP : réécriture d'URL, `.htaccess`, filtres PHP, ACF, cache plugin.
- **Hypothèse** pour Kolakisa : générer `lastmod` à partir de la date de dernière modification réelle du contenu et ne pas émettre `priority`/`changefreq` ; filtrer noindex, canonical divergent, brouillons/protégés (règles à confirmer car la liste de Rank Math n'est pas exhaustive) ; plafonner à 50 000 URL / 50 Mo ; news : fenêtre de 2 jours ; vidéos : exiger miniature, titre, description et `content_loc`/`player_loc`.
- Limite : seuil « 200 liens par sitemap » est une recommandation Rank Math, non une exigence Google.

## 4. Sources
| URL | Consultée | Nature |
|---|---|---|
| https://rankmath.com/kb/configure-sitemaps/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/exclude-content-from-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/url-not-in-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/video-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/news-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/html-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/fix-sitemap-issues/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/submit-sitemap-to-google/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/add-sitemaps-to-robots-txt/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/wordpress/sitemaps/ | 2026-10-29 | officiel (page 1 sur plusieurs ; 15 articles) |
| https://rankmath.com/kb/how-to-setup/ | 2026-10-29 | officiel |
| https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps | 2026-10-29 | officiel (Google) |
| https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap | 2026-10-29 | officiel (Google) |
| https://www.sitemaps.org/protocol.html | 2026-10-29 | officiel |

## 5. Lacunes
- **`lastmod` chez Rank Math** : aucun article lu ne dit s'il est émis ni comment il est calculé. Ne pas supposer.
- Niveau gratuit/PRO du sitemap vidéo : contradiction entre la page dédiée (pas d'étiquette) et l'assistant/réglages (PRO).
- Prise en charge de Vimeo et de vidéos auto-hébergées : non confirmée.
- Règles exactes pour pages protégées par mot de passe, brouillons, redirigées : non documentées.
- Articles non lus : `kb/submit-sitemap-to-bing/`, `kb/kml-sitemap/`, `kb/exclude-sitemaps-from-caching/`, `kb/sitemaps-seo-benefits/`, `kb/zero-discovered-urls-through-sitemap/`, `kb/submit-website-to-search-engines/`, page 2 de la catégorie Sitemaps, documentation des filtres `rankmath.com/docs/filters-and-hooks/admin/sitemap/` (apparue en recherche, non ouverte).
- Pings aux moteurs de recherche, sitemap d'images séparé : non couverts par l'article de configuration.
- RFC 9309 (robots.txt) : non consultée dans ce document.
