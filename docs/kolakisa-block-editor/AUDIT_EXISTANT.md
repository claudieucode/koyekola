# Audit de l'éditeur de blocs d'articles Kolakisa — état avant intervention

Date : 2026-10-27 · Branche `feat/editeur-blocs-parite-gutenberg` (= `origin/main` @ 55dd98b2) · Audit statique en lecture seule (aucune exécution navigateur), complété par une base de référence de tests exécutée.

## 0. Périmètre retenu

« L'éditeur de texte et de pages de type Gutenberg » = **l'éditeur d'articles Tiptap** (`src/editor/blog-editor.js` + `src/editor/blog/*`, vue `views/instructor/blog-form.ejs`, routes `src/routes/blog.js`). C'est le seul éditeur par blocs du produit.

Les **pages** utilisent un autre système (Page Builder, sections JSON, `public/js/page-builder*.js`). `docs/KOLAKISA_CMS_PAGES_NOUVELLE.md` §4 établit qu'un éditeur de blocs Gutenberg pour les pages est « non disponible, et NON simulé » (dépendance bloquante : modèle de contenu commun pages / blocs HTML). **Cette mission ne contredit pas cette décision** ; l'extension aux pages reste hors périmètre et BLOQUÉE tant que le modèle commun n'est pas décidé (voir `DECISIONS_TECHNIQUES.md`).

## 1. Architecture

| Couche | Réalité | Preuve |
|---|---|---|
| Stack | Node ≥22, Express 4.22, EJS, `node:sqlite`, Tiptap ^3.31.3 (ProseMirror), esbuild | package.json |
| Source éditeur | `src/editor/blog-editor.js` (3169 l.) + `src/editor/blog/{nodes,blocks,editing,indent,dragHandle,documentMode,workspace,workspaceUi,seoPanels,datePicker}.js` | |
| Bundle | `public/js/blog-editor.js` (762 Ko), versionné ; `npm run build:editor` ; **non reconstruit par le CI** | scripts/build-editor.js |
| Format de stockage | **HTML structuré** dans `posts.content` (`content_format='html'`), classes `kb-*` + attributs `data-*` en liste blanche. Anciens articles en Markdown, convertis à l'ouverture | src/utils/blogHtml.js:29,63-163 |
| Sanitisation | `sanitize-html` à l'enregistrement ET à l'affichage | routes/blog.js:574-580 ; blogHtml.js:251 |
| Tenant | Pas de colonne site/org sur `posts` ; rattachement via `mk_content_sites`. Organisation = 1ʳᵉ ligne de `mk_organizations` | services/siteContent.js |
| Révisions | `post_revisions` (100 max), `post_autosaves` (1 ligne/article), conflit `base_updated_at` → 409 | services/blog.js:196-212,302-310 |
| Réutilisables | `blog_reusable_blocks` (créée par `db.exec`, sans site/org) | services/reusableBlocks.js:12 |
| Corbeille de blocs | `blog_block_trash` | services/blockTrash.js |

Dépendances : éditeur ↔ médiathèque (`media` blog globale + `mk_media` par site pour les couvertures) ↔ taxonomies ↔ SEO (panneaux) ↔ révisions ↔ droits (`articles.write|edit_own|publish`) ↔ rendu public (`renderBlogHtml`).

## 2. Inventaire des blocs Tiptap (réel)

StarterKit (paragraphe, titres 1-6, citation, listes, code, séparateur), TaskList, TableKit, et nœuds personnalisés : `kbImage`, `kbGallery`, `kbVideo`, `kbAudio`, `kbEmbed`, `kbCourse`, `kbNewsletter`, `kbButton`, `kbButtons`, `callout` (8 types), `kbCta`, `kbAccordion`, `kbFaq`, `kbSteps`, `kbCompare`, `kbSpacer`, `kbPageBreak`, `kbColumns/kbColumn`, `kbGroup`, `kbReusable`, `kbReusableEdit`. Extensions : Indent, TextAlign, Highlight, Sub/Superscript, BlockLock, BlockIdentity (`blockId`, `hidden`), FindHighlight, PullquoteAttr. 44 entrées dans l'inserteur (BE:309-354). Détail attributs : voir rapport client (section 1.2 reprise dans `MATRICE_PARITE.md`).

Pas de système générique de « styles de bloc » ni de « variations ».

## 3. Interface : fonctionnel / partiel / absent

**OK (handler branché)** : barre supérieure, inserteur (catalogue, recherche, favoris, récents, onglet médias, réutilisables, « / »), barre d'outils flottante ou fixe, menu du bloc (copier/couper/coller après, dupliquer, insérer avant/après, déplacer, verrouiller niveau 1, supprimer, réutilisable, clic droit), panneau latéral Article/SEO/Bloc, vue en liste hiérarchique (masquer, corbeille avec restauration), plan du document, compteurs, modes Blocs/Document, éditeur de code, concentration (élémentaire), palette de commandes (Ctrl+Maj+K), rechercher/remplacer, coller nettoyé, import de fichiers, recadrage, IA, autosave, révisions.

