// Persistance des médias : diagnostic de l'emplacement, récupération des fichiers restés dans d'anciens builds
// (structure Hostinger …/hbuilds/<build>/…), audit VALID / MISSING / TEMPORARY_URL — en lecture seule.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { recoverUploads } = require("../src/config/recoverUploads");
const { storageInfo, auditMedia } = require("../src/config/mediaAudit");

let tmp;
before(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kolakisa-medias-")); });
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const write = (p, data = "x") => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };

describe("emplacement des fichiers envoyés", () => {
  test("dans le dossier d'un build Hostinger : signalé comme perdu au prochain déploiement ; dossier conservé : OK", () => {
    const app = path.join(tmp, "domains/site/hbuilds/b2/nodejs");
    fs.mkdirSync(path.join(app, "uploads"), { recursive: true });
    const bad = storageInfo({ uploadsRoot: path.join(app, "uploads"), projectRoot: app, dataDir: path.join(tmp, "domains/site/data") });
    assert.equal(bad.deployedBuild, true);
    assert.equal(bad.uploadsInsideApp, true);
    assert.equal(bad.dataInsideApp, false);
    fs.mkdirSync(path.join(tmp, "domains/site/data/uploads"), { recursive: true });
    const good = storageInfo({ uploadsRoot: path.join(tmp, "domains/site/data/uploads"), projectRoot: app, dataDir: path.join(tmp, "domains/site/data") });
    assert.equal(good.uploadsInsideApp, false);
  });
});

describe("récupération au démarrage (structure hbuilds)", () => {
  test("les images restées dans un ancien build sont recopiées dans le dossier conservé, sans rien écraser ni supprimer", async () => {
    const site = path.join(tmp, "r1/domains/site");
    const oldApp = path.join(site, "hbuilds/build-old/nodejs"), newApp = path.join(site, "hbuilds/build-new/nodejs");
    write(path.join(oldApp, "uploads/thumbnails/perdue.png"), "PNG-ANCIEN");
    write(path.join(oldApp, "uploads/thumbnails/deja.png"), "ANCIENNE VERSION");
    fs.mkdirSync(path.join(newApp, "uploads"), { recursive: true });
    const kept = path.join(site, "data/uploads");
    write(path.join(kept, "thumbnails/deja.png"), "VERSION CONSERVÉE");
    const logs = [];
    const r = await recoverUploads({ uploadsRoot: kept, projectRoot: newApp, projectUploads: path.join(newApp, "uploads"), log: (m) => logs.push(m) });
    assert.equal(r.copied, 1);
    assert.equal(fs.readFileSync(path.join(kept, "thumbnails/perdue.png"), "utf8"), "PNG-ANCIEN", "image retrouvée");
    assert.equal(fs.readFileSync(path.join(kept, "thumbnails/deja.png"), "utf8"), "VERSION CONSERVÉE", "jamais écrasée");
    assert.ok(fs.existsSync(path.join(oldApp, "uploads/thumbnails/perdue.png")), "rien supprimé à la source");
    assert.match(logs.join("\n"), /1 fichier\(s\) recopié\(s\)/);
  });
  test("poste de développement ou tests (pas de build Hostinger) : rien n'est fait", async () => {
    const app = path.join(tmp, "dev/projet");
    write(path.join(app, "uploads/thumbnails/a.png"));
    const r = await recoverUploads({ uploadsRoot: path.join(tmp, "dev/ailleurs"), projectRoot: app, projectUploads: path.join(app, "uploads"), log: () => {} });
    assert.equal(r.skipped, true);
  });
});

