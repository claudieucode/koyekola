# Médiathèque — mode « Colonnes » (navigation à la manière de Finder)

Accès : Médias → Médiathèque → bouton « Colonnes » de la barre d'affichage (à côté de Grille, Liste, Détails, Grandes icônes, Compact). Adresse : `…/medias?vue=colonnes`, le dossier ouvert est gardé dans `&dossier=ID`.

## 1. Architecture (sixième mode du gestionnaire de fichiers)

| Élément | Fichier | Rôle |
|---|---|---|
| Mode d'affichage | `src/marketing/media/manager.js` | `VIEWS` contient `colonnes` ; trois préférences propres : `colWidth` (180–420 px), `colMeta`, `colExt` (par personne et par site, comme les autres préférences). |
| Page | `src/marketing/web/mediaLibrary.js`, `views/marketing/media/_head.ejs`, `_body.ejs` | Le bouton « Colonnes » ; en mode colonnes le serveur ne rend **aucune ligne** (la corbeille reste une liste à plat). |
| Module | `public/js/media-columns.js` | Plugin du gestionnaire (`window.MXColumns`, même principe que `media-sections.js`), branché sur `window.MX`. |
| Style | `public/css/media-columns.css` | Utilise les variables d'« Apparence » du gestionnaire (`--mx-*`). |
| Bascule de mode | `public/js/media-explorer.js` | Entrer ou sortir du mode colonnes demande le contenu serveur (fragment), puis `MXColumns.mount()`. Aucun rechargement de page. |

Données : l'arbre des dossiers est déjà dans la page (`ml-config`) : aucune requête avant le premier affichage ; les fichiers d'UN dossier arrivent par pages de 100 (`liste.json?dossier=…`), à la demande. Écritures : mêmes routes et mêmes droits que le reste du gestionnaire. Aucune migration, aucune nouvelle table.

## 2. États
- `path` : un dossier choisi par colonne ; `sel` : fichier choisi ; `active` : colonne qui porte la sélection pleine (les autres : teinte douce).
- Colonne : en chargement (3 lignes grises) → remplie → vide (« Dossier vide ») → erreur (message + « Réessayer ») → suite disponible (« Afficher 100 de plus », ou automatique au défilement).
- Colonne d'aperçu à droite quand un fichier est choisi ; « Informations » ouvre le panneau d'informations du gestionnaire.

## 3. Interactions
- Clic : sélectionner (un dossier affiche son contenu dans la colonne suivante). Double-clic : entrer dans un dossier ; sur un fichier, ouvre ses informations.
- Clavier : ↑ ↓ (dans la colonne), → ou Entrée (entrer), ← (parent), Début / Fin, saisie d'une lettre (saut au nom), F2 (renommer), Suppr (corbeille, avec confirmation), Menu / Maj+F10, Alt+← / Alt+→ (retour / suivant), « / » ou Ctrl+F (recherche), Échap. Les raccourcis du gestionnaire ne s'appliquent pas dans cette vue (pas de double effet).
- Menu contextuel : dossier (Ouvrir, Nouveau sous-dossier, Renommer, Mettre à la corbeille, Supprimer en gardant les fichiers) ; fichier (Informations, Ouvrir dans un onglet, Copier l'URL, Renommer, Corbeille) ; fond de colonne (Nouveau dossier ici). Les actions d'écriture n'existent que pour qui a le droit `media.write`.
- Glisser-déposer : fichier ou dossier sur un dossier (n'importe quelle colonne) ou sur le fond d'une colonne (= ce dossier). Un dossier survolé 0,8 s s'ouvre. Déplacement circulaire refusé (interface **et** serveur). L'import de fichiers du bureau reste celui du gestionnaire (fenêtre « Importer », avec choix du dossier).
- Recherche : dans le dossier sélectionné (dossiers côté navigateur, fichiers côté serveur).
- Fil d'Ariane synchronisé et cliquable ; retour / suivant (100 étapes).
- Redimensionnement : poignée à la souris ou au clavier (160–520 px), double-clic = largeur d'origine.

## 4. Personnalisation
- Bouton « Colonnes » : largeur par défaut, extensions, métadonnées (enregistrés sur le serveur).
- Bouton « Apparence » du gestionnaire : mode clair / sombre / personnalisé, couleur de sélection, espacement, rayon et taille des icônes : la vue en colonnes les suit automatiquement (texte de la sélection recalculé pour rester lisible).
- Largeurs propres à chaque colonne : mémorisées dans le navigateur (`localStorage`).

## 5. Performances
- Sélectionner un dossier ne reconstruit que les colonnes à sa droite ; les colonnes de gauche restent les mêmes éléments (vérifié par test). Marquer la sélection ne touche qu'une ligne.
- Un dossier déjà ouvert n'est pas rechargé (cache de la visite) ; ↻ ou toute modification actualise.
- Chargement différé de 70 ms : parcourir au clavier ne lance pas une requête par ligne.
- Grands dossiers : pages de 100, `content-visibility: auto` sur les lignes. Mesuré (dossier de 320 fichiers) : clic de sélection, médiane 21 ms, maximum 44 ms.
- Animation d'entrée d'une colonne : 140 ms (opacity + transform), supprimée avec « mouvement réduit ».
- Vignettes : seulement pour les images ≤ 400 Ko (sinon badge d'extension).

## 6. Tests
`tests/mediatheque-colonnes-navigateur.test.js` (vrai Chrome, 10 scénarios) : dossiers imbriqués et colonnes conservées, fil d'Ariane et retour, clavier (dont focus conservé quand les fichiers arrivent), dossier de 320 fichiers, dossier vide, recherche, redimensionnement, réglages enregistrés sur le serveur et thème sombre suivi, menu contextuel, renommage (le champ survit au redessin), nouveau dossier, glisser-déposer fichier et dossier, refus du déplacement circulaire, lecture seule (interface et serveur), mouvement réduit, écran 375 px, bascule grille ↔ colonnes sans rechargement.

## 7. Limites connues
- Un seul élément sélectionné à la fois dans cette vue (la sélection multiple existe dans les autres modes).
- Les modifications faites par une autre personne, ou depuis le panneau d'informations, apparaissent après ↻.
- Largeurs individuelles de colonnes : par navigateur, pas par compte.
- La vue exige un site choisi (les dossiers appartiennent à la médiathèque d'un site) ; sans site, un message l'explique.
- Pas de relecture humaine sur lecteur d'écran : l'ARIA (listbox, option, separator, annonces) est vérifié par test, pas par une personne ; pas de contrôle visuel humain en mode « personnalisé ».
