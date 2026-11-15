# Studio de navigation des en-têtes : état, matrice et architecture (12 novembre 2026)

Ce document suit la mission « studio professionnel de conception de navigation ». Il dit ce qui existait, ce qui est livré dans ce lot et ce qui reste. Il n'affirme rien qui ne soit pas testé.

## 1. Limites de l'étude des logiciels de référence
Je n'ai pas relu aujourd'hui les documentations officielles complètes d'Elementor Pro, JetMenu, Max Mega Menu, UberMenu, Bricks et Webflow (les références Elementor déjà documentées dans ce dépôt : `elementor-header-reference.md`, `ELEMENTOR_THEME_BUILDER_REFERENCE.md`). La matrice ci-dessous compare donc **les capacités connues de ces outils (de mémoire, à confirmer)** à ce que Kolakisa fait réellement, vérifié dans le code. Une étude détaillée source par source reste à faire (lot suivant).

## 2. Matrice : existant, livré dans ce lot, manquant
| Capacité | Avant ce lot | Livré dans ce lot | Reste à faire |
|---|---|---|---|
| Style par partie du menu (liste, lien, bouton mobile) avec états survol / focus | Oui (parties) | + traits du bouton, panneau des sous-menus, liens des sous-menus, indicateur, icônes, badges, panneau des méga-menus | Contrôles de timeline |
| **Style individuel d'un lien** (couleur, fond, typo, espacement, bordure, rayon, ombre, opacité…) | Non : réglages communs à tous les liens | **Oui** : `props.itemStyles`, clé par lien (`p0`, `p2-1`, ou `m<id>` du menu du CMS) | Contrôle visuel du choix du lien directement dans l'aperçu |
| États par lien : normal, survol, focus, clic, page courante | Partiel (survol/focus communs) | **Oui**, indépendants par lien | « Désactivé », « visité » |
| Réglages par écran pour un lien (ordinateur, tablette, mobile, grand écran) | Non | **Oui** (grammaire de style existante) | Écrans personnalisés au-delà des 4 clés |
| Sous-menu / méga-menu / icône / badge **d'un lien précis** | Non | **Oui** (parties `sub`, `icon`, `badge` d'un lien) | Constructeur visuel de colonnes de méga-menu par lien (le panneau est un composant du site, existant) |
| Panneau du menu mobile (fond, largeur, fond assombri, fermeture, liens) | Mode et côté seulement | **Oui** : `props.panelStyles` (panneau, fond assombri, fermeture, liste, liens) | Animations d'entrée/sortie personnalisées, panneau flottant centré |
| Copier / coller le style d'un lien, réinitialiser un lien | Non | **Oui** (inspecteur) | Copier seulement typo / couleurs / animations |
| Méga-menu (un composant par rubrique du CMS, hover/clic, largeur) | Oui | Inchangé | Contenu dynamique (produits, catégories) |
| Hamburger : modèle d'icône, texte, forme, tiroir/plein écran/panneau du bas | Oui | + dimensions et épaisseur des traits, état survol, fond du bouton | Morphing personnalisé, SVG personnalisé |
| Sticky / transparent / réduit / masqué en descendant et réaffiché en remontant, seuil, logo alternatif | Oui (`headerFx`, `data-kw-hide`, `data-kw-threshold`) | Inchangé (déjà complet ; vérifié dans le code) | Animations d'apparition dédiées |
| Accessibilité : clavier, Échap, focus piégé dans le tiroir, ARIA | Oui | Conservé et testé | Audit lecteur d'écran réel |
| Motion : ouverture des sous-menus et méga-menus (10 animations, durée, courbe, délais d'ouverture et de fermeture), cascade des éléments, animation des liens au survol | Seulement fondu / glissement fixes | **Oui** : `props.menuMotion` (opt-in, grand écran, `prefers-reduced-motion` respecté), délai de fermeture contre les fermetures accidentelles | Timeline libre multi-propriétés, séquences sur plusieurs widgets |
| Breakpoints personnalisés nommés | Quatre écrans fixes + seuil de repli du menu | Inchangé | Écrans personnalisés |

## 3. Architecture (modèle de propriétés)
Ordre de priorité, du plus général au plus précis : styles du site (charte) → modèle d'en-tête → réglages du widget menu → **partie** du menu (ex. « Liens ») → **réglage individuel du lien** (`itemStyles`) → état (survol, focus, clic, page courante) → écran. Une valeur plus précise remplace la plus générale ; supprimer une valeur la rend à la couche inférieure (aucune valeur « fantôme »).

Stockage (dans le JSON du widget menu, donc avec l'en-tête, par site, versionné par les versions existantes) :
```
props.itemStyles = { "<clé du lien>": { link|sub|icon|badge: { styles:{écran:{…}}, states:{état[@écran]:{…}}, current:{écran:{…}} } } }
props.panelStyles = { panel|backdrop|close|list|links: { styles, states } }
```
* Clé du lien : `p<position>` (`p1`, `p2-0` pour un sous-lien) ou `m<identifiant du menu du CMS>` (stable si l'ordre du menu change). Les deux sont acceptées ; le rendu pose `data-ik` et `data-mid` sur chaque `<li>`.
* Validation : la même grammaire fermée que tous les éléments (aucun CSS libre, aucune ressource externe, valeurs bornées). Une clé invalide ou une partie inconnue est refusée.
* Rendu : une règle CSS par lien et par état, écrite une seule fois dans la feuille de la page ; aucun JavaScript supplémentaire (sauf une classe de rattachement `kw-pn-<id>` posée sur le panneau mobile, qui sort du menu à l'ouverture). Aucun style n'est écrit sur les liens non personnalisés.
* Isolation multisite : les réglages sont dans l'en-tête du site ; un autre site ne les voit jamais.

## 4. Guide d'utilisation (éditeur)
Sélectionnez le menu dans l'en-tête, ouvrez « Style d'un lien (individuel) » : choisissez le lien (● = déjà personnalisé), la partie (lien, sous-menu, icône, badge), l'état et l'écran, puis saisissez les valeurs (couleur `#rrggbb`, tailles `16px`…). Un champ vide retire la valeur. « Panneau du menu mobile » dans la liste des liens règle le tiroir. Réinitialiser, copier et coller le style d'un lien sont disponibles.

## 5. Tests
* `tests/menu-liens-individuels.test.js` (7) : validation, enregistrement, règles par lien/état/écran/page courante/sous-menu/badge, clé du CMS, refus des valeurs dangereuses, aucun style sur les liens non réglés, panneau mobile.
* `tests/header-widgets-navigateur.test.js` (+2, vrai Chrome) : seul « Boutique » est personnalisé (couleur, graisse, fond, arrondi, survol) et « Accueil » et « Contact » restent intacts ; tiroir mobile stylé (fond, largeur 300 px, fond assombri, fermeture, liens) et fermé par Échap.
* `tests/menu-liens-individuels.test.js` (+2) et `header-widgets-navigateur` (+1, Chrome) : le sous-menu glisse, reste ouvert pendant le délai de fermeture de 600 ms puis se ferme, cascade (délais différents par élément), lien qui se soulève au survol.
* `tests/header-menu-inspecteur-navigateur.test.js` (Chrome) : l'inspecteur du menu affiche les groupes « Mouvement du menu » et « Style d'un lien (individuel) », on règle un lien (couleur, fond au survol) et le mouvement, les valeurs sont enregistrées dans le document, les autres liens ne sont pas touchés, aucune erreur de script. Ce test a révélé un vrai bug (boucle infinie dans le panneau qui vidait l'inspecteur du menu), corrigé.

## 6. Prochains lots (non faits)
Timeline libre d'animation (plusieurs propriétés) ; constructeur de méga-menu par lien avec contenu dynamique ; écrans personnalisés ; copier uniquement typo/couleurs ; audit lecteur d'écran ; étude détaillée source par source des six logiciels.

## Lot 3 (14 novembre 2026) : hamburger et copier-coller partiel
* Icône du hamburger : animation à l'ouverture (croix par défaut, demi-tour, aucune), largeur 12-40 px, épaisseur des traits 1-6 px, durée 0-1000 ms. Stockage : `props.burgerAnim`, `burgerSize`, `burgerThickness`, `burgerSpeed` (valeurs hors limites ignorées). Rendu : attributs `data-kw-burger-*` lus par `public/js/landing.js`, règles dans `public/css/landing.css` ; `prefers-reduced-motion` coupe la transition.
* Style d'un lien : boutons « Coller seulement la typographie » et « Coller seulement les couleurs » (toutes tailles d'écran et tous états conservés).
* Tests : `tests/menu-hamburger-icone.test.js` (3), Chrome `header-widgets-navigateur` (+1), Chrome `header-menu-inspecteur-navigateur` (copier-coller partiel).
* Reste à faire : éditeur d'animation libre (ligne de temps), points d'arrêt personnalisés, visibilité/ordre par écran, méga-menu à contenu dynamique par lien, audits lecteur d'écran et performance, relecture des six outils de référence à la source.

## Lot 4 (14 novembre 2026) : méga-menu à contenu dynamique
* Le méga-menu par rubrique existait déjà (panneau = composant du site, ouverture au survol/clic, largeur). Ajout : choix du « Modèle d'un nouveau panneau » avant « Créer un panneau » : colonnes de texte (défaut), **articles récents** (`querylist`), **produits** (`shopgrid`), **catégories de la boutique** (`shopcategories`). Le contenu vient du site et se met à jour sans republier le menu.
* Style du panneau : partie `mega` + réglages `sub` d'un lien (lot 1).
* Test Chrome : `tests/header-reglages-navigateur.test.js` (création des trois modèles, widget présent dans le composant, détachement).
* Toujours à faire : éditeur d'animation libre, largeurs d'écran personnalisées, audits lecteur d'écran/performance, étude des six outils de référence à la source.

## Lot 5 — Visibilité par écran des liens du menu (15/11/2026)
- Chaque lien du menu peut être **masqué** sur ordinateur (≥ 1024 px), tablette (768–1023 px) et/ou mobile (< 768 px) : inspecteur du menu → « Style d'un lien (individuel) » → cases « Masquer sur… ».
- Stockage : `props.itemStyles[<lien>].hide = ["tablet","mobile"]` (liste fermée, doublons et valeurs inconnues ignorés côté serveur, `nodes.js › normalizeItemStyles`).
- Rendu : une règle `@media` à plage exacte par écran masqué (pas d'héritage entre écrans), appliquée à la barre du menu **et** au panneau mobile (`.kw-menu-panel.kw-pn-<id>`). Le lien n'est jamais supprimé du menu ni du CMS.
- Tests : `menu-hamburger-icone.test.js` (validation), `header-widgets-navigateur.test.js` (Chrome : 1280 / 900 / 390 px + panneau mobile), `header-menu-inspecteur-navigateur.test.js` (cases à cocher dans l'éditeur, enregistrement, autres liens intacts).
- Non fait : ordre des liens par écran, écrans personnalisés (points de rupture libres), grand écran ≥ 1920 px distinct.
