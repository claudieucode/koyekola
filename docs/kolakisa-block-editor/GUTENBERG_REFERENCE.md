# Référence : éditeur de blocs Gutenberg (WordPress)

## 1. Versions de référence et date de vérification

| Élément | Valeur | Source |
|---|---|---|
| Date de vérification | **2026-10-27** | date du jour de la recherche |
| WordPress stable de référence | **7.1.3** (réponse `offers[0]` du contrôle de version) | https://api.wordpress.org/core/version-check/1.7/ |
| Plugin Gutenberg (dernière release publique) | **v24.2.0**, publiée le 2026-10-14 | https://api.github.com/repos/WordPress/gutenberg/releases/latest |
| Code source lu pour l'inventaire | branche `wp/7.1` du dépôt Gutenberg, commit `296a4076f89d` (2026-10-27) | https://github.com/WordPress/gutenberg/tree/wp/7.1/packages/block-library/src |

Réserve : la branche `wp/7.1` est la branche de backport de Gutenberg vers WordPress 7.1 ; son état du 27/10/2026 peut contenir des correctifs postérieurs au code livré dans 7.1.3. Le plugin v24.2.0 est plus récent que ce qui est embarqué dans le cœur : des blocs/fonctions peuvent exister dans le plugin sans être dans le cœur stable.

## 2. Périmètre

Ce dossier documente l'éditeur de blocs (« Gutenberg ») pour servir de base à un éditeur de blocs / une bibliothèque de blocs (projet KOYEKOLA / kolakisa-block-editor). Il couvre :
- les concepts : blocs, `block.json`, supports, attributs, variations, transformations, dépréciations, motifs, sérialisation ;
- l'interface et les raccourcis clavier ;
- le registre des blocs natifs : voir `INVENTAIRE_BLOCS.md` (120 `block.json`).

Hors périmètre : développement de blocs personnalisés pas à pas, `theme.json` en détail, packages JS (`@wordpress/components`, etc.), Interactivity API en profondeur, blocs de plugins tiers.

## 3. Distinction cœur / plugin / éditeur de site / expérimental

