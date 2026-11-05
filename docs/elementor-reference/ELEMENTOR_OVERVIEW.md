# Elementor : vue d'ensemble de l'éditeur

Date de consultation : 2026-11-05. Renvois `[S#]` vers `ELEMENTOR_REFERENCE_SOURCES.md`. Tout ce qui n'est pas suivi d'un renvoi relève de la connaissance générale et est marqué « non confirmé ».

## 1. Architecture générale de l'éditeur [S40]
L'éditeur a trois zones :
1. **Barre du haut** : outils et réglages.
2. **Panneau** (à gauche) : éléments à glisser (conteneurs, widgets), et réglages de l'élément, de la page et du site. Une flèche « Hide Panel » élargit le canevas.
3. **Canevas** (zone de contenu) : où l'on construit la page, l'article ou une partie du site. Survoler un en-tête ou pied de page l'indique ; cliquer dessus bascule vers son édition ; revenir à la page demande d'enregistrer d'abord.

Réglages d'un conteneur : onglets **Layout, Style, Avancé** ; d'un widget : onglets **Contenu, Style, Avancé** [S40]. En Editor V4 (atomique) les onglets deviennent **General, Style, Interactions** [S4].

Éléments annexes (non confirmés dans les pages lues, connaissance générale) : navigateur d'arborescence (Navigator), historique et révisions (« Revision History », annuler/rétablir figurent dans la liste Core [S33]), mode responsive, modèles (Template Library, export/import [S33]).

## 2. Panneau des widgets et catégories [S41]
Catégories natives (étiquette / identifiant / paquet) :
| Étiquette | Identifiant | Paquet |
|---|---|---|
| Basic | `basic` | Elementor (gratuit) |
| General | `general` | Elementor (gratuit) |
| Pro | `pro-elements` | Elementor Pro |
| Site | `theme-elements` | Elementor Pro |
| WooCommerce | `woocommerce-elements` | Elementor Pro |
| WordPress | `wordpress` | WordPress (widgets WP) |
Une catégorie n'apparaît que si elle contient des widgets. Un widget tiers est dans « general » par défaut [S41]. Des extensions peuvent ajouter leurs propres catégories.

