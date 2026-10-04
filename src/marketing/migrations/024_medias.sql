-- Médiathèque de KOLAKISA Marketing (images et documents insérés dans les e-mails), une par organisation.
-- Le fichier est stocké sur le serveur (dossier des fichiers envoyés, conservé entre les déploiements) et servi à une
-- adresse publique permanente : un e-mail ne contient jamais d'adresse temporaire du navigateur. Les dimensions sont
-- lues dans le fichier lui-même (jamais déclarées par le navigateur).
CREATE TABLE mk_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  kind TEXT NOT NULL CHECK (kind IN ('image', 'document')),
  path TEXT NOT NULL,                     -- chemin public : /uploads/marketing/<organisation>/<fichier>
  name TEXT NOT NULL,                     -- nom affiché (modifiable), d'après le nom d'origine
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,                  -- octets
  width INTEGER,
  height INTEGER,
  alt TEXT NOT NULL DEFAULT '',           -- texte alternatif proposé à l'insertion d'une image
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, path)
);
CREATE INDEX idx_mk_media_org ON mk_media(organization_id, created_at);
