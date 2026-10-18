-- R9-3 — Option B, étape 1 : le site maître obtient une LIGNE DÉDIÉE dans mk_sites (ajout seul, aucune donnée existante n'est réécrite).
-- Cette migration n'est PAS dans src/marketing/migrations (donc jamais appliquée au démarrage de l'application) : elle est jouée explicitement par scripts/r9-migrer-site-maitre.js, sur une copie, après les contrôles de scripts/r9/site-maitre.js.
-- Les lignes de contenu du site principal gardent site_id NULL : NULL et l'identifiant de la nouvelle ligne ne sont PAS interchangeables à ce stade (voir docs R9-3).
ALTER TABLE mk_sites ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1));
CREATE UNIQUE INDEX uq_mk_sites_primary ON mk_sites(organization_id) WHERE is_primary = 1;
INSERT INTO mk_sites (organization_id, name, status, slug, site_type, description, is_primary)
  VALUES ((SELECT id FROM mk_organizations ORDER BY id LIMIT 1), 'Site principal', 'active', 'principal', 'principal', 'Site maître de la plateforme', 1);
CREATE TRIGGER mk_sites_primary_no_delete BEFORE DELETE ON mk_sites WHEN OLD.is_primary = 1
BEGIN SELECT RAISE(ABORT, 'Le site principal ne peut pas être supprimé.'); END;
CREATE TRIGGER mk_sites_primary_stays_active BEFORE UPDATE OF status, deleted_at ON mk_sites WHEN OLD.is_primary = 1 AND (NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'Le site principal ne peut être ni archivé ni supprimé.'); END;
CREATE TRIGGER mk_sites_primary_fixed BEFORE UPDATE OF is_primary, organization_id ON mk_sites WHEN OLD.is_primary = 1 AND (NEW.is_primary <> 1 OR NEW.organization_id <> OLD.organization_id)
BEGIN SELECT RAISE(ABORT, 'Le rôle de site principal et son organisation sont figés.'); END;
