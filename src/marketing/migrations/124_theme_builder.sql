-- Programme 23.1 — Theme Builder : modèles de thème PAR SITE (additif : aucune table existante n'est modifiée, aucune donnée existante n'est touchée).
-- Un modèle référence un DOCUMENT existant (page du Page Builder ou composant) édité dans l'éditeur actuel ; cette table ne porte que les métadonnées :
-- type, conditions d'affichage, statut, révision. site_id est OBLIGATOIRE : un modèle n'existe que dans son site.
CREATE TABLE mk_tb_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('page', 'component')),
  source_id INTEGER NOT NULL,
  conditions TEXT NOT NULL DEFAULT '{"include":[],"exclude":[]}',
  revision INTEGER NOT NULL DEFAULT 1,
  legacy_ref TEXT,                              -- import idempotent des anciens réglages (« theme:<id> », « site-part:header »)
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  archived_at TEXT
);
CREATE INDEX idx_mk_tb_templates_site ON mk_tb_templates (site_id, type, status);
CREATE UNIQUE INDEX idx_mk_tb_templates_legacy ON mk_tb_templates (site_id, legacy_ref) WHERE legacy_ref IS NOT NULL;

-- Versions publiées (restauration) : copie des conditions et du contenu du document au moment de la publication.
CREATE TABLE mk_tb_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES mk_tb_templates(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  conditions TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (template_id, number)
);
