-- Marketing 065 — Orchestration Tunnel ↔ Contact Core ↔ Automation ↔ Email (palier 19). AJOUTS UNIQUEMENT.
--  - mk_automations.goal_event : « objectif » d'un scénario (ex. purchase.completed). Quand le contact atteint l'objectif, son passage en cours SE TERMINE
--    (aucun autre e-mail ne part). Vide = pas d'objectif (comportement inchangé).
--  - index sur le tunnel porté par les événements funnel.* (diagnostic, contact → tunnels, détection des abandons).
ALTER TABLE mk_automations ADD COLUMN goal_event TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_mk_events_funnel_ref ON mk_events(organization_id, json_extract(metadata, '$.funnelId'), name, contact_id) WHERE name LIKE 'funnel.%';
