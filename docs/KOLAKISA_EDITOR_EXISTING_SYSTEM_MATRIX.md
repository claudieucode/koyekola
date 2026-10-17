# KOLAKISA — Matrice du système existant de l'éditeur de pages (LOT 0, lecture seule)

Date : 2026-10-10. **Aucun code n'a été modifié pour ce document.** Méthode : lecture du code (fichiers et fonctions cités), exécution du registre `nodes.js` (voir `KOLAKISA_EDITOR_PROPERTY_AUDIT.md`), et tests navigateur **rejoués aujourd'hui** (colonne « Tests »). Ce qui n'a pas été rejoué est dit « d'après les tests existants ».
États : FONCTIONNEL · FONCTIONNEL MAIS LIMITÉ · IMPARFAIT · BUGUÉ · PARTIEL · ABSENT · DUPLIQUÉ · À INVESTIGUER · NON APPLICABLE.
Documents voisins (pas de doublon créé) : `KOLAKISA_EDITOR_PARITY_MATRIX.md` (comparaison Elementor), `KOLAKISA_EDITOR_EXCELLENCE_MATRIX.md` (acquis et lots déjà exécutés), `perf-page-builder.md` (base de performance et protocole), `WIDGETS-INVENTAIRE.md`, `CONTROLES-NUMERIQUES.md`, `EDITEUR-DROITE.md`, `regles-et-magnetisme.md`. Les fichiers `…REGRESSION_REPORT` et `…PERFORMANCE_BASELINE` demandés ne sont pas créés : la régression est portée par la suite de tests (`tests/editeur-*`, `tests/page-builder-*`, 83 fichiers liés à l'éditeur sur 311) et la base de performance par `perf-page-builder.md`.

## 1. Architecture (vérifiée)

- **Aucun framework** : un seul script `public/js/page-builder.js` (6 508 lignes) + `page-builder-effects.js`, `-menu.js`, `-rules.js`, `-snap.js`, `-theme.js`, `font-manager.js`, `site-settings.js`, `kol-motion.js`. Pas de React, pas de rerender global : l'interface est dessinée à la main avec des fonctions ciblées.
- **Canevas = iframe du vrai rendu serveur** : `POST /marketing/pages/:id/rendu` renvoie le HTML public en mode « builder » ; `patchCanvas()` ne remplace que les sections modifiées ; `drawOverlays()` dessine sélection et poignées dans l'iframe, hors flux.
- **Modèle** : `sections[]` → `{ id, type, children[] }` ; élément `{ id (stable, validé), type, props, styles{ordinateur|tablette|mobile : {propriété: valeur}} + états, name, hidden, locked, anchor, audience, hideOn, motion/scroll/mouse, classes, css, attrs, interactions, children }`. Limites : 400 éléments, 30 sections, 8 niveaux. Validation et assainissement **côté serveur** (`normalizeNode`).
- **Rendu publié** : `views/marketing-public/_sections.ejs` / `_node.ejs` + CSS généré (`pageCss`) ; les aides d'édition (`kw-add`, guides, poignées) n'existent qu'en mode builder (test existant).

## 2. Matrice

| # | Fonctionnalité | Fichiers / fonctions | État | Fonctionnement actuel | À préserver | Amélioration éventuelle | Risque de régression | Tests (rejoués aujourd'hui sauf mention) |
|---|---|---|---|---|---|---|---|---|
| 1 | Canevas (iframe, rendu, zoom, défilement) | `renderCanvas`, `patchCanvas`, `applyZoom`, `setZoom` | FONCTIONNEL | rendu serveur identique au public ; mise à jour par section ; zoom 0,25–2 et « ajuster » | stabilité du défilement, pas de remontage | aucune urgente | élevé (cœur) | `editeur-stabilite`, `editeur-canvas-*` (stabilité rejouée) |
| 2 | Sélection (simple, multiple, parent, Ctrl+A) | `select()` | FONCTIONNEL | depuis canevas et calques ; sans remontage | focus et défilement conservés | — | moyen | `editeur-structure-navigateur` (rejoué) |
| 3 | Structure / calques | `renderTree` | FONCTIONNEL | arbre différentiel, renommer, masquer, verrouiller, dupliquer, glisser-déposer, recherche | identifiants stables | — | moyen | `editeur-droite-navigateur`, `editeur-structure-navigateur` (rejoués) |
| 4 | Inspecteur (Général / Style / Interactions) | `renderInspector`, `INSPECTORS` | FONCTIONNEL | fiches par type ; les widgets personnalisés reçoivent à l'exécution une fiche « boîte » ou « texte » complète (**correction** : une première version de ce document les croyait sans fiche) | accordéons, disposition | états pour davantage de types | faible | contraste, droite (rejoués) |
| 5 | Contrôles numériques | `numericControl`, `numField`, `numberControl` | FONCTIONNEL | un composant : saisie, ▲▼ visibles, unité, curseur, glissement sur le libellé, aucune liste au focus | contrat « un clic = saisir » | — | moyen | 6 fichiers rejoués ; le **défaut de glissement sur le libellé a été corrigé** le 10/10 (cause : enveloppe « valeur du site ») |
| 6 | Espacement (marge / intérieur) | `spacingBox` | FONCTIONNEL | deux blocs, liaison indépendante, unités, valeurs globales | séparation marge / intérieur | — | moyen | `editeur-espacement-navigateur` (8/8 rejoué) |
| 7 | Curseurs | `.pb-nc-range`, `paintRange` | FONCTIONNEL | aspect unifié, jetons `--pb-slider-*` | valeurs et bornes | — | faible | `editeur-curseurs-apparence`, `editeur-ecart-curseur` (rejoués) |
| 8 | Styles (modèle, par écran, par état) | `STYLE_PROPS` (86), `normalizeStyles`, `setStyles` | FONCTIONNEL | héritage ordinateur → tablette → mobile ; valeur propre vs héritée affichée | format d'enregistrement | voir PROPERTY_AUDIT § 6 | élevé (format) | `editeur-canvas-proprietes-effectives` (rejoué) |
| 9 | États (survol / focus / clic) | `states` des fiches | FONCTIONNEL MAIS LIMITÉ | **mis à jour** : survol pour 18 types de contenu + tous les widgets personnalisés ; boutons, liens, images, menus : survol / focus / clic ; conteneur : survol + clic | existant | focus et clic pour d'autres types : seulement s'ils sont interactifs | moyen | `editeur-controles-complets-navigateur` (rejoué) |
| 10 | Responsive | `BREAKPOINTS` (3), `hideOn`, styles par écran | FONCTIONNEL | tablette ≤ 1023 px, mobile ≤ 767 px ; masquage par écran | seuils | écrans personnalisés : **ABSENT** | moyen | `site-web-reglages-ecrans` (existant) ; espacement (rejoué) |
| 11 | Mise en page des conteneurs | fiches `container`, `grid`… | FONCTIONNEL | flex, grille, ordre, grow/shrink/basis, écarts | — | mots-clés de dimension (`fit-content`…) **ABSENT** | moyen | `editeur-canvas-containers` (rejoué) |
| 12 | Dimensions | `lengthOf` (serveur), liste d'unités du client | FONCTIONNEL | **mis à jour** : nombre + unité, `auto`, `fit-content`, `min-content`, `max-content` (liste fermée) ; `clamp()` / `calc()` refusés volontairement | validation stricte (sécurité) | — | moyen (validateur + CSS) | `editeur-controles-complets-navigateur` (rejoué) |
| 13 | Position | `position`, `zIndex`, `top…left` | FONCTIONNEL | static, relative, sticky, absolute, fixed ; plan | — | doc `editeur-pages-audit.md` périmée | faible | `editeur-canvas-proprietes-effectives` (rejoué) |
| 14 | Transitions | `transitionDuration`, `transitionEasing` | FONCTIONNEL | **mis à jour** : durée + accélération (5 choix) ; propriétés animées fixes | — | choix des propriétés : non fait | faible | `editeur-controles-complets-navigateur` (rejoué) |
| 15 | Animations, défilement, souris, sticky, transformations | `normalizeMotion`, `kol-motion.js` | FONCTIONNEL | moteur de mouvement (63 animations) ; 84/86 types ; sticky 6/86 | — | — | moyen | d'après `MOTION-ENGINE.md` |
| 16 | Interactions (déclencheur → action) | `normalizeInteractions` | FONCTIONNEL | clic, survol, entrée à l'écran, chargement ; 6 par élément ; cible = autre élément | — | — | moyen | d'après tests existants |
| 17 | Historique | `change`, `undo`, `redo` | FONCTIONNEL | 150 instantanés JSON, regroupement par clé, libellés | un geste = une étape | — | élevé | raccourcis et curseurs (rejoués) |
| 18 | Enregistrement | `scheduleSave`, `save`, `saveNow` | FONCTIONNEL | 1 s après la dernière modification, un enregistrement à la fois, révision et conflit (409), copie locale | non bloquant | — | élevé | `editeur-raccourcis` (Ctrl+S rejoué) |
| 19 | Publication, versions, restauration | routes `publier`, `versions/:n/restaurer`, `depublier` | FONCTIONNEL | publication par permission `pages.publish` ; versions comparables et restaurables | — | — | élevé | d'après tests existants |
| 20 | Éléments réutilisables | `renderComponents`, `renderBlocks` | FONCTIONNEL | composants par site ou globaux, insérés en **copie indépendante** | — | pas d'instance liée (choix assumé) | moyen | `editeur-blocs-reutilisables` (existant) |
| 21 | Styles globaux | `tokens.js`, classes globales, réglages du site | FONCTIONNEL | couleurs, espacements, rayons, tailles de texte = références réelles ; classes globales ; modèles de thème | références, pas de copies | — | moyen | `editeur-classes-globales`, `site-web-reglages*` (existant) |
| 22 | Polices | `font-manager.js` | FONCTIONNEL | bibliothèque chargée à la première ouverture du sélecteur | chargement différé | — | faible | d'après tests existants |
| 23 | Copier / coller, dupliquer, style | `copySelected`, `paste`, `duplicateSelected`, `copyStyle`, `pasteStyle` | FONCTIONNEL | copie vers une autre page ; collage du style par groupe (Ctrl/⌘ + Maj + V) | identifiants régénérés | — | moyen | `editeur-raccourcis` (rejoué), `editeur-styles-globaux` (existant) |
| 24 | Glisser-déposer | `draggableSource`, dépôt calques / canevas | FONCTIONNEL | 60 images/s mesurées (banc) | — | pointes à 300–400 éléments | moyen | banc de performance (rejoué le 10/10) |
| 25 | Règles, guides, grille, magnétisme | `page-builder-rules.js`, `-snap.js` | FONCTIONNEL | préférences d'interface (rien dans la page publiée) | séparation interface / contenu | — | moyen | `editeur-regles-magnetisme` (72/72 rejoué avec le menu) |
| 26 | Palette de commandes | `commandList`, `openCommands` | FONCTIONNEL | Ctrl/⌘ + K ; ajout de tout widget et ~45 actions | — | recherche élargie : à étudier | faible | d'après tests existants |
| 27 | Barre d'actions contextuelle | `placeCanvasBar` | FONCTIONNEL | actions sur l'élément sélectionné (le « + » rond redondant a été retiré) | — | audit détaillé non fait | faible | `editeur-canvas-containers` (rejoué) |
| 28 | Thèmes de l'éditeur (clair / sombre) | jetons `--editor-*` | FONCTIONNEL | tous panneaux et menus ; accent suivi | contrastes ≥ 4,5:1 | — | faible | `editeur-contraste`, `editeur-theme-atomique` (rejoués) |
| 29 | Sélecteur de mode (visuel / blocs) | `setMode` | FONCTIONNEL | un seul contrôle segmenté | raccourci Ctrl/⌘ + Maj + E | — | faible | `editeur-mode-switch` (9/9 rejoué) |
| 30 | Widgets (86 types) | `NODE_TYPES`, `WIDGETS`, `widgets/*.js` | FONCTIONNEL | 79 opérationnels + 7 contextuels ; contrat de conformité | contrat de widget | états pour les widgets personnalisés | moyen | `widgets-contrat` (6/6 rejoué) |
| 31 | Accessibilité du rendu | `_node.ejs` | FONCTIONNEL | balise sémantique, `aria-…`, `role`, `lang`, texte alternatif exigé à la publication ; **audité le 10/10 sur les 86 widgets publiés ensemble : aucun défaut sur les règles automatisables** | — | contraste et parcours clavier complet : non mesurés | faible | `rendu-accessibilite-navigateur` (6/6) |
| 32 | Sécurité du contenu | `sanitizeRich`, `sanitizeHtmlBlock`, `cssDeclarations`, permissions | FONCTIONNEL | HTML sécurisé réservé à `pages.code` ; CSS filtré | — | — | élevé si modifié | d'après tests existants |

## 3. Duplications et incohérences repérées

1. **Deux façons de masquer par écran** : `hideOn` (case par écran, classes `lp-hide-*` en `display:none` dans une requête média, écrites **après** les styles) et `display: none` dans les styles d'un écran. **Clarifié** : les deux se cumulent (l'élément est masqué si l'un OU l'autre masque) ; `hideOn` l'emporte sur un `display` réglé pour le même écran. Aucune correction nécessaire.
2. **Deux documents de matrice voisins** (`PARITY` et `EXCELLENCE`) : complémentaires (comparaison Elementor / acquis) mais à relier ; aucun contenu contradictoire relevé.
3. ~~Documentation périmée~~ — **corrigée** : `editeur-pages-audit.md` (position absolue).
4. **Plusieurs raccourcis pour la même action** : coller le style en Alt + Ctrl/⌘ + V et Ctrl/⌘ + Maj + V (voulu, à documenter une fois).

