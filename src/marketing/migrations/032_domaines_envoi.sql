-- Domaines d'envoi (point 11 du plan de parité Mailchimp) : prouver que le domaine de l'adresse d'expédition est à vous
-- (enregistrement TXT de vérification) et vérifier son authentification (SPF, DKIM, DMARC) par de vraies requêtes DNS.
-- Avec Resend, le domaine est aussi déclaré chez Resend, qui fournit ses propres enregistrements (DKIM signé par Resend).
CREATE TABLE mk_sending_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  domain TEXT NOT NULL COLLATE NOCASE,
  token TEXT NOT NULL,                       -- valeur de l'enregistrement TXT « kolakisa-verification=… »
  dkim_selector TEXT NOT NULL DEFAULT '',    -- sélecteur DKIM indiqué par la personne (envoi SMTP) ; vide = recherche des plus courants
  verified_at INTEGER,                       -- propriété prouvée (TXT trouvé, ou domaine vérifié chez Resend)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'authenticated')),
  provider_id TEXT NOT NULL DEFAULT '',      -- identifiant du domaine chez Resend
  provider_records TEXT NOT NULL DEFAULT '[]',
  provider_status TEXT NOT NULL DEFAULT '',
  checks TEXT NOT NULL DEFAULT '{}',         -- résultat de la dernière vérification (JSON)
  checked_at INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, domain)
);
