-- Assistant de rédaction IA du marketing (point 10 du plan de parité Mailchimp). Journal des demandes : sert au plafond
-- quotidien (maîtrise du coût) et à l'écran de réglages. AUCUN texte n'y est conservé (ni la demande, ni la réponse) :
-- seulement l'action, le résultat et des tailles.
CREATE TABLE mk_ai_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER,
  action TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0 CHECK (ok IN (0, 1)),
  error_code TEXT NOT NULL DEFAULT '',
  input_chars INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_ai_requests_org ON mk_ai_requests(organization_id, created_at);