**PARTIEL** : transformation de bloc (texte seulement), inserteur rapide (6 résultats, sans catégories), aperçu appareil (modale iframe, exige un article enregistré, pas de bascule du canevas), verrouillage (niveau 1 seulement, hors historique), mode concentration (opacité, pas « Spotlight »).

**ABSENT** : Grouper / Dégrouper, transformations inter-blocs, copier/coller de styles, ancre HTML, classes CSS supplémentaires, glisser-déposer depuis l'inserteur ou dans la vue en liste, multi-sélection, masquer depuis le menu du bloc, commandes de bloc dans la palette, patterns (non synchronisés), éditer un bloc en HTML, plein écran en mode Blocs, raccourcis Ctrl+Alt+T/Y, Alt+Maj+O, Ctrl+Maj+Alt+M, Ctrl+/, copie de tous les blocs, réglages génériques (couleurs, typo, espacements, bordures, dimensions, ombre), masquage par appareil.

**Code mort** : `selectBlockAt`, `topOf`, `ICONS.h`, branche `visual:true` de `BlockHandle` + CSS `.kb-ed-handle*`, liste `details` dans `LOCKABLE_TYPES`, libellé du bloc Formation (`a.title` inexistant), largeurs image 33 %/66 % absentes du sélecteur du mode Blocs, défaut d'alignement du bouton incohérent (`left` au parse vs `center` à l'insertion), tooltip « Tab » du mode Document sans handler.

## 4. Défauts d'intégrité et de sécurité (sévérité)

Aucun défaut critique. Pas de faille XSS persistante identifiée (double sanitisation).

| # | Sév. | Défaut | Preuve |
|---|---|---|---|
| D1 | Moyen | `dirty=false` après la réponse serveur : les frappes faites pendant l'enregistrement perdent beforeunload/autosave et la copie locale est effacée | blog-editor.js:2649-2650, 2506 |
| D2 | Moyen | Autosave tronquée à 400 000 caractères → JSON invalide → `getAutosave` renvoie null en silence, l'UI affiche « Sauvegarde automatique » | services/blog.js:302-310 |
| D3 | Moyen | Conflit d'enregistrement facultatif et à la seconde ; restauration et actions de liste sans `base_updated_at` ; autosave sans concurrence | routes/blog.js:935-940 |
| D4 | Moyen | `/api/brouillon` ne rattache pas au site → article de site X créé dans le site principal (à confirmer par test) | routes/blog.js:1011-1017 |
| D5 | Moyen | Course autosave/`ensurePost` vs `save()` → articles en double | blog-editor.js:2585-2640 |
| D6 | Moyen | `reusableBlocks.remove` réécrit révisions/autosaves sans empreinte ni `updated_at` | reusableBlocks.js:71-93 |
| D7 | Moyen | Blocs réutilisables sans site/org ; `data-ref` saisi à la main lit un bloc d'un autre site ; édition globale sans historique | reusableBlocks.js, blogHtml.js:110,254 |
| D8 | Moyen | Rôle « formateur » = accès global ; `loadPost` sans filtre de site | routes/blog.js:486,686 |
| D9 | Moyen | Médiathèque blog globale (liste/édition/suppression par tout formateur) | services/blog.js:315 ; routes 1122-1180 |
| D10 | Moyen | Restauration de révision non re-sanitisée ; droits `revisions.*` documentés mais non appliqués par cette route | routes/blog.js ~1100 |
| D11 | Moyen | Pertes silencieuses à la sanitisation (images externes, URL média invalides, balises/attributs hors liste) sans rapport à l'utilisateur ; blocs inconnus sans « bloc brut » | blogHtml.js |
| D12 | Moyen | Programmation : promotion à la requête, sans révision ni recontrôle SEO/droits | services/blog.js:134 |
| D13 | Faible | MIME client non vérifié, dimensions média fournies par le client, corbeille de blocs non assainie, pas de limite de débit sur brouillon/autosave/corbeille, sitemap sans `deleted_at`/site, `dateModified` non mis à jour | |

## 5. Base de référence des tests (avant modification)

Commande : 16 fichiers liés à l'éditeur d'articles, `--test-concurrency=1`, `ENCRYPTION_KEY` factice, `node_modules` lié depuis le worktree de déploiement.
Résultat : **209 exécutés, 206 réussis, 3 échoués, 0 ignoré** (105 s).

Les 3 échecs sont **préexistants** : les tests appelaient `POST /formateur/blog/:id/supprimer` en attendant une suppression définitive. Cette route existe toujours mais met désormais l'article **à la corbeille** ; la suppression définitive est `supprimer-definitivement` (`routes/blog.js:1007`), possible seulement depuis la corbeille. Tests périmés, pas un défaut du produit — `blog-medias-protection.test.js:41`, `revisions-articles.test.js:170,223`. Corrigés dans le lot P0-1.

Aucun test navigateur dédié aux blocs Tiptap : les blocs ne sont vérifiés que côté serveur et par présence de chaînes dans le bundle.

## 6. Limites de l'audit

Statique : aucun comportement navigateur exécuté. `workspace.js` et `seoPanels.js` non relus ligne à ligne. Échappement des champs d'aperçu non vérifié. Plusieurs affirmations marquées « déduit » dans les rapports sources (notamment D4) sont à confirmer par test avant correction.
