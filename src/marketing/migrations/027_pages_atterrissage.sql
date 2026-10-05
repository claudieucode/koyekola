-- Pages d'atterrissage (point 6 de la parité Mailchimp) : pages web hébergées par KOLAKISA (/p/<adresse>), composées de
-- sections (bandeau, texte, image, liste, formation, bouton, citation, inscription). L'inscription passe par un
-- formulaire existant (consentement prouvé, double confirmation, liste) ; la page ajoute ses propres étiquettes.
CREATE TABLE mk_landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',            -- titre de l'onglet du navigateur
  description TEXT NOT NULL DEFAULT '',      -- description (partage sur les réseaux, moteurs si indexée)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  sections TEXT NOT NULL DEFAULT '[]',
  theme TEXT NOT NULL DEFAULT '{}',
  form_id INTEGER REFERENCES mk_forms(id) ON DELETE SET NULL,
  tags TEXT NOT NULL DEFAULT '[]',           -- 5 au plus, ajoutées aux contacts inscrits par cette page
  indexable INTEGER NOT NULL DEFAULT 0,      -- 0 = en ligne mais non indexée (comme Mailchimp)
  published_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
-- Statistiques : visite, clic (bouton ou lien de la page), inscription. Visiteur = empreinte quotidienne non réversible
-- (jamais l'adresse IP en clair) ; les robots ne sont pas comptés.
CREATE TABLE mk_landing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  page_id INTEGER NOT NULL REFERENCES mk_landing_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('view', 'click', 'signup')),
  visitor TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  occurred_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_landing_events_page ON mk_landing_events(page_id, type, occurred_at);
