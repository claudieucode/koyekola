// R8 lot 6A — migrations 090 (SEO par site) et 091 (imports par site) : préservation de l'historique, portées, contraintes, base neuve, retour arrière.
// Bases EN MÉMOIRE uniquement (aucune base réelle). Les tables seo_* « d'avant » sont créées comme le fait le code d'exécution (src/seo/*.js).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))";
const DOWN = path.join(__dirname, "..", "scripts", "migrations-retour-arriere");
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const cols = (db, t) => rows(db, `SELECT name FROM pragma_table_info('${t}')`).map((c) => c.name);
const OLD_SEO = `
  CREATE TABLE seo_redirects (id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL UNIQUE, target TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 301, enabled INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '', hits INTEGER NOT NULL DEFAULT 0, last_hit_at TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), site_id INTEGER);
  CREATE INDEX idx_seo_redirects_site ON seo_redirects(site_id);
  CREATE TABLE seo_404 (path TEXT PRIMARY KEY, hits_human INTEGER NOT NULL DEFAULT 0, hits_bot INTEGER NOT NULL DEFAULT 0, first_seen TEXT NOT NULL DEFAULT (datetime('now')), last_seen TEXT NOT NULL DEFAULT (datetime('now')), last_referrer TEXT, last_user_agent TEXT, ignored INTEGER NOT NULL DEFAULT 0);
  CREATE INDEX idx_seo_404_last ON seo_404(last_seen);
  CREATE TABLE seo_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_key TEXT NOT NULL, field TEXT NOT NULL, old_value TEXT, new_value TEXT, user_id INTEGER, source TEXT NOT NULL DEFAULT 'admin', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE seo_audits (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL DEFAULT 'full', status TEXT NOT NULL DEFAULT 'running', pages INTEGER NOT NULL DEFAULT 0, issues INTEGER NOT NULL DEFAULT 0, scores TEXT, error TEXT, triggered_by INTEGER, source TEXT NOT NULL DEFAULT 'admin', started_at TEXT NOT NULL DEFAULT (datetime('now')), finished_at TEXT);
  CREATE TABLE seo_monitor_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE seo_alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, severity TEXT NOT NULL, kind TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), seen_at TEXT);`;

function until(db, version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-r8-"));
  for (const f of fs.readdirSync(MIGRATIONS)) if (f < version) fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
  migrate(db, { dir, dbPath: ":memory:", log: quiet });
  fs.rmSync(dir, { recursive: true, force: true });
}
const fresh = () => { const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); db.exec(USERS); return db; };
const schemaOf = (db) => rows(db, "SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").map((r) => `${r.type}:${r.name}`);

function seeded() {
  const db = fresh();
  until(db, "090");
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}'), (2, 'Autre', 'autre', '{}')");
  db.exec(OLD_SEO);
  db.exec(`INSERT INTO seo_redirects (source_path, target, status, hits, site_id) VALUES ('/commune', '/x', 301, 4, NULL), ('/ancien-a', '/na', 302, 1, 1), ('/ancien-b', '/nb', 301, 0, 2);
    INSERT INTO seo_404 (path, hits_human, hits_bot, ignored) VALUES ('/introuvable', 3, 5, 0), ('/ignore', 1, 0, 1);
    INSERT INTO seo_changes (entity_type, entity_key, field, old_value, new_value) VALUES ('settings', 'site', 'site_name', 'A', 'B');
    INSERT INTO seo_audits (kind, status, pages) VALUES ('full', 'done', 12);
    INSERT INTO seo_monitor_snapshots (data) VALUES ('{"x":1}');
    INSERT INTO seo_alerts (severity, kind, message) VALUES ('high', 'robots', 'm');`);
  const imp = db.prepare("INSERT INTO mk_imports (organization_id, filename, options, status) VALUES (?, ?, ?, 'done')");
  imp.run(1, "equipe.csv", "{}");                                  // import d'équipe : reste NULL
  imp.run(1, "site-a.csv", JSON.stringify({ listId: 5, siteId: 1 })); // prouvé par ses options
  imp.run(1, "autre-org.csv", JSON.stringify({ siteId: 3 }));      // site d'une AUTRE organisation : jamais rattaché
  imp.run(1, "site-fantome.csv", JSON.stringify({ siteId: 99 }));  // site inexistant : NULL
  imp.run(1, "illisible.csv", "pas du json");                      // options illisibles : NULL
  db.prepare("INSERT INTO mk_import_rejects (organization_id, import_id, line, email, reason) VALUES (1, 2, 3, 'x@ex.cd', 'r')").run();
  return db;
}
const up = (db) => migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
const down = (db, f) => db.exec(fs.readFileSync(path.join(DOWN, f), "utf8"));

