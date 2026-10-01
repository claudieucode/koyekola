-- Marketing 011 — Catégorie des modèles d'e-mails (bibliothèque : « Bienvenue », « Promotion »…).
-- Simple étiquette de rangement : vide = sans catégorie. La liste des catégories est celle de templates/categories.js
-- (validée à l'enregistrement) ; elle n'a aucun effet sur le contenu ni sur l'envoi.
ALTER TABLE mk_templates ADD COLUMN category TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_mk_templates_category ON mk_templates(organization_id, category);
