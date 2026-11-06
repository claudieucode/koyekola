-- Personnalisation par thème : les réglages d'un thème sont gardés PAR SITE et PAR THÈME. Quand on quitte un thème, ses réglages (tokens.pack.options) sont rangés ici ;
-- quand on y revient, ils sont restaurés si la version du thème est compatible (même version majeure). Rien n'est jamais supprimé en changeant de thème.
CREATE TABLE IF NOT EXISTS cms_theme_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  theme_key TEXT NOT NULL,
  theme_version TEXT NOT NULL DEFAULT '1.0.0',
  options TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_theme_settings_site_theme ON cms_theme_settings (COALESCE(site_id, 0), theme_key);
