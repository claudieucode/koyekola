-- Formulaires étendus (Site Web, phase 5) : réglages par champ, fichier joint, règles de pop-up combinées.
-- Rien n'est recopié : les colonnes s'ajoutent aux formulaires existants, qui restent valables tels quels.

-- Réglages par champ (JSON) : { "<champ>": { required, display: "radio" | "textarea", showIf: { field, op, value } } }
-- <champ> = clé d'un champ standard (first_name…) ou nom d'une propriété (prop_<clé>). Vide = comportement d'avant.
ALTER TABLE mk_forms ADD COLUMN field_settings TEXT NOT NULL DEFAULT '{}';
-- Fichier joint (JSON) : { enabled, label, required, accept: "images" | "pdf" | "both" } ; vide = pas de fichier
ALTER TABLE mk_forms ADD COLUMN file_field TEXT NOT NULL DEFAULT '{}';
-- Règles d'affichage du pop-up (JSON), toutes combinées par « ET » : pages, appareils, visiteurs, sources… (phase 5b)
ALTER TABLE mk_forms ADD COLUMN popup_rules TEXT NOT NULL DEFAULT '{}';

-- Fichiers envoyés par les formulaires : stockés hors des dossiers publics (uploads/forms/…), lisibles uniquement par
-- l'équipe depuis la fiche du contact. Le contact supprimé emporte ses fichiers (cascade, puis effacement du disque).
CREATE TABLE mk_form_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  form_id INTEGER REFERENCES mk_forms(id) ON DELETE SET NULL,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_form_files_contact ON mk_form_files(contact_id);
CREATE INDEX idx_mk_form_files_form ON mk_form_files(form_id);
