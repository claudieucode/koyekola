-- R7 (lot 2) — Formulaires par site (décision D2 du 16/10/2026) et site de collecte des consentements : AJOUTS UNIQUEMENT.
--   mk_forms.site_id   : site du formulaire (NULL = site principal, comportement historique : tous les formulaires existants restent au site principal) ;
--   mk_consents.site_id : site où le consentement a été collecté, quand il est connu (preuve : la table reste en écriture seule, aucune ligne existante n'est modifiée,
--                         les anciennes preuves gardent NULL = inconnu ou site principal).
-- L'unicité de l'adresse (slug) d'un formulaire reste GLOBALE jusqu'à la reconstruction d'adresses par site (outil src/services/reconstructionTables.js, mk_forms est dans son plan :
-- il reconnaît une colonne site_id déjà présente) — aucune reconstruction n'est faite ici.
-- Garde-fou : le site d'un formulaire appartient à la même organisation. Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_forms_site_*, l'index puis les colonnes.

ALTER TABLE mk_forms ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX idx_mk_forms_site ON mk_forms(site_id, organization_id) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_forms_site_insert BEFORE INSERT ON mk_forms
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'formulaire de site refusé : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_forms_site_update BEFORE UPDATE OF site_id, organization_id ON mk_forms
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'formulaire de site refusé : le site doit appartenir à la même organisation'); END;

ALTER TABLE mk_consents ADD COLUMN site_id INTEGER;
