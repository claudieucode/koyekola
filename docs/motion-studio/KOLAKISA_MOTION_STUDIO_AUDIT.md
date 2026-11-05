# KOLAKISA Motion Studio : audit de l'architecture existante

Date : 2026-11-05. Périmètre : dépôt `koyekola/`, lecture seule. Méthode : lecture du code ; chaque constat cite un fichier et des lignes. Tout ce qui n'a pas été lu ou exécuté est marqué **non vérifié**. Aucun test n'a été lancé (les tests navigateur exigent Playwright et Chrome, voir section 14).

Chemins relatifs à `koyekola/`. Abréviations : `nodes.js` = `src/marketing/pages/nodes.js`, `PB` = `public/js/page-builder.js`, `PBE` = `public/js/page-builder-effects.js`.

---

## 0. Constat principal

Un moteur de mouvement existe déjà et est complet pour l'entrée, le survol, le défilement et la souris. Il est documenté dans `docs/MOTION-ENGINE.md`. Le Motion Studio ne part donc pas de zéro. Ce qui manque réellement :

- une timeline multi-éléments (séquencement, scènes, lecture/pause/scrub) ;
- des composants animés qui chargent des moteurs externes (GSAP, Rive, 3D, WebGL) ;
- un runtime exécuté dans le canevas de l'éditeur, qui est aujourd'hui volontairement inerte pour le mouvement ;
- un stockage des fichiers d'animation (`.json` Lottie, `.riv`, `.glb`), car la médiathèque les refuse.

---

## 1. Stack et dépendances

**État actuel** (`package.json`)
- Node `>=22.12.0` (engines, ligne 24). Version locale : v24.20.0.
- Base de données : module natif `node:sqlite` (`DatabaseSync`, `src/config/database.js:1`). Aucun paquet SQLite dans `package.json`.
- Dépendances d'exécution : `express`, `ejs`, `express-session`, `multer`, `sanitize-html`, `htmlparser2`, `domutils`, `compression`, `nodemailer`, `pdfkit`, `bcryptjs`, `dotenv`, `@anthropic-ai/sdk`. Optionnel : `sharp`.
- devDependencies : CodeMirror 6, Tiptap 3, `drawflow`, `esbuild`. `esbuild` sert à compiler les éditeurs de texte riche (`scripts/build-editor.js:1-30`, entrées dans `src/editor/`, sorties dans `public/js/`) et à minifier à la volée (`src/perfEngine/minify.js`).
- **Absents** : gsap, three, rive, lottie (en npm), anime, framer-motion, playwright. Recherche faite dans `package.json` et `node_modules` (aucune correspondance pour gsap/three/rive/playwright).
- **Seule bibliothèque d'animation embarquée** : `public/js/vendor/lottie_light.min.js` (168 394 octets, licence MIT dans `public/js/vendor/LICENSE-lottie-web.md`). Variante « light » : rendu SVG seulement, sans expressions. Version de la bibliothèque : **non vérifiée** (non lue dans le fichier minifié).
- Pas de bundler pour le Page Builder : `PB` (8 683 lignes), `PBE` (521 lignes) et les autres `page-builder-*.js` sont des fichiers IIFE écrits à la main, chargés tels quels. `esbuild` n'est utilisé que pour les 4 bundles de `scripts/build-editor.js`. Les fichiers construits sont livrés dans le dépôt (« l'hébergeur n'a rien à compiler », `scripts/build-editor.js:6`).
- Pas d'étape de build au déploiement (Hostinger) : `src/perfEngine/minify.js:1-3`.

**Limites / risques**
- Ajouter GSAP ou Rive impose de vendorer le fichier minifié dans `public/js/vendor/` (même modèle que lottie) : aucune chaîne npm vers le navigateur n'existe pour le Page Builder.
- Le CLAUDE.md du dépôt (12 lignes) impose les règles de design (`docs/KOLAKISA_DESIGN_CHARTE.md`), de mouvement (`docs/KOLAKISA_MOTION.md`) et de responsive (`docs/KOLAKISA_RESPONSIVE.md`), et des audits avant livraison visuelle (`scripts/audit-interface.js`, `audit-qualite.js`, `audit-editeurs.js`).

**Recommandation** : vendorer chaque moteur dans `public/js/vendor/` avec son fichier de licence, chargé à la demande comme Lottie (voir section 9).

---

## 2. Éditeur de pages : canevas

**État actuel**
- Route de l'éditeur : `GET /marketing/pages/:id/editeur` (`src/marketing/web/landing.js:459`), qui appelle `openEditor` et rend `views/marketing/page-builder.ejs`. Les données de démarrage sont dans un JSON `pb-boot` (`landing.js:~406-440`) : contenu, registre des types, spec, composants, blocs, permissions.
- Le canevas est un **iframe `srcdoc`** (`PB:5420,5438`) dont le contenu est le **rendu serveur réel** de la page : `POST /marketing/pages/:id/rendu` (`landing.js:553`), appelé par `renderCanvas()` (`PB:5441-5450`). Même gabarit que la page publiée : `views/marketing-public/landing.ejs` avec `builder=true` (`<body data-kw-builder>`, `landing.ejs:26`).
- `patchCanvas()` (`PB:5355`) met à jour le DOM de l'iframe par différence section par section ; si l'en-tête, le corps ou le nombre de feuilles de style change, elle renvoie false et `reloadCanvas()` (`PB:5419`) remplace tout l'iframe.
- L'iframe `srcdoc` est de même origine que l'éditeur (document `about:srcdoc`). La CSP meta de l'éditeur ne restreint pas les scripts (section 9).

**Comportement réel du mouvement dans le canevas**
- Les animations d'entrée n'y sont **pas exécutées** : `landing.js:117-118` (`inBuilder`) et `landing.js:121` conditionnent tout le bloc à `!inBuilder`.
- `kw-effects.js` (défilement/souris) ne démarre **jamais** dans le canevas : `public/js/kw-effects.js:241`.
- Le widget Lottie rend un **placeholder** dans l'éditeur, pas l'animation : `views/marketing-public/widgets/lottie.ejs` (branche `isBuilder`).
- Les modales, diaporamas de fond, compteurs et interactions `data-kw-ix` sont aussi coupés dans le canevas (`landing.js:95,181,197,222,310,338`).
- Seul aperçu possible : `playPreview()` (`PBE:255-270`), qui pose temporairement `el.style.animation` sur l'élément du canevas après avoir injecté une `<style id="pb-motion-all">` contenant `SPEC.motionCss` (toutes les images-clés). Rien n'est enregistré.

**Limites / risques**
- Il n'existe aucun runtime de mouvement partagé entre canevas et page publiée : le canevas ne rejoue rien d'autre que l'aperçu ponctuel. Une timeline avec scrub dans le canevas est donc à construire.
- Chaque modification de contenu déclenche un aller-retour réseau (`POST /rendu`) puis un patch DOM. Un scrub à 60 images par seconde ne peut pas passer par ce chemin : il doit écrire directement dans le DOM du canevas, hors cycle de rendu (comme le fait `playPreview`).
- Un `reloadCanvas()` détruit l'iframe : tout état de lecture d'un runtime injecté dans le canevas est perdu à ce moment-là (il faut réinitialiser le runtime au `load`).

**Recommandation** : un module runtime unique, importable par la page publiée et par l'éditeur, avec une API `init(root, config)` / `destroy()` / `seek(t)`. Le canevas l'appelle depuis `setupCanvas()` (`PB:5493`) et après chaque `patchCanvas`.

