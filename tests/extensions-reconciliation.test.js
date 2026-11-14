// Réconciliation des extensions : le script détecte et répare les lignes d'activation orphelines, sans toucher aux données d'extension ni aux sites sains.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const SCRIPT = path.join(__dirname, "..", "scripts", "extensions-reconcile.js");
const run = (file, ...a) => spawnSync(process.execPath, [SCRIPT, file, ...a], { encoding: "utf8" });

test("diagnostic en lecture seule, puis réparation ciblée", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kx-rec-"));
  const file = path.join(dir, "t.db");
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE mk_sites (id INTEGER PRIMARY KEY, organization_id INTEGER, deleted_at TEXT);
    CREATE TABLE mk_site_modules (site_id INTEGER, organization_id INTEGER, module TEXT, enabled INTEGER);
    CREATE TABLE mk_shop_products (id INTEGER PRIMARY KEY, site_id INTEGER);
    INSERT INTO mk_sites VALUES (1, 1, NULL), (2, 1, NULL), (3, 1, '2026-01-01'), (4, 1, NULL);
    INSERT INTO mk_shop_products VALUES (1, 3);
    INSERT INTO mk_site_modules VALUES (1, 1, 'commerce', 1), (2, 1, 'lms', 1), (3, 1, 'commerce', 1), (99, 1, 'lms', 1), (1, 1, 'fantome', 1), (2, 7, 'commerce', 1);`);
  db.close();
  const diag = run(file);
  assert.equal(diag.status, 1); assert.match(diag.stdout, /extension inconnue du registre : 1/); assert.match(diag.stdout, /site inexistant : 1/); assert.match(diag.stdout, /site supprimé : 1/); assert.match(diag.stdout, /organisation différente.*: 1/);
  assert.match(diag.stdout, /sans aucune ligne d'activation : 1/, "le site 4 n'a aucune ligne : normal");
  const fix = run(file, "--reparer");
  assert.equal(fix.status, 0, fix.stderr);
  const after = new DatabaseSync(file);
  assert.deepEqual(after.prepare("SELECT site_id, organization_id, module FROM mk_site_modules ORDER BY site_id, module").all().map((r) => `${r.site_id}:${r.organization_id}:${r.module}`), ["1:1:commerce", "2:1:commerce", "2:1:lms"]);
  assert.equal(after.prepare("SELECT COUNT(*) n FROM mk_shop_products").get().n, 1, "les données d'extension ne sont jamais touchées");
  after.close();
  assert.equal(run(file).status, 0); assert.match(run(file).stdout, /Aucune anomalie/);
});
