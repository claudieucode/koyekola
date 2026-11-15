# Zoom, outil Main, zoom par zone et Navigator Studio de l'éditeur de pages

Code : `public/js/page-builder.js` (source unique : variables `zoom` et `zoomFit`, fonctions `applyZoom`, `setZoom`, `viewState`, `viewTo`), `public/js/page-builder-direct.js` (panoramique depuis la zone grise, main temporaire par Espace),
`public/js/page-builder-navigator.js` (panneau Navigator Studio, **chargé au premier clic**), `public/css/page-builder.css` (bloc « Navigation du canevas »), `public/css/landing.css` (deux curseurs), barre du bas dans `views/marketing/page-builder.ejs`.
Aucun changement serveur, aucune dépendance ajoutée, rien de chargé sur le site publié.

## Cause des saccades (mesurée) et correctifs du moteur
1. **Chaque événement de défilement reconstruisait tout** : les cadres de sélection et poignées étaient supprimés et recréés (mise en page forcée) et les règles redessinées, sans regroupement. Avec un élément sélectionné : **120 mises en page pour 120 mouvements de main**. Désormais une mise à jour par image ; les cadres de sélection suivent seuls le défilement et ne sont refaits qu'à l'arrêt.
2. **Chaque zoom recalculait la page entière, puis relisait les mesures plusieurs fois, sans transition.** Désormais : lectures d'abord, écritures ensuite, une seule mise en page ; transition = **transformation d'échelle** (130 à 200 ms, une seule courbe), départ = image déjà affichée (aucun saut, translation horizontale ET verticale), `will-change` seulement pendant le geste. « Mouvement réduit » : immédiat.
3. **Main** : pointeur capturé (le geste continue hors du cadre), distance prise à l'écran (le cadre bouge avec le défilement), une écriture par image, correspondance 1:1 vérifiée à 100 % et 200 %.
4. **Collision de noms trouvée par les tests** : le préfixe `pb-nav-*` appartient au gestionnaire de menu de navigation (`page-builder-menu.css`) ; le panneau utilise donc `pb-nvs-*`.

