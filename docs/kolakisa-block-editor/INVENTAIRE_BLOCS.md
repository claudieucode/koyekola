# Inventaire des blocs natifs du cœur WordPress (Gutenberg)

- **Date de vérification** : 2026-10-27
- **WordPress stable de référence** : 7.1.3 (API `https://api.wordpress.org/core/version-check/1.7/`)
- **Plugin Gutenberg** : dernière release publique v24.2.0 (14 oct. 2026). Les `block.json` ont été lus sur la branche `wp/7.1` du dépôt (commit `296a4076f89d`, 27 oct. 2026), qui correspond à la version de Gutenberg embarquée dans WP 7.1.x. **Écart possible** avec le tag exact livré en 7.1.3 (voir « Points non vérifiés »).
- **Nombre de blocs recensés** : **120** fichiers `block.json` présents dans `packages/block-library/src/*/block.json` (dont blocs enfants/internes comme `core/column`, `core/list-item`, `core/missing`, `core/freeform`).
- **Source primaire** : https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/ ; chaque section de catégorie cite l'URL du dossier ; chaque bloc cite son `block.json` brut (https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/`<dossier>`/block.json).
- Doc officielle de la liste : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/

## Légende et méthode

- Les champs identifiant, titre, catégorie, description, attributs, supports, `parent`/`ancestor`/`allowedBlocks`, `styles`, `usesContext`/`providesContext` sont **extraits tels quels du block.json**.
- Les **variations** et **transformations** ne sont pas dans block.json : elles viennent des fichiers `variations.js` / `transforms.js` / `index.js` de chaque dossier, extraits **par expression régulière (heuristique)** : la liste peut être incomplète (variations générées dynamiquement, noms en gabarit `...`). Un tiret « — » signifie : aucun fichier correspondant détecté.
- **Rendu** : déduit de `index.php` (présence de `render_callback`) et de `save.js` (heuristique : `save` court ne renvoyant que `InnerBlocks.Content` ou `null` = dynamique). « Hybride » = markup sauvegardé en base mais retouché côté PHP au rendu (ex. `core/image`, `core/heading`, `core/paragraph`, `core/button`). 
- **Mention « dépendant du thème/CMS »** : bloc dont le rendu requiert le contexte de publication WordPress (boucle, article courant, commentaires, menus, réglages du site, template parts) ou le thème (styles, `theme.json`, templates). Hors éditeur de site ou hors thème bloc, ces blocs n'ont pas de sens ou sont indisponibles.
- Supports : `~~clé~~` = explicitement désactivé (`false`). Les sous-options `__experimental*` de contrôles par défaut sont omises. Détail des supports : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- Attributs : `nom:type` (liste complète des clés ; sources/sélecteurs à lire dans le block.json). Les attributs de style (`style`, `backgroundColor`, `fontSize`, etc.) ajoutés automatiquement par les supports ne figurent que s'ils sont déclarés.



---

## Catégorie `text` : Texte (15 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/code` : Code

- **Description** : Display code snippets that respect your spacing and tabs.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/code/block.json
- **Attributs** : `content`:rich-text
- **Supports** : align=["wide"]; anchor; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); spacing(margin, padding); __experimentalBorder(radius, color, width, style); color(text, background, gradients); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : depuis `core/html`, `core/paragraph` ; vers `core/paragraph` ; autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/details` : Details

- **Description** : Hide and show additional content.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/details/block.json
- **Mots-clés** : summary, toggle, disclosure
- **Attributs** : `showContent`:boolean, `summary`:rich-text, `name`:string, `placeholder`:string
- **Supports** : __experimentalOnEnter; align=["wide", "full"]; anchor; color(gradients, link); __experimentalBorder(color, width, style); ~~html~~; spacing(margin, padding, blockGap); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); layout(allowEditing); interactivity(clientNavigation); allowedBlocks
- **Variations** : core/paragraph
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content).

### `core/footnotes` : Footnotes

- **Description** : Display footnotes added to the page.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/footnotes/block.json
- **Mots-clés** : references
- **Attributs** : —
- **Supports** : anchor; __experimentalBorder(radius, color, width, style); color(background, link, text); ~~html~~; ~~multiple~~; ~~reusable~~; ~~inserter~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalTextDecoration, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalWritingMode); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/freeform` : Classic

- **Description** : Use the classic WordPress editor.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/freeform/block.json
- **Attributs** : `content`:string
- **Supports** : ~~className~~; ~~customClassName~~; ~~lock~~; ~~reusable~~; ~~renaming~~; ~~visibility~~; ~~customCSS~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/heading` : Heading

- **Description** : Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/heading/block.json
- **Mots-clés** : title, subtitle
- **Attributs** : `content`:rich-text, `level`:number, `levelOptions`:array, `placeholder`:string
- **Supports** : align=["wide", "full"]; anchor; className; splitting; __experimentalBorder(color, radius, style, width); color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalTextDecoration, __experimentalWritingMode, fitText); __unstablePasteTextInline; __experimentalSlashInserter; interactivity(clientNavigation)
- **Variations** : `h${ level }`, h${ level }
- **Transformations** : depuis `core/paragraph` ; vers `core/paragraph` ; autres : collage/HTML brut, préfixe de saisie, saisie + Entrée
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/list` : List

- **Description** : An organized collection of items displayed in a specific order.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/list/block.json
- **Mots-clés** : bullet list, ordered list, numbered list
- **Attributs** : `ordered`:boolean, `values`:string, `type`:string, `start`:number, `reversed`:boolean, `placeholder`:string
- **Supports** : anchor; ~~html~~; __experimentalBorder(color, radius, style, width); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); color(gradients, link); spacing(margin, padding); __unstablePasteTextInline; __experimentalOnMerge; __experimentalSlashInserter; interactivity(clientNavigation); listView
- **Variations** : core/list-item
- **Transformations** : depuis `core/heading`, `core/list-item`, `core/paragraph` ; vers `core/heading`, `core/paragraph` ; autres : collage/HTML brut, préfixe de saisie
- **Imbrication** : Blocs imbriqués autorisés : `core/list-item`
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content).

### `core/list-item` : List Item

- **Description** : An individual item within a list.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/list-item/block.json
- **Attributs** : `placeholder`:string, `content`:rich-text
- **Supports** : anchor; ~~html~~; ~~className~~; splitting; __experimentalBorder(color, radius, style, width); color(gradients, link, background); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : vers `core/paragraph`
- **Imbrication** : Parent obligatoire : `core/list` ; Blocs imbriqués autorisés : `core/list`
- **Rendu** : Statique (save JS).

### `core/math` : Math

- **Description** : Display mathematical notation using LaTeX.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/math/block.json
- **Mots-clés** : equation, formula, latex, mathematics
- **Attributs** : `latex`:string, `mathML`:string
- **Supports** : anchor; ~~html~~; __experimentalBorder(color, radius, style, width); color(gradients); spacing(margin, padding); typography(fontSize)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/missing` : Unsupported

- **Description** : Your site doesn’t include support for this block.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/missing/block.json
- **Attributs** : `originalName`:string, `originalUndelimitedContent`:string, `originalContent`:string
- **Supports** : ~~className~~; ~~customClassName~~; ~~inserter~~; ~~html~~; ~~lock~~; ~~reusable~~; ~~renaming~~; ~~visibility~~; interactivity(clientNavigation); ~~customCSS~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/paragraph` : Paragraph

- **Description** : Start with the basic building block of all narrative.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/paragraph/block.json
- **Mots-clés** : text
- **Attributs** : `content`:rich-text, `dropCap`:boolean, `placeholder`:string, `direction`:string
- **Supports** : align=["wide", "full"]; splitting; anchor; ~~className~~; __experimentalBorder(color, radius, style, width); color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, textColumns, textIndent, __experimentalFontFamily, __experimentalTextDecoration, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalWritingMode, fitText); __unstablePasteTextInline; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/preformatted` : Preformatted

- **Description** : Add text that respects your spacing and tabs, and also allows styling.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/preformatted/block.json
- **Attributs** : `content`:rich-text
- **Supports** : anchor; color(gradients); spacing(padding, margin); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : depuis `core/code`, `core/paragraph`, `core/verse` ; vers `core/code`, `core/paragraph`, `core/verse` ; autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/pullquote` : Pullquote

