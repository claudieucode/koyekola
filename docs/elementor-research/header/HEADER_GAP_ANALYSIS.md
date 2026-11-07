# HEADER — Analyse des écarts (Elementor ↔ Kolakisa)

Date : 2026-11-07. Sources : fichiers `00`→`14` de ce dossier (Elementor) + audit du code Kolakisa (voir `15_KOLAKISA_HEADER_ARCHITECTURE.md`).
Légende statut Kolakisa : **OK** = existe et une preuve de test est citée ; **EXISTE** = présent dans le code, preuve de test à rattacher ; **PARTIEL** ; **ABSENT**.
Limite de l'étude Elementor : aucun test en live dans un Elementor réel ; plusieurs pages n'ont pas pu être lues (voir `00_RESEARCH_SCOPE.md`). Là où Elementor n'est pas documenté, la solution Kolakisa suit les bonnes pratiques (accessibilité, performance) et le dit.

## A. Ce que Kolakisa a déjà (à ne pas refaire)

| Capacité | Statut | Preuve / emplacement |
|---|---|---|
| Modèle d'en-tête brouillon/publié/archivé, nom unique, révision (409 si périmée) | OK | `tests/theme-builder-stockage.test.js` |
| Conditions Inclure/Exclure, le plus précis gagne, exclusion prioritaire, égalité signalée | OK | `tests/theme-builder-regles.test.js`, `theme-builder-contexte-rendu.test.js` |
| Versions à la publication + restauration | OK | `src/themeBuilder/store.js` (`mk_tb_versions`, 30) ; test `theme-builder-stockage` (versions) à confirmer ligne par ligne |
| Un seul en-tête par page, repli historique, isolation entre sites | OK | `tests/theme-builder-site-principal.test.js`, `theme-builder-pied-unique.test.js` (équivalent pied) |
| Sticky / superposé (jamais les deux), plusieurs rangées, retour à l'ordinaire | OK | `tests/theme-builder-en-tete-collant-public.test.js` |
| Bibliothèque de 100 en-têtes distincts, sans contenu factice | OK | `tests/theme-builder-entetes-bibliotheque.test.js` |
| Menus : éditeur, sous-menus, glisser-déposer, emplacements, isolation entre sites | OK | `tests/apparence-menus*.test.js` |
| Éditeur : calques, annuler/rétablir, copier/coller (+ style), épinglage, états survol, effets défilement/souris, Motion Studio | EXISTE | `docs/ELEMENTOR_PARITY_MATRIX.md` ; tests `editeur-*` |
| Responsive par écran + `hideOn` | EXISTE | `nodes.js` (`BREAKPOINTS`) |
| Import/export d'un modèle | EXISTE | `src/themeBuilder/portable.js` |
| Aperçu sur un contenu choisi (« contenus-apercu ») | EXISTE | route `/contenus-apercu` |

## B. Lacunes (à traiter)

Chaque ligne : cause → solution → risque → dépendances → tests. « Lot » renvoie à `HEADER_IMPLEMENTATION_PLAN.md`.

