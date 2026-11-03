-- Theme Builder : le SITE PRINCIPAL devient un site à part entière du Theme Builder (convention du CMS : ses contenus portent site_id NULL).
-- Seul changement : mk_tb_templates.site_id accepte NULL (= site principal). Les modèles existants et leurs versions sont recopiés tels quels (mêmes identifiants).
-- L'unicité de l'import des anciens réglages devient (COALESCE(site_id, 0), legacy_ref), comme les autres tables « par site ».
CREATE TABLE mk_tb_templates_r (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('page', 'component')),
  source_id INTEGER NOT NULL,
  conditions TEXT NOT NULL DEFAULT '{"include":[],"exclude":[]}',
  revision INTEGER NOT NULL DEFAULT 1,
  legacy_ref TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  archived_at TEXT
);
INSERT INTO mk_tb_templates_r (id, organization_id, site_id, type, name, status, source_kind, source_id, conditions, revision, legacy_ref, created_by, created_at, updated_at, published_at, archived_at)
  SELECT id, organization_id, site_id, type, name, status, source_kind, source_id, conditions, revision, legacy_ref, created_by, created_at, updated_at, published_at, archived_at FROM mk_tb_templates;

CREATE TABLE mk_tb_versions_r (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES mk_tb_templates_r(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  conditions TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (template_id, number)
);
INSERT INTO mk_tb_versions_r (id, template_id, number, name, conditions, snapshot, created_by, created_at)
  SELECT id, template_id, number, name, conditions, snapshot, created_by, created_at FROM mk_tb_versions;

-- Les versions d'abord (elles dépendent des modèles), puis les modèles : rien n'est supprimé en cascade puisque tout est déjà recopié
DROP TABLE mk_tb_versions;
DROP TABLE mk_tb_templates;
ALTER TABLE mk_tb_templates_r RENAME TO mk_tb_templates;
ALTER TABLE mk_tb_versions_r RENAME TO mk_tb_versions;
CREATE INDEX idx_mk_tb_templates_site ON mk_tb_templates (site_id, type, status);
CREATE UNIQUE INDEX idx_mk_tb_templates_legacy ON mk_tb_templates (COALESCE(site_id, 0), legacy_ref) WHERE legacy_ref IS NOT NULL;
