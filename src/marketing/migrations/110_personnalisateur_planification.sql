-- Personnaliser : publication planifiée et liens d'aperçu partageables. Migration ADDITIVE (colonnes et table nouvelles, rien d'existant modifié).
-- publish_at : date (UTC, « AAAA-MM-JJ HH:MM:SS ») à laquelle le brouillon enregistré sera publié ; scheduled_by : qui l'a planifiée (ses droits sont revérifiés à l'exécution) ;
-- publish_error : raison pour laquelle une publication planifiée n'a PAS eu lieu (la planification est alors annulée, jamais rejouée en silence).
ALTER TABLE cms_customizer_drafts ADD COLUMN publish_at TEXT;
ALTER TABLE cms_customizer_drafts ADD COLUMN scheduled_by INTEGER;
ALTER TABLE cms_customizer_drafts ADD COLUMN publish_error TEXT;
CREATE INDEX IF NOT EXISTS idx_cms_customizer_drafts_due ON cms_customizer_drafts (publish_at) WHERE publish_at IS NOT NULL;

-- Lien d'aperçu partageable : le jeton n'est JAMAIS stocké (seulement son empreinte SHA-256). changes = copie figée des réglages du brouillon au moment du partage.
CREATE TABLE IF NOT EXISTS cms_customizer_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  token_hash TEXT NOT NULL UNIQUE,
  changes TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_cms_customizer_shares_site ON cms_customizer_shares (site_id);
