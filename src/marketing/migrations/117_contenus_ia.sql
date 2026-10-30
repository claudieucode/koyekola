-- Programme 21.6 — Kolakisa AI Content Generator. Migration ADDITIVE : trois tables nouvelles, aucune donnée existante touchée.
--   mk_content_voice    : voix éditoriale d'un site (une ligne par site, JSON à listes fermées, sans fait sur l'entreprise).
--   mk_content_sets     : un ensemble de textes proposés pour UNE page dans UNE langue (champs, SEO, constats, questions). `status` : proposed | accepted | applied | discarded.
--                         `fields` : { clé de champ → { value, source ai|user, locked, base, appliedValue … } } ; `input_hash` évite de régénérer ce qui n'a pas changé ; `revision` protège les écritures concurrentes.
--                         `source_set_id` relie une version linguistique à sa version d'origine.
--   mk_content_versions : historique des valeurs de chaque champ (génération, variantes proposées, choix, modification manuelle, application).
-- Les textes sont conservés pour l'historique et l'annulation ; le contexte (faits fournis par la personne) l'est pour régénérer sans les redemander. Ils suivent l'effacement du site (ON DELETE CASCADE).
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_content_versions ; DROP TABLE mk_content_sets ; DROP TABLE mk_content_voice ; DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '117'.
CREATE TABLE mk_content_voice (
  site_id INTEGER PRIMARY KEY REFERENCES mk_sites(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  voice TEXT NOT NULL,
  updated_by INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_content_voice_org ON mk_content_voice(organization_id);

CREATE TABLE mk_content_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE,
  page_id INTEGER REFERENCES mk_landing_pages(id) ON DELETE SET NULL,
  page_key TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'fr',
  source_set_id INTEGER REFERENCES mk_content_sets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'applied', 'discarded')),
  voice TEXT NOT NULL DEFAULT '{}',
  context TEXT NOT NULL DEFAULT '{}',
  fields TEXT NOT NULL DEFAULT '{}',
  seo TEXT NOT NULL DEFAULT '{}',
  issues TEXT NOT NULL DEFAULT '[]',
  questions TEXT NOT NULL DEFAULT '[]',
  input_hash TEXT NOT NULL DEFAULT '',
  used_ai INTEGER NOT NULL DEFAULT 0 CHECK (used_ai IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  applied_at INTEGER
);
CREATE INDEX idx_mk_content_sets_site ON mk_content_sets(site_id, page_id, language, id);
CREATE INDEX idx_mk_content_sets_org ON mk_content_sets(organization_id);
CREATE INDEX idx_mk_content_sets_page ON mk_content_sets(page_id) WHERE page_id IS NOT NULL;
CREATE INDEX idx_mk_content_sets_source ON mk_content_sets(source_set_id) WHERE source_set_id IS NOT NULL;

CREATE TABLE mk_content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  set_id INTEGER NOT NULL REFERENCES mk_content_sets(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'user')),
  action TEXT NOT NULL,
  batch TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_content_versions_set ON mk_content_versions(set_id, field_key, id);
