-- Explorateur de médias (TITAN XXXIII) : dossiers LOGIQUES (jamais de déplacement de fichier sur le disque : l'adresse publique d'un média ne change donc jamais)
-- et empreinte SHA-256 du contenu (détection des doublons, jamais de suppression automatique).
-- site_id NULL = médiathèque commune du site principal ; sinon le dossier appartient à ce site (même règle que mk_media.reach / site_id).
CREATE TABLE mk_media_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  parent_id INTEGER REFERENCES mk_media_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_media_folders_name ON mk_media_folders(organization_id, ifnull(site_id, 0), ifnull(parent_id, 0), name COLLATE NOCASE);
CREATE INDEX idx_mk_media_folders_parent ON mk_media_folders(parent_id);

ALTER TABLE mk_media ADD COLUMN folder_id INTEGER REFERENCES mk_media_folders(id) ON DELETE SET NULL;
ALTER TABLE mk_media ADD COLUMN sha256 TEXT;
CREATE INDEX idx_mk_media_folder ON mk_media(organization_id, folder_id, deleted_at);
CREATE INDEX idx_mk_media_sha ON mk_media(organization_id, sha256) WHERE sha256 IS NOT NULL;
