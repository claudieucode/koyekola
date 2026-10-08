-- KOLAKISA CMS, palier 3 (médiathèque) : la médiathèque marketing (mk_media) devient la médiathèque du CMS.
-- Additive : aucune colonne ni donnée existante n'est modifiée ni supprimée.
--  - métadonnées : titre, légende, description (le nom affiché et le texte alternatif existent déjà) ;
--  - type : image | video | audio | pdf | document (kind reste « image » ou « document », valeurs historiques des e-mails) ;
--  - corbeille : deleted_at / deleted_by (suppression douce ; le fichier n'est effacé qu'à la suppression définitive).
ALTER TABLE mk_media ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media ADD COLUMN caption TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media ADD COLUMN type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE mk_media ADD COLUMN deleted_at TEXT;
ALTER TABLE mk_media ADD COLUMN deleted_by INTEGER;
UPDATE mk_media SET type = CASE WHEN mime = 'application/pdf' THEN 'pdf' WHEN kind = 'image' THEN 'image' ELSE 'document' END;
CREATE INDEX idx_mk_media_list ON mk_media(organization_id, deleted_at, type, created_at);
