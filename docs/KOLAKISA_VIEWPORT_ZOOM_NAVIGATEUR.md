# Zoom, outil Main et Navigateur de l'éditeur de pages

Code : `public/js/page-builder.js` (source unique : variables `zoom` et `zoomFit`), `public/js/page-builder-direct.js` (panoramique depuis la zone grise),
`public/js/page-builder-navigator.js` (panneau Navigateur, **chargé au premier clic**), `public/css/page-builder.css`, bouton dans `views/marketing/page-builder.ejs`.
Aucun changement serveur, aucune dépendance ajoutée, rien de chargé sur le site publié.

## Cause des saccades (mesurée)
1. **Chaque événement de défilement reconstruisait tout** : à chaque `scroll`, l'éditeur supprimait et recréait les cadres de sélection et les poignées dans la page
   (forçant une mise en page) et redessinait les règles, sans regrouper les mises à jour. Avec un élément sélectionné : **120 mises en page pour 120 mouvements de main**.
2. **Chaque zoom recalculait la page entière, puis relisait les mesures plusieurs fois** (règles, informations, barre d'actions), le tout sans transition : saut visible, ~4 mises en page par clic.
3. L'outil Main n'avait **pas de capture du pointeur** (le geste s'arrêtait en sortant du cadre) et mesurait la distance avec des coordonnées du cadre, qui bougent avec le défilement horizontal.

## Ce qui a été fait
- **Zoom** : lectures d'abord, écritures ensuite (une seule mise en page) ; transition jouée en **transformation d'échelle** (130 à 200 ms, courbe unique `--kol-motion-ease`),
  image de départ = image déjà affichée (aucun saut), `will-change` seulement pendant le geste, barre d'actions masquée pendant la transition, décors (règles, infos) redessinés une fois à la fin.
  Clics en rafale : chaque clic repart de l'échelle réellement affichée. « Mouvement réduit » : zoom immédiat.
- **Niveaux** : 25 · 33 · 50 · 66 · 75 · 100 · 125 · 150 · 200 · 300 · 400 % (boutons +/−, Ctrl/⌘ + / −, menu du pourcentage inchangé). « Ajuster », 1:1 et le menu existent toujours.
- **Ctrl/⌘ + molette** (et pincement) : un niveau par geste (au plus un recalcul tous les 110 ms).
- **Défilement** : au plus UNE mise à jour par image (règles, barre d'actions, Navigateur) ; les cadres de sélection suivent seuls le défilement et ne sont refaits qu'à l'arrêt (140 ms).
- **Main** : pointeur capturé (le geste continue hors du cadre), distance prise à l'écran, une écriture par image, correspondance 1:1 vérifiée à 100 % et 200 %. Espace maintenu = main temporaire (déjà présent, conservé : jamais dans un champ, un menu ou une fenêtre).
- **Navigateur** (bouton à côté du zoom) : miniature **dessinée sur un canvas** à partir de rectangles simplifiés (sections, conteneurs, titres, textes, médias, boutons), jamais un clone du DOM ;
  rectangle de la zone visible exact (coordonnées du DOCUMENT, indépendantes du zoom) ; clic dans la miniature = aller là ; glisser le rectangle ; flèches du clavier ; zoom −/+, ajuster, page entière, retour en haut à gauche ; panneau déplaçable (position mémorisée), fermeture par × ou le bouton.
  Miniature redessinée seulement quand le contenu change (≤ 4 fois par seconde).

## Mesures (même banc, même machine, 336 éléments, un élément sélectionné)
| | Avant | Après |
|---|---|---|
| Main, 120 mouvements : mises en page | 120 | 7 |
| Main : recalculs de style | 126 | 14 |
| Main : temps de script | 125 ms | 36 ms |
| Main : images > 24 ms | 9 | 0 |
| Zoom, 20 clics : mises en page | 80 | 44 |
| Zoom, 20 clics : temps de script | 89 ms | 56 ms |
Navigateur chargé à la demande : aucune requête avant le premier clic (vérifié).

## Limites honnêtes
- Mesures faites dans Chrome sans écran réel, sur une machine très chargée : les durées d'image sont calées sur 60 Hz ; **120 images/s non mesurables ici**, aucune promesse sans test sur un vrai appareil.
- **Pas de flou de transition** : une transformation d'échelle donne déjà la sensation, un filtre sur toute la page coûterait cher à chaque image.
- **Le zoom est centré sur le document, pas sur le curseur** : en mode « ordinateur » la largeur de la page suit le zoom (la page se remet en forme), un point d'ancrage au curseur n'aurait pas de sens ; le point reste stable en largeur et en haut.
- Le moteur n'est pas React : aucun rendu à contrôler de ce côté ; les changements d'état passent par le même JavaScript direct.
- Le test de performance de la manipulation directe est sensible à la charge de la machine (voir le rapport de session).

## Tests
`tests/editeur-navigateur-viewport-navigateur.test.js` (7 scénarios Chrome), `tests/editeur-viewport-perf-navigateur.test.js` (mesures ; `PERF_OUT=fichier.json`).
`tests/editeur-canvas-navigateur.test.js` adapté aux niveaux usuels (3 clics « − » pour 50 %, 2 clics « + » pour 150 %).
