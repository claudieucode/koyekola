# KOLAKISA — Manipulation directe : audit (LOT 0)

Date : 2026-10-10 · Périmètre : éditeur de pages (`public/js/page-builder.js`, 6 728 lignes, JavaScript sans framework ; `public/css/page-builder.css` ; `public/css/landing.css` pour le style DANS le canevas ; `public/js/page-builder-snap.js` ; `public/js/page-builder-rules.js` ; `src/marketing/pages/nodes.js` côté serveur).
Rien n'a été modifié dans le code pour cet audit. Tout ce qui est écrit ici a été lu dans le code ou mesuré ; ce qui est une hypothèse est signalé « hypothèse ».
**Important : il n'y a pas de React.** Les notions « composant », « rerender », « arbre React » de la mission se traduisent ici en : fonctions de rendu (`renderInspector`, `renderTree`, `drawOverlays`), DOM créé à la main, et iframe du canevas.

## 1. Architecture du canevas
- Le canevas est une **iframe** (`[data-pb-frame]`) posée dans `.pb-frame-wrap`, qui porte le zoom (`transform: scale()` + marges). Le contenu de l'iframe est le **vrai rendu serveur** de la page (`POST …/rendu`), pas une copie interne.
- Mise à jour : `renderCanvas()` envoie le document, le serveur le rend, puis `patchCanvas()` remplace **en place** les sections modifiées (feuilles `<style>` comprises). Si une section est interactive (onglets, accordéon, compteur…) : `reloadCanvas()` charge un nouveau cadre masqué et l'échange (double tampon). Le document de l'iframe, ses écouteurs et son défilement restent en place le reste du temps.
- `setupCanvas(y)` (re)branche les écouteurs dans le document de l'iframe après un rechargement complet.

## 2. Sélection
- `selection` = tableau d'identifiants ; `select(id, additive, opts)` ; l'élément du canevas reçoit `.is-selected` (contour de 2 px, `landing.css`) ; `markCanvasSelection()`.
- Surcouche : boîte `.pb-sel-box` et pastille `.pb-sel-badge` (nom · largeur × hauteur) dessinées par `drawOverlays()`. La boîte du **parent** (`.pb-parent-box`) est aussi dessinée.
- La sélection se fait au clic (`targetOf` : plus proche `[data-node-id],[data-section-id]` depuis la cible du clic). Pas de logique de « meilleure cible » à la profondeur.

## 3. Architecture des overlays
- Tous les overlays sont **des éléments ajoutés dans le `<body>` de l'iframe** (`.pb-sel-box`, `.pb-sel-badge`, `.pb-parent-box`, `.pb-handle`, `.pb-dim`, `.pb-col-split`, `.pb-struct-add`, couche `.pb-smart-layer`, règles et guides). Ils sont positionnés en **coordonnées de page** (`pageRect(el)` = rectangle + défilement) : le zoom est donc géré par la transformation du conteneur, sans calcul supplémentaire.
- `drawOverlays()` **supprime puis recrée** tous ces éléments à chaque appel. Il est appelé à la sélection, au défilement du canevas, au redimensionnement, après un rendu, au zoom. C'est simple et fiable, mais ce n'est pas une couche persistante.
- La barre d'actions `.pb-cbar` est dans le **document parent** (position `fixed`), placée par `placeCanvasBar()`.
- Hors flux : les overlays sont en `position: absolute` dans le body de l'iframe ; ils ne changent pas la mise en page de la page (à confirmer par test à l'étape LOT 2 : hypothèse, car je n'ai pas mesuré l'effet sur des pages `body { position: relative }`).

## 4. Modèle de widget
- Document = `content.sections[]` ; nœud = `{ id, type, props, styles: { desktop, tablet, mobile }, states, children, hidden, locked, interactions, motion, … }`.
- **86 types** côté serveur (`NODE_TYPES`), **86 propriétés de style** (`STYLE_PROPS`, `nodes.js`) avec validation et sortie CSS côté serveur (`check`, `out`). Les valeurs de longueur acceptent des références `token:space-*` (valeurs globales du site).
- `gap`, `rowGap` et `columnGap` sont des **styles** (`styles[écran].gap`…), groupe « layout », unités `px, rem, em, %`. Le conteneur neuf est créé avec `gap: 20px` (`nodes.js`, `container.blank`).

