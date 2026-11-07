# 15 — Architecture Kolakisa du Header Builder

Date : 2026-11-07. Branche : `header-builder-elementor`. Périmètre exclusif : HEADER.
Base factuelle : audit du code réel (lecture) + vérifications ponctuelles (voir § 9). Marques : **[V]** vu dans le code, **[S]** supposé / à confirmer par test.

## 1. Principe directeur

Kolakisa possède déjà l'essentiel d'une chaîne de construction d'en-tête (modèle Theme Builder, éditeur de pages complet, rendu public commun, conditions, versions). **On ne crée aucune seconde architecture.** Le Header Builder est une *extension structurée* de l'existant :

1. un en-tête reste un **modèle Theme Builder de type `header`** porté par un **composant** (`mk_web_components`) ;
2. il est édité dans **le même éditeur** (`public/js/page-builder.js`) avec un panneau et des contrôles propres à l'en-tête ;
3. il est rendu par **le même moteur** (`themeRender.renderParts` → `_sections.ejs` / `_node.ejs` / `widgets/*.ejs`) ;
4. la grammaire reste **fermée** (aucun JS ni HTML libre côté site, `nodes.js`) : toute fonctionnalité (méga-menu, tiroir, recherche plein écran) est exprimée avec des nœuds validés + un runtime public unique.

## 2. Architecture actuelle [V]

```
Theme Builder (liste, conditions, publier)          Éditeur de pages (pages ET composants)
 views/marketing/theme-builder.ejs                   GET /marketing/site-web/composants/:id/editeur
 public/js/theme-builder.js                          public/js/page-builder.js (+ page-builder-*.js)
 src/marketing/web/themeBuilder.js (routes)               │  PUT …/composants/:id/brouillon · publication
        │ src/themeBuilder/store.js                       ▼
        ▼                                          mk_web_components (section JSON, draft, version, revision)
 mk_tb_templates (type='header', status, conditions JSON, revision) ◄── source_kind='component', source_id
 mk_tb_versions (snapshot à chaque publication, 30 max)
        │
        ▼ rendu public (une résolution par requête)
 middlewares/themeLayout.js → src/marketing/web/themeRender.js (renderParts, partMode)
   → src/themeBuilder/{render,resolve,match,conditions}.js
   → views/marketing-public/_sections.ejs + _node.ejs + widgets/*.ejs
   → CSS par nœud `.kw-n-<id>` (pageCss, src/marketing/pages/nodes.js)
   → JS public : public/js/landing.js (is-scrolled, burger, sous-menus, modales), kw-effects.js, kw-motion-studio.js
 Menus : nav_menus / nav_items / nav_locations (src/config/database.js) · service src/services/navigation.js
```

### Données d'un en-tête [V]
- Section `{type:"layout", children:[nœuds]}` ; nœud `{id, type, props, styles:{desktop,wide,tablet,mobile}, states:{hover,focus,active}, parts, hideOn:[…], name, children}`.
- Limites de grammaire : `MAX_NODES = 400`, `MAX_DEPTH = 8` ; 86 propriétés de style ; écrans desktop / wide (≥1920) / tablet (≤1023) / mobile (≤767), héritage descendant.
- Conditions : `{include:[], exclude:[]}` (site, front_page, singular, page, post, child_of, author, not_found, archive, search, product, product_archive, custom). Résolution : le plus précis gagne (site 10, singular 20, ids 100, front_page 90) ; égalité → le plus récemment publié ; doublon exact bloqué à la publication ; `explain` lisible (« Pourquoi ce modèle ? »).
- Versions : snapshot `mk_tb_versions` à chaque publication (30 conservées) ; restauration non destructive.
- Isolation : toutes les requêtes filtrent `organization_id` ET `site_id IS ?` (NULL = site principal).

## 3. Écarts structurels à corriger (cause racine)

