# Pied de page : construction, style, responsive, animations (audit du 7 novembre 2026)

Le pied se construit dans **le Page Builder** (même éditeur, mêmes contrôles que pour une page). Les capacités ci-dessous sont donc celles de l'éditeur ; ce qui est propre au pied est signalé.
Statuts : **OK** (preuve de code, et test quand il existe) · **partiel** · **absent** · « non vérifié » (lu au registre/au code mais pas exécuté dans un navigateur pendant cet audit : aucune session Chrome n'a été lancée).
Références : `nodes.js` = `src/marketing/pages/nodes.js` ; `pb` = `public/js/page-builder.js` ; matrice = `KOLAKISA_WIDGET_CONTROL_MATRIX.md` (racine).

## 1. Construction

| Point | Statut | Preuve / remarque |
|---|---|---|
| Conteneurs imbriqués | **OK** | 6 conteneurs (`container, columns, column, grid, stack, group`) ; profondeur max 8, 400 éléments par page (`nodes.js:18-19`). Les modèles du catalogue empilent 4 niveaux : `layout > container(bande) > container(zone) > group/stack` (`footer.js` `band`/`wrap`) |
| Flexbox | **OK** | `display/flexDirection/flexWrap/justifyContent/alignItems/alignContent/alignSelf/order/gap/rowGap/columnGap/flexGrow/flexShrink/flexBasis` dans `STYLE_PROPS` (`nodes.js` ~l.200-260) ; catalogue : colonnes `flexBasis:0 + flexGrow + minWidth` (`footer.js:119-123`), test `pieds-bibliotheque` « responsive : colonnes Flexbox… » (l.82) |
| Grille | **OK** | `grid` + `columns, gridTemplate, gridRows, gridAuto*, gridColumnSpan…`, structure guidée « Flexbox ou Grille » (`pb:1316-1366`) |
| Boxed / pleine largeur | **OK** | `props.full` (bande pleine largeur) et `props.band` ; largeur de contenu du site `layout.containerWidth` ; `maxWidth` ; sortie de colonne `lp-part-bleed` / `kw-theme-bleed` (`pages/index.js:936` `partBleeds`, `landing.css`, `themeRender.js:45`). Test Chrome `pied-de-page-coherence` (largeur 1280/820/390 identique public/aperçu/vignette/éditeur), non relancé ici |
| Largeur, hauteur, min/max, marges, remplissages | **OK** | `width/height/min*/max*/margin*/padding*` ; valeurs « globales » du site référencables (`token:space-md`, `pb:3395`) |
| Gap, retour à la ligne | **OK** | idem ; le catalogue met `flexWrap:wrap` sur les rangées |
| Ordre | **OK** | `order` ; glisser-déposer dans le canevas et dans Structure (`pb:1159,1479,5586`) |
| Positionnement / superposition | **OK** (technique), **à éviter dans le catalogue** | `position: static/relative/sticky/absolute/fixed`, `top/right/bottom/left`, `zIndex` (`nodes.js:231`). Le catalogue n'utilise aucune position absolue (test `pieds-bibliotheque` l.82) |
| Duplication, suppression, glisser-déposer, copier-coller, calques | **OK** | `duplicateSelected` (`pb:641`, Ctrl/⌘+D `pb:5969`), panneau Structure (`pb:1309`), 16 usages de `draggable/dragstart` ; verrouillage/masquage d'un élément (`n.locked`, `n.hidden`, `_node.ejs:9`) |
| Annuler / rétablir | **OK** (session) | `undo/redo` `pb:257-258`, historique copié dans `localStorage` « pb-history-<page> » `pb:295-318` : survit à un rechargement du même navigateur, **pas** d'historique serveur des actions |
| Balise HTML du pied (`footer`) | **partiel** | possible sur un conteneur (`BOX_TAGS` `nodes.js:389`) mais **aucun des 100 modèles ne la pose** (script de cet audit : 0/100) et aucun réglage « Pied de page » ne la force ; le rendu public est un `<div>` (`_sections.ejs:19`, `themeRender.js:49`) ; équivalent Elementor : « Footer Settings > HTML Tag = footer » |

## 2. Style

| Point | Statut | Preuve |
|---|---|---|
| Couleur de fond | **OK** | `backgroundColor` ; 12 couleurs de site (`COLOR_TOKENS` : primary, secondary, accent, background, surface, text, muted, success, warning, error, on-primary, on-accent) ou couleur libre |
| Dégradé | **OK** | propriété composée `gradient` (`COMPOSED`) |
| Image de fond (+ voile) | **OK** | `backgroundImage` + `overlay`, `backgroundSize/Position/Repeat/Attachment` ; images de la médiathèque ou https (`sections.js:29`) |
| Diaporama de fond | **OK** | `bgSlides` 2–8 images, Ken Burns (`nodes.js:1838`) ; non utile à un pied |
| **Vidéo de fond** | **OK** (conteneurs) | `bgVideo` `{src mp4/webm, start, end, poster, once}` (`nodes.js:1842`) ; CSS `.kw-bg-video` (`landing.css:891`) ; **mise en pause si « réduire les animations »** (`landing.js:398`) ; jamais utilisé par le catalogue (0/100) ; performances non mesurées |
| Bordures (par côté), rayons (par coin), contour | **OK** | `border*`, `borderRadius` + 4 coins, `outline*` |
| Ombres (extérieure/intérieure) | **OK** | `boxShadow`, composé `shadow` ; remarque : le catalogue met `boxShadow:none` sur les bandes pour éviter l'ombre sous le pied |
| Séparateurs de forme (haut/bas) | **OK** | `shapes` `nodes.js:1825` (liste fixe de formes, hauteur 20–300) |
| Calques / mélange | **OK** | `mixBlendMode`, `opacity`, `zIndex`, `backdropBlur` |
| Typographie | **OK** | police (bibliothèque locale `font.<nom>` ou piles), taille, graisse, interlignage, espacement, casse, ombre de texte, contour de texte |
| Variables du Design System | **OK** | jetons `token:<couleur>` ; jetons d'espacement/rayon/taille `token:space-md` ; styles globaux (`pages/globalStyles.js`) et classes globales réutilisables (`normalizeClassDefs`, `GLOBAL_CLASS_MAX`) ; **attention** : les 100 pieds du catalogue ont une identité PROPRE à couleurs et polices FIXES (`ownSkins: true`, 33 identités, `footer.js` dernière ligne, `identities.js`) et non les jetons du site : un pied installé **ne suit pas** un changement de charte du site (les jetons du site restent possibles dans l'éditeur, mais ce n'est pas le défaut) |
| Sous-parties d'un widget (liens d'un menu, champs/bouton de recherche, texte du logo) | **partiel** | mécanisme `parts` seulement pour menu, compte, recherche, logo (`footer.js` `ownFont`) ; ailleurs le style vise la racine du widget (matrice §2, 42 widgets « limités ») |

