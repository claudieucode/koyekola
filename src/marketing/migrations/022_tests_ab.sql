-- Tests A/B des campagnes e-mail (comme Mailchimp) : 2 ou 3 versions qui diffèrent par l'objet et/ou le contenu (modèle).
-- Une partie de la cible reçoit les versions (réparties au hasard) ; après un délai, la meilleure (clics ou ouvertures,
-- ou choix manuel) part automatiquement au reste de la cible.

-- Réglages du test (sur la campagne). ab_variants = '' : campagne classique, sans test.
-- Brouillon : JSON [{ "subject": "...", "templateId": 12|null }, …] ; au lancement, chaque version y reçoit son contenu figé (« snapshot »).
ALTER TABLE mk_campaigns ADD COLUMN ab_variants TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_campaigns ADD COLUMN ab_test_percent INTEGER NOT NULL DEFAULT 20;      -- part de la cible qui reçoit le test (10 à 50 %)
ALTER TABLE mk_campaigns ADD COLUMN ab_metric TEXT NOT NULL DEFAULT 'clicks';         -- clicks | opens | manual (validé en JS)
ALTER TABLE mk_campaigns ADD COLUMN ab_wait_minutes INTEGER NOT NULL DEFAULT 240;     -- délai entre la fin du test et le choix du gagnant
ALTER TABLE mk_campaigns ADD COLUMN ab_decide_at INTEGER;                             -- moment prévu du choix (fixé à la fin de l'envoi du test)
ALTER TABLE mk_campaigns ADD COLUMN ab_winner INTEGER;                                -- 0 = A, 1 = B, 2 = C ; NULL tant que non choisi
ALTER TABLE mk_campaigns ADD COLUMN ab_decided_by TEXT NOT NULL DEFAULT '';           -- auto | manual

-- Destinataires : version reçue, et « en attente du gagnant » pour le reste de la cible
ALTER TABLE mk_campaign_recipients ADD COLUMN variant INTEGER;
ALTER TABLE mk_campaign_recipients ADD COLUMN held INTEGER NOT NULL DEFAULT 0;
DROP INDEX idx_mk_recipients_queue;
CREATE INDEX idx_mk_recipients_queue ON mk_campaign_recipients(campaign_id, held, status, id);

-- Messages : version envoyée (statistiques par version)
ALTER TABLE mk_messages ADD COLUMN variant INTEGER;
CREATE INDEX idx_mk_messages_variant ON mk_messages(campaign_id, variant);
