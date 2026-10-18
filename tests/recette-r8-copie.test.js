// R8 — l'outil de recette sur COPIE (scripts/recette-r8-copie.js) : garde-fous, préconditions en lecture seule, migration et retour arrière sur une copie jetable. Aucune base réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const SCRIPT = path.join(__dirname, "..", "scripts", "recette-r8-copie.js");
const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))";
describe("recette R8 sur copie", () => {
  let dir, file;
  const run = (...args) => spawnSync("/usr/local/bin/node", [SCRIPT, ...args], { encoding: "utf8", env: { ...process.env, DATA_DIR: path.join(dir, "vivante") } });
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const make = (name, { palier12 = true } = {}) => {
    const f = path.join(dir, name); const d = new DatabaseSync(f); d.exec("PRAGMA foreign_keys = ON"); d.exec(USERS);
    const m = fs.mkdtempSync(path.join(dir, "mig-")); for (const x of fs.readdirSync(MIGRATIONS)) if (x < "090") fs.copyFileSync(path.join(MIGRATIONS, x), path.join(m, x));
    migrate(d, { dir: m, dbPath: f, log: quiet });
    d.exec("INSERT INTO users (username, email) VALUES ('u', 'u@ex.cd')"); d.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')"); d.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}')");
    d.exec(`CREATE TABLE seo_redirects (id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL UNIQUE, target TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 301, enabled INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '', hits INTEGER NOT NULL DEFAULT 0, last_hit_at TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))${palier12 ? ", site_id INTEGER" : ""})`);
    d.exec("INSERT INTO seo_redirects (source_path, target) VALUES ('/a', '/b')");
    d.exec("INSERT INTO mk_imports (organization_id, filename) VALUES (1, 'x.csv')");
    d.close(); return f;
  };
  before(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "recette-r8-")); fs.mkdirSync(path.join(dir, "vivante"), { recursive: true }); file = make("copie.db"); });
  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("garde-fous : sans confirmation, fichier absent ou base vivante → refus (code ≠ 0), rien n'est ouvert en écriture", () => {
    assert.notEqual(run("prerequis", file).status, 0); assert.match(run("prerequis", file).stderr, /copie-confirmee/);
    assert.notEqual(run("migrer", path.join(dir, "absent.db"), "--copie-confirmee").status, 0);
    const live = path.join(dir, "vivante", "KOYEKOLA.db"); fs.copyFileSync(file, live);
    const r = run("migrer", live, "--copie-confirmee"); assert.notEqual(r.status, 0); assert.match(r.stderr, /base vivante/);
    assert.equal(sha(live), sha(file), "la base vivante n'a pas bougé");
    assert.notEqual(run("inconnu", file, "--copie-confirmee").status, 0);
    // la base vivante peut être ailleurs que dans le DATA_DIR de ce shell : nom ambigu, fichier -wal actif ou dossier de données → refus
    const ambigu = path.join(dir, "KOYEKOLA.db"); fs.copyFileSync(file, ambigu);
    let r2 = run("migrer", ambigu, "--copie-confirmee"); assert.notEqual(r2.status, 0); assert.match(r2.stderr, /ne désigne pas une copie/);
    const wal = path.join(dir, "copie-ouverte.db"); fs.copyFileSync(file, wal); fs.writeFileSync(wal + "-wal", "x");
    r2 = run("migrer", wal, "--copie-confirmee"); assert.notEqual(r2.status, 0); assert.match(r2.stderr, /ouverte par une application/);
    const inLive = path.join(dir, "vivante", "copie-dans-donnees.db"); fs.copyFileSync(file, inLive);
    r2 = run("prerequis", inLive, "--copie-confirmee"); assert.notEqual(r2.status, 0); assert.match(r2.stderr, /dossier de données/);
    assert.equal(sha(ambigu), sha(file)); assert.equal(sha(inLive), sha(file));
  });
  test("prérequis : lecture seule (fichier inchangé), préconditions satisfaites ; une base d'avant le palier 12 est signalée BLOQUANTE", () => {
    const before = sha(file); const r = run("prerequis", file, "--copie-confirmee");
    assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /préconditions satisfaites/); assert.match(r.stdout, /imports : 1/); assert.equal(sha(file), before, "aucune écriture");
    const old = make("copie-avant-palier12.db", { palier12: false }); const b = run("prerequis", old, "--copie-confirmee");
    assert.equal(b.status, 1, b.stdout + b.stderr); assert.match(b.stdout + b.stderr, /BLOQUANT : seo_redirects sans la colonne site_id/); assert.match(b.stdout, /NE PAS MIGRER/);
  });
  test("migrer puis retour sur la copie : 090 et 091 appliquées, lignes identiques, retour arrière complet, sauvegarde automatique créée", () => {
    const m = run("migrer", file, "--copie-confirmee"); assert.equal(m.status, 0, m.stdout + m.stderr); assert.match(m.stdout, /identiques/);
    const d = new DatabaseSync(file, { readOnly: true });
    assert.ok(d.prepare("SELECT 1 x FROM pragma_table_info('mk_imports') WHERE name = 'site_id'").get()); assert.ok(d.prepare("SELECT 1 x FROM sqlite_master WHERE name = 'uq_seo_redirects_site_source'").get()); d.close();
    assert.ok(fs.readdirSync(path.join(dir, "sauvegardes-recette")).some((f) => f.startsWith("AVANT-MIGRATION-")), "sauvegarde du moteur de migrations");
    const b = run("retour", file, "--copie-confirmee"); assert.equal(b.status, 0, b.stdout + b.stderr);
    const e = new DatabaseSync(file, { readOnly: true });
    assert.ok(!e.prepare("SELECT 1 x FROM pragma_table_info('mk_imports') WHERE name = 'site_id'").get()); assert.equal(e.prepare("SELECT COUNT(*) n FROM seo_redirects").get().n, 1); assert.equal(e.prepare("SELECT COUNT(*) n FROM mk_imports").get().n, 1); e.close();
  });
});
