# Audit des états et des mises à jour

## États
| État | Où | Source de vérité |
|---|---|---|
| Document | `content` (variable de fermeture) | unique ; serveur renormalise à l'enregistrement |
| Sélection | `selection` (liste d'identifiants) | identifiants, jamais références d'objets ; filtrée après suppression / restauration |
| Historique | `past` / `future` (copies JSON), 150 étapes, libellés parallèles | `change()` / `undo()` / `redo()` |
| Référence « enregistré » | `saved` (KWReset.Baseline) | alimente les icônes de réinitialisation |
| Enregistrement | `dirty`, `saving`, `blocked`, `revision` | `save()` |
| Interface | `store` (localStorage) : panneaux, zoom, aides | séparé du contenu, jamais enregistré dans la page |

## Boucles et mises à jour inutiles recherchées
- Enregistrement qui se redéclenche : non (`saving` reporte à 500 ms ; `healIgnored` ne marque pas le document comme modifié).
- Rendu qui se redéclenche : non ; geste en cours (`gesture`, `editing`) → rendu différé puis unique.
- Reconstruction des calques : par ligne, signature `rsig` (type, nom, masqué, verrouillé, note, état déplié…) : seules les lignes changées sont refaites.
- Rafale de 40 frappes : **1 rendu, 1 enregistrement** (mesuré).
- Modifier un réglage ne désélectionne pas l'élément et ne change aucun identifiant (testé en navigateur).

## Défaut trouvé
D2 (références orphelines après suppression) : `removeItems` ne nettoyait pas les interactions ciblant l'élément retiré. Corrigé dans **la même étape d'historique** (annuler rétablit élément et interactions, testé).

## Non modifié, avec raison
`locate()` est un parcours linéaire appelé à chaque `byId` ; à 400 éléments le coût mesuré reste invisible (sélection synchrone < 10 ms en médiane). Un index serait une optimisation sans gain démontré.
