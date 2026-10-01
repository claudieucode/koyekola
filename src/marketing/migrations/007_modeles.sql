-- Marketing 007 — Modèles d'e-mails : contenu en blocs (JSON validé et normalisé par templates/blocks.js) + historique des versions.
-- Le HTML n'est pas stocké : il est produit à la demande à partir des blocs (un seul chemin, donc jamais de HTML « libre » enregistré).
CREATE TABLE mk_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  kind TEXT NOT NULL DEFAULT 'marketing' CHECK (kind IN ('marketing', 'transactional')),
  subject TEXT NOT NULL DEFAULT '',
  preheader TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '{}',
  footer TEXT NOT NULL DEFAULT '{}',
  blocks TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);

-- Anciennes versions (les 20 dernières sont gardées) : consultation et restauration
CREATE TABLE mk_template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  template_id INTEGER NOT NULL REFERENCES mk_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (template_id, version)
);
