-- BROUILLON — NON APPLIQUÉ, NON PLACÉ dans src/marketing/migrations (aucune application sans autorisation distincte et essai sur copie de production).
-- Domaines des sites : identité stable (site_id), un domaine = un seul site sur toute la plateforme.
CREATE TABLE mk_site_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL REFERENCES mk_sites (id),
  host TEXT NOT NULL,                                   -- minuscules, sans port, ASCII (IDN converti) : urls.normHost
  kind TEXT NOT NULL DEFAULT 'custom' CHECK (kind IN ('provisional', 'custom')),
  is_primary INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'https_active', 'error', 'disabled')),
  verify_token TEXT,
  verified_at TEXT,
  https_checked_at TEXT,
  last_error TEXT,
  legacy INTEGER NOT NULL DEFAULT 0,                    -- 1 = repris de settings.seo.publicUrl (déjà en service, non revérifié)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uq_site_domains_host ON mk_site_domains (host);                         -- jamais deux sites pour un même domaine
CREATE UNIQUE INDEX uq_site_domains_primary ON mk_site_domains (site_id) WHERE is_primary = 1; -- un seul domaine principal par site
CREATE INDEX idx_site_domains_site ON mk_site_domains (site_id);
-- Reprise : chaque publicUrl existant devient un domaine principal « hérité » en service (aucun site actuel ne change de comportement)
-- INSERT INTO mk_site_domains (organization_id, site_id, host, is_primary, status, legacy)
--   SELECT organization_id, id, lower(substr(json_extract(settings, '$.seo.publicUrl'), 9)), 1, 'https_active', 1 FROM mk_sites
--   WHERE json_extract(settings, '$.seo.publicUrl') LIKE 'https://%';
