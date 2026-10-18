-- R9-3 — retour arrière de 092 (joué SEULEMENT après les refus de scripts/r9/site-maitre.js : rien ne référence la ligne du principal, elle est intacte).
DROP TRIGGER mk_sites_primary_fixed;
DROP TRIGGER mk_sites_primary_stays_active;
DROP TRIGGER mk_sites_primary_no_delete;
DELETE FROM mk_sites WHERE is_primary = 1;
DROP INDEX uq_mk_sites_primary;
ALTER TABLE mk_sites DROP COLUMN is_primary;
