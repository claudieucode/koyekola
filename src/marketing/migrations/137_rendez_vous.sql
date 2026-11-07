-- Prise de rendez-vous (essayage, conseil, atelier). Additif : uniquement de nouvelles tables.
-- Les heures sont des heures « murales » de la boutique (fuseau choisi dans les réglages), écrites « AAAA-MM-JJ HH:MM ».

-- 1) Réglages par boutique (une ligne par site ; site_id NULL = site principal)
CREATE TABLE mk_shop_appt_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  step_min INTEGER NOT NULL DEFAULT 30 CHECK (step_min BETWEEN 5 AND 240),
  min_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (min_notice_hours BETWEEN 0 AND 720),
  horizon_days INTEGER NOT NULL DEFAULT 30 CHECK (horizon_days BETWEEN 1 AND 365),
  auto_confirm INTEGER NOT NULL DEFAULT 0 CHECK (auto_confirm IN (0, 1)),
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_appt_settings_site ON mk_shop_appt_settings(organization_id, COALESCE(site_id, 0));

-- 2) Types de rendez-vous
CREATE TABLE mk_shop_appt_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 5 AND 480),
  location_kind TEXT NOT NULL DEFAULT 'place' CHECK (location_kind IN ('place', 'visio')),
  location TEXT,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_shop_appt_types_site ON mk_shop_appt_types(organization_id, site_id, active);

-- 3) Disponibilités récurrentes (1 = lundi … 7 = dimanche) et exceptions (jour fermé, ou plage bloquée)
CREATE TABLE mk_shop_appt_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  CHECK (start_time < end_time)
);
CREATE INDEX idx_mk_shop_appt_rules_site ON mk_shop_appt_rules(organization_id, site_id, weekday);
CREATE TABLE mk_shop_appt_exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  reason TEXT
);
CREATE INDEX idx_mk_shop_appt_exceptions_site ON mk_shop_appt_exceptions(organization_id, site_id, day);

-- 4) Rendez-vous. L'unicité (site, heure de début) interdit deux réservations au même créneau, même en cas de requêtes simultanées ; le chevauchement de durées différentes est refusé par le service.
CREATE TABLE mk_shop_appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  type_id INTEGER NOT NULL REFERENCES mk_shop_appt_types(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES mk_shop_products(id) ON DELETE SET NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'seller')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_appointments_slot ON mk_shop_appointments(organization_id, COALESCE(site_id, 0), start_at) WHERE status <> 'cancelled';
CREATE INDEX idx_mk_shop_appointments_site ON mk_shop_appointments(organization_id, site_id, start_at);
CREATE INDEX idx_mk_shop_appointments_type ON mk_shop_appointments(type_id);
CREATE INDEX idx_mk_shop_appointments_product ON mk_shop_appointments(product_id);
