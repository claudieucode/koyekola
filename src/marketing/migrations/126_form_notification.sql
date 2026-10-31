-- Parité Elementor (lot 3) : e-mail de notification à l'équipe à chaque envoi d'un formulaire (vide = aucune notification).
ALTER TABLE mk_forms ADD COLUMN notify_email TEXT NOT NULL DEFAULT '';
