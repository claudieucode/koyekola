// KOLAKISA SEO CORE — stockage. Tables propres au module SEO (ajoutées, jamais de modification des tables existantes).
//   seo_settings : réglages du site (nom, modèles de titres, organisation, profils sociaux…), une ligne par réglage
//   seo_meta     : réglages SEO d'un contenu qui n'a pas ses propres colonnes (formation, catégories, étiquettes, auteurs, pages)
//   seo_changes  : journal des modifications SEO (qui, quand, quoi, avant → après)
const db = require("../config/database");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER
  );
  CREATE TABLE IF NOT EXISTS seo_meta (
    entity_type TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    robots_index INTEGER,
    robots_follow INTEGER,
    og_title TEXT,
    og_description TEXT,
    og_image_path TEXT,
    twitter_card TEXT,
    focus_keyword TEXT,
    secondary_keywords TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER,
    PRIMARY KEY (entity_type, entity_key)
  );
  CREATE TABLE IF NOT EXISTS seo_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER,
    source TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_seo_changes_entity ON seo_changes(entity_type, entity_key, id);
  CREATE INDEX IF NOT EXISTS idx_seo_changes_date ON seo_changes(created_at);
`);

// R8 lot 6 : les colonnes « site » (migrations 090) peuvent manquer le temps d'un démarrage où les migrations marketing ont échoué : le journal reste alors utilisable (sans site)
const hasSiteColumn = (table) => db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = 'site_id'`).get() !== undefined;
let siteColumnKnown = null;
const siteSchemaReady = () => (siteColumnKnown === true ? true : (siteColumnKnown = hasSiteColumn("seo_changes") && hasSiteColumn("seo_404")));

// Journal : une ligne par champ réellement modifié ; siteId = site concerné (NULL = réglages globaux / site principal)
function logChange({ entityType, entityKey, field, before, after, userId = null, source = "admin", siteId = null }) {
  const b = before === undefined || before === null ? null : String(before);
  const a = after === undefined || after === null ? null : String(after);
  if (b === a) return;
  if (siteSchemaReady()) {
    db.prepare("INSERT INTO seo_changes (entity_type, entity_key, field, old_value, new_value, user_id, source, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(entityType, String(entityKey), field, b, a, userId, source, Number.isInteger(siteId) ? siteId : null);
    return;
  }
  db.prepare("INSERT INTO seo_changes (entity_type, entity_key, field, old_value, new_value, user_id, source) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(entityType, String(entityKey), field, b, a, userId, source);
}

// site : undefined = toutes les lignes (équipe) ; null = site principal / global ; entier = CE site seulement
function listChanges({ entityType = null, entityKey = null, limit = 50, site } = {}) {
  const where = [];
  const params = [];
  if (site !== undefined && siteSchemaReady()) { if (Number.isInteger(site)) { where.push("c.site_id = ?"); params.push(site); } else where.push("c.site_id IS NULL"); }
  if (entityType) { where.push("c.entity_type = ?"); params.push(entityType); }
  if (entityKey !== null && entityKey !== undefined) { where.push("c.entity_key = ?"); params.push(String(entityKey)); }
  return db.prepare(`SELECT c.*, u.username FROM seo_changes c LEFT JOIN users u ON u.id = c.user_id ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY c.id DESC LIMIT ?`)
    .all(...params, Math.min(500, Math.max(1, limit)));
}

module.exports = { db, logChange, listChanges, siteSchemaReady, hasSiteColumn };
