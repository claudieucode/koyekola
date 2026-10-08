-- KOLAKISA CMS, palier 2 (système de pages) : page parente (hiérarchie préparée) et index de la liste des pages.
-- Additive : aucune colonne ni donnée existante n'est modifiée. Le reste du modèle de page existe déjà dans
-- mk_landing_pages (site_id, name/slug/title, status, created_by, published_at, archived_at = corbeille, draft, revision, seo).
ALTER TABLE mk_landing_pages ADD COLUMN parent_id INTEGER REFERENCES mk_landing_pages(id) ON DELETE SET NULL;
CREATE INDEX idx_mk_landing_pages_parent ON mk_landing_pages(parent_id);
CREATE INDEX idx_mk_landing_pages_list ON mk_landing_pages(organization_id, archived_at, updated_at);
