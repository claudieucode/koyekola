-- Marketing 014 — Formulaires d'inscription publics (jalon M5 — Capture, partie 1). Un formulaire ajoute des
-- contacts avec une PREUVE DE CONSENTEMENT, exactement comme toute inscription (voir compliance/consent.js) :
-- aucun raccourci, un contact issu d'un formulaire suit les mêmes règles qu'un contact ajouté à la main.

CREATE TABLE mk_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  fields TEXT NOT NULL DEFAULT '[]',   -- champs FACULTATIFS en plus de l'adresse (toujours demandée) : tableau JSON
  consent_text TEXT NOT NULL,
  list_id INTEGER,                     -- sans clé étrangère : supprimer une liste ne doit jamais bloquer ni casser un formulaire (même choix que mk_campaigns.target_id)
  thank_you_text TEXT NOT NULL DEFAULT '',
  view_count INTEGER NOT NULL DEFAULT 0,
  submit_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, slug)
);
CREATE INDEX idx_mk_forms_org ON mk_forms(organization_id, status);

-- Rattache une preuve de consentement à SON formulaire (nullable : les autres sources de consentement n'en ont pas)
ALTER TABLE mk_consents ADD COLUMN form_id INTEGER;
