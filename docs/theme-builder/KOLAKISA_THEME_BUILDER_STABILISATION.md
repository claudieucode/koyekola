# Theme Builder — audit de stabilisation (novembre 2026)

## Cartographie
Modèle (`mk_tb_templates`, par site) → document source (`mk_landing_pages` pour les pages, `mk_web_components` pour en-tête / pied / barre latérale) → éditeur existant (`/marketing/pages/:id/editeur`, `/marketing/site-web/composants/:id/editeur`) → publication → résolution (`themeBuilder/resolve.js`) → rendu (`themeRender.js`).

## Anomalies et causes racines
| # | Anomalie | Cause racine | Correction |
|---|---|---|---|
| 1 | L'éditeur ouvert depuis le Constructeur de thème ne dit pas quel modèle il édite ; le retour mène aux Pages ou aux réglages d'en-tête | L'éditeur ne connaissait que le document, jamais le modèle qui le porte | `store.byDocument()` (source de vérité « document → modèle », filtrée par organisation, site recoupé) ; le contexte `themeTemplate` (id, site, type, état, retour) est fourni à l'éditeur, affiché en pastille (type · état) et le retour mène au Constructeur de thème |
| 2 | « Publier » dans l'éditeur publiait la page-modèle comme une page publique autonome (`/p/<adresse>` répondait 200) alors que le modèle restait en brouillon, sans contrôle de conflit ni version | Deux chemins de publication concurrents pour le même objet | La publication (et la dépublication) du document d'un modèle passent par le service du modèle : mêmes conflits, même version, même état |
| 3 | Une page-modèle apparaissait au plan du site et sous `/p/<adresse>` | Aucune distinction entre page autonome et contenu de modèle | `getPublishedPage(db, slug, { standalone: true })` pour les routes publiques ; exclusion au plan du site. Le rendu du thème continue de lire la page sans cette option |
| 4 | « Dépublier » dans l'éditeur laissait un modèle « publié » sans contenu en ligne (repli silencieux sur un autre rendu) | Même cause que 2 | Dépublier la page d'un modèle dépublie le modèle |

## Tests (`tests/theme-builder-stabilisation.test.js`, 14)
Pour chacun des 9 types du catalogue : « Utiliser » → ouverture dans l'éditeur → bon document, bon site, contexte du modèle, contenu réel. Puis : enregistrement dans le bon document, publication et résolution, isolation entre sites sur 12 routes, publication / dépublication depuis l'éditeur, conflit bloquant refusé aussi depuis l'éditeur.

## Reste à faire / limites
- Tests navigateur (canvas / Structure / propriétés, sélection) non exécutés ici : les suites `*-navigateur` se sautent sans navigateur piloté ; la synchronisation de sélection n'a donc pas été re-testée visuellement.
- Pas de sauvegarde automatique spécifique au modèle : l'éditeur garde son propre brouillon (révision vérifiée, conflit 409).
- Les composants (en-tête, pied) gardent « Mettre à jour » de l'éditeur : il met à jour le contenu en ligne du composant ; l'état du modèle reste géré dans le Constructeur de thème.
