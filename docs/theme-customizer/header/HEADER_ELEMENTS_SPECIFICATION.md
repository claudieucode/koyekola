# Entête — spécification des éléments et de leurs réglages

Généré par `scripts/gen-header-docs.py` à partir de la table `src/marketing/pages/headerSettings.js` (la même qui valide, construit l'interface et alimente le rendu) : ce document ne peut pas diverger du code.

## Éléments du moteur (rangée principale)
| Élément | Identifiant | Rendu | Réglages |
|---|---|---|---|
| Identité du site (logo, titre, slogan) | `brand` (`.lp-autohead-brand`) | `views/marketing-public/_autohead.ejs` | groupe « Titre et logo » |
| Menu principal | `nav` (`.lp-autohead-nav`) | `_autonav.ejs` (menu affecté à « En-tête du site ») | groupe « Menu principal » |
| Menu hors-champ | `oc` (`.lp-oc`, `.lp-oc-toggle`, `.lp-oc-backdrop`) | `_autohead.ejs` + `public/js/kw-header.js` | groupe « Menu hors-champ » |

Les éléments « recherche », « bouton », « HTML », « widgets », « réseaux sociaux », « compte » et « panier » ne sont pas rendus par ce moteur : leurs couleurs ne figurent donc pas dans les réglages (aucun contrôle sans effet). Ils sont prévus dans l'architecture (voir `HEADER_ARCHITECTURE.md`).

## Titre et logo — Général
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `logoWidth` | Largeur du logo | num | 20–600 px | — | oui |
| `logoSvg` | Utiliser le logo SVG | bool | oui/non | false | non |
| `title` | Titre du site | text | texte | — | non |
| `titleVis` | Visibilité du titre du site | vis | sous-ensemble de d, t, m | auto | non |
| `sameLine` | Logo et titre du site sur la même ligne | bool | oui/non | true | non |
| `tagline` | Slogan | text | texte | — | non |
| `taglineVis` | Visibilité du slogan du site | vis | sous-ensemble de d, t, m | dtm | non |
| `logoVis` | Visibilité | vis | sous-ensemble de d, t, m | dtm | non |

## Titre et logo — Design
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `logoColor` | Couleur du logo | color | #rrggbb, couleur du site ou vide | — | non |
| `titleColor` | Couleur du titre | color | #rrggbb, couleur du site ou vide | — | non |
| `titleHover` | Couleur du titre au survol | color | #rrggbb, couleur du site ou vide | — | non |
| `taglineColor` | Couleur du slogan | color | #rrggbb, couleur du site ou vide | — | non |
| `titleSize` | Taille de la police du titre | num | 10–96 px | — | oui |
| `identityMargin` | Marge externe | space | -200–200 | — | oui |

## Menu principal — Général
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `menuSubWidth` | Largeur du sous-menu | num | 120–600 px | — | non |
| `menuSeparator` | Séparateur d'élément | bool | oui/non | false | non |
| `menuVis` | Visibilité | vis | sous-ensemble de d, t, m | dtm | non |

## Menu principal — Design
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `menuHover` | Style au survol de menu | enum | none/underline/underline-anim/bg/outline/overline | none | non |
| `menuSubOffset` | Décalage supérieur du sous-menu | num | 0–80 px | — | non |
| `menuSubAnim` | Animation de sous-menu | enum | none/fade/slide/zoom | none | non |
| `menuSubBorder` | Largeur de bordure du sous-menu | space | 0–20 | — | non |
| `menuSubBorderColor` | Couleur de bordure du sous-menu | color | #rrggbb, couleur du site ou vide | — | non |
| `menuSubRadius` | Rayon de bordure du sous-menu | space | 0–60 | — | non |
| `menuColor` | Texte/lien — normal | color | #rrggbb, couleur du site ou vide | — | non |
| `menuBg` | Arrière-plan — normal | color | #rrggbb, couleur du site ou vide | — | non |
| `menuColorHover` | Texte/lien — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `menuBgHover` | Arrière-plan — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `menuColorActive` | Texte/lien — actif | color | #rrggbb, couleur du site ou vide | — | non |
| `menuBgActive` | Arrière-plan — actif | color | #rrggbb, couleur du site ou vide | — | non |
| `menuSubColor` | Sous-menu : texte/lien | color | #rrggbb, couleur du site ou vide | — | non |
| `menuSubBg` | Sous-menu : arrière-plan | color | #rrggbb, couleur du site ou vide | — | non |
| `menuFont` | Police du menu | enum | (hérité)/heading/body/button | — | non |
| `menuSize` | Taille du texte | num | 10–40 px | — | oui |
| `menuWeight` | Graisse | enum | (hérité)/400/500/600/700/800 | — | non |
| `menuLineHeight` | Hauteur de ligne | num | 1–3 | — | non |
| `menuLetter` | Espacement des lettres | num | -0.1–0.5 em | — | non |
| `menuTransform` | Transformation du texte | enum | (hérité)/none/uppercase/lowercase/capitalize | — | non |
| `menuPadding` | Espacement du menu | space | 0–100 | — | oui |
| `menuMargin` | Marge externe | space | -200–200 | — | oui |

## Menu hors-champ — Général
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `ocVis` | Visibilité | vis | sous-ensemble de d, t, m | — | non |
| `ocSeparator` | Séparateur d'élément | bool | oui/non | false | non |
| `ocMode` | Type d'ouverture | enum | panel/full/dropdown | panel | non |
| `ocDir` | Direction d'ouverture | enum | left/right | right | non |
| `ocLabel` | Texte du déclencheur | text | texte | Menu | non |
| `ocShowLabel` | Afficher le texte à côté de l'icône | bool | oui/non | false | non |

## Menu hors-champ — Design
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `ocColor` | Lien — normal | color | #rrggbb, couleur du site ou vide | — | non |
| `ocColorHover` | Lien — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `ocColorActive` | Lien — actif | color | #rrggbb, couleur du site ou vide | — | non |
| `ocBg` | Arrière-plan du panneau | color | #rrggbb, couleur du site ou vide | — | non |
| `ocBgHover` | Arrière-plan d'un lien — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `ocTriggerColor` | Couleur du déclencheur | color | #rrggbb, couleur du site ou vide | — | non |
| `ocFont` | Police du menu | enum | (hérité)/heading/body/button | — | non |
| `ocSize` | Taille du texte | num | 10–48 px | — | oui |
| `ocWeight` | Graisse | enum | (hérité)/400/500/600/700/800 | — | non |
| `ocLineHeight` | Hauteur de ligne | num | 1–3 | — | non |
| `ocLetter` | Espacement des lettres | num | -0.1–0.5 em | — | non |
| `ocPadding` | Espacement de menu | space | 0–100 | — | oui |
| `ocMargin` | Marge externe | space | -200–200 | — | oui |
| `ocSubColor` | Sous-menu : texte/lien | color | #rrggbb, couleur du site ou vide | — | non |
| `ocSubBg` | Sous-menu : arrière-plan | color | #rrggbb, couleur du site ou vide | — | non |
