-- Boutique : promotions avancées sur les coupons existants. Migration ADDITIVE (aucun coupon existant ne change de comportement : toutes les valeurs par défaut valent 0).
--  free_shipping : le coupon offre aussi la livraison ; shipping_only : AUCUNE remise sur les lignes (livraison offerte seulement) ;
--  auto_apply : promotion automatique, appliquée sans code quand ses conditions sont remplies (un code saisi valide a la priorité ; une seule promotion à la fois, pas de cumul).
ALTER TABLE mk_shop_coupons ADD COLUMN free_shipping INTEGER NOT NULL DEFAULT 0 CHECK (free_shipping IN (0, 1));
ALTER TABLE mk_shop_coupons ADD COLUMN shipping_only INTEGER NOT NULL DEFAULT 0 CHECK (shipping_only IN (0, 1));
ALTER TABLE mk_shop_coupons ADD COLUMN auto_apply INTEGER NOT NULL DEFAULT 0 CHECK (auto_apply IN (0, 1));
ALTER TABLE mk_shop_coupons ADD COLUMN label TEXT;
