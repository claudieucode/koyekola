-- Médiathèque → gestionnaire de fichiers : favoris, tags, collections, préférences, dossiers enrichis, corbeille de dossiers, conservation de la corbeille.
-- ADDITIVE : aucune colonne ni donnée existante n'est modifiée ni supprimée. Les dossiers et les fichiers restent LOGIQUES (l'adresse publique d'un média ne change jamais).
-- Retour arrière (hors production, après sauvegarde) : DROP des 8 tables ci-dessous, puis ALTER TABLE … DROP COLUMN des colonnes ajoutées, puis recréer l'ancien index de noms de dossiers.

-- Dossiers : couleur (liste fermée côté serveur), description, corbeille
ALTER TABLE mk_media_folders ADD COLUMN color TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media_folders ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media_folders ADD COLUMN deleted_at TEXT;
ALTER TABLE mk_media_folders ADD COLUMN deleted_by INTEGER;
-- Un dossier en corbeille ne bloque plus son nom : l'unicité ne vaut que pour les dossiers présents
DROP INDEX IF EXISTS idx_mk_media_folders_name;
CREATE UNIQUE INDEX idx_mk_media_folders_name ON mk_media_folders(organization_id, ifnull(site_id, 0), ifnull(parent_id, 0), name COLLATE NOCASE) WHERE deleted_at IS NULL;

-- Fichiers : date de modification, dernière utilisation (sélecteur des éditeurs), dossier dont la mise en corbeille a entraîné celle du fichier
ALTER TABLE mk_media ADD COLUMN updated_at TEXT;
ALTER TABLE mk_media ADD COLUMN last_used_at TEXT;
ALTER TABLE mk_media ADD COLUMN trashed_with_folder INTEGER;
CREATE INDEX idx_mk_media_used ON mk_media(organization_id, last_used_at) WHERE last_used_at IS NOT NULL;
CREATE INDEX idx_mk_media_trashed_folder ON mk_media(trashed_with_folder) WHERE trashed_with_folder IS NOT NULL;

-- Favoris : propres à chaque personne
CREATE TABLE mk_media_stars (
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  kind TEXT NOT NULL CHECK (kind IN ('media', 'folder')),
  target_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, kind, target_id)
);
CREATE INDEX idx_mk_media_stars_org ON mk_media_stars(organization_id, user_id, kind);

-- Tags : propres à une médiathèque (site_id NULL = commune), plusieurs par fichier
CREATE TABLE mk_media_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_media_tags_name ON mk_media_tags(organization_id, ifnull(site_id, 0), name COLLATE NOCASE);
CREATE TABLE mk_media_tag_links (
  media_id INTEGER NOT NULL REFERENCES mk_media(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES mk_media_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, tag_id)
);
CREATE INDEX idx_mk_media_tag_links_tag ON mk_media_tag_links(tag_id);

-- Collections : regroupement LOGIQUE (aucun fichier n'est déplacé)
CREATE TABLE mk_media_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_media_collections_name ON mk_media_collections(organization_id, ifnull(site_id, 0), name COLLATE NOCASE);
CREATE TABLE mk_media_collection_items (
  collection_id INTEGER NOT NULL REFERENCES mk_media_collections(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES mk_media(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (collection_id, media_id)
);
CREATE INDEX idx_mk_media_collection_items_media ON mk_media_collection_items(media_id);

-- Préférences d'affichage : par personne ET par médiathèque (site_key = « principal » ou le numéro du site)
CREATE TABLE mk_media_prefs (
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_key TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, organization_id, site_key)
);

-- Conservation de la corbeille, par médiathèque : 0 = conserver jusqu'au vidage manuel (comportement actuel)
CREATE TABLE mk_media_settings (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_key TEXT NOT NULL,
  trash_retention_days INTEGER NOT NULL DEFAULT 0 CHECK (trash_retention_days IN (0, 7, 30, 90)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, site_key)
);
