// Sauvegarde / restauration complètes (scripts/sauvegarde.js, scripts/restaurer.js) : parcours réel dans un dossier isolé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
let dir, env;
const run = (script, ...args) => spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...args], { env, encoding: "utf8" });
const count = (table) => {
  const d = new DatabaseSync(path.join(dir, "KOYEKOLA.db"));
  try { return d.prepare(`SELECT count(*) AS n FROM ${table}`).get().n; } finally { d.close(); }
};
const backups = (re) => fs.readdirSync(path.join(dir, "backups")).filter((f) => re.test(f));

describe("sauvegarde et restauration", () => {
  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-bk-"));
    env = { ...process.env, DATA_DIR: dir, SESSION_SECRET: "test", NODE_ENV: "test" };
    assert.equal(spawnSync(process.execPath, [path.join(ROOT, "src", "config", "seed.js")], { env }).status, 0, "seed de la base isolée");
    fs.writeFileSync(path.join(dir, "uploads", "thumbnails", "test.txt"), "v1");
  });
  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("la sauvegarde crée une base vérifiée ET une archive des fichiers", () => {
    const r = run("sauvegarde.js");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(backups(/^KOYEKOLA-\d{4}-.*\.db$/).length, 1);
    assert.equal(backups(/^KOYEKOLA-uploads-.*\.tar\.gz$/).length, 1);
  });

  test("restaurer sans --confirmer ne modifie rien", () => {
    const d = new DatabaseSync(path.join(dir, "KOYEKOLA.db"));
    d.exec("DELETE FROM order_items; DELETE FROM orders; DELETE FROM courses");
    d.close();
    fs.rmSync(path.join(dir, "uploads", "thumbnails", "test.txt"));
    const r = run("restaurer.js", backups(/^KOYEKOLA-\d{4}-.*\.db$/)[0]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /AUCUNE MODIFICATION/);
    assert.equal(count("courses"), 0);
  });

  test("restaurer --confirmer rend la base ET les fichiers, après une copie de sécurité", () => {
    const r = run("restaurer.js", backups(/^KOYEKOLA-\d{4}-.*\.db$/)[0], "--fichiers", backups(/^KOYEKOLA-uploads-.*\.tar\.gz$/)[0], "--confirmer");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(count("courses") > 0, "les formations sont revenues");
    assert.ok(count("orders") > 0, "les commandes sont revenues");
    assert.equal(fs.readFileSync(path.join(dir, "uploads", "thumbnails", "test.txt"), "utf8"), "v1");
    assert.equal(backups(/^AVANT-RESTAURATION-.*\.db$/).length, 1, "l'état précédent est conservé");
  });

  test("une sauvegarde corrompue ou introuvable est refusée sans toucher à la base", () => {
    fs.writeFileSync(path.join(dir, "backups", "KOYEKOLA-2099-bad.db"), "garbage");
    const before = count("courses");
    for (const name of ["KOYEKOLA-2099-bad.db", "inexistant.db"]) {
      const r = run("restaurer.js", name, "--confirmer");
      assert.notEqual(r.status, 0, name);
      assert.match(r.stderr, /ÉCHEC/);
    }
    assert.equal(count("courses"), before);
  });

  test("une archive contenant un chemin « .. » est refusée", () => {
    const evil = path.join(dir, "evil");
    fs.mkdirSync(evil);
    fs.writeFileSync(path.join(evil, "f.txt"), "x");
    // bsdtar (macOS) : -s ; GNU tar (Linux) : --transform
    const rename = process.platform === "darwin" ? ["-s", "|^f.txt|../escape.txt|"] : ["--transform", "s|^f.txt|../escape.txt|"];
    const made = spawnSync("tar", ["-czf", path.join(dir, "backups", "KOYEKOLA-uploads-evil.tar.gz"), ...rename, "-C", evil, "f.txt"]);
    assert.equal(made.status, 0, "archive piégée créée");
    const r = run("restaurer.js", backups(/^KOYEKOLA-\d{4}-.*\.db$/)[0], "--fichiers", "KOYEKOLA-uploads-evil.tar.gz", "--confirmer");
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /dangereux/);
    assert.ok(!fs.existsSync(path.join(dir, "escape.txt")));
  });
});
