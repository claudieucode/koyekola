-- Theme Builder : identité graphique d'un modèle (mode « indépendant », « suit le site » ou « hybride »). Ajout seul : aucune donnée existante n'est modifiée.
-- Texte JSON { mode, use, own } ; NULL = modèle sans identité mémorisée (comportement historique, jamais transformé au rendu).
ALTER TABLE mk_tb_templates ADD COLUMN identity TEXT;
