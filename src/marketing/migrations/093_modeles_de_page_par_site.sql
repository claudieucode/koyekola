-- Site builder multisite — isolation des modèles de pages enregistrés (« Mes modèles »). Migration ADDITIVE (aucune table reconstruite).
-- Avant : un modèle enregistré depuis la page d'UN site était proposé dans la création de page de TOUS les sites (et visible d'un accès limité à un autre site).
-- Après : un modèle appartient à un site (site_id) ou au site principal (site_id NULL) ; seuls les modèles HÉRITÉS (existants au moment de cette migration, origine inconnue)
-- restent communs (shared = 1) pour ne rien faire disparaître : ils continuent d'être proposés partout, comme avant. Tout nouveau modèle est privé à son site (shared = 0).
-- Compatibilité : la reconstruction « unicité par site » (src/services/reconstructionTables.js, procédure manuelle R6 lot 5) reste applicable telle quelle
-- (elle n'ajoute site_id que s'il n'existe pas et remplace UNIQUE(organization_id, name) par l'unicité par site). Tant qu'elle n'a pas été exécutée, le nom d'un modèle reste unique dans l'organisation.
ALTER TABLE mk_page_templates ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_page_templates ADD COLUMN shared INTEGER NOT NULL DEFAULT 0;
UPDATE mk_page_templates SET shared = 1;
CREATE INDEX idx_mk_page_templates_site ON mk_page_templates (site_id);