---

## 3. Modèle de données JSON

**État actuel**
- Un contenu de page = `{ sections, theme, title, description, seo }` (`src/marketing/pages/index.js:131-139`, `normalizeContent`). Colonnes : `mk_landing_pages.sections/theme/draft/revision` ; la copie de travail est `draft` (JSON), la version en ligne `sections` (`index.js:79-87`, `149-167`).
- Un nœud (élément) est reconstruit champ par champ par `normalizeNode` (`nodes.js:1761-1860`). Champs conservés : `id` (regex `^[a-z0-9]{6,20}$`, `nodes.js:20`), `type`, `props`, `v` (version du widget seulement), `name`, `note`, `hidden`, `locked`, `anchor`, `audience`, `hideOn`, `motion`, `css`, `cssHover`, `classes`, `attrs`, `interactions`, `startHidden`, `schedule`, `shapes`, `bgSlides`, `bgVideo`, `styles`, `states`, `parts`, `children`.
- Limites dures : `MAX_NODES = 400` éléments par page, `MAX_DEPTH = 8` (`nodes.js:18-19`) ; corps JSON de l'éditeur limité à 1 Mo (`server.js:84`).
- Contenus partagés : composants globaux ou propres à un site (`mk_web_components`, `index.js:741-833`) ; ils passent par la même normalisation (`componentSection`, `index.js:753`).

**Limites / risques**
- **Toute clé inconnue est supprimée en silence** à l'enregistrement. Un champ `motionStudio` ou `timeline` sur un nœud n'est pas conservé tant que `normalizeNode` ne le lit pas.
- **Pas de version de schéma au niveau page ni au niveau mouvement.** Seuls les widgets personnalisés ont `v` + `migrate` (`nodes.js:1771-1775`, `widgets/index.js:67`). `motion` n'a pas de `v` (recherche `schemaVersion` : aucun résultat).
- Une timeline stockée dans les nœuds est soumise au plafond de 400 nœuds et de 1 Mo pour toute la page.

**Recommandation** : voir section 16.

---

## 4. Registre des widgets

**État actuel**
- Deux registres cohabitent :
  1. `NODE_TYPES` (`nodes.js:439-890`) pour les types intégrés (heading, text, container, grid, image, video, modal, carousel, html, code…), avec `WIDGETS` (fiches de bibliothèque, `nodes.js:896-967`), `PALETTE` (`nodes.js:1119`) et `WIDGET_DESCRIPTIONS` (`nodes.js:1022`).
  2. Widgets « personnalisés » : un fichier par widget dans `src/marketing/pages/widgets/*.js`, chargés au démarrage par `widgets/index.js:load()` (lignes 63-76), enregistrés par `registerWidget` (`nodes.js:1075`, boucle ligne 1092). 20 fichiers présents (lottie, marquee, beforeafter, carrousels, cta, shop, textpath…).
- Un widget personnalisé = 3 fichiers (`docs/widgets-personnalises.md`) : description `src/marketing/pages/widgets/<type>.js`, gabarit `views/marketing-public/widgets/<type>.ejs` (existence vérifiée au démarrage, `widgets/index.js:70`), styles dans `public/css/landing.css`.
- Types de champ autorisés (`widgets/index.js:13`) : `text, textarea, number, select, bool, link, image, icon, color, items`. Pas de type `json`, `file` ni `animation`. `items` : 24 éléments au plus, une seule profondeur (`widgets/index.js:51-57`).
- Chaque champ est validé par `validateField` (`nodes.js:1042-1064`) ; les nombres exigent des bornes `min`/`max`.
- Test de régression : `tests/fixtures/widgets-regression.json`, `tests/widgets-helpers.js`, et un test « aucune classe orpheline » (CSS) cité dans `docs/widgets-personnalises.md`.
- Versionnement : `version` + `migrate[v]` obligatoires dès `version > 1` (`widgets/index.js:67`).
- Permissions de widget : `requires` (ex. `pages.code`, `nodes.js:1090`, vérifié côté serveur par `lockedWidgetChanges`, `nodes.js:1098`, appelé par `index.js:142-146`).

**Exemple concret proche du besoin** : `widgets/lottie.js` + `widgets/lottie.ejs` + `landing.js:466-505` (voir section 11).

**Limites / risques**
- Le schéma de champs est plat : une timeline ou un tracé d'images-clés ne s'exprime pas avec les types actuels. Il faudrait un nouveau type de champ (ex. `motion`) ajouté à `KINDS`, à `validateField` et à l'inspecteur de `PB`.
- Le moteur impose qu'un widget ait une classe CSS stylée dans `landing.css` (test « aucune classe orpheline »).

**Recommandation** : brancher chaque composant motion comme widget personnalisé (`src/marketing/pages/widgets/motion-*.js`) avec un gabarit EJS léger. Voir section 16.

---

## 5. Panneau de propriétés et contrôles

**État actuel**
- L'inspecteur est construit dans `PB` (`inspectorFor` ligne 2871, `renderInspector` ligne 4066). Les champs d'un widget personnalisé viennent du `schema` (types ci-dessus).
- Les contrôles de mouvement actuels sont dans `PBE` : `motionPanel` (ligne 337), section « Animation » dans `PB:4421-4430` (`motionField`), menu des animations avec recherche et aperçu au survol (`PBE:276+`), panneau défilement « de → à » (`PBE:454`), souris (`PBE:488`), écrans (`PBE:67`).
- Capacités par type : `capsOf(type)` (`nodes.js:1574-1581`) décide quelles sections s'affichent (`motion, scroll, mouse, transform, attrs, css, responsive`, plus `sticky` pour les conteneurs et `mask` pour les médias). `spacer` et `modal` n'ont que `attrs, css, responsive`.
- Documentation des contrôles : `docs/CONTROLES-NUMERIQUES.md`, `docs/EDITEUR-DROITE.md`, `docs/KOLAKISA_WIDGET_CONTROL_MATRIX.md`.
- Règle de sécurité côté éditeur : « Aucun HTML venant de l'utilisateur n'est inséré dans l'interface » (`textContent`/`value` seulement, `PB:5-7`).

**Limites / risques**
- Le panneau est une feuille de contrôles pour un élément. Il n'y a pas de vue multi-éléments ni de timeline. Une timeline demande un panneau dédié (zone basse ou volet) et un accès à l'arbre complet.
- `PB` est un fichier de 8 683 lignes : y ajouter la timeline augmente le risque de régression. La pratique actuelle découpe en modules `page-builder-*.js` qui reçoivent un objet `A` (API) : `PBE` utilise `A.SPEC`, `A.h`, `A.canvasEl`, `A.byId`, `A.selectField`.

**Recommandation** : créer `public/js/page-builder-motion-studio.js` sur le modèle de `PBE` (module séparé, API `A`), et l'inclure dans `views/marketing/page-builder.ejs`.

---

## 6. Gestion des styles

