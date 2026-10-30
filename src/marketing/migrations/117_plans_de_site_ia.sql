-- Programme 21.3 — Plans de site préparés par l'IA (Brief Analyzer + Site Planner). Migration ADDITIVE : deux tables nouvelles, aucune donnée existante touchée.
--   mk_ai_plans        : un brief analysé et, une fois planifié, son plan (JSON versionné). `site_id` = site visé (NULL = organisation / site principal), toujours posé par le serveur.
--                        `revision` protège contre les modifications concurrentes (mise à jour conditionnelle) ; `status` : draft | pending | validated | modified | to_fix.
--   mk_ai_plan_events  : historique des modifications importantes (action + résumé court, SANS texte du brief).
-- Le texte du brief est conservé pour pouvoir affiner l'analyse avec les réponses de la personne ; aucune purge automatique n'existe encore (voir docs/KOLAKISA_PROGRAMME21_3_REMAINING_ISSUES.md).
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_ai_plan_events ; DROP TABLE mk_ai_plans ; DELETE FROM schema_migrations WHERE version = 116 AND scope = 'marketing'.
CREATE TABLE mk_ai_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated', 'modified', 'to_fix')),
  revision INTEGER NOT NULL DEFAULT 1,
  contract_version INTEGER NOT NULL DEFAULT 1,
  brief_text TEXT NOT NULL,
  answers_json TEXT NOT NULL DEFAULT '[]',
  analysis_json TEXT NOT NULL,
  plan_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  validated_at INTEGER
);
CREATE INDEX idx_mk_ai_plans_org ON mk_ai_plans(organization_id, site_id, updated_at);
CREATE INDEX idx_mk_ai_plans_site ON mk_ai_plans(site_id) WHERE site_id IS NOT NULL;

CREATE TABLE mk_ai_plan_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES mk_ai_plans(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  action TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_plan_events_plan ON mk_ai_plan_events(plan_id, id);
CREATE INDEX idx_mk_ai_plan_events_org ON mk_ai_plan_events(organization_id);
