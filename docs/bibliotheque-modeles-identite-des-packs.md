# Bibliothèque de modèles Kolakisa — identité des packs

## Contenu (plus de 256 modèles)

| Type | Nombre | Où |
|---|---|---|
| Sites complets (packs) | 100 | `src/marketing/pages/sitePacks.js`, `lib100/packs` |
| Pages | 100 | `src/marketing/pages/templates.js`, `lib100/pages` |
| Sections | 100 | `src/marketing/pages/patterns.js`, `lib100/sections` |
| Composants | 100 | `libraryComponents.js`, `lib100` |
| Parties | 100 | `libraryParts.js`, `lib100` |
| Thèmes | 40 | catalogue des thèmes web |
| Article individuel (Theme Builder) | 100 | `src/themeBuilder/catalog/single_post/` |

Le catalogue unifié est `src/services/templateCatalog.js` (références `pack:`, `page:`, `section:`, `component:`, `part:`). L'import, le plan, l'annulation et l'aperçu passent par `src/services/templateLibrary.js` et la route `/marketing/site-web/templates/apercu`.

## Identité propre à chaque pack

- `src/services/packIdentity.js` : 24 directions artistiques (éditorial, luxe, technique, brutal, doux, start-up, artisan, magazine, sport, santé, corporate, créatif, nature, néon, mode, rétro, institution, studio, gastronomie, éco, affiche, bureau, livre, fun). Chaque pack reçoit, de façon déterministe, une direction, une teinte, une paire de polices, des rayons, des ombres, des bordures et une taille de titre.
- Garanties : contrastes AA (texte, texte discret, bouton) ; couleurs principales d'une même direction éloignées d'au moins 56 en distance RVB ; polices présentes dans la bibliothèque locale ; polices très larges avec titre réduit.
- `src/services/packArt.js` + `themeArtPublic.js` : illustrations SVG originales générées par Kolakisa (`/themes-art/<pack>/<emplacement>.svg`), libres de droits, sans dépendance externe.
- `src/services/packBrand.js` : remplace les emplacements d'image des pages du pack par ces illustrations et personnalise titre et chapô de l'accueil.
- À l'import, les styles du site (couleurs, polices, formes, ombres) sont enregistrés en brouillon : rien n'est publié sans validation, et l'import reste annulable.

## Compatibilité

Les packs n'ajoutent ni en-tête ni pied de page : ceux du Theme Builder restent la référence (pas de doublon). Les aperçus s'affichent dans une page isolée (iframe vers la route d'aperçu).

## Tests et contrôles

- `node scripts/audit-bibliotheque.js --all` : 0 défaut (identité, contrastes, polices, illustrations, distinction).
- `tests/bibliotheque-packs-identite-navigateur.test.js` : 100 packs × 3 largeurs dans Chrome (identité appliquée, illustrations chargées, pas de débordement, texte lisible).
- `tests/apparence-templates`, `programme20-4-catalogue`, `programme20-4-import-enregistrement`, `site-web-modeles`, `apparence-parcours` : 73 / 73.

## Limites connues

- Pas de photographies : illustrations vectorielles originales.
- 33 packs n'ont pas d'emplacement d'image dans leurs pages d'origine.
- Les textes entre crochets restent volontairement à remplacer (aucune fausse information).
- Les pages, sections, composants et parties gardent le style du site où ils sont importés.
