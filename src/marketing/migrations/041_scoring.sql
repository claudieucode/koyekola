-- Score des contacts (phase 13) : des RÈGLES configurables (événement réel → points, éventuellement plafonnées), des
-- NIVEAUX (froid, intéressé, chaud…) aux seuils modifiables. Chaque point attribué est tracé (journal) : le score d'un
-- contact s'explique toujours, et peut être recalculé à partir de l'historique des événements.
CREATE TABLE mk_score_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  event TEXT NOT NULL,                         -- nom d'un événement du bus (validé par le code)
  filter_key TEXT NOT NULL DEFAULT '',
  filter_value TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL CHECK (points BETWEEN -1000 AND 1000 AND points <> 0),
  max_times INTEGER CHECK (max_times IS NULL OR max_times BETWEEN 1 AND 1000), -- NULL : sans limite
  active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_score_rules_event ON mk_score_rules(organization_id, event, active);

CREATE TABLE mk_score_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES mk_score_rules(id) ON DELETE SET NULL,
  event_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (rule_id, event_id)
);
CREATE INDEX idx_mk_score_log_contact ON mk_score_log(contact_id, created_at);

-- Niveaux : du plus bas (seuil 0) au plus haut ; un contact est au niveau dont le seuil est le plus haut atteint
CREATE TABLE mk_score_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  min_score INTEGER NOT NULL CHECK (min_score >= 0),
  UNIQUE (organization_id, min_score)
);

ALTER TABLE mk_contacts ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_mk_contacts_score ON mk_contacts(organization_id, score);
