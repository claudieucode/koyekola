-- Mode d'identité graphique d'un modèle du Theme Builder (Fiche produit) : own (indépendante), site (héritée), hybrid (marque du site). NULL = indépendante (comportement des modèles existants).
ALTER TABLE mk_tb_templates ADD COLUMN identity_mode TEXT;