describe("migrations 090 / 091 : préservation de l'historique", () => {
  const db = seeded();
  const before = {
    redirects: rows(db, "SELECT * FROM seo_redirects ORDER BY id"), n404: rows(db, "SELECT * FROM seo_404 ORDER BY path"), changes: rows(db, "SELECT * FROM seo_changes"),
    audits: rows(db, "SELECT * FROM seo_audits"), snaps: rows(db, "SELECT * FROM seo_monitor_snapshots"), alerts: rows(db, "SELECT * FROM seo_alerts"), imports: rows(db, "SELECT id, organization_id, filename, options, status FROM mk_imports ORDER BY id"),
  };
  test("090 + 091 s'appliquent dans l'ordre et rien de ce qui existait n'est perdu ni modifié", () => {
    assert.deepEqual(up(db).applied, ["090", "091"]);
    const strip = (list) => list.map(({ site_id, ...r }) => r);
    assert.deepEqual(strip(rows(db, "SELECT * FROM seo_redirects ORDER BY id")), strip(before.redirects), "redirections (ids, compteurs, état conservés)");
    assert.deepEqual(rows(db, "SELECT id, site_id FROM seo_redirects ORDER BY id").map((r) => r.site_id), [null, 1, 2], "le site déjà enregistré reste tel quel (aucune réattribution)");
    assert.deepEqual(strip(rows(db, "SELECT * FROM seo_404 ORDER BY path")), before.n404);
    assert.ok(rows(db, "SELECT site_id FROM seo_404").every((r) => r.site_id === null), "404 historiques = site principal (NULL)");
    for (const [t, key] of [["seo_changes", "changes"], ["seo_audits", "audits"], ["seo_monitor_snapshots", "snaps"], ["seo_alerts", "alerts"]]) {
      assert.deepEqual(strip(rows(db, `SELECT * FROM ${t} ORDER BY id`)), before[key], t);
      assert.ok(rows(db, `SELECT site_id FROM ${t}`).every((r) => r.site_id === null), `${t} : NULL`);
    }
    assert.deepEqual(rows(db, "SELECT id, organization_id, filename, options, status FROM mk_imports ORDER BY id"), before.imports, "imports : contenu intact");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_import_rejects")[0].n, 1);
  });
  test("091 : un import ancien n'est rattaché à un site que si ses options le prouvent (même organisation) ; sinon il reste à l'équipe (NULL)", () => {
    assert.deepEqual(rows(db, "SELECT filename, site_id FROM mk_imports ORDER BY id"), [
      { filename: "equipe.csv", site_id: null }, { filename: "site-a.csv", site_id: 1 }, { filename: "autre-org.csv", site_id: null }, { filename: "site-fantome.csv", site_id: null }, { filename: "illisible.csv", site_id: null }]);
  });
  test("091 : le site d'un import ne change plus, doit être de la même organisation", () => {
    assert.throws(() => db.prepare("UPDATE mk_imports SET site_id = 2 WHERE filename = 'site-a.csv'").run(), /ne change jamais/);
    assert.throws(() => db.prepare("UPDATE mk_imports SET site_id = 1 WHERE filename = 'equipe.csv'").run(), /ne change jamais/, "pas de rattachement a posteriori");
    assert.throws(() => db.prepare("INSERT INTO mk_imports (organization_id, filename, site_id) VALUES (1, 'x.csv', 3)").run(), /même organisation/);
    db.prepare("INSERT INTO mk_imports (organization_id, filename, site_id) VALUES (1, 'ok.csv', 2)").run();
  });
  test("090 : l'ancienne adresse n'est unique que PAR site ; la 404 aussi ; un site inexistant est refusé", () => {
    const ins = (src, site) => db.prepare("INSERT INTO seo_redirects (source_path, target, site_id) VALUES (?, '/t', ?)").run(src, site);
    ins("/ancien-a", 2); ins("/ancien-a", null);                       // même adresse pour un AUTRE site et pour la commune : permis
    assert.throws(() => ins("/ancien-a", 1), /UNIQUE/i, "deux fois pour le même site"); assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name='uq_seo_redirects_site_source'").get(), "même index que l'outil de reconstruction du cœur");
    assert.throws(() => ins("/commune", null), /UNIQUE/i, "deux fois en commun");
    assert.throws(() => ins("/z", 777), /FOREIGN KEY/i);
    const n = db.prepare("INSERT INTO seo_404 (path, site_id) VALUES (?, ?)");
    n.run("/introuvable", 1); n.run("/introuvable", 2);
    assert.throws(() => n.run("/introuvable", 1), /UNIQUE/i); assert.throws(() => n.run("/introuvable", null), /UNIQUE/i);
    db.prepare("INSERT INTO seo_site_settings (site_id, key, value) VALUES (1, 'site_name', '\"Alpha\"')").run();
    assert.throws(() => db.prepare("INSERT INTO seo_site_settings (site_id, key, value) VALUES (1, 'site_name', '\"x\"')").run(), /UNIQUE|PRIMARY/i);
  });
});

