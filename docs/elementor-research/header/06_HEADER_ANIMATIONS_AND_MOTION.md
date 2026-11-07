# 06 - Animations et Motion Effects d'un Header Elementor

Date de consultation : 2026-11-07. Légende et numéros de sources : voir 00_RESEARCH_SCOPE.md.
Aucun code Elementor n'est reproduit. Les valeurs numériques sont celles que la doc donne ; sinon « non donné ».

## 1. Sticky (header qui reste visible)

### 1.1 Elementor v3 [PRO] (Motion Effects : Elementor Pro requis - https://elementor.com/help/motion-effects/)
Chemin : sélectionner le conteneur/section du header > Advanced > Motion Effects. - https://elementor.com/help/sticky-headers/

| Contrôle | Valeurs | Rôle | Source |
|---|---|---|---|
| Sticky | None / Top / Bottom | None désactive | https://elementor.com/help/sticky-transparent-header/ |
| Sticky On | Desktop, Tablet Portrait, Mobile Portrait (multi-choix) | appareils où il flotte | https://elementor.com/help/sticky-headers/ |
| Offset | pixels | distance entre l'élément collé et le bord du viewport | https://elementor.com/help/sticky-headers/ |
| Effects Offset | pixels | défilement nécessaire avant que les styles « collés » s'activent (utile pour transparent -> plein) ; n'agit qu'avec du CSS personnalisé | https://elementor.com/help/sticky-transparent-header/ |
| Stay In Column | Yes / No | No pour un header principal : il ne s'arrête pas à la fin de la section parente. Yes : la section/colonne remonte avec lui quand il sort de l'écran | https://elementor.com/help/sticky-headers/ , https://elementor.com/help/sticky-transparent-header/ |

Les options Offset / Effects Offset / Stay in Column n'apparaissent que si Sticky = Top ou Bottom. - https://elementor.com/help/sticky-transparent-header/

Piège : l'option Sticky manque si le conteneur « legacy » a « Stretch Section » activé (le désactiver dans l'onglet Layout). - https://elementor.com/help/sticky-headers/

### 1.2 Elementor v4 (Atomic Editor)
Le sticky natif CSS est limité à son conteneur parent, donc la doc utilise le positionnement Fixed. - https://elementor.com/help/sticky-headers/
1. Conteneur externe « espaceur » : largeur 100 %, hauteur minimale égale à celle du header (ex. 80 px), position Static.
2. Conteneur interne (logo, menu, boutons) : largeur 100 %, Position = Fixed, Top = 0 (valeur explicite, même 0, pour éviter les sauts de rendu), Z-index = 99.
Gestion de la hauteur réservée : l'espaceur Static garde la place, sinon le contenu passe sous le header (cause documentée). Z-index trop bas : le header passe derrière textes/images. Appliquer Fixed au conteneur externe fait cacher le contenu. - idem
Marque : édition v4 -> pas de mention Pro dans la page lue : NON VÉRIFIÉ.

### 1.3 Sticky transparent / rétrécissement (sections et colonnes seulement)
- Elementor applique la classe `elementor-sticky--effects` à l'élément quand il est collé ET que le défilement dépasse Effects Offset ; l'utilisateur écrit du CSS personnalisé (Custom CSS, Pro) dessus. - https://elementor.com/help/sticky-transparent-header/
- Exemple officiel (valeurs) : fond collé semi-transparent violet rgba(133,130,255,0.5) ; transition de fond 2 s ease ; hauteur minimale du conteneur interne à l'état collé 80 px ; transition de hauteur 1 s ease. - idem
- Limite : ne fonctionne qu'avec sections/colonnes, pas avec les conteneurs (la page renvoie vers une autre méthode). - idem
- Il n'y a donc pas de contrôle natif « shrink », « transparent » ou « scroll-up » dans la doc lue : ils se font par CSS. Une recherche mentionne un guide qui parle d'un effet shrink natif ; non confirmé -> NON VÉRIFIÉ.

### 1.4 Hide on scroll down / show on scroll up (header rétractable)
- Non documenté comme natif dans les sources officielles lues. Des plugins tiers l'ajoutent (« Sticky Header Effects for Elementor », The Plus Addons) [EXTENSION] ; résumé de recherche, pages non lues : https://wordpress.org/plugins/sticky-header-effects-for-elementor/ -> NON VÉRIFIÉ pour les détails.

## 2. Scrolling Effects [PRO] (Advanced > Motion Effects, ou Style > Background > Motion Effects pour une image de fond)

Activer d'abord l'interrupteur Scrolling Effects. Introduits avec Elementor Pro 2.5. - https://elementor.com/blog/introducing-motion-effects/

