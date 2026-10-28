// Administration par site de « Mon espace » (/formateur) : rattachement des données du LMS à un site.
//
// Convention du CMS conservée : site_id NULL = site principal. Migration ADDITIVE et idempotente :
//  - colonnes nullables (toutes les lignes existantes restent au site principal, aucune donnée n'est déplacée) ;
//  - aucune suppression, aucun renommage ; annulation : DROP COLUMN site_id / DROP TABLE site_pages_by_site (voir docs/KOLAKISA_ADMIN_MULTISITE.md).
// La page « À propos » a pour clé primaire le seul slug (impossible à modifier sans reconstruire la table) : les pages des AUTRES sites
// vivent dans site_pages_by_site (clé : site_id, slug) ; le principal reste dans site_pages, inchangée.
const TABLES = ["courses", "faqs", "contact_messages", "support_tickets", "audit_log"];

function apply(db) {
  for (const table of TABLES) {
    const exists = db.prepare("SELECT 1 x FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
    if (!exists) continue;
    if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === "site_id")) db.exec(`ALTER TABLE ${table} ADD COLUMN site_id INTEGER`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_site ON ${table}(site_id)`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_pages_by_site (
      site_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      seo_description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (site_id, slug)
    );
  `);
}

module.exports = { apply, TABLES };
