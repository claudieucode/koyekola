-- Abonnements récurrents (box mensuelle, réassort). Additif : aucune table existante n'est modifiée.
-- Principe : Stripe Billing facture ; le moteur ne crée une commande de réassort QUE lorsque Stripe confirme une facture payée (webhook signé, une seule fois par facture).

-- 1) Formules d'abonnement d'un produit (prix et récurrence affichés tels quels au client). Un produit est « abonnable » s'il a au moins une formule active.
CREATE TABLE mk_shop_sub_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  interval_unit TEXT NOT NULL CHECK (interval_unit IN ('week', 'month')),
  interval_count INTEGER NOT NULL CHECK (interval_count BETWEEN 1 AND 12),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 50),           -- montant TOUT COMPRIS prélevé à chaque échéance (livraison et taxes incluses)
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),  -- remise explicite saisie par le vendeur (jamais calculée en cachette)
  stripe_price_key TEXT,                                            -- empreinte (prix|devise|récurrence) du prix Stripe déjà créé : on le réutilise s'il est identique
  stripe_price_id TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_sub_plans_product ON mk_shop_sub_plans(product_id, position, id);
CREATE INDEX idx_mk_shop_sub_plans_site ON mk_shop_sub_plans(organization_id, site_id);

-- 2) Produit Stripe correspondant à un produit de la boutique (créé une fois, réutilisé).
CREATE TABLE mk_shop_sub_products (
  product_id INTEGER PRIMARY KEY REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  stripe_product_id TEXT NOT NULL
);

-- 3) Les abonnements. Les libellés et prix sont des instantanés (le produit ou la formule peuvent changer ensuite).
CREATE TABLE mk_shop_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES mk_shop_products(id) ON DELETE SET NULL,
  variant_id INTEGER,
  plan_id INTEGER REFERENCES mk_shop_sub_plans(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES mk_shop_customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'paused', 'past_due', 'cancelled')),
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
  product_name TEXT NOT NULL,
  variant_label TEXT,
  plan_label TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  interval_unit TEXT NOT NULL,
  interval_count INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_item_id TEXT,
  current_period_end TEXT,                                          -- prochaine échéance annoncée par Stripe (UTC)
  shipping_address TEXT NOT NULL DEFAULT '{}',
  origin TEXT,                                                      -- adresse du site utilisée dans les liens des e-mails
  cancelled_at TEXT,
  cancelled_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_subs_stripe ON mk_shop_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX idx_mk_shop_subs_session ON mk_shop_subscriptions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_mk_shop_subs_site ON mk_shop_subscriptions(organization_id, site_id, status, id);
CREATE INDEX idx_mk_shop_subs_customer ON mk_shop_subscriptions(customer_id);
CREATE INDEX idx_mk_shop_subs_email ON mk_shop_subscriptions(email);

-- 4) Commandes de réassort : UNE par facture Stripe payée (l'unicité de la facture garantit qu'un événement rejoué ne crée jamais deux commandes).
CREATE TABLE mk_shop_sub_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES mk_shop_subscriptions(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('first', 'renewal')),
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_sub_orders_invoice ON mk_shop_sub_orders(stripe_invoice_id);
CREATE INDEX idx_mk_shop_sub_orders_sub ON mk_shop_sub_orders(subscription_id, id);

-- 5) Journal de l'abonnement (créé, mis en pause, repris, formule changée, impayé, résilié…).
CREATE TABLE mk_shop_sub_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES mk_shop_subscriptions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_sub_events_sub ON mk_shop_sub_events(subscription_id, id);
