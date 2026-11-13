-- Boutique : remboursements réels (totaux ou partiels), avec ou sans remise en stock. Migration ADDITIVE : aucune table existante n'est modifiée.
-- Le statut de paiement de la commande n'est pas élargi (contrainte CHECK existante) : un remboursement partiel se lit dans cette table.
-- status : pending (réservé, appel au fournisseur en cours) | succeeded | failed. La somme des lignes pending + succeeded ne peut jamais dépasser le total de la commande (vérifié en transaction).
CREATE TABLE mk_shop_refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL,
  reason TEXT,
  restock INTEGER NOT NULL DEFAULT 0,
  items TEXT NOT NULL DEFAULT '[]',                         -- [{ order_item_id, quantity }]
  provider TEXT NOT NULL,                                   -- stripe | manual
  provider_ref TEXT,                                        -- identifiant du remboursement chez le fournisseur
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  failure_reason TEXT,
  idempotency_key TEXT NOT NULL,
  actor TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_refunds_idem ON mk_shop_refunds(order_id, idempotency_key);
CREATE INDEX idx_mk_shop_refunds_order ON mk_shop_refunds(order_id);
CREATE INDEX idx_mk_shop_refunds_scope ON mk_shop_refunds(organization_id, site_id, created_at);
