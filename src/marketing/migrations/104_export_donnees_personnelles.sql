-- Marketing 104 — Outils → Exporter les données personnelles : demandes d'export (par site), strictement additive.
-- Une demande appartient à UN site (site_id vide = site principal) et à UNE organisation. Les jetons (confirmation, téléchargement) ne sont JAMAIS
-- conservés : seule leur empreinte SHA-256 l'est. L'archive ZIP est rangée hors du dossier public ; seule la référence (nom imprévisible) est ici.
-- Le contenu de l'export n'est jamais copié dans cette table : report ne garde que des compteurs par catégorie.
-- Retour arrière (hors production, après sauvegarde) : DROP TABLE cms_privacy_requests ; aucune autre table n'est touchée.

CREATE TABLE cms_privacy_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id),
  kind TEXT NOT NULL DEFAULT 'export' CHECK (kind IN ('export')),
  subject_email TEXT NOT NULL,                 -- adresse VÉRIFIÉE (celle saisie, ou celle du compte retrouvé par son identifiant) ; seule destinataire de l'e-mail
  subject_user_id INTEGER,                     -- compte de la plateforme retrouvé (jamais deviné par un nom ressemblant)
  input_kind TEXT NOT NULL DEFAULT 'email' CHECK (input_kind IN ('email', 'username')),
  requested_by INTEGER,
  status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed', 'running', 'ready', 'sent', 'expired', 'failed', 'no_data')),
  confirm_mode TEXT NOT NULL DEFAULT 'email' CHECK (confirm_mode IN ('email', 'admin')),
  confirm_token_hash TEXT,
  confirm_expires_at TEXT,
  confirmed_at TEXT,
  confirmed_by INTEGER,                        -- administrateur ayant confirmé directement (mode « admin »)
  confirm_mail_id INTEGER,                     -- ligne de la file d'envoi (mail_outbox) : l'état réel de l'e-mail est relu de là
  archive_file TEXT,                           -- nom imprévisible (hexadécimal aléatoire) dans le dossier privé ; jamais exposé tel quel
  archive_sha256 TEXT,
  archive_bytes INTEGER,
  archive_expires_at TEXT,
  generated_at TEXT,
  download_token_hash TEXT,
  download_expires_at TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  delivery_mail_id INTEGER,
  delivered_at TEXT,
  delivery_error TEXT NOT NULL DEFAULT '',
  report TEXT NOT NULL DEFAULT '{}',           -- JSON : résultat par collecteur (compteurs seulement, aucune donnée personnelle)
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_cms_privacy_requests_site ON cms_privacy_requests(organization_id, site_id, id DESC);
CREATE INDEX idx_cms_privacy_requests_status ON cms_privacy_requests(status, archive_expires_at);
CREATE UNIQUE INDEX uq_cms_privacy_requests_confirm ON cms_privacy_requests(confirm_token_hash) WHERE confirm_token_hash IS NOT NULL;
CREATE UNIQUE INDEX uq_cms_privacy_requests_download ON cms_privacy_requests(download_token_hash) WHERE download_token_hash IS NOT NULL;
