# Éditeur de pages : gestionnaire de panneaux

## Ce qui existait déjà (audit)
- `views/marketing/page-builder.ejs` : grille `.pb-main` (outils | panneau gauche | poignée | canevas | poignée | panneau droit), éditeur en JavaScript natif (pas de React).
- `public/js/page-builder.js` : objet `panels` (largeurs, masqué, hauteur de la Structure), `applyPanels()`, poignées de largeur, séparateur horizontal (`data-pb-split`), panneau Structure détachable (objet `dock`, `applyDock()`), `queueZoom()` (recalcul du zoom « ajusté »).
- `public/css/page-builder.css` : placement explicite des colonnes (≥ 1101 px), pile verticale en dessous.
- Préférences : `localStorage` (`pb:panels`, `pb:layers-dock`), propres au navigateur.

## Ce qui a été ajouté
- `public/js/page-builder-panels.js` : le gestionnaire (une seule IIFE, `window.pbPanels`). Il s'appuie sur l'état existant via `window.pbPanelsBridge` (posé à la fin de `page-builder.js`, **mêmes objets, aucune copie**) et ne touche jamais au document.
- `public/css/page-builder-panels.css`.
- `page-builder.js` : seulement le pont, six entrées de la palette de commandes.
- `page-builder.css` : la grille du panneau droit gagne une première rangée (la barre d'en-tête).
- `page-builder.ejs` : feuille de style, script, 5 lignes dans la boîte « Raccourcis clavier ».

## Modes (indépendants à gauche et à droite)
| Mode | Effet |
| --- | --- |
| Ancré | Comportement d'origine, avec une barre d'en-tête (poignée, commandes). |
| Flottant | Hors de la grille ; déplacé par `transform`, redimensionné par 5 poignées (bords et coins), 240–640 px, reste dans la zone de travail, passe au premier plan au clic. Un panneau ancré saisi par son en-tête se détache. Déposé sur la zone d'ancrage (bord de son côté, aperçu en pointillés) il se rattache ; il ne s'ancre jamais sans que l'on dépose dans la zone. |
| Barre d'icônes | Colonne de 44 px ; un clic ouvre le panneau en superposition (se referme par clic ailleurs, Échap, clic dans la page). |
| Masqué | Plus aucune place ; rappel par boutons de la barre d'outils, palette de commandes (Ctrl/⌘ + K) ou raccourcis. |

Sous-panneaux du panneau droit : pastilles « Structure » et « Propriétés » dans la barre (replier l'un ou l'autre), séparateur horizontal déjà existant (glisser pour répartir), Structure détachable (déjà existant). La sélection et les propriétés restent liées (aucun état n'est reconstruit).

## Espaces de travail
Fournis : **Standard**, **Conception** (panneaux masqués, canevas maximal), **Structure** (Structure large, éléments en barre d'icônes). Personnels : enregistrer, renommer, dupliquer, supprimer, restaurer, réinitialiser (menu de la barre, icône « espaces »). Une disposition contient : largeurs, masqué, hauteur/repli de la Structure, panneau Structure détaché, modes et géométrie des panneaux, repli des propriétés.

Persistance : `localStorage`, clés `pb:pbp:<personne>:<site>` (état) et `pb:pbp-ws:<personne>:<site>` (dispositions personnelles) : jamais mélangées entre personnes ni entre sites (site principal = 0). Les largeurs/masquages restent dans `pb:panels`.

## Raccourcis (sans conflit avec l'existant)
Ctrl/⌘ + Alt + **1** gauche · **2** droite · **0** les deux · **F** conception étendue (retour au même état) · **R** disposition par défaut. Ignorés dans un champ de saisie et quand une boîte de dialogue est ouverte. Non personnalisables (l'éditeur n'a pas de système de raccourcis configurable).

## Performance
- Écouteurs globaux installés une seule fois (clavier, pointeur, redimensionnement) ; les gestes ne posent des écouteurs que sur la poignée saisie et les retirent au relâchement.
- Pendant un déplacement : seul `transform` du panneau change ; le canevas n'est ni reconstruit ni redessiné (test : 0 mutation, largeur stable) ; l'iframe reçoit `pointer-events: none` pendant le geste (le panneau ne peut pas déclencher de sélection ou de déplacement d'élément).
- `queueZoom()` n'est appelé que lorsque la mise en page change (détacher, ancrer, mode, masquer).

## Tests
`tests/page-builder-panneaux-navigateur.test.js` (Chrome réel, 9 parcours) ; `tests/helpers-chrome-cdp.js` gagne `mouseDrag`. Tests existants mis à jour : `editeur-raccourcis-boite-navigateur.test.js` (la liste passe de 20 à 25 raccourcis).

## Limites connues (non faites)
- **Pas d'ancrage en haut/en bas**, ni d'échange de côté (un panneau gauche ne s'ancre qu'à gauche).
- **Pas de regroupement de panneaux en onglets** (fusionner Éléments et Structure dans une même fenêtre).
- Les propriétés ne peuvent pas être détachées seules (la Structure, oui) : leur contenu est reconstruit à chaque sélection.
- **« Réduit » et « Masqué » sont un seul mode** (aucune place occupée).
- Écrans ≤ 1100 px : la pile verticale existante reste en vigueur (pas de flottant ni de barre d'icônes) ; le glisser tactile fonctionne (événements pointeur) mais n'a pas été essayé sur un vrai appareil tactile.
- Les raccourcis ne sont pas personnalisables.
