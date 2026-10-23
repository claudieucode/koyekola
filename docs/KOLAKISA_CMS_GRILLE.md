# KOLAKISA CMS — Grille de l'interface d'administration (marges et conteneurs)

Branche `cms-recentrage-grille`. État **réel**, mesuré dans un vrai Chrome avant et après.

## Cause du défaut

- La marge latérale et la largeur maximale du contenu étaient écrites **deux fois, avec des valeurs contradictoires** : `marketing.css` (`.mk-content` 32/40/72 px, 1760 px) et `kola-ui.css` (28/40/80 px, 1560 px), plus des surcharges par largeur d'écran (28 px, 16 px) dans les deux fichiers.
- La barre d'administration et le fil d'Ariane avaient des marges **fixes et différentes** (10 px et 20 px ; 6 px et 12 px sur mobile) : éléments collés aux bords, deux alignements gauche différents.
- Les pages de réglages (formulaires) étiraient leur carte sur toute la largeur du conteneur de données (1480 px) alors que les champs font 600 px.

## Correction structurelle (une seule définition)

Jetons dans `marketing.css` (`:root`), adaptés à cinq largeurs : `--kg-gutter` (barres), `--kg-pad` (contenu), `--kg-max` (page de données, 1600 px), `--kg-max-form` (formulaire, 1200 px).

| Écran | `--kg-gutter` | `--kg-pad` |
|---|---|---|
| ≥ 1700 px | 32 | 56 |
| 1181–1699 px | 24 | 44 |
| ≤ 1180 px | 20 | 32 |
| ≤ 860 px | 14 | 20 |
| ≤ 480 px | 12 | 16 |

- `.mk-content` (`marketing.css`, `kola-ui.css`) : `padding-inline: var(--kg-pad)`, `max-width: var(--kg-max)`, centré (`margin-inline: auto`) **dans la zone de travail, après le menu** ; les surcharges par largeur sont supprimées (les jetons s'en chargent).
- Barre d'administration et fil d'Ariane (`adminbar.css`) : même marge `--kg-gutter` → leur bord gauche est identique.
- Formulaires : le gabarit `partials/top.ejs` accepte `layout: "form"` (ou `"wide"`) et pose `.mk-content--form` (colonne de 1200 px au plus, centrée). Appliqué aux six écrans de réglages (général, avancé, IA, envoi, SMS, réseaux sociaux).
- **Inchangés** : barres latérales (largeur, position), éditeurs plein cadre (`.mk-content:has(.mk-builder)`), palette, permissions, fonctions.

## Résultats mesurés (Chrome)

- Barre et fil d'Ariane : bord gauche identique, marge de 32 / 24 / 20 / 12 px selon la largeur (avant : 10 px et 20 px).
- Contenu : symétrique dans la zone de travail à 1440, 1920 et 2560 px ; formulaires centrés (1200 px) ; pages de données à 1600 px au plus.
- Aucun défilement horizontal à 2560, 1920, 1440, 1024 et 390 px sur « Mes sites », Articles, Pages, Paramètres, Thèmes et Widgets.
- Tests : `tests/grille-interface.test.js` (3 tests CSS + 7 mesures navigateur, ignorées sans Playwright / Chrome).

## Limites

- Le tableau « Mes sites » a neuf colonnes : à 1440 px il défile horizontalement dans son cadre (comme avant) ; ses colonnes n'ont pas été modifiées.
- À 1024 px, le menu (252 px) et le rail (64 px) laissent 708 px au contenu : la structure de navigation n'a pas été changée.
- Seules les six pages de réglages utilisent `layout: "form"` ; les autres formulaires gardent la largeur de données (ajouter `layout: "form"` à leur `include("partials/top", …)` suffit).