| ID | Lacune | Statut | Cause | Solution | Risque | Dépendances | Tests | Lot |
|---|---|---|---|---|---|---|---|---|
| G-01 | Comportement d'en-tête déduit du **premier enfant** | PARTIEL (fragile) | `partMode` lit `children[0]` (`themeRender.js:52`) ; code dupliqué dans `_sections.ejs` | Bloc `section.header` au niveau du document + lecteur unique ; migration douce | Régression sur les 100 modèles du catalogue | `nodes.js` (validation), `catalog/header.js` | Les 6 tests `en-tete-collant-public` passent à l'identique ; nouveau test de migration | L0 |
| G-02 | **Aucune interface** pour sticky/rétrécissement/transparent | ABSENT | `headerFx` n'a pas de panneau (0 occurrence dans `public/js`) | Panneau « En-tête » dans l'éditeur | Éditeur monolithique (8 691 lignes) | `page-builder.js` (`inspectorFor`, `styleSet`, historique) | Test navigateur : régler → enregistrer → recharger → rendu public | L0 |
| G-03 | Un seul état de défilement, seuil fixe 8 px | PARTIEL | `landing.js:195-198` | Runtime `kw-header.js` : seuil réglable, états `top`/`scrolled`/`hidden` | CLS, saccades | G-01 | Navigateur : seuil, rétrécissement sans saut, mesure CLS | L1 |
| G-04 | Pas de masquage en descendant / réapparition en montant | ABSENT (Elementor : EXTENSION seulement) | — | `hideOnScrollDown` avec tolérance | Conflit avec ancres/focus clavier | G-03 | Navigateur : défilement ↓↑, focus clavier révèle l'en-tête | L1 |
| G-05 | Pas de styles par état de défilement | ABSENT | états de nœud = survol/focus/actif seulement | État `scrolled` (et `menuOpen`) dans la grammaire + CSS généré | Explosion du CSS | `nodes.js` `STATES`, `pageCss` | Unitaire `pageCss` + navigateur | L1 |
| G-06 | Pas de logo par état (clair/sombre/transparent) | ABSENT | widget `sitelogo` à logo unique | Variantes de logo par état | Médias du site (isolation) | G-05, médiathèque | Navigateur : le logo change au défilement ; isolation multi-sites | L1 |
| G-07 | Hauteur réservée / décalage au passage fixe | À VÉRIFIER | pas d'espaceur dynamique | `--kw-header-h` + espaceur | CLS | G-03 | Mesure CLS < 0,1 | L1 |
| G-08 | Responsive par élément incomplet (ordre, rangées par appareil) | PARTIEL | catalogue : 3 zones figées | `order` par écran + rangées par appareil | Valeurs qui fuient d'un écran à l'autre | `BREAKPOINTS` | Tests d'héritage : modifier mobile ne change pas bureau | L2 |
| G-09 | Menu : un seul niveau de sous-menu, pas d'icône/badge/image/description | PARTIEL | widget `menu` (12 + 10 liens) | Profondeur 3 + champs par élément | Migration des menus existants | `nav_items.meta/icon` | `apparence-menus*` inchangés + nouveaux | L3 |
| G-10 | **Pas de méga-menu** | ABSENT | pas de panneau libre | Composant `megapanel` référencé par un élément de menu | Limites 400 nœuds/profondeur 8 ; sécurité | G-09, éditeur | Navigateur : survol/clic/tactile/clavier/Échap/mobile | L4 |
| G-11 | **Pas de tiroir** (off-canvas) pour le menu mobile | ABSENT | burger = dépliage en place | Composant `drawer` + déclencheur | Focus, défilement | `modal`, `.kw-offcanvas` | Navigateur : focus piégé, Échap, retour du focus | L3 |
| G-12 | Recherche : pas de plein écran ni suggestions | ABSENT | formulaire GET simple | Peau plein écran + endpoint de suggestions | Abus de requêtes | Moteur de recherche existant | Tests API (limites, isolation) + navigateur | L5 |
| G-13 | Mini-panier = lien statique ; compte sans menu | PARTIEL | `minicart`, `account` | Tiroir panier réel ; menu compte | Données de session | Module boutique | Navigateur : ajout produit → compteur + liste ; non connecté | L5 |
| G-14 | Conditions : pas de visiteur invité/membre, date | ABSENT | `conditions.js` | Condition « visiteur » ; date | **Cache de rendu par visiteur [S]** | cache `published()` | Tests : invité vs membre, pas de fuite via cache | L6 |
| G-15 | Calques non orientés « rangées/zones » ; pas de bascule d'état sur le canevas | PARTIEL [S] | éditeur général | Vue en-tête + bouton d'état (haut/défilé/menu ouvert) | Complexité UI | G-02 | Navigateur | L7 |
| G-16 | Vignettes : search/account/minicart/cart/social = bloc générique | PARTIEL | `thumb.js` | Pictogrammes dédiés | Faible | — | Unitaire `thumb` | L7 |
| G-17 | Barre d'annonce, horaires, contact, bouton d'appel | À VÉRIFIER | widgets génériques (`text`, `button`, `iconlist`) | Composition documentée + modèles ; widget dédié seulement si nécessaire | Doublons | — | Test de rendu de chaque modèle | L5 |
| G-18 | Attributs HTML / classes / ID autorisés (onglet Avancé) | À VÉRIFIER | — | Audit de l'existant ; liste blanche | Injection | `nodes.js` | Tests de rejet (attributs dangereux) | L8 |
| G-19 | Accessibilité : preuves absentes pour menus/tiroirs | À VÉRIFIER | — | Audit clavier + lecteur d'écran + contrastes | — | G-09…G-13 | Navigateur + axe-like manuel | L8 |
| G-20 | Sélecteur de langue | **EXCLU** | aucun multilingue public (`kolakisa-header-refonte-audit-2.md`) | Documenté ; pas de simulation | — | — | — | — |
| G-21 | Documents d'aide périmés (nom de table `mk_theme_templates`, chiffres de widgets 66/86/92) | PARTIEL | dérive documentaire | Corriger les docs dans le lot final | Faible | — | — | L8 |
| G-22 | Risques d'isolation : `store.byDocument` sans `site_id`, nom de composant unique par organisation, composant global accepté partout | RISQUE | [V] audit | Tests dédiés ; corriger si fuite démontrée | Fuite entre sites | — | Scénarios 2–3 sites | L8 |

## C. Fonctions où Kolakisa dépasse ou diffère d'Elementor
- **Priorité des conditions** : règle explicite, documentée, testée (Elementor ne la documente pas — voir `10_HEADER_DISPLAY_CONDITIONS.md` § 3).
- **Sticky/transparent/rétrécissement** : natifs dans le catalogue (100 compositions) ; chez Elementor ils passent par CSS ou extensions tierces.
- **Sécurité** : aucune exécution de JS arbitraire ; le widget `html` est réservé aux administrateurs.

## D. Risques structurels (ne pas contourner)
1. Éditeur monolithique : tout nouveau panneau passe par `inspectorFor`/`styleSet` (architecture décrite dans `KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md`).
2. Grammaire fermée : tout nouveau widget/état exige `nodes.js` + `parts.js` + gabarit EJS + tests de couverture (`widgets-parts-couverture.test.js`).
3. CSS `!important` et sélecteurs `.kw-full .kw-full` dans `landing.css` : à rationaliser avant d'ajouter des états.
4. Migrations de navigation hors du dossier de migrations (créées dans `src/config/database.js`) : toute évolution de `nav_items` suit ce même mécanisme, sans migration destructive.
