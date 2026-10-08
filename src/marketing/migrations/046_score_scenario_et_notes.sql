-- Actions de scénario « Modifier le score » et « Ajouter une note ».
--
-- Score : les points ajoutés ou retirés par un scénario sont journalisés dans mk_score_log avec source = 'automation'
-- (event_id = numéro du passage × 100 + numéro de l'étape : rejouer une étape n'ajoute jamais deux fois les points).
-- Un recalcul des règles ne touche que les lignes source = 'rule' : les ajustements des scénarios sont conservés.
ALTER TABLE mk_score_log ADD COLUMN source TEXT NOT NULL DEFAULT 'rule' CHECK (source IN ('rule', 'automation'));
CREATE UNIQUE INDEX idx_mk_score_log_automation ON mk_score_log(contact_id, event_id) WHERE source = 'automation';

-- Notes d'un contact : texte libre horodaté, visible dans sa chronologie. Écrites par un scénario (source = 'automation',
-- un passage et une étape : jamais deux fois la même note) ; supprimées avec le contact.
CREATE TABLE mk_contact_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'automation')),
  automation_id INTEGER,
  run_id INTEGER,
  step_index INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_contact_notes_contact ON mk_contact_notes(contact_id, id);
CREATE UNIQUE INDEX idx_mk_contact_notes_run ON mk_contact_notes(run_id, step_index) WHERE run_id IS NOT NULL;
