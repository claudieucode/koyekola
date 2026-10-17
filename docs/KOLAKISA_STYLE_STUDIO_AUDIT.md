# KOLAKISA Style Studio — audit (LOT 0)

| Capacité | État constaté | Décision |
|---|---|---|
| Styles réutilisables = **classes globales du site** (`settings.classes`, `normalizeClassDefs`, `classCss`, `:where()`, le style propre de l'élément l'emporte) | présent et fonctionnel, **lié** (modifier = tout suit) | **conservé** comme moteur unique |
| Lien élément ↔ style (`node.classes`) | présent, fiable | réutilisé |
| Enregistrer comme style | avant : tout ou rien (copie de *tous* les réglages, structure comprise) ; corrigé dans la mission précédente (catégories) | étendu (nom affiché, aperçu, redéfinition) |
| Appliquer | une case à cocher (= mode « compléter » implicite) | **deux modes explicites** |
| Mise à jour d'un style | fusion silencieuse | **redéfinition explicite** avec conséquences affichées |
| Dissocier | absent | **ajouté** (copie les valeurs là où l'élément n'a rien, coupe le lien) |
| Supprimer un style | retirait l'apparence des éléments sans prévenir | **dissocie d'abord** les éléments de la page |
| Bibliothèque | absente (liste de cases dans l'inspecteur) | **ajoutée** (dialogue) |
| Menu contextuel | « Copier / Coller le style » seulement | entrées « Style » |
| Copier / Coller le style (presse-papiers, par groupe d'inspecteur) | présent et fonctionnel ; non lié, distinct des styles enregistrés | inchangé |
| Écrans / états | styles et états gérés par le modèle (`styles.{desktop,tablet,mobile}`, `states.{hover,focus,active}`) | réutilisés tels quels |
| Annulation | `change()` central | toutes les opérations y passent |
| Portée | site seulement (aucune portée « page » ni « globale entre sites » dans l'architecture) | documenté, non inventé |
| Animations d'entrée / défilement / souris | propriétés du **nœud**, pas de ses styles | non transportées par un style |
| Parties de widgets (`parts`) | sous-zones à part | non incluses |

Causes des défauts : pas de notion de sélection (tout était copié), pas de distinction « remplacer / compléter », pas d'opération de dissociation ni de redéfinition, suppression destructrice. Aucune migration : `label` existait déjà ; `meta` est facultatif (les anciens styles ont leurs catégories déduites de leurs propriétés).
