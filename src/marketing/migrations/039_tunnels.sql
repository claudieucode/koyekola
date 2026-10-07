-- Tunnels (phase 8) : une suite ordonnée d'étapes. Chaque étape est un VRAI objet : une page du moteur commun
-- (mk_landing_pages, même éditeur que Site Web) ou une formation du catalogue. Aucune page n'est recopiée : l'étape
-- pointe vers la page. Le type d'étape est validé par le code (src/marketing/funnels), pour pouvoir ajouter les étapes
-- de paiement (phase 9) sans reconstruire la table.
CREATE TABLE mk_funnels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  template TEXT,                               -- modèle de départ éventuel (clé de src/marketing/funnels/templates.js)
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  UNIQUE (organization_id, name)
);

CREATE TABLE mk_funnel_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  funnel_id INTEGER NOT NULL REFERENCES mk_funnels(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  page_id INTEGER REFERENCES mk_landing_pages(id) ON DELETE SET NULL,
  course_id INTEGER,                           -- étape « formation » : formation publiée du catalogue (lecture seule)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_funnel_steps_funnel ON mk_funnel_steps(funnel_id, position);
CREATE INDEX idx_mk_funnel_steps_page ON mk_funnel_steps(page_id);
