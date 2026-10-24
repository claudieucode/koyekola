-- Réglages → Connecteurs : centre d'intégrations. Migration ADDITIVE (aucune table existante modifiée, aucune donnée déplacée).
--   mk_connections       : UNE ligne par (organisation, site, connecteur). site_id NULL = niveau central (site principal / organisation).
--                          `config` = réglages NON secrets (JSON). Les SECRETS ne sont jamais ici : ils sont chiffrés (AES-256-GCM, lié au contexte) dans mk_settings, sous « connector.<id>.<champ> » ;
--                          `secret_fields` ne liste que les NOMS des secrets enregistrés. `shared` (niveau central seulement) : les sites peuvent utiliser cette connexion (jamais par défaut).
--   mk_connector_prefs   : fournisseur choisi pour une capacité (texte, image…) à un niveau (site_id 0 = central). Aucun basculement automatique vers un autre fournisseur.
-- Retour arrière : DROP TABLE mk_connector_prefs ; DROP TABLE mk_connections ; (les secrets « connector.% » de mk_settings sont à supprimer à part).
CREATE TABLE IF NOT EXISTS mk_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  connector TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'configured' CHECK (state IN ('configured', 'connected', 'error', 'disabled', 'pending')),
  config TEXT NOT NULL DEFAULT '{}',
  secret_fields TEXT NOT NULL DEFAULT '[]',
  shared INTEGER NOT NULL DEFAULT 0,
  last_test_at TEXT, last_test_ok INTEGER, last_test_code TEXT NOT NULL DEFAULT '', last_test_message TEXT NOT NULL DEFAULT '',
  last_error_at TEXT, last_error_code TEXT NOT NULL DEFAULT '', last_error_message TEXT NOT NULL DEFAULT '',
  usage_count INTEGER NOT NULL DEFAULT 0, last_used_at TEXT,
  created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mk_connections_unique ON mk_connections(organization_id, COALESCE(site_id, 0), connector);
CREATE INDEX IF NOT EXISTS idx_mk_connections_site ON mk_connections(site_id);
CREATE TABLE IF NOT EXISTS mk_connector_prefs (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL DEFAULT 0,
  capability TEXT NOT NULL,
  connector TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, site_id, capability)
);
