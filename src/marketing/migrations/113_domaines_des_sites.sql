-- Registre des domaines des sites (TITAN XXXII). Avant : le « domaine » d'un site était une URL libre (mk_sites.settings → seo.publicUrl), active dès l'enregistrement,
-- sans vérification de propriété, sans alias (www), sans état, sans sous-domaine de plateforme. Désormais un domaine est une LIGNE : site propriétaire, type, état de
-- vérification, domaine canonique ou secondaire, états DNS et HTTPS. Le serveur ne sert un hôte que si une ligne « verified » existe pour un site actif.
-- Les domaines déjà utilisés par des sites en ligne sont repris par le code de démarrage (src/services/siteDomains.js → backfillLegacy) comme « verified / legacy » :
-- aucun site existant ne change de comportement.
CREATE TABLE mk_site_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE,
  host TEXT NOT NULL,                                   -- hôte normalisé : minuscules, ASCII (IDN converti), sans port ni point final
  kind TEXT NOT NULL CHECK (kind IN ('platform', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disabled')),
  is_canonical INTEGER NOT NULL DEFAULT 0 CHECK (is_canonical IN (0, 1)),
  verification_token TEXT,                              -- jeton à publier en TXT (_kolakisa-verify.<hôte>) pour prouver la propriété
  verification_method TEXT CHECK (verification_method IN ('txt', 'platform', 'sibling', 'legacy', 'test')),
  verified_at TEXT,
  dns_status TEXT NOT NULL DEFAULT 'unknown' CHECK (dns_status IN ('unknown', 'ok', 'missing', 'mismatch')),
  tls_status TEXT NOT NULL DEFAULT 'unknown' CHECK (tls_status IN ('unknown', 'ok', 'pending', 'failed')),
  last_check_at TEXT,
  last_check_error TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  disabled_at TEXT
);
-- Un hôte VÉRIFIÉ n'appartient qu'à un seul site. Plusieurs sites peuvent avoir le même hôte « en attente » (personne ne peut en bloquer un autre en le réclamant le premier) :
-- seul celui qui prouve la propriété (TXT) l'obtient.
CREATE UNIQUE INDEX idx_mk_site_domains_verified_host ON mk_site_domains(host) WHERE status = 'verified';
CREATE UNIQUE INDEX idx_mk_site_domains_pending_site ON mk_site_domains(site_id, host) WHERE status = 'pending';
-- Un seul domaine canonique actif par site.
CREATE UNIQUE INDEX idx_mk_site_domains_canonical ON mk_site_domains(site_id) WHERE is_canonical = 1 AND status = 'verified';
CREATE INDEX idx_mk_site_domains_site ON mk_site_domains(site_id, status);
