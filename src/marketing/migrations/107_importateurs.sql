-- Outils → Importer : registre des identifiants SOURCE des contenus importés (détection fiable des doublons, reprise d'un import interrompu sans recréer ce qui existe)
-- et état d'activation des importateurs. Migration ADDITIVE : deux nouvelles tables, aucune table existante n'est modifiée ; aucune donnée n'est lue ni supprimée.
-- Annulation : DROP TABLE mk_import_sources ; DROP TABLE mk_importer_state (ne perd que l'historique des correspondances source → contenu, jamais les contenus).

CREATE TABLE IF NOT EXISTS mk_import_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),          -- site de destination (NULL = site principal)
  site_key INTEGER NOT NULL DEFAULT 0,               -- 0 = site principal, sinon l'identifiant du site (rend l'unicité effective aussi pour le principal)
  source TEXT NOT NULL,                              -- importateur : wordpress, feed…
  source_key TEXT NOT NULL,                          -- identifiant dans la source (guid, identifiant de publication…), jamais le titre seul
  resource_type TEXT NOT NULL,                       -- articles | pages | taxonomies | comments | media
  local_id INTEGER,
  local_ref TEXT,                                    -- chemin du fichier pour un média
  run_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, site_key, source, resource_type, source_key)
);
CREATE INDEX IF NOT EXISTS idx_mk_import_sources_lookup ON mk_import_sources (organization_id, source, resource_type, source_key);
CREATE INDEX IF NOT EXISTS idx_mk_import_sources_site_fk ON mk_import_sources (site_id) WHERE site_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS mk_importer_state (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  importer_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, importer_id)
);
