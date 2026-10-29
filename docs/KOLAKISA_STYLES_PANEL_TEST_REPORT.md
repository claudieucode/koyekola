# Apparence → Styles : rapport de tests (correctif d'alignement)

Chrome réel (Playwright), serveur de test local, 2026-10-28.

## Nouveau : `tests/styles-panel-alignement-navigateur.test.js`
Mesure les boîtes réelles : aucun élément hors du panneau, pas de défilement horizontal, contrôles à droite du libellé, pastilles sans chevauchement et de taille uniforme, chaque palette contient aperçu + nom dessous, cartes sans chevauchement ; géométrie inchangée après modification d'une couleur ; aucun débordement dans les 4 onglets.
Largeurs : 1440, 1100, 900 px, zoom CSS 150 %. Résultat : **5/5** (après correction de l'attendu du zoom : 24 px × 1,5 = 36 px, défaut du test et non de l'interface).

## Régression
`node --test` sur `styles-panel-alignement-navigateur`, `apparence-styles-navigateur`, `apparence-styles`, `styles-globaux-navigateur`, `cadre-cms-structure` : 43 tests, 41 réussis, **2 échecs**, tous deux **reproduits sans ma modification** (cms.css/cms-styles.js remis à l'état d'origine par `git stash`) :
- « typographie, formes et boutons… » : `'10px' !== '30px'` (arrondi des champs du guide) — échec existant, non traité ici (hors périmètre mise en page, à investiguer séparément).
- « aperçu de la PAGE RÉELLE… » : délai dépassé en attendant `--kw-primary` dans l'iframe ; échoue aussi isolé sans ma modification ; il avait réussi dans une exécution complète de référence → dépendant de l'ordre / instable. Non causé par ce correctif.
- Le test « couleur invalide… » échouait en référence et réussit avec le correctif (observé une fois ; non étudié davantage).

## Non exécuté
Publication sur un environnement réel ; Firefox/Safari ; mobile < 700 px (voir LIMITATIONS).

## Captures
Après correction : `docs/styles-panel-captures-apres/` (palette 1440/1100/900/zoom 150 %, onglets). Capture « avant » : celle de l'utilisateur, non versionnée.