**État actuel**
- Les styles d'un nœud sont `styles.<écran>` (propriétés CSS en liste fermée `STYLE_PROPS`, `nodes.js:118-252`) et `states.<état>` (hover, focus, active, `nodes.js:31`), validés par `normalizeStyleSet` (`nodes.js:266`) et convertis en CSS par `declarations` (`nodes.js:330`) puis `pageCss` (`nodes.js:1994`). Une règle `.kw-n-<id>` par élément, par écran et par état.
- Jetons : couleurs (`COLOR_TOKENS`, `nodes.js:74`), longueurs (`lenTokens`, `nodes.js:56`) ; les valeurs de style sont validées une à une : « jamais de CSS libre » (`nodes.js:40`).
- `transform` propre à l'élément est exposé aux animations par la variable `--kw-tf` (écrite par le serveur) : chaque image-clé démarre de `var(--kw-tf,) …` (`motion.js:14-18`). Le mouvement ne remplace jamais la transformation de l'élément.
- Défilement et souris utilisent les propriétés individuelles `translate`, `scale`, `rotate`, `opacity`, `filter` (`docs/MOTION-ENGINE.md`, section Composition).
- Classes globales du site : `normalizeClassDefs`, `classCss` (`nodes.js:1961-1993`).
- CSS libre : voir section 9 (sanitisation).
- Doc : `docs/KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md`.

**Risques pour le Motion Studio**
- Un composant animé qui pose ses propres `transform` inline entrerait en conflit avec `--kw-tf` et avec les propriétés individuelles de `kw-effects.js`. Règle à garder : animer via `translate/scale/rotate/opacity` ou via un enfant interne, jamais `transform` sur la racine du nœud.
- `docs/KOLAKISA_MOTION.md` (§1) interdit d'animer des propriétés de mise en page (width, height, top, left, margin, padding) ; `scripts/audit-qualite.js` vérifie « 0 règle animant la mise en page ».

---

## 7. Responsive et points de rupture

**État actuel**
- Écrans du modèle : `desktop`, `wide` (`min-width: 1920px`), `tablet` (`max-width: 1023px`), `mobile` (`max-width: 767px`) : `nodes.js:24-30`. Valeurs par défaut des largeurs : `DEFAULT_BREAKPOINTS = { tablet: 1023, mobile: 767, wide: 1920 }` (`nodes.js:1955`), réglables par site (`breakpointsOf`, `siteSettings.js`).
- Héritage : tablette depuis ordinateur, mobile depuis tablette, grand écran depuis ordinateur seulement (`PB:25-27`).
- Mouvement par écran :
  - entrée : `motion.screens.{tablet,mobile}` = identifiant d'animation ou `"none"`, vide = hérite (`nodes.js:1722-1727`, règles `entranceRules` `nodes.js:1925-1930`) ; `wide` n'a pas de remplacement propre ;
  - défilement/souris : `motion.off` = liste d'écrans où l'effet est coupé (`nodes.js:1712-1716`) ; refuse de couper les trois écrans à la fois ;
  - épinglage : `styles.<écran>.position/top/bottom/zIndex`.
- Un élément peut être masqué par écran (`hideOn`, `nodes.js:1796-1801`, classes `lp-hide-*`).
- Côté exécution, `kw-effects.js` calcule l'écran courant par `breakpointOf` (`kw-effects.js`, export ligne 249) et respecte `(hover: hover) and (pointer: fine)` (ligne 94).
- Doc : `docs/KOLAKISA_RESPONSIVE.md`, `docs/KOLAKISA_ADVANCED_RESPONSIVE_ENGINE.md`.

**Limites**
- Pas d'écran « grand écran » dans `motion.screens` (seulement tablette et mobile).
- Les breakpoints sont par site : un runtime motion doit les lire sur la page (attribut ou variable), pas les coder en dur.

---

## 8. Annuler / rétablir et historique

**État actuel** (`PB:223-262`)
- Pile `past`/`future` d'instantanés **JSON complets** du document : `snapshot()` = `JSON.stringify({ sections, title, description, seo, theme, selection })` (`PB:226`). Limite : **150 étapes** (`PB:250`).
- Toute modification passe par `change(fn, opts)` (`PB:239`). `opts.key` identique à l'étape précédente fusionne les frappes/glissements en une seule étape ; `opts.label` nomme l'étape dans le menu Historique (`openHistory`, `PB:262+`). `opts.light` évite le rendu complet.
- `change` retourne `false` sans effet si `!canWrite` ou pendant `probing` (`PB:242`).
- Sauvegarde de secours dans `localStorage` (`backup()`, clé `pb-backup-<id>`, `PB:8309-8320`), supprimée après un enregistrement réussi.
- Côté serveur, deux historiques : versions **publiées** `mk_page_versions` (`index.js:187-199`, borné par `MAX_VERSIONS`) et points de **brouillon** `cms_revisions` (`src/services/revisions.js`, fenêtre de regroupement 5 min, 100 points par élément, lignes 11-16). Restaurer une version la copie dans le brouillon et sauvegarde d'abord l'état courant (`index.js:288-292`).

**Limites / risques**
- Chaque étape clone tout le document : une timeline lourde dans le JSON augmente le coût mémoire de 150 instantanés.
- Un glissement de poignée de timeline qui ne passe pas par `change` avec une `key` remplirait l'historique en quelques secondes.
- L'état de lecture (temps courant, lecture en cours) ne doit pas entrer dans `content` : il ne doit ni annuler, ni être enregistré, ni marquer la page « modifiée ».

**Recommandation** : toute édition de la timeline passe par `change(fn, { key: "ms-drag-<id>", label: "Timeline" })`. L'état de lecture reste dans une variable locale au module.

---

## 9. Sauvegarde, restauration, concurrence

**État actuel**
- Sauvegarde automatique : `scheduleSave()` (1 s de délai, `PB:8309-8316`) puis `save()` (`PB:8342`) : `PUT /marketing/pages/:id/brouillon` avec `{ content, revision }` (`landing.js:565`). Réponse : nouvelle `revision` et `warnings`.
- Serveur : `saveDraft` (`index.js:149-167`) normalise (`normalizeContent`), vérifie les droits de widgets réservés (`checkWidgetRights`), le verrouillage de format de mise en page, puis `UPDATE … WHERE revision = ?`. Si la ligne n'est pas modifiée : erreur `conflict` (409, `index.js:21`). Verrouillage optimiste, pas de fusion.
- `warnings` (réglages écartés car inapplicables) : l'éditeur nettoie son document par `healIgnored` (`PB:8321+`) sans nouvelle étape d'historique.
- Erreurs : 409 bloque l'éditeur et garde une copie locale ; 422 affiche le message et marque l'élément fautif (`itemFromError`) ; 403 bloque ; autres : nouvel essai avec délai croissant (`PB:8359-8369`).
- Publication : `POST …/publier(.json)` (`landing.js:583,595`, permission `pages.publish`) → `publish()` (`index.js:178-201`) crée une version numérotée si le contenu a changé.
- Programmation de publication (`schedulePage`, `promoteScheduledPages`, `index.js:215-256`), A/B tests (`abtests.js`), export/import de pages (`landing.js:214,219`).

