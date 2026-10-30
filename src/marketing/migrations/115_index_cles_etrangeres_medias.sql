-- Palier 18 : index des deux clés étrangères de l'explorateur de médias (migration 112) qui n'en avaient pas.
-- Sans eux, supprimer un dossier ou un site (ON DELETE SET NULL / contrôle de clé étrangère) parcourt toute la table.
-- Additif et idempotent : aucune donnée n'est lue ni modifiée.
CREATE INDEX IF NOT EXISTS idx_mk_media_folder_id ON mk_media(folder_id);
CREATE INDEX IF NOT EXISTS idx_mk_media_folders_site ON mk_media_folders(site_id);
