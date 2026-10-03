-- Revenus des e-mails (comme Mailchimp) : une commande du site est attribuée au DERNIER e-mail marketing cliqué par
-- l'acheteur dans les N jours qui précèdent l'achat (N réglable, 7 par défaut). Une commande n'est attribuée qu'une fois.
-- Le montant et les dates sont recopiés au moment de l'attribution : l'historique reste stable même si une campagne,
-- un contact ou un compte est supprimé ensuite (pas de clé étrangère vers les tables du site).
CREATE TABLE mk_order_attributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  order_id INTEGER NOT NULL,              -- commande du site (table orders)
  contact_id INTEGER,                     -- acheteur (contact marketing)
  message_id INTEGER,                     -- e-mail cliqué (mk_messages)
  campaign_id INTEGER,                    -- campagne (ou campagne « système » d'une automatisation)
  automation_id INTEGER,                  -- automatisation, si l'e-mail en venait
  variant INTEGER,                        -- version du test A/B reçue (0 = A…), sinon NULL
  amount_cents INTEGER NOT NULL DEFAULT 0,
  ordered_at INTEGER NOT NULL,            -- date de la commande (ms)
  clicked_at INTEGER NOT NULL,            -- date du clic retenu (ms)
  created_at INTEGER NOT NULL,
  UNIQUE (organization_id, order_id)
);
CREATE INDEX idx_mk_attr_campaign ON mk_order_attributions(organization_id, campaign_id);
CREATE INDEX idx_mk_attr_automation ON mk_order_attributions(organization_id, automation_id) WHERE automation_id IS NOT NULL;
CREATE INDEX idx_mk_attr_ordered ON mk_order_attributions(organization_id, ordered_at);
