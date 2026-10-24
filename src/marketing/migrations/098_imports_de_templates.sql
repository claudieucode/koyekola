-- Apparence → Templates : journal des importations de modèles PAR SITE. Migration ADDITIVE (une seule table nouvelle, aucune donnée existante modifiée).
-- Chaque importation (pack de site ou modèle de page) enregistre ce qu'elle a créé (pages, menu, brouillon de styles) et un jeton d'idempotence « import_key » : rejouer la MÊME demande
-- (double clic, nouvelle tentative après une coupure) retourne le résultat déjà obtenu au lieu de créer les pages une seconde fois. Un jeton est propre à un site.
-- Annulation : DROP TABLE cms_template_imports (aucune autre donnée n'en dépend : les pages importées sont des pages ordinaires).
CREATE TABLE IF NOT EXISTS cms_template_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  template_key TEXT NOT NULL,
  import_key TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT '{}',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_template_imports_key ON cms_template_imports (COALESCE(site_id, 0), import_key);
CREATE INDEX IF NOT EXISTS idx_cms_template_imports_site ON cms_template_imports (site_id, id);
