# Base de données

## Audit
- Recherche d'une page publique : `WHERE slug = ? AND status = 'published' AND archived_at IS NULL` ; `slug` est `UNIQUE` (indexé, migration 027).
- Index présents : `site_id`, `form_id`, `parent_id`, `(organization_id, archived_at, updated_at)`, `scheduled_at`.
- Nouveau : `mk_perf_reports(site_id, page_id, id)` indexé ; lecture du réglage = clé primaire `site_id`.

## Résultat
**Aucune requête lente mesurée, aucun N+1 mesuré, aucune migration, aucune modification de schéma** (tables créées à la demande, aucune donnée supprimée). Aucune optimisation SQL n'a été appliquée : la consigne interdit de modifier sans problème mesuré.

## Non audité
Requêtes des widgets dynamiques (articles, formations, produits) sous volume : non mesurées.
