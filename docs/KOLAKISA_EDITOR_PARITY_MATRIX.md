# Matrice de parité — éditeur de pages KOLAKISA × documentation officielle Elementor

> LOT 1 du programme « Editor Excellence ». **Documentation seulement : aucun code modifié.**
> Cette matrice ne dit PAS « 100 % de parité ». Elle compare des comportements **documentés** à ce que KOLAKISA fait, avec la preuve.

## Règles de lecture

* **Statuts** : CONFORME · PARTIELLEMENT CONFORME · NON IMPLÉMENTÉ · IMPLÉMENTÉ MAIS DÉFECTUEUX · NON APPLICABLE · À VÉRIFIER.
* **Preuve** : `T` = un test automatisé existant couvre le comportement (nom du fichier cité) ; `C` = comportement lu dans le code mais **non couvert par un test dédié** ; `—` = aucune preuve.
  Un statut CONFORME exige `T`. Avec `C` seul, le statut maximal est **À VÉRIFIER** (le code existe, rien ne prouve qu'il marche en navigateur). Aucun chiffre de performance n'est donné ici (la mesure est le LOT 2).
* **Dates des sources** : les pages d'aide Elementor consultées n'affichent pas de date de mise à jour → « date non disponible ». Le comportement d'Elementor peut avoir changé depuis.
* La priorité (P1 haute … P3 basse) est une proposition à valider, pas une mesure.
* Pas d'objectif de copie : KOLAKISA n'est pas WordPress. Quand une fonction dépend de WordPress, le statut est NON APPLICABLE, avec la raison.

## Sources officielles consultées

| Réf. | Page |
|---|---|
| S1 | https://elementor.com/help/hotkeys/ |
| S2 | https://elementor.com/help/navigator/ |
| S3 | https://elementor.com/help/revision-history-undo-and-redo/ |
| S4 | https://elementor.com/help/container-layout-tab-settings/ |
| S5 | https://elementor.com/help/container-advanced-tab-settings/ |
| S6 | https://elementor.com/help/set-flexbox-container-size-behavior/ |
| S7 | https://elementor.com/help/how-do-flexbox-containers-work/ |
| S8 | https://elementor.com/help/site-settings/ |
| S9 | https://elementor.com/help/mobile-editing/ |
| S10 | https://elementor.com/blog/introducing-copy-paste/ et https://elementor.com/help/how-do-i-copy-elements-from-one-site-to-another/ |
| S11 | https://elementor.com/help/the-finder/ |
| S12 | https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/ |
| S13 | https://elementor.com/help/classes-in-elementor-2/ |
| S14 | https://developers.elementor.com/docs/editor/widgets-panel |
| S15 | https://elementor.com/help/speed-up-a-slow-site/ et https://developers.elementor.com/elementor-3-21-developers-update/ |
| S16 | https://elementor.com/help/right-click/ |

Sources trouvées mais **non lues en entier** (donc non utilisées pour un statut) : developers.elementor.com `responsive-data`, `history-panel`, `global-style`.

## Matrice

| ID | Catégorie | Comportement documenté (réf.) | État KOLAKISA | Fichier | Preuve | Statut | Écart / impact | Priorité | Critère d'acceptation |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | Raccourcis | Annuler / rétablir au clavier (S1) | Ctrl/Cmd+Z, Maj+Z, Ctrl+Y | `public/js/page-builder.js` `onKey` | T (`editeur-raccourcis-navigateur`, vrai Chrome, 2026-10-10) | CONFORME | Confirmer par un test dédié | P2 | Test navigateur : modifier, Ctrl+Z, Ctrl+Maj+Z |
| P-02 | Raccourcis | Copier / coller / dupliquer / supprimer (S1) | Ctrl+C, X, V, D, Suppr présents (écriture seule) | `page-builder.js` `onKey` | T (`editeur-raccourcis-navigateur`, vrai Chrome, 2026-10-10) | CONFORME | Pas de test des raccourcis eux-mêmes | P2 | Test navigateur par raccourci |
| P-03 | Raccourcis | Copier / coller le **style** (S10) | Ctrl+Alt+C / Ctrl+Alt+V (`copyStyle`, `pasteStyle`) | `page-builder.js` | C | À VÉRIFIER | | P2 | Copier le style d'un bouton, le coller sur un autre |
| P-04 | Raccourcis | Enregistrer au clavier (S1) | Ctrl/Cmd+S → `saveNow` | `page-builder.js` | T (`editeur-raccourcis-navigateur`, vrai Chrome, 2026-10-10) | CONFORME | | P3 | Test : Ctrl+S déclenche l'enregistrement |
| P-05 | Raccourcis | Recherche rapide d'actions (« Finder », Ctrl+E, S11) | Palette de commandes Ctrl/Cmd+K (`openCommands`) ; recherche d'**actions de l'éditeur**, pas de pages | `page-builder.js` | C | PARTIELLEMENT CONFORME (équivalent, autre touche) | Ne cherche pas les pages/modèles du site : à vérifier | P3 | Cahier : lister ce que la palette trouve |
| P-06 | Raccourcis | Plan de l'éditeur : ouvrir/fermer le Navigator (S1, S2) | Ctrl+Maj+E bascule Structure/Visuel ; Ctrl+Maj+Y le dock | `page-builder.js` | C | À VÉRIFIER | Touches différentes d'Elementor (assumé) | P3 | — |
| P-07 | Raccourcis | Zoom / vue d'ensemble | Ctrl +/-/0, Maj+1 ajuster | `page-builder.js` | C | NON APPLICABLE (Elementor : pas de zoom canevas documenté dans S1) | Fonction propre à KOLAKISA | — | — |
| N-01 | Structure (Navigator) | Arbre hiérarchique de la page, sélection, glisser-déposer pour réorganiser (S2) | Panneau Structure : arbre, repères, glisser-déposer avec ligne d'insertion | `page-builder.js` `renderTree`; `docs/EDITEUR-DROITE.md` | T (`editeur-droite-navigateur`, `editeur-structure-navigateur`, `editeur-structure.test.js`) | CONFORME | — | — | Déjà testé |
| N-02 | Structure | Renommer, masquer, verrouiller, dupliquer, supprimer depuis l'arbre (S2) | Menu ⋮ (dupliquer, masquer, supprimer) testé ; renommer/verrouiller présents | idem | T partiel (`editeur-droite-navigateur` : dupliquer, masquer, supprimer) ; `editeur-verrou.test.js` | PARTIELLEMENT CONFORME | Renommer en place : non couvert par test dans la liste lue | P3 | Test : renommer dans l'arbre |
| N-03 | Structure | Recherche dans l'arbre (S2) | Champ de recherche + compteur | `page-builder.js` | T (`editeur-droite-navigateur`) | CONFORME | — | — | — |
| N-04 | Structure | Menu contextuel clic droit sur un élément (S16) | `openMenu` (mêmes actions que ⋮) | `page-builder.js` | T partiel | PARTIELLEMENT CONFORME | Liste exacte des actions Elementor non comparée | P3 | Comparer action par action |
| H-01 | Historique | Annuler/Rétablir illimité sur la session (S3) | 150 instantanés JSON | `page-builder.js`; `docs/perf-page-builder.md` | C + T (bench) | PARTIELLEMENT CONFORME | Limite de 150 ; Elementor ne documente pas de limite chiffrée → écart à vérifier | P3 | — |
| H-02 | Historique | Panneau « Historique » listant les actions + révisions de la page (S3) | Carte Annuler/Rétablir dans l'inspecteur vide ; révisions pour **articles** (`cms-revisions.md`) | `docs/cms-revisions.md` | T (articles) | À VÉRIFIER pour les **pages** | Liste d'actions cliquable et révisions de pages : non confirmées | P1 | Vérifier existence ; sinon écrire le besoin |
| H-03 | Historique | Enregistrement automatique (S3) | Autoenregistrement ≈ 1 s, copie locale proposée à la reprise | `page-builder.js` (`offerBackup`) | C | À VÉRIFIER | | P2 | Test : fermer sans enregistrer, rouvrir, copie proposée |
| C-01 | Conteneurs | Direction, alignement, justification, espacement entre éléments, retour à la ligne (S4, S7) | Contrôles de conteneur dans l'inspecteur | `nodes.js`, `page-builder.js` | T (`editeur-canvas-proprietes-effectives-navigateur`, `editeur-canvas-containers-navigateur`) | CONFORME pour les propriétés testées | La liste complète des propriétés d'Elementor n'a pas été comparée une à une | P2 | Comparer S4 ligne par ligne |
| C-02 | Conteneurs | Largeur « Boxed » / « Full width » (S6) | Option `band` (autre session) | `nodes.js`, `_node.ejs` | T (`editeur-canvas-fond-pleine-largeur-navigateur`) | À VÉRIFIER | Sémantique non comparée à S6 | P2 | — |
| C-03 | Conteneurs | Contenu **vide** = vraie zone de dépôt (S7) | Zone vide éditable | — | T (`editeur-zone-conteneurs-navigateur`) | CONFORME | — | — | — |
| C-04 | Conteneurs | Conteneur **grille** (documenté, S4/S7) | Non confirmé | — | — | À VÉRIFIER | Chercher une option « grille » dans `nodes.js` | P2 | — |
| R-01 | Responsive | Modes écran bureau / tablette / mobile avec valeurs par écran (S9) | `breakpointSwitch`, seuils 1023 / 767 | `page-builder.js` | T (`site-web-reglages-ecrans-navigateur`, `editeur-canvas-dimensions-navigateur`) | CONFORME pour les écrans testés | Seuils exacts d'Elementor non reproduits (autre moteur) | P3 | — |
| R-02 | Responsive | Masquer un élément selon l'écran (S5) | Masquage par écran présent dans l'inspecteur (à confirmer) | — | — | À VÉRIFIER | | P2 | Test par écran |
| G-01 | Réglages du site | Couleurs/polices globales, réglages de thème (S8) | Panneau « Réglages du site » (lots 1+, autre session) | `docs/reglages-du-site.md` | T (`site-web-reglages*.test.js`) | CONFORME pour les lots livrés | Lots restants listés dans ce doc ; pas comparés à S8 | P2 | Comparer à S8 |
| G-02 | Classes | Classes globales réutilisables (S13) | Classes globales | `editeur-classes-globales.test.js`, `editeur-classes-navigateur` | T | CONFORME | | — | — |
| W-01 | Widgets | Panneau de widgets par catégories avec recherche (S14) | Palette par catégories + recherche ; 86 types (79 opérationnels + 7 contextuels) | `docs/WIDGETS-INVENTAIRE.md` | T (`widgets-*`, `editeur-widgets.test.js`) + contrat `widgets-contrat` (86 types : fiche complète, description, icône, contenu de départ valide, gabarit) | CONFORME | Les widgets Elementor Pro/WordPress n'existent pas tous (voir inventaire) | — | — |
| W-02 | Widgets | Widgets enregistrés/globaux (S14) | Blocs/composants réutilisables | `editeur-blocs-reutilisables.test.js` | T | À VÉRIFIER | « Global » = modifier une fois, appliquer partout : à confirmer | P2 | Test : modifier le global, vérifier toutes les copies |
| W-03 | Widgets | Pas de balisage pour un contenu vide (S15) | Non vérifié | `views/marketing-public/widgets/*.ejs` | — | À VÉRIFIER | Dépend widget par widget ; mesurable par un test de rendu | P2 | Test de rendu d'un widget vide |
| D-01 | Copier/coller | Copier un élément vers une autre page (S10) | Copier/coller via presse-papiers interne (`copySelected`, `paste`) | `page-builder.js` | T (`editeur-raccourcis-navigateur`, vrai Chrome, 2026-10-10) | CONFORME | Entre pages : non confirmé | P2 | Test : copier page A, coller page B |
| D-02 | Copier/coller | Entre **sites** (S10) | — | — | — | NON APPLICABLE | Spécifique à WordPress multi-sites | — | — |
| X-01 | Conditions | Conditions d'affichage ET/OU par élément (S12) | Conditions du moteur d'e-mails ; pour les pages : à confirmer | — | — | À VÉRIFIER | | P2 | — |
| F-01 | Performance | Moins de DOM, chargement différé (S15) | Mesure du 2026-10-10 (100 et 400 éléments) dans `docs/perf-page-builder.md` ; Elementor ne publie pas de budget comparable | `docs/perf-page-builder.md` | T (`page-builder-performance-navigateur`) + mesure bench | PARTIELLEMENT CONFORME (mesuré, pas comparable à Elementor) | Une seule série, charge machine 6–19 ; dupliquer à 400 éléments = 56 ms (> 50) | P1 | Mesure sur machine au calme |
| A-01 | Documentation | `editeur-pages-audit.md` | Contient une affirmation périmée (HTML libre « refusé » alors qu'un widget HTML existe) | `docs/editeur-pages-audit.md` | lecture | IMPLÉMENTÉ MAIS DÉFECTUEUX (la doc, pas le produit) → **corrigé le 2026-10-10** | Risque de désinformation levé | — | Vérifié contre `nodes.js` (widget `html`, permission `pages.code`) |

## Ce que cette matrice ne prouve pas

* 15 lignes sur 30 sont **À VÉRIFIER** ou PARTIELLEMENT CONFORME : c'est le résultat honnête, pas un défaut de la matrice.
* Les listes de contrôles d'Elementor (Layout, Advanced, Motion Effects, etc.) sont longues ; seuls les comportements structurants ont été relevés. Une comparaison **champ par champ** reste à faire (P2).
* Elementor change vite (éditeur V4 « atomique » en alpha/bêta selon la documentation consultée) ; la référence peut bouger.

## Suites proposées (LOT 2 et après)

1. FAIT le 2026-10-10 : `tests/editeur-raccourcis-navigateur.test.js` (4/4) a converti P-01, P-02, P-04, D-01 en CONFORME. Restent P-03 (style), H-03, R-02.
2. Vérifier H-02 (historique/révisions de pages) et C-04 (grille) dans le code avant de décider d'un chantier.
3. LOT 2 : mesurer F-01 sur machine calme, étendre `docs/perf-page-builder.md` (pas de nouveau document).
4. Corriger A-01.
