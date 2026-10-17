-- Palier 22 — moteur d'A/B testing : le moteur des tests de pages (migration 040) est ÉTENDU, pas remplacé.
-- Ajouts : site de l'expérience, description, objectif commercial (goal_key), niveau de confiance choisi, fenêtre d'attribution,
-- taille d'échantillon minimale, archivage (suppression douce) et raison de fin. Les anciens tests gardent leurs valeurs
-- (confiance 95 % = l'ancien seuil de 5 %).
ALTER TABLE mk_page_tests ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_page_tests ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_page_tests ADD COLUMN goal_key TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_page_tests ADD COLUMN confidence INTEGER NOT NULL DEFAULT 95 CHECK (confidence IN (90, 95, 99));
ALTER TABLE mk_page_tests ADD COLUMN attribution_days INTEGER NOT NULL DEFAULT 7 CHECK (attribution_days BETWEEN 1 AND 30);
ALTER TABLE mk_page_tests ADD COLUMN min_views INTEGER CHECK (min_views IS NULL OR min_views BETWEEN 30 AND 100000);
ALTER TABLE mk_page_tests ADD COLUMN archived_at TEXT;
ALTER TABLE mk_page_tests ADD COLUMN ended_reason TEXT NOT NULL DEFAULT '';
UPDATE mk_page_tests SET site_id = (SELECT p.site_id FROM mk_landing_pages p WHERE p.id = mk_page_tests.page_id);
CREATE INDEX idx_mk_page_tests_site ON mk_page_tests(site_id, organization_id);

-- Un visiteur qui a accepté le suivi garde SA version pendant tout le test (identifiant du cookie kw_vid) ;
-- sans accord, l'empreinte anonyme du jour reste la seule clé (consent = 0).
ALTER TABLE mk_page_test_events ADD COLUMN consent INTEGER NOT NULL DEFAULT 0 CHECK (consent IN (0, 1));
CREATE INDEX idx_mk_page_test_events_visitor ON mk_page_test_events(visitor, test_id);
