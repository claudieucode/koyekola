# Palier 14 — Audit responsive

Date : 2026-10-29. Branche `palier13` (le Palier 14 y est empilé ; voir Limites pour le statut Git). Les rapports précédents `KOLAKISA_RESPONSIVE_*.md` décrivent un moteur responsive déjà complet ; cet audit les **vérifie sur le code actuel** et ne les remplace pas.

## État initial (faits)
- **Moteur de points de rupture centralisé par site** : tablette 1023, mobile 767, grand écran 1920 (`src/marketing/pages/siteSettings.js`, `nodes.js` ; bornes validées : tablette 820–1279, mobile 400–767). Les valeurs par appareil sont stockées dans `styles[desktop|tablet|mobile|wide]`, une valeur vide hérite, et la page publiée reçoit les mêmes `@media` que le canevas (`docs/KOLAKISA_RESPONSIVE_ARCHITECTURE.md`). **Conservé tel quel.**
- Constat de dispersion : les valeurs par défaut 1023/767/1920 sont écrites **à deux endroits** (`nodes.js` et `siteSettings.js`) ; elles sont identiques aujourd'hui. Les feuilles de style du site et de l'administration utilisent en plus ~40 largeurs distinctes en `@media` (640, 720, 760, 860, 900, 960, 1100…) qui ne relèvent pas du réglage par site (interfaces propres de la plateforme). Aucune divergence de comportement démontrée ; **pas de centralisation entreprise** (elle ne repose sur aucun défaut reproduit).
- Navigateurs réellement disponibles : Chrome (Playwright), **Firefox 153 (WebDriver BiDi, aucune installation)**, Edge (Chromium, installé), Safari (installé mais `safaridriver` non activé : non testé, voir Limites).

## Méthode
`scripts/ux/matrice-responsive.js` : vrai serveur, base de test, **30 pages × 8 tailles × 2 navigateurs (480 chargements)** — public (7 pages), pages publiées avec les 90 widgets créables en contenu « difficile » (8 pages), administration (14 pages), éditeur. Mesures : défilement horizontal du document, éléments visibles dépassant le bord droit sans conteneur défilant, cibles tactiles interactives < 24 px (WCAG 2.5.8), barres fixes > 35 % de la hauteur. Tailles : 1920×1080, 1440×900, 1024×768, 820×1180 et 1180×820 (tablette portrait/paysage), 390×844 et 844×390 (téléphone), 320×568. **Ce sont des fenêtres redimensionnées dans des navigateurs de bureau, pas des appareils physiques ni l'émulation tactile complète.**

## Défauts reproduits avant correction (134 constats)
| # | Gravité | Défaut | Navigateurs | Cause racine |
|---|---|---|---|---|
| R1 | Moyenne | `/blog` : la recherche dépasse la fenêtre (page défilable à l'horizontale : +30 px à 320 px en Chrome ; +12 px à 390 px et +82 px à 320 px en Firefox) | Chrome, Firefox | `.blog-search` est un élément flex avec `min-width: auto` = largeur intrinsèque du champ + bouton (330 px dans un conteneur de 280 px) |
| R2 | Moyenne | Administration `/marketing/pages` : la recherche déborde à 320 px | Firefox | Champ `min-width: 200px` + bouton, sans retour à la ligne |
| R3 | Faible | Champ de recherche de l'en-tête public : cible de 18 px de haut (tablette paysage) | Chrome, Firefox | Le *padding* vertical était sur le pill, pas sur le champ : cliquer dans la marge ne focalisait pas le champ |
| R4 | Faible | Tableau de bord : liens « Tout voir / Ouvrir » et « retour » de 22 px de haut | Chrome, Firefox | Pas de hauteur minimale sur ces liens |
| R5 | Faible | Carrousel : pastilles de 10×10 px, espacées de 6 px | Chrome, Firefox | Zone cliquable = point dessiné |

## Vérifié sans défaut
- **Pages publiques (7) et 8 pages de widgets, 8 tailles** : aucun débordement horizontal autre que R1, dans les deux moteurs.
- **Points de rupture** : le titre prend 40 / 30 / 20 px à 1440 / 820 / 390 px sur la page publiée **dans Chrome et Firefox**.
- **Aperçu de l'éditeur** : les cadres Ordinateur / Tablette / Mobile ont la largeur annoncée (≥ 1024 et < 1920 / 820 / 390), évaluent les `@media` contre leur propre largeur, donnent les mêmes tailles de titre que la page publiée (40 / 30 / 20 px), et changer d'appareil ne modifie ni le brouillon ni la révision.
- **Éditeur à 1024 px et en dessous** : aucun débordement du document ; la barre du haut passe sur plusieurs lignes (constat du Palier 13, voir Limites).

## Constats classés sans correction
- `textpath` (SVG) : « dépasse » mesuré **uniquement dans Firefox** ; le document ne défile pas. Artefact de `getBoundingClientRect()` sur l'élément `<textPath>` dans Gecko, pas un débordement visible.
- `/marketing/contacts` : bouton « Filtrer » de 1 px = bouton de secours volontairement masqué quand le filtre est instantané (`mk-filterbar is-live`).
- Éditeur sur tailles tactiles : `pb-fav` 22 px, `pb-twist` 18×24, un bouton de 34×17 — l'éditeur est une interface de bureau (voir Limites).
