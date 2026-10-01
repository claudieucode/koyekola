-- Marketing 004 — Conformité : preuves de consentement, désinscriptions, liste de suppression, préférences.
-- Règle d'or : rien de tout cela n'est jamais « perdu » par un import ou une synchronisation.

-- Preuves de consentement : écriture seule (on ajoute une ligne à chaque changement, on ne réécrit jamais l'histoire).
-- Suppression permise UNIQUEMENT quand le contact n'existe plus (droit à l'effacement) : la suppression en cascade
-- d'un contact emporte ses preuves, mais aucune suppression directe n'est possible.
CREATE TABLE mk_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL DEFAULT 'marketing',
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn')),
  source TEXT NOT NULL,                      -- form, preference_center, signup, import, admin, api…
  text_shown TEXT NOT NULL DEFAULT '',       -- le texte exact présenté à la personne
  ip TEXT NOT NULL DEFAULT '',               -- tronquée avant écriture (voir compliance/consent.js)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_consents_contact ON mk_consents(contact_id, id);
CREATE TRIGGER mk_consents_no_update BEFORE UPDATE ON mk_consents
BEGIN SELECT RAISE(ABORT, 'preuves de consentement en lecture seule'); END;
CREATE TRIGGER mk_consents_no_delete BEFORE DELETE ON mk_consents
WHEN EXISTS (SELECT 1 FROM mk_contacts WHERE id = OLD.contact_id)
BEGIN SELECT RAISE(ABORT, 'preuves de consentement en lecture seule'); END;

-- Liste de suppression : ces adresses ne reçoivent JAMAIS de marketing. Elle est liée à l'adresse (pas au contact) :
-- effacer un contact, puis le réimporter, ne le rend pas joignable.
CREATE TABLE mk_suppressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('bounced', 'complained', 'manual', 'erasure')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, email)
);

-- Catégories de préférences (ex. « Nouveautés », « Promotions ») pour le centre de préférences
CREATE TABLE mk_preference_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  key TEXT NOT NULL CHECK (key GLOB '[a-z]*' AND key NOT GLOB '*[^a-z0-9_]*' AND length(key) <= 40),
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, key)
);

-- Choix explicite d'un contact pour une catégorie. Absence de ligne = catégorie ouverte (le consentement global s'applique).
CREATE TABLE mk_contact_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES mk_preference_categories(id) ON DELETE CASCADE,
  subscribed INTEGER NOT NULL CHECK (subscribed IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (contact_id, category_id)
);

-- Désinscriptions actives : globale (scope all) ou d'une seule liste (scope list). Se réinscrire supprime la ligne ;
-- l'historique complet reste dans mk_consents.
CREATE TABLE mk_unsubscribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('all', 'list')),
  list_id INTEGER REFERENCES mk_lists(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((scope = 'list') = (list_id IS NOT NULL))
);
CREATE UNIQUE INDEX idx_mk_unsub_unique ON mk_unsubscribes(contact_id, scope, COALESCE(list_id, 0));