- **Description** : Give special visual emphasis to a quote from your text.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/pullquote/block.json
- **Attributs** : `value`:rich-text, `citation`:rich-text
- **Supports** : anchor; align=["left", "right", "wide", "full"]; background(backgroundImage, backgroundSize, gradient); color(gradients, background, link); dimensions(minHeight); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(color, radius, style, width); __experimentalStyle(typography); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : depuis `core/heading`, `core/paragraph` ; vers `core/heading`, `core/paragraph`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/quote` : Quote

- **Description** : Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/quote/block.json
- **Mots-clés** : blockquote, cite
- **Attributs** : `value`:string, `citation`:rich-text, `textAlign`:string
- **Supports** : anchor; align=["left", "right", "wide", "full"]; ~~html~~; background(backgroundImage, backgroundSize, gradient); __experimentalBorder(color, radius, style, width); dimensions(minHeight); __experimentalOnEnter; __experimentalOnMerge; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); color(gradients, heading, link); layout(allowEditing); spacing(blockGap, padding, margin); interactivity(clientNavigation); allowedBlocks
- **Styles de bloc** : default (défaut), plain
- **Variations** : core/paragraph
- **Transformations** : depuis `core/heading`, `core/list`, `core/paragraph`, `core/pullquote`, `core/verse` ; vers `core/group`, `core/paragraph`, `core/pullquote`, `core/verse` ; autres : collage/HTML brut, préfixe de saisie
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/table` : Table

- **Description** : Create structured content in rows and columns to display information.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/table/block.json
- **Attributs** : `hasFixedLayout`:boolean, `caption`:rich-text, `head`:array, `body`:array, `foot`:array
- **Supports** : anchor; align; color(gradients); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalTextDecoration); __experimentalBorder(color, style, width); interactivity(clientNavigation)
- **Styles de bloc** : regular (défaut), stripes
- **Variations** : —
- **Transformations** : autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/verse` : Poetry

- **Description** : Insert poetry. Use special spacing formats. Or quote song lyrics.
- **Catégorie** : `text` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/verse/block.json
- **Mots-clés** : poetry, poem, verse, stanza, song, lyrics
- **Attributs** : `content`:rich-text
- **Supports** : anchor; background(backgroundImage, backgroundSize, gradient); color(gradients, link); dimensions(minHeight); typography(fontSize, __experimentalFontFamily, lineHeight, textAlign, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalTextDecoration, __experimentalWritingMode); spacing(margin, padding); __experimentalBorder(radius, width, color, style); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : depuis `core/paragraph` ; vers `core/paragraph`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

---

## Catégorie `media` : Médias (10 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/audio` : Audio

- **Description** : Embed a simple audio player.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/audio/block.json
- **Mots-clés** : music, sound, podcast, recording
- **Attributs** : `blob`:string, `src`:string, `caption`:rich-text, `id`:number, `autoplay`:boolean, `loop`:boolean, `preload`:string
- **Supports** : anchor; align; spacing(margin, padding); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : autres : dépôt de fichiers
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/cover` : Cover

- **Description** : Add an image or video with a text overlay.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/cover/block.json
- **Attributs** : `url`:string, `useFeaturedImage`:boolean, `id`:number, `alt`:string, `hasParallax`:boolean, `isRepeated`:boolean, `dimRatio`:number, `overlayColor`:string, `customOverlayColor`:string, `isUserOverlayColor`:boolean, `backgroundType`:string, `focalPoint`:object, `minHeight`:number, `minHeightUnit`:string, `gradient`:string, `customGradient`:string, `contentPosition`:string, `isDark`:boolean, `templateLock`:string/boolean, `tagName`:string, `sizeSlug`:string, `poster`:string, `allowedVideoProviders`:array
- **Supports** : anchor; align; ~~html~~; shadow; spacing(padding, margin, blockGap); __experimentalBorder(color, radius, style, width); color(heading, text, background, enableContrastChecker); dimensions(aspectRatio); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); layout(allowJustification); interactivity(clientNavigation); filter(duotone); allowedBlocks
- **Variations** : core/paragraph, cover
- **Transformations** : depuis `core/group`, `core/image`, `core/paragraph`, `core/video` ; vers `core/group`, `core/image`, `core/video`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/file` : File

- **Description** : Add a link to a downloadable file.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/file/block.json
- **Mots-clés** : document, pdf, download
- **Attributs** : `id`:number, `blob`:string, `href`:string, `fileId`:string, `fileName`:rich-text, `textLinkHref`:string, `textLinkTarget`:string, `showDownloadButton`:boolean, `downloadButtonText`:rich-text, `displayPreview`:boolean, `previewHeight`:number
- **Supports** : anchor; align; spacing(margin, padding); color(gradients, link, text); __experimentalBorder(radius, color, width, style); interactivity
- **Variations** : default
- **Transformations** : depuis `core/audio`, `core/image`, `core/video` ; vers `core/audio`, `core/image`, `core/video` ; autres : dépôt de fichiers
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/gallery` : Gallery

- **Description** : Display multiple images in a rich gallery.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/gallery/block.json
- **Mots-clés** : images, photos
- **Attributs** : `images`:array, `ids`:array, `dynamicContent`:object, `navigationButtonType`:string, `shortCodeTransforms`:array, `columns`:number, `caption`:rich-text, `imageCrop`:boolean, `randomOrder`:boolean, `fixedHeight`:boolean, `linkTarget`:string, `linkTo`:string, `sizeSlug`:string, `allowResize`:boolean, `aspectRatio`:string
- **Supports** : anchor; align; __experimentalBorder(radius, color, width, style); ~~html~~; units=["px", "em", "rem", "vh", "vw"]; spacing(margin, padding, blockGap); color(text, background, gradients); layout(allowSwitching, allowInheriting, allowEditing, default); interactivity(clientNavigation); listView
- **Variations** : core/image, dynamic-gallery
- **Transformations** : depuis `core/image` ; vers `core/group`, `core/image` ; autres : dépôt de fichiers
- **Imbrication** : Blocs imbriqués autorisés : `core/image`
- **Contexte** : utilise ['galleryId', 'postId', 'postType'] ; fournit ['allowResize', 'imageCrop', 'fixedHeight', 'navigationButtonType']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/icon` : Icon

- **Description** : Insert an SVG icon.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/icon/block.json
- **Mots-clés** : icon, svg
- **Attributs** : `icon`:string, `flipHorizontal`:boolean, `flipVertical`:boolean, `rotation`:number
- **Supports** : anchor; ariaLabel; align=["left", "center", "right"]; ~~html~~; color; interactivity(clientNavigation); __experimentalBorder(color, radius, style, width); spacing(padding, margin); dimensions(width)
- **Variations** : default
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/image` : Image

- **Description** : Insert an image to make a visual statement.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/image/block.json
- **Mots-clés** : img, photo, picture
- **Attributs** : `blob`:string, `url`:string, `alt`:string, `caption`:rich-text, `lightbox`:object, `title`:string, `href`:string, `rel`:string, `linkClass`:string, `id`:number, `width`:string, `height`:string, `aspectRatio`:string, `scale`:string, `focalPoint`:object, `sizeSlug`:string, `linkDestination`:string, `linkTarget`:string, `isDecorative`:boolean
- **Supports** : interactivity; align=["left", "center", "right", "wide", "full"]; anchor; color(text, background); filter(duotone); spacing(margin); __experimentalBorder(color, radius, width); shadow
- **Styles de bloc** : default (défaut), rounded
- **Variations** : —
- **Transformations** : vers `core/video` ; autres : collage/HTML brut, dépôt de fichiers
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['allowResize', 'imageCrop', 'fixedHeight', 'navigationButtonType', 'postId', 'postType', 'queryId', 'galleryId'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/media-text` : Media & Text

- **Description** : Set media and words side-by-side for a richer layout.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/media-text/block.json
- **Mots-clés** : image, video
- **Attributs** : `align`:string, `mediaAlt`:string, `mediaPosition`:string, `mediaId`:number, `mediaUrl`:string, `mediaLink`:string, `linkDestination`:string, `linkTarget`:string, `href`:string, `rel`:string, `linkClass`:string, `mediaType`:string, `mediaWidth`:number, `mediaSizeSlug`:string, `isStackedOnMobile`:boolean, `verticalAlignment`:string, `imageFill`:boolean, `focalPoint`:object, `useFeaturedImage`:boolean
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; __experimentalBorder(color, radius, style, width); color(gradients, heading, link); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); allowedBlocks
- **Variations** : core/paragraph
- **Transformations** : depuis `core/cover`, `core/image`, `core/video` ; vers `core/cover`, `core/image`, `core/video`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/playlist` : Playlist

- **Description** : Embed a simple playlist.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/playlist/block.json
- **Mots-clés** : music, sound
- **Attributs** : `type`:string, `order`:string, `showTracklist`:boolean, `showImages`:boolean, `showPlayButtonArtwork`:boolean, `showArtists`:boolean, `showNumbers`:boolean, `showTrackLength`:boolean, `waveformStyle`:string, `waveformColor`:string, `waveformGradient`:string, `waveformBackgroundColor`:string, `waveformBackgroundGradient`:string, `caption`:string
- **Supports** : anchor; align; __experimentalExposeControlsToChildren; color(gradients, link); __experimentalBorder(color, style, width); interactivity; spacing(margin, padding); typography(fontSize)
- **Variations** : —
- **Transformations** : depuis `core/audio`, `core/playlist-track` ; vers `core/audio`, `core/playlist-track`
- **Imbrication** : Blocs imbriqués autorisés : `core/playlist-track`
- **Contexte** : utilise [] ; fournit ['showArtists', 'showImages']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/playlist-track` : Playlist track

