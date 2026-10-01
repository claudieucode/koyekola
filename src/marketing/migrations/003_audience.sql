-- Marketing 003 — Audience : contacts, propriétés personnalisées, listes, étiquettes.
-- Chaque table porte organization_id (multi-organisation). lms_user_id n'a PAS de clé étrangère vers users :
-- supprimer un compte du LMS (ou relancer le seed) ne doit jamais toucher ni bloquer le CRM.

CREATE TABLE mk_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  email TEXT NOT NULL,                       -- toujours normalisé (minuscules, sans espaces) : voir audience/email.js
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',     -- d'où vient le contact : manual, import, form, lms, api…
  -- unknown = aucun consentement enregistré (jamais de marketing) ; subscribed = consentement prouvé
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('unknown', 'subscribed', 'unsubscribed', 'bounced', 'complained', 'suppressed')),
  lms_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity_at TEXT,
  last_open_at TEXT,
  last_click_at TEXT,
  last_campaign_at TEXT,
  unsubscribed_at TEXT,
  UNIQUE (organization_id, email)
);
CREATE INDEX idx_mk_contacts_status ON mk_contacts(organization_id, status);
CREATE INDEX idx_mk_contacts_lms_user ON mk_contacts(organization_id, lms_user_id) WHERE lms_user_id IS NOT NULL;
CREATE INDEX idx_mk_contacts_created ON mk_contacts(organization_id, created_at);

-- Propriétés personnalisées : définition (typée) puis valeurs (une colonne par type, indexées pour les segments)
CREATE TABLE mk_property_defs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  key TEXT NOT NULL CHECK (key GLOB '[a-z]*' AND key NOT GLOB '*[^a-z0-9_]*' AND length(key) <= 40),
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'select')),
  options TEXT NOT NULL DEFAULT '[]',        -- JSON : valeurs autorisées pour le type « select »
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, key)
);

CREATE TABLE mk_contact_property_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES mk_property_defs(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number REAL,
  value_date TEXT,                           -- AAAA-MM-JJ
  value_boolean INTEGER CHECK (value_boolean IN (0, 1)),
  UNIQUE (contact_id, property_id)
);
CREATE INDEX idx_mk_cpv_property_text ON mk_contact_property_values(property_id, value_text);
CREATE INDEX idx_mk_cpv_property_number ON mk_contact_property_values(property_id, value_number);
CREATE INDEX idx_mk_cpv_property_date ON mk_contact_property_values(property_id, value_date);

CREATE TABLE mk_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);

CREATE TABLE mk_list_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  list_id INTEGER NOT NULL REFERENCES mk_lists(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_id, contact_id)
);
CREATE INDEX idx_mk_list_members_contact ON mk_list_members(contact_id);

CREATE TABLE mk_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);

CREATE TABLE mk_contact_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES mk_tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (contact_id, tag_id)
);
CREATE INDEX idx_mk_contact_tags_tag ON mk_contact_tags(tag_id);
