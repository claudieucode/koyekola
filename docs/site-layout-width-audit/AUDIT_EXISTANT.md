# Audit de l'existant — largeurs des sites publiés (Kolakisa)

> Phase 1 : AUDIT UNIQUEMENT. Aucun code n'a été modifié.
> Méthode : lecture statique du code (branche `header-builder-elementor`). **Rien n'a été exécuté dans un navigateur** : toute valeur « colonnes atteintes » est calculée depuis le CSS, pas observée. Les deux captures d'écran citées dans la mission n'étaient pas jointes au message reçu : le diagnostic part du code, pas des images (à confirmer par l'utilisateur, voir PROBLEMES_IDENTIFIES.md).

## Deux familles de pages publiques
1. **Pages du Page Builder / Theme Builder** (`views/marketing-public/_sections.ejs`, `public/css/landing.css`, thèmes `src/marketing/themes/packs/*`). Largeur pilotée par `.lp-main`, `.kw-container`, réglages du site.
2. **Vues EJS classiques** (formations, blog, catégories, recherche, pages `views/pages/*`, compte, panier) : `public/css/style.css`. Boutique : `public/css/boutique.css` (`.sh-main`).

## Injection de l'en-tête et du pied (Theme Builder)
- `server.js:73` → `src/middlewares/themeLayout.js:7-19` enveloppe `res.render`, appelle `themeRender.renderParts` et pose `res.locals.themeHeader / themeFooter / themeExtras`.
- `views/partials/header.ejs:33` : si `themeHeader` existe, il remplace l'en-tête historique ; `<main id="main">` ligne 126. `views/partials/footer.ejs:2-9` : `</main>`, puis `themeFooter` ou `<footer class="site-footer">`.
- L'en-tête et le pied Theme Builder sont donc **frères de `<main>`, sous `<body>`**, hors de toute colonne max-width.
- Leur rendu (`src/marketing/web/themeRender.js`, `wrapHtml`, ~l.50) : `<div class="kw-theme-part kw-theme-header lp-site"> <link landing.css> <style>…</style> <div class="lp-main">CONTENU</div></div>`.
- Le contenu est donc **enveloppé dans un `.lp-main`**, qui vaut `max-width:760px; padding:32px 16px 48px` (`landing.css:26`).

## Mécanisme « fond pleine largeur » existant
- `bleedOf()` (`themeRender.js` ~l.56) ajoute la classe `kw-theme-bleed` seulement si une section de type `layout` a un enfant direct avec `props.full === true` ou `props.band === true`.
- `.kw-theme-bleed > .lp-main { max-width:none; padding-left:0; padding-right:0 }` (`themeRender.js` ~l.46). Les paddings haut/bas de `.lp-main` (32/48 px) restent.
- `landing.css:164-169` : `.kw-container` (1100 px par défaut, `:where`, spécificité 0) ; `.kw-full` = sans plafond ; `.kw-band` = fond sur 100 % du parent, contenu centré par padding à `--kw-band-w`.

## Contrôles déjà présents dans l'éditeur (`public/js/page-builder.js`)
- l.4233-4240 : « Largeur du contenu » = Encadrée / Fond pleine largeur, contenu encadré (`band`) / Pleine largeur (`full`) / Personnalisée (largeur max. du conteneur, par appareil). `setContainerWidth` l.1076-1092.
- Schéma `nodes.js:447`, classe émise `_node.ejs:45`.
- Niveau site : `siteSettings.js` (`layout.contentWidth` 480-1600, `containerWidth` 480-1600, `gutter`, `fullWidth`), `globalStyles.js:171, 340-375` (largeur max. du site 320-3000, étroit/large par appareil), `layoutFormat.js` (formats compact 960 / standard 1200 / large 1440 / fluide / personnalisé).

## Thèmes (packs)
- `src/marketing/themes/packs/base.css` (lu en entier) : `.lp-main>.lp-block-layout:not(:has(.pk-bleed))` reçoit `max-width:var(--pk-max,1280px)!important` + `padding-inline:var(--pk-gutter,24px)!important`. Les blocs contenant `.pk-bleed` passent en pleine largeur.
- `--pk-max` n'est défini que par 8 packs (704 px ×4, 736 px, 780 px, 1240 px) ; les autres retombent sur 1280 px ; plusieurs dizaines de packs fixent en plus des colonnes internes de 720-880 px.

## Vues EJS classiques
Voir ARCHITECTURE_DES_CONTENEURS.md (tableau complet).
