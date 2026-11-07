-- Liste de naissance / liste de cadeaux partageable. Additif : aucune table existante n'est modifiée.
-- Principe : la quantité « offerte » d'un article n'augmente QUE lorsque la commande qui le contient est payée (jamais avant) ; un remboursement la diminue.

-- 1) La liste. Le lien public est un jeton long et non devinable ; la gestion se fait avec un second secret (stocké haché) ou avec le compte du client propriétaire.
CREATE TABLE mk_shop_gift_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  public_token TEXT NOT NULL,
  manage_token_hash TEXT NOT NULL,
  customer_id INTEGER REFERENCES mk_shop_customers(id) ON DELETE SET NULL,
  owner_name TEXT,
  owner_email TEXT,
  title TEXT NOT NULL,
  message TEXT,
  event_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  allow_recipient_delivery INTEGER NOT NULL DEFAULT 0 CHECK (allow_recipient_delivery IN (0, 1)),
  recipient_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_gift_lists_token ON mk_shop_gift_lists(public_token);
CREATE INDEX idx_mk_shop_gift_lists_site ON mk_shop_gift_lists(organization_id, site_id, id);
CREATE INDEX idx_mk_shop_gift_lists_customer ON mk_shop_gift_lists(customer_id);

-- 2) Les articles souhaités. offered ne dépasse jamais wanted (garanti par la base).
CREATE TABLE mk_shop_gift_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES mk_shop_gift_lists(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES mk_shop_variants(id) ON DELETE CASCADE,
  wanted INTEGER NOT NULL CHECK (wanted BETWEEN 1 AND 99),
  offered INTEGER NOT NULL DEFAULT 0 CHECK (offered >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (offered <= wanted)
);
CREATE UNIQUE INDEX idx_mk_shop_gift_items_line ON mk_shop_gift_items(list_id, product_id, COALESCE(variant_id, 0));
CREATE INDEX idx_mk_shop_gift_items_product ON mk_shop_gift_items(product_id);

-- 3) Lien ligne de panier -> article de liste (ce que l'invité veut offrir), avec son petit mot facultatif pour le bénéficiaire.
CREATE TABLE mk_shop_gift_cart_links (
  cart_item_id INTEGER PRIMARY KEY REFERENCES mk_shop_cart_items(id) ON DELETE CASCADE,
  gift_item_id INTEGER NOT NULL REFERENCES mk_shop_gift_items(id) ON DELETE CASCADE,
  from_name TEXT,
  note TEXT
);
CREATE INDEX idx_mk_shop_gift_cart_links_item ON mk_shop_gift_cart_links(gift_item_id);

-- 4) Lien ligne de commande -> article de liste. counted_at est renseigné au paiement (quantité comptée dans counted), refunded_at au remboursement.
CREATE TABLE mk_shop_gift_order_lines (
  order_item_id INTEGER PRIMARY KEY REFERENCES mk_shop_order_items(id) ON DELETE CASCADE,
  gift_item_id INTEGER NOT NULL REFERENCES mk_shop_gift_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  counted INTEGER NOT NULL DEFAULT 0 CHECK (counted >= 0),
  counted_at TEXT,
  refunded_at TEXT,
  from_name TEXT,
  note TEXT
);
CREATE INDEX idx_mk_shop_gift_order_lines_item ON mk_shop_gift_order_lines(gift_item_id);
