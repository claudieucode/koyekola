-- R7 (lot 6.4) — Score des contacts par site (décision produit du 17/10/2026) : UNE colonne ajoutée au journal du score, aucun calcul ni score existant modifié.
--   mk_score_log.site_id : site de l'ÉVÉNEMENT qui a donné les points (NULL = organisation / site principal / origine inconnue). Les règles, les niveaux et le score stocké du contact
--   (mk_contacts.score) restent des données d'ORGANISATION, gérées par l'équipe : le calcul de l'équipe est strictement inchangé.
-- Reprise de l'historique, SANS rien deviner : une ligne issue d'une règle (source = 'rule') reçoit le site que l'événement d'origine (mk_events, même organisation, même identifiant) portait DÉJÀ
-- (colonne site_id écrite par le serveur à l'émission) ; une ligne dont l'événement n'a pas de site, est introuvable, ou qui vient d'un scénario (source = 'automation', event_id = repère d'étape) reste à NULL.
-- Le site d'une ligne ne change plus ensuite (déclencheur) ; il doit appartenir à la même organisation.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_scorelog_*, l'index idx_mk_score_log_site, puis la colonne ; le score des contacts et les règles ne changent pas.

ALTER TABLE mk_score_log ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
UPDATE mk_score_log SET site_id = (
  SELECT e.site_id FROM mk_events e
  WHERE e.id = mk_score_log.event_id AND e.organization_id = mk_score_log.organization_id
    AND e.site_id IS NOT NULL AND EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = e.site_id AND s.organization_id = mk_score_log.organization_id)
) WHERE source = 'rule';
CREATE INDEX idx_mk_score_log_site ON mk_score_log(site_id, contact_id) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_scorelog_insert BEFORE INSERT ON mk_score_log
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'journal du score refusé : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_scorelog_site_fixe BEFORE UPDATE OF site_id ON mk_score_log
WHEN NEW.site_id IS NOT OLD.site_id
BEGIN SELECT RAISE(ABORT, 'journal du score : le site ne change jamais'); END;
