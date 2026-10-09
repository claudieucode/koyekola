# Partie droite de l'éditeur : thème clair / sombre, Structure, inspecteur

## Audit de départ (avant modification)

* La partie droite = `aside.pb-right` : `section.pb-layers-panel` (Structure : en-tête, ligne « Page », recherche, arbre `ul.pb-tree`), séparateur
  `div.pb-hsplit`, `section.pb-inspector` (état vide, ou en-tête + onglets + contenu de l'élément). Tout est dessiné par `public/js/page-builder.js`
  (`renderTree`, `renderInspector`, `infoBlock`, `breakpointSwitch`) et `public/css/page-builder.css`.
* La palette de gauche avait déjà un vrai système de thème (jetons `--pp-*`, attribut `data-palette` sur `<main>`, préférence `pb:palette-theme` mémorisée,
  mode « Système »), qui **excluait** explicitement le panneau de droite. Le panneau de droite était clair en permanence, avec des couleurs du site
  (`--card`, `--border`…) et une cinquantaine de couleurs écrites en dur.
* Existant réutilisé tel quel (aucun doublon) : sélection, arbre, glisser-déposer des calques, menu contextuel (`openMenu`), annuler / rétablir (`undo`, `redo`,
  historique), écrans (`breakpointSwitch`), réglages de la page (onglet « Page » à gauche, `renderPageSettings`), informations (`infoBlock`), redimensionnement
  (`[data-pb-resize]`, `[data-pb-split]`), mémoire des préférences (`store`).

## Architecture du thème

* **Source unique** : les jetons `--editor-*` de `page-builder.css` (bloc « Thème de l'éditeur »), posés sur `<body class="pb-body">` ; le mode sombre les redéfinit
  (`.pb-body[data-palette="dark"]`). Jetons : `bg, panel, panel-secondary, card, input, border, border-strong, guide, text, text-secondary, muted, hover, active,
  accent, accent-text, on-accent, danger(-bg), success(-bg), shadow, focus, scheme, select-arrow, search-icon`.
* **Niveaux** : fond → panneau (Structure) → zone secondaire (inspecteur) → carte / champ → survol → actif (sélection). Pas de noir absolu : `#151515` / `#101010` / `#1b1b1b`.
* **Lecteurs** : la palette de gauche (`--pp-*`) et la droite lisent ces jetons. Les valeurs de la gauche n'ont pas changé (mêmes couleurs, vérifié par un test).
  Dans les panneaux de droite et les menus, les jetons du site (`--card`, `--border`, `--text`…) sont ramenés aux jetons `--editor-*` **localement** : les composants
  existants (champs, segments, accordéons, longueurs, couleurs…) suivent le thème sans être réécrits.
* **Pilotage** : `applyPalette()` pose `data-palette` sur `<main>` **et** `<body>` (les menus et sélecteurs ouverts hors des panneaux suivent). Préférence unique
  `pb:palette-theme` (clair / sombre / système), déjà mémorisée au rechargement. Deux commandes, un seul état : le sélecteur « Apparence » (pied de la palette) et la
  bascule ☀ / 🌙 de l'en-tête Structure (`[data-pb-theme-toggle]`).
* **Transition** : 0,16 s sur les couleurs de surface seulement (jamais sur une mesure) ; supprimée avec « réduire les animations ».

## Ce qui change dans l'interface

| Zone | Avant | Maintenant |
|---|---|---|
| En-tête Structure | 4 icônes de 32 px | bascule thème + ajouter + détacher + fermer + replier, 28 px, alignées, nommées, infobulles |
| Ligne « Page » / recherche | texte brut, champ du site | icône de recherche intégrée, compteur, thèmes clair et sombre |
| Arbre | lignes plates | repères d'indentation, sélection à barre d'accent, actions discrètes (visibles au survol, à la sélection, au clavier ; un état actif reste visible), menu ⋮ réel (mêmes actions que le clic droit), nom long tronqué |
| Glisser-déposer | trait en ombre interne | ligne d'insertion + point à la bonne indentation, zone « dans » en pointillés (même logique de dépôt) |
| Inspecteur (élément) | titre + onglets | en-tête collé (icône, type, nom, ⋮ actions, désélectionner), onglets collés, zone secondaire |
| Inspecteur (aucune sélection) | texte + boutons empilés | message clair, carte « Écran / Réglages de la page / Annuler · Rétablir » (états actif, désactivé, infobulles), informations en accordéon animé |
| Largeur | 200 – 560 px | 280 px au moins (même pour une ancienne valeur enregistrée), jamais plus de la moitié de la fenêtre |

## Limites assumées

* « Réglages de la page » ouvre l'onglet « Page » du panneau de gauche (titre, description, SEO, couleurs, CSS) : c'est le panneau de réglages existant, pas un
  nouveau tiroir ; il ne propose que ce que le système permet déjà (pas de « slug » ni de « modèle » modifiables ici).
* Le canevas, la page affichée et la barre du haut gardent leurs couleurs.
* Les anciennes règles claires de `page-builder.css` ne sont pas supprimées : le bloc de fin les précise (même sélecteurs, jetons).

## Tests

`tests/editeur-droite-navigateur.test.js` (vrai Chrome) : jetons et contrastes ≥ 4,5 dans les deux thèmes, bascule + mémoire, transition, en-tête sans chevauchement,
arbre (états, tronquage), recherche, menu ⋮ (dupliquer, masquer, supprimer), glisser-déposer, inspecteur vide (historique, écrans, page, accordéon), en-tête collé,
absence de débordement (3 fenêtres × largeur mini / maxi × états × 2 thèmes), limites de largeur, grand nombre d'éléments, menus ouverts hors des panneaux, palette de gauche inchangée.
