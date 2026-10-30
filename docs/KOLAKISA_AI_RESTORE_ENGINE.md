# Restore Engine

`src/regen/restore.js`.

## Ce qui se restaure
Un **élément** (widget), une **section** (y compris depuis un snapshot de page), une **page**, plusieurs pages (snapshot de **site**), le **design**, le **site** (pages + design). Restauration **partielle** d'une section ou d'un élément depuis un snapshot de page.

## Garanties
1. **Nouvelle opération** (`kind: restore`, parent) ; l'état d'avant est conservé dans un snapshot « avant » ; la restauration elle-même s'annule.
2. Écriture dans le **brouillon** par `pages.saveDraft` (normaliseurs natifs, révision) ; page invalide → refus, rien d'écrit. Jamais de publication.
3. **Verrous** : page ou design verrouillé → refus ; section verrouillée → refus (restauration ciblée) ou **conservée** (restauration de page, signalée) ; élément verrouillé → refus.
4. **Conflits** : si l'état actuel de l'élément n'est dans aucune version connue (modification manuelle récente), refus `conflict` avec la résolution possible ; `restoreAnyway` explicite continue, l'état actuel reste dans l'historique.
5. Section/élément supprimé depuis : **réinsertion à sa position d'origine** (élément : sa section doit exister). Page supprimée ou archivée : ignorée et signalée (restauration de site).
6. Site : design d'abord ; si les pages échouent, le design est remis dans son état d'avant (compensation) ; les pages sont dans une transaction.

## Annuler / rétablir (opération logique)
`undo` restaure le snapshot « avant » de l'opération, **seulement** si l'état actuel est celui que l'opération a produit (sinon conflit + confirmation) ; `redo` restaure le snapshot « après ». Plusieurs modifications techniques d'une demande = une opération (testé : section de texte).

## Limites
Une opération `image` n'a pas de réversion d'association propre (l'association relève du 21.7 : « restaurer » existe là-bas) ; la restauration du design écrit le brouillon du personnalisateur, jamais la version publiée ; restauration de médias supprimés non gérée (références seulement).
