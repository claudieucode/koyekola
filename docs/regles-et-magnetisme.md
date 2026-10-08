# Règles, guides, grille et magnétisme (éditeur de pages)

Outils de **conception** de l'éditeur visuel. Ce sont des préférences d'interface de votre navigateur : ils ne sont jamais
enregistrés dans le contenu de la page, jamais envoyés au serveur et n'apparaissent jamais sur le site publié (vérifié par
`tests/editeur-regles-magnetisme-navigateur.test.js`, scénario T16).

## Où les trouver
- Barre du haut : boutons **Grille**, **Règles**, **Magnétisme** (interrupteurs) et le bouton **Règles, guides et magnétisme**
  (menu rapide : Règles / Guides / Grille / Magnétisme / Guides intelligents, puis « ⚙ Paramètres… »).
- Fenêtre flottante **Règles et magnétisme** : affichage, magnétisme (chaque option séparément), unités, guides (liste et
  saisie de position), grille libre ou web, zone de sécurité, force et distance d'accrochage, rappel des raccourcis.
- Clic droit sur une règle ou un guide : menu des guides. Clic sur le coin des règles : choix de l'unité.
- Clic sur le niveau de zoom : 50 / 64 / 75 / 100 / 125 / 150 / 200 % et « Ajuster ».

## Règles
- Coordonnées = **pixels CSS de la page** (origine : coin haut gauche, l'axe vertical suit le défilement).
- Unités d'affichage : px, %, rem, em, vw, vh. Elles ne changent que l'**affichage** (% : largeur de la page en x, hauteur en y ;
  rem : taille de texte de la page ; em : taille de texte de la sélection).
- Les graduations s'adaptent au zoom (pas « rond » de 56 px d'écran au moins) ; l'étendue de l'élément sélectionné est surlignée.

## Guides
- Créer : tirer depuis une règle, ou saisir une position dans le panneau (« 640 », « 50 % »…).
- Déplacer : glisser ; saisir une valeur dans la liste ; double-clic sur un guide ouvre sa position.
- Supprimer : Suppr, clic droit → « Supprimer ce guide », bouton × de la liste, ou glisser vers la règle.
- Indépendants par écran (ordinateur / tablette / mobile), ou communs à tous les écrans (case du panneau).
- Mémorisés par page, dans ce navigateur (`localStorage`, clé `pb:guides-<page>`).

## Grille
- **Libre** : lignes à pas régulier (4, 8, 10, 12, 16, 24, 32 px ou pas personnalisé).
- **Web** : 1 à 16 colonnes, gouttière, marges gauche et droite, largeur maximale du conteneur (centré). Réglages propres à
  chaque écran (ordinateur 12 col., tablette 8, mobile 4 par défaut).
- Aides indépendantes : marges, limites du conteneur, zone de sécurité (haut, bas, gauche, droite).

## Magnétisme
S'applique quand on **redimensionne** un élément (poignées de largeur / hauteur), quand on **place un guide**, et sur la
séparation des colonnes. Cibles, par priorité : guides · écart réel (gap Flexbox / Grille, ou écart déjà utilisé entre voisins) ·
colonnes (web et pistes de la Grille CSS) · centre de la page / du parent · bords et centres des autres éléments · bords (page,
conteneur, parent) · grille. Un guide posé par vous l'emporte toujours. Le bord visé est celui qui **tombe réellement** à
l'endroit voulu : la mise en page (case centrée, Flexbox qui rétrécit) est mesurée puis corrigée.

Le déplacement d'un élément (glisser-déposer) réordonne la structure : il n'y a pas de position libre, donc rien n'est jamais
écrit en `position: absolute`.

## Raccourcis réellement implémentés
| Touche | Action |
|---|---|
| R | Règles (existant) |
| Maj + R | Guides |
| Maj + G | Grille |
| Maj + M | Magnétisme |
| Alt maintenu pendant un geste | mouvement libre, sans accrochage |
| Maj (poignée d'angle) | garder les proportions |
| Alt + survol d'un élément (une sélection active) | distances avec l'élément survolé |
| Suppr | supprimer le guide sélectionné |

## Fichiers
- `public/js/page-builder-snap.js` — moteur (calculs purs, testés sous Node) : préférences, graduations, unités, grille web, cibles, distances.
- `public/js/page-builder.js` — dessin des règles, de la grille et des guides ; accrochage pendant les gestes ; repères intelligents.
- `public/js/page-builder-rules.js` — fenêtre de réglages et menu rapide.
- `public/css/landing.css` (calques dans le canevas), `public/css/page-builder.css` (fenêtre).
- Tests : `tests/editeur-regles-magnetisme.test.js` (moteur), `tests/editeur-regles-magnetisme-navigateur.test.js` (Chrome réel).
