-- En-tête du site : exceptions par page et variantes.
-- Chaque page hérite par défaut de l'en-tête global de son site (mk_sites.header_component_id). Une page peut faire exception :
--   header_mode = 'inherit' (défaut) : en-tête global du site ;
--   header_mode = 'none'             : aucun en-tête sur cette page ;
--   header_mode = 'variant'          : un autre composant du site (en pratique une variante de l'en-tête global).
-- Les valeurs sont validées par le code (pas de CHECK : de nouveaux modes pourront s'ajouter sans reconstruire la table).
ALTER TABLE mk_landing_pages ADD COLUMN header_mode TEXT NOT NULL DEFAULT 'inherit';
ALTER TABLE mk_landing_pages ADD COLUMN header_component_id INTEGER;
-- Une variante est une copie de l'en-tête global, créée depuis la fiche du site ; elle garde le lien avec sa source.
ALTER TABLE mk_web_components ADD COLUMN variant_of INTEGER;
