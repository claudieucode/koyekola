-- SEO par site (suite de la 090) : suivi de traitement des erreurs 404 et état du plan du site (sitemap) PAR SITE. Migration ADDITIVE :
-- aucune table existante n'est recréée, aucune ligne n'est modifiée ou supprimée.
-- Annulation : les colonnes ajoutées à seo_404 sont facultatives (NULL = comportement d'avant) ; DROP TABLE seo_site_sitemaps ne perd que l'historique de contrôle.

-- 404 : état de traitement (traitée), vérification de reprise (l'adresse répond de nouveau) — l'historique des visites n'est jamais effacé par ces états
ALTER TABLE seo_404 ADD COLUMN handled_at TEXT;
ALTER TABLE seo_404 ADD COLUMN handled_by INTEGER;
ALTER TABLE seo_404 ADD COLUMN recovered_at TEXT;
ALTER TABLE seo_404 ADD COLUMN last_checked_at TEXT;
ALTER TABLE seo_404 ADD COLUMN last_check_status INTEGER;

-- Plan du site : dernier contrôle/génération par site (le plan est calculé depuis la base ; cette ligne garde la date et le résultat de la dernière vérification)
CREATE TABLE IF NOT EXISTS seo_site_sitemaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL UNIQUE REFERENCES mk_sites(id),
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  generated_by INTEGER,
  urls INTEGER NOT NULL DEFAULT 0,
  excluded INTEGER NOT NULL DEFAULT 0,
  valid INTEGER NOT NULL DEFAULT 1,
  problems TEXT NOT NULL DEFAULT '[]'
);

-- Analyses d'un site : lecture de l'historique par site
CREATE INDEX IF NOT EXISTS idx_seo_audits_site ON seo_audits (site_id, id);

-- Index manquants de la migration 096 (Apparence → Personnaliser) : clés étrangères « site_id » des brouillons et versions (contrôle D3 de audit-corrections.test.js).
-- Noms distincts de ceux de la 096 (un index du même nom serait ignoré par IF NOT EXISTS). Additif et sans risque : CREATE INDEX IF NOT EXISTS ne modifie aucune ligne ; la 096 elle-même n'est pas touchée.
CREATE INDEX IF NOT EXISTS idx_cms_customizer_drafts_site_id ON cms_customizer_drafts (site_id);
CREATE INDEX IF NOT EXISTS idx_cms_customizer_versions_site_id ON cms_customizer_versions (site_id);
