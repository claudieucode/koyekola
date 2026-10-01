-- Marketing 008 — Envoi : campagnes, destinataires, messages, événements, liens suivis.
-- Les instants (colonnes *_at de messages/destinataires/événements) sont en millisecondes (comme la file de travaux).
-- Les compteurs de campagne sont incrémentés dans la même transaction que l'événement qui les cause : ils survivent
-- à l'effacement d'un contact (droit à l'effacement) alors que ses lignes détaillées disparaissent en cascade.

CREATE TABLE mk_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  template_id INTEGER,                        -- modèle d'origine (sans clé étrangère : supprimer un modèle ne touche pas l'historique)
  snapshot TEXT NOT NULL DEFAULT '',          -- contenu FIGÉ du modèle au lancement (modifier le modèle ensuite ne change pas l'envoi)
  target_type TEXT NOT NULL CHECK (target_type IN ('list', 'segment')),
  target_id INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT '',          -- catégorie de préférences (les contacts qui l'ont refusée sont exclus)
  track_clicks INTEGER NOT NULL DEFAULT 1 CHECK (track_clicks IN (0, 1)),
  track_opens INTEGER NOT NULL DEFAULT 0 CHECK (track_opens IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed')),
  scheduled_at INTEGER,
  started_at INTEGER,
  finished_at INTEGER,
  error TEXT NOT NULL DEFAULT '',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  complained_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  unique_open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  unique_click_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);

-- Destinataires matérialisés au lancement (la liste de personnes est figée ; la conformité est revérifiée à CHAQUE envoi)
CREATE TABLE mk_campaign_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'skipped', 'failed')),
  reason TEXT NOT NULL DEFAULT '',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, contact_id)
);
CREATE INDEX idx_mk_recipients_queue ON mk_campaign_recipients(campaign_id, status, id);

-- Un message = un envoi à un contact pour une campagne (UNIQUE : jamais deux fois le même message)
CREATE TABLE mk_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  provider_message_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  subject TEXT NOT NULL DEFAULT '',
  sent_at INTEGER,
  delivered_at INTEGER,
  bounced_at INTEGER,
  complained_at INTEGER,
  first_open_at INTEGER,
  first_click_at INTEGER,
  unsubscribed_at INTEGER,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, contact_id)
);
CREATE INDEX idx_mk_messages_provider ON mk_messages(organization_id, provider_message_id) WHERE provider_message_id <> '';
CREATE INDEX idx_mk_messages_sent ON mk_messages(organization_id, sent_at);

-- Événements d'un message (journal ajouté seulement ; dedupe_key rend les webhooks rejoués sans effet)
CREATE TABLE mk_message_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  message_id INTEGER NOT NULL REFERENCES mk_messages(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed')),
  link_id INTEGER,
  detail TEXT NOT NULL DEFAULT '',
  dedupe_key TEXT,
  bot INTEGER NOT NULL DEFAULT 0 CHECK (bot IN (0, 1)),
  occurred_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_mk_message_events_dedupe ON mk_message_events(organization_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_mk_message_events_campaign ON mk_message_events(campaign_id, type);
CREATE TRIGGER mk_message_events_no_update BEFORE UPDATE ON mk_message_events
BEGIN SELECT RAISE(ABORT, 'journal des événements en lecture seule'); END;

-- Liens suivis : l'adresse de destination est lue ICI (jamais dans le lien reçu) : pas de redirection ouverte
CREATE TABLE mk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  campaign_id INTEGER NOT NULL REFERENCES mk_campaigns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  unique_click_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, url)
);
