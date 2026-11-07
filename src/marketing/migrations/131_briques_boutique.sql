-- Briques de boutique manquantes aux thèmes e-commerce : avis vérifiés, personnalisation par ligne (gravure, initiales), liste de souhaits.
-- Additif : aucune table existante n'est supprimée ; le seul index remplacé est l'unicité d'une ligne de panier (il doit maintenant tenir compte du texte personnalisé).

-- 1) Avis clients. Un avis n'existe que s'il vient d'une commande réelle du produit (order_id renseigné) : aucun avis saisi à la main par le vendeur.
ALTER TABLE mk_shop_settings ADD COLUMN reviews_enabled INTEGER NOT NULL DEFAULT 1 CHECK (reviews_enabled IN (0, 1));
ALTER TABLE mk_shop_settings ADD COLUMN reviews_auto_publish INTEGER NOT NULL DEFAULT 0 CHECK (reviews_auto_publish IN (0, 1));
CREATE TABLE mk_shop_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  moderated_at TEXT
);
-- Un seul avis par commande et par produit.
CREATE UNIQUE INDEX idx_mk_shop_reviews_once ON mk_shop_reviews(order_id, product_id);
CREATE INDEX idx_mk_shop_reviews_product ON mk_shop_reviews(product_id, status);
CREATE INDEX idx_mk_shop_reviews_site ON mk_shop_reviews(organization_id, site_id, status);

-- 2) Personnalisation d'un produit (texte gravé, initiales, message) : réglage du produit, texte saisi par ligne de panier puis copié sur la ligne de commande.
CREATE TABLE mk_shop_product_personalization (
  product_id INTEGER PRIMARY KEY REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  hint TEXT,
  max_length INTEGER NOT NULL DEFAULT 20 CHECK (max_length BETWEEN 1 AND 200),
  required INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1))
);
ALTER TABLE mk_shop_cart_items ADD COLUMN custom_text TEXT;
ALTER TABLE mk_shop_order_items ADD COLUMN custom_text TEXT;
ALTER TABLE mk_shop_order_items ADD COLUMN custom_label TEXT;
DROP INDEX idx_mk_shop_cart_items_line;
CREATE UNIQUE INDEX idx_mk_shop_cart_items_line ON mk_shop_cart_items(cart_id, product_id, COALESCE(variant_id, 0), COALESCE(custom_text, ''));

-- 3) Liste de souhaits : propre à la boutique, rattachée à un jeton de navigateur (et au client s'il est connecté).
CREATE TABLE mk_shop_wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  customer_id INTEGER REFERENCES mk_shop_customers(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_wishlists_token ON mk_shop_wishlists(token_hash);
CREATE INDEX idx_mk_shop_wishlists_customer ON mk_shop_wishlists(customer_id);
CREATE TABLE mk_shop_wishlist_items (
  wishlist_id INTEGER NOT NULL REFERENCES mk_shop_wishlists(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (wishlist_id, product_id)
);
CREATE INDEX idx_mk_shop_wishlist_items_product ON mk_shop_wishlist_items(product_id);
