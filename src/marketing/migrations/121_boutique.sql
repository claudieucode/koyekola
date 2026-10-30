-- Programme 20.5 — E-commerce Builder : moteur de boutique PAR SITE (additif : aucune table existante n'est modifiée).
-- Avant : le seul commerce était celui des formations (tables courses/orders/order_items/checkout_sessions, sans site, sans variantes, sans stock).
-- Ce moteur ne les touche pas. Toutes les tables portent organization_id + site_id (site principal = site_id NULL, comme le reste du CMS) ;
-- les unicités passent par COALESCE(site_id, 0). Les montants sont des ENTIERS en plus petite unité de la devise (centimes). Aucun taux fiscal n'est codé en dur.

-- Paramètres commerciaux d'une boutique (une ligne par site).
CREATE TABLE mk_shop_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),                 -- boutique ouverte au public
  currency TEXT NOT NULL DEFAULT 'eur',
  prices_include_tax INTEGER NOT NULL DEFAULT 1 CHECK (prices_include_tax IN (0, 1)),
  tax_enabled INTEGER NOT NULL DEFAULT 0 CHECK (tax_enabled IN (0, 1)),
  default_country TEXT,                                                          -- ISO 3166-1 alpha-2, sert au calcul avant saisie de l'adresse
  guest_checkout INTEGER NOT NULL DEFAULT 1 CHECK (guest_checkout IN (0, 1)),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  payment_methods TEXT NOT NULL DEFAULT '[]',                                    -- JSON : méthodes activées pour CETTE boutique (stripe, manual)
  manual_instructions TEXT,                                                      -- texte affiché pour le paiement manuel (virement…)
  notify_email TEXT,                                                             -- adresse recevant « nouvelle commande »
  order_prefix TEXT NOT NULL DEFAULT 'CMD',
  next_order_number INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_settings_site ON mk_shop_settings(organization_id, COALESCE(site_id, 0));

CREATE TABLE mk_shop_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES mk_shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_categories_slug ON mk_shop_categories(organization_id, COALESCE(site_id, 0), slug);

-- Produit. type : simple | variable | digital (opérationnels). « downloadable » et « grouped » sont réservés : refusés par le service tant que leur traitement n'existe pas.
CREATE TABLE mk_shop_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'simple' CHECK (type IN ('simple', 'variable', 'digital', 'downloadable', 'grouped')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  sku TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  sale_starts_at TEXT,
  sale_ends_at TEXT,
  manage_stock INTEGER NOT NULL DEFAULT 0 CHECK (manage_stock IN (0, 1)),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams >= 0),
  length_mm INTEGER, width_mm INTEGER, height_mm INTEGER,
  requires_shipping INTEGER NOT NULL DEFAULT 1 CHECK (requires_shipping IN (0, 1)),
  image_url TEXT,
  gallery TEXT NOT NULL DEFAULT '[]',                                            -- JSON : liste d'URLs de la médiathèque
  tags TEXT NOT NULL DEFAULT '[]',                                               -- JSON : liste de libellés
  attributes TEXT NOT NULL DEFAULT '[]',                                         -- JSON (produit variable) : [{ name, values: [] }]
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  seo_title TEXT,
  seo_description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_mk_shop_products_slug ON mk_shop_products(organization_id, COALESCE(site_id, 0), slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_mk_shop_products_sku ON mk_shop_products(organization_id, COALESCE(site_id, 0), sku) WHERE sku IS NOT NULL AND sku <> '' AND deleted_at IS NULL;
CREATE INDEX idx_mk_shop_products_list ON mk_shop_products(organization_id, site_id, status, deleted_at);

CREATE TABLE mk_shop_product_categories (
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES mk_shop_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX idx_mk_shop_product_categories_cat ON mk_shop_product_categories(category_id);

-- Variante d'un produit variable : ses propres SKU, prix (sinon prix du produit) et stock.
CREATE TABLE mk_shop_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  sku TEXT,
  options TEXT NOT NULL DEFAULT '{}',                                            -- JSON : { "Taille": "M", "Couleur": "Bleu" }
  options_key TEXT NOT NULL,                                                     -- clé canonique (options triées) : une combinaison = une variante
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  sale_price_cents INTEGER CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  manage_stock INTEGER NOT NULL DEFAULT 1 CHECK (manage_stock IN (0, 1)),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams >= 0),
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_variants_combo ON mk_shop_variants(product_id, options_key);
CREATE UNIQUE INDEX idx_mk_shop_variants_sku ON mk_shop_variants(organization_id, COALESCE(site_id, 0), sku) WHERE sku IS NOT NULL AND sku <> '';

-- Journal des mouvements de stock (qui a changé quoi, pourquoi).
CREATE TABLE mk_shop_stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,                                                          -- order | release | adjustment
  order_id INTEGER,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_stock_movements_product ON mk_shop_stock_movements(product_id, created_at);

-- Panier serveur (visiteur ou client). Le jeton du navigateur n'est jamais stocké en clair (empreinte SHA-256).
CREATE TABLE mk_shop_carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  customer_id INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'converted', 'abandoned')),
  coupon_code TEXT,
  version INTEGER NOT NULL DEFAULT 1,                                            -- incrémentée à chaque modification : détection des modifications concurrentes
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_carts_token ON mk_shop_carts(token_hash);
CREATE INDEX idx_mk_shop_carts_customer ON mk_shop_carts(customer_id, status);

CREATE TABLE mk_shop_cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id INTEGER NOT NULL REFERENCES mk_shop_carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES mk_shop_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Une ligne par produit/variante : ajouter deux fois augmente la quantité, ne crée pas de doublon.
CREATE UNIQUE INDEX idx_mk_shop_cart_items_line ON mk_shop_cart_items(cart_id, product_id, COALESCE(variant_id, 0));

