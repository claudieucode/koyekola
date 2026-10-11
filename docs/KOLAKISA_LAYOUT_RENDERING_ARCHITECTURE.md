# Architecture du moteur de mise en page et de rendu

## Vue d'ensemble (existant, inchangé sauf l'aperçu)

```
Document (arbre d'éléments typés : section → conteneurs → widgets)
   styles[écran]  : desktop · wide (≥1920) · tablet (≤1023) · mobile (≤767)      states[état] : hover · focus · active
        │  normalizeStyles → STYLE_PROPS[clé].check   (valeur validée ou refus 422)
        ▼
pageCss(sections)  →  règles « .kw-n-<id>{…} » ; @media par écran, dans l'ordre desktop → wide → tablet → mobile ; états après
        │                         (UN générateur pour le canevas ET la page publiée)
        ▼
Gabarits _sections.ejs / _node.ejs  (isBuilder : identifiants de sélection, éléments masqués en transparence, zone d'édition des conteneurs vides)
        ├─ canevas : iframe patchée en place (patchCanvas), aperçu immédiat (previewStyles) avant le rendu
        └─ publié  : /p/<slug>
```

## Règles qui rendent le résultat prévisible

* **Un réglage = une déclaration** ; placement en grille écrit en une seule déclaration `grid-column: début / fin` ; coins après l'arrondi général ; épaisseurs par côté après l'épaisseur générale ; `transition-timing-function` après `transition`.
* **Absent ≠ écrasant** : une clé absente n'écrit rien (l'héritage et le thème s'appliquent).
* **Écran** : une valeur n'apparaît que dans le `@media` de son écran ; l'héritage descend desktop → wide (wide hérite de l'ordinateur, pas de la tablette) / tablet → mobile.
* **Grille** : sans réglage propre, 2 colonnes maximum sur tablette et 1 sur mobile (règle de `pageCss`, aussi reflétée par `inheritedValue` côté éditeur).
* **Conteneur vide** : zone d'édition réelle (canevas seulement).

## Aperçu immédiat (évolution de cette mission)

`previewStyles(ids, map)` pose la valeur en style en ligne sur l'élément du canevas dès le choix. Conditions : état « normal », élément lui-même (pas une partie de widget), valeur exactement celle que le serveur écrira. Deux familles : `PREVIEW` (nombres, longueurs, couleurs littérales) et **`PREVIEW_ENUM`** (24 listes de mise en page et de texte, valeur validée contre les options du modèle). `clearPreviews` retire les styles en ligne quand le rendu serveur remplace la page : le CSS généré prend le relais, identique.

## Ce qui est volontairement différent dans le canevas

Curseur, contour de sélection, transitions de l'éditeur ; zone d'édition du conteneur vide ; éléments masqués visibles en transparence **et présents dans la mise en page** ; sections interactives (onglets, carrousels) rendues comme conteneurs ordinaires pour rester modifiables.
