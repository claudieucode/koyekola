-- R8 (lot 6A) — SEO par site (décisions du 17/10/2026) : réglages SEO propres à chaque site, redirections dont l'ancienne adresse n'est unique que PAR site, journal des erreurs 404 par site, et colonne « site » sur le
-- journal des modifications SEO, les audits, les alertes et les photographies de surveillance. Les données existantes ne sont ni réécrites ni réattribuées : site_id NULL = site principal / organisation (convention historique).
--
-- Les tables seo_* sont créées à l'exécution par src/seo/*.js (CREATE TABLE IF NOT EXISTS), pas par des migrations : cette migration commence donc par les créer à l'identique si elles manquent (base neuve ou jetable),
-- puis les modifie. Sur une base existante les « CREATE TABLE IF NOT EXISTS » ne font rien. Prérequis connu : seo_redirects doit déjà avoir sa colonne site_id (ajoutée par le palier 12) ;
-- une base qui n'a jamais démarré depuis ce palier ferait échouer cette migration PROPREMENT (transaction annulée, sauvegarde faite) — démarrer l'application une fois suffit.
--
-- Retour arrière (hors production, après sauvegarde) : scripts/migrations-retour-arriere/090_seo_par_site.down.sql (recrée seo_404 et seo_redirects sans la portée par site — refusé s'il existe deux redirections
-- ou deux lignes 404 de même adresse pour des sites différents —, supprime seo_site_settings et les colonnes site_id). Les lignes existantes sont conservées.

-- 1. Réglages SEO propres à un site (mêmes clés que seo_settings ; une clé absente = pas de réglage propre)
CREATE TABLE seo_site_settings (
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by INTEGER,
  PRIMARY KEY (site_id, key)
);

-- 2. Journal des modifications SEO : site concerné (NULL = réglages globaux / site principal)
CREATE TABLE IF NOT EXISTS seo_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_id INTEGER,
  source TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE seo_changes ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX IF NOT EXISTS idx_seo_changes_entity ON seo_changes(entity_type, entity_key, id);
CREATE INDEX IF NOT EXISTS idx_seo_changes_date ON seo_changes(created_at);
CREATE INDEX idx_seo_changes_site ON seo_changes(site_id, id) WHERE site_id IS NOT NULL;

-- 3. Redirections (même index que le plan de l'outil de reconstruction du cœur, src/services/reconstructionTables.js : il reconnaît alors la table comme « déjà reconstruite » et ne la retouche pas)
--    L'ancienne adresse est unique PAR site (NULL = redirection commune, gérée par l'équipe), plus pour toute l'organisation
CREATE TABLE IF NOT EXISTS seo_redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL UNIQUE,
  target TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 301,
  enabled INTEGER NOT NULL DEFAULT 1,
  note TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  site_id INTEGER
);
CREATE TABLE seo_redirects_r8 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 301,
  enabled INTEGER NOT NULL DEFAULT 1,
  note TEXT NOT NULL DEFAULT '',
  hits INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  site_id INTEGER REFERENCES mk_sites(id)
);
INSERT INTO seo_redirects_r8 (id, source_path, target, status, enabled, note, hits, last_hit_at, created_by, created_at, updated_at, site_id)
  SELECT id, source_path, target, status, enabled, note, hits, last_hit_at, created_by, created_at, updated_at, site_id FROM seo_redirects;
DROP TABLE seo_redirects;
ALTER TABLE seo_redirects_r8 RENAME TO seo_redirects;
CREATE UNIQUE INDEX uq_seo_redirects_site_source ON seo_redirects(COALESCE(site_id, 0), source_path);
CREATE INDEX idx_seo_redirects_site ON seo_redirects(site_id);

-- 4. Journal des erreurs 404 : une ligne par adresse ET par site (NULL = hôte principal)
CREATE TABLE IF NOT EXISTS seo_404 (
  path TEXT PRIMARY KEY,
  hits_human INTEGER NOT NULL DEFAULT 0,
  hits_bot INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_referrer TEXT,
  last_user_agent TEXT,
  ignored INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE seo_404_r8 (
  path TEXT NOT NULL,
  site_id INTEGER REFERENCES mk_sites(id),
  hits_human INTEGER NOT NULL DEFAULT 0,
  hits_bot INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_referrer TEXT,
  last_user_agent TEXT,
  ignored INTEGER NOT NULL DEFAULT 0
);
INSERT INTO seo_404_r8 (path, site_id, hits_human, hits_bot, first_seen, last_seen, last_referrer, last_user_agent, ignored)
  SELECT path, NULL, hits_human, hits_bot, first_seen, last_seen, last_referrer, last_user_agent, ignored FROM seo_404;
DROP TABLE seo_404;
ALTER TABLE seo_404_r8 RENAME TO seo_404;
CREATE UNIQUE INDEX idx_seo_404_scope ON seo_404(COALESCE(site_id, 0), path);
CREATE INDEX idx_seo_404_last ON seo_404(last_seen);

-- 5. Audits, alertes et surveillance : colonne « site » (NULL = site principal). L'audit et la surveillance ne parcourent encore que l'hôte principal et restent réservés à l'équipe.
CREATE TABLE IF NOT EXISTS seo_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'running',
  pages INTEGER NOT NULL DEFAULT 0,
  issues INTEGER NOT NULL DEFAULT 0,
  scores TEXT,
  error TEXT,
  triggered_by INTEGER,
  source TEXT NOT NULL DEFAULT 'admin',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);
ALTER TABLE seo_audits ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE TABLE IF NOT EXISTS seo_monitor_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE seo_monitor_snapshots ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE TABLE IF NOT EXISTS seo_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  severity TEXT NOT NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  seen_at TEXT
);
ALTER TABLE seo_alerts ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_open ON seo_alerts(seen_at, id);
