-- Site Web et Tunnels — fondations communes (phase 2). Un SEUL moteur de pages : les pages d'atterrissage existantes
-- (mk_landing_pages, adresse /p/<adresse>) deviennent les pages de ce moteur, qu'elles appartiennent à un site, à un
-- tunnel ou à aucun des deux. Rien n'est recopié : les colonnes s'ajoutent à la table existante.

-- Sites : un regroupement de pages qui partagent un design system (jetons de couleurs, typographies, espacements…)
CREATE TABLE mk_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  tokens TEXT NOT NULL DEFAULT '{}',          -- design system du site (voir src/marketing/pages/tokens.js)
  home_page_id INTEGER,                        -- page d'accueil du site (une page de ce site)
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  UNIQUE (organization_id, name)
);

-- Pages : rattachement à un site, nature, brouillon séparé de la version en ligne, révision (enregistrements concurrents)
ALTER TABLE mk_landing_pages ADD COLUMN site_id INTEGER REFERENCES mk_sites(id) ON DELETE SET NULL;
ALTER TABLE mk_landing_pages ADD COLUMN kind TEXT NOT NULL DEFAULT 'landing' CHECK (kind IN ('landing', 'page', 'step'));
-- Copie de travail (JSON : sections, thème, titre, description, SEO). NULL = rien en cours : identique à la version en
-- ligne. Les colonnes « sections » et « theme » restent le contenu EN LIGNE.
ALTER TABLE mk_landing_pages ADD COLUMN draft TEXT;
ALTER TABLE mk_landing_pages ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mk_landing_pages ADD COLUMN archived_at TEXT;
ALTER TABLE mk_landing_pages ADD COLUMN seo TEXT NOT NULL DEFAULT '{}';
CREATE INDEX idx_mk_landing_pages_site ON mk_landing_pages(site_id);

-- Historique des versions publiées d'une page (restaurer une version la recopie dans le brouillon)
CREATE TABLE mk_page_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  page_id INTEGER NOT NULL REFERENCES mk_landing_pages(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  content TEXT NOT NULL,                       -- JSON : sections, thème, titre, description, SEO
  reason TEXT NOT NULL DEFAULT 'publish' CHECK (reason IN ('publish', 'import')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (page_id, number)
);

-- Composants réutilisables : une section enregistrée sous un nom. Global (site_id NULL) : utilisable partout ; sinon
-- propre à un site. Inséré « synchronisé », il s'affiche toujours dans sa dernière version ; inséré « en copie », il
-- devient une section indépendante.
CREATE TABLE mk_web_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section TEXT NOT NULL,                       -- JSON d'une section (grammaire de src/marketing/pages/sections.js)
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_mk_web_components_site ON mk_web_components(site_id);
