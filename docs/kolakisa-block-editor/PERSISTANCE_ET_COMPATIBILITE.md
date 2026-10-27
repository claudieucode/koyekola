# Persistance, sérialisation et compatibilité de l'éditeur de blocs WordPress

Date de vérification : 2026-10-27. Les passages « (mémoire) » viennent de connaissances générales non rechargées pendant cette session.

---

## 1. Format de sérialisation (commentaires `<!-- wp:... -->`)

Sources : https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/ ; https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/ ; https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/

- La grammaire de blocs est un commentaire HTML, soit autofermant, soit avec balise ouvrante et fermante. L'ouverture peut contenir un objet JSON d'attributs :

```html
<!-- wp:paragraph {"key": "value"} -->
<p>Welcome to the world of blocks.</p>
<!-- /wp:paragraph -->
```

- La forme autofermante existe (mentionnée, non illustrée par la page des concepts) ; ex. `<!-- wp:nom /-->` (mémoire pour la syntaxe exacte).
- Seule une partie des attributs est dans le JSON : ceux sans `source`. Les attributs avec `source` sont relus depuis le HTML (voir API_ET_EXTENSIBILITE.md, section 2). La doc recommande de privilégier le HTML pour limiter le volume stocké.
- Le document est stocké en une seule chaîne dans `post_content` ; le tableau de blocs n'existe qu'en mémoire (https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/). Un stockage unique évite la désynchronisation entre contenu et arbre ; le HTML reste lisible par des outils non conscients des blocs, mais les blocs dynamiques peuvent ne pas s'y rendre correctement.
- Blocs statiques : contenu rendu + attributs, re-rendus quand ils changent. Blocs dynamiques : données et rendu côté serveur à la génération du contenu (`save` peut retourner `null`).
- Métadonnées de bloc stockées dans le JSON : exemples confirmés par la doc, `lock` (`{move, remove}`), `metadata.bindings`, `metadata.name` (https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/ , https://developer.wordpress.org/block-editor/reference-guides/block-api/block-templates/).

---

## 2. Parseur et sérialiseur

Sources : https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-serialization-default-parser/ ; https://developer.wordpress.org/reference/functions/parse_blocks/ ; https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/

- Sortie du parseur (PHP `parse_blocks`, JS `@wordpress/block-serialization-default-parser`) : `blockName` (chaîne ou `null`), `attrs`, `innerBlocks`, `innerHTML`, `innerContent` (fragments de chaîne avec marqueurs `null` à l'emplacement des blocs internes).
- Le contenu hors bloc au niveau racine devient un bloc sans `blockName` (contenu « freeform » / classique).
- Jetons : seuls les délimiteurs de commentaires comptent, ils sont « réguliers » (reconnaissables par expressions rationnelles) ; un jeton ouvre un bloc ou en ferme un ; le contenu de chaque bloc est cumulé en `innerHTML`. Le parseur JS vise à se comporter comme le parseur PEG de référence (`@wordpress/block-serialization-spec-parser`) pour pouvoir les échanger.
- La première passe n'exige pas du HTML valide ; des frontières explicites évitent qu'un dommage dans un bloc se propage aux autres, et permettent d'identifier les blocs non reconnus avant le rendu (data-flow).
- Côté PHP : classe `WP_Block_Parser` remplaçable via le filtre `block_parser_class` ; `parse_blocks` peut être coûteux en mémoire sur de gros documents (la doc suggère `WP_Block_Processor` pour de la lecture en flux) ; `serialize_blocks()` pour revenir au texte.
- Côté JS : `parse` (contenu vers blocs), `serialize` (blocs vers contenu), `serializeRawBlock` (sans validation), `getSaveContent`, `validateBlock`.
- Avertissement : l'exemple de la page du parseur JS montre un `innerHTML` incohérent avec les règles qu'elle énonce (signalé par ma lecture) ; ne pas s'en servir comme spécification.

---

## 3. Blocs inconnus

Sources : https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/missing/block.json ; https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/

- Un bloc dont le type n'est pas enregistré est traité par le gestionnaire de types non enregistrés (`getUnregisteredTypeHandlerName` / `setUnregisteredTypeHandlerName`), par défaut `core/missing`, titre « Unsupported », description « Your site doesn't include support for this block. ».
- `core/missing` conserve `originalName`, `originalUndelimitedContent` et `originalContent` (source `raw`) pour ne rien perdre à la resérialisation. Ses supports : pas d'insertion (`inserter: false`), pas d'édition HTML, pas de verrou, pas de réutilisation, pas de renommage, pas de visibilité.
- Dans l'éditeur, l'utilisateur voit le message d'indisponibilité (des options pour convertir en HTML personnalisé ou en blocs existent) (mémoire pour les libellés exacts).
- Les modèles synchronisés supprimés affichent « Block has been deleted or is unavailable. » (https://wordpress.org/documentation/article/reusable-blocks/).

---

## 4. Validation et récupération

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/

- À l'ouverture, le balisage de chaque bloc est régénéré par `save` à partir des attributs parsés et comparé au balisage stocké. Une différence marque le bloc invalide (drapeaux `isValid`, `originalContent` en mémoire).
- Principe : le contenu ne doit pas changer sauf modification volontaire, pour éviter la perte de contenu.
- Options affichées sur un bloc invalide : « Attempt Block Recovery » (tenter la récupération), « Resolve » (convertir en HTML ou en blocs), « Convert to HTML », « Convert to Classic Block ». Les conversions préservent le balisage d'origine. Un rapport tiers indique que « Convert to HTML » est irréversible quant à l'aperçu et que les modifications HTML d'une session de récupération ne sont pas toujours conservées (sources secondaires : https://www.cyberoptik.net/glossary/this-block-contains-unexpected-or-invalid-content/ , https://jira.greenpeace.org/browse/PLANET-5463).
- Causes courantes : défaut du code de bloc, HTML modifié à la main, attributs mal parsés (type inattendu), mise à jour de plugin ou de thème modifiant le balisage. Un avertissement console montre où l'attendu et l'obtenu divergent.
- Pour changer la sortie de `save`, la doc prescrit une dépréciation.
- Filtre `blocks.getBlockAttributes` : s'exécute après le parsing par défaut et avant la validation (https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/).
- Le validateur est `validateBlock` ; `isValidBlockContent` est déprécié (risque de perte de données).

---

## 5. Migrations et dépréciations

Source : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/

- Une dépréciation conserve éditable un ancien contenu après changement de balisage ou d'attributs.
- Déclenchement : le `save` actuel ne correspond pas au contenu (bloc invalide), ou `isEligible` renvoie `true` même si le bloc est valide.
- Algorithme : ce n'est pas une chaîne de mises à jour. Le premier élément du tableau reçoit le contenu d'origine ; si son `save` produit un contenu valide, ses attributs sont parsés et son `migrate` est appelé s'il existe ; sinon on passe au suivant. Les attributs et blocs internes du premier qui correspond sont transmis au `save` actuel, qui régénère un contenu valide. Une dépréciation dont le `save` ne correspond pas est ignorée, `migrate` compris, même si `isEligible` renverrait vrai.
- Ordre : du plus récent au plus ancien.
- Champs d'une entrée : `attributes`, `supports`, `save` (non hérités de la version actuelle, à répéter), `migrate(attributes, innerBlocks)` (retourne les attributs ou `[attributs, innerBlocks]`), `isEligible(attributes, innerBlocks, { blockNode, block })`.
- Exemples documentés : changement de balisage, renommage d'attribut (`text` vers `content`), déplacement d'un attribut vers un bloc interne `core/paragraph`.
- Conseils : copier dans le fichier de dépréciation les fonctions utilitaires dont dépend `save` ; garder des fixtures de chaque version.
- Le filtre `blocks.registerBlockType` s'exécute aussi sur chaque dépréciation.

---

## 6. HTML hérité, bloc Classique et HTML personnalisé

Sources : https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/freeform/block.json ; https://wordpress.org/documentation/article/wordpress-block-editor/ ; https://developer.wordpress.org/reference/functions/parse_blocks/

- Un contenu sans délimiteurs (ancien éditeur) est chargé comme un bloc sans nom, géré par le gestionnaire de contenu libre (`getFreeformContentHandlerName`), par défaut `core/freeform` (titre « Classic », description « Use the classic WordPress editor. »). Son attribut `content` a une source `raw` ; les supports `className`, `customClassName`, `lock`, `reusable`, `renaming`, `visibility`, `customCSS` sont désactivés.
- Remarque issue des commentaires de `parse_blocks` : sur du contenu classique, le premier bloc a un `blockName` vide ; `has_blocks()` est une vérification plus légère.
- Le plugin Classic Editor permet de conserver l'ancien éditeur (https://wordpress.org/documentation/article/wordpress-block-editor/).
- Conversion : « Convert to Blocks » (via les transformations `raw`) et collage (`pasteHandler`) analysent le HTML ; voir REGLAGES_ET_TRANSFORMATIONS.md, section 3. La page dédiée à la conversion du bloc Classique (`convert-classic-blocks`) n'a pas été trouvée (erreur 404).
- Shortcodes : convertis par les transformations de type `shortcode`.
- `html: false` retire l'édition HTML d'un bloc ; le bloc « HTML personnalisé » existe (mémoire pour son nom `core/html`).

---

## 7. Rendu éditeur versus rendu public

Sources : https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/ ; https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ ; https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/ ; https://wordpress.org/documentation/article/preferences-overview/

- Deux implémentations par bloc : `edit` (canevas) et `save` (HTML stocké) ; ou `edit` plus rendu PHP (bloc dynamique). Le front-end affiche le HTML stocké (bloc statique) ou la sortie du `render` PHP (bloc dynamique) ; `render_block` n'agit que sur le front-end.
- Assets séparés : `editorScript`, `editorStyle` (éditeur seul), `script`, `style` (éditeur + front), `viewScript`, `viewStyle` (front seul).
- Fidélité : « Use theme styles » (préférence) applique les styles du thème au canevas ; l'éditeur d'articles tourne dans un iframe quand les blocs sont en API v3 (toujours en WP 7.1, d'après la page des versions).
- Blocs masqués : « Omit from published content » retire le bloc du code publié (ni lecteur d'écran, ni moteur de recherche) ; le masquage par appareil laisse le bloc dans le DOM et le cache par CSS (https://wordpress.org/documentation/article/work-with-blocks/). Ne pas s'en servir pour des données privées.
- Modèles synchronisés : le contenu public vient de l'entité `wp_block` partagée (mémoire pour le nom du type de contenu).
- Liaisons de blocs : le contenu du bloc est une valeur de repli ; la source remplace la valeur au rendu.

---

## 8. Enregistrement, autosave, révisions, conflits

### 8.1 Enregistrement

Sources : https://wordpress.org/documentation/article/wordpress-block-editor/ ; https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/

- Bouton « Save draft » / « Saved » ; Ctrl/Cmd+S ; Publier. Le contenu sérialisé est stocké en `post_content` (sa transmission REST n'est pas décrite par la page data-flow).

### 8.2 Autosave

Sources : https://wordpress.org/documentation/article/revisions/ ; code : https://github.com/WordPress/gutenberg/blob/trunk/packages/editor/src/components/autosave-monitor/index.js

- Au plus une sauvegarde automatique par utilisateur et par contenu ; elle écrase la précédente ; stockée comme un type spécial de révision (statut `inherit`, type `revision`, nom `{parent}-autosave`) ; elle n'écrase pas le contenu publié.
- En cas de coupure (courant, navigateur, réseau), à la réouverture WordPress propose une sauvegarde et un lien de restauration. Dans la chronologie des révisions, l'autosave porte l'étiquette « Autosave ».
- Le moniteur du code compte l'intervalle en secondes (réglage de l'éditeur, valeur non lue ici) ; il n'enregistre que si le contenu est modifié et « autosaveable » et pas déjà en cours ; un échec affiche une notice et réessaie après un décompte. La documentation des révisions évoque implicitement un cycle de 60 secondes (mémoire pour la constante `AUTOSAVE_INTERVAL`).
- Un moniteur d'autosave local existe dans le dépôt (`local-autosave-monitor`) ; fichier non lisible à l'URL testée, rôle non vérifié (probablement sauvegarde navigateur).

### 8.3 Révisions

Source : https://wordpress.org/documentation/article/revisions/ (mise à jour 2026-09-28)

- Une révision à chaque enregistrement de brouillon ou mise à jour publiée, stockée dans la table des contenus comme enfant du contenu (statut `inherit`, type `revision`, nom `{parent}-revision-{n}`) ; suivi par défaut : titre, auteur, contenu, extrait.
- Accès : barre latérale > onglet Article/Page > nombre à côté de « Revisions ».
- Écran des révisions (WP 7.0+) : curseur, liste, marqueurs colorés (ajouté = vert plein, supprimé = rouge à hachures montantes, modifié = jaune à hachures descendantes), icône « Show changes », bouton « Restore ». Écran classique (WP 6.9 et moins, ou lien depuis 7.0) : comparaison côte à côte du HTML, mode « Compare any two revisions » à deux poignées.
- Limites : constante `WP_POST_REVISIONS` (`true`/`-1` toutes, `false`/`0` aucune, entier N = N plus une autosave par utilisateur) ; filtre `wp_revisions_to_keep`.
- Gestion : fonction d'API de suppression, pas d'interface.
- Dépôt : composant `revision-block-diff` (diff au niveau des blocs).

### 8.4 Conflits et verrouillage

Source : recherche web (secondaire) : https://developer.wordpress.org/reference/functions/wp_refresh_post_lock/ ; https://core.trac.wordpress.org/ticket/65171 ; code : composant `post-locked-modal` dans https://github.com/WordPress/gutenberg/tree/trunk/packages/editor/src/components

- Le cœur utilise un verrou d'édition d'article (`_edit_lock`, méta d'article), rafraîchi par l'API Heartbeat ; une fenêtre de 120 secondes est citée par un changeset de 2013 ; la fréquence Heartbeat serait de 15 s en activité et 120 s en inactivité (source secondaire).
- Un second éditeur voit une modale (« post-locked-modal ») proposant de prendre le relais (« Take over ») ou de revenir à la liste.
- Ticket ouvert #65171 : réduire la fenêtre sous 120 s via `wp_check_post_lock_window` casse la détection pour les onglets en arrière-plan ; aucun correctif trouvé.
- Il n'y a pas, dans ce qui a été lu, de fusion de modifications concurrentes : le verrou est un mécanisme de prévention. La « détection de conflits de sauvegarde » (comparaison de versions à l'enregistrement) n'a pas été documentée à ces URL.
- Composant `template-validation-notice` : avertit quand le contenu ne correspond plus au modèle de bloc (pas lu en détail).

---

## 9. Analyse : choix du format de données pour le nouvel éditeur

Cette section est une analyse. Elle s'appuie sur les faits ci-dessus et sur ma connaissance générale, pas sur une recommandation officielle de WordPress.

### 9.1 Options

| Option | Description | Atouts | Limites |
|---|---|---|---|
| A. HTML + commentaires (modèle WordPress) | Chaîne unique : HTML des blocs + JSON d'attributs dans des commentaires | Lisible sans l'éditeur ; rendu public statique sans exécuter l'éditeur ; compatibilité totale avec les contenus WordPress ; un seul champ de stockage | Validation par comparaison de balisage fragile ; toute modification de `save` impose une dépréciation ; données dupliquées (HTML + attributs) ; attributs « sourcés » compliquent le parsing ; contenu dépendant du thème et des plugins dans le HTML |
| B. JSON structuré (arbre de blocs) | Document JSON : version de schéma, blocs avec `type`, `attrs`, `children` | Pas de validation de balisage ; migrations par version de schéma explicites ; recherche et requêtes structurées ; interopérabilité avec des outils non WordPress | Il faut un moteur de rendu public (statique ou serveur) ; illisible sans outil ; échange avec WordPress à écrire |
| C. JSON + HTML pré-rendu (hybride) | JSON canonique, HTML dérivé mis en cache | Rendu rapide ; source unique de vérité structurée ; le HTML peut être régénéré | Deux représentations à garder synchronisées (invalidation du cache) |
| D. Markdown / MDX | Texte avec extensions | Lisible, versionnable | Peu adapté aux mises en page imbriquées, aux attributs riches, aux verrous et à la visibilité |

### 9.2 Critères de décision

1. Blocs inconnus : prévoir un bloc de repli qui garde `name` + payload brut (comme `core/missing`), sans perte à la resérialisation. Faisable avec A, B, C.
2. Évolution des blocs : B/C remplacent les dépréciations par des migrations de schéma (`schemaVersion` par bloc ou par document), avec `migrate` testé sur des fixtures de chaque version (conseil de la doc des dépréciations).
3. Rendu public : si le site public ne doit pas dépendre de l'éditeur, A ou C donnent du HTML immédiatement ; B demande un rendu serveur déterministe.
4. Interopérabilité WordPress : seul A écrit directement dans `post_content`. Si un export/import WordPress est exigé, prévoir un convertisseur B vers A (génération du balisage et des commentaires) et A vers B (`parse`), avec perte possible (attributs sourcés, blocs dynamiques).
5. Révisions et diff : un diff par bloc (comme `revision-block-diff`) est plus simple sur un arbre JSON.
6. Sécurité : A stocke du HTML (risque XSS si `RawHTML`/HTML personnalisé) ; B limite la surface si le rendu est construit par composants échappés.
7. Collaboration et conflits : WordPress se limite à un verrou par article et à une autosave par utilisateur ; un arbre JSON avec identifiants stables de blocs rend possible une fusion ou un CRDT, ce qui n'est pas offert par A.
8. Taille et performance : A duplique des données ; l'API doc recommande de privilégier le HTML dans le choix des sources pour réduire la taille, ce qui montre le compromis propre à A.

### 9.3 Recommandation provisoire

Pour une architecture native sans contrainte de stockage `post_content` : option C (JSON canonique versionné + HTML dérivé en cache), avec :
- enveloppe `{ schemaVersion, blocks: [ { id, type, version, attrs, children, meta: { lock, hidden, bindings, name } } ] }` ;
- bloc de repli `unknown` conservant `type` d'origine et `raw` ;
- migrations versionnées plutôt que dépréciations de `save` ;
- importeur et exportateur A (commentaires WordPress) pour la compatibilité, le test de cycle (A vers B vers A) servant de contrôle de non-régression ;
- révisions par document complet (ou diff par bloc) et une sauvegarde automatique par utilisateur, calquées sur le modèle WordPress.

Cette recommandation est à confirmer par un prototype et par les contraintes réelles du projet (hébergement, SEO, compatibilité).

---

## Points non vérifiés

- Syntaxe exacte de la forme autofermante, échappement des caractères spéciaux dans le JSON des commentaires (mémoire : le cœur échappe notamment les doubles tirets et les chevrons) : non relus dans la spécification.
- Spécification officielle de la grammaire (PEG) `@wordpress/block-serialization-spec-parser` : non téléchargée.
- Libellés exacts des boutons pour un bloc non reconnu (`core/missing`), et logique exacte de « Attempt Block Recovery » : seuls la doc générale et des sources tierces ont été lus.
- Intervalle d'autosave (valeur numérique par défaut, réglage `autosaveInterval`) et rôle exact de `local-autosave-monitor` : non confirmés par la source.
- Mécanisme de « détection de conflits de sauvegarde » (comparaison de dates de modification, erreurs REST de conflit) : non documenté dans ce qui a été lu ; seule la gestion par verrou d'article est décrite, à partir de sources secondaires (recherche web, ticket Trac).
- Fréquence Heartbeat de 15 s et fenêtre de 120 s : sources secondaires ; la valeur 150 s évoquée dans la recherche n'a pas été confirmée.
- Page « Convertir les blocs classiques » : introuvable (404) ; comportement de « Convert to Blocks » non vérifié.
- Nom `wp_block` des modèles synchronisés, `core/html` : mémoire.
- Pas de test sur une installation WordPress ; pas de fixtures essayées.
- Recommandation du 9.3 : jugement d'analyse, sans validation par prototype.
