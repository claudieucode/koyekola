# CSS

## Mesures (fichiers locaux, octets)
| Fichier | Brut | gzip 9 | brotli | Minifié (brut) | Minifié gzip | Minifié brotli |
|---|---|---|---|---|---|---|
| `css/landing.css` | 126 946 | 27 938 | 23 376 | 100 368 | 20 143 | 17 385 |

## Fait
- Minification à la volée de `landing.css` (voir `KOLAKISA_JAVASCRIPT_PERFORMANCE_ENGINE.md`, même mécanisme) : **parité visuelle vérifiée** dans Chrome (captures identiques à l'octet près, bureau et mobile).
- Détection : CSS en ligne > 60 Ko, > 3 feuilles bloquantes.

## Non fait
- Suppression de CSS inutilisé, CSS critique, fusion de media queries : **non réalisés**. Le CSS de `landing.css` est partagé par tous les widgets et par l'éditeur ; supprimer une règle « inutilisée » sur une page casserait les autres pages et les états dynamiques. Aucune mesure ne justifie le risque à ce stade.
- Les styles par élément et responsive du Page Builder sont générés par `pageNodes.pageCss` dans le HTML (donc non cachés par le navigateur) : signalé par la règle `css-inline` au-delà de 60 Ko.
