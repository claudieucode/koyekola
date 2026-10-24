-- Outils → Effacer les données : demandes d'effacement de données personnelles et suivi de leur traitement. Migration ADDITIVE :
-- deux nouvelles tables, aucune table existante n'est modifiée ; aucune donnée n'est lue ni effacée par cette migration.
-- Annulation : DROP TABLE mk_erasure_tasks ; DROP TABLE mk_erasure_requests (ne perd que l'historique des demandes, jamais les données du site).
--
-- Une demande appartient à UN site (site_id NULL = site principal / organisation). L'adresse e-mail de la personne n'est gardée que le temps
-- de la demande : à la fin du traitement elle est remplacée par une empreinte (subject_hash) et une forme masquée (subject_label).
-- Le jeton de confirmation n'est jamais stocké en clair (token_hash = SHA-256), à usage unique, avec date d'expiration.

CREATE TABLE IF NOT EXISTS mk_erasure_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  subject_kind TEXT NOT NULL DEFAULT 'email' CHECK (subject_kind IN ('email', 'username')),
  subject_email TEXT,                      -- effacé (NULL) une fois la demande terminée
  subject_user_id INTEGER,                 -- compte reconnu à la création (sans clé étrangère : le compte peut disparaître)
  subject_hash TEXT NOT NULL,              -- HMAC de l'adresse normalisée : retrouver / dédoublonner sans conserver l'adresse
  subject_label TEXT NOT NULL,             -- forme masquée affichée (j***@exemple.fr)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'completed')),
  failure_code TEXT CHECK (failure_code IS NULL OR failure_code IN ('expired', 'mail_failed', 'erase_failed')),
  failure_note TEXT NOT NULL DEFAULT '',
  send_email INTEGER NOT NULL DEFAULT 1,
  confirmed_by TEXT CHECK (confirmed_by IS NULL OR confirmed_by IN ('email', 'admin', 'force')),
  token_hash TEXT,
  token_expires_at TEXT,
  token_used_at TEXT,
  mail_id INTEGER,                         -- e-mail de confirmation dans la file d'envoi (mail_outbox.id), pour en lire l'état réel
  send_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TEXT,
  options TEXT NOT NULL DEFAULT '{}',      -- choix de l'administrateur au lancement (ex. commentaires : anonymiser ou supprimer)
  requested_by INTEGER,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  lock_until TEXT,                         -- verrou de traitement (jamais deux traitements simultanés de la même demande)
  summary TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_mk_erasure_requests_scope ON mk_erasure_requests (organization_id, site_id, status, requested_at);
CREATE INDEX IF NOT EXISTS idx_mk_erasure_requests_subject ON mk_erasure_requests (organization_id, site_id, subject_hash, status);
CREATE INDEX IF NOT EXISTS idx_mk_erasure_requests_site_fk ON mk_erasure_requests (site_id) WHERE site_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS mk_erasure_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES mk_erasure_requests(id) ON DELETE CASCADE,
  eraser_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  erased INTEGER NOT NULL DEFAULT 0,
  anonymized INTEGER NOT NULL DEFAULT 0,
  batches INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  cursor TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '{}',      -- conservé / action manuelle, avec la raison (JSON)
  error TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (request_id, eraser_id)
);
