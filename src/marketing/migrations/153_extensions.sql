-- Extensions (palier P3) — historique des activations et paramètres par site. TABLES NOUVELLES, strictement additives, SANS AUCUNE LIGNE ; mk_site_modules (084) reste LA source de l'état d'activation.
-- mk_extension_events : journal append-only (aucune modification ni suppression possible) de chaque activation, désactivation, refus, échec et changement de paramètre.
-- mk_extension_settings : paramètres d'une extension POUR UN SITE (validés par le manifeste côté serveur) ; jamais partagés entre sites.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_ext_* puis DROP TABLE mk_extension_settings, mk_extension_events. Aucune donnée d'extension (boutique, formations…) n'est touchée.

CREATE TABLE mk_extension_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  extension TEXT NOT NULL CHECK (length(extension) BETWEEN 2 AND 30 AND extension NOT GLOB '*[^a-z_]*'),
  action TEXT NOT NULL CHECK (action IN ('enable', 'disable', 'refused', 'failed', 'settings')),
  version TEXT,
  user_id INTEGER,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_ext_events_org ON mk_extension_events(organization_id, id DESC);
CREATE INDEX idx_mk_ext_events_site ON mk_extension_events(site_id, extension, id DESC);
CREATE TRIGGER trg_mk_ext_events_insert BEFORE INSERT ON mk_extension_events
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'journal des extensions refusé : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_ext_events_no_update BEFORE UPDATE ON mk_extension_events BEGIN SELECT RAISE(ABORT, 'journal des extensions : lecture seule'); END;
CREATE TRIGGER trg_mk_ext_events_no_delete BEFORE DELETE ON mk_extension_events BEGIN SELECT RAISE(ABORT, 'journal des extensions : lecture seule'); END;

CREATE TABLE mk_extension_settings (
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  extension TEXT NOT NULL CHECK (length(extension) BETWEEN 2 AND 30 AND extension NOT GLOB '*[^a-z_]*'),
  key TEXT NOT NULL CHECK (length(key) BETWEEN 1 AND 40 AND key NOT GLOB '*[^a-z0-9_]*'),
  value TEXT NOT NULL,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, extension, key)
);
CREATE TRIGGER trg_mk_ext_settings_insert BEFORE INSERT ON mk_extension_settings
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'paramètre d''extension refusé : le site doit appartenir à la même organisation'); END;
