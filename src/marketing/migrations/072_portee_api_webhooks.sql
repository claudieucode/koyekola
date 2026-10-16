-- R2 — Portée de site des clés d'API et des points d'arrivée de webhooks sortants (anomalies A-01 et A-02 de l'audit des sites, décision D4).
-- Additif et NEUTRE pour l'existant : chaque clé et chaque point d'arrivée déjà en base reçoit la portée « organization » (valeur par défaut),
-- donc le même accès qu'avant (toute l'organisation) ; aucune ligne n'est réécrite à la main, aucun accès n'est retiré ni élargi.
--  - reach     : 'organization' (accès à toute l'organisation, comportement historique) ou 'site' (limité à UN site) ;
--  - site_id   : le site de la portée 'site' (NULL pour 'organization'). La portée est fixée à la création et ne se modifie plus.
-- Garde-fous DANS LA BASE (en plus des contrôles du serveur, comme la migration 071) : un site de portée appartient à la même organisation que la clé
-- ou le point d'arrivée ; 'site' exige un site, 'organization' n'en admet pas ; la portée ne peut pas être changée après création (ni élargie, ni déplacée).
-- Ils ne s'appliquent qu'aux écritures FUTURES : les lignes existantes ne sont pas revérifiées.
-- Retour arrière (hors production, après sauvegarde) : DROP TRIGGER pour chacun des déclencheurs ci-dessous, puis supprimer les colonnes
-- (ALTER TABLE … DROP COLUMN) ; une migration appliquée ne se retire jamais d'un historique : ce retour est un nouveau travail, jamais une modification de ce fichier.

ALTER TABLE mk_api_keys ADD COLUMN reach TEXT NOT NULL DEFAULT 'organization' CHECK (reach IN ('organization', 'site'));
ALTER TABLE mk_api_keys ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_webhook_endpoints ADD COLUMN reach TEXT NOT NULL DEFAULT 'organization' CHECK (reach IN ('organization', 'site'));
ALTER TABLE mk_webhook_endpoints ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);

CREATE INDEX idx_mk_api_keys_site ON mk_api_keys(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mk_webhook_endpoints_site ON mk_webhook_endpoints(site_id) WHERE site_id IS NOT NULL;

-- Clés d'API : cohérence de la portée à la création
CREATE TRIGGER mk_api_keys_reach_insert BEFORE INSERT ON mk_api_keys
WHEN (NEW.reach = 'site' AND (NEW.site_id IS NULL OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id))
  OR (NEW.reach = 'organization' AND NEW.site_id IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'portée incohérente : une clé limitée à un site désigne un site de son organisation ; une clé d''organisation n''en désigne aucun'); END;
-- Clés d'API : la portée est fixée à la création
CREATE TRIGGER mk_api_keys_reach_fixed BEFORE UPDATE OF reach, site_id, organization_id ON mk_api_keys
WHEN NEW.reach IS NOT OLD.reach OR NEW.site_id IS NOT OLD.site_id OR NEW.organization_id IS NOT OLD.organization_id
BEGIN SELECT RAISE(ABORT, 'portée figée : la portée d''une clé ne se modifie pas (créez une autre clé)'); END;

-- Points d'arrivée de webhooks : mêmes garanties
CREATE TRIGGER mk_webhook_endpoints_reach_insert BEFORE INSERT ON mk_webhook_endpoints
WHEN (NEW.reach = 'site' AND (NEW.site_id IS NULL OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id))
  OR (NEW.reach = 'organization' AND NEW.site_id IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'portée incohérente : un point d''arrivée limité à un site désigne un site de son organisation ; un point d''organisation n''en désigne aucun'); END;
CREATE TRIGGER mk_webhook_endpoints_reach_fixed BEFORE UPDATE OF reach, site_id, organization_id ON mk_webhook_endpoints
WHEN NEW.reach IS NOT OLD.reach OR NEW.site_id IS NOT OLD.site_id OR NEW.organization_id IS NOT OLD.organization_id
BEGIN SELECT RAISE(ABORT, 'portée figée : la portée d''un point d''arrivée ne se modifie pas (créez-en un autre)'); END;
