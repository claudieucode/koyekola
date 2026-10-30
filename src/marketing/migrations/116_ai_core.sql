-- Programme 21.2 — Kolakisa AI Core : journal d'utilisation et quotas. Migration ADDITIVE (deux tables, aucune donnée existante touchée).
--   mk_ai_core_usage  : une ligne par requête IA (jamais le texte envoyé ni reçu : seulement fournisseur, modèle, module, tailles, jetons, coût, statut, code d'erreur).
--     counted = 0 : échec connu pour n'avoir rien coûté (clé refusée, limite de débit…) → ne consomme ni quota de requêtes ni quota de coût.
--     tokens_source : provider (donné par l'API) | estimated (estimé par Kolakisa) | unavailable ; cost_kind : confirmed (facture du fournisseur — jamais produit aujourd'hui) | estimated | unknown.
--   mk_ai_core_quotas : plafonds (requêtes et/ou coût estimé) par portée global / organisation / site / utilisateur / module et par période (jour, mois).
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_ai_core_quotas ; DROP TABLE mk_ai_core_usage ; DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '116'.
CREATE TABLE mk_ai_core_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  idempotency_key TEXT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER,
  user_id INTEGER,
  module TEXT NOT NULL,
  task TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  error_code TEXT NOT NULL DEFAULT '',
  input_tokens INTEGER,
  output_tokens INTEGER,
  tokens_source TEXT NOT NULL DEFAULT 'unavailable' CHECK (tokens_source IN ('provider', 'estimated', 'unavailable')),
  cost_micro_usd INTEGER,
  cost_kind TEXT NOT NULL DEFAULT 'unknown' CHECK (cost_kind IN ('confirmed', 'estimated', 'unknown')),
  reserved_micro_usd INTEGER NOT NULL DEFAULT 0,
  counted INTEGER NOT NULL DEFAULT 1 CHECK (counted IN (0, 1)),
  duration_ms INTEGER,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);
CREATE INDEX idx_mk_ai_core_usage_org ON mk_ai_core_usage(organization_id, created_at);
CREATE INDEX idx_mk_ai_core_usage_site ON mk_ai_core_usage(organization_id, site_id, created_at);
CREATE INDEX idx_mk_ai_core_usage_request ON mk_ai_core_usage(request_id);
CREATE UNIQUE INDEX idx_mk_ai_core_usage_idem ON mk_ai_core_usage(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE mk_ai_core_quotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'organization', 'site', 'user', 'module')),
  scope_id TEXT NOT NULL DEFAULT '',
  organization_id INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('day', 'month')),
  max_requests INTEGER CHECK (max_requests IS NULL OR max_requests >= 0),
  max_cost_micro_usd INTEGER CHECK (max_cost_micro_usd IS NULL OR max_cost_micro_usd >= 0),
  updated_by INTEGER,
  updated_at INTEGER NOT NULL,
  UNIQUE (scope, scope_id, organization_id, period)
);
