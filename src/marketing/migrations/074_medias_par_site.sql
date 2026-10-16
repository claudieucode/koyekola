-- R5 — Médias par site (anomalie A-12 de l'audit des sites, décision D6) : appartenance et portée de chaque média de la médiathèque.
--  - reach   : 'shared' (valeur par défaut : médiathèque commune de l'organisation, utilisable par tous les sites — comportement historique) ou 'site' (propre à UN site) ;
--  - site_id : le site d'un média 'site' (NULL pour 'shared').
-- Additif et NEUTRE pour l'existant : tous les médias déjà en base restent 'shared' ; aucun fichier n'est déplacé, aucune adresse (chemin) ne change, aucune référence
-- des pages, articles, e-mails ou réglages n'est modifiée. Seuls les nouveaux téléversements faits pour un site reçoivent 'site' et un dossier propre à ce site.
-- Garde-fous DANS LA BASE (en plus des contrôles du serveur, comme les migrations 071 et 072) : le site d'un média est un site de la même organisation ; 'site' exige un site,
-- 'shared' n'en admet pas ; un média ne change jamais d'organisation et ne passe jamais directement d'un site à un autre (il redevient d'abord 'shared', décision d'une personne
-- qui gère l'organisation, contrôlée par le serveur). Ils ne s'appliquent qu'aux écritures FUTURES : les lignes existantes ne sont pas revérifiées.
-- Retour arrière (hors production, après sauvegarde) : DROP TRIGGER pour chacun des déclencheurs ci-dessous, DROP INDEX idx_mk_media_site, puis supprimer les deux colonnes
-- (ALTER TABLE … DROP COLUMN) ; une migration appliquée ne se retire jamais d'un historique : ce retour est un nouveau travail, jamais une modification de ce fichier.

ALTER TABLE mk_media ADD COLUMN reach TEXT NOT NULL DEFAULT 'shared' CHECK (reach IN ('shared', 'site'));
ALTER TABLE mk_media ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX idx_mk_media_site ON mk_media(organization_id, site_id, deleted_at) WHERE site_id IS NOT NULL;

CREATE TRIGGER mk_media_scope_insert BEFORE INSERT ON mk_media
WHEN (NEW.reach = 'site' AND (NEW.site_id IS NULL OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id))
  OR (NEW.reach = 'shared' AND NEW.site_id IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'portée de média incohérente : un média de site désigne un site de son organisation ; un média commun n''en désigne aucun'); END;

CREATE TRIGGER mk_media_scope_update BEFORE UPDATE OF reach, site_id, organization_id ON mk_media
WHEN NEW.organization_id IS NOT OLD.organization_id
  OR (NEW.reach = 'site' AND (NEW.site_id IS NULL OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id))
  OR (NEW.reach = 'shared' AND NEW.site_id IS NOT NULL)
  OR (OLD.reach = 'site' AND NEW.reach = 'site' AND NEW.site_id IS NOT OLD.site_id)
BEGIN SELECT RAISE(ABORT, 'portée de média refusée : organisation figée, site cohérent, et jamais de passage direct d''un site à un autre'); END;
