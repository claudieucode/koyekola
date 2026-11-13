-- Boutique : produits numériques à télécharger (livraison sécurisée). Migration ADDITIVE.
-- Les fichiers sont rangés HORS du dossier public (DATA_DIR/shop-files), sous un nom aléatoire ; ils ne sont servis que par un lien signé lié à une commande PAYÉE.
-- Un droit de téléchargement (mk_shop_downloads) est créé à l'encaissement : nombre maximal de téléchargements et date limite ; il est révoqué si la commande est remboursée en totalité.
CREATE TABLE mk_shop_product_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                                       -- nom affiché à l'acheteur
  stored_name TEXT NOT NULL,                                 -- nom aléatoire sur le disque (jamais le nom envoyé)
  original_name TEXT NOT NULL,                               -- nom proposé au téléchargement
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_product_files_product ON mk_shop_product_files(product_id);

CREATE TABLE mk_shop_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL,
  file_id INTEGER NOT NULL REFERENCES mk_shop_product_files(id) ON DELETE CASCADE,
  max_downloads INTEGER,                                     -- NULL = illimité
  download_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,                                           -- NULL = sans limite de date
  revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
  last_download_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_downloads_item_file ON mk_shop_downloads(order_item_id, file_id);
CREATE INDEX idx_mk_shop_downloads_order ON mk_shop_downloads(order_id);

ALTER TABLE mk_shop_products ADD COLUMN download_limit INTEGER;   -- NULL = 5 par défaut ; 0 = illimité
ALTER TABLE mk_shop_products ADD COLUMN download_days INTEGER;    -- NULL = 30 jours par défaut ; 0 = sans limite de date
