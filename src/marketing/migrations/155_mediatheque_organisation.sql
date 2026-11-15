-- Médiathèque, lot 2 : ordre manuel des dossiers, dossiers intelligents et recherches enregistrées.
-- ADDITIVE : une colonne avec valeur par défaut (0 = ordre alphabétique d'avant) et une nouvelle table. Aucune donnée existante n'est modifiée ni supprimée.
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_media_smart ; ALTER TABLE mk_media_folders DROP COLUMN sort_order.

ALTER TABLE mk_media_folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Vues dynamiques : un dossier intelligent (kind 'smart', partagé par le site) ou une recherche enregistrée (kind 'search', personnelle) ne contient aucun fichier :
-- c'est un jeu de critères (les mêmes réglages que l'adresse de la médiathèque) rejoué à chaque ouverture. Aucun fichier n'est déplacé.
CREATE TABLE mk_media_smart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  kind TEXT NOT NULL CHECK (kind IN ('smart', 'search')),
  owner_id INTEGER,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  criteria TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE UNIQUE INDEX idx_mk_media_smart_name ON mk_media_smart(organization_id, ifnull(site_id, 0), kind, ifnull(owner_id, 0), name COLLATE NOCASE);
CREATE INDEX idx_mk_media_smart_scope ON mk_media_smart(organization_id, ifnull(site_id, 0), kind);
