# Bibliothèque « Résultats de recherche » du Theme Builder

Référence Elementor : `elementor-search-results-reference.md` (comportements confirmés / non vérifiables). Ce document décrit ce que Kolakisa fait réellement.

## 1. Rapport d'audit initial (avant la refonte)

| # | Constat | Gravité | Traitement |
|---|---|---|---|
| 1 | Le catalogue contenait 100 modèles = **20 mises en page × 5 identités visuelles** : à structure égale, 5 modèles ne différaient que par les couleurs, la casse, les arrondis. | Qualité | Remplacé par **10 contenus × 10 compositions** (88 structures différentes sur 100, 100 documents différents). |
| 2 | Presque tous les modèles ne traitaient que des **articles** : ni produits, ni formations, ni pages du site, alors que le moteur de requête les sait filtrer par `?q=`. | Fonction | Quatre sources réelles : articles, produits, formations, pages (`urlFilter`). |
| 3 | Le **champ de recherche n'était pas pré-rempli** avec le terme cherché (`<input name="q">` sans `value`). | Fonction | Corrigé dans le moteur (`landing/index.js` → `dynamicProps`, `_node.ejs`). |
| 4 | L'état « aucun résultat » était un message fixe, sans rappel du terme. | Utilité | Message avec `{{query.q}}`, bloc « Affiner la recherche » (nouveau champ, catégories), lectures conseillées, contact. |
| 5 | Pas d'indication que le nombre de résultats (`archiveinfo`) ne compte que les articles du blog. | Exactitude | Modèles multi-types : pas de nombre global ; chaque section a son titre. |
| 6 | Isolation entre sites, rendu public : correcte (le moteur de requête filtre par site : `mk_content_sites`, `site_id`). | — | Test ajouté. |
| 7 | La page de résultats est `/blog?q=…` (famille `search_results` puis `blog_archive`) ; `/recherche` (recherche globale historique) n'utilise **pas** le Theme Builder. | Limite | Documentée (§8). |

## 2. Périmètre fonctionnel
Catégorie `search_results` (« Résultats de recherche », groupe « Pages et contenus »), vue `search`. Le modèle publié applicable s'affiche quand le visiteur ouvre `/blog?q=<terme>` du site. 100 modèles dans `src/themeBuilder/catalog/search_results.js`.

## 3. Différences Elementor / Kolakisa
Voir le tableau de `elementor-search-results-reference.md` §4. En résumé : titre dynamique = widget `archiveinfo` ; Search Form = widget `search` ; Archive Posts / Loop Grid = grille avec boucle (`urlFilter`) ; « Nothing Found Message » = prop `empty` ; pas de tri visiteur ni de filtres combinés ; pas de prev/next ni défilement infini.

## 4. Architecture
- Le catalogue est du **code** : aucune ligne en base tant qu'un modèle n'est pas utilisé. `catalog/index.js` expose `entries()`, `list()`, `find()`, `build()`.
- `search_results.js` définit des **entrées propres** (`entries()`, comme `not_found.js`) : 10 *contenus* × 10 *compositions*. Clé : `<contenu>.<composition>` (ex. `boutique.grille`). L'identité visuelle (5 skins du kit) est déterministe : `(index du contenu + décalage de la composition) mod 5` → 20 modèles par identité.
- « Utiliser ce modèle » (`catalog/use.js`) crée une **copie indépendante** (page du Page Builder puis modèle du Theme Builder en brouillon). Modifier la copie ne change jamais le catalogue ni un autre site.
- Rendu public : `routes/blog.js` (`renderList`) → `themeRender.renderRegion(families ["search_results","blog_archive"])` avec le contexte `scope.archive` (titre « Résultats pour « q » », nombre) et `query.q`.
- Vignette, aperçu, éditeur et site publié viennent de la même fonction `Catalog.build()`.

### Les 10 contenus
Blog (articles + catégories + populaires) · Magazine (grandes images) · Site d'entreprise (pages puis actualités) · Portfolio (images, sans extrait) · Boutique (produits avec prix, puis articles) · Formations (catalogue, prix, formateur) · Pages du site (titres et liens) · Centre d'aide (réponses + contact) · Tout le site (pages, produits, formations en sections) · Actualités (dates, ton associatif).

### Les 10 compositions
Liste (image à gauche) · Grille de cartes (3 colonnes) · Colonne à droite · Panneau à gauche (titre + champ + aside) · Bandeau de recherche pleine largeur · Premier résultat en grand · Index compact (une ligne par résultat) · Éditorial centré · Barre de filtres (catégories) · Résultats puis pistes.

