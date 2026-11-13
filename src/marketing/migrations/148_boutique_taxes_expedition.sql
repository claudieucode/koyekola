-- Boutique : classes de taxes, exonération de taxe par client, règles par code postal, classes d'expédition et suppléments par classe. Migration ADDITIVE.
-- Compatibilité : tout reste comme avant tant qu'aucune classe n'est créée (classe NULL = « standard » ; une règle sans classe s'applique aux produits sans classe).
CREATE TABLE mk_shop_tax_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_mk_shop_tax_classes_name ON mk_shop_tax_classes(organization_id, COALESCE(site_id, 0), name);
ALTER TABLE mk_shop_products ADD COLUMN tax_class_id INTEGER;
ALTER TABLE mk_shop_tax_rules ADD COLUMN tax_class_id INTEGER;
ALTER TABLE mk_shop_tax_rules ADD COLUMN postcode TEXT;                 -- motifs séparés par des virgules : 75*, 13000-13999, 1000
ALTER TABLE mk_shop_customers ADD COLUMN tax_exempt INTEGER NOT NULL DEFAULT 0;

CREATE TABLE mk_shop_shipping_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_mk_shop_shipping_classes_name ON mk_shop_shipping_classes(organization_id, COALESCE(site_id, 0), name);
ALTER TABLE mk_shop_products ADD COLUMN shipping_class_id INTEGER;
-- Supplément d'une méthode pour une classe (ajouté une fois par classe présente dans le panier)
CREATE TABLE mk_shop_shipping_class_costs (
  method_id INTEGER NOT NULL REFERENCES mk_shop_shipping_methods(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES mk_shop_shipping_classes(id) ON DELETE CASCADE,
  cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0),
  PRIMARY KEY (method_id, class_id)
);
ALTER TABLE mk_shop_shipping_zones ADD COLUMN postcodes TEXT NOT NULL DEFAULT '';   -- vide = tous les codes postaux de la zone
