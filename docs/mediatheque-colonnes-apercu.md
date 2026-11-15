# Médiathèque : colonnes personnalisables et aperçu rapide

Deux fonctions du même gestionnaire de fichiers (CMS → Médias → Médiathèque), pas deux modules à part : elles partagent
les préférences (par personne et par site, côté serveur), le panneau latéral, la liste affichée et la visionneuse.

Fichiers : `src/marketing/media/manager.js` (catalogue de colonnes, préférences), `src/marketing/media/index.js` (tris),
`views/marketing/media/_body.ejs` et `_head.ejs`, `public/js/media-columns.js`, `media-viewer.js`, `media-quicklook.js`,
`media-preview.js` (fenêtre), `media-explorer.js` (intégration), `public/css/media-explorer.css`.
Test : `tests/mediatheque-colonnes-apercu-navigateur.test.js` (vrai Chrome).

## A. Colonnes du mode liste

Mode **Liste** (les modes Grille, Détails, Grandes icônes et Compact gardent leur présentation). Bouton « Colonnes et affichage » de la barre d'outils.

| Colonne | Source | Triable | Pertinente pour |
|---|---|---|---|
| Nom | base | oui (A→Z / Z→A) | tous (toujours affichée) |
| Type | base | oui | tous |
| Extension | chemin du fichier | oui | tous |
| Format | type MIME (JPEG, PNG, MP4…) | oui | tous |
| Taille | base | oui | tous |
| Dimensions | largeur × hauteur lues à l'import ; vidéo : lues dans le fichier | oui (surface) | images, vidéos, Lottie |
| Résolution | mégapixels (images) ; vidéo : 720p, 1080p, 4K lus dans le fichier | oui (surface) | images, vidéos |
| Durée | lue dans le fichier par le navigateur | non | vidéos, audio |
| Emplacement | dossier logique de la médiathèque | non | tous |
| Modifié le | base | oui | tous |
| Ajouté le | base (date d'import) | oui | tous |
| Création (prise de vue) | EXIF du JPEG, lu à la demande | non | photos JPEG |
| Auteur | base | non | tous |
| Étiquettes | base (tags) | non | tous |
| Favori | base (favoris de la personne) | non | tous |
| Statut | « Prêt », « Utilisé » (déjà inséré dans un contenu), « En corbeille » | non | tous |

**Jamais de fausse information.** Une cellule sans information affiche « — ». Les informations absentes de la base (durée, résolution
vidéo, date de prise de vue) sont lues dans le fichier par le navigateur, **seulement pour les lignes visibles** et seulement si la colonne est affichée
(métadonnées seules : `preload="metadata"`, deux lectures en parallèle au plus, résultat gardé en mémoire, élément libéré aussitôt). Une colonne marquée
« peu utile ici » dans le panneau n'a pas de sens pour la catégorie affichée.

**Limites assumées.** Pas de codec, d'artiste ni de DPI : ces informations ne sont pas lues par le serveur et ne sont donc pas proposées.
Il n'existe aucun traitement asynchrone des fichiers (les versions réduites des images sont fabriquées à la première visite) : « Statut » ne simule donc pas de « traitement en cours ».
« Date de création » du fichier d'origine n'est connue que pour les photos (EXIF) ; pour les autres, « Ajouté le » est la seule date de création connue.

### Personnalisation
- **Ajouter / masquer** : cases du panneau. **Réorganiser** : glisser un titre de colonne, ou glisser une ligne du panneau, ou boutons ↑ ↓ (clavier).
- **Largeur** : tirer le bord droit d'un titre, flèches gauche/droite sur la poignée (10 px), double-clic pour revenir à la largeur d'origine (56 à 480 px).
  La liste défile horizontalement quand les colonnes dépassent la largeur disponible ; la page, elle, ne défile jamais.
- **Réinitialiser la disposition** : retour à la configuration par défaut si elle existe, sinon à la disposition d'origine.
- **Configurations** (12 au plus) : enregistrer sous un nom, appliquer, mettre à jour, renommer, supprimer, définir par défaut (★).
- **Affichage intelligent** (case « Adapter les colonnes au type de fichier », active par défaut) : dans une catégorie, la liste propose ses colonnes
  (images : format, taille, dimensions, résolution, modifié ; vidéos : format, taille, dimensions, durée ; audio : format, taille, durée ; documents : format, taille, modifié).
  Chaque catégorie garde sa propre disposition ; modifier les colonnes dans « Images » ne change pas « Audio ».
- **Tri** : cliquer un titre trie croissant puis décroissant ; un petit triangle marque la colonne triée (`aria-sort` pour les lecteurs d'écran).
  Le tri est enregistré et réappliqué à la réouverture (adresse sans paramètre).
- Les préférences sont filtrées et bornées par le serveur (`sanitizePrefs`) : colonne inconnue, doublon, largeur hors limite, nom trop long sont écartés.

## B. Aperçu rapide

Le panneau latéral droit a deux onglets : **Aperçu** et **Informations**. L'aperçu suit la sélection : flèches du clavier, clic, boutons ‹ › changent de fichier
sans fermer le panneau. Les fichiers parcourus sont ceux de la liste affichée (recherche, dossier ou catégorie en cours). Aux bords de la page de résultats,
‹ › passent à la page voisine.

| Ouverture | Action |
|---|---|
| Clavier | **Espace** (comme le Finder) ; **Alt + P** (comme l'Explorateur Windows) ; **Espace** referme |
| Barre d'outils | bouton « Aperçu rapide » (œil) |
| Menu contextuel | « Aperçu rapide » ; « Ouvrir en plein écran » |
| Double-clic / Entrée | au choix (réglages de l'aperçu) : fenêtre plein écran (défaut), panneau d'aperçu, panneau d'informations, aucune action |
| Mode d'ouverture | panneau latéral (défaut) ou **fenêtre superposée** ; sur écran étroit (≤ 900 px) la fenêtre est utilisée |

Changement de comportement : **Espace** ne coche plus le fichier (il ouvre l'aperçu) ; la sélection se fait par clic, case à cocher, Ctrl/⌘ + clic ou Maj + clic.

### Formats
| Type | Aperçu |
|---|---|
| Images | version « moyenne » ; zoom (boutons, double-clic, Ctrl + molette, pincement), déplacement, rotation, « 100 % » ; l'**original n'est chargé qu'au zoom** (dans la fenêtre plein écran : à l'ouverture) |
| Vidéo | lecteur du navigateur : lecture/pause, progression, durée, volume, plein écran ; durée et dimensions lues dans le fichier |
| Audio | lecteur du navigateur ; durée lue dans le fichier ; pas d'artiste (non lu) |
| PDF | visionneuse PDF du navigateur : pages, zoom, défilement |
| Autres (Word, Excel, PowerPoint, Lottie) | fiche de propriétés + téléchargement ; pas de conversion |

La fiche du panneau : nom, type et format, taille, dimensions ou durée, dates (ajouté, modifié), dossier parent, étiquettes, actions (télécharger, copier le lien, plein écran, informations).
Panneau redimensionnable de 280 à 720 px (souris, tactile, flèches), largeur conservée.

### Performance, sécurité, mémoire
- Grille et liste : miniatures seulement. Aucun fichier complet n'est téléchargé pour une miniature.
- Images voisines préchargées en version moyenne (8 au plus). Informations détaillées (EXIF) mises en cache (40 au plus).
- À chaque changement de fichier et à la fermeture : vidéo/audio mis en pause, source vidée (`removeAttribute("src")` + `load()`), PDF remplacé par `about:blank`, images abandonnées, écouteurs retirés
  (`AbortController`). Fermer le panneau détruit la visionneuse.
- Les adresses de fichiers et l'API (`/:id.json`, `/preferences`) passent par les mêmes contrôles d'accès que le reste de la médiathèque (permission `media.read`, médiathèque du site) ;
  l'aperçu n'ouvre aucun accès nouveau.
- Mouvement : seulement `opacity` / `transform`, 120–260 ms, désactivé sous `prefers-reduced-motion`. Pas de saut de mise en page : la visionneuse garde sa taille.

### Limites techniques
- Le PDF dépend de la visionneuse intégrée du navigateur ; certains navigateurs mobiles ne l'affichent pas (téléchargement proposé).
- Pas d'aperçu de documents Office sans conversion serveur (non installée).
- La navigation précédent/suivant suit la page chargée ; aux bords elle passe à la page voisine.
- Vidéos : formats lisibles par le navigateur seulement (MP4 H.264, WebM) ; durée lue dans le fichier, donc absente si le navigateur ne peut pas le décoder.
- Le glisser-déposer des colonnes utilise l'API HTML5 (souris) ; au clavier et au toucher, utiliser les boutons ↑ ↓ du panneau.