## 5. Composants natifs utilisés
`archiveinfo`, `search`, `grid` avec `props.loop` (articles / produits / formations / pages), `catfilter`, `querylist`, `courselist`, `menu` (liens manuels vers pages standard), `account`, `heading`, `text`, `button`, `link`, `image` (adresse dynamique `{{post.image}}`… : jamais d'image factice), `divider`, `container`, `group`, `stack`.

## 6. Sources de données et requêtes
- Boucle : `loopQuery` (`landing/index.js`) lit `?q=` (terme, 80 caractères maximum) et `?categorie=` quand `urlFilter` est actif ; `pages/query.js` applique le filtre par site (articles via `mk_content_sites`, produits via le site et le module commerce, formations du site, pages du site) et la recherche `LIKE` échappée (titre, extrait, contenu pour les articles ; nom/sous-titre pour les formations ; nom/description pour les produits ; nom pour les pages).
- Seuls les contenus **publiés** du site sont retournés.
- Étiquettes : `{{post.*}}`, `{{product.*}}`, `{{course.*}}`, `{{page_item.title|url}}`, `{{query.q}}`, `{{archive.*}}`.

## 7. États de recherche
| État | Comportement |
|---|---|
| Avec résultats | Titre « Résultats pour « terme » » et nombre (articles), cartes réelles, pagination par numéros (9 par page en grille 3 colonnes, 8 en liste). Le champ de recherche est pré-rempli. |
| Aucun résultat | Message de la boucle avec le terme (« Aucun résultat pour « terme » … »), bloc « Affiner la recherche » (champ, catégories), lectures conseillées / contact selon le contenu. |
| Terme vide (`/blog`) | Le modèle de recherche n'est pas utilisé (c'est la liste du blog). |
| Chargement / erreur | Page rendue côté serveur : pas d'état de chargement. Une source indisponible (module boutique désactivé) donne la liste vide et son message, jamais une erreur visible. |

## 8. Filtres, tri, pagination — limites assumées
- **Filtre** : catégories d'articles (`catfilter` → `?categorie=`), cumulable avec le terme.
- **Tri visiteur : non pris en charge** par le moteur (l'ordre est fixé par le modèle : récent d'abord). Aucun modèle ne montre de faux contrôle de tri (test dédié).
- **Pagination** : numéros (`lp-<id>=n`, conserve le terme). « Charger plus » existe dans le moteur mais n'est pas utilisé dans cette bibliothèque.
- **Nombre de résultats** : `archiveinfo` compte les articles du blog ; les modèles qui mélangent plusieurs types ne l'affichent pas.
- **Recherche globale `/recherche`** : page historique distincte, hors Theme Builder.
- Pas de recherche en direct ni d'autocomplétion.

## 9. Responsive
Mise en page Flexbox/Grid du Page Builder, aucun positionnement absolu. Toute ligne flex passe à la ligne ; toute grille de plus d'une colonne a des réglages tablette (2 colonnes au plus) et mobile (1 colonne) ; les colonnes latérales passent sous les résultats. Vérification visuelle : `scripts/verification-visuelle-recherche.js` (Chrome, 1280 / 820 / 390 px, débordement horizontal et éléments hors écran, captures).

## 10. Règles d'affichage, sauvegarde, publication
Conditions du Theme Builder (type `search_results`, vue `search`) ; brouillon puis « Publier » ; le plus précis l'emporte ; publier un autre modèle de même condition le remplace (`replace: true`). Les copies déjà utilisées par des sites restent intactes quand le catalogue change (migration sûre : les modèles de sites sont des copies, jamais des références au catalogue).

## 11. Migration et suppression des anciens modèles
Les anciennes clés (`vedette.clair`, `grille-3.clair`, …) n'existent plus dans le catalogue ; les sites qui avaient « utilisé » l'un d'eux gardent leur copie indépendante (page du Page Builder + modèle `mk_tb_templates`). Aucune vignette n'est stockée : elles sont rendues à la demande depuis `Catalog.build()` (rien d'ancien ne peut réapparaître). Le cache de construction est indexé par clé.

## 12. Tests
- `tests/theme-builder-recherche-bibliotheque.test.js` : 100 modèles, clés et noms uniques, anciens modèles disparus, 10 compositions par contenu, aucun document répété, ≥ 80 structures, un titre principal, champ de recherche, boucle réelle avec état vide, liens réels, responsive, pas de contrôle décoratif, identités équilibrées ; puis sur un vrai serveur : aperçu = vignette (100 modèles), utilisation → publication → page publique (terme, champ pré-rempli, pertinence, isolation entre sites, pagination, état vide, pages/produits/formations), remplacement sans reste de l'ancien modèle.
- `tests/theme-builder-catalogue*.test.js`, `theme-builder-stabilisation`, `theme-builder-couverture-rendu` : tous les types.
- `scripts/verification-visuelle-recherche.js` : mesure dans Chrome.

## 13. Limites connues
- Pas de tri visiteur, pas de filtres combinés, pas de recherche en direct (moteur).
- Les images viennent des contenus (`{{post.image}}`…) : un contenu sans image n'en montre pas ; la bibliothèque ne contient aucune image factice.
- Le moteur de recherche est un `LIKE` : pas de pertinence pondérée ni de tolérance aux fautes.
- Elementor Pro n'a pas pu être observé directement.

## 14. Ajouter ou modifier un modèle
1. Ajouter un contenu dans `CONTENTS` (type principal, `more`, `aside`, `after`) : il produit 10 modèles.
2. Ajouter une composition dans `COMPOSITIONS` : elle produit 10 modèles ; garder 100 au total (le test impose exactement 100).
3. Lancer `node --test tests/theme-builder-recherche-bibliotheque.test.js` puis `node scripts/verification-visuelle-recherche.js`.
