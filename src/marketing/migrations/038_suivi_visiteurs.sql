-- Suivi des visiteurs du site (Site Web, phase 6) : UNIQUEMENT après accord du visiteur (bandeau de consentement).
-- Un visiteur = un identifiant aléatoire gardé 13 mois au plus dans son navigateur ; jamais d'adresse IP. Quand la
-- personne s'inscrit ou se connecte, ses visites sont reliées à sa fiche contact (parcours) ; elles sont effacées avec
-- le contact, et automatiquement au-delà de 13 mois.
CREATE TABLE mk_web_visitors (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 16 AND 64),
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  contact_id INTEGER REFERENCES mk_contacts(id) ON DELETE CASCADE,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_mk_web_visitors_contact ON mk_web_visitors(contact_id);
CREATE INDEX idx_mk_web_visitors_org ON mk_web_visitors(organization_id, last_seen);

CREATE TABLE mk_web_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  visitor_id TEXT NOT NULL REFERENCES mk_web_visitors(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  contact_id INTEGER REFERENCES mk_contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('session_start', 'page_view', 'button_click', 'section_view', 'form_view', 'form_submit', 'popup_view', 'popup_close', 'video_start', 'download')),
  path TEXT NOT NULL,                          -- chemin de la page (jamais la suite de l'adresse, sauf les paramètres utm)
  page_id INTEGER REFERENCES mk_landing_pages(id) ON DELETE SET NULL,
  target TEXT NOT NULL DEFAULT '',             -- bouton, section, formulaire, fichier… concerné
  referrer TEXT NOT NULL DEFAULT '',           -- site d'origine (nom de domaine seulement)
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '' CHECK (device IN ('', 'mobile', 'tablet', 'desktop')),
  occurred_at INTEGER NOT NULL
);
CREATE INDEX idx_mk_web_events_org ON mk_web_events(organization_id, occurred_at);
CREATE INDEX idx_mk_web_events_visitor ON mk_web_events(visitor_id, occurred_at);
CREATE INDEX idx_mk_web_events_contact ON mk_web_events(contact_id);
CREATE INDEX idx_mk_web_events_page ON mk_web_events(page_id, type);
