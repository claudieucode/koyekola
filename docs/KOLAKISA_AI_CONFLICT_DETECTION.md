# Conflict Detection Engine

## Détection (par empreintes, pas par heure)
- À la **proposition** : empreinte de chaque cible (champ, section, élément, page, réglage de design) + révision de la page.
- À l'**application** : si la page a changé mais pas la cible → **fusion sûre** (la modification concurrente est conservée, `merged: true`). Si la cible a changé → `conflict` (409) avec les résolutions `keep_user` / `use_ai` ; rien n'est écrit.
- **Annulation / restauration** : l'état actuel doit être celui produit par l'opération / un état connu ; sinon `conflict` + `restore_anyway`.
- **Design** : réglage modifié depuis la proposition → conflit ; brouillon du personnalisateur contrôlé par sa révision.
- **Protection** : élément modifié depuis la dernière écriture IA → `needs_confirmation` (`allow`) ; verrouillé → `protected` (423).

## Résolutions
| Choix | Effet |
|---|---|
| Conserver la version de la personne | refuser la proposition (`reject`) |
| Utiliser l'IA | `resolve: use_ai` (+ `allow`) : la version écrasée reste dans le snapshot « avant » |
| Fusionner | automatique seulement quand les zones modifiées sont disjointes (cible intacte) |
| Décider | l'interface explique le conflit et demande |

Concurrence à l'écriture : SQLite est synchrone ; `saveDraft` refuse une révision périmée (409) ; les opérations multi-écritures sont en transaction.

## Non couvert
Un média supprimé alors qu'il est utilisé : détecté seulement à la restauration d'une page (aucune vérification d'existence du fichier) ; deux opérations IA **simultanées** sur la même cible : la seconde voit un conflit d'empreinte, pas de verrou de génération.
