-- R6 (lot 1) — Contenus par site : TABLE D'ASSOCIATION, strictement additive (articles et termes de taxonomie ; les commentaires se déduisent de leur article).
-- Pourquoi une table et pas une colonne `site_id` sur `posts` / `taxonomy_terms` : ces deux tables sont créées par config/database.js (hors de ce lanceur) et leur unicité
-- d'adresse est GLOBALE ; elles seront reconstruites plus tard (décision d'unicité par site, après audit de production et copie fidèle). Les laisser intactes garde l'outil de
-- reconstruction préparé (src/services/reconstructionTables.js) et ses essais valides, ne touche à aucun contenu, aucune adresse publique, aucune redirection, aucune relation.
-- Sémantique : PAS DE LIGNE = site principal (comportement historique, tous les contenus existants). Une ligne = le contenu appartient à CE site.
-- `address` = adresse LOGIQUE du contenu dans son site (préparation de l'unicité par site, sans changer l'adresse publique actuelle, qui reste `posts.slug` /
-- `taxonomy_terms.slug`) : unique par (site, type, portée, adresse). `scope` = la taxonomie d'un terme (« category », « tag »), vide pour un article.
-- Garde-fous dans la base : le site est un site de la même organisation ; type, identifiant et organisation d'une ligne ne changent jamais. Les contrôles qui touchent aux tables
-- du cœur (articles, termes, relations) sont posés par src/services/siteContent.js (ensureCoreTriggers) au démarrage, car ces tables n'existent pas dans toutes les bases d'essai.
-- Retour arrière (hors production, après sauvegarde) : supprimer les déclencheurs `trg_mk_cs_*`, puis DROP TABLE mk_content_sites ; aucun contenu n'est modifié par cette migration.

CREATE TABLE mk_content_sites (
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'term')),
  content_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  site_id INTEGER NOT NULL REFERENCES mk_sites(id),
  scope TEXT NOT NULL DEFAULT '',
  address TEXT CHECK (address IS NULL OR (length(address) BETWEEN 1 AND 120 AND address NOT GLOB '*[^a-z0-9-]*' AND substr(address, 1, 1) GLOB '[a-z0-9]')),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (content_type, content_id)
);
CREATE INDEX idx_mk_content_sites_site ON mk_content_sites(site_id, content_type);
CREATE UNIQUE INDEX uq_mk_content_sites_address ON mk_content_sites(site_id, content_type, scope, address) WHERE address IS NOT NULL;

CREATE TRIGGER trg_mk_cs_insert BEFORE INSERT ON mk_content_sites
WHEN (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'contenu de site refusé : le site doit appartenir à la même organisation'); END;

CREATE TRIGGER trg_mk_cs_update BEFORE UPDATE ON mk_content_sites
WHEN NEW.content_type IS NOT OLD.content_type OR NEW.content_id IS NOT OLD.content_id OR NEW.organization_id IS NOT OLD.organization_id
  OR (SELECT organization_id FROM mk_sites WHERE id = NEW.site_id) IS NOT NEW.organization_id
BEGIN SELECT RAISE(ABORT, 'contenu de site refusé : type, identifiant et organisation sont figés, et le site reste dans l''organisation'); END;
