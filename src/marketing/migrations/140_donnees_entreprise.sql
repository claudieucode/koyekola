-- Données d'entreprise d'un site (pied de page : coordonnées, horaires, informations légales, moyens de paiement, livraison). Additif : aucune table existante n'est modifiée.
-- Une ligne par organisation ET par site (site_id NULL = site principal) ; « data » est un JSON validé par le serveur (src/marketing/pages/business.js).
CREATE TABLE mk_business_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uq_mk_business_profile_scope ON mk_business_profile(organization_id, COALESCE(site_id, 0));