| Effet | Contrôles et valeurs | Source |
|---|---|---|
| Vertical Scroll (parallaxe) | Direction : Up / Down ; Speed : 0 à 10 ; Viewport : plage en % de la hauteur d'écran où l'effet agit (ex. 50-100 = commence après la moitié) | https://elementor.com/help/scrolling-effects-vertical-scroll/ |
| Horizontal Scroll | déplace à gauche/droite pendant le défilement vertical ; combiné au vertical = mouvement diagonal ; détails de valeurs non lus (page dédiée non lue) | https://elementor.com/blog/introducing-motion-effects/ |
| Transparency | 4 directions : Fade in, Fade out, Fade out in, Fade in out ; niveaux d'opacité : non donnés | idem |
| Blur | mêmes 4 directions ; niveaux de flou : non donnés | idem |
| Rotate | Direction gauche/droite ; Speed (plage max non donnée) ; Viewport ; X Anchor et Y Anchor (pivot : ex. left-top, center-center) | https://elementor.com/help/scrolling-effects-rotate , https://elementor.com/help/motion-effects/ |
| Scale | Scale Up / Scale Down / Scale Down Up / Scale Up Down ; anchors X/Y ; valeurs d'échelle non données | https://elementor.com/blog/introducing-motion-effects/ |

Contrôles communs :
- Apply Effects On : Desktop, Tablet, Mobile (multi). - https://elementor.com/help/scrolling-effects-vertical-scroll/
- Effects Relative To : Default / Viewport / Entire Page. Viewport = calculé sur la hauteur visible de l'écran (sauf éléments en position fixed) ; Entire Page = hauteur totale de la page ; la différence Default/Viewport n'est pas expliquée par la doc. - https://elementor.com/help/scrolling-effects-rotate
- « Effects Offset » n'existe pas comme contrôle des Scrolling Effects dans les pages lues (il appartient au Sticky) ; une recherche l'avait aussi remarqué.
- Valeurs par défaut des curseurs : non données.
- Sur un header fixed/sticky, l'effet « Viewport » se calcule différemment (exception fixed) : à tester côté Kolakisa.

## 3. Mouse Effects [PRO] (bureau)

| Effet | Contrôles | Source |
|---|---|---|
| Mouse Track | Direction : Opposite (contre la souris) / Direct (avec) ; Speed 0 à 10 ; Apply Effects On ; Effects Relative To (Default/Viewport/Entire Page) | https://elementor.com/help/mouse-effects-mouse-track/ |
| 3D Tilt | Direction : Opposite / Direct ; Speed 0 à 10 ; Apply Effects On ; Effects Relative To | https://elementor.com/help/mouse-effects-3d-tilt |

- Les Mouse Effects ne fonctionnent que sur bureau (pas de souris sur mobile/tablette) selon le blog Pro 2.5 ; or la doc 3D Tilt liste quand même Tablet/Mobile dans Apply Effects On : contradiction relevée. - https://elementor.com/blog/introducing-motion-effects/ , https://elementor.com/help/mouse-effects-3d-tilt
- Safari : erreurs jQuery possibles (flèches de carrousel disparues, « maximum call stack size exceeded ») ; contournements : retirer l'animation d'entrée des widgets avec motion effects, ou retirer les mouse effects des zones qui ont des scrolling effects. - https://elementor.com/help/mouse-effects-mouse-track/

## 4. Animation d'entrée [PRO]
Advanced > Motion Effects > Entrance Animation : s'applique aux widgets, conteneurs, sections, colonnes ; joue quand l'utilisateur arrive sur l'élément. - https://elementor.com/help/motion-effects/
Liste des animations, durée, délai : non donnés dans la page lue -> NON VÉRIFIÉ. Pour un header, l'animation d'entrée est possible mais déconseillée (se rejoue peu).

## 5. Transitions
Seule transition documentée : celles que l'utilisateur écrit en CSS (fond 2 s, hauteur 1 s, voir §1.3). Pas de transition native pour sticky -> NON VÉRIFIÉ pour tout autre.

## 6. Accessibilité et robustesse
- prefers-reduced-motion : les Motion Effects sont désactivés quand le système de l'utilisateur demande de réduire les animations (macOS, iOS, Windows 10). - https://elementor.com/help/motion-effects/
- Navigateurs : Chrome, Firefox, Safari, Opera supportés ; Edge supporté mais saccadé ; IE non supporté. - idem
- Mobile : scrolling effects possibles ; choisir les appareils via Apply Effects On.

## 7. Recommandations pour Kolakisa (déductions, pas des faits Elementor)
- Modèle de données d'un header : `sticky: {mode: none|top|bottom, devices, offset, effectsOffset, stayInColumn}` + classe d'état `is-stuck-effects` pour que le thème stylise (transparent -> plein, shrink).
- Réserver la hauteur avec un espaceur ; z-index défini ; ne pas animer de propriétés de mise en page coûteuses (voir docs/KOLAKISA_MOTION.md du projet : transform/opacity de préférence).
- Respecter prefers-reduced-motion comme Elementor.
- Scroll-up/hide : fonction à créer en propre (non native chez Elementor).
