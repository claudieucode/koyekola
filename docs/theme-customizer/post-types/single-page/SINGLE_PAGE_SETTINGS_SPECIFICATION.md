# Page individuelle : spécification des réglages (`settings.pageSingle`)

Validation stricte côté serveur (`pageSingle.normalize`) ; toute valeur hors liste ou hors borne est refusée avec un message clair.

## Onglet GÉNÉRAL
| Réglage | Chemin | Valeurs | Effet réel |
|---|---|---|---|
| Page Zone de titre | `title.enabled` | oui / non | `<header class="kw-page-title"><h1>` en tête du contenu ; aucun bloc si désactivé ; absent si la page a déjà un H1 ou un bandeau d'accueil |
| Alignement du titre | `title.align` | left / center / right | `text-align` |
| Mise en page du conteneur | `container.layout` | default, full, boxed, narrow, wide | `max-width` : défaut = site ; full = aucune limite ; boxed = largeur des conteneurs du site (1100 px par défaut) ; narrow = 640 px ; wide = 1320 px ; toujours `min(N, 100%)` |
| Style de conteneur | `container.style` | default, open, boxed-all | default = thème ; open = sans fond, bordure, ombre ni rayon ; boxed-all = fond, bordure, rayon et ombre du thème |
| Colonne latérale | `sidebar.layout` | default (= sans), none, left, right | grille deux colonnes autour de la zone « sidebar » |
| Style de colonne | `sidebar.style` | default, open, boxed-all | idem conteneur, sur l'`<aside>` |
| Largeur / espace | `sidebar.width` 200–480, `sidebar.gap` 0–96 (px) | | `grid-template-columns`, `column-gap` |
| Tablette et mobile | `sidebar.stack` | after, before, hidden | `order` ou `display:none` sous le point de rupture tablette |
| Largeur du contenu | `content.widthMode` default / custom ; `width`, `tabletWidth`, `mobileWidth` 240–2400 | | `max-width:min(N,100%)` par appareil ; ignorée tant que « Par défaut » |

## Onglet DESIGN
| Réglage | Chemin | Bornes |
|---|---|---|
| Marge interne (padding) | `padding.{desktop,tablet,mobile}.{top,right,bottom,left}` | 0–400 px, vide = thème |
| Marge externe (margin) | `margin.{…}.{…}` | 0–400 px, vide = thème |
| Titre | `title.size` 16–96, `title.color`, `title.paddingY` 0–240 | |
| Conteneur | `container.background`, `borderWidth` 0–12, `borderColor`, `radius` 0–64, `shadow` none/sm/md/lg | |
Marge interne et marge externe produisent des propriétés CSS différentes (`padding-*` / `margin-*`) : un test vérifie qu'elles ne se confondent jamais. La liaison des quatre côtés est une aide d'interface (elle écrit quatre valeurs) ; l'unité est le **px**.

## Exceptions par page
`mk_landing_pages.theme.single` : mêmes champs, tous facultatifs.

## Non fait dans cette version
Sous-titre, description, fil d'Ariane et image de la zone de titre ; hauteur de la zone ; dégradé et image d'arrière-plan du conteneur ; typographie complète (police, graisse, interligne, casse) du titre, du contenu, des liens ; couleurs au survol et au focus ; ombre à réglages libres ; unités autres que px ; **interface** de l'exception par page dans l'éditeur de pages (la donnée, la validation, le rendu et la priorité existent et sont testés).
