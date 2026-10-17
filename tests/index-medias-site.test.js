// Migration 079 (lot 7C) : index de clé étrangère manquant de la 074 — additive, idempotente, sans effet sur les données. Base en mémoire, vraies migrations.
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const withUsers = (db) => db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");

test("079 : crée l'index partiel sur mk_media(site_id), idempotente, données intactes, 074 inchangée", () => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "mig79-"));
  try {
    for (const f of fs.readdirSync(MIGRATIONS)) if (f < "079") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
    const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); withUsers(db);
    migrate(db, { dir, dbPath: ":memory:", log: quiet });
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
    db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S', 's', '{}')");
    db.exec("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, reach, site_id) VALUES (1, 'image', 'image', '/uploads/marketing/1/site-1/a.png', 'a', 'image/png', 1, 'site', 1), (1, 'image', 'image', '/uploads/marketing/1/b.png', 'b', 'image/png', 1, 'shared', NULL)");
    const rows = () => db.prepare("SELECT id, path, reach, site_id FROM mk_media ORDER BY id").all().map((r) => ({ ...r }));
    const before = rows();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'idx_mk_media_site_id'").get().n, 0);
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, ["079", "080", "081", "082", "083"]);
    const idx = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'idx_mk_media_site_id'").get();
    assert.match(idx.sql, /ON mk_media\(site_id\) WHERE site_id IS NOT NULL/);
    assert.equal(db.prepare("PRAGMA index_info('idx_mk_media_site_id')").all()[0].name, "site_id", "première colonne = site_id");
    assert.deepEqual(rows(), before, "aucune donnée modifiée");
    db.exec(fs.readFileSync(path.join(MIGRATIONS, "079_index_medias_site.sql"), "utf8")); // rejouée : sans effet ni erreur
    assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'idx_mk_media_site_id'").get().n, 1);
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, [], "une 2e application ne fait rien");
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'idx_mk_media_site'").get(), "l'index de la 074 existe toujours");
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
    db.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