## Zoom
- **Niveaux** : 10 · 25 · 33 · 50 · 66 · 75 · 100 · 125 · 150 · 200 · 300 · 400 · 500 %, boutons +/−, Ctrl/⌘ + / −, menu du pourcentage (qui propose aussi les ajustements). **Valeurs intermédiaires** : champ « zoom personnalisé » du Navigator, molette.
- **Molette** (Ctrl/⌘ + molette, pincement) : zoom **progressif**, le point sous le curseur reste sous le curseur (vérifié en largeur fixe : tablette, mobile, ou ordinateur au-delà de ~127 %).
- **Ajustements** : à l'écran (≤ 100 %), à la largeur (remplit la largeur, jusqu'à 500 %), à la hauteur (la section en cours remplit la hauteur), page entière, 100 %, centrer le document, zoom sur la sélection.
- **Zoom par zone** (outil Z, bouton de la barre du bas, ou barre d'outils de gauche) : on dessine un rectangle (visible, aligné sur le pointeur), la zone se centre et remplit la vue ; clic = un niveau, Alt + clic = un niveau en arrière, Échap annule.
- **Historique de vues** (20 au plus) : Précédent / Suivant ; début, milieu, fin de page ; liste des sections.

## Barre du bas (gizmo)
− · pourcentage (menu) · + · 1:1 | ajuster à l'écran · **main (vraie icône)** · **zoom par zone** · **Navigator**. États actifs distincts, info-bulles, se décale quand le Navigator est ancré, le bouton 1:1 se masque sous 860 px (le 100 % reste dans le menu et au clavier).

## Navigator Studio
- **Miniature RÉELLE** : le serveur renvoie déjà le HTML rendu de la page (c'est ce que charge le canevas). Le Navigator recharge ce **même rendu** dans un cadre isolé **sans script** (`sandbox="allow-same-origin"`), à la largeur réelle de la page, réduit par une transformation d'échelle. Images, textes, couleurs, polices, arrière-plans, bordures et colonnes sont ceux de la page (vérifié : même texte, même couleur, même taille, même police). Aucun clonage du DOM interactif, aucun script rejoué, aucune surcouche d'édition, `100vh` ramené à la hauteur de l'écran d'origine.
- **Actualisation** : différée et regroupée (≥ 500 ms après la dernière modification, ≥ 1,2 s entre deux reconstructions, jamais pendant un geste), double tampon (l'ancien rendu reste jusqu'à ce que le nouveau soit prêt), cadre **retiré à la fermeture** (aucune mémoire gardée).
- **Rectangle de navigation** : exact (coordonnées du DOCUMENT, indépendantes du zoom), repère discret de la sélection ; cliquer dans la miniature = y aller ; glisser le rectangle ; flèches du clavier.
- **Panneau** : redimensionnable par les 8 bords et coins (bornes minimale et maximale), déplaçable, **verrouillable**, réduire / agrandir / restaurer, rétablir la disposition par défaut, **mode flottant** ou **mode ancré** (colonne à droite du canevas qui RÉSERVE sa place : le canevas se réduit, rien n'est masqué, la barre de zoom se décale). Disposition mémorisée (< 400 octets, jamais de capture). La miniature se redimensionne sans déformation.
- **Apparence** : uniquement les jetons de l'éditeur (`--editor-card`, `--editor-border`, `--editor-text`…), donc clair, sombre et personnalisé sans palette propre. La barre de zoom du bas suit désormais aussi le mode sombre (elle restait blanche).
- **Responsive** : la miniature représente la page à la largeur réelle de l'écran en cours (ordinateur, tablette, mobile), indépendamment du zoom de l'éditeur.

## Navigator Studio v2 (refonte du panneau)
- **Deux zooms indépendants** : le zoom du CANEVAS (−, pourcentage, +, ajustements, menu 10 → 500 %) et le zoom de l'APERÇU (barre en bas à gauche de la miniature : −, pourcentage de l'aperçu, +, vue globale, centrer ; Ctrl/⌘ + molette ou pincement ; touches + − 0 dans l'aperçu ; bouton du milieu pour le déplacer). Le zoom de l'aperçu ne touche jamais au canevas (testé). Le cadre reste exact et reste visible : l'aperçu défile tout seul s'il sort de l'espace.
- **Commandes regroupées** : ligne « Zoom du canevas » (− · % ▾ · + | fenêtre · largeur · hauteur · 1:1 · réinitialiser la position) et ligne « Navigation » (vue précédente/suivante | début · milieu · fin | main · zoom par zone · zoom sur la sélection | Sections ▾ | disposition par défaut). Plus de bloc « Navigation avancée » dépliant.
- **Sections** : un petit bouton ouvre une liste avec recherche, navigation au clavier (↑ ↓ Entrée, Échap) et sections récentes en tête (4 mémorisées, quelques octets).
- **Focus discret** : fine bordure + léger halo bleu ; le gros contour global est neutralisé dans le panneau.
- **Adaptation** : requêtes de conteneur — sous 300 px le libellé « Sections » disparaît, sous 250 px les commandes secondaires se masquent (accessibles par le menu et le clavier).
- **Moteur** : le zoom maximal passe à 500 %.
- Non fait : « repères » (aucune fonction de repère de vue n'existe dans l'éditeur, rien d'inventé).

## Mesures (même banc, 336 éléments, un élément sélectionné)
| | Avant | Après |
|---|---|---|
| Main, 120 mouvements : mises en page | 120 | 3 à 7 |
| Main : temps de script | 125 ms | 26 à 36 ms |
| Main : images > 24 ms | 9 | 0 |
| Zoom, 20 clics : mises en page | 80 | 44 |
| Zoom, 20 clics : temps de script | 89 ms | 56 à 63 ms |
| Navigator : ouverture jusqu'à la miniature | n/a | 194 ms, aucune tâche longue |
| Main avec Navigator ouvert : temps de script | n/a | 57 ms (+0,26 ms par image) |
| Fuites : 15 ouvertures/fermetures | n/a | aucune (un seul panneau, aucun cadre restant, mémoire stable) |

## Limites honnêtes
- Mesures faites dans Chrome sans écran réel : durées d'image calées sur 60 Hz ; **120 images/s non mesurables ici**, aucune promesse sans test sur un vrai appareil.
- **Pas de flou de transition** : une transformation d'échelle donne déjà la sensation, un filtre sur toute la page coûterait cher à chaque image.
- **« Mode intégré »** : le Navigator s'ancre dans l'espace de travail (colonne à droite du canevas, place réservée) ; il n'est **pas** inséré dans le système de panneaux latéraux (calques / inspecteur), dont la grille est fixe.
- **Mode ordinateur** : entre ~68 % et ~127 % de zoom, la largeur de la page suit le zoom (la page se remet en forme) ; l'ancrage au curseur est alors approximatif en largeur. Hors de cette plage, et en tablette / mobile, il est exact.
- **Pages extrêmement longues** (> 60 000 px) : la miniature est tronquée à cette hauteur.
- Miniature : les contenus intégrés (cartes, vidéos) apparaissent comme des boîtes vides, les animations d'apparition qui dépendent d'un script restent à l'état initial.
- Un test de performance de la manipulation directe est sensible à la charge de la machine (échoue aussi sur l'ancienne version) ; deux tests de règles (T5, T7) échouent à l'identique sur l'ancienne version.

## Tests
`tests/editeur-navigateur-viewport-navigateur.test.js` (15 scénarios Chrome), `tests/editeur-viewport-perf-navigateur.test.js` (mesures ; `PERF_OUT=fichier.json`, `PERF_NAVIGATOR=1` pour le Navigator ouvert).
`tests/editeur-canvas-navigateur.test.js` et `tests/editeur-regles-magnetisme-navigateur.test.js` adaptés aux niveaux usuels (66 % au lieu de 64 %).
