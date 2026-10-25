-- Index des clés étrangères non couvertes (notes d'administration, demandes de données personnelles) : sans eux, supprimer un site ou un compte
-- obligerait SQLite à parcourir ces tables en entier pour vérifier les références. Migration ADDITIVE (index seulement, aucune donnée touchée).
-- Annulation : DROP INDEX de chacun des index ci-dessous.
CREATE INDEX IF NOT EXISTS idx_mk_admin_notes_site_fk ON mk_admin_notes (site_id) WHERE site_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mk_admin_notes_author_fk ON mk_admin_notes (author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mk_admin_notes_updated_by_fk ON mk_admin_notes (updated_by) WHERE updated_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cms_privacy_requests_site_fk ON cms_privacy_requests (site_id) WHERE site_id IS NOT NULL;
