# KOLAKISA — Manipulation directe : matrice des contrôles (LOT 0)

Source : `INSPECTORS` (71 entrées explicites sur 86 types) lu dans `page-builder.js`, plus les registres `TYPE_ACTIONS` / `CANVAS_ACTIONS`. « Possible » = la propriété existe dans l'inspecteur pour ce type ; « Existant » = déjà manipulable à la souris sur le canevas.

## Capacités réellement déclarées (comptées dans le code)
| Capacité | Types concernés | Nombre |
|---|---|---|
| **Gap / écart** (`gap`, `rowGap`, `columnGap`) | section, container, columns, column, stack, group, grid, gallery | **8** |
| Padding / marge (groupe « spacing ») | presque tous | 68 sur 71 |
| Dimensions complètes (largeur, hauteur, min, max) | section, container, columns, column, stack, group, grid, image, form, legacy | 10 |
| Largeur seulement (`width / minWidth / maxWidth`) | texte, titre, bouton, vidéo, etc. | 49 |
| Aucune dimension | badge, infobulle, boutons de partage, réseaux, modale, lien, logo du site, progression de lecture, notation, ancre de menu, ajout au panier, composant | 12 |
| États (survol, actif…) | boutons, liens, conteneurs, images… | 15 |

## Contrôles par type
| Type d'élément | Taille | Gap | Padding | Marge | Aligner | Édition directe | Actions rapides existantes |
|---|---|---|---|---|---|---|---|
| section | Existant (e, s, se) | Possible | Possible | Possible | Possible | — | parent, ajouter, dupliquer, masquer, verrouiller… |
| container / column / stack / group | Existant | **Possible (priorité 1)** | Possible | Possible | Possible (flex) | — | + « ajouter à l'intérieur » |
| columns | Existant | Possible | Possible | Possible | Possible | — | + colonnes, séparateurs de largeur (**existant**) |
| grid | Existant | Possible (ligne et colonne) | Possible | Possible | Possible | — | + ligne, colonne (**existant**) |
| gallery | Largeur | Possible | Possible | Possible | — | — | réglages |
| image | Existant (largeur + hauteur) | — | Possible | Possible | Possible | — | remplacer, recadrer (**existant**, ouvre l'inspecteur) |
| titre, texte, citation | Largeur | — | Possible | Possible | Possible | **Existant** (double-clic, Entrée) | modifier |
| bouton, lien | Largeur (bouton) | — | Possible | Possible | Possible | **Existant** | modifier |
| vidéo, audio, accordéon, FAQ, formulaire | Largeur / complètes (formulaire) | — | Possible | Possible | — | — | réglages |
| widgets dynamiques / CMS | Largeur | — | Possible | Possible | — | — | réglages |
| 12 types sans dimension | — | — | selon le type | selon le type | — | — | actions communes seulement |

## Ce qu'il ne faut PAS offrir (parce que ce serait un faux contrôle)
- Un gap sur un élément qui ne déclare pas `gap` (texte, image, bouton…) : la propriété n'existe pas pour ce type.
- Un redimensionnement sur les 12 types sans groupe « size ».
- Un recadrage direct de l'image : il n'existe pas (le bouton « Recadrer » ouvre seulement l'inspecteur au groupe média). Un recadrage sur le canevas serait une nouvelle fonction, à décider séparément.
- Un gap horizontal et vertical indépendants sur les types qui n'ont que `gap` : `rowGap` et `columnGap` ne sont proposés que lorsque les trois propriétés sont déclarées (8 types, tous).

## Ordre de priorité de mise en œuvre (voir le rapport)
1. Gap : 8 types, un seul modèle de poignée.
2. Padding : conteneurs (section, container, column, stack, group).
3. Poignées de redimensionnement manquantes (n, w) : mêmes 10 types.
4. Barre d'actions au survol : tous les types (réutilise le registre).
5. Alignement : conteneurs flex, via le moteur d'accrochage existant.


## État après implémentation (2026-10-10)
| Contrôle | État | Détail |
|---|---|---|
| Gap (écart) direct | **Livré** | 8 types ; vertical et horizontal ; `gap` lié ou `rowGap` / `columnGap` séparés selon le réglage existant |
| Marge intérieure directe | **Livré** | 7 types conteneurs (section libre, container, columns, column, grid, stack, group) ; Maj = quatre côtés |
| Barre d'actions au survol | **Livré** | Sélectionner, Style (ouvre l'inspecteur), Dupliquer : actions existantes |
| Main temporaire (Espace) + icône près du zoom | **Livré** | gardes : champs, boutons, menus, fenêtres, édition |
| Zoom 300 % et 400 % | **Livré** | limite 400 % |
| Marge extérieure directe | Non fait | interfère avec la mise en page du parent |
| Redimensionnement n / w | Non fait | changerait la position du bord dans un flux |
| Recadrage direct d'image | Non fait | n'existe pas dans le modèle (bouton « Recadrer » = inspecteur) |
| Alignement direct | Non fait | le magnétisme et les repères intelligents existants couvrent le redimensionnement ; pas de geste d'alignement ajouté |
| Tactile | Partiel | poignées visibles dès la sélection, zone d'appui 28 px, `pointer` + `touch-action: none` ; les gestes existants (redimensionnement…) restent à la souris |
