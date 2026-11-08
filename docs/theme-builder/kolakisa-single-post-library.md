# Bibliothèque « Article individuel » du Theme Builder Kolakisa

Document de maintenance de la catégorie **Article individuel** (type `single_post`). Référence Elementor : [`elementor-single-post-reference.md`](elementor-single-post-reference.md). Vue d'ensemble du catalogue : [`KOLAKISA_THEME_BUILDER_CATALOGUE.md`](KOLAKISA_THEME_BUILDER_CATALOGUE.md).

> **Mise à jour du 8 novembre 2026 (v2, voie B)** : la bibliothèque a été entièrement remplacée par 100 nouveaux concepts en 12 familles (plan et décisions dans `single-post/`). Les sections 2 et 3 décrivent l'historique ; les clés des anciennes compositions n'existent plus dans le catalogue (aucun site n'en dépend : « Utiliser » copie le document).

## 1. Périmètre
Un modèle « Article individuel » est la mise en page qui entoure **un article réel** du blog (`/blog/<adresse>`). Il contient toujours le titre `{{post.title}}` et le contenu de l'article (`postcontent`), et peut y ajouter métadonnées, catégories/étiquettes, image à la une, auteur, sommaire, partage, navigation précédent/suivant, articles liés, commentaires, barre de progression de lecture. Ce ne sont ni des pages d'accueil ni des archives. Les autres catégories (en-tête, pied de page, archives…) gardent leur catalogue de 20 mises en page × 5 identités.

## 2. Audit initial (avant refonte)
* Le catalogue comptait 100 entrées = **20 mises en page × 5 identités** : 20 compositions seulement, les 4 autres variantes de chaque mise en page ne changeaient que la peau (couleurs, arrondis, casse). Le test historique exigeait « au moins 20 structures distinctes ».
* Le héros plein écran de l'ancienne version utilisait un `position: absolute` pour poser le titre sur l'image (fragile en responsive).
* Aucune ancienne clé n'est mémorisée dans les données des sites : « Utiliser ce modèle » **copie** le document dans le site (une page du Page Builder + une ligne `mk_tb_templates` qui pointe cette page). Retirer les anciennes clés du catalogue ne touche donc aucun site existant ; les modèles déjà utilisés restent intacts et modifiables.
* Lien avec le bon article : le rendu public résout `{{post.*}}` depuis l'article de la requête (vue `post`, `src/themeBuilder/render.js`) ; l'aperçu utilise l'article choisi (« Aperçu avec ») ou, à défaut, le plus récent publié ; sans article, un état explicite est affiché. Vérifié par `tests/theme-builder-article-individuel.test.js` (l'article A n'affiche jamais le contenu de l'article A2 ni d'un autre site).

## 3. Architecture
```
src/themeBuilder/catalog/
  index.js            list / find / build / thumbDoc / entries — type « autonome » : une entrée par mise en page
  kit.js              identités (SKINS) et éléments (k.H, k.W, k.grid, k.card, k.section, k.img…)
  single_post.js      agrège les fichiers de famille, `standalone: true`
  single_post/shared.js   L(), SHARE, CRUMB, META, REL, COL
  single_post/v2/f01..f12.js  les 100 mises en page, un fichier par famille (v2, voie B)
scripts/audit-article-individuel.js    contrôle qualité (100, distinction, grammaire, responsive, contenu)
tests/theme-builder-article-individuel.test.js            serveur réel : 100 modèles utilisés puis publiés
tests/theme-builder-article-individuel-navigateur.test.js Chrome : 100 modèles × 3 largeurs
```
### Schéma de données
Une mise en page : `L(clé, libellé, étiquettes, description, identité, (k, env) => [éléments])`. L'entrée du catalogue est `{ key: "<clé>.<identité>", layoutKey, skinKey, name, desc, tags }`. `build()` renvoie `{ name, kind: "page", sections: [ { type: "layout", children } ] }` ; « Utiliser » stocke une **copie indépendante** (`mk_landing_pages` kind `page` + `mk_tb_templates` en brouillon). Vignette, aperçu et copie du site sont tous produits par `build()` / `thumbDoc()` : une seule source.

### Composants utilisés
Éléments natifs de la grammaire fermée `src/marketing/pages/nodes.js` : conteneurs (`container`, `stack`, `group`, `grid` flex/grid), `heading`, `text`, `image` (adresse dynamique `{{post.image}}`, `{{post.author_avatar}}`), `quote`, `alert`, `badge`, `divider`, `iconlist`, `accordion`, `tabs`, `button`, `search`, et les widgets de contenu dynamique `postcontent`, `postmeta`, `postterms`, `authorbox`, `postnav`, `postcomments`, `toc`, `sharebuttons`, `readingprogress`, `breadcrumb`, `querylist`.

## 4. Règles
* **Contenu dynamique** : étiquettes `{{post.title|excerpt|url|image|date|author|category|reading_time|tags|comments|author_bio|author_avatar}}`. Aucun texte d'exemple ne remplace le contenu : seuls des textes d'invitation génériques modifiables (« Cet article vous a plu ? »). Un seul titre `{{post.title}}` et un seul `postcontent` par modèle (contrôlé).
* **Rendu** : colonne de lecture ≤ 720–780 px, `k.section`/`COL` pour centrer, bandes pleine largeur par `k.band`. Pas de `position: absolute/fixed` (le `sticky` est permis, repassé en `static` sur mobile quand il gênerait). Couleurs par jetons du site (`token:*`) ; seule l'identité « Nuit » pose ses teintes.
* **Responsive** : chaque `grid` passe à 1 colonne sur mobile (`styles.mobile.columns = 1`, imposé par `k.grid` et contrôlé), tablette à 2 colonnes au plus ; réglages tablette/mobile explicites pour les colonnes latérales et tailles de titre.
* **Règles d'affichage** : un modèle utilisé est créé en brouillon sans condition ; il faut le publier avec une condition (Inclure : tous les articles / catégorie / étiquette / auteur / article précis ; Exclure…). Priorité et conflits : voir `ELEMENTOR_DISPLAY_CONDITIONS.md`.
* **Sauvegarde et publication** : « Utiliser » → brouillon ; édition dans le Page Builder (brouillon versionné, révision) ; « Publier » active le modèle sur le site ; « Archiver » le retire. Rien n'est publié sans action explicite.
* **Isolation** : copie propre à chaque site ; un autre site n'est jamais modifié (testé).

## 5. Différences avec Elementor
Voir le tableau de correspondance de `elementor-single-post-reference.md`. En résumé : pas de widget « Featured Image » séparé (image dynamique du Page Builder), pas d'éditeur de conditions identique mot pour mot, pas de modèles importés de bibliothèques tierces ; en échange chaque modèle est un document natif entièrement modifiable.

## 6. Tests
| Contrôle | Commande |
|---|---|
| Qualité statique (100, doublons ≥ 80 %, grammaire, responsive, contenu) | `node scripts/audit-article-individuel.js --all` |
| Catalogue, utilisation → publication → page publique des 100 modèles, bon article, isolation, copie = catalogue, vignette/aperçu | `node --test tests/theme-builder-article-individuel.test.js` |
| Rendu Chrome des 100 modèles à 1440 / 820 / 390 px (débordement, chevauchement, texte coupé, contraste, bon article) | `BIB_REPORT=rapport.json BIB_SHOTS=dossier node --test tests/theme-builder-article-individuel-navigateur.test.js` |
| Catalogue des autres types / parcours public | `tests/theme-builder-catalogue*.test.js` |

Sur une machine chargée, donner `TEST_START_TIMEOUT_MS=900000` au démarrage du serveur de test.

## 7. Ajouter ou modifier un modèle
1. Ajouter une entrée `L(...)` dans le fichier de la famille (`single_post/v2/fNN.js`) et ajuster les tranches de `single_post.js` (clé unique en kebab-case, libellé unique, identité parmi `clair|marque|nuit|editorial|doux`). La clé publique devient `<clé>.<identité>`.
2. Une mise en page doit différer **par sa structure** des 99 autres (colonnes, place des éléments, widgets présents) : changer couleurs ou textes ne suffit pas ; le seuil est 80 % de similarité.
3. Lancer l'audit, puis les deux tests. Le nombre total doit rester 100 (le test et l'audit l'imposent) : remplacer plutôt qu'ajouter.
4. Ne jamais renommer une clé déjà proposée sans nécessité : les sites existants ne dépendent pas des clés, mais les liens de partage d'aperçu, si.

## 8. Décisions techniques
* **Type « autonome » (`standalone`)** plutôt que 100 × 1 skin forcé : la clé `<mise-en-page>.<identité>` est conservée pour rester compatible avec les API et l'interface (filtre par identité, miniature, aperçu).
* **Une identité par mise en page** : l'identité fait partie de la conception (une revue littéraire est éditoriale, un fil en direct est sombre) ; le filtre par identité reste utile (≈ 20 modèles chacune).
* **Aucune image factice** : les visuels viennent de l'article (`{{post.image}}`) ; un article sans image laisse l'emplacement vide, jamais une image d'exemple.
* **Pas de position absolue** : héros et bandeaux sont des conteneurs en flux.

## 9. Limites connues
* Les étiquettes `{{post.author_avatar}}` et `{{post.excerpt}}` sont vides si l'article n'a pas de photo d'auteur ou de résumé ; l'emplacement est alors vide.
* Le sommaire (`toc`) est construit depuis les intertitres : sans intertitre, il est vide.
* Le widget d'image dynamique ne peut pas être « flottant » dans le texte de l'article.
* Contrôle visuel : automatique (Chrome, 3 largeurs) + captures échantillons ; pas de relecture manuelle des 300 rendus.

## 10. Les 100 modèles
La liste complète (clé, nom, famille, identité, grilles, éléments, widgets fonctionnels) est générée dans [`single-post/DIVERSITY_MATRIX.md`](single-post/DIVERSITY_MATRIX.md). Le plan de conception est dans [`single-post/100_TEMPLATES_DIVERSITY_PLAN.md`](single-post/100_TEMPLATES_DIVERSITY_PLAN.md).
