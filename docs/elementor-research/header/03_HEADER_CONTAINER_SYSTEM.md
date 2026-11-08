# 03 - Système de conteneurs et de structure d'un header (Elementor)

Recherche documentaire pour Kolakisa. Aucun code propriétaire copié. Légende : [NATIF] = Elementor gratuit, [PRO] = Elementor Pro, [EXPÉRIMENTAL] = statut expérimental/alpha/bêta, [EXTENSION] = hors noyau. « NON VÉRIFIÉ » = non confirmé par une page lue.

Deux générations d'éditeur coexistent :
- **Éditeur V3 (classique)** : conteneur Flexbox / Grid avec onglets Layout / Style / Advanced.
- **Éditeur V4 (Atomic)** : onglets General / Style, classes, états. Statut : l'article source indique « Alpha puis Bêta (3.35, fév. 2026), puis Stable (changelog 4.0.0, 2026-03-30) » mais l'ordre du changelog est ambigu -> statut exact NON VÉRIFIÉ. À traiter comme [EXPÉRIMENTAL/à vérifier] tant que non confirmé. (https://elementor.com/pro/changelog/ via recherche ; https://elementor.com/products/website-builder/v4-faq/)

## 1. Construire un header avec un conteneur (recette officielle)
Source : https://elementor.com/help/creating-a-header-template-with-the-container/
1. Créer un template Header dans le Theme Builder [PRO pour le Theme Builder - NON VÉRIFIÉ sur la page ; le menu l'indique sous « Design your Theme > Templates »].
2. Ajouter un conteneur : « + » sur le canevas, choisir Flexbox, structure « un conteneur en lignes ».
3. Layout : Content Width = Boxed ; Justify Content = End (pousse à droite) ; Align Items = Center.
4. Advanced : padding 10 px sur les 4 côtés.
5. Ajouter dans l'ordre : widget Social Icons, widget Icon (loupe) lié à un Off-canvas contenant la recherche, widget Menu (Item Position = Center), widget Site Logo.
6. En tablette le menu passe en hamburger (réglage du widget Menu) ; ajuster chaque appareil via le mode responsive.

## 2. Conteneur Flexbox - onglet Layout (V3)
Sources : https://elementor.com/help/container-layout-tab-settings/ ; https://elementor.com/help/adjusting-the-contained-elements ; https://elementor.com/help/?p=31629

| Contrôle | Valeurs | Responsive |
|---|---|---|
| Container Layout / type | Flexbox ou Grid (liste déroulante) | non précisé |
| Content Width | **Boxed** (défaut des nouveaux conteneurs) ou **Full Width**. Boxed : règle la largeur du contenu interne, conteneur inchangé ; Full Width : règle la largeur du conteneur lui-même | oui |
| Width | PX, %, VW (curseur ou saisie) | oui |
| Min Height | PX ou VH (100VH = hauteur d'écran). Aucune option « Height » fixe séparée dans l'article | oui |
| Direction | Row, Column, Row Reversed, Column Reversed | oui |
| Justify Content | Flex Start, Center, Flex End, Space Between, Space Around, Space Evenly | oui |
| Align Items | Flex Start, Center, Flex End, Stretch (Stretch seulement si les enfants n'ont pas de largeur définie) | oui |
| Elements Gap (Content Gap) | PX, %, VW ; défaut 20px, modifiable dans Site Settings > Layout | oui |
| Wrap | Wrap / No Wrap (les enfants avec largeur définie passent à la ligne) | oui |
| Align Content | visible seulement si Wrap actif : center, flex-start, flex-end, space between, space around, space evenly | oui |
| Overflow | Default (visible), Hidden (coupé, inaccessible), Auto (barre de défilement) | NON VÉRIFIÉ |
| HTML Tag | liste de balises sémantiques ; choisir « a » rend le conteneur cliquable (lien) | oui |

Notes :
- Le gap se comporte comme un espacement extérieur ; avec Wrap, laisser de la place dans les largeurs enfants (exemple officiel 47,5 % / 5 % / 47,5 %).
- Ajouter une marge gauche/droite à un conteneur de premier niveau peut créer un scroll horizontal : mettre la marge sur un conteneur enfant (https://elementor.com/help/container-advanced-tab-settings/).
- Le défilement Sticky de l'éditeur V4 ne fonctionne pas si le parent a Overflow = hidden (https://elementor.com/help/style-tab-position/).

## 3. Conteneur Flexbox - propriétés « enfant » (onglet Advanced, V3)
Source : https://elementor.com/help/container-advanced-tab-settings/ ; https://elementor.com/help/advanced-tab/
- **Align Self** : flex-start, center, flex-end, stretch (la page générique Advanced ajoute Baseline).
- **Order** : Start, End ou Custom (valeur d'ordre ; plus petit = d'abord). Sert surtout à réordonner par point de rupture.
- **Size** (flex) : None, Grow, Shrink, Custom (Custom Flex Grow / Custom Flex Shrink).
- **Width** (widgets) : Full Width (100 %), Inline (auto), Custom (PX, %, VW). « Inline (auto) » ne marche pas dans un conteneur, c'est la Direction qui gouverne.
- **Position** : Default, Absolute (relatif au premier parent positionné), Fixed (relatif à la fenêtre). Absolute/Fixed : Horizontal Orientation (Start/End + Offset) et Vertical Orientation (Start/End + Offset). Absolute « déconseillé pour les mises en page générales ».
- **Z-Index**, **CSS ID** (sans #), **CSS Classes** (sans .).
- **Margin / Padding** : PX, EM, %, REM ; chaîne pour dissocier les 4 côtés.

## 4. Conteneur Grid (V3)
Sources : https://elementor.com/help/?p=35466 ; https://elementor.com/help/create-a-grid-container/ (via recherche)
- Container Type : Grid ou Flexbox. Container Width : Boxed (curseur Width actif, centré) ou Full Width. Minimum Height : curseur.
- Grid Outline : Show (défaut) / Hide (aide d'édition).
- Columns / Rows : curseurs ; unité FR par défaut ; liste « Measurement » pour passer à des unités personnalisées (PX, EM, REM, propriétés CSS) avec une taille par ligne (ex. `200PX 1FR 400PX`).
- Gaps : espace entre cellules. Autoflow : Row ou Column.
- Justify Items / Align Items : alignement du contenu des cellules (horizontal / vertical).
- Justify Content / Align Content : position des cellules dans la grille, visibles seulement si les tailles personnalisées totalisent moins que le conteneur.
- Passer un Flexbox en Grid donne 3x2 par défaut.
- Pertinence header : la grille est utile pour un header 3 zones (logo / menu / actions) avec colonnes `1fr auto 1fr`. (Recommandation Kolakisa, pas une affirmation de la source.)

## 5. Grid dans l'éditeur Atomic V4
Source : https://elementor.com/help/how-to-use-css-grid-in-the-atomic-editor/ ([NATIF], statut non indiqué par l'article)
- Panneau Layout : colonnes/lignes explicites (toute unité CSS, dont fr), Gaps, Auto-flow, Show Grid Outline (aide d'édition uniquement), Dense auto-placement.
- Enfant de grille : Grid Column / Column Span, Grid Row / Row Span, Align Self, Order.
- Un changelog tiers/officiel cité en recherche mentionne que la Grid atomique était « en développement » ou arrivée en 4.2.0 : sources contradictoires, NON VÉRIFIÉ.

## 6. Éditeur V4 : Layout / Size / Position (Style tab)
Sources : https://elementor.com/help/style-tab-position/ ; https://elementor.com/help/style-tab-spacing/ (via recherche) ; https://elementor.com/help/sticky-headers/
- Sections du Style tab : Layout, Spacing, Size, Position, Typography, Background, Border, Effects.
- **Position** : Static (défaut, pas d'offsets), Relative, Absolute (depuis le plus proche parent Relative, sinon la page), Fixed, Sticky (reste visible dans son parent). Champs d'offset : Top, Bottom, Left nommés (Right non mentionné). Z-index. **Anchor offset** (distance depuis le haut quand on saute à une ancre, ex. 120 px pour ne pas cacher la cible sous un header sticky).
- **Header sticky V4** : conteneur enveloppe (Width 100 %, Min height = hauteur du header ex. 80 px, Position Static) + conteneur interne (Width 100 %, Position Fixed, Top 0, Z-index 99).
- **Header sticky V3** : Advanced > Motion Effects > Sticky = Top ; Sticky On (Desktop / Tablet Portrait / Mobile Portrait) ; Offset ; Effects Offset ; Stay In Column = No pour un header principal [PRO]. Si les contrôles manquent sur une ancienne section, désactiver Stretch Section.

## 7. Imbrication
- Un conteneur peut contenir des widgets et d'autres conteneurs (« Add New Container » du menu contextuel crée un conteneur imbriqué) : https://elementor.com/help/right-click/
- Les conteneurs étant basés sur flexbox, moins de points de rupture personnalisés sont nécessaires : https://elementor.com/help/responsive-design-using-containers/

## 8. Interactions d'édition
### 8.1 Menu contextuel (clic droit)
Source : https://elementor.com/help/right-click/ ; architecture dev : https://developers.elementor.com/docs/context-menu/
**Conteneur** : Edit Container, Duplicate, Add New Container (imbriqué), Copy, Paste (remplace le contenu), Paste style (garde le contenu), Paste from other site, Reset style, Edit with AI, Save as Template, Save as default, Notes, Structure, Delete.
**Widget** : Edit [widget], Duplicate, Copy, Paste, Paste style, Paste from other site, Paste display conditions, Reset style, Clear display conditions, Save as global (widget global [PRO] - NON VÉRIFIÉ), Save as default, Notes, Structure, Delete.
**Page** (clic droit dans un conteneur vide) : Paste, Paste from other site, Copy All Content, Delete All Content, Structure.
- Mac : régler le clic droit sur « Secondary click » si besoin ; Ctrl/Cmd + clic droit = menu navigateur.
- Côté développeur : les menus sont organisés en groupes (séparateurs) d'actions (callbacks JS) ; types : Element (section/colonne/widget), colonne vide, « Add new section / template » ; actions par défaut non listées en texte : http://developers.elementor.com/docs/context-menu/context-menu-types

### 8.2 Navigator / fenêtre Structure
Source : https://elementor.com/help/navigator/
- Ouverture : clic droit > Structure, icône Structure de la barre du haut, ou Cmd/Ctrl + I.
- Clic sur un élément : sélection et ouverture de son panneau.
- Glisser-déposer : placer avant/après un autre élément.
- Clic droit : menus habituels (Edit, Duplicate, Copy, Paste...).
- Masquer/afficher : bouton oeil (View), éditeur seulement, pas le front.
- Renommer : double-clic sur le nom ; l'IA d'Elementor peut nommer les éléments.
- Replier/déplier : flèche par élément, flèches haut/bas pour tout.
- Marqueur : trait noir à droite si conditions d'affichage, effets de mouvement, position absolue ou CSS personnalisé ; survol = détail.
- Fenêtre flottante ou ancrée à droite.
- Verrouillage d'élément : NON VÉRIFIÉ (non documenté dans les pages lues). Suppression dans le Navigator : non couverte, passe par le menu clic droit.
- Raccourcis clavier autres que Cmd/Ctrl+I : NON VÉRIFIÉ.

### 8.3 Ajout, déplacement, duplication, enregistrement
- Ajout : « + » sur le canevas puis choix Flexbox ou Grid et d'une structure prédéfinie (https://elementor.com/help/creating-a-header-template-with-the-container/ ; https://elementor.com/help/create-a-grid-container/).
- Save as Template / Save as default : voir menu conteneur ci-dessus.
- Glisser-déposer sur le canevas : NON VÉRIFIÉ dans les pages lues (seul le glisser du Navigator est confirmé).

## 9. Application à un header (Theme Builder)
Source : https://elementor.com/help/header-site-part/ (résultat de recherche, non fetché) ; https://elementor.com/help/conditions/
- Theme Builder > Header > Add New, concevoir, Publish, puis conditions Include/Exclude (ex. Entire Site). Plusieurs conditions possibles.
- Dépannage : conditions, Page Layout « Default » (pas Canvas), template publié, cache, visibilité responsive.

## Pistes pour Kolakisa (à valider par l'équipe, pas des faits Elementor)
- Modèle minimal : nœud « conteneur » avec direction, wrap, justify, align, gap, largeur (boxed/pleine), min-height, overflow, position, z-index, order, flex grow/shrink, align-self, + option grille (colonnes/lignes/gap/autoflow).
- Arbre navigable : renommer, masquer (éditeur), plier, glisser, clic droit.
