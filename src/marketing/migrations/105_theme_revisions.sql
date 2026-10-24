-- Apparence → Éditeur de fichiers des thèmes : historique des versions d'un fichier virtuel d'un thème, PAR SITE. Migration ADDITIVE (aucune table existante modifiée).
-- Un thème est un paquet de DONNÉES (voir 094) : ses « fichiers » sont des vues JSON de son manifeste ; chaque enregistrement conserve le contenu écrit, pour le consulter et le restaurer.
-- site_id NULL = site principal. Réversible : DROP TABLE cms_theme_revisions (le thème lui-même n'est pas touché).
CREATE TABLE IF NOT EXISTS cms_theme_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES mk_sites(id),
  theme_key TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  etag TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cms_theme_revisions_scope ON cms_theme_revisions (site_id, theme_key, file_path, id);
