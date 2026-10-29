# 11 - Métadonnées sociales (Open Graph, cartes X/Twitter) selon Rank Math

Date de consultation : 2026-10-29. Mentions : **[officiel]**, **[observation]**, **[hypothèse]**. Niveaux Gratuit/PRO/Service externe seulement quand la source le dit.

## 1. Balises émises par Rank Math [officiel : kb/open-graph-meta-tags]
| Famille | Balises |
|---|---|
| Essentielles | `og:title`, `og:type`, `og:url`, `og:image`, `og:description` |
| Image | `og:image:secure_url`, `:width`, `:height`, `:alt`, `:type` |
| Site | `og:locale`, `og:site_name` |
| Vidéo | `og:video`, `og:video:duration` (ajoutées automatiquement si la page intègre une vidéo ; exige « Autodetect Video » activé sur le type de contenu et le module Schema) |
| Article | `article:publisher`, `article:author`, `article:section`, `article:tag`, `article:published_time`, `article:modified_time`, `og:updated_time` (dates seulement si schéma Article utilisé) |
| X/Twitter | `twitter:title`, `:description`, `:image`, `:site`, `:creator` ; ensembles App Card et Player Card (`twitter:player`, `twitter:player:stream`...) |
| Yandex vidéo | `ya:ovs:adult`, `ya:ovs:upload_date`, `ya:ovs:allow_embed` - **PRO** |
| Produit (WooCommerce) | `product:price:amount`, `product:price:currency`, `product:availability`, `product:brand`, `product:retailer_item_id` (**PRO**, depuis le SKU, seulement si « gérer le stock » est actif) |
Niveau des autres balises : non précisé. Rank Math « Slack Enhanced Sharing » ajoute prix/disponibilité (produits) ou temps de lecture/auteur dans les aperçus Slack (par défaut activé pour téléchargements/produits). [officiel : kb/titles-and-meta, partie lue]

## 2. Où se règle chaque valeur [officiel : open-graph-meta-tags, how-to-add-twitter-cards, recherche rankmath.com pour la liste Facebook]
- **Par contenu** : onglet Social de la meta box (sous-onglets Facebook et Twitter). Pour Twitter : décocher « Use Data from Facebook Tab » afin de personnaliser ; type de carte, image, titre et description (par défaut titre SEO et meta description ; bouton « Generate with AI »).
- **Global** (Titres et Méta > Global Meta) : **OpenGraph Thumbnail** (image par défaut, 1200x630), **Twitter Card Type** par défaut (Summary / Summary with Large Image), filigranes. Social Meta : URL de page Facebook, Facebook Authorship, ID admin et ID d'appli Facebook (avec clé secrète Rank Math peut notifier Facebook d'une mise à jour, selon synthèse de recherche, observation), nom d'utilisateur Twitter du site, profils additionnels (`sameAs`).
- **Accueil** : si le site affiche les derniers articles, champs « for Facebook » (titre, description, vignette), repris par Twitter ; si page statique, meta box de cette page.
- **Utilisateurs > Profil** : compte Twitter et profil Facebook de l'auteur ; sans compte Twitter d'auteur, le compte du site sert pour `twitter:creator`.
- `og:locale` = langue du site WordPress ; `og:site_name` = nom du site (réglage Local SEO) ou titre du site.
- Section d'article = catégorie principale, sinon « Uncategorized ».

