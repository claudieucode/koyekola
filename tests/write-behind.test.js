// Écriture groupée des compteurs d'audience (src/utils/writeBehind.js) : unité (temps de validation, atomicité, arrêt) et parcours HTTP réel.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { startServer, Client, loginInstructor } = require("./helpers.js");

const ROOT = path.join(__dirname, "..");
const until = async (fn, ms = 8000) => { const end = Date.now() + ms; for (;;) { const v = fn(); if (v) return v; if (Date.now() > end) return v; await new Promise((r) => setTimeout(r, 50)); } };

describe("écriture groupée — unité", () => {
  // Chaque scénario tourne dans un processus à part : le module lit son réglage au chargement et ouvre la base choisie par DATA_DIR
  const run = (script, env = {}) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wb-"));
    const r = spawnSync(process.execPath, ["-e", script], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATA_DIR: dir, NODE_ENV: "test", ENCRYPTION_KEY: "0".repeat(64), ...env } });
    fs.rmSync(dir, { recursive: true, force: true });
    return r;
  };
  const PRE = `const db = require("./src/config/database"); const wb = require("./src/utils/writeBehind");
    db.exec("CREATE TABLE IF NOT EXISTS cpt (id INTEGER PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0); INSERT OR IGNORE INTO cpt (id) VALUES (1)");
    const val = () => db.prepare("SELECT n FROM cpt WHERE id = 1").get().n; const inc = () => db.prepare("UPDATE cpt SET n = n + 1 WHERE id = 1").run();`;

  test("sans activation (tests, scripts, outils), l'écriture est immédiate ; le serveur l'active au démarrage", () => {
    const r = run(`${PRE} console.log(JSON.stringify({ imm: !wb.enabled(), v: (wb.defer(inc), val()) }))`);
    assert.deepEqual(JSON.parse(r.stdout.trim()), { imm: true, v: 1 }, r.stderr);
  });

  test("groupée : rien n'est écrit avant la validation, puis tout l'est en une seule transaction", () => {
    const r = run(`${PRE} const out = {}; for (let i = 0; i < 100; i++) wb.defer(inc); out.avant = val(); out.file = wb.pending();
      let commits = 0; const exec = db.exec.bind(db); db.exec = (s) => { if (/^COMMIT/.test(s)) commits++; return exec(s); };
      out.vides = wb.flush(); out.apres = val(); out.commits = commits; out.file2 = wb.pending(); console.log(JSON.stringify(out))`, { KW_WRITE_BEHIND_MS: "60000" });
    assert.deepEqual(JSON.parse(r.stdout.trim()), { avant: 0, file: 100, vides: 100, apres: 100, commits: 1, file2: 0 }, r.stderr);
  });

  test("une écriture en échec ne fait pas perdre les autres", () => {
    const r = run(`${PRE} wb.defer(inc); wb.defer(() => { throw new Error("boum"); }); wb.defer(inc); wb.flush(); console.log(val())`, { KW_WRITE_BEHIND_MS: "60000" });
    assert.equal(r.stdout.trim(), "2");
    assert.match(r.stderr, /Écriture groupée des compteurs : boum/);
  });

  test("500 écritures déclenchent la validation sans attendre la minuterie", () => {
    const r = run(`${PRE} for (let i = 0; i < 500; i++) wb.defer(inc); console.log(JSON.stringify({ v: val(), file: wb.pending() }))`, { KW_WRITE_BEHIND_MS: "60000" });
    assert.deepEqual(JSON.parse(r.stdout.trim()), { v: 500, file: 0 });
  });

  test("appelée dans une transaction de l'appelant : pas d'imbrication, la validation suit", () => {
    const r = run(`${PRE} (async () => { for (let i = 0; i < 499; i++) wb.defer(inc); db.exec("BEGIN"); wb.defer(inc); const dedans = val(); db.exec("COMMIT");
      await new Promise((r) => setTimeout(r, 50)); console.log(JSON.stringify({ dedans, apres: val(), file: wb.pending() })); })()`, { KW_WRITE_BEHIND_MS: "60000" });
    const o = JSON.parse(r.stdout.trim());
    assert.deepEqual(o, { dedans: 0, apres: 500, file: 0 }, r.stderr);
  });

  test("arrêt normal du processus : la file est vidée", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wb-"));
    const env = { ...process.env, DATA_DIR: dir, NODE_ENV: "test", ENCRYPTION_KEY: "0".repeat(64), KW_WRITE_BEHIND_MS: "60000" };
    spawnSync(process.execPath, ["-e", `${PRE} for (let i = 0; i < 7; i++) wb.defer(inc); console.log("sortie", val())`], { cwd: ROOT, encoding: "utf8", env });
    const r = spawnSync(process.execPath, ["-e", `const db = require("./src/config/database"); console.log(db.prepare("SELECT n FROM cpt WHERE id = 1").get().n)`], { cwd: ROOT, encoding: "utf8", env });
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(r.stdout.trim(), "7");
  });
});

