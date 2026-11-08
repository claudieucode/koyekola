# 07 - Système responsive du header (Elementor)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION]. « NON VÉRIFIÉ » = non confirmé par une page lue.

## 1. Appareils et points de rupture
- Par défaut trois vues : ordinateur, tablette, mobile. Éditeur : > 1024 px = bureau ; tablette entre ~1024 et ~767 px ; mobile < 767 px (l'article contient une coquille probable). Tablette et mobile en portrait par défaut. Source : https://elementor.com/help/?p=157
- Valeurs exactes par défaut (ex. 1024 / 767) : source officielle lue = ci-dessus ; d'autres guides divergent -> vérifier dans Site Settings.
- Réglage : Site Settings > Settings > Layout > Breakpoints. Ajouter (icône +, six choix), personnaliser (champ Breakpoint px puis Save Changes), supprimer (X ; les deux points de rupture par défaut ne sont pas supprimables). https://elementor.com/help/?p=157
- **Points de rupture supplémentaires** : Mobile Extra, Tablet Extra, Laptop, Widescreen (en plus de Mobile et Tablet) = 6 + Desktop = 7 appareils. Mobile, Mobile Extra, Tablet, Tablet Extra, Laptop = `max-width` ; **Widescreen = `min-width`** ; Desktop devient `max-width` = valeur Widescreen - 1 px quand Widescreen est utilisé. Activé par défaut sur nouveaux sites, optionnel (Experiments) sur les anciens. https://developers.elementor.com/additional-custom-breakpoints-technical-details-and-gotchas/ . Les points de rupture se déclenchent sur la largeur d'écran, pas le type d'appareil (guide tiers).
- Pixels par défaut de Mobile Extra / Tablet Extra / Laptop / Widescreen : NON VÉRIFIÉ (la page dev ne les donne pas).

## 2. Valeurs indépendantes par appareil et stockage
- Icône d'appareil à côté des réglages responsives ; clic puis choix de l'appareil ; recommandé : choisir l'appareil dans la barre du haut avant d'éditer. https://elementor.com/help/?p=157
- Stockage : clé de base = bureau ; suffixes `_tablet`, `_mobile`, `_widescreen`, `_laptop`, `_tablet_extra`, `_mobile_extra`. Seules les clés réellement saisies sont enregistrées. https://developers.elementor.com/docs/data-structure/responsive-data
- Contrôles dev : `default`, `tablet_default`, `mobile_default`, `devices`. http://developers.elementor.com/docs/editor-controls/responsive-control

## 3. Héritage
- V3 : « le responsive est descendant » : un changement sur un grand écran se propage aux plus petits ; un changement mobile n'affecte pas bureau/tablette. Valeurs héritées affichées en grisé. **Exception Widescreen** : cascade vers le haut depuis la valeur Desktop. https://elementor.com/help/?p=157 ; https://elementor.com/help/inherited-responsive-values/ (cette dernière page vise sections/colonnes ; les conteneurs « utilisent un autre système » sans détail -> NON VÉRIFIÉ).
- V4 : valeurs héritées estompées, point gris indiquant l'origine ; Widescreen n'affecte pas les autres réglages. https://elementor.com/help/responsive-editing/
- Cohérent avec le stockage (section 2) : absence de clé = repli sur la valeur du niveau supérieur.

## 4. Contrôles responsives d'un header (conteneur)
Source : https://elementor.com/help/responsive-design-using-containers/ ; https://elementor.com/help/container-layout-tab-settings/
- Direction (Row/Column) par point de rupture : empiler logo, menu et actions en mobile.
- Largeur, hauteur (Min Height), gap, HTML tag, Content Width : réglables par appareil.
- Order personnalisé par point de rupture (évite des sections cachées par appareil). https://elementor.com/help/container-advanced-tab-settings/
- **Ordre inversé** : en mode responsive, sélectionner le conteneur parent, Layout > Items > Direction « Column Reversed » (ou Row Reversed). https://elementor.com/help/ (résultat de recherche, guide Flexbox responsive). Contrôle « Reverse Columns » : existe pour les anciennes sections (Advanced > Responsive).
- Transform, Motion Effects (Apply Effects On), Entrance Animation, Sticky On : par appareil.

## 5. Visibilité par appareil
- V3 : Advanced > Responsive > Hide On Desktop / Hide On Tablet Portrait / Hide On Mobile Portrait. L'élément reste éditable dans le mode où il est visible. https://elementor.com/help/advanced-tab/ ; https://elementor.com/help/show-or-hide-columns-per-device/
- V4 : mode responsive, Style > Layout > Display = None sur l'appareil visé ; reste accessible dans la fenêtre Structure. https://elementor.com/help/responsive-editing/
- Display Conditions : critères dynamiques (rôles, titre, dates), pas la taille d'écran.
- Dépannage : si le header manque sur mobile, vérifier Hide On et Display Conditions. https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/

## 6. Menu de navigation responsive
- Le widget Menu bascule en hamburger sur tablette (réglage du widget). Recette : https://elementor.com/help/creating-a-header-template-with-the-container/ . Le point de rupture du menu (liste des appareils) : NON VÉRIFIÉ.

## 7. Aperçu et éditeur
- Clic sur l'icône d'appareil dans la barre du haut ; hors bureau, poignées gauche/droite/bas pour redimensionner l'aperçu. https://elementor.com/help/?p=157
- « Viewport Control » : page non trouvée -> NON VÉRIFIÉ.

## 8. Recommandations Kolakisa (non issues d'Elementor)
- Modèle de données : valeur de base + surcharges `{breakpoint: valeur}`, résolution du plus petit appareil vers le plus grand en `max-width`, option `min-width` pour grand écran.
- Contrôles à rendre responsives dans un header : direction, wrap, justify, align, gap, largeur, min-height, order, display none, padding/margin, taille de police, position/offsets, hamburger on/off.
- Respecter `prefers-reduced-motion` comme Elementor (effets de mouvement désactivés).
