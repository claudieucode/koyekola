-- Marketing 006 — Imports CSV : suivi d'un import (aperçu → analyse → exécution par tranches reprenables) et lignes rejetées.
-- Le fichier est conservé (source_text) le temps de l'import puis vidé : aucune donnée personnelle ne traîne inutilement.
CREATE TABLE mk_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  filename TEXT NOT NULL DEFAULT '',
  delimiter TEXT NOT NULL DEFAULT ',',
  headers TEXT NOT NULL DEFAULT '[]',
  total_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'previewed' CHECK (status IN ('previewed', 'running', 'done', 'failed')),
  mapping TEXT NOT NULL DEFAULT '[]',
  options TEXT NOT NULL DEFAULT '{}',
  processed_rows INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  unchanged_count INTEGER NOT NULL DEFAULT 0,
  invalid_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  suppressed_count INTEGER NOT NULL DEFAULT 0,
  subscribed_count INTEGER NOT NULL DEFAULT 0,
  blocked_unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  error TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX idx_mk_imports_org ON mk_imports(organization_id, id);

CREATE TABLE mk_import_rejects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  import_id INTEGER NOT NULL REFERENCES mk_imports(id) ON DELETE CASCADE,
  line INTEGER NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL,
  raw TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_mk_import_rejects_import ON mk_import_rejects(import_id, line);