- **Cœur (WordPress)** : blocs et API livrés avec la version stable (ici 7.1.x). Le code vient du paquet `@wordpress/block-library`, synchronisé depuis le dépôt Gutenberg à chaque version majeure de WP ; les versions mineures (7.1.3) reçoivent des correctifs.
- **Plugin Gutenberg** : sortie à cadence rapide (v24.2.0 au 14/10/2026), contient en avance les futurs blocs/fonctions du cœur. La page des blocs du handbook précise que les blocs marqués expérimentaux ne sont disponibles que si Gutenberg est actif (source : https://developer.wordpress.org/block-editor/reference-guides/core-blocks/).
- **Éditeur de site (FSE)** : même moteur de blocs, appliqué aux modèles (templates), parties de modèle, motifs et styles globaux d'un thème à blocs. Les blocs de catégorie `theme` (`core/query`, `core/post-title`, `core/navigation`, `core/site-title`, etc.) n'ont de sens que dans ce contexte ou dans un thème à blocs ; la page du handbook les signale « fse » (même page ci-dessus). Dans ce projet : **« dépendants du thème/CMS »**.
- **Expérimental** : fonctions instables, API préfixées `__experimental` / `__unstable`, ou blocs marqués expérimentaux (ex. `core/table-of-contents` signalé expérimental dans la doc). Dans `block.json`, la clé `__experimental` est présente sur 7 blocs (voir inventaire). Ne pas s'appuyer sur ces éléments pour une API stable.
- **Blocs dépréciés dans la doc** : Comment Author Avatar, Author, Comment, Text Columns (la page recommande des remplaçants) ; à ne pas recommander pour du nouveau contenu.

## 4. Concepts clés (synthèse)

### 4.1 Sérialisation et grammaire de blocs
Source : https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/
- Un bloc est stocké dans `post_content` sous forme de commentaires HTML : `<!-- wp:paragraph -->…<!-- /wp:paragraph -->`, ou auto-fermant `<!-- wp:name /-->`.
- Le délimiteur ouvrant peut contenir un objet JSON d'attributs : `<!-- wp:heading {"level":3} -->`.
- **Bloc statique** : le HTML rendu est sauvegardé en base, avec les attributs ; relu et validé par la fonction `save`.
- **Bloc dynamique** : rendu côté serveur à chaque affichage (PHP) ; les données viennent de la requête courante.
- Les attributs peuvent être extraits du HTML (`source` : `attribute`, `html`, `rich-text`, `query`…) ou venir de métadonnées de post.
- Parseur : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-serialization-default-parser/ : `parse()` renvoie des blocs `{ blockName, attrs, innerBlocks, innerHTML }` (parseur récursif descendant linéaire, JS et PHP). Non confirmé par ces pages : `innerContent`, `WP_Block_Parser`, `parse_blocks()`/`serialize_blocks()` (connus par ailleurs, voir « Points non vérifiés »).

### 4.2 block.json
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/
Champs documentés : `apiVersion` (actuellement 3, introduit en WP 6.3, recommandé), `name` (`namespace/block-name`), `title`, `category`, `parent`, `ancestor` (WP 6.0), `allowedBlocks` (WP 6.5), `icon`, `description`, `keywords`, `version` (5.8), `textdomain` (5.7), `attributes`, `providesContext`, `usesContext`, `supports`, `styles`, `example`, `variations` (tableau ou chemin de fichier PHP depuis WP 6.7), `selectors` (6.3), `editorScript`, `script`, `viewScript` (5.9), `viewScriptModule` (6.5), `editorStyle`, `style`, `viewStyle` (6.5), `render` (chemin PHP, 6.1), `blockHooks` (6.4).
Schéma : `https://schemas.wp.org/trunk/block.json` (utilisé par tous les block.json de cœur).
Enregistrement : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/ (`registerBlockType`; la page recommande l'enregistrement serveur via block.json).

### 4.3 Supports
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
Clés documentées (défaut) : `allowedBlocks` (false, WP 6.9), `anchor` (false), `autoRegister` (false), `align` (false ; booléen ou liste), `alignWide` (true), `ariaLabel` (false), `background` (WP 6.5 : `backgroundImage`, `backgroundSize` ; `backgroundClip` WP 7.2 selon la page), `className` (true), `color` (`background`, `text`, `button`, `heading`, `link`, `gradients`, `enableContrastChecker`), `contentRole`, `customClassName` (true), `dimensions` (WP 6.2 : `aspectRatio`, `height`, `minHeight`, `minWidth`, `width`), `editableRoot`, `filter.duotone`, `html` (true), `inserter` (true), `interactivity` (`clientNavigation`, `interactive`), `layout` (flow/constrained/flex/grid ; sous-options `allowSwitching`, `allowEditing`, `allowInheriting`, `allowSizingOnChildren`, `allowVerticalAlignment`, `allowJustification`, `allowOrientation`, `allowWrap`, `allowCustomContentAndWideSize`), `listView` (WP 7.0), `lock` (true), `multiple` (true), `position.sticky`, `renaming` (true), `reusable` (true), `shadow` (6.5), `spacing` (`margin`, `padding`, `blockGap`), `typography` (`fontSize`, `lineHeight`, `textAlign` 6.6, `textShadow`), `splitting`, `visibility` (6.9). La page ne documente pas `border` (pourtant utilisé par les blocs : `__experimentalBorder` ou `border`, voir inventaire).

### 4.4 Transformations
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/
Types : `block` (bidirectionnel, joker `"*"`, `isMultiBlock`, `variationName`), `enter` (regExp + Entrée), `files` (dépôt de fichiers), `prefix` (préfixe saisi + espace), `raw` (HTML collé ; `schema`, `selector`, `isMatch`), `shortcode` (balise + attributs). `priority` : plus petit = exécuté d'abord, défaut 10. `isMatch` filtre l'applicabilité. Les transformations « depuis » un bloc de type `enter`/`files`/`prefix`/`raw`/`shortcode` sont uniquement `from`.

### 4.5 Dépréciations
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
Tableau `deprecated` : chaque entrée a `attributes`, `supports`, `save` (anciennes versions, non héritées), `migrate` (optionnel, renvoie des attributs ou `[attributs, innerBlocks]`), `isEligible` (optionnel). Si le `save` courant produit un bloc invalide, les entrées sont testées dans l'ordre ; la première dont le `save` valide gagne, `migrate` s'exécute, puis le bloc est rendu avec le `save` courant (pas de chaîne). Ordre recommandé : de la plus récente à la plus ancienne.

### 4.6 Variations
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/
Champs : `name` (recommandé), `title`, `description`, `category`, `keywords`, `icon`, `attributes`, `innerBlocks`, `innerContent` (Custom HTML uniquement), `example`, `scope` (`block`, `inserter`, `transform` ; défaut `block` + `inserter`), `isDefault`, `isActive` (tableau de noms d'attributs, chemins imbriqués depuis WP 6.6, ou fonction). Enregistrement : paramètre `variations` de `registerBlockType`, `wp.blocks.registerBlockVariation()`, retrait avec `unregisterBlockVariation()`, côté PHP filtre `get_block_type_variations`. Exemples de cœur : `core/embed` (fournisseurs), `core/heading` (h1 à h6), `core/group` (row/stack/grid), `core/social-link`.

### 4.7 Motifs (patterns)
Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/
`register_block_pattern( 'namespace/titre', array )` sur `init`. Propriétés : `title`, `content` (obligatoires), `description`, `categories`, `keywords`, `viewportWidth`, `blockTypes`, `postTypes`, `templateTypes`, `inserter`, `source`. `register_block_pattern_category` (propriété `label`), `unregister_*`. Un motif avec `blockTypes` apparaît comme option de transformation des blocs simples ; motifs d'en-tête/pied via des types `core/template-part/header|footer`. Non couvert par cette page : fichiers de motifs en-tête de thème (dossier `patterns/`) et motifs synchronisés (voir bloc `core/block` dans l'inventaire, catégorie `reusable`).

## 5. Interface de l'éditeur (utilisateur)

Source : https://wordpress.org/documentation/article/wordpress-block-editor/ (mise à jour 2026-09-14)
- Trois zones : barre d'outils supérieure, barre latérale (réglages document + bloc), zone de contenu. Plein écran par défaut.
- Barre supérieure : lien retour (icône W/logo du site), bascule de l'insérateur, annuler/rétablir, **Vue d'ensemble du document** (onglets Liste + Plan avec compte de mots/caractères, temps de lecture), **Palette de commandes** (Cmd/Ctrl + K), enregistrer le brouillon, aperçu, réglages, publier, options (⋮).
- Menu Options : Affichage (barre d'outils en haut, mode sans distraction, mode projecteur, plein écran), Éditeur (visuel / code), Outils (gérer les motifs, raccourcis, guide de bienvenue, copier tout le contenu), Préférences.
- Sélection multiple : Maj+clic, Cmd/Ctrl + A ; la touche ` transforme le texte sélectionné en code en ligne. Vue **zoom arrière** (zoom out) disponible quand « Afficher le modèle » est actif.
- Le classique est remplacé par l'éditeur de blocs depuis WP 5.0 ; le bloc Classique (`core/freeform`) reste disponible.

## 6. Raccourcis clavier (éditeur de blocs)

Source : https://wordpress.org/documentation/article/block-editor-keyboard-shortcuts/ (mise à jour 2026-09-14). Liste complète dans l'éditeur : Maj+Alt+H (Windows) / ⌃⌥H (Mac). Note : la page `…/keyboard-shortcuts/` est celle de l'éditeur classique ; la bonne page est `block-editor-keyboard-shortcuts`.

| Action | Windows/Linux | Mac |
|---|---|---|
| Basculer éditeur visuel / code | Ctrl+Maj+Alt+M | ⇧⌥⌘M |
| Plein écran | Ctrl+Maj+Alt+F | ⇧⌥⌘F |
| Vue Liste (list view) | Maj+Alt+O | ⌃⌥O |
| Afficher/masquer la barre latérale | Ctrl+Maj+, | ⇧⌘, |
| Partie suivante de l'éditeur | Ctrl+` ou Maj+Alt+N | ⌃` ou ⌃⌥N |
| Partie précédente | Ctrl+Maj+` ou Maj+Alt+P | ⌃⇧` ou ⌃⌥P |
| Barre d'outils la plus proche | Alt+F10 | ⌥F10 |
| Enregistrer | Ctrl+S | ⌘S |
| Annuler / rétablir | Ctrl+Z / Ctrl+Maj+Z (ou Ctrl+Y) | ⌘Z / ⇧⌘Z |
| Zoom arrière | Ctrl+Maj+0 | ⇧⌘0 |
| Tout sélectionner (re-presser : bloc parent / tous) | Ctrl+A | ⌘A |
| Effacer la sélection / désélectionner les blocs | Échap / double Échap | idem |
| Dupliquer le(s) bloc(s) | Ctrl+Maj+D | ⇧⌘D |
| Supprimer le(s) bloc(s) | Maj+Alt+Z | ⌃⌥Z |
| Insérer avant / après | Ctrl+Alt+T / Ctrl+Alt+Y | ⌥⌘T / ⌥⌘Y |
| Déplacer vers le haut / bas | Ctrl+Maj+Alt+T / Y | ⇧⌥⌘T / Y |
| Grouper les blocs sélectionnés | Ctrl+G | ⌘G |
| Changer le type de bloc (nouveau paragraphe) | `/` | `/` |
| Coller les styles | Ctrl+Alt+V | ⌘⌥V |
| Lien interne vers un contenu | `[[` | `[[` |
| Gras / italique / souligné | Ctrl+B / I / U | ⌘B / I / U |
| Lien / retirer le lien | Ctrl+K / Ctrl+Maj+K | ⌘K / ⇧⌘K |
| Code en ligne | Ctrl+Alt+X | ⌘⌥X |
| Titre niveau 1 à 6 / paragraphe | Maj+Alt+1…6 / Maj+Alt+0 | ⌘⌥1…6 / (non précisé, voir source) |
| Vue Liste : replier les autres | Alt+L | ⌥L |
| Palette de commandes | Ctrl+K | ⌘K (selon la doc d'interface ci-dessus) |

Remarque : la palette de commandes et « lien » partagent la combinaison K selon le contexte (sélection de texte = lien). Non vérifié dans l'éditeur.

## 7. Liste des sources consultées (URL)

Documentation officielle :
1. https://developer.wordpress.org/block-editor/ : structure du handbook (Getting Started, How-to, Reference, Explanations, Contributor).
2. https://developer.wordpress.org/block-editor/reference-guides/core-blocks/ : page des blocs de cœur (116 entrées signalées ; contenu au-delà de 100 000 caractères non lu).
3. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/
4. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
5. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/
6. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
7. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/
8. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/
9. https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
10. https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/
11. https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-serialization-default-parser/
12. https://wordpress.org/documentation/article/wordpress-block-editor/
13. https://wordpress.org/documentation/article/block-editor-keyboard-shortcuts/ (et, pour exclusion, …/keyboard-shortcuts/ qui concerne l'éditeur classique)

Données machine :
14. https://api.wordpress.org/core/version-check/1.7/ : version stable (7.1.3).
15. https://api.github.com/repos/WordPress/gutenberg/releases/latest : v24.2.0.
16. https://api.github.com/repos/WordPress/gutenberg/git/trees/wp/7.1?recursive=1 et https://raw.githubusercontent.com/WordPress/gutenberg/wp/7.1/packages/block-library/src/<bloc>/{block.json, save.js, index.js, index.php, variations.js, transforms.js} : base de l'inventaire.

## 8. Écarts constatés entre sources

- Le handbook liste 116 blocs ; l'inventaire en compte 120 car il inclut des blocs systèmes ou internes (`core/block`, `core/missing`, `core/freeform`, etc.) et des blocs récents du dépôt qui peuvent ne pas encore figurer dans la page web (à contrôler : `core/icon`, `core/math`, `core/tabs*`, `core/playlist*`, `core/navigation-overlay-close`, `core/term-count`, `core/post-time-to-read`).
- La page des supports mentionne des versions de WordPress (ex. `backgroundClip` en 7.2, `listView` 7.0, `visibility` 6.9) : à lire avec prudence si l'on cible précisément 7.1.3.

## 9. Points non vérifiés

1. Contenu de la page core-blocks au-delà des 100 000 premiers caractères (non lu) ; liste exacte des 116 blocs non recoupée un à un avec les 120 `block.json`.
2. Correspondance exacte entre la branche `wp/7.1` et le code livré dans WordPress 7.1.3 (tag précis non comparé).
3. Parseur : `innerContent`, `WP_Block_Parser`, `parse_blocks()`, `serialize_blocks()` non confirmés par les pages lues.
4. Fichiers de motifs de thème (en-têtes `patterns/*.php`) et motifs synchronisés : non couverts par les pages lues.
5. Équivalent Mac de « paragraphe en Maj+Alt+0 » et exactitude des raccourcis dans l'interface réelle : non testés.
6. Page des raccourcis : tableau « blocs spécifiques » (icônes sociales) vide dans le texte extrait.
7. Aucun test dans un WordPress 7.1.3 réel (rendu, disponibilité des blocs, drapeaux expérimentaux, page « Expériences » de Gutenberg).
8. Les pages de handbook ont été résumées par un modèle de lecture rapide (WebFetch) ; les détails fins (versions d'introduction, défauts) sont à recontrôler dans la page source avant usage normatif.
