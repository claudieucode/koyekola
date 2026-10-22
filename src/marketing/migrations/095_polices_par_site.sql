-- Apparence → Polices : bibliothèque de polices PAR SITE. Migration ADDITIVE (aucune table existante modifiée).
-- Une ligne de cms_fonts = une famille rattachée à UN site (site_id NULL = site principal).
--   source 'google'  : famille de la bibliothèque Google Fonts auto-hébergée de Kolakisa (font_key = « font.inter ») ; variants = graisses/styles retenus.
--   source 'upload'  : famille téléversée par le site (font_key = « font.u<id> », attribué à la création) ; ses fichiers sont dans cms_font_files.
-- Un fichier téléversé n'appartient qu'à UNE famille d'UN site (jamais partagé) ; il est rangé sous un nom aléatoire (secret) hors du dossier public,
-- servi seulement tant que la famille est active.
CREATE TABLE IF NOT EXISTS cms_fonts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  source TEXT NOT NULL CHECK (source IN ('google', 'upload')),
  font_key TEXT NOT NULL,
  family TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'sans-serif',
  variants TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  installed_by INTEGER,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_fonts_site_key ON cms_fonts (COALESCE(site_id, 0), font_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_fonts_site_upload_family ON cms_fonts (COALESCE(site_id, 0), lower(family)) WHERE source = 'upload';
CREATE INDEX IF NOT EXISTS idx_cms_fonts_site ON cms_fonts (site_id);

CREATE TABLE IF NOT EXISTS cms_font_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  font_id INTEGER NOT NULL REFERENCES cms_fonts(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL DEFAULT 400 CHECK (weight BETWEEN 1 AND 1000),
  weight_max INTEGER CHECK (weight_max IS NULL OR weight_max BETWEEN 1 AND 1000), -- police variable : plage de graisses (weight..weight_max)
  style TEXT NOT NULL DEFAULT 'normal' CHECK (style IN ('normal', 'italic')),
  format TEXT NOT NULL CHECK (format IN ('woff2', 'woff', 'ttf', 'otf')),
  original_name TEXT NOT NULL,
  secret TEXT NOT NULL UNIQUE,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_font_files_variant ON cms_font_files (font_id, weight, style);
CREATE INDEX IF NOT EXISTS idx_cms_font_files_font ON cms_font_files (font_id);