describe("migrations 090 / 091 : base neuve et retour arrière", () => {
  test("base neuve (aucune table seo_* préexistante) : la migration les crée et le tout fonctionne", () => {
    const db = fresh(); assert.deepEqual(up(db).applied.slice(-2), ["090", "091"]);
    for (const t of ["seo_redirects", "seo_404", "seo_changes", "seo_audits", "seo_monitor_snapshots", "seo_alerts"]) assert.ok(cols(db, t).includes("site_id"), t);
    assert.ok(cols(db, "seo_site_settings").includes("site_id") && cols(db, "mk_imports").includes("site_id"));
    assert.deepEqual(up(db).applied, [], "idempotent");
  });
  test("retour arrière : les lignes sont conservées, le schéma d'avant revient ; refus s'il y a des conflits entre sites ; la remontée redonne le même schéma", () => {
    const db = seeded(); up(db);
    const full = schemaOf(db);
    db.exec("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/ancien-a', '/t', 2)");        // conflit : même adresse sur deux sites
    assert.throws(() => down(db, "090_seo_par_site.down.sql"), /UNIQUE/i, "refusé tant que des sites partagent une adresse"); db.exec("ROLLBACK"); assert.ok(cols(db, "seo_site_settings").length, "tout ou rien : rien n a bougé après le refus");
    db.exec("DELETE FROM seo_redirects WHERE source_path = '/ancien-a' AND site_id = 2");
    down(db, "091_imports_par_site.down.sql"); down(db, "090_seo_par_site.down.sql");
    assert.ok(!cols(db, "mk_imports").includes("site_id"));
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_imports")[0].n, 5, "aucun import perdu"); assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_import_rejects")[0].n, 1);
    assert.deepEqual(rows(db, "SELECT source_path, hits, site_id FROM seo_redirects ORDER BY id"), [{ source_path: "/commune", hits: 4, site_id: null }, { source_path: "/ancien-a", hits: 1, site_id: 1 }, { source_path: "/ancien-b", hits: 0, site_id: 2 }]);
    assert.deepEqual(rows(db, "SELECT path, hits_human FROM seo_404 ORDER BY path"), [{ path: "/ignore", hits_human: 1 }, { path: "/introuvable", hits_human: 3 }]);
    assert.ok(!cols(db, "seo_404").includes("site_id") && !cols(db, "seo_changes").includes("site_id") && !cols(db, "seo_site_settings").length);
    assert.throws(() => db.exec("INSERT INTO seo_redirects (source_path, target) VALUES ('/commune', '/y')"), /UNIQUE/i, "unicité globale rétablie");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM schema_migrations WHERE version IN ('090','091')")[0].n, 0);
    assert.deepEqual(up(db).applied, ["090", "091"]);
    assert.deepEqual(schemaOf(db), full, "la remontée redonne exactement le schéma complet");
  });
  test("prérequis : si seo_redirects n'a pas la colonne site_id du palier 12, la 090 échoue PROPREMENT (rien n'est modifié, repère non posé) ; les imports anciens ne sont jamais réattribués au hasard", () => {
    const db = fresh(); until(db, "090");
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
    db.exec(OLD_SEO.replace(", site_id INTEGER);\n  CREATE INDEX idx_seo_redirects_site ON seo_redirects(site_id);", ");"));   // base d'avant le palier 12
    assert.ok(!cols(db, "seo_redirects").includes("site_id"));
    db.exec("INSERT INTO seo_redirects (source_path, target) VALUES ('/a', '/b')");
    assert.throws(() => up(db), /site_id/i);
    assert.deepEqual(rows(db, "SELECT source_path FROM seo_redirects"), [{ source_path: "/a" }], "ligne conservée");
    assert.ok(!cols(db, "seo_redirects").includes("site_id") && !cols(db, "seo_404").includes("site_id"), "aucune modification partielle");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM schema_migrations WHERE version IN ('090','091')")[0].n, 0);
    assert.ok(!cols(db, "seo_site_settings").length, "table non créée");
  });
});
