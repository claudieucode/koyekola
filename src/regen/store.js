// Intelligent Regeneration & History (programme 21.9) — stockage. Tables créées à la demande (comme 21.4, 21.5, 21.7, 21.8 : les migrations se télescopent entre paliers parallèles).
// Rien n'est dupliqué : les pages restent dans mk_landing_pages (historique natif services/revisions.js inchangé), le design dans le moteur de styles, les médias dans la médiathèque (références seulement).
//   mk_regen_ops        : journal central des opérations (humaines ou IA) : demande, périmètre, changements, statut, parent (restauration/annulation), consommation IA.
//   mk_regen_op_snaps   : lien opération ↔ snapshots (avant / après).
//   mk_regen_snapshots  : états cohérents (widget, section, page, design, site), compressés, dédupliqués par empreinte.
//   mk_regen_protections: protections posées par la personne (verrouillé / validé), appliquées CÔTÉ SERVEUR.
//   mk_regen_marks      : empreinte de ce que l'IA a écrit en dernier (distingue « généré par l'IA » de « modifié par la personne »).
function ensureSchema(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS mk_regen_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, level TEXT NOT NULL CHECK (level IN ('node','section','page','design','site')),
    ref TEXT NOT NULL, page_id INTEGER, label TEXT NOT NULL DEFAULT '', fp TEXT NOT NULL, bytes INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE INDEX IF NOT EXISTS mk_regen_snapshots_ref ON mk_regen_snapshots (site_id, level, ref, id DESC);
  CREATE TABLE IF NOT EXISTS mk_regen_ops (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, project_id INTEGER, user_id INTEGER,
    actor TEXT NOT NULL DEFAULT 'human' CHECK (actor IN ('human','ai')), kind TEXT NOT NULL, request TEXT NOT NULL DEFAULT '', intent TEXT NOT NULL DEFAULT '', scope TEXT NOT NULL DEFAULT '',
    target TEXT NOT NULL DEFAULT '{}', plan TEXT NOT NULL DEFAULT '{}', changes TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','applied','rejected','undone','failed','superseded')),
    parent_id INTEGER, ai_calls INTEGER NOT NULL DEFAULT 0, provider TEXT NOT NULL DEFAULT '', model TEXT NOT NULL DEFAULT '', cost_micro INTEGER, cost_kind TEXT NOT NULL DEFAULT 'none', error TEXT NOT NULL DEFAULT '',
    base TEXT NOT NULL DEFAULT '{}', reversible INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), applied_at TEXT);
  CREATE INDEX IF NOT EXISTS mk_regen_ops_site ON mk_regen_ops (organization_id, site_id, id DESC);
  CREATE TABLE IF NOT EXISTS mk_regen_op_snaps (op_id INTEGER NOT NULL REFERENCES mk_regen_ops(id) ON DELETE CASCADE, phase TEXT NOT NULL CHECK (phase IN ('before','after')), snap_id INTEGER NOT NULL REFERENCES mk_regen_snapshots(id) ON DELETE CASCADE, PRIMARY KEY (op_id, phase, snap_id));
  CREATE TABLE IF NOT EXISTS mk_regen_protections (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK (kind IN ('page','section','node','field','design','component','media')),
    ref TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('locked','validated')), reason TEXT NOT NULL DEFAULT '', user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (site_id, kind, ref));
  CREATE TABLE IF NOT EXISTS mk_regen_marks (site_id INTEGER NOT NULL, kind TEXT NOT NULL, ref TEXT NOT NULL, fp TEXT NOT NULL, op_id INTEGER, at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (site_id, kind, ref));`);
}
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
module.exports = { ensureSchema, json };
