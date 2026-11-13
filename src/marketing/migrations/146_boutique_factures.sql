-- Boutique : identité du vendeur (pour les factures) et factures / avoirs numérotés. Migration ADDITIVE : aucune table existante n'est modifiée.
-- Une facture est IMMUTABLE : son contenu est un instantané (vendeur, acheteur, lignes, taxes) pris à l'émission ; modifier les réglages ensuite ne change pas les factures émises.
-- Numérotation continue et sans trou par site et par type (facture / avoir) : l'attribution se fait en transaction (MAX(seq)+1) et l'index unique interdit tout doublon.
CREATE TABLE mk_shop_company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  legal_name TEXT,
  address TEXT,
  vat_number TEXT,
  registration_number TEXT,
  email TEXT,
  phone TEXT,
  invoice_prefix TEXT,
  footer TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_company_scope ON mk_shop_company(organization_id, COALESCE(site_id, 0));

CREATE TABLE mk_shop_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  order_id INTEGER NOT NULL REFERENCES mk_shop_orders(id) ON DELETE CASCADE,
  refund_id INTEGER,                                          -- avoir : le remboursement concerné (NULL pour une facture)
  kind TEXT NOT NULL CHECK (kind IN ('invoice', 'credit_note')),
  seq INTEGER NOT NULL,
  number TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_mk_shop_invoices_seq ON mk_shop_invoices(organization_id, COALESCE(site_id, 0), kind, seq);
CREATE UNIQUE INDEX idx_mk_shop_invoices_number ON mk_shop_invoices(organization_id, COALESCE(site_id, 0), number);
CREATE UNIQUE INDEX idx_mk_shop_invoices_order ON mk_shop_invoices(order_id) WHERE kind = 'invoice';
CREATE UNIQUE INDEX idx_mk_shop_invoices_refund ON mk_shop_invoices(refund_id) WHERE refund_id IS NOT NULL;
