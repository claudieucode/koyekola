# Architecture actuelle des conteneurs

## A. Pages Page Builder / Theme Builder
| Couche | Règle | Source |
|---|---|---|
| Colonne principale | `.lp-main{max-width:760px;margin:0 auto;padding:32px 16px 48px}` | landing.css:26 |
| Surcharge réglage site | `.lp-site .lp-main{max-width:Npx}` (480-1600) ou `none` si `fullWidth` ; gouttière | siteSettings.js:224-230 |
| Surcharge réglage « personnaliser » | `maxWidth`, `width`, `narrow`, `wide` par appareil | globalStyles.js:171, 340-375 |
| Surcharge format guidé | `.lp-main{max-width:none;padding:0}` + `width:min(100% − 2g, W)` sur chaque nœud de 1er niveau | layoutFormat.js:46-67 |
| Surcharge thème (pack) | `max-width:var(--pk-max,1280px)!important` sur `.lp-block-layout` | packs/base.css:4 |
| Conteneur libre | `:where(.kw-container){max-width:1100px}` | landing.css:164 |
| Bande | `.kw-band` : fond 100 % du parent, contenu centré via `--kw-band-w` | landing.css:168-169 |
| Modificateurs bloc | `.lp-w-narrow` 560 · `.lp-w-wide` 1080 · `.lp-w-full` 100vw (marge négative `calc(50% - 50vw)`) | landing.css:100-105 |
| Pièces globales | `.kw-theme-part` sans largeur ; contenu dans un `.lp-main` | themeRender.js |

Largeurs réelles par défaut : colonne 760 px ; conteneurs libres 1100 px **mais plafonnés par la colonne de 760 px** tant que le conteneur n'est ni `full` ni `band` ni sous format guidé.

## B. Vues EJS classiques (`public/css/style.css:133-135`)
`.container` 900 px · `.container-wide` 1240 px (contenu 1200) · `.container-narrow` 620 px. Valeurs **codées en dur**, aucun réglage par site.

| Vue | Conteneur |
|---|---|
| index, catalogue, category, blog/index, about (bloc), course-detail, cart, checkout, account, my-courses | `container-wide` |
| search, cookies, faq, blog/show (surchargé à 1320 px, `single-post.css:7` permet `none`) | `container` |
| contact | `container-narrow` |
| lesson | `max-width:1400px` en ligne |
| boutique/* | `.sh-main{max-width:1120px}` (boutique.css:12), n'utilise pas style.css |

## C. Grilles de cartes (calcul, non observé)
| Grille | Règle | Colonnes max à 1440 / 1920 / 2560 |
|---|---|---|
| `.grid-courses` | auto-fill minmax(260px) | 4 / 4 / 4 |
| `.post-grid` | auto-fill minmax(300px) | 3 / 3 / 3 |
| `.blog-grid` | `repeat(3,…)` fixe | 3 / 3 / 3 |
| `.mc-grid` | auto-fill minmax(290px) | 3 / 3 / 3 |
| `.sh-grid` (boutique) | auto-fill minmax(200px) | 5 / 5 / 5 |

Aucune règle ne fait grandir ces conteneurs au-delà de 1120-1320 px.

## D. En-tête / pied historiques (EJS)
`.site-header` et `.site-footer` n'ont pas de max-width : **fond déjà pleine largeur** ; seul le contenu est dans `.container-wide` (1240 px) (`header.ejs:35-36`, `footer.ejs:10,57-58`).
