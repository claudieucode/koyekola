// Marketing — migrations versionnées : ordre, atomicité, sauvegarde préalable, refus des situations dangereuses.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate, listMigrations, BACKUP_PREFIX } = require("../src/marketing/db/migrate");

let dir, migDir, dbFile, backupDir, db;
const quiet = { log() {}, warn() {} };
const write = (name, sql) => fs.writeFileSync(path.join(migDir, name), sql);
const run = (opts = {}) => migrate(db, { dir: migDir, dbPath: dbFile, backupDir, log: quiet, ...opts });
const tables = () => db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
const applied = () => db.prepare("SELECT version FROM schema_migrations WHERE scope = 'marketing' ORDER BY version").all().map((r) => r.version);
const seedUser = () => db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT); INSERT INTO users (email) VALUES ('a@b.fr')");

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "mk-mig-"));
  migDir = path.join(dir, "migrations");
  backupDir = path.join(dir, "backups");
  dbFile = path.join(dir, "test.db");
  fs.mkdirSync(migDir);
  db = new DatabaseSync(dbFile);
});

describe("application des migrations", () => {
  test("applique les migrations en attente dans l'ordre et les enregistre avec une empreinte", () => {
    write("001_premiere.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    write("002_seconde.sql", "CREATE TABLE mk_b (id INTEGER PRIMARY KEY, a_id INTEGER);");
    const result = run();
    assert.deepEqual(result.applied, ["001", "002"]);
    assert.deepEqual(tables().filter((t) => t.startsWith("mk_")), ["mk_a", "mk_b"]);
    const rows = db.prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version").all();
    assert.deepEqual(rows.map((r) => [r.version, r.name]), [["001", "premiere"], ["002", "seconde"]]);
    assert.ok(rows.every((r) => /^[0-9a-f]{64}$/.test(r.checksum)));
  });
  test("relancer ne fait rien (idempotent) ; une nouvelle migration s'ajoute seule", () => {
    write("001_premiere.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    assert.deepEqual(run().applied, []);
    write("002_seconde.sql", "CREATE TABLE mk_b (id INTEGER PRIMARY KEY);");
    assert.deepEqual(run().applied, ["002"]);
    assert.deepEqual(applied(), ["001", "002"]);
  });
  test("plusieurs instructions, déclencheurs et index dans un même fichier", () => {
    write("001_riche.sql", `
      CREATE TABLE mk_log (id INTEGER PRIMARY KEY, msg TEXT NOT NULL);
      CREATE INDEX idx_mk_log_msg ON mk_log(msg);
      CREATE TRIGGER mk_log_no_delete BEFORE DELETE ON mk_log BEGIN SELECT RAISE(ABORT, 'lecture seule'); END;
      INSERT INTO mk_log (msg) VALUES ('début');
    `);
    run();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_log").get().n, 1);
    assert.throws(() => db.exec("DELETE FROM mk_log"), /lecture seule/);
  });
  test("les données existantes de l'application ne sont jamais touchées", () => {
    seedUser();
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    assert.equal(db.prepare("SELECT email FROM users").get().email, "a@b.fr");
  });
});

describe("atomicité : une migration qui échoue ne laisse aucune trace", () => {
  test("retour en arrière complet, rien d'enregistré, les suivantes ne sont pas appliquées", () => {
    write("001_ok.sql", "CREATE TABLE mk_ok (id INTEGER PRIMARY KEY);");
    write("002_casse.sql", "CREATE TABLE mk_moitie (id INTEGER PRIMARY KEY); INSERT INTO table_inexistante VALUES (1);");
    write("003_apres.sql", "CREATE TABLE mk_apres (id INTEGER PRIMARY KEY);");
    assert.throws(() => run(), (err) => /002/.test(err.message) && /casse/.test(err.message) && /table_inexistante/.test(err.message));
    assert.ok(tables().includes("mk_ok"), "la migration 001 reste appliquée");
    assert.ok(!tables().includes("mk_moitie"), "aucune table à moitié créée");
    assert.ok(!tables().includes("mk_apres"));
    assert.deepEqual(applied(), ["001"]);
  });
  test("après correction, la migration échouée peut être appliquée", () => {
    write("001_ok.sql", "CREATE TABLE mk_ok (id INTEGER PRIMARY KEY);");
    write("002_casse.sql", "INSERT INTO nulle_part VALUES (1);");
    assert.throws(() => run());
    write("002_casse.sql", "CREATE TABLE mk_repare (id INTEGER PRIMARY KEY);");
    assert.deepEqual(run().applied, ["002"]);
  });
});

describe("refus des situations dangereuses", () => {
  test("une migration déjà appliquée puis modifiée est refusée, avec un message clair", () => {
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY, extra TEXT);");
    assert.throws(() => run(), /001.*modifi/i);
  });
  test("un fichier de migration appliqué qui a disparu est signalé", () => {
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    fs.unlinkSync(path.join(migDir, "001_a.sql"));
    assert.throws(() => run(), /001.*(introuvable|disparu|manquant)/i);
  });
  test("une nouvelle migration dont le numéro est inférieur à la dernière appliquée est refusée", () => {
    write("002_b.sql", "CREATE TABLE mk_b (id INTEGER PRIMARY KEY);");
    run();
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    assert.throws(() => run(), /001.*ordre|ordre.*001/i);
    assert.ok(!tables().includes("mk_a"));
  });
  test("noms de fichiers invalides et numéros en double refusés", () => {
    write("premiere.sql", "SELECT 1;");
    assert.throws(() => listMigrations(migDir), /premiere\.sql/);
    fs.unlinkSync(path.join(migDir, "premiere.sql"));
    write("001_a.sql", "SELECT 1;");
    write("001_b.sql", "SELECT 1;");
    assert.throws(() => listMigrations(migDir), /001/);
  });
  test("dossier de migrations absent : erreur claire (jamais un démarrage silencieux)", () => {
    assert.throws(() => migrate(db, { dir: path.join(dir, "absent"), dbPath: dbFile, backupDir, log: quiet }), /absent/);
  });
});

describe("sauvegarde automatique avant migration", () => {
  test("base contenant des données : copie valide créée AVANT d'appliquer, avec le bon préfixe", () => {
    seedUser();
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    const result = run();
    assert.ok(result.backup && fs.existsSync(result.backup));
    assert.ok(path.basename(result.backup).startsWith(BACKUP_PREFIX));
    const copy = new DatabaseSync(result.backup);
    assert.equal(copy.prepare("SELECT email FROM users").get().email, "a@b.fr");
    assert.ok(!copy.prepare("SELECT name FROM sqlite_master WHERE name = 'mk_a'").get(), "la sauvegarde date d'avant la migration");
    copy.close();
  });
  test("base vide (première installation) : pas de sauvegarde inutile", () => {
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    assert.equal(run().backup, null);
    assert.ok(!fs.existsSync(backupDir) || fs.readdirSync(backupDir).length === 0);
  });
  test("rien à appliquer : aucune sauvegarde", () => {
    seedUser();
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    const before = fs.readdirSync(backupDir).length;
    assert.equal(run().backup, null);
    assert.equal(fs.readdirSync(backupDir).length, before);
  });
  test("si la sauvegarde est impossible, la migration n'est PAS appliquée", () => {
    seedUser();
    fs.writeFileSync(backupDir, "je suis un fichier, pas un dossier");
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    assert.throws(() => run(), /sauvegarde/i);
    assert.ok(!tables().includes("mk_a"));
  });
  test("seules les 10 sauvegardes les plus récentes sont conservées ; les autres fichiers ne sont jamais touchés", () => {
    seedUser();
    fs.mkdirSync(backupDir);
    fs.writeFileSync(path.join(backupDir, "KOYEKOLA-2026-01-01-00-00.db"), "sauvegarde manuelle");
    for (let i = 1; i <= 12; i++) fs.writeFileSync(path.join(backupDir, `${BACKUP_PREFIX}2026-01-${String(i).padStart(2, "0")}-00-00-000-vXXX.db`), "x");
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    run();
    const mine = fs.readdirSync(backupDir).filter((f) => f.startsWith(BACKUP_PREFIX));
    assert.equal(mine.length, 10);
    assert.ok(fs.existsSync(path.join(backupDir, "KOYEKOLA-2026-01-01-00-00.db")), "la sauvegarde manuelle reste");
  });
  test("base en mémoire : pas de sauvegarde, les migrations s'appliquent", () => {
    const mem = new DatabaseSync(":memory:");
    write("001_a.sql", "CREATE TABLE mk_a (id INTEGER PRIMARY KEY);");
    assert.equal(migrate(mem, { dir: migDir, dbPath: ":memory:", backupDir, log: quiet }).backup, null);
  });
});
