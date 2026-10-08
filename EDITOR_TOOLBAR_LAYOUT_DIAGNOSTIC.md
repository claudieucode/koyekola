# Diagnostic — la barre verticale d'icônes de l'éditeur de scénarios déborde quand elle est repliée

Mesuré dans un vrai Chrome (Playwright), fenêtre 1600 × 900, scénario avec 3 étapes sur le canevas, `getBoundingClientRect()` en coordonnées de page.
Aucun code n'a été modifié avant cette mesure. Scripts : `forensic.js`, `paint.js` (dossier de travail de la session).

## 0. Constat préalable (pourquoi « le bug persiste »)

La première correction (commit `5798800`, branche `barre-icones`) **n'était intégrée nulle part** : ni dans la copie que vous lancez
(`~/ClaudeProjects/KOYEKOLA`, branche `main`, `public/css/marketing.css` ligne 592 : `.is-palette-collapsed .mk-flow-pal { overflow: visible; }`),
ni sur le site en ligne (le `marketing.css` servi par kolakisa.com contient toujours cette règle). Le bug que vous voyez est donc **le bug d'origine, intact**.
La même mesure sur la branche corrigée donne un résultat conforme (voir §13).

## 1. Élément responsable

`aside#au-palette.mk-flow-pal` (la barre) et surtout son corps `div#au-pal-body.mk-pal-body`, qui contient 8 `.mk-pal-group` (`ul.mk-pal-list`)
et 24 `button.mk-pal-item`. Une seule palette dans le DOM (pas de doublon expanded/collapsed : même 24 boutons, repliés par CSS ; `display: none` sur les textes,
pas `opacity: 0`).

## 2. Parent responsable

`div#au-workspace.mk-flow-workspace` : grille à 2 colonnes (`var(--pal-w)` | `minmax(0,1fr)`), `align-items: stretch`. Elle ne coupe rien : c'est la barre
elle-même qui doit contenir ses icônes. Aucun transform, `contain`, `isolation` ni `will-change` sur la barre, le workspace, le shell ni `main` (tous `none`) :
le contexte de positionnement est le flux normal.

## 3. Première icône qui déborde

Replié : l'icône **n° 11 `add_tag`** (« Ajouter une étiquette ») — `top 1005,6 / bottom 1045,6`, alors que la barre se termine à `bottom 1027,6` : elle
**enjambe le bord bas de la barre**. L'icône **n° 12 `remove_tag`** (`top 1047,6`) est la première entièrement dehors : son haut tombe exactement
au haut de « Contrôle avant activation » (`top 1047,6`). Au total 13 des 24 icônes sont hors de la barre (n° 11 à 23, dernière : `end` à `bottom 1588,6`).

## 4-6. Boîtes (px de page)

| Élément | État développé | État replié |
|---|---|---|
| Barre `#au-palette` | top 387,6 · bottom 1027,6 · h 640 · w 252 | top 387,6 · bottom 1027,6 · h 640 · **w 60** |
| Corps `#au-pal-body` | top 472,1 · bottom 1026,6 · h 554,5 | top 481,6 · bottom 1026,6 · h 545 |
| Canevas `#au-flow` | top 387,6 · bottom 1027,6 · left 628 · w 932 | top 387,6 · bottom 1027,6 · left 436 · w 1124 |
| « Contrôle avant activation » | top 1047,6 · bottom 1254,5 | idem (ne bouge pas) |
| « Actions » | top 1274,5 · bottom 1394,1 | idem |
| « Statistiques » | top 1414,1 · bottom 1852,4 | idem |
| Icône n° 0 `trigger` | top 491,6 | top 491,6 |
| Icône n° 11 `add_tag` (1re qui sort) | — | **top 1005,6 · bottom 1045,6** · x 368 · w 44 · h 40 |
| Icône n° 12 `remove_tag` | top 1047,6 (développé : 1028,8–1077,9, **coupée**) | top 1047,6 · bottom 1087,6 |
| Icône n° 23 `end` | coupée par le défilement | top 1548,6 · bottom 1588,6 |

La hauteur de la barre (640), sa position et celles des cartes **ne changent pas** entre les deux états : seule la largeur change (252 → 60).
Ce qui change est ce qu'il advient du contenu qui dépasse.

## 7-10. CSS responsable

* `marketing.css` ligne 559 : `.mk-flow-pal { height: calc(100dvh - 260px); min-height: 520px; overflow: hidden; }` → hauteur **fixe** (640 px ici), contenu plus haut.
* ligne 568 : `.mk-pal-body { flex: 1; min-height: 0; overflow-y: auto; }` → développé, le corps a un défilement interne : `scrollHeight 2105` pour `clientHeight 555`, le surplus est coupé (aucun débordement visible).
* **ligne 592 : `.is-palette-collapsed .mk-flow-pal { overflow: visible; }`** et **ligne 595 : `.is-palette-collapsed .mk-pal-body { padding: 8px 0; overflow: visible; }`** → replié, plus aucune coupure : `scrollHeight 1107` pour `clientHeight 545`, soit **562 px de contenu en trop** qui se répartissent hors de la barre.
  Ces deux lignes existent pour que les infobulles (`::after` en `position: absolute; left: calc(100% + 10px)`, ligne 599) puissent sortir de la barre de 60 px.
