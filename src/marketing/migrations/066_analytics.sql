-- Palier 21 — Analytics central. AUCUN second stockage d'événements : le trafic reste dans mk_web_events, le reste dans le journal mk_events.
--  - mk_web_events.site_id : le site de la page vue (page du Site Web rattachée à un site) ; vide = site principal. Permet la portée par site.
--  - doublons : un même événement de visite reçu deux fois (relance du navigateur) ne compte qu'une fois (index UNIQUE, INSERT OR IGNORE à l'écriture).
--  - mk_conversions : conversions personnalisées = un événement DÉJÀ émis (+ un filtre simple) ; aucune collecte nouvelle.
ALTER TABLE mk_web_events ADD COLUMN site_id INTEGER;
UPDATE mk_web_events SET site_id = (SELECT p.site_id FROM mk_landing_pages p WHERE p.id = mk_web_events.page_id) WHERE page_id IS NOT NULL;
DELETE FROM mk_web_events WHERE id NOT IN (SELECT MIN(id) FROM mk_web_events GROUP BY visitor_id, session_id, type, path, target, occurred_at);
CREATE UNIQUE INDEX uq_mk_web_events_dedupe ON mk_web_events(visitor_id, session_id, type, path, target, occurred_at);
CREATE INDEX idx_mk_web_events_site ON mk_web_events(organization_id, site_id, occurred_at);

CREATE TABLE mk_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER REFERENCES mk_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event TEXT NOT NULL,                       -- nom d'un événement du journal (ex. purchase.completed)
  filter_key TEXT NOT NULL DEFAULT '',       -- clé simple des métadonnées (ex. courseId) ; vide = aucun filtre
  filter_value TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_mk_conversions_site ON mk_conversions(site_id);
