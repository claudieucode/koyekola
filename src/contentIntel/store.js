// Stockage du moteur de contenu : tables créées à la demande (même choix que les paliers 21.4 à 21.9 : les numéros de migration se télescopent entre sessions parallèles).
// Toutes les tables portent site_id NOT NULL ; toutes les lectures et écritures sont filtrées par site ET organisation. Retour arrière : DROP TABLE des tables mk_ci_*.
const done = new WeakSet();
function ensureSchema(db) {
  if (done.has(db)) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS mk_ci_evals (
      site_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, page_id INTEGER NOT NULL, fp TEXT NOT NULL, result TEXT NOT NULL, evaluated_at TEXT NOT NULL,
      PRIMARY KEY (site_id, page_id)
    );
    CREATE TABLE IF NOT EXISTS mk_ci_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT, site_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, page_id INTEGER, keyword TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'secondary',
      provenance TEXT NOT NULL DEFAULT 'manual', metrics TEXT, source TEXT, source_date TEXT, created_by INTEGER, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mk_ci_keywords_site ON mk_ci_keywords(site_id, page_id);
    CREATE TABLE IF NOT EXISTS mk_ci_link_props (
      id INTEGER PRIMARY KEY AUTOINCREMENT, site_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, page_id INTEGER NOT NULL, target_page_id INTEGER NOT NULL, anchor TEXT NOT NULL,
      context TEXT, status TEXT NOT NULL DEFAULT 'proposed', decided_by INTEGER, decided_at TEXT, applied_section TEXT, created_at TEXT NOT NULL,
      UNIQUE (site_id, page_id, target_page_id, anchor)
    );
    CREATE TABLE IF NOT EXISTS mk_ci_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, site_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, group_key TEXT NOT NULL, page_id INTEGER NOT NULL, lang TEXT NOT NULL, region TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'translation', created_by INTEGER, created_at TEXT NOT NULL,
      UNIQUE (site_id, page_id), UNIQUE (site_id, group_key, lang, region)
    );
    CREATE TABLE IF NOT EXISTS mk_ci_settings (
      site_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_by INTEGER, updated_at TEXT NOT NULL, PRIMARY KEY (site_id, key)
    );
  `);
  done.add(db);
}
const json = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
module.exports = { ensureSchema, json };
