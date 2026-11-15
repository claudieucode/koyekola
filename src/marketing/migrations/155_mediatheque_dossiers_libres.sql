-- Médiathèque : dossiers libres et personnalisables partout (catégorie d'emplacement, icône, ordre personnalisé, image de couverture, date de modification).
-- ADDITIVE : aucune colonne ni donnée existante n'est modifiée ni supprimée ; les dossiers actuels gardent category = '' (visibles partout, comme avant).
-- Les catégories Images / Vidéos / Audio / Documents restent des CATÉGORIES de fichiers (jamais des dossiers physiques) : « category » ne fait que dire dans quelle catégorie un dossier de premier niveau a été créé.
-- Retour arrière (hors production, après sauvegarde) : ALTER TABLE mk_media_folders DROP COLUMN pour chacune des cinq colonnes ci-dessous.
ALTER TABLE mk_media_folders ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media_folders ADD COLUMN icon TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_media_folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mk_media_folders ADD COLUMN cover_media_id INTEGER REFERENCES mk_media(id) ON DELETE SET NULL;
ALTER TABLE mk_media_folders ADD COLUMN updated_at TEXT;
