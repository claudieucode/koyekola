-- Marketing 012 — Clés d'API : première brique des « Intégrations » (jalon M5). Une clé donne accès à /api/v1,
-- jamais aux pages /marketing/* (session uniquement). La clé complète n'est JAMAIS stockée : seul son empreinte
-- SHA-256 l'est, comme un mot de passe. Le préfixe (8 caractères) est affiché dans l'interface pour la reconnaître.

CREATE TABLE mk_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'read' CHECK (scope IN ('read', 'write')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  revoked_at TEXT,
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_mk_api_keys_org ON mk_api_keys(organization_id, revoked_at);
