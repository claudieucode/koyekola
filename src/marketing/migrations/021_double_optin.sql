-- Marketing 021 — Double confirmation (double opt-in) des formulaires d'inscription : la personne reçoit un e-mail
-- « Confirmez votre inscription » et n'est abonnée qu'après avoir cliqué. Colonnes et table AJOUTÉES uniquement.
-- Les formulaires existants gardent leur comportement (0 = inscription immédiate) ; les nouveaux l'activent (forms/index.js).
ALTER TABLE mk_forms ADD COLUMN double_optin INTEGER NOT NULL DEFAULT 0;

-- Inscriptions en attente de confirmation. Seule l'empreinte (SHA-256) du lien est conservée ; valable 7 jours.
-- payload : ce qui sera appliqué À LA CONFIRMATION (propriétés saisies), jamais avant.
CREATE TABLE mk_pending_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  form_id INTEGER NOT NULL REFERENCES mk_forms(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  consent_text TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  payload TEXT NOT NULL DEFAULT '{}',
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_pending_confirmations_contact ON mk_pending_confirmations(contact_id);
