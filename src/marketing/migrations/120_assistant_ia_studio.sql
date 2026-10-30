-- Programme 21.8 — Interface « Assistant IA » de création de site : annuler/rétablir et conversation. Migration ADDITIVE (deux tables, aucune donnée existante touchée).
--   mk_ai_builder_states   : copies du plan AVANT chaque modification faite depuis l'interface (pile « undo ») et après un « Annuler » (pile « redo ») : de quoi annuler et rétablir.
--   mk_ai_builder_messages : conversation avec l'assistant et propositions de modification (acceptées, refusées ou annulées). Le texte écrit par la personne est conservé ;
--                            jamais de clé ni de réponse brute d'un fournisseur. Rattachées à un plan (donc à son site) : l'accès passe toujours par le plan, filtré par organisation et par site.
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE mk_ai_builder_messages ; DROP TABLE mk_ai_builder_states ; DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '120'.
CREATE TABLE mk_ai_builder_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES mk_ai_plans(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  stack TEXT NOT NULL CHECK (stack IN ('undo', 'redo')),
  plan_json TEXT NOT NULL,
  status TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_builder_states_plan ON mk_ai_builder_states(plan_id, stack, id);

CREATE TABLE mk_ai_builder_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES mk_ai_plans(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  kind TEXT NOT NULL DEFAULT 'info' CHECK (kind IN ('info', 'advice', 'proposal')),
  text TEXT NOT NULL,
  proposal TEXT,
  decision TEXT NOT NULL DEFAULT '' CHECK (decision IN ('', 'accepted', 'refused', 'undone')),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_builder_messages_plan ON mk_ai_builder_messages(plan_id, id);
