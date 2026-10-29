# 06 - SEO technique selon Rank Math (robots.txt, indexation, canonical, pagination, duplication)

Date de consultation : 2026-10-29. Légende des mentions : **[officiel]** = énoncé par la source officielle citée ; **[observation]** = déduit du comportement/texte d'une page sans que la page le dise explicitement ; **[hypothèse]** = inférence de l'auteur, à vérifier.
Niveaux : Gratuit / PRO / Service externe, indiqués uniquement quand la source le dit ; sinon « non précisé ».

## 1. robots.txt

### 1.1 Ce que fait Rank Math
- Rank Math édite un fichier robots.txt **virtuel** (généré à la requête), depuis Rank Math SEO > Paramètres généraux > « Edit robots.txt ». L'option n'apparaît qu'en **mode avancé** (en mode Easy elle est absente). [officiel : kb/how-to-edit-robots-txt-with-rank-math, kb/fix-common-robots-txt-issues]
- Un fichier **physique** robots.txt à la racine **prend le dessus** : il faut le supprimer pour que l'éditeur ait un effet. [officiel]
- Contenu par défaut : un groupe `User-agent: *` qui interdit le répertoire d'administration WordPress, autorise `admin-ajax.php`, et déclare l'URL de l'index de sitemap. [officiel]
- Niveaux : édition directe = **gratuit** ; testeur intégré (bouton « Validate Code », choix du user-agent, « Revert Changes ») = **PRO** ; en gratuit, lien vers un testeur externe (outil Rank Math en ligne, rankmath.com/tools/robots-txt/). [officiel]
- Multisite : la page d'édition ne traite pas le multisite ; une autre page (« robots-txt-rules-for-multisite ») existe, **non lue** (voir Lacunes). Les résultats de recherche indiquent que seul le site principal du réseau est modifiable [observation, résumé de moteur de recherche non vérifié sur la page].
- Erreurs courantes documentées : fichier « non inscriptible » (filtre `rank_math/can_edit_file`, constante `DISALLOW_FILE_EDIT`), URL robots.txt en 404/blanc (fichier physique en conflit, règle de réécriture Apache/Nginx manquante), option absente (mode Easy), `Disallow: /` bloquant Google, PageSpeed Insights « robots.txt non téléchargeable » (souvent CDN ; peut être ignoré si le fichier s'affiche). [officiel : kb/fix-common-robots-txt-issues]
- Règles de syntaxe rappelées par Rank Math : directives User-agent / Disallow / Allow / Sitemap ; sensible à la casse ; `#` commentaire ; jokers `*` et `$` (pas dans Sitemap). Exemples : bloquer tout (staging), un bot, un répertoire, un type de fichier, les crawlers d'IA (Google-Extended, GPTBot - bloquer GPTBot bloque aussi ChatGPT-User), recherche interne, catégories, navigation à facettes. [officiel]
- Avertissements Rank Math : ne pas bloquer le site entier en production ; **Google déconseille de bloquer CSS et JavaScript** ; les bots malveillants ignorent robots.txt ; bloquer un chemin ne garantit pas la non-indexation ; bloquer les crawlers IA n'empêche pas l'indexation Google ni les AI Overviews. [officiel]

### 1.2 Règles moteurs (Google / RFC 9309)
- robots.txt contrôle l'**exploration**, pas l'indexation : une URL bloquée peut apparaître sans description. Pour désindexer : `noindex` (meta ou en-tête), mot de passe, suppression. [officiel Google : robots/intro]
- Pour que `noindex` soit vu, la page **ne doit pas** être bloquée par robots.txt. Google ne supporte pas `noindex` dans robots.txt. [officiel Google : block-indexing]
- Ressources : on peut bloquer des fichiers image/script/style non importants, **mais pas** s'ils sont nécessaires à la compréhension de la page. [officiel Google]
- Spécification (developers.google.com/.../robots_txt) : fichier à la racine de l'hôte/protocole/port exact ; 500 KiB lus au maximum ; cache ~24 h ; 2xx traité ; 3xx jusqu'à 5 redirections puis traité comme 404 ; 4xx = pas de restriction (sauf 429) ; 5xx/réseau = pause de crawl 12 h puis copie en cache jusqu'à 30 jours ; `*` et `$` ; règle la plus spécifique (chemin le plus long) l'emporte, à égalité la moins restrictive ; un seul groupe par crawler (le plus spécifique) ; UTF-8. [officiel Google]
- RFC 9309 : non consultée directement dans cette session (voir Lacunes) ; les points ci-dessus proviennent de la page Google.

### 1.3 Recommandations de sécurité (synthèse)
- Ne jamais ajouter `Disallow` sur les répertoires d'assets (CSS, JS, images du thème, polices) ni sur les routes d'API publiques de rendu.
- Ne pas utiliser robots.txt pour masquer des pages privées : utiliser authentification ou `noindex`/`X-Robots-Tag`.
- Toujours tester les URL clés (accueil, produit, catégorie, CSS/JS) après modification.

## 2. Balises robots (indexation)

- Onglet Avancé de chaque contenu (meta box) : **Index/No Index** (défaut Index), **No Follow**, **No Archive**, **No Image Index**, **No Snippet**. Réglages locaux au contenu ; les défauts globaux sont dans Titres et Méta. [officiel : kb/advanced-tab]
- **Robots meta avancé** : Max Snippet (défaut -1), Max Video Preview (défaut -1), Max Image Preview (trois valeurs prédéfinies, non nommées par la page ; Google définit none/standard/large). Rank Math précise que ces limites n'affectent pas les données structurées sauf `article.description`. [officiel]
- **Googlebot-News Index** : **PRO**, visible uniquement si le sitemap News est actif et le type de contenu inclus. [officiel]
- Réglages globaux (Titres et Méta) : robots meta global (Rank Math recommande de tout laisser désactivé et de désindexer au cas par cas), **Noindex Empty Category and Tag Archives** (recommandé), **Noindex Search Results** (recommandé), **Noindex Subpages** (sous-pages paginées d'archives), **Noindex Paginated Single Pages** (contenus paginés avec <!--nextpage--> ; Rank Math rappelle que Google ne supporte plus rel=next/prev et conseille de fusionner), **Noindex Password Protected Pages** (recommandé), archives de dates (désactivables, redirigent alors vers l'accueil), archives d'auteurs (idem), médias/pièces jointes (nécessite de désactiver « Redirect Attachments »). Aucun marqué PRO dans le texte lu (première moitié de la page seulement). [officiel : kb/titles-and-meta, 100 000 premiers caractères sur 180 404]
- Limites déclarées par Rank Math : la balise robots est une suggestion, les bots malveillants l'ignorent ; une page bloquée par robots.txt peut quand même être indexée si elle reçoit des liens. [officiel]
- Directives Google supplémentaires non exposées dans les pages Rank Math lues : `notranslate`, `unavailable_after`, `indexifembedded`, en-tête `X-Robots-Tag` pour PDF/images. [officiel Google : robots-meta-tag] ; en cas de conflit la règle la plus restrictive s'applique.

## 3. Canonical

- Rank Math émet une balise canonical par défaut sur les contenus ; le champ « Canonical URL » de l'onglet Avancé affiche l'URL du contenu en placeholder ; vide = URL courante du contenu. Surcharge manuelle possible, utile quand la structure de permaliens crée plusieurs URL pour un même contenu. [officiel : kb/advanced-tab]
- WooCommerce : canonical automatique sur produits, catégories, étiquettes, attributs ; surcharge dans Avancé > Canonical URL ; pour les taxonomies il faut activer « Add SEO Controls » dans Titres et Méta. [officiel : kb/woocommerce-duplicate-content-issues]
- Les URL `kb/canonical-urls/` et `kb/advanced-robots-meta/` renvoient 404 ; il n'existe donc pas de page dédiée lue sur la logique canonical (pagination, paramètres, www/https). [observation]
- Règles Google : redirection permanente = signal fort ; `rel=canonical` = signal fort ; sitemap = signal faible ; une seule implémentation (HTML ou en-tête) ; canonical auto-référent sur la page canonique ; URL absolues ; uniquement dans `<head>` ; pas de fragment ; ne pas combiner avec noindex pour choisir une canonique interne ; ne pas utiliser robots.txt ni l'outil de suppression pour canonicaliser ; HTTPS préféré ; liens internes cohérents vers la canonique ; pour le JS, canonique dans le HTML source si possible. [officiel Google : consolidate-duplicate-urls]

## 4. Pagination

- Google : URL unique par page (`?page=n`), liens `<a href>` crawlables, pas de fragments `#`, canonique propre à chaque page (ne pas pointer vers la page 1), `rel=next/prev` n'est plus utilisé par Google ; filtres/tris : noindex ou blocage robots.txt ; load-more/infinite scroll nécessitent des liens crawlables. [officiel Google : pagination-and-incremental-page-loading]
- Rank Math : options Noindex Subpages / Noindex Paginated Single Pages (voir 2). Selon un résumé de recherche (non vérifié sur la page), Rank Math continue d'émettre rel=next/prev et exclut les pages paginées du sitemap ; son blog recommande des canoniques auto-référents alors qu'un ticket de support évoque une canonique vers l'archive principale : **positions contradictoires** [observation, à vérifier ; pages non lues : kb/how-to-noindex-paginated-pages, blog/pagination-seo].

## 5. Contenu dupliqué (e-commerce)

Trois mécanismes documentés pour WooCommerce : canoniques automatiques/surchargeables ; titres et descriptions uniques générés (produits, variations, taxonomies) ; noindex des pages à faible valeur (pagination, recherche, archives catégories/étiquettes/attributs). Les paramètres d'URL, la navigation à facettes et la canonique des variations **ne sont pas traités** par cette page. [officiel]

## 6. Codes HTTP, 404 et redirections (côté technique)

- Google : 301/308 signal fort ; 302/303/307 signal faible ; jusqu'à 10 sauts suivis ; 404 et 410 traités de façon identique (désindexation progressive) ; 429 et 5xx ralentissent le crawl ; page 2xx vide ou « erreur » = soft 404 ; ne pas utiliser 401/403 pour limiter le crawl. [officiel Google : http-network-errors, 301-redirects]
- Détail Rank Math : voir `12-redirects-404.md`.
- Rank Math « Edit .htaccess » (Paramètres généraux) : sauvegarde automatique avant modification, case de confirmation obligatoire. [officiel : kb/general-settings]

## 7. Risques à retenir
1. `Disallow: /` ou règles trop larges (Google ne crawle plus).
2. Bloquer CSS/JS : rendu incompréhensible pour Google.
3. `noindex` + blocage robots.txt : le noindex n'est jamais lu.
4. Fichier robots.txt physique masquant le virtuel (WordPress).
5. Canonique vers la page 1 pour toutes les pages paginées.
6. Canoniques contradictoires (sitemap vs balise vs redirection).
7. Soft 404 (page vide renvoyée en 200).

## 8. Dépendance WordPress et pertinence pour Kolakisa (CMS Node/Express)
| Fonction | Dépend de WP ? | Pertinence Kolakisa |
|---|---|---|
| Éditeur robots.txt virtuel | Oui (implémentation : option + filtre de requête) ; le concept est neutre | Élevée : route `/robots.txt` générée par site (multi-sites), éditable en admin, avec avertissement CSS/JS et testeur |
| Testeur robots (PRO) | Non en principe | Moyenne : implémenter le matching Google (plus long chemin gagne) |
| Robots meta par contenu et globaux | Non (concept) | Élevée |
| Noindex archives vides/recherche/pagination | Partiellement (archives WP) | Élevée : recherche interne, filtres, pages vides |
| Canonical + surcharge | Non (concept) | Élevée, avec règles multi-domaines |
| Date/auteur/pièces jointes | Oui (spécifique WP) | Faible |
| .htaccess | Oui (Apache) | Nulle (Node) ; équivalent = middleware |
[hypothèse pour la colonne pertinence]

## Lacunes
- Pages **404** (inexistantes) : kb/edit-robots-txt/, kb/canonical-urls/, kb/301-redirections/, kb/advanced-robots-meta/ (URL devinées ; les bonnes URL ont été trouvées via recherche).
- Non lues : kb/robots-txt-rules-for-multisite, kb/cant-edit-robots-txt, kb/how-to-noindex-paginated-pages, blog/pagination-seo, kb/configure-sitemaps, kb/advanced-mode ; RFC 9309 non consultée directement ; seconde moitié (80 404 caractères) de kb/titles-and-meta non lue.
- Algorithmes non documentés : génération de la canonique (paramètres, www/https, trailing slash) ; critères exacts de « Noindex Empty » ; comportement des canoniques de pagination.
- Fichiers `X-Robots-Tag` : aucune fonction Rank Math documentée dans les pages lues.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/ - officiel
- https://rankmath.com/kb/fix-common-robots-txt-issues/ - officiel
- https://rankmath.com/kb/advanced-tab/ - officiel
- https://rankmath.com/kb/titles-and-meta/ - officiel (partiel)
- https://rankmath.com/kb/general-settings/ - officiel (partiel)
- https://rankmath.com/kb/woocommerce-duplicate-content-issues/ - officiel
- https://rankmath.com/kb/ (index) - officiel ; résultats de recherche rankmath.com (robots, pagination) - observation
- https://developers.google.com/search/docs/crawling-indexing/robots/intro - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/block-indexing - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/http-network-errors - officiel Google
- https://developers.google.com/search/docs/crawling-indexing/301-redirects - officiel Google
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading - officiel Google
