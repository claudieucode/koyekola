# KOLAKISA — Paramètres → Médias

Référence : « Réglages des médias » de WordPress (capture fournie). Ce document décrit l'état **réel** de Kolakisa.

## 1. Référence WordPress et correspondance

| WordPress | Kolakisa |
|---|---|
| Taille des miniatures (largeur, hauteur) + « Recadrer aux dimensions exactes » | Idem, par site. Recadrage centré (`fit: cover`), jamais de déformation ; sans recadrage, la boîte largeur × hauteur borne l'image |
| Taille moyenne (largeur et hauteur maximales) | Idem : limites maximales, proportions conservées |
| Grande taille (largeur et hauteur maximales) | Idem |
| Organiser les téléversements en dossiers mensuels et annuels | Idem : `…/<org>[/site-<id>]/<aaaa>/<mm>/<fichier>` pour les NOUVEAUX envois (date du serveur, UTC) |
| Valeurs par défaut 150×150 (recadrée) / 300×300 / 1024×1024 | **Valeurs d'origine de Kolakisa** : miniature 150 de large, moyenne 640, grande 1024, hauteur libre (0), dossier unique. Choisies pour que **aucune page publiée ne change** tant que rien n'est réglé. Les valeurs de WordPress se saisissent en quelques secondes |

Hauteur **0** = pas de limite de hauteur (comportement d'origine : la largeur seule borne l'image), comme dans WordPress.

## 2. Moteur (un seul)

- `src/marketing/media/variants.js` : fabrication à la demande par `sharp` (WebP, qualité 80), conservation sur disque, jamais l'original modifié. Déjà en place ; étendu, pas remplacé.
- `src/services/mediaSettings.js` : lit les dimensions d'un site et les valide ; ne traite aucune image.
- Tailles nommées `thumbnail`, `medium`, `large` : dimensions du **site propriétaire de l'image** (dossier `site-<id>`, sinon le principal). Les autres largeurs historiques (320, 768, 1536, 1600, 2048) restent.
- Adresse d'une version : `…/v/<largeur>/<nom>.webp` tant que le réglage est celui d'origine (rien ne change), puis `…/v/<largeur>x<hauteur>[c]/<nom>.webp` (`c` = recadrée) dès qu'il change.
- **Liste blanche** : une version n'est fabriquée que si ses dimensions sont (ou ont été) réglées pour CE site : jamais de fabrication illimitée, jamais les dimensions d'un autre site. Les anciennes dimensions restent servies (pages déjà publiées).
- **Jamais d'agrandissement** : image déjà contenue dans la boîte, ou plus petite que le recadrage exact → l'original est servi (redirection).
- Sécurité : limite de pixels (80 millions : protection contre les « bombes de décompression »), type réel relu dans le contenu à l'envoi, fichier temporaire supprimé en cas d'échec, repli sur l'original si la fabrication échoue ; SVG non accepté par la médiathèque (donc jamais traité en raster).
- Variantes : une version est fabriquée à la première demande puis conservée. **Aucune régénération en bloc n'est nécessaire** : de nouvelles dimensions = de nouvelles adresses, fabriquées à la demande ; les anciennes versions restent valides et sont supprimées avec l'image (`purge`).

## 3. Utilisation dans le CMS

Médiathèque, éditeur de pages (widgets Image, Galerie, Boîte d'image, arrière-plans), listes et templates passent par `variants.sourceFor / imageSource / offered`. Le sélecteur de taille de l'éditeur affiche les **dimensions réelles du site** (ex. « Miniature (150 × 150 px, recadrée) ») et ne propose que les tailles plus petites que l'original ; « Taille originale » pointe toujours vers le fichier source.

## 4. Stockage

Les adresses acceptent désormais `…/<org>[/site-<id>][/<aaaa>/<mm>]/<fichier>` partout (médiathèque, audit des médias, éditeur d'articles, Page Builder, SEO, import/export du site, outils) ; la référence en base reste le chemin enregistré (stable). Changer l'option **ne déplace jamais** d'ancien fichier. Le stockage reste le disque local (aucun stockage objet n'existe dans Kolakisa).

## 5. Multi-sites

Dimensions et organisation propres à chaque site (`mediasize.<main|site_N>.*` dans `mk_settings`) ; un nouveau site démarre avec les valeurs d'origine ; modifier le site A ne touche ni B ni le principal. Les limites de poids (Mo) sont communes à la plateforme : modifiables par l'équipe depuis le site principal, en lecture seule dans un site. Permissions : lecture `settings.read`, écriture `settings.write` ; le site vient de la barrière d'accès, jamais d'un identifiant envoyé par le navigateur.

## 6. Limites

- Pas de stockage objet ni de traitement asynchrone : la fabrication est faite à la première demande (un seul traitement à la fois par fichier).
- `sharp` est une dépendance facultative : sans lui, aucune version n'est fabriquée et l'original est servi (signalé sur l'écran).
- Pas d'outil de régénération en bloc (inutile avec ce modèle ; à ajouter seulement si des versions précalculées devenaient nécessaires).
- Les GIF animés sont servis tels quels (pas de version réduite).
