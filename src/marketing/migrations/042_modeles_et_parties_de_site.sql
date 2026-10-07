-- Éditeur de pages (mission V3) : MODÈLES DE PAGES enregistrés par l'équipe (le contenu complet d'une page, réutilisable
-- à la création d'une page, exportable / importable en JSON) et PARTIES GLOBALES d'un site (en-tête et pied de page :
-- un composant réutilisable affiché en haut / en bas de toutes les pages du site, au rendu).
CREATE TABLE mk_page_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Mes modèles',
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,                       -- { sections, title, description, theme, seo, css } validé par le moteur de pages
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_mk_page_templates_org ON mk_page_templates(organization_id, updated_at);

ALTER TABLE mk_sites ADD COLUMN header_component_id INTEGER;   -- composant affiché en tête des pages du site (NULL : aucun)
ALTER TABLE mk_sites ADD COLUMN footer_component_id INTEGER;   -- composant affiché en pied des pages du site
