# Widgets personnalisés de l'éditeur de pages KOLAKISA

Un widget personnalisé s'ajoute **sans toucher au moteur** : une description, un gabarit d'affichage, des styles.
Le moteur (`src/marketing/pages/nodes.js`) en tire tout le reste.

## Les 3 fichiers d'un widget

1. **Description** : `src/marketing/pages/widgets/<type>.js`
2. **Affichage** : `views/marketing-public/widgets/<type>.ejs`
3. **Styles** : un bloc dans `public/css/landing.css` (classe `kw-<type>` et ses sous-classes ; chaque classe utilisée doit avoir un style, sinon le test « aucune classe orpheline » échoue)

Exemple complet : `profilecard` (Carte de profil).

## Description

| Clé | Rôle |
|---|---|
| `type` | identifiant (minuscules et chiffres) : classe `kw-<type>`, gabarit `widgets/<type>.ejs` |
| `label`, `icon`, `keywords` | nom, icône (bibliothèque d'icônes du site) et mots de recherche de la bibliothèque |
| `group` | catégorie de la bibliothèque : `layout`, `basic`, `general`, `form`, `advanced`, `site`, `commerce`, `social` |
| `requires` | (facultatif) permission exigée pour ajouter ou modifier le widget (cadenas réel, revérifié par le serveur) ; ex. `pages.code` |
| `style` | `text` (typographie, couleurs, espacement…) ou `box` (mise en page de boîte) : groupes de l'onglet Style |
| `version` | entier ; à augmenter quand les champs changent, avec `migrate` |
| `migrate` | `{ 2: (réglages v1) => réglages v2, 3: … }` : les pages existantes sont mises à niveau à l'ouverture et à l'enregistrement |
| `schema` | liste des champs (voir ci-dessous) |

### Champs (`schema`)

Chaque champ : `{ key, kind, label, required?, default?, max?, min?, options? }`.

| `kind` | Validation automatique | Inspecteur |
|---|---|---|
| `text` / `textarea` | texte nettoyé, longueur `max` | champ texte / zone de texte |
| `number` | entre `min` et `max` (obligatoires) | nombre |
| `select` | une valeur de `options` (`[[valeur, libellé], …]`) | liste |
| `bool` | vrai / faux | case à cocher |
| `link` | adresse sûre (comme les boutons : `/…`, `#ancre`, `https://…`, `mailto:`) | champ avec adresses du site proposées |
| `image` | image de la médiathèque ou `https://` | médiathèque |
| `icon` | icône de la bibliothèque du site | sélecteur d'icônes |
| `color` | couleur du design system ou `#rrggbb` | sélecteur de couleur |

Un champ `required` doit avoir un `default` : le widget ajouté depuis la bibliothèque est toujours valide.

## Gabarit d'affichage

Variables : `p` (réglages validés), `cls` et `attrs` (classes et attributs communs : à mettre sur l'élément racine), `L`
(liens déjà comptés, par clé de champ `link` : utiliser `L.<clé>`, **jamais** l'adresse brute, sinon le comptage des clics
est faux), `isBuilder` (vrai dans le canevas de l'éditeur). Toujours `<%= %>` (échappé) pour le texte.

## Liste d'éléments répétés (`kind: "items"`)

Pour des diapositives, des liens, des témoignages… : un champ `items` contient une **liste** dont chaque élément a les mêmes sous-champs.

```js
{ key: "links", kind: "items", label: "Liens", min: 1, max: 12,
  default: [{ label: "Mon site", url: "/" }],            // contenu de départ (au moins `min` éléments)
  fields: [                                              // sous-champs : mêmes types que ci-dessus, sauf « items » (pas de liste dans une liste)
    { key: "label", kind: "text", label: "Texte", max: 60, required: true, default: "Mon lien" },
    { key: "url", kind: "link", label: "Adresse", required: true, default: "/" } ] }
```

- `max` (1 à 24) est obligatoire ; `min` (0 à `max`) aussi borné ; un `min` de 1 ou plus exige un `default` d'au moins `min` éléments.
- Le serveur valide chaque sous-champ de chaque élément (liens et images sûrs, bornes, obligatoires) et refuse trop ou trop peu d'éléments.
- L'inspecteur affiche chaque élément avec ses champs et les actions **monter / descendre / supprimer** (le minimum est protégé) et « Ajouter un élément » (le maximum est protégé).
- Gabarit : `p.<champ>` est le tableau ; les liens d'un sous-champ `link` sont comptés élément par élément : `L.<champ>[i].<sous-champ>` (**jamais** l'adresse brute).

## Réglages d'ensemble et fiche de bibliothèque

| Clé | Rôle |
|---|---|
| `validate(réglages, lieu)` | (facultatif) règle qui porte sur l'ensemble des réglages déjà validés ; lève une `Error` claire (ex. « un bouton demande une adresse »). Évitez d'importer `../nodes` en tête de fichier (dépendance circulaire) : faites-le dans la fonction. |
| `description` | (facultatif, 160 caractères) phrase affichée en infobulle dans la bibliothèque. |
| `status` | (facultatif) `operational`, `partial` ou `dependency` : état réel du widget. |
| `dependencies` | (facultatif) liste de ce qui est exigé (service, clé, formation…), à documenter pour l'équipe. |
| `data(ctx, réglages, env)` | (facultatif) données calculées à l'affichage pour le gabarit (`d`), jamais bloquant. |

Exemples complets : `widgets/linkinbio.js` (liste de liens), `widgets/carrousels.js` (diaporama, témoignages, médias : carrousel du site réutilisé),
`widgets/readmore.js` (déplier natif, sans script), `widgets/textpath.js` (SVG).

## Ce que le moteur fait seul

- validation et nettoyage des réglages (côté serveur, à chaque enregistrement) ;
- fiche de bibliothèque (catégorie, recherche, favoris, cadenas) et contenu de départ ;
- champs de l'inspecteur (onglet Contenu) et onglets Style / Avancé communs à tous les éléments ;
- styles par écran (ordinateur, tablette, mobile) et par état, animations, interactions, visibilité, programmation ;
- comptage des clics des champs `link` ; versions et mise à niveau.
