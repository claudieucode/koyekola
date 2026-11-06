-- Index de la clé étrangère site_id de cms_theme_settings (règle D3 : toute clé étrangère a un index en première colonne).
CREATE INDEX IF NOT EXISTS idx_cms_theme_settings_site ON cms_theme_settings (site_id);
