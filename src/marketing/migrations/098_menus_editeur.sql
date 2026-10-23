-- Apparence → Menus : enregistrement de l'éditeur en un seul bloc, avec contrôle de version. Migration ADDITIVE (colonnes à valeur par défaut, aucune donnée existante modifiée).
-- nav_menus.revision : compteur incrémenté à chaque modification du menu ; un enregistrement fait sur une version périmée est refusé (409) au lieu d'écraser le travail d'un autre.
-- nav_items.css_class / title_attr : classes CSS additionnelles (jetons validés par le serveur) et attribut « title » du lien.
-- Annulation : ALTER TABLE … DROP COLUMN sur ces trois colonnes (aucune autre donnée n'en dépend).
ALTER TABLE nav_menus ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nav_items ADD COLUMN css_class TEXT NOT NULL DEFAULT '';
ALTER TABLE nav_items ADD COLUMN title_attr TEXT NOT NULL DEFAULT '';
