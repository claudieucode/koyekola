-- Sondages (point 7 de la parité Mailchimp) : questions (choix unique, choix multiples, échelle, texte), page publique
-- /sondage/<adresse>, lien personnel signé dans les e-mails (la réponse est rattachée au contact), étiquettes automatiques
-- selon les réponses, rapport par question, réponses individuelles et export.
CREATE TABLE mk_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  questions TEXT NOT NULL DEFAULT '[]',
  thank_you TEXT NOT NULL DEFAULT '',
  ask_email TEXT NOT NULL DEFAULT 'optional' CHECK (ask_email IN ('no', 'optional', 'required')), -- répondants hors e-mail
  list_id INTEGER REFERENCES mk_lists(id) ON DELETE SET NULL,  -- inscription proposée (case de consentement) ; vide = jamais
  consent_text TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
-- Une réponse par contact connu (une nouvelle réponse remplace la précédente) ; les réponses anonymes s'ajoutent
CREATE TABLE mk_survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  survey_id INTEGER NOT NULL REFERENCES mk_surveys(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES mk_contacts(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'link' CHECK (source IN ('email', 'link')),
  answers TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_survey_responses_survey ON mk_survey_responses(survey_id, created_at);
CREATE UNIQUE INDEX idx_mk_survey_responses_contact ON mk_survey_responses(survey_id, contact_id) WHERE contact_id IS NOT NULL;
