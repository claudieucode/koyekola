# KOLAKISA CMS — Palier 5 : moteur de taxonomies

## Architecture
- `taxonomy_terms` (taxonomy, name, slug, description, parent_id, meta) — `UNIQUE (taxonomy, slug)` : « seo » peut être une catégorie ET une étiquette.
- `taxonomy_relations` (content_type, content_id, term_id, is_primary, position) — générique : un futur type de contenu s'enregistre avec `registerContent`, une future taxonomie avec `registerTaxonomy`.
- Service central : `src/services/taxonomy.js` (création, modification, suppression avec réassignation, fusion, comptages SQL, arbre, événements `term.*` / `content.terms.changed`).
- Compatibilité : `posts.category`, `posts.subcategory`, `posts.tags` restent des colonnes MIROIR tenues à jour par `taxonomy.mirror()` (sitemap, SEO, catalogue du pont continuent de fonctionner).
- Reprise de l'existant : `src/services/taxonomyBackfill.js`, une seule fois à la création des tables.
- Un déclencheur SQL supprime les relations d'un article supprimé définitivement.

## Adresses
- Admin : `/marketing/site-web/articles/categories` et `/etiquettes` ; actions `POST …/termes[/:id[/supprimer|/fusionner]]`, `…/termes/actions`.
- Public : `/blog/categorie/:slug` (inclut les sous-catégories) et `/blog/etiquette/:slug` (404 si inconnu). Bases réglables : `TAXONOMY_CATEGORY_BASE`, `TAXONOMY_TAG_BASE`.
- Éditeur : `GET/POST /formateur/blog/api/termes` (recherche, création rapide).

## Droits
`taxonomies.read` (lecteur+), `taxonomies.write` (éditeur+), `taxonomies.delete` (admin+, suppression et fusion).

## Règles
Un terme utilisé n'est jamais supprimé en silence (réassignation ou fusion). Profondeur max 10, cycles refusés. Compteurs toujours calculés en SQL.

## Préparé, non implémenté
Taxonomies personnalisées pour d'autres contenus (produits, pages), méta SEO par terme (colonne `meta`), fil d'Ariane structuré, branchement des événements sur l'automatisation, multi-site.
