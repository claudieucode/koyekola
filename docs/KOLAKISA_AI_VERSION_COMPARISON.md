# Version Comparison Engine

`src/regen/compare.js`. Compare deux snapshots du **même niveau**, ou une version et l'**état actuel** (`vs=actuel`).

## Résultat
`{ identical, changes[], summary }` ; chaque différence : `path`, `kind` (`added`, `removed`, `changed`, `moved`), `category` (`content`, `style`, `media`, `structure`), `before`, `after`.

- Sections appariées par **identifiant** : ajout, suppression, déplacement (position avant/après), puis différences interne (chemins `section:<id>.…`).
- Page : titre, description, SEO, thème. Section / élément : différences de propriétés. Design : changements de réglages. Site : page par page + design.
- **Versions identiques → aucune différence** (`identical: true`, `changes: []`) : rien n'est fabriqué.
- Catégorie déduite du chemin : média (`image`, `src`, `alt`…), style (`style`, `theme`, `padding`…), sinon contenu.

## Interface
Onglet « Historique et versions » : bouton « Comparer à l'actuel » (40 premières différences, avant/après côte à côte, compteurs par catégorie). La comparaison de deux versions quelconques est disponible par l'API (`/api/comparer?a=&b=`) ; **pas encore de sélecteur de deux versions dans l'écran**.

## Limites
Pas de comparaison visuelle (rendu côte à côte) : les aperçus natifs des révisions existent dans l'écran d'historique du CMS ; pas de détection de renommage d'identifiant.
