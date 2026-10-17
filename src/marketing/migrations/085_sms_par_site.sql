-- R7 (lot 6.1) — Campagnes SMS par site (décision produit du 17/10/2026) : AJOUT UNIQUE d'une colonne, aucune donnée existante modifiée.
--   mk_sms_campaigns.site_id : site auquel appartient la campagne (NULL = organisation / site principal : TOUTES les campagnes existantes). Les messages (mk_sms_messages), liens et clics
--   n'ont PAS de colonne propre : ils appartiennent à la campagne (jointure), il n'y a donc jamais deux vérités.
-- Lignes historiques : toutes à NULL (campagnes de l'équipe, sans site). Aucune n'est attribuée automatiquement à un site — ce serait inventer une origine. Cas ambigu : aucun (un site ne gérait pas de SMS).
-- Le site d'une campagne ne change jamais (déclencheur) ; il doit appartenir à la même organisation. La liste STOP (mk_sms_suppressions) n'a volontairement AUCUN site : elle reste commune à l'organisation.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_smsc_*, l'index idx_mk_sms_campaigns_site, puis la colonne ; les campagnes, messages et consentements ne changent pas.

ALTER TABLE mk_sms_campaigns ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX idx_mk_sms_campaigns_site ON mk_sms_campaigns(site_id, organization_id) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_smsc_insert BEFORE INSERT ON mk_sms_campaigns
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'campagne SMS de site refusée : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_smsc_site_fixe BEFORE UPDATE OF site_id ON mk_sms_campaigns
WHEN NEW.site_id IS NOT OLD.site_id
BEGIN SELECT RAISE(ABORT, 'campagne SMS : le site ne change jamais (dupliquez la campagne)'); END;
