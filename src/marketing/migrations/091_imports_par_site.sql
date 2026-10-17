-- R8 (lot 6A) — Imports de contacts par site (décision du 17/10/2026) : mk_imports.site_id = site auquel l'import appartient (NULL = import de l'organisation / de l'équipe). Les lignes rejetées (mk_import_rejects)
-- suivent leur import. Reprise de l'historique SANS rien deviner : un import ancien reçoit le site que ses options enregistrent DÉJÀ (« siteId », posé quand la liste visée était une audience de site, et
-- appliqué aux contacts créés), à condition que ce site existe dans la même organisation ; tous les autres restent NULL (visibles de l'équipe seulement).
-- Le site d'un import ne change plus ensuite (déclencheur) et doit appartenir à la même organisation.
-- Retour arrière (hors production, après sauvegarde) : scripts/migrations-retour-arriere/091_imports_par_site.down.sql (supprime les déclencheurs, l'index et la colonne ; les imports et leurs rejets sont conservés).

ALTER TABLE mk_imports ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
UPDATE mk_imports SET site_id = CAST(json_extract(options, '$.siteId') AS INTEGER)
 WHERE json_valid(options) AND json_extract(options, '$.siteId') IS NOT NULL
   AND EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = CAST(json_extract(mk_imports.options, '$.siteId') AS INTEGER) AND s.organization_id = mk_imports.organization_id);
CREATE INDEX idx_mk_imports_site ON mk_imports(site_id, id) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_imports_site_insert BEFORE INSERT ON mk_imports
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'import refusé : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_imports_site_fixe BEFORE UPDATE OF site_id ON mk_imports
WHEN NEW.site_id IS NOT OLD.site_id
BEGIN SELECT RAISE(ABORT, 'import : le site ne change jamais'); END;
