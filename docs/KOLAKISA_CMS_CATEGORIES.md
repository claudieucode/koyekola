# KOLAKISA CMS — Articles → Catégories (palier ARTICLES-03)

Branche `articles-03-categories`, issue de `origin/main` (`4b149d1`). Référence : l'écran WordPress « Catégories ». Ce document décrit l'état **réel**.

## 1. Audit : ce qui existait (réutilisé, rien de recréé)

- Service `src/services/taxonomy.js` : un seul système de termes pour catégories et étiquettes (`taxonomy_terms`, `taxonomy_relations`), arbre, anti-boucle et profondeur maximale, adresses uniques, suppression avec réassignation, fusion, miroir texte des articles (`posts.category` / `subcategory` / `tags`), compteurs calculés dans la base.
- Routes `src/marketing/web/taxonomies.js` (liste, création, modification, suppression, fusion, actions groupées), vue `views/marketing/taxonomy-terms.ejs`, script `public/js/cms-taxonomy.js`.
- Isolation par site : `siteContent` (`adopt`, `scopePredicate`, `allowedContent`), garde de portée `routeScopes.js`. Droits : `taxonomies.read / write / delete`.
- Éditeur d'articles : sélecteur de catégories alimenté par le même service (`taxonomy.tree` limité au site de l'article).

## 2. Changements de ce palier

| Sujet | Avant | Maintenant |
|---|---|---|
| Disposition | Bouton « Ajouter » ouvrant une fenêtre ; filtres en barre | **Formulaire « Ajouter une catégorie » à gauche** (nom, slug, catégorie parente, description), **tableau à droite** ; une colonne sous 900 px |
| Tableau | Colonnes Nom, Description, Parent, Articles, En ligne, actions | **Case, Nom, Description, Slug, Total** ; en-tête répété en pied ; actions au survol : Modifier, Fusionner…, Supprimer, Afficher |
| Tri | Liste déroulante | **Tri par colonne** (`?orderby=nom\|description\|slug\|total&order=asc\|desc`), liste fermée côté serveur, `aria-sort` |
| Recherche | Filtre | Champ + « Rechercher des catégories » (nom, slug, description), conservée avec tri et pagination, bouton Réinitialiser |
| Actions groupées | Barre du haut | Barre du **haut et du bas** (`action` / `action2`), confirmation avant suppression, pas de double envoi |
| Compteur | `COUNT` de relations (comptait aussi la corbeille pour le tri) | Même définition partout : articles **existants** (brouillon, programmé, publié), **hors corbeille**, un article une seule fois ; calculé dans la requête de liste (pas de requête par ligne) ; lien vers la liste des articles filtrée |
| Isolation | Nom et slug comparés **tous sites confondus** : le site B ne pouvait pas créer « Conseils » si A l'avait, et le message révélait le nom de la catégorie de A | Doublon de nom comparé **dans le même site** ; le message d'un slug déjà pris ne **révèle plus le nom** d'un terme d'un autre site |
| Mise à jour partielle | Sans `parent_id`, la catégorie repassait à la racine | Sans `parent_id`, le parent n'est pas touché |

Aucune migration, aucune table, aucune permission nouvelle.

## 3. Règles

- **Hiérarchie** : parent du même site et de la même taxonomie ; pas son propre parent, pas de boucle (parent = descendant), profondeur limitée (`MAX_DEPTH`). Parent d'un autre site (ou du site principal) : refusé à la création comme à la modification. Les sous-catégories d'une catégorie supprimée remontent d'un niveau.
- **Slug** : vide → tiré du nom (accents et caractères spéciaux normalisés, suffixe `-2`… en cas de collision) ; fourni → normalisé puis refusé s'il est déjà pris, jamais remplacé en silence. **Les adresses publiques `/blog/categorie/<slug>` sont communes à tous les sites** : un slug reste donc unique par taxonomie, tous sites confondus (sinon deux sites se disputeraient la même URL).
- **Catégorie par défaut** : Kolakisa n'en a pas et n'en crée pas (un article peut n'avoir aucune catégorie ; aucune création automatique à l'ouverture de la page). **Règle de suppression** : une catégorie vide se supprime ; une catégorie utilisée est **refusée** tant qu'on n'indique pas la catégorie qui reprend ses articles (ou qu'on la fusionne). Les articles ne sont jamais supprimés.
- **Description** : texte brut, 500 caractères, échappé à l'affichage.

## 4. Sécurité vérifiée (tests)

Modifier, supprimer, fusionner ou réassigner vers une catégorie d'un autre site : refusé sans écriture ; actions groupées : seules les catégories du site sont touchées ; création sur A invisible sur B, sur le principal et pour l'administrateur de B ; lecteur : aucun formulaire, 403 sur les écritures ; anonyme refusé ; l'éditeur refuse une catégorie d'un autre site ; tri : colonne arbitraire ignorée, aucun SQL injectable ; recherche : `%` littéral.

## 5. Limites connues (non faites, pas simulées)

- **Pas de « modification rapide » en ligne** : « Modifier » ouvre la fenêtre de modification complète (nom, slug, parent, description).
- **Pas de catégorie par défaut** (voir §3) ; pas de « convertisseur catégories → étiquettes » ; pas de notification promotionnelle.
- **Actions groupées** : « Supprimer » seulement (les catégories utilisées sont refusées, avec leur nom dans le message) ; pas de réassignation en lot.
- **Tri alphabétique** : l'ordre SQLite place les noms accentués en tête de lettre « É… » après Z (comportement préexistant, inchangé).
- **Options de l'écran / Aide** de la capture : non reproduites sur cet écran.
- **Contrôle visuel en navigateur réel** (alignements, responsive) : non exécuté ici.
