-- Apparence → Thèmes : thèmes installés ET thème actif PAR SITE. Migration ADDITIVE (aucune table existante modifiée).
-- Un thème est un paquet de DONNÉES (jetons du design system, aucun code exécutable) : l'installer l'enregistre pour UN site (site_id NULL = site principal),
-- l'activer applique ses jetons avec le moteur existant (mk_sites.tokens pour un site, appearance_configs pour le principal).
-- Le thème « Kolakisa d'origine » est intégré au moteur (jamais en base) : un site sans ligne active l'utilise.
-- previous_tokens : jetons du site AVANT l'activation (retour au thème précédent) ; previous_key : thème qui était actif ('' = d'origine).
CREATE TABLE IF NOT EXISTS cms_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  theme_key TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'catalogue' CHECK (source IN ('catalogue', 'import')),
  manifest TEXT NOT NULL,
  checksum TEXT NOT NULL,
  installed_by INTEGER,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  activated_by INTEGER,
  activated_at TEXT,
  previous_key TEXT,
  previous_tokens TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_themes_site_key ON cms_themes (COALESCE(site_id, 0), theme_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cms_themes_site_active ON cms_themes (COALESCE(site_id, 0)) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_cms_themes_site ON cms_themes (site_id);
