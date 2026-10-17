-- R7 (lot 5) — File de demandes de rattachement de contacts entre sites (décision produit du 17/10/2026, option 1) : TABLE NOUVELLE, strictement additive.
-- Principe : un e-mail est unique par organisation. Quand un membre limité à un site « crée » une adresse déjà connue d'un autre site, AUCUNE fiche n'est créée, rien n'est lu ni modifié, la
-- réponse est la même que pour une création ; une demande est mise en file pour l'équipe, qui peut ACCEPTER (rattachement en LECTURE SEULE du site demandeur : lien « activity » dans
-- mk_contact_sites, jamais d'écriture) ou REFUSER. Les adresses nouvelles sont créées tout de suite (pas de demande). La fusion n'est pas dans ce lot.
-- `contact_id` est résolu à la décision et n'est jamais montré au demandeur (qui ne voit que « en attente » ou « traitée »). Une demande traitée ne change plus.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_creq_*, puis DROP TABLE mk_contact_requests ; aucun contact n'est modifié par cette migration.

CREATE TABLE mk_contact_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
  source TEXT NOT NULL CHECK (source IN ('admin', 'api')),
  requested_by INTEGER,
  contact_id INTEGER,
  decided_by INTEGER,
  decided_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Une seule demande EN ATTENTE par (site, adresse) : une demande répétée ne fabrique pas de doublon
CREATE UNIQUE INDEX uq_mk_contact_requests_pending ON mk_contact_requests(organization_id, site_id, email) WHERE status = 'pending';
CREATE INDEX idx_mk_contact_requests_site ON mk_contact_requests(site_id, organization_id, id DESC);
CREATE INDEX idx_mk_contact_requests_status ON mk_contact_requests(organization_id, status, id);

CREATE TRIGGER trg_mk_creq_insert BEFORE INSERT ON mk_contact_requests
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'demande refusée : le site doit appartenir à la même organisation'); END;
-- Une demande traitée est définitive ; l'organisation, le site, l'adresse, la source et le demandeur ne changent jamais
CREATE TRIGGER trg_mk_creq_final BEFORE UPDATE ON mk_contact_requests
WHEN OLD.status <> 'pending'
BEGIN SELECT RAISE(ABORT, 'demande déjà traitée'); END;
CREATE TRIGGER trg_mk_creq_immutable BEFORE UPDATE OF organization_id, site_id, email, source, requested_by, created_at ON mk_contact_requests
WHEN NEW.organization_id IS NOT OLD.organization_id OR NEW.site_id IS NOT OLD.site_id OR NEW.email IS NOT OLD.email OR NEW.source IS NOT OLD.source
  OR NEW.requested_by IS NOT OLD.requested_by OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT, 'demande : champ non modifiable'); END;