- **Description** : Playlist track.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/playlist-track/block.json
- **Mots-clés** : music, sound
- **Attributs** : `blob`:string, `id`:number, `src`:string, `type`:string, `album`:string, `artist`:string, `image`:string, `imageAlt`:string, `length`:string, `title`:string
- **Supports** : ~~html~~; interactivity(clientNavigation); ~~reusable~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/playlist`
- **Contexte** : utilise ['showArtists', 'showImages'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/video` : Video

- **Description** : Embed a video from your media library or upload a new one.
- **Catégorie** : `media` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/video/block.json
- **Mots-clés** : movie
- **Attributs** : `autoplay`:boolean, `caption`:rich-text, `controls`:boolean, `id`:number, `loop`:boolean, `muted`:boolean, `poster`:string, `preload`:string, `blob`:string, `src`:string, `width`:number, `height`:number, `playsInline`:boolean, `tracks`:array
- **Supports** : anchor; align; spacing(margin, padding); interactivity(clientNavigation)
- **Variations** : gif, video
- **Transformations** : autres : collage/HTML brut, dépôt de fichiers
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

---

## Catégorie `design` : Design (24 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/accordion` : Accordion

- **Description** : Displays a foldable layout that groups content in collapsible sections.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/accordion/block.json
- **Attributs** : `iconPosition`:string, `showIcon`:boolean, `autoclose`:boolean, `headingLevel`:number, `levelOptions`:array
- **Supports** : anchor; ~~html~~; align=["wide", "full"]; background(backgroundImage, backgroundSize, gradient); color(background, gradients); __experimentalBorder(color, radius, style, width); spacing(padding, margin, blockGap); shadow; layout; ariaLabel; interactivity; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); contentRole; listView
- **Variations** : core/accordion-heading, core/accordion-item
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/accordion-item`
- **Contexte** : utilise [] ; fournit ['core/accordion-icon-position', 'core/accordion-show-icon', 'core/accordion-heading-level']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/accordion-heading` : Accordion Heading

- **Description** : Displays a heading that toggles the accordion panel.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/accordion-heading/block.json
- **Attributs** : `openByDefault`:boolean, `title`:rich-text, `level`:number, `iconPosition`:string, `showIcon`:boolean
- **Supports** : anchor; color(background, gradients); ~~align~~; interactivity; spacing(padding, __experimentalSelector); __experimentalBorder(color, radius, style, width); typography(fontSize, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); shadow; ~~visibility~~; ~~lock~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/accordion-item`
- **Contexte** : utilise ['core/accordion-icon-position', 'core/accordion-show-icon', 'core/accordion-heading-level'] ; fournit []
- **Rendu** : Statique (save JS).

### `core/accordion-item` : Accordion Item

- **Description** : Wraps the heading and panel in one unit.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/accordion-item/block.json
- **Attributs** : `openByDefault`:boolean
- **Supports** : ~~html~~; color(background, gradients); interactivity; spacing(margin, padding, blockGap); __experimentalBorder(color, radius, style, width); shadow; layout(allowEditing); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); contentRole
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/accordion` ; Blocs imbriqués autorisés : `core/accordion-heading`, `core/accordion-panel`
- **Contexte** : utilise [] ; fournit ['core/accordion-open-by-default']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/accordion-panel` : Accordion Panel

- **Description** : Contains the hidden or revealed content beneath the heading.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/accordion-panel/block.json
- **Attributs** : `templateLock`:string/boolean
- **Supports** : ~~html~~; color(background, gradients); interactivity; spacing(padding, blockGap); __experimentalBorder(color, radius, style, width); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); shadow; layout(allowEditing); ~~visibility~~; contentRole; allowedBlocks; ~~lock~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/accordion-item`
- **Contexte** : utilise ['core/accordion-open-by-default'] ; fournit []
- **Rendu** : Statique (save JS).

### `core/button` : Button

- **Description** : Prompt visitors to take action with a button-style link.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/button/block.json
- **Mots-clés** : link
- **Attributs** : `tagName`:string, `type`:string, `url`:string, `title`:string, `text`:rich-text, `linkTarget`:string, `rel`:string, `placeholder`:string, `backgroundColor`:string, `textColor`:string, `gradient`:string
- **Supports** : anchor; splitting; ~~align~~; ~~alignWide~~; color(gradients); dimensions(width); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing, __experimentalWritingMode); ~~reusable~~; shadow; spacing(padding); __experimentalBorder(color, radius, style, width); interactivity(clientNavigation)
- **Styles de bloc** : fill (défaut), outline
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/buttons`
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/buttons` : Buttons

- **Description** : Prompt visitors to take action with a group of button-style links.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/buttons/block.json
- **Mots-clés** : link
- **Attributs** : —
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; __experimentalExposeControlsToChildren; color(gradients, text); spacing(blockGap, padding, margin); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(color, radius, style, width); layout(allowSwitching, allowInheriting, default); interactivity(clientNavigation); listView; contentRole
- **Variations** : core/button
- **Transformations** : depuis `core/button`, `core/paragraph`
- **Imbrication** : Blocs imbriqués autorisés : `core/button`
- **Rendu** : Statique (save JS).

### `core/column` : Column

