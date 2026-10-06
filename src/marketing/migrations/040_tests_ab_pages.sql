-- Tests A/B des pages (Site Web, Tunnels — phase 12). Version A = la page en ligne ; version B = une copie de la page,
-- composée dans le même éditeur (variant_page_id, jamais publiée elle-même), FIGÉE au démarrage du test (variant_b).
-- Répartition sans cookie : la version se déduit de l'empreinte quotidienne anonyme déjà utilisée par les statistiques
-- des pages (aucune donnée personnelle de plus). Objectif : une inscription sur la page, ou un clic sur un de ses liens.
CREATE TABLE mk_page_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  page_id INTEGER NOT NULL REFERENCES mk_landing_pages(id) ON DELETE CASCADE,
  variant_page_id INTEGER REFERENCES mk_landing_pages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT 'signup' CHECK (goal IN ('signup', 'click')),
  traffic_b INTEGER NOT NULL DEFAULT 50 CHECK (traffic_b BETWEEN 10 AND 90),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'stopped', 'completed')),
  variant_b TEXT,                              -- contenu de B figé au démarrage (sections, titre, description)
  winner TEXT CHECK (winner IN ('a', 'b')),
  decided_by TEXT NOT NULL DEFAULT '',          -- '' | manual
  started_at TEXT,
  stopped_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_page_tests_page ON mk_page_tests(page_id, status);
CREATE INDEX idx_mk_page_tests_variant ON mk_page_tests(variant_page_id);

-- Une vue et au plus une conversion par empreinte quotidienne et par test
CREATE TABLE mk_page_test_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES mk_page_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('a', 'b')),
  visitor TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('view', 'conversion')),
  occurred_at INTEGER NOT NULL,
  UNIQUE (test_id, visitor, type)
);
CREATE INDEX idx_mk_page_test_events_test ON mk_page_test_events(test_id, variant, type);
