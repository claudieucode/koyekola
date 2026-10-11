# Carte de l'architecture du noyau

L'éditeur n'est **pas** une application à composants (pas de React) : JavaScript « vanilla » côté navigateur + rendu EJS côté serveur.

## Acteurs
| Rôle | Fichier(s) | Remarque |
|---|---|---|
| Point d'entrée de l'éditeur | `views/marketing/page-builder.ejs` + `public/js/page-builder.js` (IIFE unique) | état dans des variables de la fermeture, pas dans un magasin |
| Modules compagnons | `page-builder-{direct,effects,quality,reset,rules,snap,theme,menu,ai,shortcuts}.js` | chacun expose un objet global (`KWReset`, `KWSnap`, `pbEffects`…) |
| Modèle de document (client) | `content = { sections, title, description, seo, theme }` | `sections` = arbre ; `kidsOf(it)` donne les enfants ; `locate(id)` cherche par identifiant (parcours, O(n)) |
| Modèle de document (serveur, vérité) | `nodes.js` `normalizeNode` / `sections.js` `normalizeSections` / `index.js` `normalizeContent` | liste blanche des réglages, bornes, unicité des identifiants |
| Enregistrement | `PUT /marketing/pages/:id/brouillon` → `saveDraft` (`index.js`) | révision optimiste, 409 en cas de conflit, historique commun |
| Canevas | `<iframe data-pb-frame>` alimenté par `POST /marketing/pages/:id/rendu` | rendu serveur du document entier, comparaison section par section (`patchCanvas`) |
| Rendu | `landing/index.js` (`viewModel`, `nodeView`, `linksOf`) + `_sections.ejs` + `_node.ejs` (+ `_node-safe.ejs`) | même gabarit pour édition, aperçu et page publiée |
| Styles | `nodes.js` `pageCss` / `classCss` ; STYLE_PROPS (110 réglages) | classes `.kw-n-<id>` générées à partir de valeurs validées |

## Chemin d'une modification (ex. couleur d'un bouton)
1. Contrôle de l'inspecteur → `setStyle(...)` → `change(fn, opts)`.
2. `change` : copie JSON du document dans la pile d'annulation (sauf frappes successives du même champ, clé identique), exécute `fn`, puis `afterChange`.
3. `afterChange` : calques (reportés si saisie), inspecteur, barre de contexte, **`scheduleRender`** (0 / 30 / 50–150 ms selon le rythme) et **`scheduleSave`**. Chaque sous-étape est isolée par `guarded()` : une erreur secondaire n'empêche ni le rendu ni l'enregistrement.
4. `renderCanvas` → `POST /rendu` → `patchCanvas` remplace seulement les sections modifiées ; sections interactives, scripts, en-tête/pied → rechargement du cadre.
5. `save` → `PUT /brouillon` : le serveur renormalise tout le document, renvoie `revision` et `warnings`; `healIgnored` retire du document local les réglages écartés par le serveur.

## Identifiants
Éléments : `NODE_ID` (12 caractères), uniques par page (contrôlé par `counter.ids`), sections comprises. Créés par `newId()` côté client ; `reId`/`reIdAll` en fabriquent de neufs pour toute copie (duplication, collage, modèles, composants) en **redirigeant les références internes** (correction D1).

## Références entre éléments
Seule référence croisée existante : `interactions[].target` (identifiant d'un autre élément). Les autres liens passent par des ancres, des composants (`componentId`) et des médias (adresses), pas par l'identifiant d'un élément.
