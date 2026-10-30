# Programme 21.5 — AI Design Generator : implémentation

## Audit initial (état réel)
- `origin/main` au commit `01247a32`. Présents : Page Generator (21.4), assistant de création (20.6), Theme Builder (20.3) et un **Kolakisa AI Core** (21.2, `src/ai`) qui est **prêt mais non branché** en production. Le Brief Analyzer et le Site Planner n'existent pas.
- Système de design réel : jetons de site (`pages/tokens.js` : couleurs, polices, échelle typographique, espacements, rayons, ombres, boutons, formulaires, images), réglages de site (`pages/siteSettings.js` : mise en page, responsive par écran), **personnalisateur** (`services/customizer.js` : catalogue fermé de 134 réglages, brouillon avec verrou optimiste, aperçu, publication, versions). Aucune propriété de widget par style n'est exposée en dehors de ces réglages et des attributs de section (espacement, fond, alignement, largeur).
- Décision : le générateur **écrit dans le brouillon du personnalisateur** (le seul chemin natif et sûr), jamais ailleurs, jamais publié.

## Livré
`src/designGen/{color,analyzer,typography,design,index}.js`, routes `src/marketing/web/designGenerator.js`, vue `views/marketing/site-design-generator.ejs`, tests `tests/design-generator.test.js` (25), évolution minime du Page Generator (`mapper.styleFor(type, index, layout)` et option `layout`). Écran : `/marketing/site-web/sites/:id/direction-artistique` (liens depuis l'étape Identité de l'assistant).

## Flux
Brief (texte libre + type de site) → analyse déterministe → (IA facultative : choix dans des listes) → 3 variantes d'une même structure → validation → proposition enregistrée → comparaison avant/après → application dans le brouillon → annulation. Les 93 réglages produits par variante sont des chemins du personnalisateur.

## Base de données
Table `mk_design_runs` créée à la demande (migrations figées par test). Aucune donnée existante modifiée.
