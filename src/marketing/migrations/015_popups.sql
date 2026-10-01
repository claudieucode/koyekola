-- Marketing 015 — Pop-ups (jalon M5 — Capture, partie 2) : un formulaire existant (§24) peut EN PLUS s'afficher en
-- superposition sur le site, selon un déclencheur. Aucune nouvelle table : ce sont des réglages d'affichage d'un
-- formulaire, pas un objet différent (mêmes champs, même texte de consentement, même adresse /f/:slug en repli).
-- Pas de CHECK ici : SQLite valide mal les contraintes ajoutées après coup sur des lignes existantes ; la validation
-- se fait dans src/marketing/forms/index.js, comme pour tous les autres champs de ce module.
ALTER TABLE mk_forms ADD COLUMN popup_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mk_forms ADD COLUMN popup_trigger TEXT NOT NULL DEFAULT 'delay';
ALTER TABLE mk_forms ADD COLUMN popup_trigger_value INTEGER NOT NULL DEFAULT 8;
ALTER TABLE mk_forms ADD COLUMN popup_frequency_days INTEGER NOT NULL DEFAULT 7;
