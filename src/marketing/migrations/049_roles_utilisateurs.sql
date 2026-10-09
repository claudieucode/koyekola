-- KOLAKISA CMS, palier 9 (utilisateurs, rôles, permissions) : additive et compatible.
--  - mk_org_members : la contrainte « role IN (owner, admin, editor, viewer) » est levée (reconstruction à l'identique, toutes les lignes
--    sont copiées) : le rôle devient une CLÉ de rôle (rôles du système ou rôle personnalisé de mk_roles), validée par le code ;
--  - mk_roles : rôles personnalisés (liste de permissions) ; les rôles du système restent définis dans le code (organizations.js / access.js) ;
--  - mk_site_members : accès à UN site du Page Builder avec un rôle propre (un même compte : Éditeur du site A, Lecteur du site B, rien sur C) ;
--  - mk_invitations : invitation par e-mail (jeton à usage unique, seule son empreinte est conservée).
-- Aucune donnée existante n'est modifiée ni supprimée.
CREATE TABLE mk_org_members_new (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, user_id)
);
INSERT INTO mk_org_members_new (organization_id, user_id, role, created_at) SELECT organization_id, user_id, role, created_at FROM mk_org_members;
DROP TABLE mk_org_members;
ALTER TABLE mk_org_members_new RENAME TO mk_org_members;
CREATE INDEX idx_mk_org_members_user ON mk_org_members(user_id);

-- La validité du rôle reste garantie PAR LA BASE (comme l'ancienne contrainte) : rôle du système ou rôle personnalisé existant
CREATE TRIGGER mk_org_members_role_insert BEFORE INSERT ON mk_org_members
WHEN NEW.role NOT IN ('owner', 'admin', 'editor', 'author', 'contributor', 'viewer') AND NOT EXISTS (SELECT 1 FROM mk_roles WHERE organization_id = NEW.organization_id AND key = NEW.role)
BEGIN SELECT RAISE(ABORT, 'rôle invalide'); END;
CREATE TRIGGER mk_org_members_role_update BEFORE UPDATE OF role ON mk_org_members
WHEN NEW.role NOT IN ('owner', 'admin', 'editor', 'author', 'contributor', 'viewer') AND NOT EXISTS (SELECT 1 FROM mk_roles WHERE organization_id = NEW.organization_id AND key = NEW.role)
BEGIN SELECT RAISE(ABORT, 'rôle invalide'); END;

CREATE TABLE mk_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  permissions TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, key)
);
CREATE UNIQUE INDEX idx_mk_roles_name ON mk_roles(organization_id, name COLLATE NOCASE);

CREATE TABLE mk_site_members (
  site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, user_id)
);
CREATE INDEX idx_mk_site_members_user ON mk_site_members(user_id);
CREATE TRIGGER mk_site_members_role_insert BEFORE INSERT ON mk_site_members
WHEN NEW.role NOT IN ('admin', 'editor', 'author', 'contributor', 'viewer') AND NOT EXISTS (SELECT 1 FROM mk_roles WHERE key = NEW.role)
BEGIN SELECT RAISE(ABORT, 'rôle invalide'); END;
CREATE TRIGGER mk_site_members_role_update BEFORE UPDATE OF role ON mk_site_members
WHEN NEW.role NOT IN ('admin', 'editor', 'author', 'contributor', 'viewer') AND NOT EXISTS (SELECT 1 FROM mk_roles WHERE key = NEW.role)
BEGIN SELECT RAISE(ABORT, 'rôle invalide'); END;

CREATE TABLE mk_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  invited_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  accepted_user_id INTEGER,
  revoked_at TEXT
);
CREATE INDEX idx_mk_invitations_org ON mk_invitations(organization_id, accepted_at, revoked_at);
CREATE INDEX idx_mk_invitations_email ON mk_invitations(email);
CREATE INDEX idx_mk_invitations_site ON mk_invitations(site_id);
