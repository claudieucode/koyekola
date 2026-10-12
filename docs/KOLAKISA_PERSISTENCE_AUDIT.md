# Audit de la sauvegarde, de l'historique, de la récupération et de la publication

*Mission 7. Branche `persistance` (partie de `6ef0879`). Audit de la mission 1 (`KOLAKISA_CORE_PERSISTENCE_AUDIT.md`) relu et réutilisé : normalisation serveur, révision optimiste, 409, copie locale. Ici : le **comportement dans le temps** (réponses lentes, erreurs, publication, onglets multiples), mesuré avec un réseau que le test contrôle.*

## 1. Cycle réel d'une modification (lu dans le code, vérifié dans Chrome)
`change()` → `scheduleSave()` : état « Non enregistré », **copie locale** (`localStorage`, `pb-backup-<page>`), minuteur d'**1 s** → `save()` : une seule requête à la fois (`saving`), `PUT /brouillon {content, revision}` → serveur : `normalizeContent`, contrôle des droits, `UPDATE … WHERE revision = ?` (0 ligne → **409**), point d'historique commun → réponse `revision` + `warnings` → « Enregistré à HH:MM » **seulement si rien de plus récent n'est en attente**, copie locale supprimée.
Ordre : un enregistrement à la fois, donc jamais de réponse ancienne qui écrase une plus récente ; une modification pendant un vol déclenche l'envoi suivant (500 ms).

## 2. Mécanismes de reprise (existants)
| Cas | Comportement vérifié |
|---|---|
| Erreur réseau / 5xx | « Erreur d'enregistrement : nouvel essai dans N s » (5 s × N, 25 s au plus, indéfiniment) ; reprise seule ; jamais « Enregistré » |
| Validation refusée (422) | message + élément fautif ; rien n'est enregistré |
| Conflit (409) | éditeur bloqué, message, copie locale gardée ; **la version la plus récente n'est pas écrasée** |
| Fermeture / rechargement avec modifications | alerte du navigateur + copie locale ; au retour, « Une copie non enregistrée… La reprendre ? » |
| Versions | `mk_page_versions` : une version par publication (bornée à 100), liste, comparer, aperçu, **restaurer** (copie dans le brouillon, l'état précédent du brouillon est gardé dans l'historique commun, la page en ligne ne change pas) |
| Historique d'édition | annuler / rétablir (150 instantanés) ; points d'historique du brouillon (`cms_revisions`) |

## 3. Défauts démontrés et corrigés
**D1 — « Publier » pendant un enregistrement en cours (grave).** `saveNow()` répondait « Tout est enregistré » dès que le drapeau « modifié » était retombé, alors que la requête était **encore en vol**. En cliquant sur Publier à ce moment (mesuré : 1,5 s après la modification, réponse du serveur retardée de 3 s) : la page était publiée **sans** la modification, la publication changeait la révision, puis l'enregistrement en vol échouait en **conflit** (« page modifiée ailleurs ») : l'éditeur se bloquait, la modification n'était **jamais** enregistrée sur le serveur (seule la copie locale la gardait). Correction : le suivi de la requête en vol (`inflight`) ; `saveNow()` l'attend puis envoie ce qui est arrivé entre-temps ; la publication passe par `saveNow()` ; l'aperçu et l'export aussi. Test : échoue sans correctif.

**D2 — l'aperçu s'ouvrait sur une ancienne version quand l'enregistrement échouait**, sans prévenir. L'aperçu n'est plus ouvert dans ce cas ; un message l'explique.

**D3 — session expirée annoncée comme « Erreur d'enregistrement » (essais sans fin, sans explication).** Un statut 401 affiche maintenant « Session expirée : reconnectez-vous (dans un autre onglet). Nouvel essai dans N s » ; les essais reprennent seuls une fois reconnecté, sans perte (copie locale).

**D4 — republier sans changement fabriquait une version identique à chaque fois** (mesuré : 3 publications → versions 1, 2, 3 identiques). Avec un historique borné à 100, des clics répétés chassent de vraies versions. Correction : si le contenu est identique à la dernière version, aucune copie n'est créée (le statut « en ligne » est quand même rétabli après une dépublication).

## 4. Vérifié correct (sans changement)
Deux modifications rapprochées avec une réponse lente : elles arrivent dans l'ordre, la dernière l'emporte ; annuler pendant un enregistrement est enregistré à son tour ; deux onglets : l'onglet périmé est bloqué et n'écrase pas ; deux enregistrements simultanés avec la même révision : exactement un gagne ; un enregistrement refusé ne modifie ni brouillon ni révision ; aller-retour sans perte (classes, `token:`, valeurs d'écran).