## 3. Structure d'un widget [S43, recherche]
Côté développeur, un widget est une classe qui étend la classe de base des widgets et définit : un **nom** unique (identifiant stocké en base), un **titre** (étiquette affichée), une **icône**, des **catégories**, des **mots-clés** (filtre de recherche du panneau), des **contrôles** (champs de réglages, regroupés en sections) et deux rendus : **PHP** (sortie front) et **modèle JavaScript** (aperçu instantané dans l'éditeur). Les anciens noms avec préfixe underscore sont dépréciés.
Côté utilisateur, un widget = Contenu + Style + Avancé (+ Interactions en V4).

## 4. Cycle de vie d'un élément (non confirmé en détail ; connaissance générale)
- **Ajout** : glisser depuis le panneau, ou cliquer sur « + » du canevas pour créer un conteneur avec sa disposition [S40].
- **Sélection** : clic sur l'élément ; ses réglages s'ouvrent dans le panneau [S40].
- **Modification** : champs du panneau, aperçu en direct.
- **Duplication, suppression** : menu contextuel (clic droit) et icônes de poignée ; copier/coller de style et entre sites existent (3.11 mentionne le copier-coller entre sites [S44]).
- Les articles consultés ne détaillent pas ce menu : à vérifier dans l'éditeur.

## 5. Onglets Contenu / Style / Avancé
### Contenu
Données propres au widget (textes, médias, liens, comportement). Exemple : Counter = nombre de départ/fin, durée [S15].
### Style
Apparence : couleurs, typographie, ombres, espacements, états Normal/Hover [S32].
### Avancé (commun à tous) [S29]
Neuf groupes : **Layout** (marges, remplissage, largeur : Auto/Full Width/Inline/Custom, Align Self, Order, Size flex, Position Default/Absolute/Fixed avec décalages, Z-index, CSS ID/Classes, Display Conditions) ; **Motion Effects** (Scrolling Effects Pro, Mouse Effects, Sticky Pro, Entrance Animation) ; **Transform** (rotation, décalage, échelle, inclinaison, retournements) ; **Background** (Classic ou Gradient, Normal/Hover) ; **Border** (types none/solid/double/dotted/dashed/groove, rayon, ombre) ; **Mask** (forme préréglée ou SVG, taille Fit/Fill/Custom, position, répétition) ; **Responsive** (masquer sur bureau / tablette portrait / mobile portrait) ; **Attributes** (Pro) ; **Custom CSS** (Pro).

## 6. Contrôles et logique conditionnelle
Les réglages sont des « contrôles » (texte, curseur avec unités PX/EM/REM/%/VW, couleur, interrupteur, liste, répéteur, média, lien avec options, typographie…). La logique conditionnelle est visible dans les articles : un champ n'apparaît que si un autre a une valeur :
- Counter : « Title Gap » masqué sans titre [S15].
- Animated Headline : « Delay » seulement en style Highlighted avec boucle infinie [S19].
- Carrousel : Autoplay Speed masqué si Autoplay est désactivé [S31].
- Flip Box : direction seulement pour flip et slide ; bouton stylé seulement si présent [S24].
- Testimonial Carousel : style « Navigation Bubble » seulement avec la peau Bubble [S20].
La syntaxe côté développeur (condition sur la valeur d'un autre contrôle) n'a pas été lue : non confirmé.

## 7. Édition responsive [S29][S6]
- Réglages par appareil : bureau, tablette, mobile (valeur « None » possible par appareil pour l'animation d'entrée [S5]).
- Effets de défilement ciblables par appareil [S6] ; Sticky par appareil (Desktop, Tablet Portrait, Mobile Portrait) [S35] ; visibilité par appareil [S29].
- Points de rupture : valeurs par défaut non lues dans cette passe, sauf onglets imbriqués (767 px mobile, 1024 px tablette) [S39]. Elementor 4.0 propose des interactions par point d'arrêt [S3].
- Les unités de curseur acceptent PX, EM, REM, %, VW (selon le contrôle) [S29].

## 8. Éléments imbriqués et conteneurs
- Les **conteneurs flexbox** remplacent sections/colonnes (activation via Réglages > Fonctions : « Flexbox Container » et « Nested Elements » pour les widgets imbriqués) [S44].
- Widgets imbriqués : **Tabs** (3.10), **Carousel** (3.14), **Accordion** (3.15) ; chaque élément de liste contient un conteneur où poser n'importe quel widget [S39][S31][S44]. Le Tabs imbriqué est livré avec trois onglets [S44 recherche] (le Tabs classique en a deux [S36]).
- L'Accordéon imbriqué remplace l'Accordion et le Toggle dans le panneau (les existants continuent de fonctionner) [S44, recherche].
- Editor V4 : composants atomiques (par exemple Atomic Tabs scindés en parties : enveloppe, menu, déclencheur, contenu, contenu d'onglet), avec classes et styles par partie [S4].

## 9. Sauvegarde, aperçu, publication
Confirmé seulement : le bouton **Publish** applique les réglages (cité dans les articles de défilement [S12][S13]) ; enregistrement requis avant de passer d'un site part à l'autre [S40]. Brouillon, aperçu, mise à jour, planification : non confirmé dans cette passe. Note : l'autoplay et la boucle infinie des carrousels imbriqués sont désactivés dans l'éditeur mais visibles en aperçu ou sur le site publié [S31].

## 10. Gratuit vs Pro [S33]
- **Gratuit (Core)** : Heading, Image, Text Editor, Video, Button, Image Box, Testimonials, Icon, Icon Box, Social Icons, Basic Image Gallery, Image Carousel, Icon List, Counter, Progress Bar, Tabs, Accordion, Toggle, Alert, HTML, Shortcode, Menu Anchor, Sidebar, Google Maps, SoundCloud, Divider, Spacer, Columns ; fonctions : bibliothèque de modèles, ombres, animation d'entrée, animation au survol, dégradés, révisions, mode maintenance, etc. Le site Elementor mentionne aussi Container, Grid (pricing) ; le nombre de widgets gratuits varie selon les pages (28 à 40+ ; non confirmé).
- **Pro (tous niveaux)** : Forms, Slides, Posts, Portfolio, Reviews, Table of Contents, Lottie, Code Highlight, Hotspot, Progress Tracker, Video Playlist, Gallery, Countdown, Flip Box, Animated Headline, Nav Menu, Media Carousel, Testimonial Carousel, Call to Action, Share Buttons, Login, Facebook widgets, Blockquote, Template, Post/Archive/Theme widgets, Ken Burns, Scrolling Effects, Custom Fonts, Theme Builder.
- **Pro Advanced et supérieur** : Custom CSS, Menu Cart, Price Table, Price List, widgets WooCommerce, PayPal, intégrations de formulaires, ACF/Toolset, Popup Builder, modèles cloud.
- Nombres de widgets selon le plan : Essential 50 ; Advanced / Expert 82 (page officielle) ; autres pages donnent 85, 86 : non cohérent.
- **Éditeur** : conteneurs flexbox/grid et V4 Atomic sont des évolutions de l'éditeur gratuit ; Interactions V4 : phase d'entrée avec l'éditeur, phases défilement/survol/clic marquées Pro [S3][S4].
- **Tiers** : The Plus Addons, Xpro, HT Mega, Essential Addons (non utilisés comme preuves).
