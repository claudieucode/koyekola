-- Palier 1 — Site Manager : informations de gestion d'un site (identifiant lisible, description, type) et suppression logique.
-- Additif : aucune ligne ni colonne existante n'est modifiée. Les sites déjà créés reçoivent leur identifiant lisible (slug) au premier affichage (code).
--  - slug : identifiant lisible, unique par organisation (l'identifiant numérique, lui, ne change jamais) ;
--  - deleted_at / deleted_by : un site supprimé disparaît des listes mais reste en base (corbeille), avec ses pages et ses accès.
-- Retour arrière : DROP INDEX idx_mk_sites_slug; ALTER TABLE mk_sites DROP COLUMN slug / description / site_type / deleted_at / deleted_by.
ALTER TABLE mk_sites ADD COLUMN slug TEXT;
ALTER TABLE mk_sites ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_sites ADD COLUMN site_type TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_sites ADD COLUMN deleted_at TEXT;
ALTER TABLE mk_sites ADD COLUMN deleted_by INTEGER;
CREATE UNIQUE INDEX idx_mk_sites_slug ON mk_sites(organization_id, slug) WHERE slug IS NOT NULL;
