-- Retour arrière de 090 (hors production, APRÈS sauvegarde). Refusé (contrainte) si deux sites ont la même ancienne adresse de redirection ou la même adresse 404 : il faut d'abord les résoudre. Aucune ligne n'est perdue.
BEGIN;  -- tout ou rien : en cas d'erreur (conflit entre sites), exécuter ROLLBACK ; rien n'a été modifié
CREATE TABLE seo_redirects_old (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL UNIQUE, target TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 301, enabled INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0, last_hit_at TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), site_id INTEGER
);
INSERT INTO seo_redirects_old SELECT id, source_path, target, status, enabled, note, hits, last_hit_at, created_by, created_at, updated_at, site_id FROM seo_redirects;
DROP TABLE seo_redirects;
ALTER TABLE seo_redirects_old RENAME TO seo_redirects;
CREATE INDEX idx_seo_redirects_site ON seo_redirects(site_id);

CREATE TABLE seo_404_old (
  path TEXT PRIMARY KEY, hits_human INTEGER NOT NULL DEFAULT 0, hits_bot INTEGER NOT NULL DEFAULT 0, first_seen TEXT NOT NULL DEFAULT (datetime('now')), last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_referrer TEXT, last_user_agent TEXT, ignored INTEGER NOT NULL DEFAULT 0
);
INSERT INTO seo_404_old SELECT path, hits_human, hits_bot, first_seen, last_seen, last_referrer, last_user_agent, ignored FROM seo_404;
DROP TABLE seo_404;
ALTER TABLE seo_404_old RENAME TO seo_404;
CREATE INDEX idx_seo_404_last ON seo_404(last_seen);
DROP TABLE seo_site_settings;
DROP INDEX IF EXISTS idx_seo_audits_site;
DROP INDEX IF EXISTS idx_seo_monitor_snapshots_site;
DROP INDEX IF EXISTS idx_seo_alerts_site;
DROP INDEX IF EXISTS idx_seo_changes_site;
ALTER TABLE seo_changes DROP COLUMN site_id;
ALTER TABLE seo_audits DROP COLUMN site_id;
ALTER TABLE seo_monitor_snapshots DROP COLUMN site_id;
ALTER TABLE seo_alerts DROP COLUMN site_id;
DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '090';
COMMIT;
