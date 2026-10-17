# KOLAKISA — Manipulation directe : architecture (LOT 1) — IMPLÉMENTÉE le 2026-10-10

État : implémentée dans `public/js/page-builder-direct.js` (+ pont dans `page-builder.js`, styles dans `landing.css`). Écarts par rapport à la proposition : la couche de survol est persistante, mais les poignées d'écart / de marge intérieure sont recréées à chaque rafraîchissement de la sélection (≤ 16 petits éléments, coût mesuré < 0,2 ms) ; les poignées existantes (`mousedown`) n'ont pas été migrées vers `pointer`. Principe directeur : **ne rien dupliquer**. Chaque brique ci-dessous réutilise un système déjà présent (voir `KOLAKISA_DIRECT_MANIPULATION_AUDIT.md`).

## 1. Principe : une seule écriture, deux interfaces
```
Poignée du canevas ─┐                          ┌─> inspecteur (relu à la fin du geste)
                    ├─> setStyles(ids, map, {key}) ─> change() ─> historique + sauvegarde
Champ de l'inspecteur ┘        │
                               └─> styleSet(it, device, état) = styles[écran] du nœud  (UNE seule donnée)
```
- Aucun état parallèle : pendant le geste, le canevas est mis à jour **localement** (style inline sur l'élément, comme le redimensionnement actuel) ; au relâchement, **un seul** `setStyles` avec une clé de transaction stable (`"direct:gap:<id>:<écran>"`) enregistre la valeur. L'inspecteur se redessine à ce moment (comme aujourd'hui pour le redimensionnement).
- Annuler / rétablir : une étape par geste, étiquetée (« Écart : 24 px → 28 px »), grâce à l'option `label` de `change()`.
- Sauvegarde : inchangée (1 s après la dernière étape) ; **aucune écriture pendant le geste** (`gesture = true` suspend déjà le rendu serveur).

## 2. Module proposé (sans framework, comme le reste)
Nouveau fichier `public/js/page-builder-direct.js`, chargé après `page-builder.js`, qui n'expose qu'une petite API déclarative. Il **ne possède aucune donnée** ; il consomme les fonctions déjà présentes (via un pont `window.pbDirect = {…}`, sur le modèle de `window.pbNav` et `window.pbRules`).

| Brique | Rôle | Réutilise |
|---|---|---|
| Couche d'overlay persistante | Un conteneur unique dans le document de l'iframe (`.pb-direct-layer`, hors flux, `pointer-events: none`), des éléments **créés une fois** puis déplacés (`transform`) | Les overlays actuels sont recréés à chaque appel de `drawOverlays()` : la couche persistante évite ce coût pour le survol |
| Cible de survol | Un seul écouteur `pointermove` sur le document de l'iframe, une mesure par image (`requestAnimationFrame`) : `elementFromPoint` → `closest([data-node-id])` → cible la plus **profonde** | `targetOf`, `pageRect` |
| Registre de contrôles | `DIRECT_CONTROLS = { gap: {…}, padding: {…}, resize: {…} }` ; chacun déclare `appliesTo(item)`, `handles(item, rect)`, `read(item)`, `write(item, value)` | `INSPECTORS[type].groups` (déjà la liste des réglages possibles par type), `TYPE_ACTIONS` (modèle de registre) |
| Barre au survol | Même barre `.pb-cbar` (registre `CANVAS_ACTIONS`), affichée aussi à la cible survolée, sans nouvelle action | `canvasActionsFor`, `placeCanvasBar` |
| Accrochage | `snapEnv` / `snapEdge` / `drawSnapHit` pour les poignées qui déplacent un bord ; rien pour le gap (valeur, pas position) | `KWSnap` |
| Unités | `splitLen`, `parseLength`, `unitsOf(key)` : la valeur et l'unité existantes sont conservées ; les unités proposées sont celles que le moteur accepte pour la propriété (gap : px, rem, em, %) | existant |
| Responsive | `device` + `inheritedValue` : lecture de la valeur effective, écriture dans l'écran affiché uniquement ; si la valeur est héritée, afficher « hérité : 24 px » et créer un remplacement à la première modification | `styleSet(it, device, …, true)` |
| Capacités | Aucune nouvelle donnée serveur : `INSPECTORS[type].groups.layout` contient `gap` / `rowGap` / `columnGap`, `groups.spacing`, `groups.size`… | existant |

## 3. Couches (z-index)
Ordre proposé, **dans le document de l'iframe** : contenu de la page < contour de sélection < contour de survol < poignées < aperçu de geste (`.pb-dim`, repères d'accrochage). La barre d'actions reste dans le document parent (déjà au-dessus). Les valeurs actuelles des overlays (`.pb-handle`, `.pb-sel-box`…) seront relevées avant de choisir les nouveaux niveaux, pour ne pas créer de concurrence.

## 4. Pointer events
- Nouvelles poignées : événements **`pointer`** (souris + tactile) avec `setPointerCapture`, nettoyage à `pointerup` / `pointercancel`. Les poignées existantes (`mousedown`) ne sont pas migrées dans un premier temps (risque de régression) ; elles le seront seulement si le tactile est demandé.
- Distinction poignée / élément : la règle existante (`closest(".pb-handle")` testé avant le glisser-déposer) est étendue à `.pb-direct-handle`.
- Priorité de clic : geste actif > poignée > barre > sélection > contenu (un clic sur une poignée n'atteint jamais l'élément en dessous : `stopPropagation` sur la poignée, déjà pratiqué par `.pb-struct-add`).

## 5. Pan (outil Main) et Espace
- Réutiliser `panStart` ; ajouter (a) une icône « Main » à côté des boutons de zoom (même état que l'outil H), (b) **Espace maintenu = main temporaire** : `keydown`/`keyup` sur le document **et** sur le document de l'iframe, avec garde : ignoré si la cible est `input`, `textarea`, `select`, contenteditable, si un `dialog[open]` ou un menu est ouvert, si la palette est ouverte, si `editing` est vrai, ou si `e.repeat`. Au relâchement, retour à l'outil précédent (`tool` mémorisé).
- Curseur : `grab` avant, `grabbing` pendant (la classe `pb-hand` existe).
- Décision à prendre : la limite de **zoom à 200 %** (ne permet pas les tests à 300 % et 400 %) ; élargir la limite change `applyZoom` et la taille de l'iframe (risque de lenteur à 400 %, à mesurer avant).

## 6. Performance (règles d'implémentation)
- Lire puis écrire : une mesure du DOM par image, au début de l'image, jamais dans la boucle d'écriture.
- Pendant un geste : écriture d'un seul style inline sur l'élément et d'un `transform` sur la poignée ; pas de rendu serveur, pas de `change()`, pas de reconstruction de l'inspecteur.
- Survol : aucun listener global ajouté, aucun `ResizeObserver` (les rectangles sont relus au survol et à la sélection ; le zoom et le défilement redessinent déjà les overlays).
- Budgets à fixer **après mesure** dans le LOT 2 (voir `KOLAKISA_CANVAS_INTERACTION_PERFORMANCE.md`).

## 7. Ce que cette architecture ne fait PAS
Elle ne remplace ni l'inspecteur, ni `drawOverlays()` pour la sélection, ni le glisser-déposer natif, ni le redimensionnement actuel ; elle n'ajoute aucune donnée au document ni aucune propriété serveur.


## 8. Réalisé (résumé)
- `pbDirect.register({ id, appliesTo(item, caps), handles(ctx) })` : deux contrôles livrés, `gap` (écart : `gap`, `rowGap`, `columnGap` ; 8 types) et `padding` (marge intérieure des 7 types conteneurs).
- Écriture unique : style inline pendant le geste, puis un seul `change()` avec clé unique par geste et libellé « Écart vertical : 24px → 32px » ; écran affiché uniquement ; valeur héritée annoncée.
- Unités : px, rem, em conservées (conversion fiable) ; %, vw, vh et valeurs du site → px (annoncé : « Unité : px »).
- Aimantation douce sur le pas de grille des réglages (± 3 px), désactivée par Alt ; Maj sur une poignée de marge = quatre côtés ; Échap annule ; flèches sur une poignée focalisée (±1, Maj ±10).
- Survol : une seule cible (la plus profonde), contour + petite barre à l'intérieur du coin haut gauche (Sélectionner, Style, Dupliquer : fonctions existantes). Le contour pointillé natif de tous les parents est supprimé.
- Main temporaire : Espace maintenu (ignoré dans les champs, boutons, menus, fenêtres, édition de texte), icône « Main » près du zoom, panoramique aussi depuis la zone grise ; curseur `grab` / `grabbing`.
- Zoom : limite portée de 200 % à 400 % (niveaux 300 % et 400 % ajoutés au menu).
- NON réalisé volontairement : marge extérieure directe (chevauche la mise en page du parent), poignées de redimensionnement haut / gauche (changeraient la position du bord dans un flux flex/grille), recadrage direct d'image, mini-barre typographique : voir `KOLAKISA_DIRECT_CONTROL_MATRIX.md`.
