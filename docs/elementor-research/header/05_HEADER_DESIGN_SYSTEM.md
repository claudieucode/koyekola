# 05 - Design system applicable au header (Elementor)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION]. « NON VÉRIFIÉ » = non confirmé par une page lue.

## 1. Site Settings (Kit)
Source : https://elementor.com/help/site-settings/ ; https://elementor.com/help/how-elementors-theme-style-and-design-system-options-work-together/
Accès : menu logo Elementor dans l'éditeur, ou WP Admin > Elementor > Editor.
- **Design System** : couleurs globales (Primary, Secondary, Text, Accent + couleurs personnalisées) ; typographie globale (Primary, Secondary, Text, Accent + nouveaux styles).
- **Theme Style** : Typography, Buttons, Images, Form fields, Header and Footer.
- **Settings** : Site Identity (nom, description, logo, favicon) ; Background (avec fond mobile séparé) ; **Layout** (polices génériques par défaut, largeur de contenu du site, espacement par défaut des widgets/gap, modèle de page par défaut) ; Lightbox ; Custom CSS ; Additional Settings. Points de rupture : sous Layout selon https://elementor.com/help/?p=157 (« Site Settings > Settings > Layout > Breakpoints ») ; Custom Code et sélecteur de titre de page : non listés par la page -> NON VÉRIFIÉ.
- Hiérarchie : les couleurs/polices globales sont des couches de variables CSS au-dessus du Theme Style ; changer une valeur globale met à jour tous les éléments qui l'utilisent.

## 2. Couleurs globales
Source : https://elementor.com/help/view-and-edit-global-colors/
- Couleurs système (Primary, Secondary, Text, Accent) : modifiables, non supprimables ; un site doit toujours garder les quatre (https://elementor.com/help/customize-your-hello-biz-site-settings/).
- Couleurs personnalisées (groupe Custom Colors) : ajout (Add Color + nom), renommer, réordonner, supprimer, modifier via sélecteur puis Save Changes. Nombre maximal : non indiqué.
- Application aux widgets : non expliquée par la page lue (mécanisme « Global Style » côté dév : https://developers.elementor.com/docs/editor-controls/global-style - non fetché, NON VÉRIFIÉ).

## 3. Polices globales
Source : https://elementor.com/help/customize-your-hello-biz-site-settings/ (via recherche)
- Quatre styles système : Primary, Secondary, Body Text, Accent Text ; restylables, non supprimables ; création de nouveaux styles possible.
- Un style typographique complet = groupe Typography (famille, taille, graisse, transformation, style, décoration, hauteur de ligne, espacement lettres/mots) : voir 04.

## 4. Classes et variables (V4)
- Classes locales / globales, Class Manager, états : voir 04 section 5. https://elementor.com/help/what-are-the-differences-between-the-elementor-editor-3-x-and-v4/
- « Variables » V4 (couleurs, tailles) annoncées en alpha 3.31 : https://elementor.com/blog/elementor-331-v4-alpha-variables-filters/ ; statut actuel NON VÉRIFIÉ. Tailles variables : https://elementor.com/blog/elementor-332-v4-transform-transitions/ [EXPÉRIMENTAL à la sortie de 3.32, statut actuel NON VÉRIFIÉ].

## 5. Valeurs par défaut utiles au header
- Gap par défaut d'éléments : 20 px (Site Settings > Layout).
- Largeur de contenu Boxed : valeur issue de la largeur de contenu du site (valeur numérique par défaut NON VÉRIFIÉ).
- Transition V4 par défaut : 200 ms sur toutes propriétés.

## 6. Contenu dynamique (Dynamic Tags)
Mentionné comme argument de contrôle (« Dynamic Content ») dans https://developers.elementor.com/docs/editor-controls/ ; liste des balises et licence : NON VÉRIFIÉ (non lue). En V4, les attributs supportent les étiquettes dynamiques (https://elementor.com/help/custom-attributes-pro/).

## 7. Conditions d'affichage du template header
Source : https://elementor.com/help/conditions/ ; https://elementor.com/help/header-site-part/
- Include / Exclude + groupe de pages (ex. Entire Site), plusieurs conditions par template. Côté dév : https://developers.elementor.com/docs/theme-conditions/ (non fetché).
- Display Conditions d'élément (utilisateurs, titres, dates ; AND/OR) : https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/

## 8. Recommandations Kolakisa (non issues d'Elementor)
- Jetons globaux : 4 couleurs système + palette libre, 4 styles de texte système + libres, gap par défaut, largeur de contenu, liste de breakpoints ; le header référence ces jetons plutôt que des valeurs brutes.
- Prévoir un équivalent « classes globales » et « états hover/focus/active » pour les éléments de header.