**Limites / risques**
- Aucune fusion de modifications concurrentes (un seul brouillon par page).
- Le corps de requête est plafonné à 1 Mo (`server.js:84`) ; au-delà, l'enregistrement échoue.
- Les erreurs de validation 422 sont des textes de `throw new Error(...)` en français, attachés à un élément par `itemFromError(msg)` (recherche du nom dans le message) : un nouveau validateur doit produire un message qui contient `where` (nom de l'élément).

---

## 10. Rendu public et rendu éditeur

**État actuel**
- Un seul gabarit : `views/marketing-public/landing.ejs` + `_sections.ejs` + `_node.ejs` (+ `_node-safe.ejs`) + un gabarit par widget dans `views/marketing-public/widgets/`. Le paramètre `builder` ajoute `data-kw-builder` et change quelques branches (`isBuilder`).
- Attributs de mouvement : posés par `motionAttrs(n)` (`nodes.js:1932-1951`) via `n.motionAttr` dans `_node.ejs:~10` : `data-kw-anim`, `data-kw-anim-repeat`, `data-kw-anim-vis`, `data-kw-anim-trigger`, `data-kw-anim-rm`, `data-kw-scroll`, `data-kw-mouse`, `data-kw-sfx`, `data-kw-mfx` (JSON échappé), `data-kw-fx-off`, `data-kw-motion-always`.
- CSS de page : `pageCss()` (`nodes.js:1994+`) ; images-clés limitées aux animations utilisées : `usedAnims` → `MOTION.keyframesCss([...usedAnims])` (`nodes.js:2067,2120`). Une page sans animation n'a aucune image-clé du moteur.
- Scripts chargés en fin de `<body>` (`landing.ejs:41-44`) : `visitor.js` (si pas aperçu), `landing.js` (defer), script du pack de thème (`siteX.assets.pack.script`, injecté brut), `kw-effects.js` (defer), puis le code personnalisé `bodyEnd` du site.
- Thème et code de site : `siteX.assets` (`siteSettings.js:302-313`).
- Le Page Builder est aussi utilisé pour les composants et pour le Theme Builder (`landing.js:482-552`, `src/themeBuilder/`) ; une fonction qui touche le rendu touche donc aussi en-têtes et pieds de page.

**Limites / risques**
- `landing.js` est un fichier unique qui gère carrousels, modales, lightbox, Lottie, compteurs, interactions : pas de chargement conditionnel par module, hormis Lottie qui charge sa bibliothèque à la demande.
- Les attributs `data-kw-*` portent du JSON inline : une timeline longue gonflerait le HTML de chaque page.

---

## 11. Sanitisation : ce qui est retiré ou refusé

**HTML (widget `html`)** : `sanitizeHtmlBlock` (`nodes.js:1410-1432`, bibliothèque `sanitize-html`). Balises autorisées : liste fermée (div, span, p, titres, listes, tableaux, img, a, details, figure…) plus SVG de forme (`svg, g, path, circle, rect, line, polyline, polygon, ellipse, title, desc, defs, lineargradient, radialgradient, stop`, `nodes.js:1408`). Attributs : `class, title, role, lang, aria-*, data-*` et attributs SVG géométriques (`nodes.js:1409`). **Retirés** : script, style, iframe, form, `animate`/`animateTransform`/`set` (SVG animé), `foreignObject`, `use`, `image`, `filter`, `clipPath`, `mask`, événements `on*`, `style` en ligne ; schémas autorisés : `https`, `mailto` ; `img` seulement `https:` ou `/uploads/`. Longueur limitée à 20 000 caractères. Le widget `html` exige la permission `pages.code` (`nodes.js:940,1090`).

**Texte riche** : `sanitizeRich` (`nodes.js:1282-1301`) : balises de texte, styles limités à `text-align`, `color`, `background-color`, `padding-left`, liens `https` ou chemins du site.

**CSS d'élément** (`cssDeclarations`, `nodes.js:1468-1481`) : 2 000 caractères, forme `propriété: valeur` uniquement ; valeur refusée si elle contient `url(`, `image-set`, `@`, `\`, `<`, `>`, commentaires, `expression`, `javascript:`, `behavior`, `-moz-binding`, `{` ou `}` (`CSS_BAD`, `nodes.js:1467`). Donc **pas de `@keyframes`, pas de `@media`, pas de `@import`, pas d'`url()`** dans le CSS libre.

**CSS de page** (`normalizePageCss`, `nodes.js:1483-1499`) : 8 000 caractères, règles « sélecteur { déclarations } », chaque sélecteur est préfixé par `.lp-main`, sélecteurs `html`/`body`/`:root` refusés.

**Classes** : `normalizeClasses` (`nodes.js:1502`), 8 au plus, préfixes `kw-`, `lp-`, `pb-`, `mk-` réservés. **Attributs** : seulement `data-*`, `aria-*`, `title`, `role`, `lang` (`ATTR_RE`, `nodes.js:1509`), 10 au plus, valeur 200 caractères.

**Liens et images** : `linkUrl` (`src/marketing/pages/sections.js:19-26`) : chemin du site `/…`, ancre `#…` ou `https://…` ; refuse `javascript:`, `data:`, `http:`, `//`. `imageUrl` (`sections.js:30-40`) : `/uploads/marketing/<org>/…`, `/uploads/thumbnails/…`, `/themes-art/…svg` (SVG fabriqués par Kolakisa) ou `https://…`. La validation est syntactique : `<org>` n'est pas comparé à l'organisation courante dans cette fonction (non vérifié ailleurs).

**Vidéo/audio** : `LOCAL_VIDEO`, `LOCAL_AUDIO` (`nodes.js:16-17`) ; vidéo de fond `.mp4/.webm` (`nodes.js:1840`). **Embeds** : fournisseurs connus seulement (`EMBED_PROVIDERS`, `nodes.js:1434`).

**Valeurs de mouvement** : listes fermées et bornes numériques (`normalizeMotion`, `nodes.js:1676-1748`) ; courbe : noms ou `cubic-bezier` à 4 nombres bornés (`motion.js:92-100`) ; le CSS des images-clés vient du registre `motion.js`, jamais d'une saisie.

**Code de site** (head, début/fin de body) : réservé à `pages.code`, **signé côté serveur** (`signCustomCode`, `siteSettings.js:293-299`) ; restitué seulement si la signature est valide, injecté brut (`landing.ejs:22,43,45`). Pas injecté dans l'aperçu ni dans le canevas (`!preview && !builder`, `landing.ejs:21`).

**Limites / risques**
- Le CSS libre ne peut pas contenir de `@keyframes` : un Motion Studio basé sur du CSS libre est impossible. Il doit passer par un registre côté serveur comme `motion.js`.
- Aucun JS saisi par l'utilisateur n'est exécuté (sauf le code de site signé, réservé administrateur). Un composant motion doit donc être du code Kolakisa configuré par des données validées.
- Le SVG saisi ne peut pas être animé (SMIL retiré) ; un SVG animé passe par un widget dédié.

---

## 12. Système d'animation existant

Inventaire complet (tout est lu dans le code) :

| Fonction | Fichiers et lignes | Comportement |
|---|---|---|
| Registre d'animations | `src/marketing/pages/motion.js` (146 lignes) : `DEFS` lignes 20-109, `ANIMATIONS` 111-122 | 63 animations (id, libellé, catégorie, kind `in`/`attn`/`out`, images-clés CSS, comportement mouvement réduit `fade`/`none`, durée et courbe conseillées). Ajouter une animation = une ligne. |
| Courbes | `motion.js:124-134` | `smooth, linear, ease, ease-in, ease-out, ease-in-out, spring` ou `cubic-bezier(a,b,c,d)` borné (x dans [0,1], y dans [-3,3]). |
| Déclencheurs d'entrée | `motion.js:136`, `landing.js:116-145` | `viewport` (IntersectionObserver, seuil 0,12, marge basse -5 %), `load`, `click`, `hover`. Rejouable (`repeat`). |
| Paramètres | `nodes.js:1722-1741` | durée 100-10 000 ms, délai 0-10 000 ms, répétitions 1/2/3/infinie (jamais infinie par défaut), direction, écrans. |
| Effets de survol | `nodes.js:1642-1648` (`HOVERS`, 16 effets), CSS `landing.css` | Classe `kw-hover-<nom>`. |
| Défilement (ancien) | `nodes.js:1649-1653`, `kw-effects.js` | y, x, opacité, flou, échelle, rotation, amplitude centrée. |
| Défilement « de → à » | `nodes.js:1657-1665`, `kw-effects.js` | translateY/X, rotate, rotateX (perspective), scale, opacity, blur ; plage start-end en %, sens, inversion. |
| Souris | `nodes.js:1668-1675`, `kw-effects.js` | modes `track`/`tilt` ; amplitudes translate/rotate/scale, vitesse de lissage. |
| Épinglage | `styles.<écran>.position: sticky`, `docs/MOTION-ENGINE.md` | Par écran. |
| Interactions | `nodes.js:1520-1528` (`IX_TRIGGERS`, `IX_ACTIONS`), `landing.js:326-355` | 6 interactions par élément ; actions show/hide/toggle/scroll/open/animate. |
| Modales | `nodes.js:1583-1627`, `landing.js:222-300` | Animations d'entrée et de sortie, déclencheurs load/scroll/exit/idle/clics/élément. |
| Lottie | `widgets/lottie.js`, `lottie.ejs`, `landing.js:466-505`, `vendor/lottie_light.min.js` | Voir plus bas. |
| Autres widgets animés | `widgets/marquee.js`, `beforeafter.js`, `carrousels.js`, `textpath.js`, `landing.js:181-200,310-325` | Défilement continu, avant/après, diaporama, compteurs, barres de progression. |
| Runtime défilement/souris | `public/js/kw-effects.js` (250 lignes) | Un seul écouteur de défilement passif, un seul de souris, rAF seulement si quelque chose bouge, IntersectionObserver pour ne calculer que les éléments visibles, `destroy()` (lignes 224-232), arrêt sur `pagehide` (ligne 244). Module UMD testable (`create`, `scrollValues`, `composeRotations`, export ligne 249). |
| Mouvement de l'interface admin | `public/js/kb-motion.js` (69 lignes), `kol-motion.js` (37 lignes) | `html[data-kb-motion] = full/lite/off` pour l'administration seulement ; `kol-motion.js` : apparitions/sorties des micro-interactions de l'éditeur. Ne concernent pas les pages publiées. |

**Widget Lottie (détail)**
- Champs : `src` (link), `alt` (obligatoire), `trigger` (viewport/load/hover/click), `loop`, `speed` 0,25-4, `height` 0-900, `align` (`widgets/lottie.js:9-17`).
- `validate` : `src` doit finir par `.json` (regex) ; `complete` : la publication exige une adresse.
- `src` passe par `linkUrl` : `https://…` ou chemin `/…` (aucun contrôle du contenu du JSON).
- Exécution (`landing.js:466-505`) : bibliothèque chargée à la demande (`/js/vendor/lottie_light.min.js`, chemin codé en dur sans `asset()`), à l'approche de l'écran (`rootMargin: 200px`) ; `lottie.loadAnimation({ renderer: "svg", path })` ; mouvement réduit : première image sans lecture ; erreur de chargement : `data-kw-state="error"`.
- Éditeur : placeholder (pas de lecture).
- Test navigateur : `tests/widgets-lottie-navigateur.test.js`.

**Mouvement réduit (`prefers-reduced-motion`)**
- Entrées : `landing.js:116,133` ; animations dont `reducedMotionBehavior` vaut `"fade"` deviennent un fondu court (`landing.css:651-652`), les autres sont supprimées. Décocher « Respecter les préférences système » pose `data-kw-motion-always` (`PBE:425`).
- Défilement/souris : `kw-effects.js:94` (`reduceQ`).
- Lottie : `landing.js:470,488`.
- Modales, lightbox, bascule et survol : règles `@media (prefers-reduced-motion: reduce)` dans `landing.css` (lignes 324, 431, 594, 646, 652, 793, 902, 1011).
- Bémol : le choix explicite de l'auteur peut contourner le réglage système (`alwaysMotion`, `nodes.js:1744`).

**Docs existantes** : `docs/MOTION-ENGINE.md`, `docs/KOLAKISA_MOTION.md`, `docs/ELEMENTOR_INTERACTIONS.md` (39 lignes de parité pour popups et déclencheurs, vue générée par `scripts/build-elementor-matrix.py`, à ne pas modifier à la main), `docs/motion-studio/WEB_MOTION_DESIGN_REFERENCE.md` et `WEB_MOTION_COMPONENTS_CATALOG.md` (déjà présents dans le dossier, non audités ici).

**Limites**
- Pas de séquencement entre éléments (le délai est absolu par élément, sans décalage « en cascade » de groupe ni lien « après l'élément X »).
- Pas de timeline, pas de contrôle de lecture, pas de scrub, pas de marqueurs.
- Pas de scroll-driven animations CSS natives (`animation-timeline`) : le défilement passe par JS (`kw-effects.js`). Support navigateur de cette API : **non vérifié**.
- Aucun moteur 3D/WebGL/Rive/GSAP dans le dépôt.

---

## 13. Médias, assets et uploads

**État actuel**
- Médiathèque : `src/marketing/media/index.js`. Type lu dans la **signature binaire** du fichier (`sniff`, lignes 31-70), jamais dans le nom ni dans le type déclaré. Formats acceptés : JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, WAV, OGG, MP3, M4A, PDF, DOCX/XLSX/PPTX (+ anciens DOC/XLS/PPT) (ligne 86).
- **Refusés** : SVG (ligne 94), HTML/JS/PHP/exécutables (ligne 95), `.mov/.mkv/.avi/.heic` (ligne 97) et tout format non reconnu (message générique ligne 98). Donc **`.json` (Lottie), `.lottie`, `.riv` (Rive), `.glb/.gltf`, `.wasm`, `.hdr`, `.ktx2` sont refusés**.
- Limites de taille : image 5 Mo, document 10 Mo, audio 25 Mo, vidéo 50 Mo (lignes 17-21). Les vidéos passent en mémoire pendant l'envoi.
- Stockage : `UPLOADS_DIR` (survit aux déploiements), noms aléatoires, chemin `/uploads/marketing/<org>/[site-<n>/][AAAA/MM/]<nom>` (regex `nodes.js:16`). Servi par `server.js:119-127` (middleware de variantes d'image puis `express.static`, `maxAge: 30d, immutable`, `X-Content-Type-Options: nosniff`, Office en téléchargement).
- Variantes d'image à la demande : `src/marketing/media/variants.js` (`/uploads/marketing/<org>/v/<largeur>/<nom>.webp`). `sharp` est optionnel.
- Médiathèque propre à un site ou commune : champs `reach`, `site_id` (`media/index.js:~105`).
- Fichiers statiques de l'application : `public/` servi avec `maxAge: 1h` (`server.js:110`) ; `asset()` (`src/utils/assets.js:12-28`) ajoute `?v=<sha1 8 caractères>` pour un cache d'un an.
- Audit des médias : `scripts/audit-medias.js`, docs `docs/KOLAKISA_ADVANCED_MEDIA_MANAGER.md`, `docs/KOLAKISA_AI_MEDIA_SECURITY.md`.
- Éditeur de fichiers de thème : `public/js/cms-theme-files.js`, `src/editor/theme-code-editor.js` (CodeMirror). Quels types de fichiers il accepte et où il écrit : **non vérifié**.

**Conséquences pour le Motion Studio**
- Il n'existe aucun moyen, via l'interface, de téléverser un fichier d'animation JSON/Lottie/Rive/GLB : le widget Lottie actuel ne fonctionne qu'avec une adresse `https://` externe (qui doit autoriser la lecture inter-sites) ou un fichier déposé à la main dans `public/`.
- Un téléversement de `.json` exige : une règle `sniff` (parse JSON borné et vérification de forme Lottie), une règle de type, une limite de taille, et un `Content-Type` correct au service (aujourd'hui le service statique déduit le type de l'extension : `.json` est servi `application/json`, comportement par défaut d'Express, non testé ici).

---

## 14. CSP et en-têtes de sécurité

**État actuel**
- En-têtes globaux (`src/middlewares/security.js:4-18`, monté `server.js:68`) :
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
  - `Content-Security-Policy: object-src 'none'; base-uri 'self'; frame-ancestors 'self'`
  - `Strict-Transport-Security: max-age=15552000` si la requête est sécurisée.
- Le commentaire (`security.js:8-13`) dit explicitement que `script-src` et `form-action` **ne sont pas restreints** (scripts intégrés aux pages, formulaires qui redirigent vers l'adresse choisie par le formateur).
- Doublon en balise `<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'">` dans l'éditeur (`views/marketing/page-builder.ejs:6`), le tableau de bord, le header, l'IA (« le CDN de l'hébergeur remplace la politique envoyée par le serveur », `page-builder.ejs:5`). La page publique `landing.ejs` : balise meta CSP **non vérifiée** (non lue ; l'en-tête global s'applique).
- CSP plus strictes sur les sorties isolées : SVG de thèmes (`themeArtPublic.js:23`), avatars (`avatars.js:13`), polices (`fonts.js:30`), versions web et modèles d'e-mail (`templates.js:105,191`), partage social (`socialPublic.js:40`), `admin.js:215`.

**Conséquences pour charger des bibliothèques, wasm, workers**
- Aucune directive `script-src`, `worker-src`, `connect-src`, `img-src`, `media-src`, `child-src`, `style-src` : **rien ne bloque** aujourd'hui le chargement d'un script, d'un worker, d'un fichier `.wasm` ou d'un `fetch` depuis la même origine ou une origine externe. Les scripts `<script>` en ligne fonctionnent (le code de site et les scripts de pack de thème sont injectés en ligne).
- `WebAssembly.instantiate*` et `new Worker(blob:)` ne sont donc pas bloqués par une CSP actuelle. Si le projet resserre un jour sa CSP, `'wasm-unsafe-eval'` (wasm), `worker-src` et `blob:` devront être ajoutés ; **non vérifié** en test réel.
- `object-src 'none'` bloque `<object>/<embed>` (un lecteur Flash ou PDF intégré n'est pas utilisable).
- `X-Frame-Options: SAMEORIGIN` et `frame-ancestors 'self'` : une page Kolakisa ne peut pas être intégrée dans un iframe d'un autre domaine (pas d'aperçu intégré externe), sans effet sur le canevas (même origine).
- `Permissions-Policy` autorise le micro pour `self` : un composant audio réactif au micro serait possible, mais la caméra est interdite.
- Un fichier `.wasm` doit être servi avec `Content-Type: application/wasm` pour `instantiateStreaming`. Le comportement d'`express.static` pour `.wasm` n'a pas été testé ici (Express s'appuie sur le paquet `mime` ; **non vérifié**).
- Les domaines externes sont déjà tolérés pour les images (`https://…`), la vidéo de fond, Lottie (XHR cross-origin, CORS à la charge de l'hôte) et les embeds.

**Risques**
- L'absence de `script-src` signifie qu'une faille XSS ne serait pas atténuée par la CSP. Ajouter des moteurs externes ne l'aggrave pas, mais impose de ne jamais accepter de JS saisi.
- Le domaine du site sert aussi les comptes des élèves (`WIDGET_PERMISSIONS`, `nodes.js:1090` : « le HTML s'affiche sur le même domaine que les comptes des élèves »). Tout script fourni par un auteur de page serait exécuté dans ce contexte : raison de ne proposer que du code Kolakisa vendoré, configuré par données.

**Recommandation** : vendorer tout script sur l'origine du site (pas de CDN), ce qui reste compatible avec une future CSP `script-src 'self'`.

---

## 15. Isolation multi-sites

**État actuel**
- Hôte → site : `siteHost.attachSite` (`server.js:72`) ; `siteIsolation` (`src/middlewares/siteHost.js:117-137`) : domaine inconnu = 421 ; un domaine de site n'affiche jamais le contenu du site principal (`MAIN_SITE_ONLY`) ; écritures refusées (404) sur un domaine retiré. Doc : `docs/KOLAKISA_ADMIN_MULTISITE.md`.
- Pages : `mk_landing_pages.site_id` + `organization_id`. Toute lecture passe par `getPage(ctx, id)` qui filtre par organisation et par `ctx.siteScope` (`inScope`, `index.js:75-87`). Un collaborateur limité à un site (`ctx.siteScope`) reçoit « Ce site n'est pas accessible avec vos droits » (`assertSiteScope`, `index.js:76-78`).
- Composants : un composant propre à un site ne s'insère que dans une page de ce site ; global (sans site) partout. Contrôle serveur à l'enregistrement et au déplacement (`assertComponentsUsable`, `index.js:98`).
- Formulaires : `assertFormsUsable` (`index.js:116`).
- Historique : portée respectée (`sameScope`, `revisions.js:12`).
- Médias : sous-dossier `site-<n>` et `reach` par média ; l'éditeur envoie `meta mk-media-site` (`page-builder.ejs:7`).
- Réglages de site : `mk_sites.settings`, `tokens` avec `settings_revision` (verrouillage optimiste, `index.js:547-585`).

**Risques**
- `imageUrl`/`LOCAL_VIDEO` valident la forme du chemin mais ne comparent pas l'organisation ni le site du média à ceux de la page (voir section 11). Un futur type de ressource motion doit vérifier la propriété (organisation et portée de site) côté serveur, pas seulement la forme.
- Les routes publiques de chargement de bibliothèques (`/js/vendor/…`) sont communes à tous les sites : correct pour du code Kolakisa, à ne pas utiliser pour des fichiers fournis par un site.

---

## 16. Tests et conventions

- Exécuteur : `node --test --test-concurrency=1 "tests/*.test.js"` (`package.json`, script `test`). 773 fichiers `tests/*.test.js`, dont 198 `*navigateur*` (comptage `ls`).
- Intégration : `tests/helpers.js` lance un **vrai serveur** KOLAKISA sur un port aléatoire avec des dossiers temporaires `DATA_DIR`/`UPLOADS_DIR` (lignes 10-20) ; `startServer`, `loginInstructor`, clients HTTP. Aides : `tests/marketing-helpers.js`, `tests/widgets-helpers.js`, `tests/helpers-editeur-navigateur.js`.
- Tests navigateur : `require("playwright-core")` + Chrome système (macOS, Linux) ; **ignorés si Playwright ou Chrome absents** (`SKIP`, p. ex. `tests/widgets-lottie-navigateur.test.js:11-14`). `playwright-core` n'est **pas** dans `package.json` ni dans `node_modules` : sur cette machine, les 198 tests navigateur seraient ignorés (non exécutés pour cet audit).
- Tests existants du mouvement : `tests/moteur-mouvement.test.js` (registre, validation, CSS, calculs purs ; appelle `nodes.normalizeNode` directement avec des « helpers » `H`, lignes 6-12), `tests/moteur-mouvement-navigateur.test.js` (panneau), `tests/moteur-mouvement-chrome.test.js` (exécution des 63 animations sur la page publiée, déclencheurs, écrans, mouvement réduit, performance), `tests/editeur-mouvement-navigateur.test.js`, `tests/mouvement-adaptatif-navigateur.test.js`, `tests/widgets-lottie-navigateur.test.js`, `tests/effets-serveur.test.js`, `tests/rendu-accessibilite-navigateur.test.js`, `tests/widgets-marquee-avant-apres*.test.js`.
- Registre de régression des widgets : `tests/fixtures/widgets-regression.json`, doc `docs/KOLAKISA_WIDGET_REGRESSION_PLAN.md`.
- Banc de qualité : `npm run quality:lab` (`tests/quality-lab/lab.js`), scripts d'audit `scripts/audit-*.js`.
- Conventions : tests en français, un `describe` par domaine ; les fichiers de test décrivent en en-tête ce que le test garantit ; les « MESURE » de performance sont imprimées dans les tests navigateur.
- Règle projet : « aucune animation concurrente », durées 120/180/260 ms pour l'interface d'administration (`docs/KOLAKISA_MOTION.md`) ; les pages publiées ont leurs propres durées (100-10 000 ms) et ne sont pas soumises à cette échelle.

---

## 17. Performance

**État actuel**
- Mesures documentées : manipulation directe, page de 300 éléments, médiane 16,7 ms par image, max 33 ms (`docs/KOLAKISA_MOTION.md` §3) ; autres docs : `docs/KOLAKISA_CANVAS_INTERACTION_PERFORMANCE.md`, `docs/KOLAKISA_EDITOR_PERFORMANCE_REPORT.md`, `docs/KOLAKISA_ADVANCED_PERFORMANCE_ENGINE.md`. Tests : `tests/page-builder-performance-navigateur.test.js`, `tests/widgets-performance-navigateur.test.js`, `tests/editeur-fluidite-navigateur.test.js`.
- Public : `compression()` (`server.js:67`) ; minification à la volée de seulement 4 fichiers : `/css/landing.css`, `/js/landing.js`, `/js/kw-effects.js`, `/js/visitor.js` (liste blanche `minify.js:11`), seulement sur adresses versionnées `?v=` et en production ; repli sur l'original. Un nouveau fichier runtime n'est **pas** minifié tant qu'il n'est pas ajouté à `ALLOW`.
- Cache : `asset()` = un an immuable ; vendor Lottie chargé **sans** `asset()` (`landing.js:476`), donc sans empreinte de version et avec le cache de 1 h de `express.static` (`server.js:110`).
- CSS de page : seulement les images-clés utilisées. JS : listeners passifs, rAF conditionnel, IntersectionObserver.
- `page-builder.js` n'est pas minifié (8 683 lignes) ; `kb-motion.js` mesure la fluidité de l'interface d'administration seulement.
- Pas de budget de poids documenté pour les pages publiées dans ce que j'ai lu (budgets éventuels dans `docs/KOLAKISA_ADVANCED_PERFORMANCE_ENGINE.md` : **non lu**). Objectifs généraux dans `docs/KOLAKISA_MOTION.md` §4 : LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
- `src/perfEngine/` existe (minify et autres, contenu non audité).

**Risques**
- Un moteur supplémentaire (GSAP environ 70 Ko minifié, Rive wasm plusieurs centaines de Ko, Three.js plusieurs centaines de Ko : ordres de grandeur **non vérifiés** dans ce dépôt) pèserait sur chaque page s'il était chargé globalement. Le modèle de Lottie (chargement à la demande à l'approche de l'écran) est le bon patron.
- Les images-clés CSS sont composées (transform/opacity) : bon pour le thread principal ; un runtime JS qui pilote le style à chaque image doit rester borné à ce qui est visible, comme `kw-effects.js`.

---

## 18. Synthèse par fonctionnalité

| Fonctionnalité | État | Principal risque | Recommandation courte |
|---|---|---|---|
| Registre widgets | Complet, extensible par fichiers | Champs plats, pas de type JSON/animation | Nouveau type de champ ou widget motion à schéma plat + `items` |
| Données | Normalisation stricte, clés inconnues supprimées | Pas de version de schéma ; plafond 400 nœuds / 1 Mo | Nouvelle clé versionnée lue dans `normalizeNode` |
| Canevas | Rendu serveur dans iframe | Aucun mouvement exécuté, aller-retour réseau | Runtime partagé injecté dans le canevas |
| Panneau | Module `PBE` éprouvé | `PB` volumineux | Module séparé `page-builder-motion-studio.js` |
| Styles | Liste fermée, `--kw-tf` | Conflit `transform` | Animer via propriétés individuelles |
| Responsive | 4 écrans + héritage | Pas de `wide` dans `screens` | Config par écran avec héritage identique |
| Annuler/rétablir | Instantanés JSON, 150 étapes | Coût mémoire, flood | `change` avec `key`, état de lecture hors contenu |
| Sauvegarde | Brouillon + révision + 409 | Pas de fusion ; 1 Mo | Config compacte |
| Rendu public | Même gabarit, `data-kw-*` | JSON inline dans le HTML | Attribut compact ou bloc de données |
| Sanitisation | Liste fermée partout | CSS libre sans `@keyframes` | Registre serveur, jamais de JS ou CSS saisi |
| Animations | 63 + survol + défilement + souris | Pas de timeline | Étendre, ne pas dupliquer |
| Médias | Signature binaire, formats restreints | `.json/.riv/.glb/.wasm` refusés | Nouveau type de média avec validation |
| CSP | Quasi absente (object/base/frame) | XSS non atténuée | Vendorer sur l'origine ; prévoir `wasm-unsafe-eval` si resserrement |
| Multi-sites | Portée vérifiée serveur | Chemins média non liés à l'org | Vérifier propriété des ressources |
| Tests | 773 + 198 navigateur (ignorés sans Playwright) | Pas de Playwright installé | Tests purs Node pour la logique, navigateur pour le rendu |
| Performance | Minify partielle, asset() | Moteurs lourds | Chargement à la demande |

---

## 19. Recommandation d'architecture d'extension

### 19.1 Où brancher le registre de widgets motion

- **Composants animés** (texte animé, compteurs, révélations, marquee, etc.) : widgets personnalisés dans `src/marketing/pages/widgets/motion-<nom>.js` + `views/marketing-public/widgets/motion-<nom>.ejs` + styles dans `public/css/landing.css`. Le contrat existe déjà (`widgets/index.js:check`, `docs/widgets-personnalises.md`) : versionnage, `migrate`, `requires`, `status`, `dependencies`, validation, fiche de bibliothèque, contenu de départ, comptage de liens. Aucune modification de `nodes.js` n'est nécessaire pour un composant simple.
- **Catalogue de presets motion** : un nouveau registre `src/marketing/pages/motionStudio.js` sur le modèle de `motion.js` (données déclaratives, listes fermées, bornes), exporté vers l'éditeur par `editorSpec()` (`nodes.js:1254`) à côté de `entrances`, `scrollFx`, etc.
- Nouveaux types de champ : s'il faut un éditeur de séquence dans l'inspecteur, ajouter un kind (par exemple `motion`) à `KINDS` (`widgets/index.js:13`), à `validateField` (`nodes.js:1042`) et au rendu des champs dans `PB`.

### 19.2 Où stocker la configuration d'animation versionnée

- **Par élément** : étendre l'objet `motion` existant (déjà lu par `normalizeMotion`, `nodes.js:1676`) avec un sous-objet versionné, par exemple `motion.studio = { v: 1, ... }` ; ajouter la lecture et la validation dans `normalizeMotion` (sinon la clé est supprimée) et la migration (`v` → `v+1`) dans la même fonction. Avantage : suit déjà le nœud, le composant, l'export/import, l'historique, les versions publiées, les tests A/B et la copie/collage de la section Animation.
- **Par page (timeline multi-éléments)** : une nouvelle clé de contenu à côté de `sections/theme/seo`, par exemple `motionScenes: { v: 1, scenes: [...] }`, lue et validée dans `normalizeContent` (`index.js:123`), qui référence les éléments par identifiant (`NODE_ID`). Elle voyage dans `draft`, `sections`/`mk_page_versions`, l'historique commun et le rendu. La colonne `draft` est un JSON libre ; `sections`/`theme`/`seo` sont des colonnes séparées : une nouvelle clé de contenu publié exige une nouvelle colonne ou un rangement dans `theme`/`seo` (`publishedContent`, `index.js:71`). **Non tranché ici** : choisir entre migration SQL (voir `src/marketing/migrations/`, non lu) et rangement dans une colonne JSON existante.
- Validation obligatoire des références : une scène qui cible un identifiant d'élément absent doit être nettoyée avec un avertissement (mécanisme `ignored(h, …)` / `warnings`, `nodes.js:1862`, `PB healIgnored`), comme le fait déjà `interactions` (`interaction_target`).
- **Fichiers externes** (Lottie, Rive, GLB) : stockés en médiathèque après ajout d'un type de média (section 13), référencés par chemin `/uploads/marketing/…` validé par une variante de `imageUrl` qui vérifie l'organisation et le site.

### 19.3 Où mettre le moteur runtime partagé (public + canevas)

- Nouveau fichier `public/js/kw-motion-studio.js` en **UMD** (même patron que `kw-effects.js`, lignes 1-10 et 249 : testable en Node sans navigateur) exposant `create(win)`, `destroy()`, `seek(t)`, `play()`, `pause()`.
- Public : chargé en `defer` après `kw-effects.js` (`landing.ejs:44`), **seulement si la page contient des données motion-studio** (condition côté serveur pour que les pages sans motion n'aient aucun surcoût).
- Canevas : `setupCanvas()` (`PB:5493`) l'initialise dans `frame.contentWindow` en mode « éditeur » (pas de déclencheurs réels, `seek()` piloté par la timeline) ; ré-initialisation après `reloadCanvas`/`patchCanvas`.
- Bibliothèques lourdes : chargement à la demande avec le patron de `landing.js:468-480`, mais avec `asset()` pour l'empreinte et ajout à `ALLOW` de `src/perfEngine/minify.js:11` pour le fichier maison.
- Mouvement réduit : appliquer les trois niveaux de `data-kw-anim-rm` (`fade`, `none`) et `data-kw-motion-always` pour rester cohérent avec le moteur actuel.

### 19.4 Principes de compatibilité à respecter

1. Réutiliser `change()` et `setMotion`-like (`PBE:45`) pour que tout passe par l'historique.
2. Réutiliser le registre `motion.js` pour les images-clés d'entrée ; ne pas créer un second registre d'animations.
3. Ne jamais accepter de CSS libre ni de JS saisi : données bornées + code Kolakisa.
4. Garder `--kw-tf` et les propriétés individuelles : pas de `transform` direct sur la racine d'un nœud.
5. Chaque nouveau champ : bornes, valeur par défaut, `where` dans le message d'erreur, test dans le style de `tests/moteur-mouvement.test.js`.

---

## 20. Points de blocage

1. **Aucun runtime de mouvement dans le canevas** (`landing.js:117`, `kw-effects.js:241`, `lottie.ejs`) : la prévisualisation d'une timeline demande un nouveau module injecté dans l'iframe et son cycle de vie.
2. **Médiathèque : fichiers `.json/.lottie/.riv/.glb/.wasm` refusés** (`media/index.js:31-98`). Sans nouveau type de média, aucun composant Lottie/Rive/3D ne peut être alimenté depuis l'interface.
3. **`normalizeNode` supprime toute clé inconnue** (`nodes.js:1761-1860`) : rien de nouveau n'est enregistré avant d'être déclaré.
4. **Pas de version de schéma pour `motion` ni pour le contenu de page** : il faut l'introduire dès la première version du Motion Studio.
5. **Plafonds de modèle** : 400 nœuds, profondeur 8, corps JSON de 1 Mo (`nodes.js:18-19`, `server.js:84`) ; les instantanés d'historique sont des copies JSON complètes (150).
6. **Pas de champ JSON/animation dans les widgets personnalisés** (`widgets/index.js:13`) : un éditeur de séquence demande un nouveau `kind` et un contrôle dans `PB`.
7. **Pas de CSP `script-src`** : pas un blocage technique, mais un risque de sécurité à ne pas aggraver (aucun JS saisi, moteurs vendorés sur l'origine).
8. **Tests navigateur non exécutables sans Playwright** (absent de `package.json`) : la vérification du rendu réel du mouvement ne peut pas être automatisée sur cette machine tant que Playwright et Chrome ne sont pas installés.
9. **Pas de séquencement multi-éléments** dans le modèle d'interactions (`IX_ACTIONS`, 6 interactions par élément, `nodes.js:1522-1528`) : une timeline est un concept nouveau, pas une extension de `interactions`.
10. **Pages d'éditeur monolithiques** : `page-builder.js` (8 683 lignes) et `landing.js` (un seul fichier pour tous les widgets) rendent les changements risqués ; privilégier des modules séparés.
11. **Cohabitation de deux systèmes de mouvement** : `kb-motion.js`/`kol-motion.js` (administration) et `landing.js`/`kw-effects.js` (pages publiées). Le Motion Studio doit n'utiliser que le second pour les pages, et le premier seulement pour le chrome de l'éditeur.
12. **Chemins de média non liés à l'organisation dans `imageUrl`** : à corriger ou contourner pour tout nouveau type de ressource.

## 21. Éléments non vérifiés (à lire ou tester avant de décider)

- Version exacte de `lottie_light.min.js` et poids/versions de GSAP, Rive, Three.js à vendorer.
- Balise CSP meta de `views/marketing-public/landing.ejs` et comportement du CDN de l'hébergeur sur les en-têtes.
- Type MIME servi pour `.wasm` et `.json` par `express.static`.
- Contenu de `src/marketing/migrations/` (procédure d'ajout de colonne), de `src/perfEngine/` hors `minify.js`, et de `docs/KOLAKISA_ADVANCED_PERFORMANCE_ENGINE.md` (budgets).
- Fichiers acceptés par l'éditeur de fichiers de thème (`cms-theme-files.js`).
- Comportement réel dans Chrome (aucun test exécuté).
- Support navigateur des animations pilotées par le défilement CSS natives.
- Contenu de `docs/motion-studio/WEB_MOTION_DESIGN_REFERENCE.md` et `WEB_MOTION_COMPONENTS_CATALOG.md` (présents, non audités).
