# Contrôles numériques de l'éditeur visuel (NumericControl)

Une seule infrastructure — `numericControl(config)` dans `public/js/page-builder.js` — pour tous les champs numériques de
l'éditeur de pages. Chaque champ n'est qu'une **configuration** de cette fonction.

## Architecture

```
numericControl(config)
  ├─ champ texte (jamais <input type=number> : sélection, copier-coller, saisie « 2rem » restent normaux)
  ├─ ▲▼ compacts (vrais boutons, nommés pour les lecteurs d'écran, hors tabulation : le clavier a les flèches)
  ├─ sélecteur d'unité (seulement les unités compatibles) ou unité fixe
  ├─ curseur (seulement où il apporte quelque chose)
  ├─ glissement horizontal sur le LIBELLÉ de la ligne
  └─ onCommit(nombre, unité, opts)  →  setStyle / setProp  →  change()  →  historique + enregistrement + rendu
```

| Option | Rôle |
|---|---|
| `min`, `max` | bornes (celles du serveur, `src/marketing/pages/nodes.js`) ; saisie hors bornes refusée avec la plage, ▲▼/curseur/glissement s'arrêtent à la borne |
| `step` | nombre ou fonction de l'unité (px, % : 1 ; em, rem, vw, vh : 0,1) |
| `precision`, `integer` | arrondi (0,01 pour l'opacité, entier pour z-index…) |
| `units`, `unit` | unités proposées / courante ; `inlineUnit` : l'unité se tape avec le nombre (cases de marge, barre contextuelle) |
| `staticUnit` | unité fixe affichée (ms, °, ×, 0 – 1…) |
| `allowEmpty` | vide = « hériter / retirer » (jamais `NaN`, `undefined` ni `null` dans le CSS) |
| `slider` | `[min, max]` ou fonction de l'unité ; absent = pas de curseur |
| `drag` | glissement sur le libellé (Maj ×10, Alt ÷10 ; 4 px = 1 pas) |
| `base` | valeur de départ quand le champ est vide et qu'il n'y a rien d'hérité |
| `live` | applique chaque frappe valide (panneau Réglages du site) |

Autour : `numField(label, cfg, isSet, onReset)` (ligne « libellé | valeur | ↺ »), `numberField(...)` (champ de contenu d'un widget),
registres `LENCFG` (longueurs), `NUMCFG` (nombres), `NUM` (bornes), `UNITS` (unités par propriété). Exposé à `page-builder-effects.js`
(`A.numField`) et `site-settings.js` (`window.KWNumeric.create`).

### Historique (annuler / rétablir) et performance

* Un clic ▲▼ ou une touche flèche = **une** étape d'annulation (26 → 25 → 24, annuler redonne 25, puis 24).
* Maintenir une flèche, déplacer le curseur ou glisser = **une** seule étape (même clé).
* Pendant un geste, le document n'est copié **qu'une fois** (`change()` ne prend plus d'instantané pour une modification de même clé) ;
  le glissement est limité à une application par image (`requestAnimationFrame`). L'inspecteur n'est pas redessiné pendant le geste
  (le focus est conservé) ; il l'est à la fin.
* Écran (ordinateur / tablette / mobile) : la valeur écrite est celle de l'écran affiché ; le champ vide montre la valeur héritée en
  grisé, ▲▼ en part ; ↺ efface la valeur propre à l'écran et rend l'héritage.

## Propriétés migrées

| Propriété | Composant avant | Contrôle | Pas | Min / max | Unités | Curseur | Glissement |
|---|---|---|---|---|---|---|---|
| fontSize | `lengthControl` + flèches seules | NumericControl | 1 (px) · 0,1 (em, rem, vw) | 1 / 9999 | px em rem vw | 8–120 px | oui |
| lineHeight | `numberControl` | NumericControl | 0,1 | 0,8 / 3 (serveur) | ×  | oui | oui |
| letterSpacing | `lengthControl` | NumericControl | 0,1 px · 0,01 em/rem | −100 / 100 | px em rem | non | oui |
| wordSpacing, textIndent (**nouveaux**) | — | NumericControl | 0,1 px · 1 | −100…100 · −999…999 | px em rem (+ %) | non | oui |
| width, height, min/max-width/height | `lengthControl` | NumericControl | 1 · 0,1 | 0 / 9999 | px % rem vw/vh auto | non | oui |
| margin ×4, padding ×4 | cases + flèches | NumericControl compact (`inlineUnit`) + unité commune + liaison 4 côtés | 1 · 0,1 | marge −9999 / 9999 ; intérieur 0 / 9999 | px % rem em (+ auto pour la marge) | non | non (cases trop petites : saisie, ▲▼ au survol, flèches) |
| gap, rowGap, columnGap | `lengthControl` | NumericControl | 1 · 0,1 | 0 / 9999 | px rem em % | oui : 0–100 px · 0–6 rem/em · 0–20 % (la saisie reste libre jusqu'à 9999 ; une valeur enregistrée hors plage n'est jamais ramenée dans la plage) | oui |
| borderWidth (+ 4 côtés), borderRadius (+ 4 coins) | `lengthControl` | NumericControl | 1 | 0 / 9999 | px (rayon : px % rem) | rayon : 0–100 px | oui |
| top / right / bottom / left | `lengthControl` | NumericControl | 1 · 0,1 | −9999 / 9999 | px % rem | non | oui |
| zIndex | `numberControl` | NumericControl | 1 | −100 / 9999 (élargi) | — | non | oui |
| opacity | `numberControl` (pas 0,05) | NumericControl | **0,01** | 0 / 1 | — | oui | oui |
| backdropBlur, transitionDuration | `numberControl` | NumericControl | 1 · 50 | 1–40 · 0–2000 | px · ms | non | oui |
| columns, gridRows, gridColumnSpan/Start/End, order, flexGrow/Shrink | `numberControl` | NumericControl | 1 · 0,1 | bornes du serveur | — | non | oui |
| Filtres (flou, luminosité, contraste, noir et blanc, saturation, sépia, teinte) | champs texte | NumericControl | 1 | 0–40 … 0–300 · −360–360 | px % ° | oui | oui |
| Ombre personnalisée (X, Y, flou, étendue) | champs texte | NumericControl | 1 | −100…200 | px | non | oui |
| Transformer : rotation, échelle, inclinaison X/Y | `numRow` | NumericControl | 1 · **0,01** (échelle) | −360/360 · 0,1/3 · −60/60 | ° × | rotation | oui |
| Transformer : décalage X / Y | champ texte + unité figée | NumericControl + sélecteur d'unité | 1 · 0,1 | ±9999 | px % rem | non | oui |
| Effets de défilement, intensité souris, distance d'épinglage | `numRow` | NumericControl | 1 | bornes du serveur | px % … | non | oui |
| Angle du dégradé | champ texte | NumericControl | 1 | 0 / 360 | ° | oui | oui |
| Largeur des colonnes (%) | `input type=number` | NumericControl | 1 | 5 / 95 | % | non | non |
| Champs numériques des widgets (valeur de la barre de progression, points de l'image…) | `textField type=number` | `numberField` (NumericControl) | 1 | selon le widget | % | progression | oui |
| Barre contextuelle (taille, interligne, arrondi, largeur…) | `ctxLength` | NumericControl compact | idem | idem | tapées avec le nombre | non | non |
| Réglages du site (tailles, rayons, largeurs…) | `input type=number` | NumericControl (`live`) | selon le champ | selon le champ | fixe | non | non |

## Volontairement non migrés

* **Opacité de la couleur** (`range` du sélecteur de couleur) : appartient au sélecteur de couleur (valeur hexadécimale à 8 chiffres).
* **Boutons « + / − » de Colonnes et Lignes d'une grille** : ajoutent ou retirent de vraies colonnes (opération sur la structure), pas une valeur.
* **Éditeurs d'e-mail, de modèles, de blog et d'automatisation** (`public/js/mk/*`, `blog-editor.js`, `automation-flow.js`) : autres éditeurs, autres modèles
  de données ; à traiter dans un lot séparé avec la même infrastructure.
* **Propriétés qui n'existent pas dans le modèle** : échelle X / Y séparées, contour (outline) — le modèle n'a qu'une échelle ; les ajouter
  demande une évolution du modèle côté serveur.
* **Home / End** : non interceptés (ils déplacent le curseur dans le texte, ce qui prime sur un saut au min/max).
* **CLAMP** : le serveur n'accepte que des longueurs simples (px, %, rem, em, vh, vw) ; `clamp()` demanderait un nouveau type de valeur.

## Tests

* `tests/controles-numeriques-navigateur.test.js` (jsdom) : saisie, ▲▼, flèches (Maj), unités (PX → REM relu dans le CSS publié), marges liées / déliées,
  dimensions, arrondi, opacité, rotation / échelle / décalage, écrans et ↺, annuler / rétablir (une étape par clic, une pour le curseur), glissement,
  rechargement, valeurs négatives / décimales / vides / très grandes, accessibilité.
* `tests/controles-numeriques-chrome.test.js` (vrai Chrome, Playwright) : vraie souris et vrai clavier (tout sélectionner, taper, Entrée, Maj + flèche,
  Retour arrière / Suppr dans le champ sans effacer l'élément), rendu réel (taille calculée = 2 rem), glissement à la souris, curseur.

## Apparence des curseurs

Un seul langage visuel pour tous les curseurs de l'éditeur de pages : `.pb-nc-range` (tous les contrôles numériques) et `.pb-cpop-range` (opacité d'une couleur),
dans `public/css/page-builder.css` (bloc « Curseurs »). Jetons : `--pb-slider-hit` (zone cliquable 16 px), `--pb-slider-track-height` (4 px), `--pb-slider-thumb-size` (12 px),
`--pb-slider-track-color` (= `--editor-border`), `--pb-slider-progress-color` et `--pb-slider-thumb-color` (= `--editor-accent`), `--pb-slider-thumb-ring` (= `--editor-panel`),
`--pb-slider-focus` (= `--editor-focus`) : ils suivent les thèmes clair et sombre. La partie parcourue est dessinée par `--pb-fill` (posée par `paintRange`, purement visuelle).
Survol : poignée ×1,15 ; appui : ×1,25 (transform seulement, 90 ms, supprimé avec « réduire les animations »).
Test : `tests/editeur-curseurs-apparence-navigateur.test.js` (jetons et règles ; Chrome ne lit pas le style calculé des pseudo-éléments internes d'un curseur).

## Flèches ▲▼ (toujours visibles)

Un seul composant (`numericControl`), deux dispositions : `.pb-len` (champ + ▲▼ + unité, presque tous les champs) et `.pb-boxcell` (cases d'espacement). Les ▲▼ sont **toujours visibles**,
dans le champ, entre la valeur et l'unité (avant : dans les cases d'espacement, elles n'apparaissaient qu'au survol ou au focus, en superposition de la valeur). La barre contextuelle sur le canevas n'a
volontairement pas de flèches (`hideSteps`). Jetons : `--pb-stepper-width` (14 px), `-color`, `-bg`, `-hover-bg`, `-hover-color`, `-active-bg`, `-divider` (dérivés des jetons `--editor-*`). Flèches dessinées en CSS
(même rendu partout), zone cliquable élargie par un pseudo-élément. Test : `tests/editeur-fleches-numeriques-navigateur.test.js`.

## Contrat d'un champ numérique (NumericInput) : « un clic = je veux saisir »

* **Focus** : le champ prend le focus et rien d'autre ne s'ouvre (pas de liste de valeurs, pas de menu, pas d'infobulle, pas de panneau flottant). L'autocomplétion du navigateur est coupée (`autocomplete="off"`).
* **Pas de `list` / `datalist`** : `numericControl` ne pose volontairement jamais l'attribut `list` (cause de l'ancien popup « 0px, 4px, 8px… » et de son triangle natif, qui venaient du `datalist` `pb-scale` branché sur les cases d'espacement et la barre contextuelle ; supprimé). Garde-fou CSS : `::-webkit-calendar-picker-indicator { display: none }`.
* **Actions explicites seulement** : ▲ / ▼ = pas ; clavier = saisie, flèches, Maj ×10, Alt ÷10 ; « PX ▾ » = menu des unités. Des préréglages éventuels devraient avoir leur propre bouton, jamais le simple focus.
* **Infobulles** : autorisées au survol AVANT toute interaction ; masquées dès le focus, le clic, la saisie, et tant que le champ est actif (`isEditing`, `focusin`, `keydown` dans `page-builder.js`).
* Test de référence : `tests/editeur-champ-numerique-contrat-navigateur.test.js`.
