-- Boutique : identifiants de passerelles de paiement PAR SITE (chiffrés AES-256-GCM, jamais affichés après saisie). Migration ADDITIVE.
-- provider : stripe (clés propres au site, sinon clés du serveur) | paypal | flutterwave (Mobile Money, cartes). Aucune donnée de carte n'est jamais stockée.
CREATE TABLE mk_shop_gateways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  provider TEXT NOT NULL,
  creds TEXT NOT NULL,                                       -- JSON chiffré : { secret_key, webhook_secret, … }
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('test', 'live')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_gateways_scope ON mk_shop_gateways(organization_id, COALESCE(site_id, 0), provider);