## 4. Performance (base du 2026-10-10, une série, machine chargée — `perf-page-builder.md`)

À 400 éléments : frappe 24 ms, sélection 41 ms, dupliquer jusqu'à l'image 56 ms, annuler / rétablir / supprimer 38–49 ms, défilement 61 images/s, glisser 16,7 ms par image. Points à surveiller : dupliquer (> 50 ms), 2 tâches longues en glissant depuis la bibliothèque, pointes de sélection (75 ms max). **Les tests à 500 éléments demandés sont impossibles** : la limite du produit est de 400 éléments.

## 5. Risques de régression (par ordre)

1. **Concentration** : 6 500 lignes dans un seul fichier ; toute modification d'une fonction commune (`setStyles`, `change`, `renderInspector`) touche tout l'éditeur → modifications par petites étapes, test navigateur à chaque lot.
2. **Format d'enregistrement des styles** : ne rien renommer ; toute nouvelle propriété doit avoir une valeur par défaut qui laisse les anciennes pages identiques.
3. **Validateur de dimensions** (sécurité) : accepter `fit-content` / `clamp()` demande d'étendre `lengthOf` avec une liste fermée, jamais d'accepter du CSS libre.
4. **Tests navigateur sensibles à la charge de la machine** (rejouer seul en cas d'échec) ; **un échec préexistant** : `controles-numeriques-chrome` (glissement sur le libellé).
5. **Limite de 400 éléments / 150 étapes d'historique** : toute fonctionnalité qui ajoute des éléments doit la respecter.

## 6. Cinq améliorations prioritaires proposées (à valider ; aucune n'est commencée)

1. ~~Fiches d'inspecteur des 19 types~~ — **retiré : erreur d'audit** (ces widgets ont déjà une fiche complète générée à l'exécution).
2. **États survol / focus / clic pour davantage de types** (titres, textes, listes, icônes, formulaires…) — élargit une capacité existante sans changer le format.
3. **Transitions complètes** : choix de l'accélération et des propriétés (durée seule aujourd'hui) — réutilise la liste d'accélérations du moteur de mouvement.
4. **Dimensions intrinsèques** : `fit-content`, `min-content`, `max-content`, puis `clamp()` — extension contrôlée du validateur.
5. **Clarifier le masquage par écran** (duplication `hideOn` / `display: none`) et mettre à jour la documentation périmée.

## 7. Ordre recommandé des prochains lots

Lot 5 (conteneurs : dimensions intrinsèques) → lot 7/11 (états et transitions) → lot 10 (masquage par écran) → lot 16 (accessibilité : audit page par page) ; lots 3 (moteur de propriétés), 6, 8, 9, 13, 14, 15, 17, 19 : **déjà couverts par l'existant** (voir § 2), donc à ne lancer que sur un manque démontré.
Avant chaque lot : rejouer les tests de la ligne concernée, annoncer les fichiers touchés.

## 8. Lots exécutés après validation (2026-10-10)

| Lot | Résultat |
|---|---|
| Fiches d'inspecteur des 19 types | **Abandonné : erreur d'audit** (ces widgets ont déjà une fiche complète générée à l'exécution). Documents corrigés. |
| États (survol) | **Fait** : 18 types de contenu + tous les widgets personnalisés ; vérifié de bout en bout (inspecteur → enregistrement → rechargement → page publiée `:hover`). |
| Transitions | **Fait pour l'accélération** (`transitionEasing`, écrite après la durée) ; propriétés animées fixes. |
| Dimensions intrinsèques | **Fait** : `fit-content`, `min-content`, `max-content` pour largeur, hauteur, min/max ; liste fermée côté serveur ; `clamp()` / `calc()` **volontairement refusés**. |
| Masquage par écran | **Clarifié** (pas de changement de code). |
| Documentation périmée | **Corrigée**. |
| Glissement sur le libellé | **Défaut réel corrigé** (champs à « valeur du site »). |
| Accessibilité du rendu publié | **Auditée et verrouillée par un test** (86 widgets, aucun défaut). |
| Non fait (hors besoin démontré) | choix des propriétés de transition, écrans personnalisés, mesure de contraste du rendu publié. |
Tests : voir `KOLAKISA_EDITOR_REGRESSION_REPORT.md`.
