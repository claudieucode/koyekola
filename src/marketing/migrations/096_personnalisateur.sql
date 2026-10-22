-- Apparence → Personnaliser : brouillons et versions publiées PAR SITE (site_id NULL = site principal). Migration ADDITIVE : aucune table existante modifiée.
-- Le personnalisateur n'est pas un second moteur : il écrit dans les moteurs existants (appearance_configs pour le principal, mk_sites.tokens / settings pour un site)
-- au moment de PUBLIER. Ces tables ne contiennent que les changements en attente (brouillon) et l'historique de ce qui a été publié.
-- changes : objet JSON { "tokens.colors.primary": "#0277b6", … } (liste fermée de réglages, revalidés à chaque lecture et à la publication).
-- rev : version du brouillon (verrou optimiste : deux sessions ne s'écrasent pas) ; base_rev : version du moteur au moment où le brouillon a été commencé.
CREATE TABLE IF NOT EXISTS cms_customizer_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  changes TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 1,
  base_rev INTEGER NOT NULL DEFAULT 0,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_customizer_drafts_site ON cms_customizer_drafts (COALESCE(site_id, 0));

-- Historique des publications : ce qui a été publié (changes) et la valeur qu'avaient ces réglages AVANT (previous), pour pouvoir y revenir.
CREATE TABLE IF NOT EXISTS cms_customizer_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  changes TEXT NOT NULL,
  previous TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  published_by INTEGER,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cms_customizer_versions_site ON cms_customizer_versions (COALESCE(site_id, 0), id);
