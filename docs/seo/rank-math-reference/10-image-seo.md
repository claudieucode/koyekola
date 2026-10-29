# 10 - SEO des images (module Image SEO de Rank Math et règles Google)

Date de consultation : 2026-10-29. Mentions : **[officiel]**, **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO seulement quand la source le dit.

## 1. Module Image SEO de Rank Math
Activation : Tableau de bord > Modules > Image SEO ; réglages dans Paramètres généraux > Images. [officiel : kb/image-seo, kb/set-alt-and-title-attributes-for-images]

### 1.1 Options gratuites [officiel : kb/image-seo]
| Option | Comportement |
|---|---|
| Add Missing ALT Attributes | ajoute un alt aux images **sans** alt ; uniquement images du contenu des articles/pages (pas en-têtes, barres latérales, pieds de page) |
| Image Alt Attribute Format | modèle, défaut `%filename%` ; variables + texte libre |
| Add Missing Title Attributes | idem pour `title` ; modèle par défaut « titre + compteur » (`%title% %count(title)%`, d'après kb/general-settings) |
| Title Attribute Format | modèle |

### 1.2 Options PRO (explicitement marquées) [officiel]
- Légende et description manquantes avec leurs modèles ; modification de la casse (titre, alt, description, légende) : aucune, Title Case, Sentence case, minuscules, majuscules ; alt pour les avatars (nom d'utilisateur) ; **remplacements** (chercher/remplacer sur les métadonnées, variables acceptées dans le remplacement) ; variables `%imagealt%`, `%imagetitle%`, `%randomword(...)%`.
- Variable gratuite spécifique : `%filename%`. Plus de 50 variables générales (`%title%`, `%sitetitle%`, `%category%`, `%date%`, `%focus_kw%`, `%count(var)%`...).
- Autres éléments PRO vus dans Titres et Méta : filigranes personnalisés / filigrane par défaut des vignettes (Play, GIF), « Autogenerate Image » (vignette issue d'une vidéo détectée pour le schéma Video et le sitemap vidéo, dépend de « Autodetect Video » PRO). [officiel : kb/titles-and-meta, partie lue]

### 1.3 Mécanisme et limites
- Application **dynamique à l'affichage** : la médiathèque n'est pas modifiée, les remplacements ne fonctionnent que tant que les règles restent dans les réglages. Avantage cité : économie de ressources, changement global sans retraiter les images. [officiel]
- La page ne dit pas si un alt existant est écrasé (« missing » suggère que non), ni les contenus/types couverts au-delà des articles/pages, ni la rétroactivité. Rank Math reconnaît que l'alt saisi à la main est plus précis. [officiel : lacunes explicites]
- Rank Math vérifie aussi la présence du mot-clé principal dans l'alt (test d'analyse de contenu) et conseille un alt sur chaque image. [officiel : blog/woocommerce-seo ; kb/how-to-show-images-in-search-results]
- Redirection des pièces jointes : « Redirect Attachments » (vers le contenu parent) et « Redirect Orphan Attachments » ; pour activer les robots meta de médias, la première doit être désactivée. [officiel : general-settings, titles-and-meta]
- Option PRO de liens externes d'image en nofollow (liste free-vs-pro, cases illisibles). [observation]
- Schéma d'image (ImageObject, métadonnées de licence) : **non documenté** dans les pages Rank Math lues. [officiel : absence ; confirmé par la page how-to-show-images-in-search-results]

## 2. Sitemap d'images [officiel : kb/configure-sitemaps]
- « Include images » : activé par défaut, recommandé ; « Include featured images » recommandé ; champs personnalisés contenant des URL d'images pour articles, pages, forums, sujets, réponses, produits (un nom par ligne) ; images des champs ACF : **PRO** (module ACF requis).
- Liens par sitemap : 200 recommandé (limite Google : 50 000 URL). Pas de limite spécifique aux images décrite.
- Exclusions : articles, termes, pièce jointe via la médiathèque (« Exclude Attachment »), rôles/utilisateurs. Sitemap des pièces jointes désactivé par défaut tant que « Redirect Attachment to Parent » est actif (pages de pièces jointes = contenu mince).
- WooCommerce : images de galerie dans le sitemap et dans `og:image`. [officiel : woocommerce-seo-feature-comparison, niveau non confirmé]

## 3. Règles Google [officiel Google]
- **Bonnes pratiques** (google-images) : `<img src>` (pas d'images en arrière-plan CSS), `<picture>`/`srcset` avec `src` de repli, formats BMP, GIF, JPEG, PNG, WebP, SVG, AVIF (extension cohérente) ; noms de fichiers descriptifs ; alt utile et contextuel sans bourrage ; images proches d'un texte pertinent ; même URL d'image réutilisée entre pages ; image préférée signalée via `primaryImageOfPage`, `mainEntity(OfPage)` ou `og:image` (mars 2026 : schema.org et `og:image` informent les vignettes) ; éviter logos et images avec texte ; performance (PageSpeed) ; ne pas bloquer en robots.txt. Désactiver l'affichage plein format : répondre 200/204 aux référents Google (la vignette reste).
- **Sitemap d'images** : espace de noms `sitemap-image/1.1` ; seul `<image:loc>` utile ; max 1 000 images par `<url>` ; `caption`, `geo_location`, `title`, `license` retirés ; domaine CDN à vérifier dans Search Console.
- **Métadonnées d'image (badge « Licensable »)** : `contentUrl` requis + au moins l'un de `creator`, `creditText`, `copyrightNotice`, `license` ; `license` obligatoire pour le badge ; `acquireLicensePage` recommandé ; le balisage prime sur l'IPTC en cas de conflit ; à répéter sur chaque page affichant l'image ; affichage non garanti.
- **Schémas dont `image` est requis** : Product marchand (`image`) ; Article recommande ≥50 000 px et les ratios 16:9, 4:3, 1:1 ; logo Organization ≥112x112 px.

## 4. Dépendance WordPress / pertinence Kolakisa
| Fonction | WP ? | Pertinence |
|---|---|---|
| alt/title par modèle appliqués au rendu | Hook WP sur le contenu | Élevée : filtre au rendu HTML ou à l'enregistrement ; préférer champ alt éditable par média |
| Légende/description auto, casse, remplacements (PRO) | Idem | Faible/moyenne |
| Alt des avatars | WP | Faible |
| Sitemap images (page + vignette + galerie) | Non (concept) | Élevée : `image:loc` dans le sitemap des formations/produits |
| Redirection des pièces jointes | WP (pages de pièces jointes) | Nulle ; vérifier que les URL média n'ont pas de page HTML |
| og:image par défaut, filigrane | Non | Moyenne (voir 11) |
| Métadonnées licence/IPTC | Non | Faible, utile si photos propres |
[colonne pertinence : hypothèse]
Écart à combler en priorité (hypothèse) : alt obligatoire/suggéré à l'upload, noms de fichiers propres, `srcset`, WebP/AVIF, dimensions explicites, image principale par page.

## Lacunes
- Aucune page Rank Math lue sur ImageObject, licence, ou compression/optimisation (page install-imagify-plugin existe, non lue ; intégration externe).
- Cases PRO non lisibles pour « nofollow images externes ».
- Non lues : kb/variables-in-seo-title-description, tickets de support image/cache.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/image-seo/ ; /kb/set-alt-and-title-attributes-for-images/ ; /kb/how-to-show-images-in-search-results/ ; /kb/configure-sitemaps/ ; /kb/general-settings/ ; /kb/titles-and-meta/ (partie lue) ; /blog/woocommerce-seo/ - officiel
- Recherche rankmath.com (Image SEO) - observation
- https://developers.google.com/search/docs/appearance/google-images ; /crawling-indexing/sitemaps/image-sitemaps ; /structured-data/image-license-metadata - officiel Google
