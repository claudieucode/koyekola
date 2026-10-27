# Réglages de blocs (block supports), theme.json, transformations, variations, styles et modèles

Date de vérification : 2026-10-27. Sources principales : manuel développeur https://developer.wordpress.org/block-editor/ . Les éléments « (mémoire) » viennent de connaissances générales non rechargées pendant cette session.

---

## 1. Block supports

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/

Déclarés dans l'objet `supports` du `block.json`. Les propriétés générées s'appliquent à l'élément racine via `useBlockProps()` (édition), `useBlockProps.save()` (sauvegarde statique) ou `get_block_wrapper_attributes()` (PHP, blocs dynamiques).

| Support | Défaut | Sous-clés (défaut) | Effet / données générées |
|---|---|---|---|
| `anchor` | false | — | Champ « Ancre HTML » (attribut `id`) et bouton de copie du lien direct |
| `align` | false | `true` ou tableau (left, center, right, wide, full) | Contrôles d'alignement ; attribut `align` (chaîne, sans défaut) |
| `alignWide` | true | — | Active l'alignement large côté thème ; `false` le désactive pour le bloc |
| `allowedBlocks` (6.9+) | false | — | Interface de choix des blocs enfants autorisés ; attribut `allowedBlocks` à passer à `useInnerBlocksProps` |
| `ariaLabel` | false | — | Permet un aria-label sans champ d'interface |
| `autoRegister` | false | — | Enregistre côté éditeur les blocs PHP seuls avec `render_callback` (ServerSideRender) ; API v3 |
| `background` (6.5+) | null | `backgroundImage`, `backgroundSize`, `backgroundClip` (7.2+) (tous false) | Objet `style.background` (`backgroundImage` avec `url`, `id`, `source`, `title` ; `backgroundPosition` ; `backgroundSize` ; `backgroundClip`) |
| `className` | true | — | Ajoute la classe `wp-block-<nom>` à la racine |
| `color` | null | `background` (true), `text` (true), `gradients` (false), `link` (false), `button` (false, 6.5+), `heading` (false, 6.5+), `enableContrastChecker` (true) | Attributs `backgroundColor`, `textColor`, `gradient` (slugs de préréglage) et `style.color.*` (valeurs libres) ; `style.elements.link/button/heading` ; vérificateur de contraste |
| `contentRole` (6.9+) | false | — | Marque le bloc comme contenu (éditable en mode « contenu seul ») |
| `customClassName` | true | — | Champ « Classe(s) CSS supplémentaire(s) » |
| `dimensions` (6.2+) | null | `aspectRatio`, `height`, `minHeight`, `minWidth`, `width` (false) | `style.dimensions.*` ; adhésion du thème requise |
| `editableRoot` | false | — | Le bloc fonctionne quand le canevas est l'hôte `contenteditable` |
| `filter` | null | `duotone` (false) | Contrôle duotone ; préréglages issus de `theme.json` ; `selectors.filter.duotone` pour cibler un sous-élément |
| `html` | true | — | Autorise « Modifier en HTML » ; `false` le retire |
| `inserter` | true | — | `false` = bloc masqué dans l'inserteur, le menu de transformation et le Style Book |
| `interactivity` | false | `clientNavigation`, `interactive` | Marque l'usage de l'API d'interactivité |
| `layout` | null | `default`, `allowSwitching` (false), `allowEditing` (true), `allowInheriting` (true, flow), `allowSizingOnChildren` (false, flex), `allowVerticalAlignment` (true, flex), `allowJustification` (true), `allowOrientation` (true, flex), `allowWrap` (true, flex), `allowCustomContentAndWideSize` (true, constrained) | Mise en page des conteneurs ; `true` = type `flow` |
| `listView` (7.0+) | false | — | Panneau Vue en liste dans l'inspecteur pour les blocs internes |
| `lock` | true | — | Permet verrouiller/déverrouiller depuis Options ; `false` retire |
| `multiple` | true | — | `false` = une seule instance par contenu |
| `position` (6.2+) | null | `sticky` (false) | `style.position` (`type: sticky`, `top`) ; sticky uniquement pour blocs de racine |
| `renaming` (6.5+) | true | — | Renommage utilisateur |
| `reusable` | true | — | `false` retire « Créer un modèle » |
| `shadow` (6.5+) | false | — | Sélecteur d'ombre ; `style.shadow` ; préréglages dans `theme.json` |
| `spacing` | null | `margin`, `padding`, `blockGap` (false) | `style.margin`, `style.padding`, `style.spacing.blockGap` ; tableaux pour restreindre aux côtés ou aux axes (on ne mélange pas côtés et axes) ; `blockGap` n'accepte que `vertical`/`horizontal` ; adhésion du thème requise |
| `splitting` | non précisé | — | Entrée divise le bloc (blocs texte à un seul RichText) |
| `typography` | null | `fontSize`, `lineHeight`, `textAlign` (6.6+), `textShadow` (tous false) | `fontSize` (préréglage) et `style.typography.*` ; `lineHeight` requiert l'adhésion du thème |
| `visibility` (6.9+) | true | — | Permet masquer le bloc depuis Options |