- **Description** : A single column within a columns block.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/column/block.json
- **Attributs** : `verticalAlignment`:string, `width`:string, `templateLock`:string/boolean
- **Supports** : __experimentalOnEnter; anchor; ~~reusable~~; ~~html~~; color(gradients, heading, button, link); shadow; spacing(blockGap, padding); __experimentalBorder(color, radius, style, width); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); layout; interactivity(clientNavigation); allowedBlocks
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/columns`
- **Rendu** : Statique (save JS).

### `core/columns` : Columns

- **Description** : Display content in multiple columns, with blocks added to each column.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/columns/block.json
- **Attributs** : `verticalAlignment`:string, `isStackedOnMobile`:boolean, `templateLock`:string/boolean
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients, link, heading, button); spacing(blockGap, margin, padding); layout(allowSwitching, allowInheriting, allowEditing, default); __experimentalBorder(color, radius, style, width); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); shadow
- **Variations** : core/column, core/image, core/paragraph, one-column-full, three-columns-equal, three-columns-wider-center, two-columns-equal, two-columns-one-third-two-thirds, two-columns-two-thirds-one-third
- **Transformations** : depuis `core/column`, `core/group`, `core/image`, `core/media-text`, `core/video` ; vers `core/group`
- **Imbrication** : Blocs imbriqués autorisés : `core/column`
- **Rendu** : Statique (save JS).

### `core/comment-template` : Comment Template

- **Description** : Contains the block elements used to display a comment, like the title, date, author, avatar and more.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-template/block.json
- **Attributs** : —
- **Supports** : anchor; align; ~~html~~; ~~reusable~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/comments`
- **Contexte** : utilise ['postId'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/group` : Group

- **Description** : Gather blocks in a layout container.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/group/block.json
- **Mots-clés** : container, wrapper, row, section
- **Attributs** : `tagName`:string, `templateLock`:string/boolean
- **Supports** : __experimentalOnEnter; __experimentalOnMerge; __experimentalSettings; align=["wide", "full"]; anchor; ariaLabel; ~~html~~; background(backgroundImage, backgroundSize, gradient); color(gradients, heading, button, link); shadow; spacing(margin, padding, blockGap); dimensions(minHeight, minWidth); __experimentalBorder(color, radius, style, width); position(sticky); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); layout(allowSizingOnChildren); interactivity(clientNavigation); allowedBlocks
- **Variations** : core/button, core/heading, core/paragraph, core/spacer, group, group-grid, group-row, group-stack
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/home-link` : Home Link

- **Description** : Create a link that always points to the homepage of the site. Usually not necessary if there is already a site title link present in the header.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/home-link/block.json
- **Attributs** : `label`:string, `opensInNewTab`:boolean, `description`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/navigation`
- **Contexte** : utilise ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'fontSize', 'customFontSize', 'style'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/more` : More

- **Description** : Content before this block will be shown in the excerpt on your archives page.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/more/block.json
- **Mots-clés** : read more
- **Attributs** : `customText`:string, `noTeaser`:boolean
- **Supports** : ~~customClassName~~; ~~className~~; ~~html~~; ~~multiple~~; ~~visibility~~; interactivity(clientNavigation); ~~customCSS~~
- **Variations** : —
- **Transformations** : autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/navigation-link` : Custom Link

- **Description** : Add a page, link, or another item to your navigation.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/navigation-link/block.json
- **Attributs** : `label`:string, `type`:string, `description`:string, `rel`:string, `id`:number, `opensInNewTab`:boolean, `url`:string, `title`:string, `kind`:string, `isTopLevelLink`:boolean
- **Supports** : anchor; ~~reusable~~; ~~html~~; __experimentalSlashInserter; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); ~~renaming~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : depuis `core/buttons`, `core/home-link`, `core/page-list`, `core/search`, `core/site-logo`, `core/social-links`, `core/spacer` ; vers `core/button`, `core/buttons`, `core/home-link`, `core/navigation-submenu`, `core/page-list`, `core/search`, `core/site-logo`, `core/social-links`, `core/spacer`
- **Imbrication** : Parent obligatoire : `core/navigation` ; Blocs imbriqués autorisés : `core/navigation-link`, `core/navigation-submenu`, `core/page-list`
- **Contexte** : utilise ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'overlayTextColor', 'customOverlayTextColor', 'overlayBackgroundColor', 'customOverlayBackgroundColor', 'fontSize', 'customFontSize', 'showSubmenuIcon', 'maxNestingLevel', 'style'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/navigation-overlay-close` : Navigation Overlay Close

- **Description** : A customizable button to close overlays.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/navigation-overlay-close/block.json
- **Mots-clés** : close, overlay, navigation, menu
- **Attributs** : `displayMode`:string, `text`:string
- **Supports** : color(gradients); spacing(padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/navigation-submenu` : Submenu

- **Description** : Add a submenu to your navigation.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/navigation-submenu/block.json
- **Attributs** : `label`:string, `type`:string, `description`:string, `rel`:string, `id`:number, `opensInNewTab`:boolean, `url`:string, `title`:string, `kind`:string, `isTopLevelItem`:boolean, `isParentSubmenu`:boolean
- **Supports** : anchor; ~~reusable~~; ~~html~~; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : vers `core/home-link`, `core/navigation-link`, `core/search`, `core/site-logo`, `core/social-links`, `core/spacer`
- **Imbrication** : Parent obligatoire : `core/navigation`
- **Contexte** : utilise ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'overlayTextColor', 'customOverlayTextColor', 'overlayBackgroundColor', 'customOverlayBackgroundColor', 'fontSize', 'customFontSize', 'showSubmenuIcon', 'maxNestingLevel', 'openSubmenusOnClick', 'submenuVisibility', 'style'] ; fournit ['core/isInsideSubmenu']
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/nextpage` : Page Break

- **Description** : Separate your content into a multi-page experience.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/nextpage/block.json
- **Mots-clés** : next page, pagination
- **Attributs** : —
- **Supports** : ~~customClassName~~; ~~className~~; ~~html~~; ~~visibility~~; interactivity(clientNavigation); ~~customCSS~~
- **Variations** : —
- **Transformations** : autres : collage/HTML brut
- **Imbrication** : Parent obligatoire : `core/post-content`
- **Rendu** : Statique (save JS).

### `core/separator` : Separator

- **Description** : Create a break between ideas or sections with a horizontal separator.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/separator/block.json
- **Mots-clés** : horizontal-line, hr, divider
- **Attributs** : `opacity`:string, `tagName`:string
- **Supports** : anchor; align=["center", "wide", "full"]; color(enableContrastChecker, gradients, background, text); spacing(margin); interactivity(clientNavigation)
- **Styles de bloc** : default (défaut), wide, dots
- **Variations** : —
- **Transformations** : vers `core/spacer` ; autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/spacer` : Spacer

- **Description** : Add white space between blocks and customize its height.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/spacer/block.json
- **Attributs** : `height`:string, `width`:string
- **Supports** : anchor; spacing(margin); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : vers `core/separator`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['orientation'] ; fournit []
- **Rendu** : Statique (save JS).

### `core/tab-list` : Tab List

- **Description** : Display the tab buttons for a tabbed interface.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/tab-list/block.json
- **Attributs** : `tabs`:array
- **Supports** : ~~html~~; ariaLabel; ~~visibility~~; ~~lock~~; color(background, text); typography(fontSize, __experimentalFontFamily); __experimentalBorder(color, radius, style, width); layout(default, allowVerticalAlignment, allowOrientation, allowWrap); spacing(padding, blockGap)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/tabs`
- **Contexte** : utilise ['core/tabs-list'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/tab-panel` : Tab Panel

- **Description** : Content for a tab in a tabbed interface.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/tab-panel/block.json
- **Attributs** : `label`:string
- **Supports** : anchor; ~~html~~; color(background, text); layout; spacing(blockGap, padding); typography(fontSize, __experimentalFontFamily); ~~visibility~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/tab-panels`
- **Contexte** : utilise ['core/tabs-id'] ; fournit ['core/tab-label']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/tab-panels` : Tab Panels

- **Description** : Container for tab panel content in a tabbed interface.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/tab-panels/block.json
- **Attributs** : —
- **Supports** : ~~html~~; ~~visibility~~; ~~lock~~; color(background, text, heading, link); spacing(padding); typography(fontSize, __experimentalFontFamily); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/tabs` ; Blocs imbriqués autorisés : `core/tab-panel`
- **Rendu** : Statique (save JS).

### `core/table-of-contents` : Table of Contents

- **Description** : Summarize your post with a list of headings. Add HTML anchors to Heading blocks to link them here.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/table-of-contents/block.json
- **Expérimental** : oui (`__experimental` = true)
- **Mots-clés** : document outline, summary
- **Attributs** : `headings`:array, `onlyIncludeCurrentPage`:boolean, `maxLevel`:number, `ordered`:boolean
- **Supports** : anchor; ariaLabel; ~~html~~; color(text, background, gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : core/heading
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/tabs` : Tabs

- **Description** : Display content in a tabbed interface to help users navigate detailed content with ease.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/tabs/block.json
- **Attributs** : `activeTabIndex`:number, `editorActiveTabIndex`:number
- **Supports** : align; anchor; color(text, background); layout(allowEditing); ~~html~~; interactivity; spacing(blockGap, margin, padding); typography(fontSize, __experimentalFontFamily)
- **Variations** : core/paragraph, core/tab-list, core/tab-panel, core/tab-panels
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/tab-list`, `core/tab-panels`
- **Contexte** : utilise ['core/tabs-list', 'core/tabs-id'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/text-columns` : Text Columns (deprecated)

- **Description** : This block is deprecated. Please use the Columns block instead.
- **Catégorie** : `design` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/text-columns/block.json
- **Attributs** : `content`:array, `columns`:number, `width`:string
- **Supports** : ~~inserter~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : vers `core/column`, `core/columns`, `core/paragraph`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

---

## Catégorie `widgets` : Widgets (18 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/archives` : Archives

- **Description** : Display a date archive of your posts.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/archives/block.json
- **Attributs** : `displayAsDropdown`:boolean, `showLabel`:boolean, `showPostCounts`:boolean, `type`:string
- **Supports** : anchor; align; __experimentalBorder(radius, color, width, style); ~~html~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); color(gradients, link); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/calendar` : Calendar

- **Description** : A calendar of your site’s posts.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/calendar/block.json
- **Mots-clés** : posts, archive
- **Attributs** : `month`:integer, `year`:integer
- **Supports** : anchor; align; ~~html~~; color(link, __experimentalSelector); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : depuis `core/archives` ; vers `core/archives`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/categories` : Terms List

- **Description** : Display a list of all terms of a given taxonomy.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/categories/block.json
- **Mots-clés** : categories
- **Attributs** : `taxonomy`:string, `displayAsDropdown`:boolean, `showHierarchy`:boolean, `showPostCounts`:boolean, `showOnlyTopLevel`:boolean, `showEmpty`:boolean, `label`:string, `showLabel`:boolean
- **Supports** : anchor; align; ~~html~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); color(gradients, link); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : categories, terms
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['enhancedPagination'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/form` : Form

- **Description** : A form.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/form/block.json
- **Expérimental** : oui (`__experimental` = true)
- **Mots-clés** : container, wrapper, row, section
- **Attributs** : `submissionMethod`:string, `method`:string, `action`:string, `email`:string
- **Supports** : anchor; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalTextDecoration, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform)
- **Variations** : author, comment, comment-form, email, export_personal_data, remove_personal_data, wp-action, wp-privacy-form, wp-privacy-request
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/paragraph`, `core/heading`, `core/form-input`, `core/form-submit-button`, `core/form-submission-notification`, `core/group`, `core/columns`
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content).

### `core/form-input` : Input Field

- **Description** : The basic building block for forms.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/form-input/block.json
- **Expérimental** : oui (`__experimental` = true)
- **Mots-clés** : input, form
- **Attributs** : `type`:string, `name`:string, `label`:rich-text, `inlineLabel`:boolean, `required`:boolean, `placeholder`:string, `value`:string, `visibilityPermissions`:string
- **Supports** : anchor; ~~reusable~~; spacing(margin); __experimentalBorder(radius)
- **Variations** : checkbox, email, hidden, number, tel, text, textarea, url
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/form`
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/form-submission-notification` : Form Submission Notification

- **Description** : Provide a notification message after the form has been submitted.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/form-submission-notification/block.json
- **Expérimental** : oui (`__experimental` = true)
- **Mots-clés** : form, feedback, notification, message
- **Attributs** : `type`:string
- **Supports** : —
- **Variations** : form-submission-error, form-submission-success
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/form`
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/form-submit-button` : Form Submit Button

- **Description** : A submission button for forms.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/form-submit-button/block.json
- **Expérimental** : oui (`__experimental` = true)
- **Mots-clés** : submit, button, form
- **Attributs** : —
- **Supports** : —
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/form` ; Blocs imbriqués autorisés : `core/buttons`, `core/button`
- **Rendu** : Statique (save JS).

### `core/html` : Custom HTML

- **Description** : Add custom HTML code and preview it as you edit.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/html/block.json
- **Mots-clés** : embed
- **Attributs** : `content`:string
- **Supports** : ~~customClassName~~; ~~className~~; ~~html~~; interactivity(clientNavigation); listView; ~~customCSS~~; ~~visibility~~
- **Variations** : —
- **Transformations** : depuis `core/code`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

### `core/latest-comments` : Latest Comments

- **Description** : Display a list of your most recent comments.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/latest-comments/block.json
- **Mots-clés** : recent comments
- **Attributs** : `commentsToShow`:number, `displayAvatar`:boolean, `displayDate`:boolean, `displayContent`:string
- **Supports** : anchor; align; color(gradients, link); ~~html~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/latest-posts` : Latest Posts

- **Description** : Display a list of your most recent posts.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/latest-posts/block.json
- **Mots-clés** : recent posts
- **Attributs** : `categories`:array, `selectedAuthor`:number, `postsToShow`:number, `displayPostContent`:boolean, `displayPostContentRadio`:string, `excerptLength`:number, `displayAuthor`:boolean, `displayPostDate`:boolean, `order`:string, `orderBy`:string, `displayFeaturedImage`:boolean, `featuredImageAlign`:string, `featuredImageSizeSlug`:string, `featuredImageSizeWidth`:number, `featuredImageSizeHeight`:number, `addLinkToFeaturedImage`:boolean
- **Supports** : anchor; align; ~~html~~; layout; color(gradients, link); spacing(margin, padding, blockGap); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/page-list` : Page List

- **Description** : Display a list of all pages.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/page-list/block.json
- **Mots-clés** : menu, navigation
- **Attributs** : `parentPageID`:integer
- **Supports** : anchor; ~~reusable~~; ~~html~~; typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); color(text, background, link, gradients); __experimentalBorder(radius, color, width, style); spacing(padding, margin); contentRole
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/page-list-item`
- **Contexte** : utilise ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'overlayTextColor', 'customOverlayTextColor', 'overlayBackgroundColor', 'customOverlayBackgroundColor', 'fontSize', 'customFontSize', 'showSubmenuIcon', 'style', 'openSubmenusOnClick', 'submenuVisibility', 'core/isInsideSubmenu'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/page-list-item` : Page List Item

- **Description** : Displays a page inside a list of all pages.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/page-list-item/block.json
- **Mots-clés** : page, menu, navigation
- **Attributs** : `id`:number, `label`:string, `title`:string, `link`:string, `hasChildren`:boolean
- **Supports** : anchor; ~~reusable~~; ~~html~~; ~~lock~~; ~~inserter~~; ~~__experimentalToolbar~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/page-list`
- **Contexte** : utilise ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'overlayTextColor', 'customOverlayTextColor', 'overlayBackgroundColor', 'customOverlayBackgroundColor', 'fontSize', 'customFontSize', 'showSubmenuIcon', 'style', 'openSubmenusOnClick', 'submenuVisibility'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/rss` : RSS

- **Description** : Display entries from any RSS or Atom feed.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/rss/block.json
- **Mots-clés** : atom, feed
- **Attributs** : `columns`:number, `blockLayout`:string, `feedURL`:string, `itemsToShow`:number, `displayExcerpt`:boolean, `displayAuthor`:boolean, `displayDate`:boolean, `excerptLength`:number, `openInNewTab`:boolean, `rel`:string
- **Supports** : anchor; align; ~~html~~; interactivity(clientNavigation); __experimentalBorder(radius, color, width, style); spacing(margin, padding); color(background, text, gradients, link)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/search` : Search

- **Description** : Help visitors find your content.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/search/block.json
- **Mots-clés** : find
- **Attributs** : `label`:string, `showLabel`:boolean, `placeholder`:string, `width`:number, `widthUnit`:string, `buttonText`:string, `buttonPosition`:string, `buttonUseIcon`:boolean, `query`:object, `tagName`:string
- **Supports** : anchor; align=["left", "center", "right"]; color(gradients); interactivity; typography(__experimentalSelector, fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(color, radius, width); spacing(margin); ~~html~~
- **Variations** : default
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/shortcode` : Shortcode

- **Description** : Insert additional custom elements with a WordPress shortcode.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/shortcode/block.json
- **Attributs** : `text`:string
- **Supports** : ~~className~~; ~~customClassName~~; ~~html~~; ~~customCSS~~; ~~visibility~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement).

### `core/social-link` : Social Icon

- **Description** : Display an icon linking to a social profile or site.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/social-link/block.json
- **Attributs** : `url`:string, `service`:string, `label`:string, `rel`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; interactivity(clientNavigation)
- **Variations** : amazon, bandcamp, behance, bluesky, chain, codepen, deviantart, discord, dribbble, dropbox, etsy, facebook, feed, fivehundredpx, flickr, foursquare, github, goodreads, google, gravatar, instagram, lastfm, linkedin, mail, mastodon, medium, meetup, patreon, pinterest, pocket, reddit, skype, snapchat, soundcloud, spotify, telegram, threads, tiktok, tumblr, twitch, twitter, vimeo, vk, whatsapp, wordpress, x, yelp, youtube
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/social-links`
- **Contexte** : utilise ['openInNewTab', 'showLabels', 'iconColor', 'iconColorValue', 'iconBackgroundColor', 'iconBackgroundColorValue'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null).

### `core/social-links` : Social Icons

- **Description** : Display icons linking to your social profiles or sites.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/social-links/block.json
- **Mots-clés** : links
- **Attributs** : `iconColor`:string, `customIconColor`:string, `iconColorValue`:string, `iconBackgroundColor`:string, `customIconBackgroundColor`:string, `iconBackgroundColorValue`:string, `openInNewTab`:boolean, `showLabels`:boolean, `size`:string
- **Supports** : align=["left", "center", "right"]; anchor; ~~html~~; __experimentalExposeControlsToChildren; layout(allowSwitching, allowInheriting, allowVerticalAlignment, default); color(enableContrastChecker, background, gradients, text); spacing(blockGap, margin, padding, units); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style); contentRole; listView
- **Styles de bloc** : default (défaut), logos-only, pill-shape
- **Variations** : core/social-link
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/social-link`
- **Contexte** : utilise [] ; fournit ['openInNewTab', 'showLabels', 'iconColor', 'iconColorValue', 'iconBackgroundColor', 'iconBackgroundColorValue']
- **Rendu** : Statique (save JS).

### `core/tag-cloud` : Tag Cloud

- **Description** : A cloud of popular keywords, each sized by how often it appears.
- **Catégorie** : `widgets` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/tag-cloud/block.json
- **Attributs** : `numberOfTags`:number, `taxonomy`:string, `showTagCounts`:boolean, `smallestFontSize`:string, `largestFontSize`:string
- **Supports** : anchor; ~~html~~; align; spacing(margin, padding); typography(lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Styles de bloc** : default (défaut), outline
- **Variations** : —
- **Transformations** : depuis `core/categories` ; vers `core/categories`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null).

---

## Catégorie `theme` : Thème (éditeur de site / contenu dynamique) (51 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/avatar` : Avatar

- **Description** : Add a user’s avatar.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/avatar/block.json
- **Attributs** : `userId`:number, `size`:number, `isLink`:boolean, `linkTarget`:string
- **Supports** : anchor; ~~html~~; align; ~~alignWide~~; spacing(margin, padding); __experimentalBorder(radius, width, color, style); color(text, background); filter(duotone); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType', 'postId', 'commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/breadcrumbs` : Breadcrumbs

- **Description** : Display a breadcrumb trail showing the path to the current page.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/breadcrumbs/block.json
- **Attributs** : `prefersTaxonomy`:boolean, `separator`:string, `showHomeItem`:boolean, `showCurrentItem`:boolean, `showOnHomePage`:boolean
- **Supports** : anchor; ~~html~~; align=["wide", "full"]; spacing(margin, padding); color(gradients, link); __experimentalBorder(radius, color, width, style); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'templateSlug'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-author-avatar` : Comment Author Avatar (deprecated)

- **Description** : This block is deprecated. Please use the Avatar block instead.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-author-avatar/block.json
- **Expérimental** : oui (`__experimental` = "fse")
- **Attributs** : `width`:number, `height`:number
- **Supports** : ~~html~~; ~~inserter~~; __experimentalBorder(radius, width, color, style); color(background, text); spacing(margin, padding); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-author-name` : Comment Author Name

- **Description** : Displays the name of the author of the comment.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-author-name/block.json
- **Attributs** : `isLink`:boolean, `linkTarget`:string
- **Supports** : anchor; ~~html~~; spacing(margin, padding); color(gradients, link); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-content` : Comment Content

- **Description** : Displays the contents of a comment.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-content/block.json
- **Attributs** : —
- **Supports** : anchor; color(gradients, link); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); spacing(padding); ~~html~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-date` : Comment Date

- **Description** : Displays the date on which the comment was posted.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-date/block.json
- **Attributs** : `format`:string, `isLink`:boolean
- **Supports** : anchor; ~~html~~; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-edit-link` : Comment Edit Link

- **Description** : Displays a link to edit the comment in the WordPress Dashboard. This link is only visible to users with the edit comment capability.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-edit-link/block.json
- **Attributs** : `linkTarget`:string
- **Supports** : anchor; ~~html~~; color(link, gradients, text); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comment-reply-link` : Comment Reply Link

- **Description** : Displays a link to reply to a comment.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comment-reply-link/block.json
- **Attributs** : —
- **Supports** : anchor; color(gradients, link, text); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); ~~html~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comment-template`
- **Contexte** : utilise ['commentId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments` : Comments

- **Description** : An advanced block that allows displaying post comments using different visual configurations.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments/block.json
- **Attributs** : `tagName`:string, `legacy`:boolean
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients, heading, link); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments-pagination` : Comments Pagination

- **Description** : Displays a paginated navigation to next/previous set of comments, when applicable.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments-pagination/block.json
- **Attributs** : `paginationArrow`:string
- **Supports** : anchor; align; ~~reusable~~; ~~html~~; color(gradients, link); layout(allowSwitching, allowInheriting, default); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/comments` ; Blocs imbriqués autorisés : `core/comments-pagination-previous`, `core/comments-pagination-numbers`, `core/comments-pagination-next`
- **Contexte** : utilise [] ; fournit ['comments/paginationArrow']
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments-pagination-next` : Comments Next Page

- **Description** : Displays the next comment's page link.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments-pagination-next/block.json
- **Attributs** : `label`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/comments-pagination`
- **Contexte** : utilise ['postId', 'comments/paginationArrow'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments-pagination-numbers` : Comments Page Numbers

- **Description** : Displays a list of page numbers for comments pagination.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments-pagination-numbers/block.json
- **Attributs** : —
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); spacing(margin, padding)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/comments-pagination`
- **Contexte** : utilise ['postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments-pagination-previous` : Comments Previous Page

- **Description** : Displays the previous comment's page link.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments-pagination-previous/block.json
- **Attributs** : `label`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/comments-pagination`
- **Contexte** : utilise ['postId', 'comments/paginationArrow'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/comments-title` : Comments Title

- **Description** : Displays a title with the number of comments.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/comments-title/block.json
- **Attributs** : `showPostTitle`:boolean, `showCommentsCount`:boolean, `level`:number, `levelOptions`:array
- **Supports** : anchor; align; ~~html~~; __experimentalBorder(radius, color, width, style); color(gradients); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/comments`
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/loginout` : Login/out

- **Description** : Show login & logout links.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/loginout/block.json
- **Mots-clés** : login, logout, form
- **Attributs** : `displayLoginAsForm`:boolean, `redirectToCurrent`:boolean
- **Supports** : anchor; className; color(background, text, gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/navigation` : Navigation

- **Description** : A collection of blocks that allow visitors to get around your site.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/navigation/block.json
- **Mots-clés** : menu, navigation, links
- **Attributs** : `ref`:number, `textColor`:string, `customTextColor`:string, `rgbTextColor`:string, `backgroundColor`:string, `customBackgroundColor`:string, `rgbBackgroundColor`:string, `showSubmenuIcon`:boolean, `submenuVisibility`:string, `overlayMenu`:string, `overlay`:string, `icon`:string, `hasIcon`:boolean, `__unstableLocation`:string, `overlayBackgroundColor`:string, `customOverlayBackgroundColor`:string, `overlayTextColor`:string, `customOverlayTextColor`:string, `maxNestingLevel`:number, `templateLock`:string/boolean
- **Supports** : anchor; align=["wide", "full"]; ariaLabel; contentRole; ~~html~~; inserter; typography(fontSize, lineHeight, __experimentalFontStyle, __experimentalFontWeight, __experimentalTextTransform, __experimentalFontFamily, __experimentalLetterSpacing, __experimentalTextDecoration); spacing(blockGap, units); layout(allowSwitching, allowInheriting, allowVerticalAlignment, allowSizingOnChildren, default); interactivity; ~~renaming~~
- **Variations** : core/navigation-link
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/navigation-link`, `core/search`, `core/social-links`, `core/page-list`, `core/spacer`, `core/home-link`, `core/icon`, `core/site-title`, `core/site-logo`, `core/navigation-submenu`, `core/loginout`, `core/buttons`
- **Contexte** : utilise [] ; fournit ['textColor', 'customTextColor', 'backgroundColor', 'customBackgroundColor', 'overlayTextColor', 'customOverlayTextColor', 'overlayBackgroundColor', 'customOverlayBackgroundColor', 'fontSize', 'customFontSize', 'showSubmenuIcon', 'submenuVisibility', 'openSubmenusOnClick', 'style', 'maxNestingLevel']
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/pattern` : Pattern Placeholder

- **Description** : Show a block pattern.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/pattern/block.json
- **Attributs** : `slug`:string
- **Supports** : ~~html~~; ~~inserter~~; ~~renaming~~; ~~visibility~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-author` : Author (deprecated)

- **Description** : This block is deprecated. Please use the Avatar block, the Author Name block, and the Author Biography block instead.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-author/block.json
- **Attributs** : `textAlign`:string, `avatarSize`:number, `showAvatar`:boolean, `showBio`:boolean, `byline`:string, `isLink`:boolean, `linkTarget`:string
- **Supports** : ~~inserter~~; anchor; ~~html~~; spacing(margin, padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); color(gradients, link); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style); filter(duotone)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType', 'postId', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-author-biography` : Author Biography

- **Description** : The author biography.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-author-biography/block.json
- **Attributs** : —
- **Supports** : anchor; spacing(margin, padding); color(gradients, link); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType', 'postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-author-name` : Author Name

- **Description** : The author name.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-author-name/block.json
- **Attributs** : `isLink`:boolean, `linkTarget`:string
- **Supports** : anchor; ~~html~~; spacing(margin, padding); color(gradients, link); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : depuis `core/post-author`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType', 'postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-comment` : Comment (deprecated)

- **Description** : This block is deprecated. Please use the Comments block instead.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-comment/block.json
- **Expérimental** : oui (`__experimental` = "fse")
- **Attributs** : `commentId`:number
- **Supports** : ~~html~~; ~~inserter~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Blocs imbriqués autorisés : `core/avatar`, `core/comment-author-name`, `core/comment-content`, `core/comment-date`, `core/comment-edit-link`, `core/comment-reply-link`
- **Contexte** : utilise [] ; fournit ['commentId']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-comments-count` : Comments Count

- **Description** : Display a post's comments count.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-comments-count/block.json
- **Attributs** : —
- **Supports** : anchor; ~~html~~; color(gradients); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : vers `core/post-comments-link`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-comments-form` : Comments Form

- **Description** : Display a post's comments form.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-comments-form/block.json
- **Attributs** : —
- **Supports** : anchor; ~~html~~; color(gradients, heading, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-comments-link` : Comments Link

- **Description** : Displays the link to the current post comments.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-comments-link/block.json
- **Attributs** : —
- **Supports** : anchor; ~~html~~; color(link, text); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : vers `core/post-comments-count`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType', 'postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-content` : Content

- **Description** : Displays the contents of a post or page.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-content/block.json
- **Attributs** : `tagName`:string
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; layout; background(backgroundImage, backgroundSize, gradient); dimensions(minHeight); spacing(blockGap, padding, margin); color(gradients, heading, link); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-date` : Date

- **Description** : Display a custom date.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-date/block.json
- **Attributs** : `datetime`:string, `format`:string, `isLink`:boolean
- **Supports** : anchor; ~~html~~; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : post-date, post-date-modified
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-excerpt` : Excerpt

- **Description** : Display the excerpt.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-excerpt/block.json
- **Attributs** : `moreText`:string, `showMoreOnNewLine`:boolean, `excerptLength`:number
- **Supports** : anchor; ~~html~~; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, textColumns, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : depuis `core/post-content` ; vers `core/post-content`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-featured-image` : Featured Image

- **Description** : Display a post's featured image.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-featured-image/block.json
- **Attributs** : `isLink`:boolean, `aspectRatio`:string, `width`:string, `height`:string, `scale`:string, `sizeSlug`:string, `rel`:string, `linkTarget`:string, `overlayColor`:string, `customOverlayColor`:string, `dimRatio`:number, `gradient`:string, `customGradient`:string, `useFirstImageFromPost`:boolean
- **Supports** : anchor; align=["left", "right", "center", "wide", "full"]; color(text, background); __experimentalBorder(color, radius, width); filter(duotone); shadow; ~~html~~; spacing(margin, padding); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-navigation-link` : Post Navigation Link

- **Description** : Displays the next or previous post link that is adjacent to the current post.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-navigation-link/block.json
- **Attributs** : `type`:string, `label`:string, `showTitle`:boolean, `linkLabel`:boolean, `arrow`:string, `taxonomy`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(link); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing, __experimentalWritingMode); interactivity(clientNavigation)
- **Variations** : post-next, post-previous
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-template` : Post Template

- **Description** : Contains the block elements used to render a post, like the title, date, featured image, content or excerpt, and more.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-template/block.json
- **Attributs** : —
- **Supports** : anchor; ~~reusable~~; ~~html~~; align=["wide", "full"]; layout; color(gradients, link); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); spacing(margin, padding, blockGap); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/query`
- **Contexte** : utilise ['queryId', 'query', 'displayLayout', 'templateSlug', 'previewPostType', 'enhancedPagination', 'postType', 'postId'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-terms` : Post Terms

- **Description** : Post terms.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-terms/block.json
- **Attributs** : `term`:string, `separator`:string, `prefix`:string, `suffix`:string
- **Supports** : anchor; ~~html~~; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-time-to-read` : Time to Read

- **Description** : Show minutes required to finish reading the post. Can also show a word count.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-time-to-read/block.json
- **Attributs** : `displayAsRange`:boolean, `displayMode`:string, `averageReadingSpeed`:number
- **Supports** : anchor; color(gradients); ~~html~~; spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : time-to-read, word-count
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/post-title` : Title

- **Description** : Displays the title of a post, page, or any other content-type.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/post-title/block.json
- **Attributs** : `level`:number, `levelOptions`:array, `isLink`:boolean, `rel`:string, `linkTarget`:string, `placeholder`:string
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients, link); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId', 'postType', 'queryId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query` : Query Loop

- **Description** : An advanced block that allows displaying post types based on different query parameters and visual configurations.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query/block.json
- **Mots-clés** : posts, list, blog, blogs, custom post types
- **Attributs** : `queryId`:number, `query`:object, `tagName`:string, `namespace`:string, `enhancedPagination`:boolean
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; layout; interactivity
- **Variations** : core/post-date, core/post-excerpt, core/post-template, core/post-title, image-date-title, title-date, title-date-excerpt, title-excerpt
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['templateSlug', 'postType'] ; fournit ['queryId', 'query', 'displayLayout', 'enhancedPagination']
- **Rendu** : Hybride : save JS statique + render_callback PHP (post-traitement). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-no-results` : No Results

- **Description** : Contains the block elements used to render content when no query results are found.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-no-results/block.json
- **Attributs** : —
- **Supports** : anchor; align; ~~reusable~~; ~~html~~; color(gradients, link); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : core/paragraph
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/query`
- **Contexte** : utilise ['queryId', 'query'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-pagination` : Pagination

- **Description** : Displays a paginated navigation to next/previous set of posts, when applicable.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-pagination/block.json
- **Attributs** : `paginationArrow`:string, `showLabel`:boolean
- **Supports** : anchor; align; ~~reusable~~; ~~html~~; color(gradients, link); layout(allowSwitching, allowInheriting, default); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/query` ; Blocs imbriqués autorisés : `core/query-pagination-previous`, `core/query-pagination-numbers`, `core/query-pagination-next`
- **Contexte** : utilise ['queryId', 'query'] ; fournit ['paginationArrow', 'showLabel']
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-pagination-next` : Next Page

- **Description** : Displays the next posts page link.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-pagination-next/block.json
- **Attributs** : `label`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/query-pagination`
- **Contexte** : utilise ['queryId', 'query', 'paginationArrow', 'showLabel', 'enhancedPagination'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-pagination-numbers` : Page Numbers

- **Description** : Displays a list of page numbers for pagination.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-pagination-numbers/block.json
- **Attributs** : `midSize`:number
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/query-pagination`
- **Contexte** : utilise ['queryId', 'query', 'enhancedPagination'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-pagination-previous` : Previous Page

- **Description** : Displays the previous posts page link.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-pagination-previous/block.json
- **Attributs** : `label`:string
- **Supports** : anchor; ~~reusable~~; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Parent obligatoire : `core/query-pagination`
- **Contexte** : utilise ['queryId', 'query', 'paginationArrow', 'showLabel', 'enhancedPagination'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-title` : Query Title

- **Description** : Display the query title.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-title/block.json
- **Attributs** : `type`:string, `level`:number, `levelOptions`:array, `showPrefix`:boolean, `showSearchTerm`:boolean
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients); spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalTextTransform, __experimentalTextDecoration); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : archive-title, post-type-label, search-title
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['query'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/query-total` : Query Total

- **Description** : Display the total number of results in a query.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/query-total/block.json
- **Attributs** : `displayType`:string
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; spacing(margin, padding); color(gradients); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); __experimentalBorder(radius, color, width, style); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/query`
- **Contexte** : utilise ['queryId', 'query'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/read-more` : Read More

- **Description** : Displays the link of a post, page, or any other content-type.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/read-more/block.json
- **Attributs** : `content`:string, `linkTarget`:string
- **Supports** : anchor; ~~html~~; color(gradients, text); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalLetterSpacing, __experimentalTextDecoration); spacing(margin, padding); __experimentalBorder(color, radius, width); interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['postId'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/site-logo` : Site Logo

- **Description** : Display an image to represent this site. Update this block and the changes apply everywhere.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/site-logo/block.json
- **Attributs** : `width`:number, `isLink`:boolean, `linkTarget`:string, `shouldSyncIcon`:boolean
- **Supports** : anchor; ~~html~~; align; ~~alignWide~~; color(text, background); spacing(margin, padding); interactivity(clientNavigation); filter(duotone)
- **Styles de bloc** : default (défaut), rounded
- **Variations** : —
- **Transformations** : vers `core/site-title`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/site-tagline` : Site Tagline

- **Description** : Describe in a few words what this site is about. This is important for search results, sharing on social media, and gives overall clarity to visitors.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/site-tagline/block.json
- **Mots-clés** : description
- **Attributs** : `level`:number, `levelOptions`:array
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients); contentRole; spacing(margin, padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalTextTransform, __experimentalTextDecoration, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalWritingMode); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/site-title` : Site Title

- **Description** : Displays the name of this site. Update the block, and the changes apply everywhere it’s used. This will also appear in the browser title bar and in search results.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/site-title/block.json
- **Attributs** : `level`:number, `levelOptions`:array, `isLink`:boolean, `linkTarget`:string
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients, link); spacing(padding, margin); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalTextTransform, __experimentalTextDecoration, __experimentalFontStyle, __experimentalFontWeight, __experimentalLetterSpacing, __experimentalWritingMode); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : vers `core/site-logo`
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/template-part` : Template Part

- **Description** : Edit the different global regions of your site, like the header, footer, sidebar, or create your own.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/template-part/block.json
- **Attributs** : `slug`:string, `theme`:string, `tagName`:string, `area`:string
- **Supports** : align; ~~html~~; ~~reusable~~; ~~renaming~~; interactivity(clientNavigation)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/term-count` : Term Count

- **Description** : Displays the post count of a taxonomy term.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/term-count/block.json
- **Attributs** : `bracketType`:string
- **Supports** : anchor; ~~html~~; color(gradients); spacing(padding); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['termId', 'taxonomy'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/term-description` : Term Description

- **Description** : Display the description of categories, tags and custom taxonomies when viewing an archive.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/term-description/block.json
- **Attributs** : —
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(link); spacing(padding, margin); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['termId', 'taxonomy'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/term-name` : Term Name

- **Description** : Displays the name of a taxonomy term.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/term-name/block.json
- **Mots-clés** : term title
- **Attributs** : `level`:number, `isLink`:boolean, `levelOptions`:array
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; color(gradients, link); spacing(padding); typography(fontSize, lineHeight, textAlign, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['termId', 'taxonomy'] ; fournit []
- **Rendu** : Dynamique (rendu PHP, save=null). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/term-template` : Term Template

- **Description** : Contains the block elements used to render a taxonomy term, like the name, description, and more.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/term-template/block.json
- **Attributs** : —
- **Supports** : anchor; ~~reusable~~; ~~html~~; align=["wide", "full"]; layout; color(gradients, link); typography(fontSize, lineHeight, __experimentalFontFamily, __experimentalFontWeight, __experimentalFontStyle, __experimentalTextTransform, __experimentalTextDecoration, __experimentalLetterSpacing); spacing(margin, padding, blockGap); interactivity(clientNavigation); __experimentalBorder(radius, color, width, style)
- **Variations** : —
- **Transformations** : —
- **Imbrication** : Ancêtre obligatoire : `core/terms-query`
- **Contexte** : utilise ['termQuery'] ; fournit []
- **Rendu** : Dynamique (render_callback PHP ; save JS = InnerBlocks.Content). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

### `core/terms-query` : Terms Query

- **Description** : An advanced block that allows displaying taxonomy terms based on different query parameters and visual configurations.
- **Catégorie** : `theme` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/terms-query/block.json
- **Mots-clés** : terms, taxonomy, categories, tags, list
- **Attributs** : `termQuery`:object, `tagName`:string
- **Supports** : anchor; align=["wide", "full"]; ~~html~~; layout; interactivity
- **Variations** : name, name-count
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise ['templateSlug'] ; fournit ['termQuery']
- **Rendu** : Statique (save JS). **Dépendant du thème/CMS** (contexte de publication, boucle, réglages du site ou template).

---

## Catégorie `embed` : Intégrations (embed) (1 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/embed` : Embed

- **Description** : Add a block that displays content pulled from other sites, like Twitter or YouTube.
- **Catégorie** : `embed` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/embed/block.json
- **Attributs** : `url`:string, `caption`:rich-text, `type`:string, `providerNameSlug`:string, `allowResponsive`:boolean, `responsive`:boolean, `previewable`:boolean
- **Supports** : anchor; align; spacing(margin); interactivity(clientNavigation)
- **Variations** : amazon-kindle, animoto, bluesky, cloudup, collegehumor, crowdsignal, dailymotion, facebook, flickr, imgur, instagram, issuu, kickstarter, mixcloud, pinterest, pocket-casts, reddit, reverbnation, scribd, smugmug, soundcloud, speaker-deck, spotify, ted, tiktok, tumblr, twitter, videopress, vimeo, wolfram-cloud, wordpress, wordpress-tv, youtube
- **Transformations** : vers `core/paragraph` ; autres : collage/HTML brut
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Rendu** : Statique (save JS).

---

## Catégorie `reusable` : Réutilisables / motifs (1 blocs)

Source de la catégorie : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ (page par bloc) et https://github.com/WordPress/gutenberg/blob/wp/7.1/packages/block-library/src/


### `core/block` : Pattern

- **Description** : Reuse this design across your site.
- **Catégorie** : `reusable` ; apiVersion 3 ; source : https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/block/block.json
- **Mots-clés** : reusable
- **Attributs** : `ref`:number, `content`:object
- **Supports** : ~~customClassName~~; ~~html~~; ~~inserter~~; ~~renaming~~; interactivity(clientNavigation); ~~customCSS~~
- **Variations** : —
- **Transformations** : —
- **Imbrication** : aucune restriction déclarée dans block.json (enfants éventuels via InnerBlocks libres ou bloc sans enfants)
- **Contexte** : utilise [] ; fournit ['pattern/overrides']
- **Rendu** : Dynamique (rendu PHP, save=null).


---

## Blocs dépendants du thème/CMS : récapitulatif

Tous les blocs de la catégorie `theme` ainsi que les familles : `core/query*`, `core/post-*`, `core/comment*` / `core/comments*` / `core/post-comment*`, `core/navigation*`, `core/term*`, `core/site-*`, `core/template-part`, `core/page-list*`, `core/home-link`, `core/loginout`, `core/read-more`, `core/avatar`, `core/breadcrumbs`. Les widgets lisant la base (`core/archives`, `core/categories`, `core/calendar`, `core/latest-posts`, `core/latest-comments`, `core/tag-cloud`, `core/search`, `core/rss`) sont dynamiques mais fonctionnent hors modèle ; ils restent liés au contenu du site.

## Particularités à connaître (à valider)

- `core/embed` : un seul bloc, les fournisseurs (YouTube, Vimeo, Spotify, etc.) sont des **variations** ; voir sa section.
- `core/freeform` (Classique), `core/missing` (bloc non pris en charge), `core/block` (motif synchronisé, catégorie `reusable`), `core/pattern` : blocs système.
- Les 13 dossiers de `src/` sans `block.json` sont des utilitaires (styles, `utils`, `index.js`...) et ne sont pas des blocs.
- Bloc `core/icon`, `core/math`, `core/playlist`, `core/accordion*`, `core/tabs*`, `core/breadcrumbs`, `core/term-*`, `core/form*` : récents (nouveautés des versions 6.x-7.x) ; la stabilité côté UI n'est pas qualifiée ici. Voir « Points non vérifiés ».

## Points non vérifiés

1. **Alignement exact release / branche** : `wp/7.1` est la branche de backport ; le tag précis embarqué dans WordPress 7.1.3 n'a pas été comparé fichier par fichier.
2. **Variations et transformations** : extraites par regex ; peuvent manquer des entrées générées par code (boucles, `map`) ou être sur-détectées (références `core/...` citées dans un commentaire ou une condition). À contrôler dans les fichiers sources avant implémentation.
3. **Classification statique/dynamique** : heuristique sur `save.js` + `index.php` ; vérifier au cas par cas pour les blocs « Hybride ».
4. **Blocs expérimentaux** : seuls ceux portant `__experimental` dans block.json sont signalés ; l'activation par réglage Gutenberg (page Expériences) n'est pas auditée.
5. **Statut de chaque bloc dans WP 7.1.3 stable vs plugin seul** : certains blocs récents peuvent être livrés uniquement côté plugin ; non recoupé avec la liste officielle de la page core-blocks (rendue dynamiquement, non exploitable par fetch).
6. **Valeurs des attributs par défaut, enums et sélecteurs** : non reproduits (seuls noms et types) ; lire les block.json.
7. **Blocs désactivés par contexte** (ex. `core/freeform` selon réglages, blocs de formulaire derrière un drapeau) non testés dans un WordPress réel.
