-- R7 (lot 1) — Contacts par site (décision D2 approuvée le 16/10/2026) : TABLE D'ASSOCIATION contact ↔ site, strictement additive.
-- Modèle approuvé : UN contact par organisation (jamais de doublon par site), associé à un ou plusieurs sites par son site d'origine et par son historique (événements).
--   link = 'origin'   : le site d'origine (mk_contacts.origin_site_id) — seul lien qui donne le droit d'ÉCRITURE à un membre limité à ce site ;
--   link = 'activity' : le contact a un événement dans ce site (lecture seule pour un membre limité à ce site).
-- PAS DE LIGNE = aucun accès pour un membre limité à un site : un contact sans origine ni événement de site (historique du site principal) n'est visible que de l'équipe.
-- Les lignes sont DÉRIVÉES de données existantes (origine, événements) : la reprise ci-dessous n'écrit que dans la nouvelle table, aucune donnée existante n'est modifiée.
-- Ensuite des déclencheurs la tiennent à jour (nouvel événement, changement d'origine, fusion qui déplace des événements). Le journal d'événements reste inchangé.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_csite_*, puis DROP TABLE mk_contact_sites ; aucun contact ni événement n'est modifié.

CREATE TABLE mk_contact_sites (
  contact_id INTEGER NOT NULL REFERENCES mk_contacts(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  link TEXT NOT NULL CHECK (link IN ('origin', 'activity')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (contact_id, site_id)
);
CREATE INDEX idx_mk_contact_sites_site ON mk_contact_sites(site_id, organization_id, link);

-- Garde-fou : le site et le contact appartiennent à la même organisation que la ligne
CREATE TRIGGER trg_mk_csite_insert BEFORE INSERT ON mk_contact_sites
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
  OR (SELECT organization_id FROM mk_contacts WHERE id = NEW.contact_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'contact de site refusé : le contact et le site doivent appartenir à la même organisation'); END;

-- Reprise de l'existant (dérivée) : origine d'abord, puis activité des autres sites
INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link)
SELECT c.id, c.origin_site_id, c.organization_id, 'origin' FROM mk_contacts c JOIN mk_sites s ON s.id = c.origin_site_id AND s.organization_id = c.organization_id
WHERE c.origin_site_id IS NOT NULL;
INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link)
SELECT DISTINCT e.contact_id, e.site_id, e.organization_id, 'activity' FROM mk_events e
JOIN mk_contacts c ON c.id = e.contact_id AND c.organization_id = e.organization_id
JOIN mk_sites s ON s.id = e.site_id AND s.organization_id = e.organization_id
WHERE e.contact_id IS NOT NULL AND e.site_id IS NOT NULL;

-- Tenue à jour : origine posée ou changée
CREATE TRIGGER trg_mk_csite_origin_insert AFTER INSERT ON mk_contacts
WHEN NEW.origin_site_id IS NOT NULL AND EXISTS (SELECT 1 FROM mk_sites WHERE id = NEW.origin_site_id AND organization_id = NEW.organization_id)
BEGIN
  INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (NEW.id, NEW.origin_site_id, NEW.organization_id, 'origin')
  ON CONFLICT (contact_id, site_id) DO UPDATE SET link = 'origin';
END;
CREATE TRIGGER trg_mk_csite_origin_update AFTER UPDATE OF origin_site_id ON mk_contacts
WHEN NEW.origin_site_id IS NOT NULL AND NEW.origin_site_id IS NOT OLD.origin_site_id AND EXISTS (SELECT 1 FROM mk_sites WHERE id = NEW.origin_site_id AND organization_id = NEW.organization_id)
BEGIN
  INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (NEW.id, NEW.origin_site_id, NEW.organization_id, 'origin')
  ON CONFLICT (contact_id, site_id) DO UPDATE SET link = 'origin';
END;

-- Tenue à jour : événement rattaché à un site (nouveau, ou identification / fusion qui change le contact)
CREATE TRIGGER trg_mk_csite_event_insert AFTER INSERT ON mk_events
WHEN NEW.contact_id IS NOT NULL AND NEW.site_id IS NOT NULL AND EXISTS (SELECT 1 FROM mk_contacts WHERE id = NEW.contact_id AND organization_id = NEW.organization_id)
  AND EXISTS (SELECT 1 FROM mk_sites WHERE id = NEW.site_id AND organization_id = NEW.organization_id)
BEGIN
  INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (NEW.contact_id, NEW.site_id, NEW.organization_id, 'activity');
END;
CREATE TRIGGER trg_mk_csite_event_update AFTER UPDATE OF contact_id ON mk_events
WHEN NEW.contact_id IS NOT NULL AND NEW.site_id IS NOT NULL AND NEW.contact_id IS NOT OLD.contact_id AND EXISTS (SELECT 1 FROM mk_contacts WHERE id = NEW.contact_id AND organization_id = NEW.organization_id)
  AND EXISTS (SELECT 1 FROM mk_sites WHERE id = NEW.site_id AND organization_id = NEW.organization_id)
BEGIN
  INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (NEW.contact_id, NEW.site_id, NEW.organization_id, 'activity');
END;
