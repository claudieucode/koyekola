-- Créneaux de livraison (dont livraison réfrigérée) : créneaux récurrents définis par le vendeur, méthodes de livraison qui exigent un créneau,
-- créneau choisi enregistré sur la commande. Additif : aucune donnée existante n'est modifiée (colonnes ajoutées avec valeur neutre).

-- 1) Créneaux récurrents d'une boutique. weekdays : JSON, jours ISO (1 = lundi … 7 = dimanche). excluded_dates : JSON, dates AAAA-MM-JJ sans livraison.
CREATE TABLE mk_shop_delivery_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  label TEXT,
  weekdays TEXT NOT NULL DEFAULT '[]',
  start_time TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  end_time TEXT NOT NULL CHECK (end_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 1000),
  min_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (min_notice_hours BETWEEN 0 AND 720),
  horizon_days INTEGER NOT NULL DEFAULT 14 CHECK (horizon_days BETWEEN 1 AND 90),
  excluded_dates TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_delivery_slots_site ON mk_shop_delivery_slots(organization_id, site_id, active);

-- 2) Une méthode de livraison peut exiger un créneau (ex. livraison réfrigérée).
ALTER TABLE mk_shop_shipping_methods ADD COLUMN requires_slot INTEGER NOT NULL DEFAULT 0 CHECK (requires_slot IN (0, 1));

-- 3) Créneau retenu, copié sur la commande (instantané : la plage reste lisible même si le créneau est modifié ensuite).
ALTER TABLE mk_shop_orders ADD COLUMN delivery_slot_id INTEGER REFERENCES mk_shop_delivery_slots(id) ON DELETE SET NULL;
ALTER TABLE mk_shop_orders ADD COLUMN delivery_date TEXT;
ALTER TABLE mk_shop_orders ADD COLUMN delivery_start TEXT;
ALTER TABLE mk_shop_orders ADD COLUMN delivery_end TEXT;
CREATE INDEX idx_mk_shop_orders_delivery_slot ON mk_shop_orders(delivery_slot_id, delivery_date);
