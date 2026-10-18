// R9 — l'analyse d'impact de l'option B (scripts/r9-analyse-site-maitre.js) : lecture seule, comptes exacts des lignes « site maître » (NULL) et des sites, index COALESCE, risques. Base SYNTHÉTIQUE jetable uniquement.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const SCRIPT = path.join(__dirname, "..", "scripts", "r9-analyse-site-maitre.js");
describe("R9 : analyse d'impact du site maître (option B)", () => {
  let dir, file;
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: "utf8" });
  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-analyse-")); assert.deepEqual(fs.readdirSync(dir), []);
    file = path.join(dir, "synthetique.db");
    const d = new DatabaseSync(file); d.exec("PRAGMA foreign_keys = ON");
    d.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP)");
    migrate(d, { dir: MIGRATIONS, dbPath: file, log: quiet });
    d.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')");
    d.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'S1'), (1, 'S2')");
    d.exec("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, seo) VALUES (1, 'P0', 'p0', 'P0', 'draft', NULL, '{}'), (1, 'P1', 'p1', 'P1', 'draft', 1, '{}'), (1, 'P2', 'p2', 'P2', 'draft', 2, '{}'), (1, 'P3', 'p3', 'P3', 'draft', 2, '{}')");
    d.exec("INSERT INTO seo_redirects (source_path, target, status, enabled, site_id) VALUES ('/a', '/b', 301, 1, NULL), ('/a', '/c', 301, 1, 1)");
    d.close();
  });
  test("comptes exacts : lignes du site maître (NULL) et des sites ordinaires par table ; index COALESCE ; déclencheurs ; risques", () => {
    const j = path.join(dir, "rapport.json"); const r = run(file, "--json", j); assert.equal(r.status, 0, r.stderr);
    const rep = JSON.parse(fs.readFileSync(j, "utf8")), by = Object.fromEntries(rep.tables.map((t) => [t.table, t]));
    assert.deepEqual([by.mk_landing_pages.lignes, by.mk_landing_pages.siteMaitre, by.mk_landing_pages.sitesOrdinaires], [4, 1, 3]);
    assert.deepEqual([by.seo_redirects.lignes, by.seo_redirects.siteMaitre, by.seo_redirects.sitesOrdinaires], [2, 1, 1]);
    assert.ok(rep.resume.tablesAvecSiteId >= 25, "au moins 25 tables portent site_id (base synthétique sans les tables créées à l'exécution)"); assert.equal(rep.resume.tablesAvecLignesSiteMaitre, 2); assert.equal(rep.resume.lignesSiteMaitre, 2);
    assert.ok(rep.coalesceIndexes.some((i) => i.index === "uq_seo_redirects_site_source"), "index COALESCE repéré"); assert.ok(rep.resume.declencheurs > 0);
    assert.ok(rep.risques.some((x) => /COALESCE/.test(x))); assert.ok(rep.tables.find((t) => t.table === "mk_site_members").notNull);
    assert.match(r.stdout, /Tables avec site_id : \d+ · dont avec des lignes « site maître » \(NULL\) : 2 \(2 lignes\)/);
  });
  test("lecture seule : la base est inchangée, la sortie JSON n'est jamais écrasée, une base absente est refusée", () => {
    const before = sha(file), j = path.join(dir, "rapport2.json"); assert.equal(run(file, "--json", j).status, 0); assert.equal(sha(file), before);
    const again = run(file, "--json", j); assert.equal(again.status, 2); assert.match(again.stderr, /déjà existante/);
    assert.notEqual(run(path.join(dir, "absente.db")).status, 0);
    const code = fs.readFileSync(SCRIPT, "utf8"); assert.doesNotMatch(code, /rmSync|unlinkSync|\b(INSERT INTO|UPDATE \w+ SET|DELETE FROM|DROP TABLE|ALTER TABLE)\b/);
    assert.equal((code.match(/new DatabaseSync\(/g) || []).length, 1); assert.match(code, /readOnly: true/);
  });
});
