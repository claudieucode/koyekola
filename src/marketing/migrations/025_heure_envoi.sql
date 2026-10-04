-- Heure d'envoi (point 4 de la parité Mailchimp) : envoi à l'heure locale de chaque contact (« Timewarp ») et à la
-- meilleure heure de chaque contact d'après son historique réel d'ouvertures et de clics (« Send Time Optimization »).
-- Fuseau horaire IANA du contact (ex. « Africa/Kinshasa ») : capté par les formulaires, saisi ou importé ; vide = inconnu.
ALTER TABLE mk_contacts ADD COLUMN timezone TEXT NOT NULL DEFAULT '';
-- Mode d'envoi choisi au lancement : standard (tout de suite ou à une date), local (même heure dans chaque fuseau),
-- optimized (meilleure heure de chaque contact dans les 24 h du jour choisi). send_plan : réglage retenu, pour le rapport.
ALTER TABLE mk_campaigns ADD COLUMN send_mode TEXT NOT NULL DEFAULT 'standard' CHECK (send_mode IN ('standard', 'local', 'optimized'));
ALTER TABLE mk_campaigns ADD COLUMN send_plan TEXT NOT NULL DEFAULT '{}';
-- Fuseau retenu et origine de l'heure de chaque destinataire (contact, compte, pays, défaut ; historique ou audience)
ALTER TABLE mk_campaign_recipients ADD COLUMN send_tz TEXT;
ALTER TABLE mk_campaign_recipients ADD COLUMN send_basis TEXT;
