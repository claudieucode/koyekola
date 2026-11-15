# Médiathèque — dossiers libres partout (état au 15/11/2026)

## 1. Fonctionnement avant ce chantier (audité)
- Les dossiers sont **logiques** (`mk_media_folders`, migration 112 puis 154) : id stable, `parent_id` (arbre), `site_id` (NULL = médiathèque commune), couleur, description, corbeille (`deleted_at`). Un fichier (`mk_media`) pointe vers au plus un dossier (`folder_id`). **Aucun fichier physique n'est déplacé ni copié** : l'adresse publique d'un média ne change jamais.
- Images / Vidéos / Audio / Documents sont des **filtres sur le type réel du fichier** (`mk_media.type`), pas des dossiers. Favoris, tags et collections sont des tables séparées.
- Le bouton « Nouveau dossier » existait déjà partout et créait dans le dossier courant, mais les dossiers n'étaient **affichés** que dans « Mes dossiers », « Sans dossier » ou un dossier ouvert : un dossier créé depuis Images disparaissait de la vue.
- Déjà présents : glisser-déposer (fichiers et dossiers, dépôt sur l'arbre, indicateurs, refus du cycle), sélection multiple, menu contextuel complet, fil d'Ariane, propriétés, corbeille de dossiers, favoris.

## 2. Ce qui a été ajouté (migration `155_mediatheque_dossiers_libres.sql`, additive)
| Colonne | Rôle |
|---|---|
| `category` | `''` (général), `image`, `video`, `audio`, `document` : catégorie où un dossier de **premier niveau** a été créé. Les sous-dossiers héritent de celle de leur parent. Les dossiers existants gardent `''` et restent visibles partout. |
| `icon` | Icône parmi une liste fermée (`manager.FOLDER_ICONS`). |
| `sort_order` | Ordre personnalisé **entre frères** (même parent). |
| `cover_media_id` | Image de couverture facultative (une image visible de la même médiathèque ; `ON DELETE SET NULL`). |
| `updated_at` | Date de modification (renommage, déplacement, propriétés). |

Retour arrière : `ALTER TABLE mk_media_folders DROP COLUMN …` pour chaque colonne (après sauvegarde). Aucune donnée existante n'est modifiée.

### Règles d'affichage (`src/marketing/web/mediaLibrary.js`, fonction `page`)
- Dans un dossier : ses sous-dossiers (quelle que soit la catégorie).
- Tous les fichiers, Sans dossier, Mes dossiers : tous les dossiers de premier niveau.
- Images / Vidéos / Audio / Documents : dossiers de premier niveau de cette catégorie **+** dossiers généraux (`category = ''`). Ouvrir un dossier depuis une catégorie garde `type=` dans l'adresse.
- Aucun dossier n'est affiché quand une recherche ou un filtre (hors type) est actif.

### Les trois opérations restent distinctes
1. **Déplacer** (changer de parent) : `POST /dossiers/:id {parent_id}` ou `/deplacer` pour les fichiers ; refuse soi-même, descendants, profondeur max, conflit de nom.
2. **Position visuelle / ordre personnalisé** : `POST /dossiers/ordre {parent_id, ids[]}` ; ne change ni le parent ni le contenu ; refuse des dossiers de parents différents ; enregistré côté serveur.
3. **Tri d'affichage** des fichiers (nom, date, taille…) : inchangé.

Interface : lâcher un dossier sur le **bord gauche/droit** d'un autre dossier du même emplacement le place avant/après (trait bleu) ; lâcher au **centre** le déplace dans ce dossier (comportement existant).

### API (préfixe `/marketing/site-web/mediatheque`, droit `media.write`)
- `POST /dossiers {name, parent_id?, category?}` → crée.
- `POST /dossiers/:id/meta {color?, description?, icon?, cover_media_id?}` → propriétés (`null` retire la couverture).
- `POST /dossiers/ordre {parent_id, ids}` → ordre personnalisé.
- `GET /dossiers/:id/proprietes.json` → inclut `icon`, `category`, `coverMediaId`, `createdAt`, `updatedAt`.

### Permissions et isolation
Toutes les routes passent par `need("media.write")` et par le contexte de site (`folders.getFolder` filtre organisation + site) : un autre site ne peut ni lire, ni ordonner, ni modifier un dossier.

## 3. Tests
- `tests/mediatheque-dossiers-libres.test.js` (10, serveur réel) : création par catégorie, visibilité par vue, héritage, conflits, cycles, icône, couverture, ordre, permissions, isolation, persistance.
- `tests/mediatheque-dossiers-libres-navigateur.test.js` (6, Chrome réel) : « Nouveau dossier » dans Images/Vidéos/Audio/Documents/Sans dossier, sous-dossiers multi-niveaux, icône + couleur + renommage, glisser pour réordonner, persistance au rechargement, aucune erreur de script.
- Régression : `explorateur-medias`, `cms-media`, `marketing-medias`, `mediatheque-gestionnaire(-navigateur)` passent. `mediatheque-barre-laterale-navigateur` « l'état replié est mémorisé… » échoue **déjà sans ces changements** (vérifié).

## 4. Limites et non réalisé (honnêtement)
- **Ordre personnalisé des fichiers** : seul l'ordre des dossiers est personnalisable. Il faudra une table de positions par (dossier, fichier) ; non faite.
- **Mode colonnes (Finder), historique Précédent/Suivant, restauration de la dernière vue** : non faits (l'historique du navigateur fonctionne déjà via l'URL).
- **Image de couverture** : enregistrée et validée côté serveur, mais pas encore choisie depuis l'interface ni affichée sur la carte.
- **Couper/Coller/Dupliquer un dossier, déplacement entre catégories** : « Déplacer vers » et le glisser existent ; copie/duplication de dossiers non ajoutées. Les catégories n'étant pas des dossiers, « déplacer vers une catégorie » n'a pas de sens pour un fichier (son type est fixe).
- **Vues grille libre (positions x/y)** : non faite ; une web-app ne peut pas garantir une position pixel stable selon la taille d'écran, l'ordre est donc logique (liste ordonnée).

## 5. Faire évoluer sans casser
- Ajouter une icône : l'ajouter à `FOLDER_ICONS` (manager.js) **et** à la liste `ICONS` de `folderProps` (media-explorer.js) ; l'icône doit exister dans `src/utils/icons.js`.
- Ajouter une catégorie : étendre `folders.CATEGORIES`, la table `CAT` dans `page()` et la valeur `category` du `ml-config`.
- Toute nouvelle colonne : migration **additive** + test d'isolation de site.
- Ne jamais écrire dans `mk_media.path` ni copier un fichier pour l'afficher dans une autre vue.
