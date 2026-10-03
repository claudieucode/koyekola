-- Marketing 013 — Webhooks sortants (jalon M5, partie 2 des Intégrations) : notifier un système externe des
-- événements KOYEKOLA. Livraisons journalisées dans mk_jobs (type 'webhook.deliver', déjà outillé : reprises,
-- délai croissant, abandon et rejeu manuel) — aucune table dédiée aux livraisons, comme mk_events fait déjà office
-- de journal pour les événements eux-mêmes (décision similaire, voir §14 de EMAIL_MARKETING_ARCHITECTURE.md).

CREATE TABLE mk_webhook_endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,                  -- chiffré (AES-256-GCM), comme les autres secrets du module
  events TEXT NOT NULL DEFAULT '["*"]',  -- tableau JSON de noms d'événements, ou ["*"] pour tous
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_mk_webhook_endpoints_org ON mk_webhook_endpoints(organization_id, enabled);