| # | Constat [V] | Conséquence | Décision |
|---|---|---|---|
| S1 | Le comportement d'un en-tête (`headerFx`, sticky, overlay) est lu **sur le premier enfant** de la section (`themeRender.partMode`, `_sections.ejs`) | Déplacer/supprimer le premier bloc change le comportement sans avertissement ; code dupliqué | **Bloc de réglages `header` au niveau du document** (§ 4.1), migration douce depuis l'ancien format |
| S2 | `headerFx` n'a **aucune interface** dans l'éditeur (0 occurrence dans `public/js`) | L'utilisateur ne peut pas choisir sticky/rétrécissement | Panneau « En-tête » dans l'éditeur |
| S3 | Un seul écouteur de défilement, seuil fixe 8 px, un seul état `is-scrolled` (`landing.js`) | Pas de seuils, pas de masquage/réapparition, pas d'états multiples | Runtime unique `kw-header.js` (§ 4.2) |
| S4 | Menu : un seul niveau de sous-menu, pas d'icônes/badges/images, pas de panneau libre | Pas de méga-menu | Menu multi-niveaux + panneaux composés (§ 4.4) |
| S5 | Burger = dépliage en place | Pas de tiroir hors-canevas avec contenu libre | Tiroirs (`drawer`) réutilisant `modal`/`.kw-offcanvas` (§ 4.5) |
| S6 | Recherche = formulaire simple ; mini-panier = lien + compteur ; compte = lien | Pas d'interactions riches | Recherche plein écran + suggestions ; tiroir panier ; menu compte (§ 4.6) |
| S7 | Catalogue d'en-têtes : trois zones figées gauche/centre/droite, `hideOn` seul pour le mobile | Pas d'ordre ni de rangées par appareil | Ordre par écran + rangées par appareil (§ 4.3) |
| S8 | Pas de multilingue sur le site public | Sélecteur de langue impossible proprement | **Exclu et justifié** (G-20) |

## 4. Architecture cible

### 4.1 Réglages d'en-tête (document-level)
Nouvelle clé validée sur la section : `section.header = { v:1, behavior, states, logo }`.
```
behavior : { position: "static"|"sticky"|"fixed"|"overlay",
             offset: px, zIndex: 1..100,
             stickOn: ["desktop","tablet","mobile"],
             threshold: px (déclenche l'état « défilé »),
             shrink: { enabled, height },
             hideOnScrollDown: { enabled, tolerance },
             transparentAtTop: { enabled } }
states   : états stylables des nœuds : "top" (défaut), "scrolled", "menuOpen"
logo     : variantes par état (clair / sombre / transparent) — médias du site
```
- **Rétro-compatibilité** : si `section.header` est absent, le lecteur déduit l'ancien `headerFx`/position du premier enfant (comportement actuel inchangé) ; la première sauvegarde dans l'éditeur écrit le nouveau bloc.
- Un **seul** module serveur résout ce bloc (remplace `partMode` dupliqué dans `themeRender.js` et `_sections.ejs`).

### 4.2 Runtime public unique `public/js/kw-header.js`
- Remplace l'écouteur `fxHead` de `landing.js` (qui reste en repli tant que le nouveau bloc est absent).
- Responsabilités : seuil de défilement → classes `is-scrolled` / `is-hidden` ; variable CSS `--kw-header-h` ; espaceur anti-décalage (CLS) pour `sticky`/`fixed` ; ouverture/fermeture des menus, panneaux et tiroirs (focus, Échap, fermeture extérieure) ; `prefers-reduced-motion` ; `requestAnimationFrame` + `passive`.
- Aucune dépendance externe ; ne manipule que des classes et attributs ARIA.

### 4.3 États, responsive par élément
- Les nœuds gagnent l'état de style `scrolled` (et `menuOpen`) à côté de `hover/focus/active` : CSS généré `.kw-theme-header.is-scrolled .kw-n-<id>{…}` (écran par écran).
- Responsive : l'ordre des éléments (`order`) et les rangées visibles par écran sont réglables par écran ; valeurs indépendantes (le mobile ne modifie jamais le bureau — garanti par l'héritage descendant existant, à tester).

