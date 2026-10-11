# Rapport d'implémentation — mission 6

## Code de production modifié (1 fichier)
`public/js/page-builder.js`, dans `resizeStart` (fin de geste) :
* **D1** : l'unité propre ou héritée de la dimension (`%`, `rem`, `em`, `vw`, `vh`) est conservée ; le facteur px ↔ unité est mesuré au début du geste.
* **D2** : une borne min. / max. déclarée empêche l'enregistrement de la taille demandée (message) ; borne lue dans le style calculé (pourcentages résolus sur le parent).

## Tests
`tests/edition-visuelle-navigateur.test.js` (6 tests, Chrome, vraies souris) : clics sans effets de visiteur ; redimensionnement (%, px, auto, annulation) ; borne max. ; tablette seule ; glisser-déposer (cycle refusé, 0 perte, annuler / rétablir, rechargement) ; duplication imbriquée (identités, classes, `token:`, écrans, sélection, annuler / rétablir, suppression). Les deux tests de redimensionnement échouent sans le correctif (vérifié).

## Étape intermédiaire à connaître
Une première version de D2 comparait la taille **rendue** à la valeur demandée. Elle a cassé `editeur-regles-magnetisme` (T9) : en Flexbox la taille rendue diffère normalement de la valeur (rétrécissement). Détectée par la régression, elle a été remplacée par la lecture des bornes **déclarées**.

## Non modifié
Sélection, glisser-déposer, duplication, suppression, historique, poignées d'écart : aucun défaut démontré.
