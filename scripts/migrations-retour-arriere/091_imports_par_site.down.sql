-- Retour arrière de 091 (hors production, APRÈS sauvegarde). Les imports et leurs rejets sont conservés ; seule la colonne de site disparaît.
BEGIN;
DROP TRIGGER IF EXISTS trg_mk_imports_site_insert;
DROP TRIGGER IF EXISTS trg_mk_imports_site_fixe;
DROP INDEX IF EXISTS idx_mk_imports_site;
ALTER TABLE mk_imports DROP COLUMN site_id;
DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '091';
COMMIT;
