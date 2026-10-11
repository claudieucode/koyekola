# Rapport d'implémentation

## Corrections (chacune : défaut → cause → correction → test)

**D1 — Copie qui pilote l'original.** Cause : `reId` ne changeait que les identifiants. Correction : `reId(it, map)` mémorise ancien → nouveau, `reIdAll(items)` redirige ensuite `interactions[].target` vers les copies ; une cible extérieure à la copie reste inchangée. Utilisé pour dupliquer, coller (interne et presse-papiers système), insérer un modèle et un composant. Fichier : `public/js/page-builder.js`. Test : `noyau-integrite-navigateur` (« dupliquer un conteneur… »).

**D2 — Interactions orphelines.** Cause : aucune vérification des cibles. Correction : (client) `removeItems` retire, dans la même étape d'historique, les interactions vers les éléments supprimés ; (serveur) `pruneDanglingInteractions` dans `sections.js` écarte les cibles absentes avec un avertissement `interaction_target` que l'éditeur applique (`healIgnored`). Tests : `noyau-integrite` (serveur, échoue sans la correction) et navigateur (suppression, annulation, rétablissement).

**D3 — Une erreur de rendu faisait tomber la page.** Correction : `views/marketing-public/_node-safe.ejs`, utilisé à chaque niveau de récursion (`_node.ejs`, `_sections.ejs`) ; journalisation ; repère sélectionnable dans l'éditeur (`.kw-node-error` dans `landing.css`) ; rien n'est modifié dans les données. Test : `noyau-resilience`.

**D4 — Liens cliquables.** `linksOf` : tolérance par élément ; le compteur du rendu est recalé (`href.mark/skip`, `res.locals.nodeLinkCount` dans `middlewares/locals.js`). Test : `/clic/1` redirige vers la bonne adresse malgré l'élément corrompu.

**D5 — Limites non vérifiées dans l'éditeur.** `exceedsLimits` (400 éléments, 8 niveaux, valeurs de `SPEC.limits`) avant tout ajout/collage/modèle ; contrôle équivalent pour la duplication. Test : duplication refusée à 397 éléments, aucune copie, aucune erreur d'enregistrement.

## Ce qui n'a pas été fait, volontairement
Pas d'index d'identifiants, pas de changement de l'historique par instantanés, pas de réécriture du rendu : aucune mesure ne les justifie (`KOLAKISA_CORE_PERFORMANCE_BASELINE.md`).

## Fichiers
`public/js/page-builder.js`, `src/marketing/pages/sections.js`, `src/marketing/landing/index.js`, `src/middlewares/locals.js`, `views/marketing-public/{_node,_sections,_node-safe}.ejs`, `public/css/landing.css`, tests `noyau-integrite{,-navigateur}`, `noyau-resilience`, 10 documents `docs/KOLAKISA_CORE_*.md`.