## 3. États, transitions, transformations, filtres

| Point | Statut | Preuve |
|---|---|---|
| Survol / Focus clavier / Actif (clic) | **OK**, avec limite | `STATES` (`nodes.js:31`) : hover/focus/active ; **un seul jeu, non décliné par écran** ; seul `cssHover` (CSS libre) pour des cas libres. Le catalogue ne règle **aucun** état (0/100 pieds avec `states`) : les liens du pied n'ont donc pas de style de survol propre (hors défaut du site) |
| Transitions | **partiel** | `transitionDuration`, `transitionEasing` (`STYLE_PROPS`) |
| Transformations (échelle, rotation, translation, inclinaison) | **OK** | composé `transform`, `transformOrigin` |
| Filtres, flou d'arrière-plan | **OK** | composé `filter`, `backdropBlur` |
| Masques / découpes | **OK** (image, galerie, vidéo…) | `MASK_SHAPES`, `CAP_MASK` |

## 4. Animations

| Point | Statut | Preuve |
|---|---|---|
| Animation d'entrée (à l'apparition) | **OK** | registre central `motion.js` (`ANIMATIONS` avec durée, courbe, direction, rejouer) ; `entrance/duration/delay/easing/repeat` (`nodes.js` ~1740) ; jamais utilisée par le catalogue (0/100) |
| Animation au survol (agrandir, soulever…) | **OK** | `motion.hover` → classe `kw-hover-*` (`_node.ejs:9`) |
| Effets de défilement / souris (parallaxe, etc.) | **OK** | `SCROLL_FX`, `MOUSE_MODES`, coupables par écran (`off`) ; `public/js/kw-effects.js` |
| Sticky / collant | **OK** (conteneurs) | `CAP_BOX` → capacité « sticky » (`nodes.js:1580`) ; **pour un pied** : le moteur de pied n'a pas de logique propre (le comportement « collant » existe surtout pour l'en-tête : `.kw-theme-sticky` seulement pour `header`, `_sections.ejs:18`) ; un conteneur du pied peut être `position: sticky` mais l'enveloppe du pied ne suit pas ; non vérifié |
| Motion Studio (45 composants animés) | **OK** (registre) | `motion*` ; chargé à la demande (`kw-motion-studio.js`) ; non vérifié dans un pied |
| **prefers-reduced-motion** | **partiel** (bonne couverture, pas totale) | animations d'entrée : comportement réduit déclaré par animation (`reducedMotionBehavior` : fondu ou rien, `motion.js:8,110`) ; effets défilement/souris `kw-effects.js:94` ; vidéo de fond mise en pause `landing.js:398` ; survol `kw-hover-*` désactivé `landing.css:665` ; carrousel `landing.css:642`. **Non couvert** : transitions et transformations posées à la main par l'utilisateur (`transitionDuration`, `transform` au survol) ne sont pas neutralisées par une règle générale (aucune règle `prefers-reduced-motion` dans `nodes.js`/`pageCss`) |

