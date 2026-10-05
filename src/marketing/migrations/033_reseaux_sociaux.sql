-- Réseaux sociaux (point 12 du plan de parité Mailchimp).
-- 1. Version web d'une campagne envoyée (lien « voir dans le navigateur » et partage) : adresse signée, sans données
--    personnelles ; elle peut être désactivée campagne par campagne.
ALTER TABLE mk_campaigns ADD COLUMN web_disabled INTEGER NOT NULL DEFAULT 0 CHECK (web_disabled IN (0, 1));

-- 2. Publications sur les réseaux : une ligne par réseau (une publication écrite pour 3 réseaux = 3 lignes d'un même
--    groupe). Le lien éventuel passe par un lien court suivi (/go/<code>) : les clics sont comptés ici, réellement.
CREATE TABLE mk_social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  group_key TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('facebook', 'instagram', 'linkedin')),
  body TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  campaign_id INTEGER,                         -- campagne partagée (sans clé étrangère : l'historique reste)
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_at INTEGER NOT NULL,
  published_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  external_id TEXT NOT NULL DEFAULT '',
  external_url TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  link_code TEXT UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_social_posts_org ON mk_social_posts(organization_id, scheduled_at);
