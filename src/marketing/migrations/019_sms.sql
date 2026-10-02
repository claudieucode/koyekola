-- Marketing 019 — SMS, phase 1 (fondations). Le SMS est un CANAL SÉPARÉ de l'e-mail, comme chez Mailchimp :
-- un consentement SMS distinct, un statut SMS distinct, une liste de suppression par NUMÉRO (pas par adresse e-mail).
-- Uniquement des colonnes et une table AJOUTÉES (rien de modifié ni de supprimé) ; valeurs par défaut = aucun SMS.
-- Sans CHECK sur les colonnes ajoutées (SQLite valide mal les contraintes ajoutées par ALTER TABLE) : validé en JS
-- (sms/consent.js), comme les migrations 015 et 018.

-- none = jamais abonné aux SMS ; subscribed = consentement SMS prouvé ; unsubscribed = a retiré son accord (STOP, lien…)
ALTER TABLE mk_contacts ADD COLUMN sms_status TEXT NOT NULL DEFAULT 'none';
-- Le numéro (format international +243…) qui a DONNÉ son accord : l'accord vaut pour ce numéro, pas pour un autre
-- numéro saisi plus tard dans la fiche (colonne phone, texte libre inchangé).
ALTER TABLE mk_contacts ADD COLUMN sms_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_contacts ADD COLUMN sms_unsubscribed_at TEXT;
CREATE INDEX idx_mk_contacts_sms ON mk_contacts(organization_id, sms_status);
CREATE INDEX idx_mk_contacts_sms_phone ON mk_contacts(organization_id, sms_phone) WHERE sms_phone <> '';

-- La preuve d'un consentement SMS garde le numéro concerné (vide pour les preuves e-mail existantes)
ALTER TABLE mk_consents ADD COLUMN channel_address TEXT NOT NULL DEFAULT '';

-- Numéros qui ne reçoivent JAMAIS de SMS marketing. Liée au numéro, pas au contact : effacer puis recréer un contact
-- ne rend pas son numéro joignable.
--   stop = la personne a répondu STOP ; invalid = numéro refusé par l'opérateur ; manual = blocage par l'équipe
CREATE TABLE mk_sms_suppressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  phone TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('stop', 'invalid', 'manual')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, phone)
);