* Chaîne des parents de la dernière icône (replié, avant correction), tous `overflow: visible`, `z-index: auto`, `transform/contain/isolation: none` :
  `button.mk-pal-item` (40) → `li` → `ul#au-pal-fin` → `section.mk-pal-group` → **`div.mk-pal-groups` (1097 px)** → **`div#au-pal-body` (545 px)** → `aside#au-palette` (640 px).
  Un enfant de 1097 px dans un parent de 545 px, sans aucun ancêtre qui coupe : c'est le débordement, mesuré.
* Aucun `position:absolute/fixed/sticky` ne porte sur les icônes : seules les `::after` (pastille de connexion, infobulle) sont `absolute`. Les 24 boutons sont `position: relative` (ligne 579, nécessaire à leur pastille et à leur infobulle), dans un flux `flex-direction: column`. Ce n'est donc **pas** un problème de coordonnées : les icônes sont à leur place **dans le flux** ; c'est le flux qui est plus haut que la barre.
* Ni Grid, ni flex ne compressent quoi que ce soit : `flex-shrink` n'agit pas (le corps a `min-height: 0`), la cellule de grille fait 640 px parce que la barre l'impose.
* Transition : la seule (`.mk-flow-pal` en petit écran, `transform`) est limitée au tiroir mobile ; le bug apparaît à l'état stable, pas pendant une animation.
* JS : `src/editor/automation/palette.js` `setCollapsed()` ne fait que basculer la classe `is-palette-collapsed` sur `#au-workspace` et émettre `resize`. Aucun calcul de position.

## 11. Pourquoi les icônes passent AU-DESSUS des cartes

Mesuré avec `document.elementFromPoint()` au centre de chaque icône fautive, page défilée à 900 px :

| Icône | Centre (y de page) | Carte située là | Élément visible au point |
|---|---|---|---|
| remove_tag | 1068 | Contrôle avant activation | **l'icône** |
| add_to_list | 1110 | Contrôle avant activation | **l'icône** |
| remove_from_list | 1152 | Contrôle avant activation | **l'icône** |
| copy_field | 1194 | Contrôle avant activation | **l'icône** |
| set_date | 1236 | Contrôle avant activation | **l'icône** |
| calculate | 1278 | Actions | **l'icône** |

Les icônes sont `position: relative` (positionnées) ; les cartes `section.mk-panel` sont `position: static`. Dans un même contexte d'empilement, un élément
positionné se peint **au-dessus** d'un élément non positionné, quel que soit l'ordre du document. Le z-index n'est pas en cause (`z-index: auto`) ; il n'y a pas non plus de contexte d'empilement
qui les isole : rien ne les arrête, car plus aucun ancêtre ne coupe (`overflow: visible` sur le corps, la barre, le workspace, le canevas et `main`).

## 12. Cause racine

Une barre à **hauteur fixe** contenant une liste plus haute qu'elle, dont le **seul garde-fou (le défilement interne) est supprimé à l'état replié**
(`overflow: visible` ×2), pour des infobulles. Les 13 icônes en trop se peignent donc, intactes et cliquables, sur les cartes situées dessous.
Le premier élément hors de son conteneur est l'icône n° 11 ; tout ce qui suit est la même cause.

**Pourquoi seulement replié :** développé, `.mk-pal-body` garde `overflow-y: auto` (le même surplus existe : 2105 px pour 555 px) ; replié, il est surchargé en `visible`.

**Pourquoi « les corrections précédentes n'ont pas fonctionné » :** la correction écrite (retrait des deux `overflow: visible`, défilement interne conservé,
infobulles en `position: fixed`) n'a jamais été fusionnée dans votre arbre de travail ni déployée (§0). Votre navigateur sert donc l'ancien CSS.

## 13. Correction (structurelle, déjà écrite, commit `5798800`)

1. `marketing.css` : suppression des deux `overflow: visible` repliés → la barre garde sa frontière physique et le défilement interne du corps (`overflow-y: auto`, `overflow-x: hidden`).
2. Infobulles : `::after` passe de `position: absolute` à `position: fixed`, avec `left: calc(var(--tip-x) + 10px)` et `top: var(--tip-y)` ; `palette.js` lit le bord droit et le milieu vertical de l'icône survolée ou focalisée (`getBoundingClientRect`) et les pose en variables CSS. Une infobulle `fixed` n'est coupée par aucun `overflow` d'ancêtre (aucun transform ne l'en empêche).
3. Aucune coordonnée par icône, aucun z-index, aucun `overflow: hidden` posé pour cacher : la liste défile dans la barre.

Mesure sur la branche corrigée (même scénario, mêmes états) : corps `overflow-y: auto`, barre `overflow: hidden`, `scrollHeight 1115 / clientHeight 545` ; toutes les icônes dans la barre
sont celles que `elementFromPoint` renvoie ; celles qui dépassent sont **coupées** (invisibles hors de la barre) ; hauteur, position et largeur (252 / 60) identiques à l'état de référence ; cartes inchangées.
Test : `tests/automatisations-barre-navigateur.test.js` — 10 échecs sur le code d'avant, 12 succès après.
