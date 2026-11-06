# Page individuelle : rendu

1. **Site** : `siteAssets().theme = [themeCss, layoutCss, classCss]` ; `layoutCss` ajoute `pageSingle.css(settings.pageSingle, { layout, breakpoints })`.
2. **Page** : `landing/index.js` ajoute à `nodeCss` `pageSingle.css(page.theme.single, …, { full: false })` (exception : ce qui est fourni, y compris le retour à « Par défaut »). `nodeCss` est émis après la feuille du site.
3. **Gabarit** (`landing.ejs`) : `pageSingleFor(site, page)` renvoie le cadre effectif (exception > global) ou `null` hors pages d'un site. Classe `kw-kind-page` ; `kw-ps-sb` seulement si la colonne est active **et** que la zone « sidebar » a du contenu ; `<div class="kw-ps-frame">` + `<aside class="kw-ps-aside">` dans ce cas.
4. **Sélecteurs** : sans colonne `.lp-site.kw-kind-page:not(.kw-ps-sb) .lp-main` ; avec colonne `.lp-site.kw-kind-page.kw-ps-sb .kw-ps-frame` (le `lp-main` interne perd largeur max, marges et padding, `landing.css`).
5. **Aperçu** : le personnalisateur rend la **vraie page** avec les réglages du brouillon (`/rendu` renvoie `assets.theme`, remplacé dans le cadre sans recharger) ; mêmes règles que le site public, aucune maquette parallèle.
6. **SEO / accessibilité** : le titre SEO vient de `webPageSeo` (inchangé) ; la zone de titre ne crée jamais un second H1 ; `<aside aria-label="Colonne latérale">` ; focus et clavier inchangés.
