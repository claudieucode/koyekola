-- Marketing 020 — Campagnes SMS (onglet « SMS », comme chez Mailchimp). Tables DISTINCTES des campagnes e-mail :
-- un SMS n'a ni modèle, ni objet, ni ouverture ; il a un texte, un nombre de segments facturés et un coût.
-- Uniquement des tables AJOUTÉES : rien de l'e-mail n'est modifié.

CREATE TABLE mk_sms_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed')),
  -- all = tous les abonnés SMS ; list / segment = abonnés SMS de cette liste / de ce segment (sans clé étrangère,
  -- comme mk_campaigns : supprimer une liste ne casse pas l'historique)
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'list', 'segment')),
  target_id INTEGER,
  body TEXT NOT NULL DEFAULT '',
  track_clicks INTEGER NOT NULL DEFAULT 1 CHECK (track_clicks IN (0, 1)),
  sender TEXT NOT NULL DEFAULT '',          -- figé au lancement
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  undelivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  segments_count INTEGER NOT NULL DEFAULT 0, -- segments facturés réellement envoyés
  click_count INTEGER NOT NULL DEFAULT 0,    -- destinataires ayant cliqué (uniques)
  unsubscribe_count INTEGER NOT NULL DEFAULT 0,
  price_per_segment TEXT NOT NULL DEFAULT '', -- prix saisi dans les réglages, figé au lancement (estimation du coût)
  currency TEXT NOT NULL DEFAULT '',
  scheduled_at INTEGER,
  started_at INTEGER,
  finished_at INTEGER,
  error TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_sms_campaigns_org ON mk_sms_campaigns(organization_id, status, id);

-- Un message par destinataire : à la fois la file d'envoi et le journal (rapport, coût, clics)
CREATE TABLE mk_sms_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_sms_campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL,             -- sans clé étrangère : effacer un contact garde les chiffres de la campagne
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'skipped')),
  reason TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  segments INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  sent_at INTEGER,
  delivered_at INTEGER,
  clicked_at INTEGER,
  unsubscribed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, contact_id)
);
CREATE INDEX idx_mk_sms_messages_queue ON mk_sms_messages(campaign_id, status, next_attempt_at);
CREATE INDEX idx_mk_sms_messages_sent ON mk_sms_messages(organization_id, sent_at);
CREATE UNIQUE INDEX idx_mk_sms_messages_provider ON mk_sms_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Liens de la campagne (détectés dans le texte au lancement)
CREATE TABLE mk_sms_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_sms_campaigns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, url)
);

-- Liens courts « /s/<code> » : un par message et par lien suivi, plus un pour la désinscription (link_id NULL).
-- Le code (8 caractères aléatoires) n'est pas devinable : il n'expose ni le contact ni la campagne.
CREATE TABLE mk_sms_short_links (
  code TEXT PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  message_id INTEGER NOT NULL REFERENCES mk_sms_messages(id) ON DELETE CASCADE,
  link_id INTEGER REFERENCES mk_sms_links(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('link', 'unsubscribe')),
  created_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_mk_sms_short_links_message ON mk_sms_short_links(message_id);

CREATE TABLE mk_sms_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_sms_campaigns(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES mk_sms_messages(id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES mk_sms_links(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_sms_clicks_campaign ON mk_sms_clicks(campaign_id, created_at);
