# Typographie Kolakisa — audit (28/10/2026)

**Police initiale identifiée** : *Bricolage Grotesque* (titres, `--font-display`) et *Figtree* (texte, `--font-body`), servies localement (`public/fonts/*.woff2`, `@font-face` dans `style.css` et `landing.css`). Les titres « Mode essai » et « Campagnes SMS » des captures utilisent Bricolage Grotesque en graisse 800.

## Sources réelles de la typographie
| Source | Rôle |
|---|---|
| `public/css/style.css` `:root` (`--font-body`, `--font-display`) | Jetons lus par l'administration, le LMS, `marketing.css`, `dashboard.css`, `kola-brand.css` (`--kb-display`) : ~100 règles `font-family: var(--font-…)` |
| `src/marketing/pages/tokens.js` (`DEFAULT_TOKENS.fonts`, `FONTS`) | Typographie des sites créés avec le CMS → variables `--kw-font-heading/body/button/link` |
| `src/marketing/pages/sitePacks.js` | Polices des packs de démarrage de sites |
| `src/marketing/themes/catalog.js` + bibliothèque de 160 thèmes | Polices choisies par thème (Georgia, Figtree…) |
| `public/fonts/library` + `fontLibrary.js` / `siteFonts.js` | Bibliothèque de polices que l'utilisateur peut choisir |
| `views/partials/header.ejs`, `font-preload.ejs` | Préchargement des deux anciennes polices |
| `style.css` ~l.2381/2391 | Deux règles qui nommaient Bricolage en dur |
| Éditeur de blocs (`data-ff`, `documentMode.js`) | Choix de police par l'auteur d'un article |

Autres familles : `ui-monospace…` (code), `Georgia` (choix serif), `inherit` — conservées.
Aucune dépendance externe (Google Fonts) : déjà vérifié par `tests/refonte-design.test.js`.
