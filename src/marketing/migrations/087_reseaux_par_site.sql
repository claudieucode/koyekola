-- R7 (lot 6.3) — Réseaux sociaux par site (décision produit du 17/10/2026) : une colonne AJOUTÉE + UNE table NOUVELLE (autorisations de publier), aucune donnée existante modifiée.
--   mk_social_posts.site_id : site auquel appartient la publication (NULL = organisation / site principal : TOUTES les publications existantes, dont le site est inconnu et n'est jamais deviné).
--   mk_social_site_grants   : autorisation EXPLICITE, posée par l'ÉQUIPE, « ce site peut publier sur ce réseau (le compte de l'organisation) ». Une ligne = autorisé ; PAS DE LIGNE = refusé.
-- Les COMPTES (page Facebook, compte Instagram, auteur LinkedIn) et leurs jetons restent des réglages de l'organisation (mk_settings, chiffrés) : un seul compte par réseau, géré par l'équipe, jamais lu par un site.
-- L'activation du module « social » pour un site n'autorise AUCUN compte à elle seule : il faut en plus une autorisation par réseau.
-- Transition : AUCUNE autorisation n'est créée (avant R7-6.3 aucun site ne pouvait publier : ces écrans étaient fermés aux accès limités) ; toutes les publications existantes gardent site_id NULL.
-- Le site d'une publication ne change jamais (déclencheur) ; il doit appartenir à la même organisation. Retirer une autorisation ne supprime aucune publication.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs trg_mk_socp_* et trg_mk_socg_*, l'index idx_mk_social_posts_site, la table mk_social_site_grants, puis la colonne site_id ; les publications et les jetons ne changent pas.

ALTER TABLE mk_social_posts ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
CREATE INDEX idx_mk_social_posts_site ON mk_social_posts(site_id, organization_id, scheduled_at) WHERE site_id IS NOT NULL;

CREATE TRIGGER trg_mk_socp_insert BEFORE INSERT ON mk_social_posts
WHEN NEW.site_id IS NOT NULL AND (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'publication sociale de site refusée : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_socp_site_fixe BEFORE UPDATE OF site_id ON mk_social_posts
WHEN NEW.site_id IS NOT OLD.site_id
BEGIN SELECT RAISE(ABORT, 'publication sociale : le site ne change jamais (créez une nouvelle publication)'); END;

CREATE TABLE mk_social_site_grants (
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  network TEXT NOT NULL CHECK (network IN ('facebook', 'instagram', 'linkedin')),
  granted_by INTEGER,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, network)
);
CREATE INDEX idx_mk_social_site_grants_org ON mk_social_site_grants(organization_id, network);
CREATE TRIGGER trg_mk_socg_insert BEFORE INSERT ON mk_social_site_grants
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'autorisation sociale refusée : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_socg_immutable BEFORE UPDATE ON mk_social_site_grants
BEGIN SELECT RAISE(ABORT, 'autorisation sociale : non modifiable (retirez-la puis recréez-la)'); END;
