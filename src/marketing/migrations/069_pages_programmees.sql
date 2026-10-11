-- Palier 23 — programmation de la publication d'une page (comme pour les articles).
-- scheduled_at : date de mise en ligne prévue, en UTC (AAAA-MM-JJ HH:MM:SS). Vide = aucune programmation. Additif : aucune ligne existante n'est modifiée.
ALTER TABLE mk_landing_pages ADD COLUMN scheduled_at TEXT;
CREATE INDEX idx_mk_landing_pages_scheduled ON mk_landing_pages(scheduled_at) WHERE scheduled_at IS NOT NULL;
