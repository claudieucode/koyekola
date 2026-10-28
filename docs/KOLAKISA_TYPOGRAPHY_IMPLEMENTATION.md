# Typographie Kolakisa — implémentation

## Pile centrale (`public/css/style.css`, `:root`)
```
--font-sans: Arial, "Helvetica Neue", Helvetica, "Liberation Sans", Arimo, sans-serif;
--font-body: var(--font-sans);
--font-display: var(--font-sans);
--font-display-weight: 700;   /* Arial Bold pour les titres */
```
Aucune police téléchargée : Arial est installée sur Windows et macOS ; Helvetica (macOS), Liberation Sans / Arimo (Linux, métriques identiques à Arial) servent de repli.

## Ce qui a changé
- `style.css` : jetons ci-dessus ; deux règles en dur remplacées par `var(--font-display)`.
- `kola-brand.css` : repli de `--kb-display` = Arial.
- `tokens.js` : nouvelle police `arial` ; `DEFAULT_TOKENS.fonts` = Arial pour titres, texte, boutons, liens.
- `sitePacks.js` : packs de démarrage en Arial (les polices `georgia`/`system` des packs sont inchangées).
- `catalog.js` : description du thème d'origine.
- `header.ejs`, `font-preload.ejs` : préchargement des anciennes polices retiré (moins d'octets sur chaque page).

## Titres : taille et graisse conservées
Aucune taille, hauteur de ligne, espacement ni alignement n'est modifié : seule la famille change. Les titres en graisse 800 s'affichent en Arial Bold (700, la plus forte face d'Arial) — pas de faux gras, pas de contour. Les crénages négatifs existants (`letter-spacing: -0.02em`) sont conservés.

## Exceptions volontaires (choix de l'utilisateur ou du thème)
- Sites déjà enregistrés avec Figtree / Bricolage / Georgia / une police de la bibliothèque : conservés (seuls les réglages jamais personnalisés passent à Arial).
- Les 160 thèmes de la bibliothèque gardent la typographie de leur identité.
- Le choix « Figtree / Bricolage » par bloc (`data-ff`) dans l'éditeur reste disponible.
- Polices monospace du code : inchangées. Les `@font-face` Bricolage/Figtree restent déclarées pour ces choix.
- Test : `tests/typographie-arial.test.js` empêche de réintroduire l'ancienne police en dur dans les feuilles.
