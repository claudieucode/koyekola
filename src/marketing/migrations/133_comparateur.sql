-- Comparateur de produits : caractéristiques (paires libellé / valeur) saisies par le vendeur sur chaque produit.
-- Additif : une seule nouvelle table. La liste de comparaison du visiteur vit dans un cookie propre à la boutique (aucune donnée personnelle stockée).
CREATE TABLE mk_shop_product_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES mk_shop_products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  value TEXT NOT NULL
);
CREATE INDEX idx_mk_shop_product_specs_product ON mk_shop_product_specs(product_id, position);
