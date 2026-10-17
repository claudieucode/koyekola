-- R7 (lot 6.5) — Revenus des e-mails par site (décision produit du 17/10/2026) : UNE colonne ajoutée à l'attribution des commandes, aucun montant, aucune commande ni règle de calcul modifié.
--   mk_order_attributions.site_id : site de l'ENVOI qui a reçu l'attribution = site de la campagne cliquée, à défaut celui de l'automatisation (NULL = organisation / site principal / origine inconnue).
-- Les commandes elles-mêmes (table orders du cœur) ne portent AUCUN site et le panier reste sur l'hôte principal : une commande n'est donc jamais « une vente d'un site » ; seul le revenu ATTRIBUÉ à l'e-mail d'un site
-- est rattaché à ce site, par une relation de confiance côté serveur (campaign.site_id / automation.site_id), jamais par une valeur de requête.
-- Reprise de l'historique, SANS rien deviner : une attribution reçoit le site que sa campagne (à défaut son automatisation, même organisation, site de la même organisation) portait DÉJÀ ; sinon elle reste à NULL.
-- Le site d'une attribution ne change plus ensuite (déclencheur) ; il doit appartenir à la même organisation.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_attr_*, l'index idx_mk_attr_site, puis la colonne ; les montants, les commandes et les campagnes ne changent pas.

ALTER TABLE mk_order_attributions ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
UPDATE mk_order_attributions SET site_id = COALESCE(
  (SELECT c.site_id FROM mk_campaigns c WHERE c.id = mk_order_attributions.campaign_id AND c.organization_id = mk_order_attributions.organization_id AND c.site_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = c.site_id AND s.organization_id = mk_order_attributions.organization_id)),
  (SELECT au.site_id FROM mk_automations au WHERE au.id = mk_order_attributions.automation_id AND au.organization_id = mk_order_attributions.organization_id AND au.site_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = au.site_id AND s.organization_id = mk_order_attributions.organization_id))
);
CREATE INDEX idx_mk_attr_site ON mk_order_attributions(site_id, ordered_at) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_attr_insert BEFORE INSERT ON mk_order_attributions
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'attribution de revenu refusée : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_attr_site_fixe BEFORE UPDATE OF site_id ON mk_order_attributions
WHEN NEW.site_id IS NOT OLD.site_id
BEGIN SELECT RAISE(ABORT, 'attribution de revenu : le site ne change jamais'); END;
