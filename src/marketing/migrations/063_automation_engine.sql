-- Marketing 063 — Automation Engine (palier 17) : contexte de SITE et VERSIONS publiées des scénarios.
-- AJOUTS UNIQUEMENT. site_id NULL = organisation (tous les scénarios existants). Le moteur d'exécution (passages, journal, attentes, reprises) est inchangé.
ALTER TABLE mk_automations ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_automations ADD COLUMN version INTEGER NOT NULL DEFAULT 0;          -- 0 = jamais publié ; +1 à chaque publication d'un contenu modifié
ALTER TABLE mk_automation_runs ADD COLUMN version INTEGER NOT NULL DEFAULT 0;      -- version publiée dont ce passage exécute les étapes figées
CREATE INDEX idx_mk_automations_site ON mk_automations(site_id) WHERE site_id IS NOT NULL;

-- Une ligne par publication : ce qui s'exécute pour un passage est toujours reconstituable (et jamais modifié après coup).
CREATE TABLE mk_automation_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  automation_id INTEGER NOT NULL REFERENCES mk_automations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  triggers TEXT NOT NULL,
  steps TEXT NOT NULL,                       -- étapes FIGÉES de cette publication
  published_by INTEGER,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (automation_id, version)
);
CREATE TRIGGER mk_automation_versions_no_update BEFORE UPDATE ON mk_automation_versions
BEGIN SELECT RAISE(ABORT, 'une version publiée ne se modifie pas'); END;

-- Reprise de l'existant : les scénarios déjà actifs ou en pause avec des étapes figées deviennent la version 1 (rien n'est réécrit).
UPDATE mk_automations SET version = 1 WHERE active_steps <> '';
UPDATE mk_automation_runs SET version = 1 WHERE automation_id IN (SELECT id FROM mk_automations WHERE version = 1);
INSERT INTO mk_automation_versions (organization_id, automation_id, version, triggers, steps)
  SELECT organization_id, id, 1, triggers, active_steps FROM mk_automations WHERE version = 1;
