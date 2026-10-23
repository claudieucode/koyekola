-- Utilisateurs → Invitations : suivi réel de l'envoi et personnalisation. Migration ADDITIVE (aucune donnée modifiée ; toutes les invitations existantes gardent leur état).
--   invited_name : nom de la personne invitée (facultatif, affiché dans l'e-mail et la liste) ;
--   message      : mot personnel de l'inviteur (facultatif, 500 caractères) ;
--   mail_id      : ligne de la file d'envoi (mail_outbox) du DERNIER e-mail : son état (en file, envoyé, échec) est celui que la liste affiche — jamais un état supposé ;
--   send_error   : motif quand l'e-mail n'a même pas pu être mis en file (adresse invalide…) ;
--   send_count / last_sent_at : limites de renvoi (délai minimal entre deux envois, nombre maximal).
-- Retour arrière : ALTER TABLE mk_invitations DROP COLUMN <colonne> pour chacune.
ALTER TABLE mk_invitations ADD COLUMN invited_name TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_invitations ADD COLUMN message TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_invitations ADD COLUMN mail_id INTEGER;
ALTER TABLE mk_invitations ADD COLUMN send_error TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_invitations ADD COLUMN send_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mk_invitations ADD COLUMN last_sent_at TEXT;