## 5. Responsive

| Point | Statut | Preuve |
|---|---|---|
| Desktop / tablette / mobile (+ grand écran) | **OK** | `BREAKPOINTS` : `desktop` (base), `wide` (≥ 1920), `tablet` (≤ 1023), `mobile` (≤ 767) `nodes.js:24` |
| Points de rupture personnalisables | **OK, par site** | `layout.breakpoints` (tablette 820–1279, mobile 400–767, grand écran) `siteSettings.js:126-134` ; `pageCss` les utilise (`nodes.js:2022`). Pas de réglage **par pied**, pas de points de rupture supplémentaires (Elementor en propose 6 en option) |
| Héritage (un champ vide reprend l'écran plus grand) | **OK** | `DEVICE_PARENT` `pb:22` ; valeur héritée grisée (matrice §3.8) |
| Ordre par appareil | **OK** | `order` est une propriété de style, donc déclinable par écran |
| Visibilité par appareil | **OK** | `hideOn: [desktop/tablet/mobile/wide]`, refusé si masqué partout `nodes.js:1806-1809` ; catalogue : 3 occurrences sur 100 pieds (date masquée sur mobile) |
| Colonnes qui passent à la ligne sans règle de rupture | **OK** | colonnes `minWidth` + `flexWrap` ; les rangées « gauche/droite » passent en pile sous 640 px (`footer.js:140` `inner.styles.mobile`) — note : 640 px est écrit en dur, indépendant du point de rupture du site |
| Aperçu par appareil dans l'éditeur | **OK** (non vérifié ici) | sélecteur d'appareil de l'éditeur, canevas = vrai rendu public dans une iframe (matrice §1) |
| Absence de défilement horizontal | **non vérifié** | pas de test automatique spécifique pied ; la suite `pied-de-page-coherence` mesure des largeurs à 3 tailles (non relancée) |
| Logo mobile alternatif | **partiel** | présent dans la ligne légale (`_foot-legal.ejs`, `logoMobileUrl`), pas dans le widget `sitelogo` |

## 6. Ce qui est propre au pied (non au Page Builder) et ce qui manque

OK : bandes pleine largeur sorties de la colonne ; rendu cohérent vignette/aperçu/éditeur/public (correction du 3 nov.) ; ligne légale + zones `footer-1/2` injectées (chemin A seulement).
Manque (propre au pied) :
1. Réglage **« Réglages du pied »** (balise HTML `footer`, arrière-plan global, largeur) : n'existe pas ; tout est réglé élément par élément.
2. **Barre inférieure / sous-sections** : pas d'objet « barre » ; le catalogue le simule par une 2e rangée `L(copy, legal)` (`footer.js` `BAR`).
3. Pied **collant / révélé au défilement** (« footer reveal ») : absent.
4. Pas de **mode d'aperçu « pied en bas de page réelle »** distinct (l'aperçu montre une page d'exemple + le pied).
5. Aucun **test automatisé d'absence de défilement horizontal** ni d'accessibilité (contraste) par modèle pour le pied (les suites existantes testent structure et largeur).