describe("audit (lecture seule)", () => {
  test("références classées : valides, fichiers introuvables (avec l'endroit), adresses temporaires ; médiathèque et orphelins", () => {
    const up = path.join(tmp, "audit/uploads");
    write(path.join(up, "thumbnails/ok.png"));
    write(path.join(up, "thumbnails/sans-fiche.png"));
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, cover_path TEXT, og_image_path TEXT, twitter_image_path TEXT); CREATE TABLE media (path TEXT);");
    db.prepare("INSERT INTO posts (title, content, cover_path) VALUES (?, ?, ?)").run("Article A", '<img src="/uploads/thumbnails/ok.png"><img src="/uploads/thumbnails/disparue.png"><img src="blob:https://kolakisa.com/123">', "/uploads/thumbnails/ok.png");
    db.prepare("INSERT INTO media (path) VALUES (?), (?)").run("/uploads/thumbnails/ok.png", "/uploads/thumbnails/disparue.png");
    const a = auditMedia(db, { uploadsRoot: up });
    assert.deepEqual(a.refs, { VALID: 1, MISSING: 1, TEMPORARY_URL: 1, EXTERNAL: 0 });
    assert.deepEqual(a.missing[0], { path: "/uploads/thumbnails/disparue.png", where: "Article « Article A »", table: "posts" });
    assert.deepEqual(a.library.blog, { valid: 1, missing: 1 });
    assert.equal(a.orphanFiles, 1, "fichier présent sans fiche : compté, conservé");
    assert.ok(fs.existsSync(path.join(up, "thumbnails/sans-fiche.png")), "l'audit ne supprime rien");
  });
});

describe("variable UPLOADS_DIR mal renseignée (cause racine en production)", () => {
  test("une valeur relative est ignorée : fichiers dans DATA_DIR/uploads, valeur jamais affichée dans les journaux", () => {
    const { execFileSync } = require("child_process");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-upenv-"));
    const secret = "Valeur-Relative-Secrete123";
    const out = execFileSync(process.execPath, ["-e", `
      const p = require(${JSON.stringify(path.join(__dirname, "../src/config/paths"))});
      const { DatabaseSync } = require("node:sqlite");
      const logs = [];
      require(${JSON.stringify(path.join(__dirname, "../src/config/mediaAudit"))}).logStartupAudit(new DatabaseSync(":memory:"), { log: (...a) => logs.push(a.join(" ")), warn: (...a) => logs.push(a.join(" ")) });
      console.log(JSON.stringify({ root: p.uploadsRoot, ignored: p.uploadsEnvIgnored, logs }));`], { cwd: dir, env: { ...process.env, DATA_DIR: path.join(dir, "data"), UPLOADS_DIR: secret, NODE_ENV: "test" } }).toString();
    const r = JSON.parse(out.trim().split("\n").pop());
    assert.equal(r.ignored, true);
    assert.equal(fs.realpathSync(r.root), fs.realpathSync(path.join(dir, "data", "uploads")));
    assert.ok(!fs.existsSync(path.join(dir, secret)), "aucun dossier créé avec la valeur relative");
    assert.ok(r.logs.some((l) => l.includes("UPLOADS_DIR n'est pas un chemin absolu")));
    assert.ok(r.logs.every((l) => !l.includes(secret)), "la valeur n'apparaît dans aucun journal");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("récupération : un ancien dossier d'envois mal nommé (structure thumbnails + marketing) est retrouvé", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-hb2-"));
    const hb = path.join(dir, "domains", "site", "hbuilds");
    const app = path.join(hb, "versions", "new", "nodejs");
    const old = path.join(hb, "versions", "old", "nodejs", "Nom-Bizarre");
    write(path.join(old, "thumbnails", "perdue.png"), "IMG");
    fs.mkdirSync(path.join(old, "marketing"), { recursive: true });
    const keep = path.join(dir, "keep", "uploads");
    fs.mkdirSync(app, { recursive: true });
    const r = await recoverUploads({ log: () => {}, uploadsRoot: keep, projectRoot: app, projectUploads: path.join(app, "uploads") });
    assert.equal(r.copied, 1);
    assert.equal(fs.readFileSync(path.join(keep, "thumbnails", "perdue.png"), "utf8"), "IMG");
    assert.ok(fs.existsSync(path.join(old, "thumbnails", "perdue.png")), "la source n'est jamais supprimée");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