### 4.4 Navigation avancée
- Widget `menu`/`cmsmenu` : profondeur jusqu'à 3 ; icône, badge, description, image par élément (colonnes `icon`/`meta` de `nav_items` déjà présentes pour `icon`).
- **Méga-menu** : un élément de menu référence un **panneau** = sous-arbre de nœuds validés (conteneurs, images, texte, boutons…) stocké comme composant de type `megapanel` du site, édité visuellement dans l'éditeur existant, rendu côté serveur dans le `<li>` du menu. Déclencheurs survol (avec délai d'intention), clic, tactile ; navigation clavier (flèches, Échap) ; fermeture extérieure ; repli mobile en accordéon.
- Limites de grammaire à contrôler : un panneau ne compte pas dans les 400 nœuds de l'en-tête (document distinct).

### 4.5 Tiroirs (off-canvas)
- Composant de type `drawer` (même mécanisme que `megapanel`) ouvert par un bouton déclencheur ; réutilise `<dialog>`/`.kw-offcanvas` et le verrouillage de défilement existants ; piège de focus et retour du focus au déclencheur.

### 4.6 Interactions e-commerce et recherche
- Recherche : widget `search` + peau « plein écran » (`<dialog>`) ; suggestions via `GET …/recherche/suggestions?q=` (limitée par site, débit limité, aucun HTML renvoyé : JSON texte).
- Mini-panier : tiroir branché sur le panier réel (`visitorContext.cartCount` + route JSON du panier boutique) ; jamais simulé.
- Compte : menu déroulant (connexion / compte / déconnexion) selon `visitorContext.loggedIn`.

### 4.7 Conditions
- Conserver le moteur actuel (précis > général, exclusion l'emporte, `explain`).
- Ajouter : **visiteur** (invité / membre) si compatible avec le cache de rendu [S : à vérifier, risque G-14], et réglage de date. Langue et appareil : voir § 6.

### 4.8 Éditeur
- Panneau « En-tête » (comportement, états, logos, aperçu des états sur le canevas), calques regroupés par rangées/zones, vignettes enrichies (search/account/cart/social ne sont plus des blocs génériques).

## 5. Isolation multi-sites (règles)
1. Toute nouvelle table/colonne porte `site_id` (NULL = principal) et toute requête utilise `IS ?` (jamais `=` — risque identifié).
2. Les panneaux/tiroirs sont des composants **du site** ; l'import/export (`portable.js`) les emporte avec l'en-tête et retire les références propres au site.
3. Points de vigilance existants à tester : `store.byDocument` sans `site_id` [V], nom de composant unique par organisation [V], composant global accepté dans tout site [V].

## 6. Exclusions justifiées
- **Sélecteur de langue** : le site public n'a aucune version traduite à commuter (`kolakisa-header-refonte-audit-2.md`). Elementor n'a pas non plus de widget natif (extensions WPML/Polylang uniquement) → exclu, documenté dans `HEADER_GAP_ANALYSIS.md` (G-20).
- **Condition par appareil** : l'appareil est géré par la visibilité responsive (`hideOn`), pas par une condition d'affichage serveur (le serveur ne connaît pas la largeur d'écran).
- **JS / HTML libre** : refusé par conception (sécurité, voir `nodes.js`).

## 7. Performance et accessibilité (contraintes de conception)
- Un seul écouteur de défilement passif, mise à jour par `requestAnimationFrame` ; animations limitées à `transform`/`opacity`/couleur (`docs/KOLAKISA_MOTION.md`) ; respect de `prefers-reduced-motion`.
- `<header>` + `<nav aria-label>` ; `aria-expanded`/`aria-controls` ; focus visible ; Échap ; piège de focus dans les tiroirs/recherche plein écran ; contrastes ≥ 4,5:1.

## 7 bis. Découpage en lots
Voir `HEADER_IMPLEMENTATION_PLAN.md`.

## 9. Vérifications faites avant cette synthèse (2026-11-07)
- `headerFx` : présent dans `nodes.js:443-444`, `themeRender.js:55`, `catalog/header.js:131`, `_sections.ejs:18` ; **absent** de `public/js` → pas d'interface dans l'éditeur **[V]**.
- `partMode` lu sur le premier enfant : `themeRender.js:52` **[V]**.
- Seuil `is-scrolled` à 8 px : `public/js/landing.js:195-198` **[V]**.
- Points marqués [S] ci-dessus : à lever par test dans le lot concerné.
