# 08 — Menus, sous-menus, méga-menus, mobile, clavier (en-tête Elementor)

Sources : S1 https://elementor.com/help/the-menu-widget/ ; S4 https://elementor.com/help/nav-menu-widget-pro ; S8 https://elementor.com/help/what-is-mega-menu ; S3 https://elementor.com/help/off-canvas-widget/ ; W5 recherche « Create a mega menu » (https://elementor.com/help/videos/how-to-create-a-mega-menu/ , article « Create a mega menu » non lu). Légendes : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] ; NON VÉRIFIÉ.

## 1. Deux widgets de menu
- Activer les expériences Flexbox Containers, Nested Elements et Menu remplace Nav Menu par deux widgets : « WordPress Menu » (comportement de Nav Menu) et « Menu » (méga-menu). Source S1, S8.
- Si le widget ne s'affiche pas dans le panneau, l'expérience n'est probablement pas active (S1).
- Statut : le widget Menu est [EXPÉRIMENTAL] ; licence exacte : l'article ne la précise pas dans son corps (S1) → NON VÉRIFIÉ ; le WordPress Menu est [PRO] (URL « nav-menu-widget-pro »).

## 2. Widget « WordPress Menu » [PRO] (S4)
Onglet Contenu
- Menu : un menu créé sous Apparence > Menus.
- Disposition : Horizontal, Vertical, Liste déroulante.
- Alignement : Gauche, Centre, Droite, Justifié.
- Pointeur (marque l'élément survolé/actif) : Aucun, Souligné, Double ligne, Encadré, Arrière-plan, Texte.
- Animation du pointeur : Fondu, Glisser, Agrandir, Chute (Drop In), Remontée (Drop Out), Aucune.
- Indicateur de sous-menu : Aucun, Classique, Chevron, Angle, Plus.
- Menu mobile (liste déroulante) : Point de rupture (Mobile, Tablette, Aucun) ; Pleine largeur (Oui/Non) ; Alignement du texte (Latéral / Centre) ; Bouton bascule (affiche l'icône hamburger) ; Icône pour états Normal, Survol, Actif (bibliothèque ou SVG personnalisé si « Enable SVG Support ») ; Alignement du bouton (G/C/D).
Onglet Style
- Menu principal : Typographie ; Couleur du texte ; Couleur du pointeur (survol et actif ; l'état normal utilise la couleur d'accent des Couleurs globales) ; Séparateur (style solide/double/pointillé/tirets/rainure, largeur px, hauteur px ou %, couleur) ; Largeur du pointeur ; Remplissage horizontal et vertical (px) ; Espace entre éléments (px).
- Liste déroulante : couleur de texte, couleur de fond, typographie, type de bordure (aucune, solide, double, pointillée, tirets, rainure), rayon, ombre, remplissage H/V, séparateur (type, couleur, largeur) , Distance entre bascule et menu.
- Bouton bascule : couleur, fond, taille, largeur et rayon de bordure, chacun en états Normal et Survol.
Onglet Avancé : voir S24 dans `02_HEADER_WIDGET_CATALOG.md`.
Non documenté dans S4 : comportement tactile, navigation clavier, ARIA → NON VÉRIFIÉ.

## 3. Widget « Menu » (méga-menu) [PRO] [EXPÉRIMENTAL] (S1)
Onglet Contenu
- Éléments du menu : pour chacun Titre, Lien (attributs personnalisés et contenu dynamique permis), Contenu déroulant (active un conteneur), Icône, ID CSS ; boutons dupliquer/supprimer ; bouton « Ajouter un élément ».
- Largeur du contenu : Pleine largeur ou Ajusté au contenu (appliqué à l'ensemble du menu).
- Disposition des éléments : Horizontal (côte à côte, bureau) ou Liste déroulante (haut-bas, tablette/mobile).
- Position des éléments : horizontal = gauche, droite, centré, étiré ; liste déroulante = gauche, droite, centré.
- Indicateur de liste déroulante : icône et icône active pour les éléments à sous-menu (distinct de l'icône de disposition).
- Effet de liste déroulante : Ouvrir au Clic ou au Survol ; Animation de fondu lent optionnelle avec durée.
- Bascule du menu (Menu Toggle) : alignement G/C/D ; icône ; états Normal, Survol, Actif.
- Paramètres additionnels : Défilement horizontal (activé/désactivé ; désactivé = les éléments passent sur plusieurs lignes) ; Point de rupture : Aucun, Mobile portrait (bascule sous 767 px), Tablette portrait (sous 1024 px).
Onglet Style
- Éléments du menu : espace entre éléments, distance du contenu, typographie, couleur, ombre du texte, fond, bordure, séparateur (style, largeur, hauteur, couleur), rayon, remplissage.
- Icône : position (droite, gauche, haut, bas), taille, espacement, états Normal/Survol/Actif, couleur.
- Indicateur de liste déroulante : taille, rotation, espace, espacement, états Normal/Survol/Actif, couleur.
- Bascule du menu : taille, états Normal/Survol/Actif, couleur, fond, bordure, ombre, rayon, distance de la liste.
- Contenu : fond, bordure, rayon, ombre, remplissage de la zone de contenu de l'onglet.
- Menu déroulant : états Normal et Actif, couleur du texte, fond, ombre.
- Boîte déroulante : bordure, rayon, ombre de la boîte autour du contenu.
Limites : la seule animation documentée est le fondu de l'effet de liste déroulante ; pas d'animation de pointeur type souligné (S1). Accessibilité : aucune consigne dans S1 → NON VÉRIFIÉ.

## 4. Sous-menus
- Dans Menu : activer « Contenu déroulant » sur un élément ; un conteneur apparaît ; on y glisse widgets ou un autre widget Menu (sous-menu imbriqué) (S1).
- Dans WordPress Menu : sous-menus issus de la hiérarchie WordPress, marqués par l'indicateur (Classique, Chevron, Angle, Plus) (S4). Ouverture clic/survol de ce widget : NON VÉRIFIÉ.

## 5. Méga-menu (S1, S8)
- Définition : grande liste déroulante multi-colonnes pouvant contenir images, icônes, vidéos, widgets (S8).
- Construction : Contenu déroulant sur un élément, flèche sur le canevas pour ouvrir son conteneur, y placer Texte, Image ou un autre Menu (S1).
- Déclencheur : Clic ou Survol (réglage Ouvrir sur) (S1).
- Largeur/position du panneau : non décrites dans S8 ni dans S1 (le réglage « Largeur du contenu » de S1 vise le menu) → NON VÉRIFIÉ pour la largeur de panneau et le positionnement par rapport à l'en-tête.
- Article « Create a mega menu » et « Style a mega menu » existent (liens de S1) mais n'ont pas pu être lus.

## 6. Menu mobile / hamburger
- Bouton bascule : voir §2 et §3. Point de rupture : Mobile (767 px), Tablette (1024 px) ou Aucun (S1 ; S4 Mobile/Tablette/Aucun).
- Le terme « hamburger » n'est utilisé que dans S4 (icône du bouton bascule).
- En mobile, le menu passe en disposition Liste déroulante (S1, S4).
- Alternative : menu mobile dans un Off-Canvas (S3), voir `09`.

## 7. Clavier et accessibilité
- Aucune des pages lues (S1, S4, S8) ne décrit : touches Tab/Flèches/Échap, aria-expanded, focus piégé, comportement tactile (premier toucher = ouvre le sous-menu ?). Tout ceci → NON VÉRIFIÉ. À spécifier librement pour Kolakisa (bonnes pratiques WAI-ARIA, hors périmètre de ces sources).
- S8 affirme seulement que les méga-menus améliorent « la convivialité et l'accessibilité » par une organisation claire.

## 8. Tests nécessaires pour Kolakisa
Chaque disposition (3), alignement (4), pointeur (6) × animation (6), indicateur (5), rupture (3), ouverture clic/survol, états Normal/Survol/Actif du bouton bascule, SVG personnalisé, défilement horizontal vs retour à la ligne, sous-menu imbriqué, tactile, clavier, lecteur d'écran.
