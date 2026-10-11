-- Composants réutilisables : cycle de vie complet (enregistrer, retrouver, insérer, modifier, mettre à jour, détacher, supprimer).
--  * kind : « standard » = modèle dont les insertions sont des copies indépendantes ; « global » = référence partagée dont les instances LIÉES
--    (sections { type: "component", componentId }) reçoivent les mises à jour. (La colonne site_id garde son sens : portée d'un site ou de tous.)
--  * draft : copie de travail du composant (modifiée dans l'éditeur du composant) ; la colonne section reste la version DIFFUSÉE.
--    Rien ne change dans les pages avant la mise à jour explicite (draft → section, version + 1).
ALTER TABLE mk_web_components ADD COLUMN kind TEXT NOT NULL DEFAULT 'standard' CHECK (kind IN ('standard', 'global'));
ALTER TABLE mk_web_components ADD COLUMN draft TEXT;
ALTER TABLE mk_web_components ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Les composants déjà utilisés comme références (pages, en-tête / pied de page, variantes) étaient « synchronisés » : ils restent globaux
UPDATE mk_web_components SET kind = 'global'
 WHERE id IN (SELECT header_component_id FROM mk_sites WHERE header_component_id IS NOT NULL)
    OR id IN (SELECT footer_component_id FROM mk_sites WHERE footer_component_id IS NOT NULL)
    OR id IN (SELECT header_component_id FROM mk_landing_pages WHERE header_component_id IS NOT NULL)
    OR variant_of IS NOT NULL
    OR EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.organization_id = mk_web_components.organization_id
         AND (p.sections LIKE '%"componentId":' || mk_web_components.id || '}%' OR p.sections LIKE '%"componentId":' || mk_web_components.id || ',%'
           OR p.draft LIKE '%"componentId":' || mk_web_components.id || '}%' OR p.draft LIKE '%"componentId":' || mk_web_components.id || ',%'));