describe("écriture groupée — serveur réel (réglage de production simulé)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "", KW_WRITE_BEHIND_MS: "300" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(async () => { db.close(); await srv.stop(); });

  test("lectures d'article et journal des 404 : comptés après la fenêtre de groupage, robots et formateur exclus", async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article compté", content: "<p>Texte</p>", status: "published" })) fd.append(k, v);
    const saved = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    const human = { "user-agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
    const anon = new Client(srv.base);
    for (let i = 0; i < 5; i++) assert.equal((await anon.get(`/blog/${saved.slug}`, { headers: human })).status, 200);
    await anon.get(`/blog/${saved.slug}`, { headers: { "user-agent": "Googlebot/2.1" } }); // robot : non compté
    await boss.get(`/blog/${saved.slug}`, { headers: human }); // formateur : non compté
    for (let i = 0; i < 3; i++) await anon.get("/page-qui-nexiste-pas-xyz", { headers: human });
    assert.equal(await until(() => (db.prepare("SELECT views FROM posts WHERE slug = ?").get(saved.slug).views === 5 ? 5 : 0)), 5, "5 lectures humaines comptées");
    const row = await until(() => { const r = db.prepare("SELECT hits_human, hits_bot FROM seo_404 WHERE path = '/page-qui-nexiste-pas-xyz'").get(); return r && r.hits_human === 3 ? r : null; });
    assert.ok(row, "3 visites humaines sur la page introuvable");
  });

  test("la page répond sans attendre l'écriture : aucune écriture dans la requête elle-même", async () => {
    const before = db.prepare("SELECT views FROM posts ORDER BY id DESC LIMIT 1").get().views;
    const slug = db.prepare("SELECT slug FROM posts ORDER BY id DESC LIMIT 1").get().slug;
    const t = Date.now();
    const r = await new Client(srv.base).get(`/blog/${slug}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/120" } });
    assert.equal(r.status, 200);
    assert.equal(db.prepare("SELECT views FROM posts WHERE slug = ?").get(slug).views, before, "pas encore écrit à la fin de la réponse");
    assert.ok(Date.now() - t < 5000);
    assert.equal(await until(() => (db.prepare("SELECT views FROM posts WHERE slug = ?").get(slug).views === before + 1 ? 1 : 0)), 1, "puis écrit");
  });
});

describe("activation par le serveur", () => {
  test("server.js active l'écriture groupée hors test ; enable() la déclenche dans un processus quelconque", () => {
    assert.match(fs.readFileSync(path.join(ROOT, "server.js"), "utf8"), /NODE_ENV !== "test"\) require\("\.\/src\/utils\/writeBehind"\)\.enable\(\)/);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wb-"));
    const r = spawnSync(process.execPath, ["-e", `const db = require("./src/config/database"); const wb = require("./src/utils/writeBehind");
      db.exec("CREATE TABLE cpt (n INTEGER)"); db.exec("INSERT INTO cpt VALUES (0)"); const inc = () => db.prepare("UPDATE cpt SET n = n + 1").run();
      wb.defer(inc); const avant = db.prepare("SELECT n FROM cpt").get().n; wb.enable(); wb.defer(inc); const pendant = db.prepare("SELECT n FROM cpt").get().n; wb.flush();
      console.log(JSON.stringify({ avant, pendant, apres: db.prepare("SELECT n FROM cpt").get().n }))`], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATA_DIR: dir, NODE_ENV: "test", ENCRYPTION_KEY: "0".repeat(64) } });
    fs.rmSync(dir, { recursive: true, force: true });
    assert.deepEqual(JSON.parse(r.stdout.trim()), { avant: 1, pendant: 1, apres: 2 }, r.stderr);
  });
});