Éléments vus ailleurs : `border` (radius, couleur, style, largeur) apparaît dans `theme.json` (section 2) et dans la doc utilisateur « Border & Shadow » ; sa fiche détaillée n'a pas été téléchargée (voir « Points non vérifiés »). `customCSS`, `className: false`, `html: false` apparaissent dans le `block.json` des blocs `core/missing` et `core/freeform`.

Sources complémentaires :
- Metadonnées de bloc : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/
- Doc utilisateur des réglages : https://wordpress.org/documentation/article/work-with-blocks/ (renvoie aux guides Color, Typography, Dimensions, Border & Shadow, Layout, Advanced).

### Réglages visibles par l'utilisateur et leur support

| Panneau de la barre latérale | Support déclencheur |
|---|---|
| Couleur | `color` |
| Typographie | `typography` |
| Dimensions | `spacing`, `dimensions` |
| Bordure et ombre | `border`, `shadow` |
| Mise en page | `layout` |
| Avancé : ancre HTML | `anchor` |
| Avancé : classe(s) CSS | `customClassName` |
| Modifier en HTML | `html` |
| Verrouiller / Masquer / Renommer | `lock`, `visibility`, `renaming` |
| Créer un modèle | `reusable` |

---

## 2. Dépendance à theme.json

Source : https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/

- Structure : `version` (3 est la plus récente, introduite en WordPress 6.6), `settings`, `styles`, `customTemplates`, `templateParts`.
- `settings` configure l'éditeur : quelles options sont visibles et quels préréglages sont proposés. `styles` définit les valeurs appliquées en CSS.
- Principe d'adhésion : les réglages agissent comme des interrupteurs. Un thème ne peut pas activer une fonction que le bloc n'implémente pas (ex. lettrine sur un bloc qui ne la gère pas). L'interface est générée à partir des supports déclarés.
- Groupes de `settings` : `color` (palettes, dégradés, duotones, couleurs personnalisées, texte, fond, liens), `typography` (tailles, familles, tailles personnalisées, lettrine, styles et graisses, interlignage désactivé par défaut), `spacing` (unités, `blockGap`, marge et remplissage désactivés par défaut, `spacingScale`, `spacingSizes`), `border` (rayon, couleur, style, largeur désactivés par défaut), `layout` (`contentSize`, `wideSize`), `appearanceTools` (booléen, faux par défaut ; active un groupe de contrôles : image de fond, bordures, couleur de lien, dimensions, position sticky, espacement, marge, remplissage, interlignage), `custom` (valeurs libres devenant des variables CSS).
- `blockGap` : `null` par défaut (contrôle masqué, rien en sortie) ; `true` affiche le contrôle et génère le CSS ; `false` masque le contrôle mais génère le CSS défini dans `theme.json`.
- Préréglages convertis en CSS : variables `--wp--preset--{catégorie}--{slug}` ; classes `.has-{slug}-{catégorie}` ; classes marquées `!important`. Une couleur de palette produit trois classes (texte, fond, bordure) et une variable ; un dégradé une classe et une variable ; une taille de police une classe et une variable ; une taille d'espacement une variable ; un duotone ni l'un ni l'autre. Les valeurs `custom` deviennent `--wp--custom--<nom>` (clés imbriquées jointes par `--`, camelCase en kebab-case).
- Par bloc : `settings.blocks["core/paragraph"]` surcharge les réglages ; `styles.blocks` donne les styles ; sélecteur par défaut `.wp-block-<nom>`, remplaçable par `selectors` du `block.json` (6.3+) ; éléments `link`, `h1` à `h6`, `button`, `caption`, `heading` au niveau global ou dans un bloc.
- Cascade : cœur, thème, utilisateur (Site Editor, Styles). Le CSS de la dernière origine l'emporte et seul le CSS retenu est mis en file, ce qui limite les conflits de spécificité. Pour la compatibilité, `add_theme_support` est converti en réglages équivalents ; `theme.json` a priorité.
- Remarque (pas dans cette page) : `shadow` en tant que groupe de `settings` n'a pas été confirmé ici ; la fiche des supports confirme que les préréglages d'ombre viennent de `theme.json`.