## 3. Hiérarchie de l'image [officiel]
1. image OpenGraph du contenu ; 2. image mise en avant ; 3. première image du contenu ; 4. vignette OG par défaut (un filtre permet d'inverser 3 et 4). Pour Twitter : image Twitter, puis featured image, puis défaut global. Taille recommandée 1200x630 ; images trop petites/grandes pouvant être ignorées ; logos génériques déconseillés pour Twitter. Formats : JPEG, PNG, GIF (Facebook) ; Rank Math dit aussi gérer WebP et AVIF.

## 4. Fonctions PRO ou externes explicites
- **Filigranes / icônes superposées** (Play, GIF, filigranes personnalisés avec position, remplaçables par contenu, distincts pour Twitter) : PRO. Formats, taille, nombre maximal : non documentés. [officiel : kb/watermark-for-social-sharing]
- **Autogenerate Image** (vignette depuis vidéo) : PRO.
- **Outil Open Graph de Content AI** : génération de titres/descriptions sociales (sujet, brief, public, mot-clé, ton, langue, 1 à 5 variantes) ; limites d'usage selon un plan « Rank Math AI » ; service externe (IA) ; détail des paliers non documenté sur la page. [officiel : kb/content-ai-open-graph-tool]
- Aperçus sociaux (Social Previews) mentionnés dans la liste free-vs-pro, cases illisibles. [observation]

## 5. Règles des plateformes
- **Protocole Open Graph (ogp.me)** : requis `og:title`, `og:type`, `og:image`, `og:url` ; optionnels `og:description`, `og:site_name`, `og:locale` (+ alternate), `og:audio`, `og:video`, `og:determiner` ; propriétés d'image `url`, `secure_url`, `type`, `width`, `height`, `alt` (description du contenu, pas une légende) ; types article, book, profile, website, music.*, video.* ; **pas de type « product »** dans la spécification (les `product:*` sont une extension). [officiel ogp.me]
- **Facebook** : `og:url` (canonique), `og:title`, `og:description`, `og:image`, `fb:app_id` (Insights) ; `og:type` défaut website, `og:locale` défaut en_US ; dimensions d'image non fixées par la page (renvoi aux bonnes pratiques) ; indiquer largeur/hauteur pour un affichage correct au premier partage ; JPEG, GIF, PNG ; robot `facebookexternalhit/1.1` ; serveur compatible gzip/deflate ; images mises en cache par URL (changer l'URL pour mettre à jour) ; Sharing Debugger pour forcer un nouveau scraping. [officiel Facebook for Developers]
- **X/Twitter** : Rank Math décrit 4 types (Summary, Summary with Large Image, App, Player) ; la documentation X n'a pas pu être lue (402 puis 404), donc les contraintes d'images et le repli sur Open Graph de X ne sont pas confirmés ici ; Rank Math affirme que Twitter s'appuie sur les données OpenGraph. [officiel Rank Math ; X : lacune]
- **Google** : `og:image` et schema.org informent les vignettes (changelog 2 mars 2026) ; `og:image` est un des signaux d'image préférée. [officiel Google]

## 6. Dépendance WordPress / pertinence Kolakisa
| Fonction | WP ? | Pertinence |
|---|---|---|
| Balises og:/twitter: avec repli d'image en cascade | Non (concept) ; sources de données WP | Très élevée : gabarit `<head>` unique + surcharge par entité |
| Champs Social par contenu (titre/description/image) | UI WP | Élevée |
| Image par défaut 1200x630 par site | Non | Très élevée (multi-sites) |
| `article:*` | Non | Moyenne (blog) |
| `product:*` | Woo | Moyenne (prix/dispo de formations) |
| `og:locale`, `og:site_name`, `fb:app_id` | Non | Moyenne |
| Filigrane/icônes (PRO) | Non | Faible |
| Génération IA (externe) | Service externe | Faible/moyenne |
| Notification Facebook à la mise à jour | Observation | Faible : prévoir plutôt lien vers Sharing Debugger |
[colonne pertinence : hypothèse]

## Lacunes
- Docs X (developer.x.com, docs.x.com) inaccessibles : tailles d'image, tags requis, validateur non vérifiés.
- Niveaux Free/PRO des balises OG/Twitter non précisés (hors Yandex, retailer_item_id, filigranes, Autogenerate Image).
- Non lues : kb/social-meta (page dédiée si elle existe), première partie de kb/titles-and-meta (Social Meta, trouvée via synthèse de recherche seulement) ; Pinterest/LinkedIn : aucune documentation Rank Math lue.
- Page open-graph-meta-tags sans dates de dernière mise à jour.

## Sources (consultées le 2026-10-29)
- https://rankmath.com/kb/open-graph-meta-tags/ ; /kb/how-to-add-twitter-cards/ ; /kb/watermark-for-social-sharing/ ; /kb/content-ai-open-graph-tool/ ; /docs/filters-and-hooks/frontend/open-graph/ ; /kb/titles-and-meta/ (partie lue) - officiel
- Recherche rankmath.com (Social Meta) - observation
- https://ogp.me/ - officiel
- https://developers.facebook.com/docs/sharing/webmasters/ - officiel
- https://developers.google.com/search/updates - officiel Google
- https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards (HTTP 402), https://docs.x.com/x-for-websites/cards/overview/summary-card-with-large-image (404) - inaccessibles
