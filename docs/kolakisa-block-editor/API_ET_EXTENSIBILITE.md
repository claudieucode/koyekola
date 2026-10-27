# API et extensibilité de l'éditeur de blocs WordPress

Date de vérification : 2026-10-27. Manuel : https://developer.wordpress.org/block-editor/ ; dépôt : https://github.com/WordPress/gutenberg (branche `trunk`). Les passages « (mémoire) » viennent de connaissances générales non rechargées.

---

## 1. Enregistrement d'un bloc : registerBlockType et block.json

Sources : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/ ; https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/

- `registerBlockType(name, config)` : nom `espace/nom-du-bloc` (minuscules, chiffres, tirets, commence par une lettre). Le nom est stocké dans chaque contenu : le changer a des conséquences sur tous les contenus existants. Éviter des espaces de noms génériques (`block/`, `create-block/`).
- Enregistrement recommandé : `block.json` + enregistrement PHP ; le JS seul fonctionne mais n'est pas recommandé.
- Options de config JS : `title`, `description`, `category` (`text`, `media`, `design`, `widgets`, `theme`, `embed`, plus catégories personnalisées), `icon` (Dashicon ou SVG, objet `src`/`background`/`foreground`), `keywords`, `styles`, `attributes`, `example` (avec `innerBlocks`, `viewportWidth`), `variations`, `supports`, `transforms`, `parent`, `ancestor`, `allowedBlocks`, `blockHooks`.
- Champs du `block.json` : `$schema`, `apiVersion` (3 la plus récente), `name`, `title`, `category`, `parent` (enfant direct de), `ancestor` (6.0+, n'importe où dans le sous-arbre), `allowedBlocks` (6.5+), `icon`, `description`, `keywords`, `version` (cache des assets), `textdomain`, `attributes`, `providesContext`, `usesContext`, `selectors` (6.3+), `supports`, `styles`, `example`, `variations`, `blockHooks` (6.4+, positions `before`, `after`, `firstChild`, `lastChild`), `editorScript`, `script`, `viewScript`, `viewScriptModule` (6.5+), `editorStyle`, `style`, `viewStyle` (6.5+), `render` (fichier PHP avec `$attributes`, `$content`, `$block`).
- Collections : `registerBlockCollection(espace, { title, icon })` regroupe les blocs d'un même espace dans l'inserteur.
- Versions d'API (https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/) : v2 (WP 5.6) impose `useBlockProps()` dans `edit` et `useBlockProps.save()` dans `save` (les classes et styles générés ne sont plus ajoutés automatiquement) ; v3 (WP 6.3) pour l'éditeur dans un iframe ; d'après la page, WP 7.0 se base sur les seuls blocs présents dans le contenu, et Gutenberg 23.6 / WP 7.1 utilise toujours l'iframe quelle que soit la version.

---

## 2. Attributs

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/

- Chaque attribut a un `type` ou un `enum`. Types : `null`, `boolean`, `object`, `array`, `string`, `integer`, `number`. Les valeurs sont vérifiées au parsing.
- Sans `source` : l'attribut est stocké en JSON dans le commentaire délimiteur. Avec `source` : lu depuis le HTML enregistré (le `save` doit alors produire ce HTML).
- Sources : `attribute` (+ `attribute`), `text`, `html` (typique de RichText), `query` (tableau d'objets via `selector` + sous-`query`), `meta` (déprécié). Sélecteur : toute chaîne compatible `querySelector`, à défaut la racine du bloc. `default` si rien ne correspond.
- `role` : `content` (contenu éditable, éligible au mode « contenu seul ») ou `local` (données temporaires que le sérialiseur ignore).
- Le bloc de cœur `core/missing` utilise une source `raw` (voir le dépôt), non décrite sur cette page.
- Recommandation de la doc : mettre autant de données que possible dans le HTML plutôt que dans le commentaire, pour réduire le volume stocké.

---

## 3. Edit, save, useBlockProps

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/

- `edit` : reçoit `attributes`, `isSelected`, `setAttributes` (accepte une fonction de mise à jour depuis WP 6.9), `context`. L'élément racine doit recevoir `useBlockProps()` ; il doit être un élément DOM natif ou un composant qui transmet les props (un `Fragment` ou `ServerSideRender` en racine est invalide). Ne pas muter les attributs.
- `save` : pure et sans état, dépend uniquement des attributs ; pas de hooks d'état ni de sélecteurs de magasin ; retourne une hiérarchie d'éléments ; une chaîne simple est échappée (`RawHTML` est possible mais risqué). `null` pour un bloc dynamique rendu côté serveur.
- Blocs dynamiques : rendu par PHP (`render` du `block.json`, `render_callback`) avec `$attributes`, `$content`, `$block`.

---

## 4. InnerBlocks

Source : https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/ ; templates : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-templates/

- Un seul `InnerBlocks` par bloc : `<InnerBlocks />` dans `edit`, `<InnerBlocks.Content />` dans `save`.
- Props : `allowedBlocks`, `template`, `templateLock` (`all`, `insert`, `contentOnly`), `orientation` (horizontal : change les icônes de déplacement et le glisser-déposer, pas la mise en page), `defaultBlock` + `directInsert`.
- Hook `useInnerBlocksProps` (appeler `useBlockProps` d'abord) pour moins d'éléments enveloppants ; `useInnerBlocksProps.save()` côté sauvegarde.
- `renderAppender` : non couvert par la page téléchargée.

---

## 5. Contexte de bloc

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-context/

- Le parent déclare `providesContext` (clé de contexte → nom de son attribut) ; l'enfant déclare `usesContext` (liste de clés). Recommandation : clés préfixées (`mon-plugin/recordId`).
- Lecture : `props.context` en JS ; `$block->context` en PHP (3e argument du `render_callback`).
- Limites : seules les valeurs d'attributs du bloc fournisseur ; indisponible dans `save` ; un bloc ne reçoit que ce qu'il déclare.

---

## 6. Transformations, variations, styles, modèles, liaisons

Voir REGLAGES_ET_TRANSFORMATIONS.md. Liaisons de blocs : `registerBlockBindingsSource` (JS : `name`, `label`, `usesContext`, `getValues`, `setValues`, `canUserEditValue`, `getFieldsList` 6.9+) et `register_block_bindings_source` (PHP : `label`, `uses_context`, `get_value_callback`) ; filtre `block_bindings_source_value` (6.7+). Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/

---

## 7. Filtres de blocs

Source : https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/

| Filtre | Côté | Rôle |
|---|---|---|
| `block_type_metadata` | PHP | Modifie les données brutes du `block.json` |
| `block_type_metadata_settings` | PHP | Modifie les réglages traités (clés personnalisées) |
| `register_block_type_args` | PHP | Modifie les arguments avant enregistrement serveur (priorité sur le client) |
| `blocks.registerBlockType` | JS | Modifie les réglages à l'enregistrement client (s'exécute aussi sur chaque dépréciation) |
| `render_block` / `render_block_{espace/bloc}` | PHP | Modifie le HTML du front-end (sans effet dans l'éditeur) |
| `blocks.getSaveElement` | JS | Modifie l'élément retourné par `save` |
| `blocks.getSaveContent.extraProps` | JS | Ajoute des props à la racine de `save` ; risque d'invalidation de contenu existant |
| `blocks.getBlockDefaultClassName` | JS | Remplace la classe `wp-block-{nom}` |
| `blocks.switchToBlockType.transformedBlock` | JS | Modifie un résultat de transformation |
| `blocks.getBlockAttributes` | JS | Modifie les attributs après parsing et avant validation |
| `editor.BlockEdit` | JS | Enveloppe le composant `edit` (panneaux d'inspecteur par exemple) ; coûteux car s'applique à tous les blocs |
| `editor.BlockListBlock` | JS | Enveloppe le conteneur du bloc (classes, `wrapperProps`) |
| `editor.postContentBlockTypes` | JS | Blocs éditables dans un modèle verrouillé |
| `allowed_block_types_all` | PHP | Blocs disponibles dans l'inserteur |
| `block_categories_all` | PHP | Catégories de blocs |

Retrait de blocs : `unregisterBlockType` en JS (liste de refus ou d'autorisation).

---

## 8. Magasins @wordpress/data

Sources : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/ ; https://developer.wordpress.org/block-editor/reference-guides/data/

- Concepts : `createReduxStore(nom, { reducer, actions, selectors, resolvers, initialState })`, `register`, `select`, `dispatch`, `useSelect`, `useDispatch`, `subscribe`, résolveurs (premier appel d'un sélecteur), contrôles (dépréciés au profit des thunks), plugins via `use`.
- Magasins listés : `core`, `core/annotations`, `core/block-directory`, `core/block-editor`, `core/blocks`, `core/commands`, `core/customize-widgets`, `core/edit-post`, `core/edit-site`, `core/edit-widgets`, `core/editor`, `core/keyboard-shortcuts`, `core/notices`, `core/preferences`, `core/rich-text`, `core/viewport`. `core/interface` et `core/nux` ne figurent pas dans cette liste (voir « Points non vérifiés »).
- Rôles principaux (lecture des intitulés de la liste) : `core/block-editor` = arbre de blocs et sélection ; `core/blocks` = types de blocs enregistrés ; `core/editor` = document ; `core/edit-post` = interface de l'éditeur d'articles ; `core/preferences` = préférences utilisateur ; `core/notices` ; `core/commands` ; `core/keyboard-shortcuts`.
- Notices : `createSuccessNotice(message, { type: 'snackbar', context })`, composants `InlineNotices` et `SnackbarNotices` (trois dernières). Source : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-notices/

---

## 9. Commandes et raccourcis clavier

- Commandes (https://developer.wordpress.org/block-editor/reference-guides/packages/packages-commands/) : `useCommand`, `useCommands`, `useCommandLoader`, actions `open`/`close`, sélecteurs `isOpen`, `getCommands`, `getCommandLoader`, catégories, contextes.
- Raccourcis (https://developer.wordpress.org/block-editor/reference-guides/packages/packages-keyboard-shortcuts/) : `ShortcutProvider`, `store`, `useShortcut(name, callback, { isDisabled })`. `registerShortcut` et la forme de l'objet (nom, catégorie, description, `keyCombination`, `aliases`) ne figurent pas sur la page ; le code de `trunk` montre l'usage (`name`, `category`, `description`, `keyCombination { modifier, character }`, `aliases`). Source du code : https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/components/global-keyboard-shortcuts/register-shortcuts.jsx

---

## 10. SlotFill et extensions de l'interface

Source : https://developer.wordpress.org/block-editor/reference-guides/slotfills/

SlotFills listés : `MainDashboardButton`, `PluginBlockSettingsMenuItem`, `PluginDocumentSettingPanel`, `PluginMoreMenuItem`, `PluginPostPublishPanel`, `PluginPostStatusInfo` (ajoute des éléments à la fin du panneau Résumé), `PluginPrePublishPanel`, `PluginSidebar`, `PluginSidebarMoreMenuItem`. Enregistrement par `registerPlugin` (`@wordpress/plugins`). Seul `MainDashboardButton` n'existe pas dans les deux éditeurs (articles et site) ; la page ne décrit que `PluginPostStatusInfo` et `PluginDocumentSettingPanel` en détail.

Mécanisme (mémoire) : un `Slot` est un emplacement rendu par l'interface, un `Fill` est le contenu fourni par un plugin ; la correspondance se fait par nom.

---

## 11. Fonctions de @wordpress/blocks utiles à une implémentation tierce

Source : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/

- Parsing : `parse`, `rawHandler`, `pasteHandler`.
- Sérialisation : `serialize`, `serializeRawBlock`, `getSaveContent`, `getSaveElement`, `getBlockContent`.
- Création : `createBlock`, `cloneBlock`, `createBlocksFromInnerBlocksTemplate`, `switchToBlockType`.
- Validation : `validateBlock` (préféré), `isValidBlockContent` (déprécié, risque de perte de données), `sanitizeBlockAttributes`, `doBlocksMatchTemplate`.
- Gestionnaires : `get/setUnregisteredTypeHandlerName`, `get/setFreeformContentHandlerName`.
- Liaisons : `registerBlockBindingsSource`, `unregisterBlockBindingsSource`.
- Côté PHP : `parse_blocks()` (retourne `blockName`, `attrs`, `innerBlocks`, `innerHTML`, `innerContent`), filtre `block_parser_class`, `serialize_blocks()`. Source : https://developer.wordpress.org/reference/functions/parse_blocks/

---

## 12. Reproductible dans une architecture native ou spécifique à WordPress

Analyse : lecture croisée des sections précédentes. Il s'agit d'une appréciation, pas d'un fait de la documentation.

| Capacité | Reproductible nativement | Spécifique à WordPress | Commentaire |
|---|---|---|---|
| Modèle de document en arbre de blocs (`name`, `attributes`, `innerBlocks`, `clientId`) | Oui | Non | Format en mémoire simple, source : https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/ |
| Définition de bloc déclarative (nom, attributs typés, supports, variations) | Oui | Le fichier `block.json` et le schéma | À remplacer par un schéma JSON propre |
| Attributs typés avec valeur par défaut, rôle `content`/`local` | Oui | Non | Les « sources » (lecture dans le HTML) sont un artefact du stockage HTML ; inutiles avec un format de données structuré |
| `save` comme fonction pure produisant du HTML + validation par comparaison | Non nécessaire | Oui | Né du choix de stocker du HTML dans `post_content` ; un format JSON rend la validation de markup inutile (voir PERSISTANCE_ET_COMPATIBILITE.md) |
| Dépréciations (`attributes`, `supports`, `save`, `migrate`, `isEligible`) | Remplaçables par des migrations de schéma versionnées | Dans sa forme actuelle, oui | La notion de migration reste nécessaire |
| Supports + `theme.json` (fonctions activées par bloc, préréglages, cascade cœur/thème/utilisateur) | Oui (concept) | Format `theme.json` et noms de variables | La cascade d'origines et l'adhésion par bloc sont transposables |
| Contexte de bloc (`providesContext`/`usesContext`) | Oui | Non | Équivalent du contexte React |
| InnerBlocks, templates, `templateLock`, `lock` | Oui | Non | Règles de structure et permissions locales |
| Transformations (`block`, `enter`, `prefix`, `raw`, `files`, `shortcode`) | Oui, sauf `shortcode` | `shortcode` (hérité WordPress) | `raw`/`pasteHandler` demande un nettoyeur HTML |
| Variations et styles de bloc (`is-style-*`) | Oui | Les noms de classes | |
| Modèles synchronisés (`wp_block`), remplacements | Oui (concept) | Le stockage en type de contenu `wp_block` | Prévoir référence par identifiant + surcharges |
| Liaisons de blocs (`metadata.bindings`) | Oui | Sources `core/post-meta` etc. | |
| Magasins `@wordpress/data`, SlotFill, `registerPlugin`, palette de commandes, raccourcis | Oui | Les paquets eux-mêmes sont utilisables hors WordPress (open source) | Dépendances React |
| Filtres PHP (`render_block`, `register_block_type_args`...) | Équivalent à prévoir (hooks) | Le système de hooks WordPress | |
| Rendu dynamique côté serveur (`render` PHP, ServerSideRender) | Selon la pile | PHP/REST de WordPress | |
| Répertoire de blocs, installation de plugins | Non | Oui | |
| Autosave, révisions, verrouillage d'article (`_edit_lock`) | À reconstruire | Implémentés dans le cœur (types `revision`, REST) | Voir PERSISTANCE_ET_COMPATIBILITE.md |

---

## Points non vérifiés

- Détail de la forme `registerShortcut` : lu dans le code de `trunk`, absent de la page de documentation du paquet.
- Magasins `core/interface`, `core/nux`, `core/block-directory` : seul `core/interface` est absent de la page de liste ; je n'ai pas vérifié s'il existe encore. Les rôles des magasins sont déduits des intitulés.
- Description de SlotFill (Slot/Fill par nom) : mémoire. Les noms viennent de la page ; l'origine de chaque SlotFill (paquet `editor` ou `edit-post`) n'est pas précisée par la source.
- `renderAppender` d'InnerBlocks, `useBlockProps` détaillé, `registerBlockStyle` côté `block.json` : non couverts par les pages téléchargées.
- Versions (6.x, 7.x) indiquées par les pages ; non recoupées avec les notes de version.
- Fonctions `unregisterBlockType`, `registerBlockVariation`, `register_block_type` PHP : la page « Block Registration » ne les documente pas ; seules des mentions croisées ont servi.
- Interactivity API et ServerSideRender : cités, non explorés.
- Analyse du tableau 12 : jugement personnel, à valider selon l'architecture cible.
