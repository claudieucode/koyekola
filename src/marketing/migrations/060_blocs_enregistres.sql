-- Blocs enregistrés de l'éditeur d'e-mails (« Mes blocs ») : un bloc mis en forme, réutilisable dans tous les modèles de l'organisation.
CREATE TABLE mk_saved_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  blocks TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (organization_id, name)
);
