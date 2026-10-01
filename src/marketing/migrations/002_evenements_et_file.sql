-- Marketing 002 — Bus d'événements et file de travaux.
-- Les instants sont des millisecondes (entiers) : comparaisons simples et tests indépendants de l'horloge.

-- File de travaux : tout ce qui est long ou peut échouer (envois, distribution d'événements, webhooks) passe par ici,
-- jamais dans une requête HTTP. Un travail est réservé par un worker avec un « bail » ; s'il plante, le bail expire
-- et un autre worker le reprend.
--   state : pending (à faire) → running (réservé) → done (terminé) | dead (abandonné : tentatives épuisées ou erreur définitive)
--   priority : 1 = urgent (transactionnel) … 9 = très bas
--   idempotency_key : une même clé ne crée jamais deux travaux (protection contre le double envoi)
CREATE TABLE mk_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER REFERENCES mk_organizations(id),
  type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'running', 'done', 'dead')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 9),
  run_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  locked_by TEXT,
  locked_until INTEGER,
  last_error TEXT,
  idempotency_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  finished_at INTEGER
);
CREATE UNIQUE INDEX uq_mk_jobs_idempotency ON mk_jobs(COALESCE(organization_id, 0), idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_mk_jobs_ready ON mk_jobs(state, run_at, priority, id);
CREATE INDEX idx_mk_jobs_org_state ON mk_jobs(organization_id, state);

-- Événements : « course_purchased », « user_registered »… reçus du LMS, de l'API ou des formulaires.
-- processed_at reste vide tant que l'événement n'a pas été distribué à tous ses gestionnaires.
CREATE TABLE mk_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  contact_id INTEGER,
  source TEXT NOT NULL DEFAULT 'api',
  occurred_at INTEGER NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  idempotency_key TEXT,
  processed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_mk_events_idempotency ON mk_events(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_mk_events_name ON mk_events(organization_id, name, id DESC);
CREATE INDEX idx_mk_events_email ON mk_events(organization_id, email, id DESC);
CREATE INDEX idx_mk_events_pending ON mk_events(processed_at) WHERE processed_at IS NULL;
