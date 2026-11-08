# Article individuel — architecture existante de Kolakisa (audit du 8 novembre 2026)

Audit en lecture seule : aucun code, aucun modèle, aucune donnée n'a été modifié.

## 1. Constat principal

**La catégorie contient déjà 100 compositions** (23 familles), livrées par le commit `93886e4d` (« Article individuel : 100 compositions distinctes »). Ce n'est donc pas une bibliothèque à créer de zéro : c'est une bibliothèque à **mesurer, comparer à Elementor, puis à remplacer ou compléter de façon contrôlée**. Le script `node scripts/audit-article-individuel.js --all` répond aujourd'hui : « OK 100 / 100, défauts : 0, identités : éditorial 21, clair 21, doux 20, nuit 19, marque 19 ».

## 2. Où est quoi

| Élément | Fichier | Rôle |
|---|---|---|
| Type `single_post` | `src/themeBuilder/types.js` | Vue `post` ; types globaux : header, footer, sidebar, custom |
| Catalogue | `src/themeBuilder/catalog/single_post.js` + `single_post/part1..4.js`, `shared.js` | 100 mises en page (L(clé, libellé, étiquettes, description, identité, fonction)) ; 23 familles ; tranches par lot |
| Kit | `catalog/kit.js`, `catalog/index.js` | Identités (5), éléments, `build()`, `thumbDoc()`, lisibilité des liens sur fond sombre |
| Rendu | `src/themeBuilder/render.js` | Résout `{{post.*}}` depuis l'article de la requête ; sidebar/custom sous le contenu |
| Conditions | `src/themeBuilder/conditions.js`, `match.js`, `resolve.js` | Inclure/Exclure ; critères article : `ids`, `category`, `childCategory`, `tag`, `author` |
| Stockage | `src/themeBuilder/store.js`, `instances.js` | « Utiliser » = copie indépendante : une page du Page Builder + une ligne `mk_tb_templates` (brouillon) |
| Widgets article | `src/marketing/pages/widgets/site.js`, `nodes.js` | `postcontent`, `postmeta`, `postterms`, `authorbox`, `postnav`, `postcomments`, `toc`, `sharebuttons`, `readingprogress`, `breadcrumb`, `querylist` |
| Contenu dynamique | `src/marketing/pages/dynamic.js`, `query.js` | Étiquettes `{{post.*}}`, requêtes (récents, populaires, commentés, liés, même catégorie, même auteur, aléatoires, archive) |
| Tests | `tests/theme-builder-article-individuel.test.js`, `…-navigateur.test.js`, `single-post-moteur.test.js`, `single-post-serveur.test.js`, `blog-comments.test.js`, `cms-comments*.test.js` | Serveur réel, Chrome 3 largeurs, commentaires |
| Docs existantes | `docs/theme-builder/elementor-single-post-reference.md`, `kolakisa-single-post-library.md` | Référence Elementor (sources lues le 2026-11-04) et mode d'emploi |

## 3. Étiquettes dynamiques réellement présentes dans le code

`post.title`, `post.excerpt`, `post.url`, `post.image`, `post.date`, `post.modified`, `post.author`, `post.author_url`, `post.author_avatar`, `post.author_bio`, `post.category`, `post.category_url`, `post.tags`, `post.reading_time`, `post.comments`, `post.views`, `post.slug`, `post.id`, `post.seo_title`, `post.seo_description`.

**Absent (constaté)** : aucune étiquette de **champ personnalisé** (`post.field.*`) n'a été trouvée dans `dynamic.js`. C'est un écart avec Elementor (balises dynamiques de champs ACF/personnalisés).

## 4. Réponses aux questions de la mission

| Question | Réponse constatée |
|---|---|
| Modèles réellement distincts ? | Oui selon le script (seuil : < 80 % de similarité de structure). Pas de relecture visuelle des 300 rendus. |
| Bon article affiché ? | Oui, testé : l'article A n'affiche pas le contenu de A2 ni d'un autre site. |
| Commentaires réels ? | Oui : le widget `postcomments` lit le moteur de commentaires du CMS (approuvés, réponses, pagination, respect de « commentaires activés »). Formulaire = celui du blog. Pas de source « article précis ». États « en attente de modération » et « erreur d'envoi » : à vérifier dans le plan de tests (non audité ici). |
| Articles similaires réels ? | Oui : `querylist` modes `related`, `samecategory`, `sameauthor`, `popular`, `recent`. Règle « liés = même catégorie ou étiquette ». |
| Sidebars ? | Le type global `sidebar` existe (composant) et s'affiche **sous le contenu, avant le pied de page** (`render.js`). Les modèles Article ne l'utilisent pas comme colonne latérale : leurs colonnes latérales sont des conteneurs internes. Aucune seconde architecture : bon. |
| SEO / double balisage ? | Le JSON-LD de l'article (BlogPosting/Article + auteur + éditeur) est produit par `src/routes/blog.js` et `src/seo/schema.js`. Les modèles n'ajoutent aucun JSON-LD (à confirmer par test automatique). |
| Aperçus fidèles ? | Vignette, aperçu et copie sont tous produits par `build()` / `thumbDoc()` : source unique. |

## 5. Lacunes identifiées (à valider avant toute action)

1. Pas de champ personnalisé dynamique.
2. Post Info moins riche qu'Elementor (pas d'heure, d'ordre, d'icônes, d'éléments personnalisés).
3. Table des matières : pas d'exclusion ni de repli ; navigation : pas de flèches/bordures configurables.
4. Fil d'Ariane saisi à la main (choix assumé : aucun lien inventé).
5. 100 modèles = 23 familles ; certaines familles de la demande (santé, éducation/quiz, juridique/financier, photographie avant/après, code technique) ne sont pas nommées comme familles.
6. Réactions/likes, abonnement à l'auteur, signalement de commentaire, « mode lecture » : non audités / probablement absents.
7. Sidebar du système central non utilisable comme colonne dans le modèle.
8. Contrôle visuel : automatique, pas de relecture humaine des 300 rendus.

## 6. Risque principal d'un remplacement

« Utiliser ce modèle » **copie** le document dans le site : les modèles déjà utilisés ne dépendent pas des clés du catalogue. Remplacer le catalogue ne détruit donc aucun site existant ; le risque porte sur les liens d'aperçu partagés (clés) et sur le travail déjà fait (voir `RISKS_AND_COMPATIBILITY.md`).
