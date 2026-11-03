-- Index des clés étrangères de la boutique, du constructeur de boutique par IA et de Mailchimp (audit D3 : chaque clé étrangère est indexée).
-- Additif et sans risque : uniquement des index, aucune donnée ni structure de table modifiée.
CREATE INDEX IF NOT EXISTS idx_mk_shop_settings_site_id ON mk_shop_settings (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_categories_parent_id ON mk_shop_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_categories_site_id ON mk_shop_categories (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_products_site_id ON mk_shop_products (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_variants_site_id ON mk_shop_variants (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_carts_site_id ON mk_shop_carts (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_cart_items_variant_id ON mk_shop_cart_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_cart_items_product_id ON mk_shop_cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_customers_site_id ON mk_shop_customers (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_customer_tokens_customer_id ON mk_shop_customer_tokens (customer_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_shipping_zones_site_id ON mk_shop_shipping_zones (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_shipping_methods_zone_id ON mk_shop_shipping_methods (zone_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_shipping_methods_site_id ON mk_shop_shipping_methods (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_tax_rules_site_id ON mk_shop_tax_rules (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_coupons_site_id ON mk_shop_coupons (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_orders_site_id ON mk_shop_orders (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_shop_coupon_redemptions_order_id ON mk_shop_coupon_redemptions (order_id);
CREATE INDEX IF NOT EXISTS idx_mk_ai_shops_site_id ON mk_ai_shops (site_id);
CREATE INDEX IF NOT EXISTS idx_mk_mc_members_contact_id ON mk_mc_members (contact_id);
