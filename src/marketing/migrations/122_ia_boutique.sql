-- Programme 21.10 — Constructeur de boutique par IA : projets de boutique, historique et copies d'annulation. Migration ADDITIVE (trois tables, aucune donnée existante touchée).
--   mk_ai_shops       : un projet de boutique = brief, analyse du modèle commercial, plan des pages, structure du catalogue (catégories), BROUILLONS de produits, configuration commerciale PROPOSÉE
--                       et table `applied` (identifiants créés dans le moteur e-commerce : sert l'idempotence). Le projet ne contient AUCUNE donnée commerciale « vivante » : le catalogue, les stocks, les prix,
--                       les commandes et les paiements restent dans les tables mk_shop_* du moteur e-commerce (migration 121). site_id obligatoire (une boutique par site du Page Builder).
--   mk_ai_shop_events : historique des modifications du projet et des applications au catalogue (qui, quoi, révision).
--   mk_ai_shop_states : copies du projet avant chaque modification (pile « undo ») et après un « Annuler » (pile « redo ») ; ne concernent QUE les brouillons du projet, jamais le catalogue déjà créé.
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_ai_shop_states ; DROP TABLE mk_ai_shop_events ; DROP TABLE mk_ai_shops ; DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '122'.
CREATE TABLE mk_ai_shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'structured', 'configured', 'ready')),
  brief_text TEXT NOT NULL,
  analysis_json TEXT NOT NULL DEFAULT '{}',
  plan_json TEXT NOT NULL DEFAULT '{}',
  structure_json TEXT NOT NULL DEFAULT '{}',
  products_json TEXT NOT NULL DEFAULT '[]',
  config_json TEXT NOT NULL DEFAULT '{}',
  applied_json TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_shops_site ON mk_ai_shops(organization_id, site_id, updated_at);

CREATE TABLE mk_ai_shop_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES mk_ai_shops(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  action TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_shop_events_shop ON mk_ai_shop_events(shop_id, id);

CREATE TABLE mk_ai_shop_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES mk_ai_shops(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  stack TEXT NOT NULL CHECK (stack IN ('undo', 'redo')),
  snapshot TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_shop_states_shop ON mk_ai_shop_states(shop_id, stack, id);
