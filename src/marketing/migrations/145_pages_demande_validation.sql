-- Demande de validation d'une page : une personne qui ne peut pas publier (contributeur, designer…) demande à un éditeur de relire et publier.
-- Migration ADDITIVE : aucune table existante n'est modifiée. Une seule demande en cours par page ; publier la page, ou l'annuler, la retire.
CREATE TABLE mk_page_reviews (
  page_id INTEGER PRIMARY KEY REFERENCES mk_landing_pages(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL,
  requested_by INTEGER,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_mk_page_reviews_org ON mk_page_reviews(organization_id, requested_at);
