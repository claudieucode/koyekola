-- Titan XXIII (palier B) — RATTACHEMENT DES FORMATIONS À UN SITE : TABLE NOUVELLE, strictement additive, SANS AUCUNE LIGNE.
-- Convention conservée (voir 075) : une formation SANS ligne appartient au SITE PRINCIPAL (comportement historique inchangé, aucune donnée existante n'est touchée).
-- Une ligne rattache la formation à UN site (une formation = un site) ; sections, leçons, quiz, pièces jointes, inscriptions, progression, avis, certificats
-- et lignes de commande héritent du site par leur formation : aucune colonne n'est ajoutée à ces tables, rien n'est dupliqué.
-- Pas de clé étrangère vers `courses` (la table du LMS peut être absente des bases de test) : une ligne dont la formation a disparu est inerte (le service ne la joint jamais) et nettoyée par `lmsSites.purgeOrphans`.
-- Retour arrière (hors production, après sauvegarde) : DROP TRIGGER trg_mk_cs_course_*; DROP TABLE mk_course_sites. Les formations ne sont pas modifiées.

CREATE TABLE mk_course_sites (
  course_id INTEGER NOT NULL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_course_sites_site ON mk_course_sites(site_id, course_id);

CREATE TRIGGER trg_mk_cs_course_insert BEFORE INSERT ON mk_course_sites
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'formation de site refusée : le site doit appartenir à la même organisation'); END;

CREATE TRIGGER trg_mk_cs_course_update BEFORE UPDATE ON mk_course_sites
WHEN NEW.course_id IS NOT OLD.course_id OR NEW.organization_id IS NOT OLD.organization_id
  OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'formation de site refusée : identifiant et organisation sont figés, et le site reste dans l''organisation'); END;
