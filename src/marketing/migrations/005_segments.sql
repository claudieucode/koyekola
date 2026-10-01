-- Marketing 005 — Segments : définitions enregistrées (JSON validé par une grammaire fermée, voir segments/engine.js).
-- Un segment ne stocke PAS ses contacts : il est réévalué à chaque usage, donc toujours à jour.
CREATE TABLE mk_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