## 5. Moteur de propriétés (source de vérité)
- Écriture : `setStyles(ids, map, {key, light})` → `change()` → `styleSet(it, device, état, create)` + `cleanStyles(it)`. Lecture : `ownValue` (valeur de l'écran et de l'état affichés), `inheritedValue` (cascade ordinateur → tablette → mobile), `valueOf`.
- Le **redimensionnement direct existant** écrit par le même chemin : `styleSet(byId(id), device, "normal", true)` puis `change()` (une seule étape d'historique).
- Les contrôles de l'inspecteur et le canevas lisent donc déjà la même donnée : il n'y a pas de seconde source à éviter, il faut juste ne pas en créer une.

## 6. Inspecteur
- `renderInspector()` reconstruit le panneau à chaque sélection ; les contrôles numériques communs (`numericControl`) lisent et écrivent via `setStyles`. `INSPECTORS` (71 entrées explicites, les autres types utilisent un défaut) déclare **par type** les groupes de réglages disponibles : c'est de fait une **déclaration de capacités**.
- Les accordéons suivent un moteur commun (`accordion-engine.js`, mode un seul ouvert / plusieurs / en dessous).

## 7. Glisser-déposer
- HTML5 natif : `dragstart` / `dragover` / `drop` sur le document de l'iframe et sur l'arbre des calques ; `draggable` posé sur l'élément déjà sélectionné ; `draggableSource` pour la palette ; `dragIds` / `dragNew`. Un trait d'insertion est dessiné pendant le survol.
- Distinction poignée / élément : `e.target.closest(".pb-handle")` est testé avant de démarrer un déplacement, ce qui évite de confondre les deux.

## 8. Zoom
- `zoom` (variable), **bornée entre 0,25 et 2 (25 % à 200 %)** (`setZoom`, `applyZoom`). Modes : ajuster à la fenêtre, 100 %, ±10 %. Boutons en bas à droite (`[data-pb-zoom]`). Aucun écouteur `wheel` ni geste de pincement.
- **Conséquence : les tests 300 % et 400 % de la mission ne sont pas possibles aujourd'hui** (limite de 200 %).

## 9. Défilement
- Le document de l'iframe défile (`win.scrollTo`) ; l'horizontal passe par `stage.scrollLeft`. Les overlays redessinent au défilement.

## 10–12. Règles, guides, magnétisme
- `page-builder-snap.js` (`KWSnap`) : calculs purs (préférences, unités px/%/rem/em/vw/vh, grille libre/web, candidats d'accrochage). `page-builder.js` : `snapEnv(el)`, `snapEdge`, `guideSnap`, `drawSnapHit`, `drawDistances`, `smartClear`, `drawRulers`, `drawGuides`. Préférences d'interface (jamais dans le contenu). `Alt` pendant un geste = mouvement libre.
- Le redimensionnement actuel s'en sert déjà (arêtes droite/bas, repères, distances).

## 13. Responsive
- `device` (« desktop », « tablet », « mobile ») = écran **affiché ET modifié**. Tout geste écrit dans `styles[device]`. Les points de rupture viennent de la page (`boot.page.breakpoints`). Le redimensionnement direct affiche : « Dimensions enregistrées pour l'écran « … » ».

## 14. Annuler / rétablir
- `change(fn, {key, light, label})` : instantané JSON complet du document (150 étapes) ; **même `key` = même étape** (frappes, curseurs, glissements). Un geste complet = une étape. Le redimensionnement fait un seul `change` au relâchement.

## 15. Sauvegarde
- `scheduleSave` : 1 s après la dernière modification, une sauvegarde à la fois (`PUT …/brouillon`), copie locale de secours. Pendant un geste (`gesture = true`) le rendu serveur est différé (`pendingRender`).

## 16. Actions au survol existantes
- **Aucun survol géré en JavaScript.** Seul retour : un contour pointillé en CSS (`.lp-builder .kw-node:hover`, `landing.css`) et les zones vides `.kw-is-empty` (contour, « + » au centre).

## 17. Barre d'actions contextuelle existante
- `.pb-cbar` + **registre extensible** : `CANVAS_ACTIONS` (parent, déplacer, modifier, remplacer, recadrer, réglages, colonnes, grille, ajouter, dupliquer, masquer, verrouiller, supprimer, plus) ; `TYPE_ACTIONS` (actions propres à chaque type) ; `canvasActionsFor(items)`. Elle apparaît à la **sélection**, pas au survol. Les actions appellent les fonctions existantes (`duplicateSelected`, `removeSelected`…).

## 18. Pan (main)
- Outil « Main » (touche **H**) dans la colonne d'outils de gauche (`setTool("hand")`, classe `pb-hand`) ; `panStart()` fait défiler le document et `stage.scrollLeft` à la souris. **Il n'y a pas de main temporaire avec Espace**, ni d'icône près du zoom. L'Espace n'est utilisé que pour activer des boutons (zoom, menus).
- Les gestes du canevas utilisent des **événements souris** (`mousedown/move/up`), pas les événements `pointer` : aucun support tactile du canevas (hypothèse confirmée par lecture : seuls certains contrôles de l'inspecteur utilisent `pointer`).

## 19. Ce qui existe déjà pour les gestes
| Geste | Existe ? | Où |
|---|---|---|
| Redimensionner (largeur, hauteur, coin) | Oui | `resizeStart` : poignées e / s / se, accrochage, mesure de la mise en page, pas de `n` / `w` |
| Largeur des colonnes à la souris | Oui | `columnSplitStart` (`.pb-col-split`) |
| Ajouter colonne / ligne d'une grille | Oui | `.pb-struct-add` |
| Déplacer / réordonner | Oui | glisser-déposer natif |
| Édition de texte dans la page | Oui | `startEdit`, double-clic, Entrée |
| Gap (écart) à la souris | **Non** | |
| Padding / marge à la souris | **Non** | |
| Survol avec barre d'actions | **Non** | |
| Main temporaire (Espace) | **Non** | |
| Zoom au-delà de 200 % | **Non** | |
