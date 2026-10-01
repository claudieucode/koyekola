-- Marketing 010 — Index des événements par contact.
-- Les segments d'activité (« a terminé une formation », « a acheté », « a dépensé plus de… ») comptent les événements
-- d'un contact : sans cet index, chaque contact déclencherait un parcours de tous les événements de l'organisation.
CREATE INDEX idx_mk_events_contact ON mk_events(organization_id, contact_id, name);
