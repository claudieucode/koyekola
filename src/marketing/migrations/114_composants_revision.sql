-- Composants réutilisables : numéro de révision (même garantie que les pages, palier 7).
-- Chaque enregistrement du contenu de travail (ou abandon / mise à jour) le fait avancer ; un enregistrement ou une mise à jour fait avec un numéro
-- périmé (autre onglet, autre personne) est refusé au lieu d'écraser en silence. Ajout seul : rien n'est modifié dans les données existantes.
ALTER TABLE mk_web_components ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
