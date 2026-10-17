-- R3 — Plafond de droits par site (anomalie A-06 de l'audit des sites, décision DR-04 option B).
-- Jusqu'ici les droits d'une personne sur un site sont l'UNION de son rôle d'équipe et de son rôle sur ce site : un rôle de site ne peut qu'ajouter des droits.
-- Cette colonne ajoute, pour chaque affectation de site, un mode :
--   'add'   (valeur par défaut) : comportement historique — les droits du rôle de site s'ajoutent à ceux du rôle d'équipe ;
--   'limit' : plafond — sur CE site, les droits sont ceux que le rôle d'équipe ET le rôle de site accordent à la fois (intersection) ; jamais plus que l'un ou l'autre.
-- Additif et NEUTRE : toutes les affectations existantes reçoivent 'add', donc exactement les mêmes droits qu'avant ; aucune ligne n'est réécrite à la main, aucun droit n'est retiré ni accordé.
-- Le mode ne s'applique qu'au site de la ligne ; il ne change rien aux autres sites ni aux écrans de l'organisation.
-- Retour arrière (hors production, après sauvegarde) : ALTER TABLE mk_site_members DROP COLUMN mode ; une migration appliquée ne se retire jamais d'un historique : ce retour est un nouveau travail.
ALTER TABLE mk_site_members ADD COLUMN mode TEXT NOT NULL DEFAULT 'add' CHECK (mode IN ('add', 'limit'));
