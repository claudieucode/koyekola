-- Marketing 001 — Fondations : organisations, membres, paramètres, journal d'audit.
-- Aucune table du LMS n'est modifiée. Les liens vers les utilisateurs du LMS (user_id) sont volontairement
-- SANS clé étrangère : le module marketing ne doit jamais bloquer ni dépendre de la gestion des comptes du LMS.

CREATE TABLE mk_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Qui a accès à quelle organisation, avec quel rôle (viewer < editor < admin < owner)
CREATE TABLE mk_org_members (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX idx_mk_org_members_user ON mk_org_members(user_id);

-- Réglages par organisation. Un secret (clé d'API du fournisseur…) est TOUJOURS enregistré chiffré (is_secret = 1).
CREATE TABLE mk_settings (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0 CHECK (is_secret IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, key)
);

-- Journal d'audit : qui a fait quoi, sur quoi, quand. En écriture seule (ni modification ni suppression).
-- Pas de suppression en cascade : une organisation qui a un journal ne peut pas être supprimée.
CREATE TABLE mk_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_audit_org ON mk_audit_logs(organization_id, id DESC);
CREATE INDEX idx_mk_audit_resource ON mk_audit_logs(organization_id, resource_type, resource_id, id DESC);

CREATE TRIGGER mk_audit_no_update BEFORE UPDATE ON mk_audit_logs
BEGIN SELECT RAISE(ABORT, 'journal d''audit en lecture seule'); END;
CREATE TRIGGER mk_audit_no_delete BEFORE DELETE ON mk_audit_logs
BEGIN SELECT RAISE(ABORT, 'journal d''audit en lecture seule'); END;
