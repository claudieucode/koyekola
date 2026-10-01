-- Marketing 009 — Pont LMS (curseurs de lecture) et automatisations.

-- Curseurs du pont : jusqu'où les tables du LMS ont été lues. Sans curseur, la PREMIÈRE lecture initialise au dernier
-- identifiant existant et n'émet RIEN : l'historique du LMS ne déclenche jamais d'automatisation.
CREATE TABLE mk_bridge_cursors (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  source TEXT NOT NULL,
  last_id INTEGER NOT NULL DEFAULT 0,
  initialized_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, source)
);

-- Les messages d'automatisation sont rangés dans mk_messages via une campagne « système » (une par étape d'e-mail et par
-- activation) : le suivi, les webhooks, la désinscription et les statistiques fonctionnent donc sans code en double.
ALTER TABLE mk_campaigns ADD COLUMN kind TEXT NOT NULL DEFAULT 'campaign';
ALTER TABLE mk_campaigns ADD COLUMN automation_id INTEGER;
CREATE INDEX idx_mk_campaigns_automation ON mk_campaigns(automation_id) WHERE automation_id IS NOT NULL;

CREATE TABLE mk_automations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  kind TEXT NOT NULL DEFAULT 'marketing' CHECK (kind IN ('marketing', 'transactional')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  trigger_event TEXT NOT NULL,
  trigger_filter TEXT NOT NULL DEFAULT '{}',   -- {key, value} : égalité sur une métadonnée de l'événement
  steps TEXT NOT NULL DEFAULT '[]',            -- étapes en cours d'édition
  active_steps TEXT NOT NULL DEFAULT '',       -- étapes FIGÉES à l'activation (avec les campagnes système) ; vide = à figer
  error TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);

-- Un contact entre UNE fois dans un scénario (UNIQUE) ; il garde ses étapes d'origine même si le scénario est modifié
CREATE TABLE mk_automation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  automation_id INTEGER NOT NULL REFERENCES mk_automations(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  trigger_event_id INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'exited', 'failed')),
  step_index INTEGER NOT NULL DEFAULT 0,
  steps TEXT NOT NULL,
  event_data TEXT NOT NULL DEFAULT '{}',
  attempts INTEGER NOT NULL DEFAULT 0,
  wake_at INTEGER NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  entered_at INTEGER NOT NULL,
  finished_at INTEGER,
  UNIQUE (automation_id, contact_id)
);
CREATE INDEX idx_mk_runs_status ON mk_automation_runs(automation_id, status);

CREATE TABLE mk_automation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  run_id INTEGER NOT NULL REFERENCES mk_automation_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL
);
CREATE INDEX idx_mk_automation_log_run ON mk_automation_log(run_id, id);
