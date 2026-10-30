-- Intégration Mailchimp (API Marketing v3) : miroirs en lecture, correspondances, journaux. AJOUTS UNIQUEMENT (aucune table existante modifiée).
-- Une connexion par ORGANISATION (clé d'API chiffrée dans mk_settings, jamais ici). Mailchimp ne remplace pas le moteur interne : consentements et suppressions restent régis par Kolakisa.
--   mk_mc_audiences : miroir des audiences Mailchimp (+ correspondance facultative avec une liste Kolakisa : local_list_id)
--   mk_mc_members   : correspondance contact ↔ membre d'une audience (statut Mailchimp connu, dernière synchronisation)
--   mk_mc_campaigns : miroir des campagnes (statut, envoi, chiffres du rapport) pour le tableau de bord sans appel réseau
--   mk_mc_events    : webhooks reçus (charge complète, état du traitement, rejeux) ; dedupe_key rend le traitement idempotent
--   mk_mc_requests  : journal des appels sortants (sans secret, sans corps, adresse du membre masquée)
--   mk_mc_state     : état de la dernière synchronisation
-- Retour arrière : DROP TABLE de ces six tables (les réglages « mailchimp.% » de mk_settings sont à supprimer à part).
CREATE TABLE IF NOT EXISTS mk_mc_audiences (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  remote_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  member_count INTEGER NOT NULL DEFAULT 0,
  unsubscribe_count INTEGER NOT NULL DEFAULT 0,
  cleaned_count INTEGER NOT NULL DEFAULT 0,
  open_rate REAL NOT NULL DEFAULT 0,
  click_rate REAL NOT NULL DEFAULT 0,
  local_list_id INTEGER REFERENCES mk_lists(id) ON DELETE SET NULL,
  webhook_remote_id TEXT NOT NULL DEFAULT '',
  stats TEXT NOT NULL DEFAULT '{}',
  members_cursor TEXT NOT NULL DEFAULT '',
  synced_at TEXT,
  PRIMARY KEY (organization_id, remote_id)
);
CREATE INDEX IF NOT EXISTS idx_mk_mc_audiences_list ON mk_mc_audiences(local_list_id) WHERE local_list_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS mk_mc_members (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  audience_remote_id TEXT NOT NULL,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  subscriber_hash TEXT NOT NULL,
  mc_status TEXT NOT NULL DEFAULT '',
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, audience_remote_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_mk_mc_members_hash ON mk_mc_members(organization_id, audience_remote_id, subscriber_hash);
CREATE TABLE IF NOT EXISTS mk_mc_campaigns (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  remote_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  audience_remote_id TEXT NOT NULL DEFAULT '',
  send_time TEXT,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  report TEXT NOT NULL DEFAULT '{}',
  report_synced_at TEXT,
  synced_at TEXT,
  PRIMARY KEY (organization_id, remote_id)
);
CREATE TABLE IF NOT EXISTS mk_mc_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  event_type TEXT NOT NULL,
  audience_remote_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  fired_at TEXT NOT NULL DEFAULT '',
  payload TEXT NOT NULL DEFAULT '{}',
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'applied', 'ignored', 'failed')),
  detail TEXT NOT NULL DEFAULT '',
  replays INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mk_mc_events_dedupe ON mk_mc_events(organization_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_mk_mc_events_recent ON mk_mc_events(organization_id, id DESC);
CREATE TABLE IF NOT EXISTS mk_mc_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  error_code TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mk_mc_requests_recent ON mk_mc_requests(organization_id, id DESC);
CREATE TABLE IF NOT EXISTS mk_mc_state (
  organization_id INTEGER PRIMARY KEY REFERENCES mk_organizations(id),
  last_sync_at TEXT,
  last_sync_status TEXT NOT NULL DEFAULT '',
  last_sync_summary TEXT NOT NULL DEFAULT '{}',
  last_error TEXT NOT NULL DEFAULT '',
  running_since TEXT
);