Conséquence pour une architecture native : un système de « supports » n'a de sens qu'avec un fichier de contraintes de thème équivalent (palettes, échelles d'espacement, tailles de police) ; sinon il faut fournir des valeurs par défaut globales.

---

## 3. Transformations entre blocs

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/

### 3.1 Mécanisme

Déclarées dans `transforms` (clés `to` et `from`).

| Type | Sens | Champs | Quand |
|---|---|---|---|
| `block` | to / from | `blocks` (noms ou `"*"`), `transform(attributes, innerBlocks)`, `variationName`, `isMatch`, `isMultiBlock`, `priority`, `shortcuts` | Menu « Transformer en » de la barre d'outils |
| `enter` | from | `regExp`, `transform(content)`, `priority` | Appui sur Entrée après un texte correspondant (ex. trois tirets ou plus donnent un Séparateur) |
| `files` | from | `transform(files)`, `isMatch`, `priority` | Dépôt de fichiers (ex. bloc Fichier, priorité 15 pour passer après les autres) |
| `prefix` | from | `prefix`, `transform(content)`, `priority` | Préfixe tapé suivi d'une espace en début de ligne |
| `raw` | from | `transform(node)`, `schema`, `selector`, `isMatch`, `priority` | Collage, dépôt, « Convertir en blocs » (ex. un paragraphe contenant seulement une URL devient un bloc Embed) |
| `shortcode` | from | `tag`, `transform`, `attributes`, `isMatch`, `priority` | Conversion de shortcodes pendant le traitement brut |

- `priority` : valeur la plus basse exécutée en premier, défaut 10.
- `isMatch` : booléen ; `false` masque ou saute la transformation. Les arguments dépendent du type.
- `ungroup` : clé distincte pour dégrouper (retourne les blocs qui remplacent le groupe).
- Filtre `blocks.switchToBlockType.transformedBlock` : modifie chaque résultat d'une transformation ; les transformations sont plusieurs-vers-plusieurs (https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/).
- API : `switchToBlockType`, `createBlock`, `cloneBlock`, `rawHandler`, `pasteHandler` (https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/).

### 3.2 Table des conversions principales

Les conversions suivantes sont issues de ma connaissance des blocs de cœur (mémoire), non téléchargées pendant cette session. Seule la logique de transformation est documentée à l'URL ci-dessus. À valider avant de s'y fier.

| Bloc source | Peut devenir | Remarques |
|---|---|---|
| Paragraphe | Titre, Liste, Citation, Code, Préformaté, Verset, Groupe, Colonnes, Bouton(s), HTML personnalisé (mémoire) | Conserve le contenu ; Ctrl/Cmd+Maj+Alt chiffre 1-6 pour passer en titre (raccourcis confirmés, voir INVENTAIRE_INTERFACE.md) |
| Titre | Paragraphe, Liste, Citation, Groupe (mémoire) | Maj+Alt+0 pour revenir à Paragraphe (confirmé) |
| Liste | Paragraphe, Titre, Citation (mémoire) | Un item par bloc ou ligne selon le cas |
| Citation | Paragraphe, Titre, Liste, Groupe, Pull quote (mémoire) | — |
| Image | Galerie, Couverture, Média et texte, Fichier (mémoire) | Plusieurs images sélectionnées vers Galerie |
| Colonne(s) / Rangée / Pile / Groupe | Variantes du bloc Groupe (variations) ; Groupe/Dégrouper (confirmé : Ctrl/Cmd+G et clé `ungroup`) | Les rangées et piles sont des variations du Groupe (mémoire) |
| Classique (`core/freeform`) | Blocs via « Convertir en blocs » | Voir PERSISTANCE_ET_COMPATIBILITE.md |
| HTML personnalisé / Bloc invalide | « Convertir en blocs » ou « Convertir en HTML » | Voir PERSISTANCE_ET_COMPATIBILITE.md |
| Tout bloc | Modèle synchronisé ou non (Créer un modèle) ; Détacher | Documenté : https://wordpress.org/documentation/article/reusable-blocks/ |
| Texte brut collé | Blocs par balises HTML (`raw`) | Via `pasteHandler` |
| Modèle (pattern) à `blockTypes` | Apparaît dans le menu de transformation du bloc ciblé | Documenté : blocs simples sans blocs internes, tous les blocs sélectionnés doivent être représentés dans le modèle |

Raccourcis de saisie (formats « prefix » / « enter » dans l'éditeur) : la doc de l'éditeur classique liste `*`, `-`, `1.`, `1)`, `##` à `######`, `>`, `---` et les backticks (https://wordpress.org/documentation/article/keyboard-shortcuts-classic-editor/) ; leur équivalence exacte dans l'éditeur de blocs n'a pas été vérifiée.

---

## 4. Variations de bloc

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/

- Une variation est une version préréglée d'un bloc existant (attributs et blocs internes initiaux).
- Champs : `name` (identifiant, quasi obligatoire), `title`, `description`, `icon`, `attributes`, `innerBlocks`, `example` (`undefined` désactive l'aperçu), `scope`, `isDefault`, `isActive` (tableau de noms d'attributs recommandé, ou fonction), `category`, `keywords`, `innerContent` (bloc HTML personnalisé), `shortcut`.
- Portées (`scope`) : `block` (sélecteur de variation à l'insertion, utilisé par Colonnes et Requête), `inserter` (défaut avec `block`), `transform` (sélecteur de variation de transformation).
- `isDefault: true` remplace l'entrée du bloc de base dans l'inserteur (première enregistrée gagne).
- Enregistrement : clé `variations` dans `block.json` (ou fichier PHP, 6.7+) ; `registerBlockVariation(bloc, variation)` (JS) ; filtre PHP `get_block_type_variations` ; `unregisterBlockVariation`.

---

## 5. Styles de bloc

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/ ; clé `styles` : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/

- Un style de bloc ajoute une classe `is-style-<nom>` sur l'élément racine. Exemple : `fancy-quote` donne `is-style-fancy-quote`.
- JS : `registerBlockStyle(bloc, { name, label, isDefault })` ; le style par défaut n'ajoute aucune classe ; `unregisterBlockStyle`. Pour désenregistrer après l'enregistrement, charger le script avec les dépendances `wp-blocks`, `wp-dom-ready`, `wp-edit-post` et appeler dans `wp.domReady()`.
- PHP : `register_block_style(bloc, args)` avec `name`, `label` et l'un de : `inline_style`, `style_handle`, `style_data` (6.6+, tableau de type theme.json, modifiable via Styles globaux) ; `is_default` ; `unregister_block_style` (impossible pour les styles enregistrés côté client).
- Les styles apparaissent dans l'onglet Styles de la barre latérale du bloc (survol = aperçu, clic = application) : https://wordpress.org/documentation/article/work-with-blocks/

---

## 6. Modèles (patterns)

Sources : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/ ; https://wordpress.org/documentation/article/reusable-blocks/ ; https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/

### 6.1 Modèles enregistrés (non synchronisés)

- `register_block_pattern( 'espace/titre', props )` sur `init` ; `unregister_block_pattern`.
- Propriétés : `title`, `content` (obligatoires), `description` (texte caché utile à la recherche), `categories` (à enregistrer d'abord via `register_block_pattern_category`, propriété `label` obligatoire), `keywords`, `viewportWidth`, `blockTypes` (active la transformation de modèle), `postTypes` (restreint aux types listés), `templateTypes`, `inserter` (`false` = non visible), `source`.
- Usages liés : transformations de modèle, liste de modèles du bloc Requête, modèles sémantiques pour les zones d'en-tête/pied de page des thèmes à blocs.
- Remarque : cette page ne documente ni le répertoire `patterns/` d'un thème ni les en-têtes de fichier ; non vérifié.

### 6.2 Modèles synchronisés et non synchronisés (utilisateur)

- Depuis WordPress 6.3, « Reusable blocks » devient « Patterns » ; un modèle synchronisé se comporte comme un ancien bloc réutilisable.
- Création : sélectionner le(s) bloc(s) > menu trois points > « Create pattern » > nom > option « Synced » > Créer. Les modèles synchronisés apparaissent dans l'onglet « Synced patterns » de l'inserteur, par `/nom`, ou par recherche.
- Modification : directement dans l'article (le flux d'enregistrement mentionne le modèle) ou via Options > Gérer les modèles ; toute modification est répercutée partout.
- Suppression : depuis Gérer les modèles ; les blocs concernés affichent « Block has been deleted or is unavailable ».
- Détacher (« Detach pattern », ex-« Convert to Regular Block ») : transforme en blocs ordinaires, indisponible si le modèle est verrouillé.
- Non synchronisé : point de départ copié et modifié indépendamment.
- Remplacements de modèle (`core/pattern-overrides`) : un bloc du modèle reçoit `metadata.name` et `source: core/pattern-overrides` ; chaque instance stocke ses valeurs dans l'attribut `content` indexé par ce nom (liaisons de blocs, WP 6.5+).

---

## 7. Liaisons de blocs (Block Bindings) — complément

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/

Stockage dans `metadata.bindings` du commentaire de bloc. Attributs liables : Image (`id`, `url`, `title`, `alt`, `caption`), Titre et Paragraphe (`content`), Bouton (`url`, `text`, `linkTarget`, `rel`), Navigation Link/Submenu (`url`), Post Date (`datetime`). Sources du cœur : `core/post-meta`, `core/post-data` (6.9+), `core/term-data` (6.9+), `core/pattern-overrides`.

---

## 8. Verrouillage et modèles de contenu

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-templates/

- `templateLock` : `all` (aucune insertion, déplacement ni suppression), `insert` (pas d'ajout/retrait mais déplacement permis), `contentOnly` (aucune opération ; blocs sans contenu masqués de la vue en liste et non focalisables ; les enfants ne peuvent pas surcharger). Héritage : une zone sans verrou propre utilise celui du parent ; la racine utilise celui du type de contenu.
- Verrou par bloc : attribut `lock` (`remove`, `move`) ; il prend le pas sur `templateLock`. Exemple : `templateLock: all` plus `move: false` / `remove: false` sur un seul bloc le laisse libre.
- Interface : Options > Verrouiller (cases mouvement et suppression) ; icône cadenas dans la barre d'outils et la vue en liste (https://wordpress.org/documentation/article/work-with-blocks/).

---

## Points non vérifiés

- Table des conversions du 3.2 : établie de mémoire sur les blocs de cœur. Chaque ligne marquée « (mémoire) » doit être confirmée en lisant les `transforms` de `packages/block-library/src/<bloc>/transforms.js` dans https://github.com/WordPress/gutenberg.
- Fiche détaillée des supports `border`, `customCSS`, `color.__experimentalDuotone` : non téléchargée ou non listée sur la page des supports ; la mention de `border` vient de `theme.json` et de la doc utilisateur.
- Groupe `shadow` de `theme.json`, `settings.shadow.presets` : non confirmé.
- Répertoire `patterns/` des thèmes, en-têtes de fichier (Title, Slug, Categories, Block Types, Post Types, Inserter) : non vérifiés (page « Block Patterns » ne les mentionne pas).
- Équivalents « prefix/enter » exacts des raccourcis de saisie dans l'éditeur de blocs : non vérifiés.
- Versions d'introduction : la fiche des supports donne plusieurs numéros de version (ex. `backgroundClip` 7.2+, `listView` 7.0+) ; ils n'ont pas été recoupés avec les notes de version de WordPress.
- Comportement de `splitting`, `editableRoot` et `autoRegister` : description reprise de la fiche, non testée.
- Pas d'essai en conditions réelles ; tout est documentaire.
