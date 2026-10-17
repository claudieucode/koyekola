-- 079 — Index de clé étrangère manquant de la 074 (médias par site) : `idx_mk_media_site` commence par organization_id, aucun index ne commence par site_id
-- (audit D3 : toute clé étrangère doit avoir un index). Additive, idempotente, n'altère aucune donnée ; la 074 reste intacte (figée).
-- Numéro 079 : 076 à 078 sont réservés aux reconstructions historiques (registre de travail R6), jamais attribués à un autre usage.
-- Retour arrière (hors production, après sauvegarde) : DROP INDEX idx_mk_media_site_id.
CREATE INDEX IF NOT EXISTS idx_mk_media_site_id ON mk_media(site_id) WHERE site_id IS NOT NULL;
