-- Pied de page (etapes 9 et 10) : favoris de la bibliotheque et version du modele d'origine. Ajout seul : aucune donnee existante n'est modifiee ni supprimee.
-- Favoris : propres a UN utilisateur ET a UN site (site_id vide = site principal). La cle du modele est son identifiant stable de la bibliotheque, jamais un ancien alias.
CREATE TABLE mk_tb_favoris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  modele_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_tb_favoris_unique ON mk_tb_favoris (organization_id, COALESCE(site_id, 0), user_id, type, modele_id);
CREATE INDEX idx_mk_tb_favoris_lecture ON mk_tb_favoris (user_id, site_id, type);

-- Version de composition du modele de la bibliotheque au moment de l'installation (avec origin_key, ajoute par la migration 141). Vide = inconnue : jamais une valeur inventee.
ALTER TABLE mk_tb_templates ADD COLUMN origin_version INTEGER;
