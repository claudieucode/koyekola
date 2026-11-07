-- Contrôle d'âge légal (alcool, tabac…) : âge minimum par produit et/ou par catégorie, déclaration de majorité enregistrée sur la commande.
-- Additif : un produit sans ligne ici n'est soumis à aucun contrôle (comportement inchangé). Aucune vérification d'identité : simple déclaration sur l'honneur.

CREATE TABLE mk_shop_product_age (
  product_id INTEGER PRIMARY KEY REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  min_age INTEGER NOT NULL CHECK (min_age IN (16, 18, 21))
);
CREATE TABLE mk_shop_category_age (
  category_id INTEGER PRIMARY KEY REFERENCES mk_shop_categories(id) ON DELETE CASCADE,
  min_age INTEGER NOT NULL CHECK (min_age IN (16, 18, 21))
);
-- Déclaration faite au passage en caisse : date et âge minimum le plus élevé exigé par le panier (NULL = aucune exigence).
ALTER TABLE mk_shop_orders ADD COLUMN age_confirmed_at TEXT;
ALTER TABLE mk_shop_orders ADD COLUMN age_confirmed_min INTEGER;
