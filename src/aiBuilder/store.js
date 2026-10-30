// AI Website Builder (programme 21.8) — projets de création. Tables créées à la demande (comme 21.4, 21.5 et 21.7 : les migrations sont figées par test et se télescopent entre paliers).
// Un projet appartient à UN site et pointe vers les objets des moteurs existants (plan 21.3, exécution du Page Generator 21.4, propositions de design 21.5…) : aucune donnée des moteurs n'est copiée ici.
function ensureSchema(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS mk_aib_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, name TEXT NOT NULL,
    plan_id INTEGER, draft TEXT NOT NULL DEFAULT '{}', links TEXT NOT NULL DEFAULT '{}', approvals TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), archived_at TEXT);
  CREATE INDEX IF NOT EXISTS mk_aib_projects_site ON mk_aib_projects (organization_id, site_id, archived_at, updated_at);
  CREATE TABLE IF NOT EXISTS mk_aib_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES mk_aib_projects(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, user_id INTEGER,
    kind TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'system', text TEXT NOT NULL DEFAULT '', payload TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'done',
    created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE INDEX IF NOT EXISTS mk_aib_events_project ON mk_aib_events (project_id, id);`);
}
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
module.exports = { ensureSchema, json };
