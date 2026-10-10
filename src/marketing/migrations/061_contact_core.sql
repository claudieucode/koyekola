-- Marketing 061 — Contact Core (palier 15) : cycle de vie, état technique, site d'origine, doublons/fusion, journal d'événements.
-- AJOUTS UNIQUEMENT : aucune colonne ni donnée existante n'est modifiée ou supprimée.
--   - mk_contacts.status reste l'état d'ABONNEMENT marketing (unknown/subscribed/…), piloté par la conformité ;
--   - lifecycle_stage = l'état MÉTIER (lead, customer…) ; record_status = l'état TECHNIQUE de la fiche (active/inactive/archived/merged).

ALTER TABLE mk_contacts ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'contact';
ALTER TABLE mk_contacts ADD COLUMN record_status TEXT NOT NULL DEFAULT 'active' CHECK (record_status IN ('active', 'inactive', 'archived', 'merged'));
ALTER TABLE mk_contacts ADD COLUMN archived_at TEXT;
ALTER TABLE mk_contacts ADD COLUMN merged_into_id INTEGER REFERENCES mk_contacts(id);
ALTER TABLE mk_contacts ADD COLUMN origin_site_id INTEGER REFERENCES mk_sites(id);   -- site où le contact est apparu (NULL = site principal / organisation)
ALTER TABLE mk_contacts ADD COLUMN source_detail TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_contacts ADD COLUMN job_title TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_contacts ADD COLUMN normalized_phone TEXT NOT NULL DEFAULT '';        -- E.164 quand le numéro peut être normalisé, sinon vide
CREATE INDEX idx_mk_contacts_record ON mk_contacts(organization_id, record_status, id);
CREATE INDEX idx_mk_contacts_lifecycle ON mk_contacts(organization_id, lifecycle_stage);
CREATE INDEX idx_mk_contacts_origin_site ON mk_contacts(organization_id, origin_site_id) WHERE origin_site_id IS NOT NULL;
CREATE INDEX idx_mk_contacts_phone ON mk_contacts(organization_id, normalized_phone) WHERE normalized_phone <> '';
CREATE INDEX idx_mk_contacts_merged_into ON mk_contacts(merged_into_id) WHERE merged_into_id IS NOT NULL;
CREATE INDEX idx_mk_contacts_site_fk ON mk_contacts(origin_site_id) WHERE origin_site_id IS NOT NULL;
CREATE INDEX idx_mk_contacts_activity ON mk_contacts(organization_id, last_activity_at);

-- Autres adresses d'un même contact (reprises lors d'une fusion) : une adresse alias retrouve toujours la fiche maître.
CREATE TABLE mk_contact_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'merge',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, email)
);
CREATE INDEX idx_mk_contact_aliases_contact ON mk_contact_aliases(contact_id);

-- Journal des fusions : instantané de la fiche absorbée (pour comprendre, ne rien perdre). La fiche absorbée n'est JAMAIS supprimée.
CREATE TABLE mk_contact_merges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  master_id INTEGER NOT NULL REFERENCES mk_contacts(id),
  source_id INTEGER NOT NULL REFERENCES mk_contacts(id),
  merged_by INTEGER,
  snapshot TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_contact_merges_master ON mk_contact_merges(master_id);
CREATE INDEX idx_mk_contact_merges_source ON mk_contact_merges(source_id);

-- Journal d'événements : site, objet concerné, auteur. Les événements existants gardent NULL (rien n'est réécrit).
ALTER TABLE mk_events ADD COLUMN site_id INTEGER;
ALTER TABLE mk_events ADD COLUMN object_type TEXT;
ALTER TABLE mk_events ADD COLUMN object_id TEXT;
ALTER TABLE mk_events ADD COLUMN actor_user_id INTEGER;
CREATE INDEX idx_mk_events_contact_ledger ON mk_events(organization_id, contact_id, id DESC) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_mk_events_site_ledger ON mk_events(organization_id, site_id, id DESC) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mk_events_object_ledger ON mk_events(organization_id, object_type, object_id) WHERE object_type IS NOT NULL;

-- Un événement est un fait historique : ni son type, ni sa date, ni sa source, ni son site, ni son objet ne changent.
-- Restent modifiables : contact_id (identification d'un anonyme, fusion), email/metadata (effacement des données personnelles) et processed_at (distribution).
CREATE TRIGGER mk_events_ledger_facts BEFORE UPDATE OF organization_id, name, source, occurred_at, site_id, object_type, object_id, actor_user_id, created_at, idempotency_key ON mk_events
WHEN NEW.organization_id IS NOT OLD.organization_id OR NEW.name IS NOT OLD.name OR NEW.source IS NOT OLD.source OR NEW.occurred_at IS NOT OLD.occurred_at
  OR NEW.site_id IS NOT OLD.site_id OR NEW.object_type IS NOT OLD.object_type OR NEW.object_id IS NOT OLD.object_id OR NEW.actor_user_id IS NOT OLD.actor_user_id
  OR NEW.created_at IS NOT OLD.created_at OR NEW.idempotency_key IS NOT OLD.idempotency_key
BEGIN SELECT RAISE(ABORT, 'un événement est un fait historique : il ne se modifie pas'); END;

-- Propriétés : formats supplémentaires (texte au format URL / e-mail / téléphone) et choix multiple (valeurs JSON dans value_text).
ALTER TABLE mk_property_defs ADD COLUMN format TEXT NOT NULL DEFAULT '' CHECK (format IN ('', 'url', 'email', 'phone'));
ALTER TABLE mk_property_defs ADD COLUMN multiple INTEGER NOT NULL DEFAULT 0 CHECK (multiple IN (0, 1));

-- Nouveaux droits du Contact Core : les rôles personnalisés existants gardent EXACTEMENT ce qu'ils pouvaient déjà faire
-- (voir les contacts → voir le journal et les données de contact ; modifier les contacts → archiver et gérer les champs).
-- Fusionner reste réservé aux administrateurs : aucun rôle personnalisé ne l'obtient d'office.
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'events.view')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.read') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'events.view');
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'contacts.view_sensitive')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.read') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.view_sensitive');
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'contacts.archive')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.write') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.archive');
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'contacts.manage_fields')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.write') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'contacts.manage_fields');
