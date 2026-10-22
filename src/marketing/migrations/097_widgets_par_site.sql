-- Apparence → Widgets : zones de widgets, blocs et widgets désactivés PAR SITE. Migration ADDITIVE (aucune table existante modifiée).
-- Une ligne par site (site_id NULL = site principal) : « layout » est le JSON validé par le serveur (zones → blocs ordonnés, + liste des blocs désactivés).
-- revision : compteur de modifications, sert à refuser l'enregistrement d'une version périmée (conflit entre deux sessions) ; jamais fourni par le navigateur sans contrôle.
-- Annulation de la migration : DROP TABLE cms_widget_layouts (aucune autre donnée n'en dépend ; sans ligne, un site n'affiche aucun widget).
CREATE TABLE IF NOT EXISTS cms_widget_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  layout TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_widget_layouts_site ON cms_widget_layouts (COALESCE(site_id, 0));
CREATE INDEX IF NOT EXISTS idx_cms_widget_layouts_site ON cms_widget_layouts (site_id);
