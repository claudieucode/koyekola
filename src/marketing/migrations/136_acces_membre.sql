-- Accès membre et ventes privées à durée limitée. Additif : aucune table existante n'est modifiée.

-- 1) Membres : un client inscrit de la boutique, approuvé par le vendeur ou entré avec un code d'invitation. 'pending' = demande en attente, 'revoked' = accès retiré par le vendeur.
CREATE TABLE mk_shop_members (
  customer_id INTEGER PRIMARY KEY REFERENCES mk_shop_customers(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'revoked')),
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'invitation', 'request')),
  invitation_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_members_site ON mk_shop_members(organization_id, site_id, status);

-- 2) Codes d'invitation créés par le vendeur : nombre d'usages maximum et date d'expiration réels, vérifiés à chaque utilisation.
CREATE TABLE mk_shop_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  note TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_invitations_code ON mk_shop_invitations(organization_id, COALESCE(site_id, 0), code);

-- 3) Règles « réservé aux membres » sur un produit ou une catégorie (et ses sous-catégories). mode : 'hide' = masqué aux non-membres, 'lock' = visible avec cadenas.
CREATE TABLE mk_shop_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('product', 'category')),
  target_id INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'lock' CHECK (mode IN ('hide', 'lock')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_access_rules_target ON mk_shop_access_rules(kind, target_id);
CREATE INDEX idx_mk_shop_access_rules_site ON mk_shop_access_rules(organization_id, site_id);

-- 4) Ventes privées : fenêtre réelle (UTC, « AAAA-MM-JJ HH:MM:SS ») rattachée à des produits ou catégories. Hors fenêtre, ces produits ne s'achètent pas.
CREATE TABLE mk_shop_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_mk_shop_sales_site ON mk_shop_sales(organization_id, site_id);
CREATE TABLE mk_shop_sale_targets (
  sale_id INTEGER NOT NULL REFERENCES mk_shop_sales(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('product', 'category')),
  target_id INTEGER NOT NULL,
  PRIMARY KEY (sale_id, kind, target_id)
);
CREATE INDEX idx_mk_shop_sale_targets_target ON mk_shop_sale_targets(kind, target_id);
