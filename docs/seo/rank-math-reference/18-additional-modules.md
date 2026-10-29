# 18 - Modules additionnels

Date de consultation : 2026-10-29. Statuts : officiel / observation / hypothèse.

| Module | Fonctionnement documenté | Niveau | WP | Pertinence Kolakisa |
|---|---|---|---|---|
| Breadcrumbs | Options : séparateur, lien et libellé d'accueil, préfixe, formats archive/recherche, libellé 404, masquer le titre, catégorie principale, nom de taxonomie, page blog. Sortie par shortcode `[rank_math_breadcrumb]` ou fonction PHP ; dépend du module Schema pour le JSON-LD BreadcrumbList. Widget Elementor = Elementor Pro + Rank Math PRO | Cœur (listé gratuit) ; widget Elementor PRO | Fort (shortcode, thème) | Élevée : composant de rendu + JSON-LD natifs |
| RSS | Réglages « Others » : contenu avant/après chaque élément (variables), « Remove Media Data from RSS Feed » = PRO | Gratuit sauf suppression des médias (PRO) | Moyen | Moyenne |
| Liens sortants | Strip Category Base, redirection des pièces jointes, nofollow des liens externes, nofollow des liens fichiers image, domaines nofollow / exclus, ouverture en nouvel onglet, préfixe de liens d'affiliation (PRO) ; free-vs-pro : « Mark Cloaked Links as External Links » | Gratuit sauf préfixe affilié | Moyen | Élevée : filtre à la sortie HTML |
| Auteurs | Titles & Meta : archives d'auteur on/off, base d'URL, robots, titre/description modèles, aperçu Slack enrichi, méta box SEO sur les profils utilisateurs | Aucun label PRO | Fort (concepts WP) | Moyenne : pages d'auteur si Kolakisa en a |
| Archives de dates, 404, recherche | Titres modèles, noindex des résultats de recherche, noindex des sous-pages paginées, des pages protégées par mot de passe | Aucun label PRO | Moyen | Élevée pour noindex/pagination |
| Sitemap vidéo | Détection de vidéos dans les types choisis, option de masquer aux visiteurs, champs personnalisés, clé API YouTube facultative (sans clé : API publique par défaut, limitée). Dépend de Schema et Sitemap | PRO (confirmé : listé parmi les fonctions PRO du sitemap dans `configure-sitemaps`) | Moyen | Moyenne : service externe YouTube pour métadonnées |
| Sitemap actualités (Google News) | Nom de publication, types de contenu, exclusion de termes, option Googlebot-News par article ; seulement les contenus des 2 derniers jours ; 1 000 URL par sitemap ; schema NewsArticle auto | PRO | Moyen | Faible/moyenne (utile si éditorial) |
| Sitemap local | KML pour établissements ; exige Local SEO | PRO | Moyen | Faible |
| Sitemap général | Liens par sitemap (recommandé 200), images (activé par défaut), exclusions articles/termes/auteurs/pièces jointes, index `sitemap_index.xml`, `priority` et `changefreq` omis | Gratuit ; images ACF = PRO | Moyen | Élevée |
| Podcast | Flux RSS podcast (compatible Apple, Spotify, Google Podcasts selon la page), réglages du podcast, schema d'épisode ; bloc ou shortcode | PRO | Moyen | Faible |
| Instant Indexing | Protocole IndexNow (Bing, Yandex, Seznam, Naver), soumission auto à la publication/modification, soumission manuelle et en lot, URL noindex ignorées ; clé en fichier texte à la racine ; limite par POST : 10 000 URL (429 au-delà). Google Indexing API non couvert par cette page | Gratuit | Moyen | Élevée : simple appel HTTP |
| 404 Monitor | Modes Simple (URI, date, hits) et Avancé (referer, OS, navigateur) ; limite de journal 100 lignes par défaut, chemins exclus, paramètres ignorés | Niveau non précisé par la KB ; free-vs-pro liste « Simple 404 Monitor » et « Advanced 404 Monitor » | Faible | Élevée |
| Redirections | Types 301/302/307/410/451, regex, débogage, redirection automatique d'articles, comportements de repli, import CSV, synchronisation .htaccess (PRO) | Cœur + options PRO | .htaccess = Apache | Élevée |
| Headless CMS | Endpoint REST `wp-json/rankmath/v1/getHead?url=` renvoie les balises head complètes d'une URL ; activer dans Others | Aucun plan nommé | Fort (REST WP) | Très pertinent comme modèle d'API : exposer les balises head générées par URL |
| llms.txt | Générateur : types d'articles, taxonomies, limite (100 par défaut), contenu additionnel | Listé gratuit (« Advanced llms.txt Generator ») | Moyen | Élevée |
| Robots.txt / .htaccess | Éditeur virtuel et testeur ; .htaccess avec sauvegarde | Listé gratuit | .htaccess : Apache | robots.txt : élevée |
| Images SEO | alt/title auto ; légende, description, casse, alt des avatars, remplacements = PRO ; filigranes sociaux, auto-génération d'images (PRO) | Mixte | Moyen | Moyenne |
| SEO Score visible aux visiteurs | Option « Show SEO Score to Visitors » | Gratuit | Fort | Faible |
| Schema | Types : 18 prédéfinis gratuits, 6 supplémentaires et 840+ types selon free-vs-pro, import de schema, schema personnalisé JSON-LD (PRO) ; Automatic FAQ depuis widgets Elementor/Divi, vidéo auto, etc. Le détail des offres n'est pas lisible (icônes) | Mixte | Moyen | Élevée pour le socle |
| Local SEO, WooCommerce, EDD, bbPress | Listés sur free-vs-pro ; non détaillés | Mixte | Fort | Faible sauf besoin local |
| Elementor / Divi | Intégrations et widgets | Mixte | Fort | Nulle |
| API / MCP | Voir 15 | Mixte | Moyen | Élevée |
| Recherche interne | Aucune fonction de moteur de recherche interne n'est documentée ; seuls noindex des résultats de recherche et titre de recherche | - | - | Hors périmètre Rank Math |

## Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/breadcrumbs/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-settings/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/titles-and-meta/ | 2026-10-29 | officiel (100 000 caractères sur 180 404 lus) |
| https://rankmath.com/kb/video-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/news-sitemap/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/configure-sitemaps/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/podcast/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/instant-indexing/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/404-monitor/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/headless-cms-support/ | 2026-10-29 | officiel |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel |

## Lacunes

- 404 : `kb/how-to-use-breadcrumbs/`, `kb/rss-settings/`, `kb/link-settings/`, `kb/redirections/` (détails obtenus via General Settings et free-vs-pro).
- Titles & Meta : seconde moitié non lue (produits, localisations).
- Local SEO, WooCommerce, EDD, Schema par type, Image SEO détaillé : non lus en détail.
- Confirmation PRO du sitemap vidéo : issue de la page sitemaps ; la page vidéo ne l'indique pas.
