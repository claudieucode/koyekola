-- Envoi d'un e-mail de scénario : le message est RÉSERVÉ (claimed_at) juste avant l'appel au fournisseur. Si le serveur s'arrête pendant cet appel,
-- le message reste réservé et n'est jamais renvoyé automatiquement (il est marqué « failed / interrupted » à la reprise), comme pour les SMS et les campagnes.
-- Migration ADDITIVE (une colonne, nulle par défaut ; aucune ligne touchée). Annulation : ALTER TABLE mk_messages DROP COLUMN claimed_at.
ALTER TABLE mk_messages ADD COLUMN claimed_at TEXT;
