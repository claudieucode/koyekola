-- R7 (lot 6.0) — Socle d'ACTIVATION DES MODULES PAR SITE (décision produit du 17/10/2026) : TABLE NOUVELLE, strictement additive, SANS AUCUNE LIGNE.
-- Un module (sms, social, scoring, ai, commerce, lms…) est « activé pour un site » par une ligne enabled = 1, posée explicitement par l'ÉQUIPE de l'organisation.
-- Sémantique : PAS DE LIGNE = module désactivé pour ce site ; le SITE PRINCIPAL n'a pas de ligne et n'est jamais soumis à l'activation (comportement historique inchangé).
-- Désactiver = enabled = 0 : AUCUNE donnée du module n'est supprimée ni modifiée (la ligne et les données du module restent). L'activation n'est PAS une permission : elle s'ajoute aux
-- permissions des utilisateurs et à l'isolation par site, elle ne les remplace jamais.
-- Compatibilité : aujourd'hui aucun accès limité à un site ne peut ouvrir ces six moteurs (écrans d'organisation) : aucun site existant ne perd donc de fonctionnalité en n'ayant aucune ligne.
-- Le nom du module n'est PAS limité par une contrainte de liste (SQLite ne sait pas modifier une contrainte sans reconstruire la table) : la liste fermée est dans src/marketing/siteModules.js.
-- Retour arrière (hors production, après sauvegarde) : supprimer le déclencheur trg_mk_smod_insert puis DROP TABLE mk_site_modules ; aucune donnée d'un moteur n'est touchée.

CREATE TABLE mk_site_modules (
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  module TEXT NOT NULL CHECK (length(module) BETWEEN 2 AND 30 AND module NOT GLOB '*[^a-z_]*'),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (site_id, module)
);
CREATE INDEX idx_mk_site_modules_org ON mk_site_modules(organization_id, module, enabled);

CREATE TRIGGER trg_mk_smod_insert BEFORE INSERT ON mk_site_modules
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'module de site refusé : le site doit appartenir à la même organisation'); END;
CREATE TRIGGER trg_mk_smod_immutable BEFORE UPDATE OF site_id, organization_id, module ON mk_site_modules
WHEN NEW.site_id IS NOT OLD.site_id OR NEW.organization_id IS NOT OLD.organization_id OR NEW.module IS NOT OLD.module
BEGIN SELECT RAISE(ABORT, 'module de site : champ non modifiable'); END;
