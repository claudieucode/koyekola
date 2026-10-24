-- Outils → Admin Notes : notes internes d'administration, PAR SITE. Migration ADDITIVE (aucune table existante modifiée, aucune donnée déplacée).
--   mk_admin_notes : une ligne par note. site_id NULL = site principal. Le texte est stocké tel que saisi (texte brut) ; il est ÉCHAPPÉ à l'affichage, jamais interprété comme du HTML.
--                    Aucune note n'est copiée d'un site à un autre (création de site, starter pack) : la portée d'une note est son (organisation, site), vérifiée à chaque requête.
-- Retour arrière : DROP TABLE mk_admin_notes ; (les notes sont alors perdues : elles n'existent qu'ici).
CREATE TABLE IF NOT EXISTS mk_admin_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  author_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  updated_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_mk_admin_notes_scope ON mk_admin_notes (organization_id, site_id, created_at DESC, id DESC);
