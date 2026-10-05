-- Campagnes RSS (point 5 de la parité Mailchimp, « RSS-to-email ») : un e-mail « parent » (modèle avec un bloc
-- « Articles ») envoyé selon une fréquence, uniquement s'il y a de nouveaux articles depuis le dernier envoi. Chaque envoi
-- est une campagne ordinaire (« enfant »), avec ses statistiques, ses désinscriptions et son rapport.
CREATE TABLE mk_rss_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  source TEXT NOT NULL DEFAULT 'blog' CHECK (source IN ('blog', 'feed')),  -- blog KOLAKISA, ou flux RSS/Atom externe
  feed_url TEXT NOT NULL DEFAULT '',
  blog_category TEXT NOT NULL DEFAULT '',                                   -- vide = toutes les catégories
  template_id INTEGER NOT NULL REFERENCES mk_templates(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('list', 'segment')),
  target_id INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT '',                                        -- catégorie de préférences (désinscription ciblée)
  track_clicks INTEGER NOT NULL DEFAULT 1,
  track_opens INTEGER NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  days TEXT NOT NULL DEFAULT '[1]',                                         -- jours de la semaine (1 = lundi … 7 = dimanche)
  month_day INTEGER NOT NULL DEFAULT 1 CHECK (month_day BETWEEN 1 AND 28),
  send_time TEXT NOT NULL DEFAULT '09:00',                                  -- heure du fuseau par défaut de l'organisation
  max_items INTEGER NOT NULL DEFAULT 5 CHECK (max_items BETWEEN 1 AND 20),
  next_run_at INTEGER,
  last_run_at INTEGER,
  last_sent_at INTEGER,
  last_result TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
-- Articles déjà envoyés (jamais renvoyés) : identifiant stable (« post:12 » ou guid du flux)
CREATE TABLE mk_rss_seen (
  rss_id INTEGER NOT NULL REFERENCES mk_rss_campaigns(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  campaign_id INTEGER,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (rss_id, item_key)
);
-- Lien campagne « enfant » → campagne RSS (historique des envois)
ALTER TABLE mk_campaigns ADD COLUMN rss_id INTEGER REFERENCES mk_rss_campaigns(id) ON DELETE SET NULL;
CREATE INDEX idx_mk_campaigns_rss ON mk_campaigns(rss_id) WHERE rss_id IS NOT NULL;
