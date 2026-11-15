-- Médiathèque : ordre d'affichage personnalisé (glisser-déposer). ADDITIVE : une colonne nullable (fichiers), aucune donnée existante n'est modifiée.
-- sort_order NULL = pas d'ordre choisi (l'élément suit le tri par défaut, après les éléments ordonnés). Un ordre vaut pour UN conteneur (dossier ou racine).
-- Dossiers : la colonne sort_order existe déjà (migration 155_mediatheque_organisation, 0 = pas d'ordre choisi) ; on la réutilise, on n'en crée pas de seconde.
-- Retour arrière (hors production, après sauvegarde) : ALTER TABLE mk_media DROP COLUMN sort_order.
ALTER TABLE mk_media ADD COLUMN sort_order INTEGER;
CREATE INDEX idx_mk_media_sort ON mk_media(organization_id, folder_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_mk_media_folders_sort ON mk_media_folders(organization_id, parent_id, sort_order) WHERE deleted_at IS NULL;
