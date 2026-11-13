-- Boutique : paniers abandonnés (repérage, événement, relance facultative). Migration ADDITIVE.
-- Le statut du panier reste « open » (un visiteur qui revient retrouve son panier) : l'abandon se lit dans abandoned_at.
ALTER TABLE mk_shop_carts ADD COLUMN email TEXT;                 -- adresse connue (client connecté ou saisie à la caisse), jamais devinée
ALTER TABLE mk_shop_carts ADD COLUMN abandoned_at TEXT;          -- posé une fois par épisode d'inactivité ; effacé si le panier est modifié de nouveau
ALTER TABLE mk_shop_carts ADD COLUMN reminder_sent_at TEXT;
ALTER TABLE mk_shop_settings ADD COLUMN abandoned_minutes INTEGER NOT NULL DEFAULT 60;          -- inactivité avant « abandonné »
ALTER TABLE mk_shop_settings ADD COLUMN abandoned_reminder INTEGER NOT NULL DEFAULT 0 CHECK (abandoned_reminder IN (0, 1));  -- relance e-mail aux clients ayant un compte (désactivée par défaut)
CREATE INDEX idx_mk_shop_carts_abandon ON mk_shop_carts(status, abandoned_at, updated_at);
