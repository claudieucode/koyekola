-- Marketing 062 — Email Engine (palier 16) : contexte de SITE pour les audiences, segments, modèles et campagnes.
-- AJOUTS UNIQUEMENT. site_id NULL = « site principal / organisation » (toutes les données existantes) ; un numéro = ce site du CMS.
-- Les noms restent uniques par organisation (contrainte historique, non modifiée). Les contacts, eux, restent dans le Contact Core (mk_contacts) :
-- aucune copie de contact dans l'Email Engine.
ALTER TABLE mk_lists ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_segments ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_templates ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_campaigns ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX idx_mk_lists_site ON mk_lists(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mk_segments_site ON mk_segments(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mk_templates_site ON mk_templates(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mk_campaigns_site ON mk_campaigns(site_id) WHERE site_id IS NOT NULL;
