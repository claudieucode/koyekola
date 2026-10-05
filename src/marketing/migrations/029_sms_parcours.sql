-- Marketing 029 — SMS dans les parcours (étape « Envoyer un SMS » d'un scénario). Comme l'e-mail (mk_campaigns.kind =
-- 'automation'), chaque étape SMS d'un scénario activé reçoit une campagne SMS SYSTÈME, figée à l'activation : elle
-- porte le texte, l'expéditeur, le prix, les liens suivis et les compteurs du rapport. Elle n'apparaît jamais dans la
-- liste des campagnes SMS (elle n'a ni brouillon, ni lancement, ni annulation : c'est le scénario qui la pilote).
-- Colonnes AJOUTÉES seulement : les campagnes SMS existantes deviennent kind = 'campaign', sans autre changement.

ALTER TABLE mk_sms_campaigns ADD COLUMN kind TEXT NOT NULL DEFAULT 'campaign' CHECK (kind IN ('campaign', 'automation'));
ALTER TABLE mk_sms_campaigns ADD COLUMN automation_id INTEGER;
CREATE INDEX idx_mk_sms_campaigns_automation ON mk_sms_campaigns(automation_id) WHERE automation_id IS NOT NULL;

-- Accord SMS facultatif dans un formulaire d'inscription : texte de la seconde case à cocher (vide = pas de SMS proposé).
-- C'est la PREUVE présentée à la personne (enregistrée telle quelle avec le numéro dans mk_consents, purpose 'sms').
ALTER TABLE mk_forms ADD COLUMN sms_consent_text TEXT NOT NULL DEFAULT '';