-- Clients d'une boutique : DISTINCTS des utilisateurs de la plateforme (users) ; un e-mail peut être client de deux boutiques sans lien entre elles.
CREATE TABLE mk_shop_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,                                                            -- NULL = client invité (sans compte)
  name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  addresses TEXT NOT NULL DEFAULT '[]',                                          -- JSON : carnet d'adresses
  marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_customers_email ON mk_shop_customers(organization_id, COALESCE(site_id, 0), email);

-- Sessions de compte client et jetons de réinitialisation de mot de passe (empreintes seulement).
CREATE TABLE mk_shop_customer_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES mk_shop_customers(id) ON DELETE CASCADE,
  site_id INTEGER,
  kind TEXT NOT NULL CHECK (kind IN ('session', 'reset')),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_customer_tokens_hash ON mk_shop_customer_tokens(token_hash);

-- Livraison : zones (liste de pays, vide = tous) et méthodes (forfait, gratuite au-delà d'un montant, selon le poids).
CREATE TABLE mk_shop_shipping_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  countries TEXT NOT NULL DEFAULT '[]',                                          -- JSON : codes pays ISO ; [] = tous les pays
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE mk_shop_shipping_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  zone_id INTEGER NOT NULL REFERENCES mk_shop_shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('flat', 'free_over', 'weight')),
  cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  min_subtotal_cents INTEGER,                                                    -- free_over : seuil de gratuité ; flat/weight : montant minimal pour proposer la méthode
  min_weight_grams INTEGER,
  max_weight_grams INTEGER,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  position INTEGER NOT NULL DEFAULT 0
);

-- Taxes : règles configurables par pays/région. Aucun taux par défaut.
CREATE TABLE mk_shop_tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,                                                         -- ISO alpha-2, ou '*' pour tout pays
  region TEXT,                                                                   -- sous-division (facultatif)
  rate_bp INTEGER NOT NULL CHECK (rate_bp >= 0 AND rate_bp <= 10000),            -- points de base : 2000 = 20,00 %
  applies_to_shipping INTEGER NOT NULL DEFAULT 0 CHECK (applies_to_shipping IN (0, 1)),
  priority INTEGER NOT NULL DEFAULT 0
);

-- Coupons de la boutique (distincts des coupons de formations).
CREATE TABLE mk_shop_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value INTEGER NOT NULL CHECK (value > 0),                                      -- percent : 1..100 ; fixed : centimes
  min_subtotal_cents INTEGER,
  starts_at TEXT,
  ends_at TEXT,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER,
  product_ids TEXT NOT NULL DEFAULT '[]',                                        -- restriction : produits (vide = tous)
  category_ids TEXT NOT NULL DEFAULT '[]',                                       -- restriction : catégories (vide = toutes)
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_coupons_code ON mk_shop_coupons(organization_id, COALESCE(site_id, 0), code);

-- Commandes. status : pending (créée, paiement attendu) → paid → processing → shipped → completed ; cancelled ; refunded. payment_status : unpaid | pending | paid | failed | refunded.
CREATE TABLE mk_shop_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  customer_id INTEGER REFERENCES mk_shop_customers(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  currency TEXT NOT NULL,
  prices_include_tax INTEGER NOT NULL DEFAULT 1,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  coupon_code TEXT,
  shipping_method_name TEXT,
  billing_address TEXT NOT NULL DEFAULT '{}',
  shipping_address TEXT NOT NULL DEFAULT '{}',
  tax_lines TEXT NOT NULL DEFAULT '[]',
  tracking_number TEXT,
  idempotency_key TEXT NOT NULL,                                                 -- double soumission : même clé = même commande
  stock_released INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_orders_number ON mk_shop_orders(organization_id, COALESCE(site_id, 0), number);
CREATE UNIQUE INDEX idx_mk_shop_orders_idem ON mk_shop_orders(organization_id, COALESCE(site_id, 0), idempotency_key);
CREATE INDEX idx_mk_shop_orders_list ON mk_shop_orders(organization_id, site_id, status, created_at);
CREATE INDEX idx_mk_shop_orders_customer ON mk_shop_orders(customer_id);

CREATE TABLE mk_shop_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  variant_id INTEGER,
  name TEXT NOT NULL,                                                            -- instantané : le produit peut changer ou disparaître ensuite
  variant_label TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_cents INTEGER NOT NULL,
  line_subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  weight_grams INTEGER
);
CREATE INDEX idx_mk_shop_order_items_order ON mk_shop_order_items(order_id);

-- Historique de la commande (changements de statut, paiement, notes). Écrit par le serveur uniquement.
CREATE TABLE mk_shop_order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL,                                                           -- user:<id> | customer | system | provider:<nom>
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_order_events_order ON mk_shop_order_events(order_id, id);

-- Paiements : un enregistrement par tentative auprès d'un fournisseur.
CREATE TABLE mk_shop_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_ref TEXT,
  provider_intent TEXT,                                                          -- identifiant du paiement chez le fournisseur (rapprochement des remboursements)
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_payments_ref ON mk_shop_payments(provider, provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX idx_mk_shop_payments_order ON mk_shop_payments(order_id);

-- Événements de fournisseur déjà traités (idempotence des webhooks).
CREATE TABLE mk_shop_webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE mk_shop_coupon_redemptions (
  coupon_id INTEGER NOT NULL REFERENCES mk_shop_coupons(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  customer_email TEXT,
  PRIMARY KEY (coupon_id, order_id)
);

-- Notifications commerciales : une ligne par envoi tenté (journal des tentatives et des échecs).
CREATE TABLE mk_shop_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  order_id INTEGER REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'failed', 'not_configured')),
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_notifications_once ON mk_shop_notifications(order_id, event, recipient) WHERE status = 'queued';
