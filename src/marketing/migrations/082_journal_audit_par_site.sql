-- R7 (lot 4) — Journal d'audit central avec site FACULTATIF (option C approuvée le 16/10/2026) : AJOUT UNIQUEMENT.
--   mk_audit_logs.site_id : site auquel l'événement se rattache quand le contexte serveur le permet (NULL = organisation / site principal / inconnu).
-- Le journal reste UN SEUL journal central, en écriture seule (les déclencheurs mk_audit_no_update / mk_audit_no_delete de la migration 001 sont inchangés et s'appliquent aussi à la nouvelle colonne) :
-- les lignes existantes gardent NULL, aucune n'est réattribuée. Pas de clé étrangère (le journal ne doit jamais être lié à la vie d'un site) ; la validité du site est vérifiée à l'écriture.
-- Retour arrière (hors production, après sauvegarde) : DROP INDEX idx_mk_audit_site ; ALTER TABLE mk_audit_logs DROP COLUMN site_id (les déclencheurs d'écriture seule n'empêchent pas la structure).

ALTER TABLE mk_audit_logs ADD COLUMN site_id INTEGER;
CREATE INDEX idx_mk_audit_site ON mk_audit_logs(organization_id, site_id, id DESC) WHERE site_id IS NOT NULL;
