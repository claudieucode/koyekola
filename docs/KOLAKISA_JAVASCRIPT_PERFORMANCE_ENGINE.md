# JavaScript et minification à la volée

## Audit
Scripts publics : `landing.js` (42 499 o), `kw-effects.js` (17 843 o), `visitor.js` (10 203 o, absent des aperçus). **Tous en `defer`**. Pas de bibliothèque tierce. Le code de l'éditeur (`page-builder.js` 581 690 o) n’est pas référencé par le gabarit des pages publiques (`landing.ejs` : `landing.css` + ces 3 scripts).

## Minification (`src/perfEngine/minify.js`)
Le déploiement n'a pas d'étape de build ; `esbuild` est une **devDependency**. Choix : minifier **à la première demande**, garder en mémoire (clé chemin + date + taille).
- Liste blanche : `css/landing.css`, `js/landing.js`, `js/kw-effects.js`, `js/visitor.js`.
- Seulement les adresses versionnées `?v=…` (déjà `immutable`).
- Actif en production ou avec `KOLAKISA_MINIFY=1` ; **`KOLAKISA_MINIFY=0` le coupe**.
- Repli silencieux sur l'original si `esbuild` est absent, en erreur, ou si le résultat n'est pas plus petit.
- ETag propre, réponse 304 testée. En-tête `X-Kolakisa-Minified: 1`.

## Mesures (Chrome 150, `Network.loadingFinished.encodedDataLength`, cache désactivé, page de test)
| Ressource | Original | Minifiée |
|---|---|---|
| landing.css | 29 547 | 22 103 |
| landing.js | 12 591 | 8 601 |
| kw-effects.js | 6 704 | 4 191 |
| visitor.js | 4 869 | 2 972 |
| **Total** | **53 711** | **37 867** (−15 844 o, −29,5 %) |

Parité : captures pleine page identiques (SHA-1) bureau 1280 et mobile 390 ; 0 erreur JS ou console.

## Non fait
Code splitting, chargement conditionnel par widget (le gain n'est pas mesuré : 3 scripts totalisant 38 Ko après minification), tree shaking.
**Réserve** : la production n'a pas pu être vérifiée ; si `esbuild` n'y est pas installé, la minification ne s'applique pas (repli sans effet). Vérification : en-tête `X-Kolakisa-Minified` sur une ressource `?v=`.
