-- Marketing 018 — Formulaires, suite : propriétés personnalisées demandées en plus des champs standard, étiquettes
-- posées à chaque inscription, redirection après inscription. Uniquement des colonnes AJOUTÉES (rien de modifié ni de
-- supprimé) ; valeurs par défaut = comportement d'avant (aucune propriété, aucune étiquette, page de remerciement).
-- Sans CHECK (SQLite valide mal les contraintes ajoutées après coup sur ALTER TABLE) : validé en JS (forms/index.js),
-- comme les pop-ups (015) avant elle.
ALTER TABLE mk_forms ADD COLUMN property_fields TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mk_forms ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mk_forms ADD COLUMN redirect_url TEXT;
