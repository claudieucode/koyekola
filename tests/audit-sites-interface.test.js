// Audit des sites depuis l'interface (Centre de gestion → Sauvegardes) : lecture seule d'une sauvegarde existante, nombres uniquement, accès réservé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, A, B, pA, pB, funnelA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const AUDIT = "/formateur/gestion/sauvegardes/audit-sites";
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
async function backupNames(client) {
  const html = (await client.get("/formateur/gestion/sauvegardes")).text;
  return [...html.matchAll(/audit-sites\?source=([^"&]+)"/g)].map((m) => decodeURIComponent(m[1])).filter((n) => n !== "active");
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  const mk = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
  A = mk("Boutique Confidentielle"); B = mk("Cabinet Secret");
  const pg = (s, n) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)").run(orgId, n, n.toLowerCase().replace(/\W+/g, "-"), n, s).lastInsertRowid);
  pA = pg(A, "Page Alpha"); pB = pg(B, "Page Beta");
  funnelA = Number(db.prepare("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, 'Tunnel A', ?)").run(orgId, A).lastInsertRowid);
  db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, 'personne.privee@exemple.test', 'unknown')").run(orgId);
});
after(() => srv.stop());

describe("audit des sites dans l'interface", () => {
  let cleanBackup, dirtyBackup;
  test("la page Sauvegardes propose l'audit ; une base saine donne « aucune anomalie »", async () => {
    await boss.post("/formateur/gestion/sauvegardes", {});
    const page = (await boss.get("/formateur/gestion/sauvegardes")).text;
    assert.match(page, /Analyser la base en service/);
    const names = await backupNames(boss);
    assert.ok(names.length >= 1);
    cleanBackup = names[0];
    const r = await boss.get(`${AUDIT}?source=${encodeURIComponent(cleanBackup)}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Aucune anomalie d(?:'|&#39;)isolation détectée/);
    assert.match(r.text, /2 sites au total/);
  });
  test("le résultat ne contient que des nombres : ni nom de site, ni e-mail, ni contenu", async () => {
    const r = await boss.get(`${AUDIT}?source=${encodeURIComponent(cleanBackup)}`);
    const body = r.text.slice(r.text.indexOf("<main") >= 0 ? r.text.indexOf("<main") : 0);
    for (const secret of ["Boutique Confidentielle", "Cabinet Secret", "Page Alpha", "Page Beta", "personne.privee@exemple.test", "Tunnel A"]) assert.ok(!body.includes(secret), `ne doit pas afficher « ${secret} »`);
  });
  test("une incohérence ancienne est détectée dans une sauvegarde, sans rien modifier (fichier et base inchangés)", async () => {
    // Donnée « d'avant le palier 2 » : le déclencheur est retiré le temps de la simuler
    db.exec("DROP TRIGGER mk_funnel_steps_same_site_insert");
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 1, 'page', 'E', ?)").run(orgId, funnelA, pB);
    await boss.post("/formateur/gestion/sauvegardes", {});
    const names = await backupNames(boss);
    dirtyBackup = names.find((n) => n !== cleanBackup);
    assert.ok(dirtyBackup);
    const file = path.join(srv.dir, "data", "backups", dirtyBackup);
    const before_ = sha(file);
    const counts = JSON.stringify(db.prepare("SELECT (SELECT COUNT(*) FROM mk_funnel_steps) a, (SELECT COUNT(*) FROM mk_landing_pages) b, (SELECT COUNT(*) FROM mk_sites) c").get());
    const r = await boss.get(`${AUDIT}?source=${encodeURIComponent(dirtyBackup)}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /1 point à examiner/);
    assert.match(r.text, /Étapes de tunnel qui utilisent la page d(?:'|&#39;)un autre site<\/td>\s*<td[^>]*>1</);
    assert.equal(sha(file), before_, "la sauvegarde n'a pas été modifiée");
    assert.equal(JSON.stringify(db.prepare("SELECT (SELECT COUNT(*) FROM mk_funnel_steps) a, (SELECT COUNT(*) FROM mk_landing_pages) b, (SELECT COUNT(*) FROM mk_sites) c").get()), counts, "la base en service n'a pas changé");
    assert.ok(!fs.existsSync(file + "-wal") && !fs.existsSync(file + "-shm"), "aucun fichier annexe créé");
  });
  test("la sauvegarde saine reste saine ; la base en service montre l'incohérence", async () => {
    assert.match((await boss.get(`${AUDIT}?source=${encodeURIComponent(cleanBackup)}`)).text, /Aucune anomalie/);
    const live = await boss.get(`${AUDIT}?source=active`);
    assert.equal(live.status, 200);
    assert.match(live.text, /Base en service \(lecture seule\)/);
    assert.match(live.text, /1 point à examiner/);
  });
  test("sources invalides : introuvable, sans fuite de chemin", async () => {
    for (const s of ["", "inexistant.db", "../../etc/passwd", "..%2F..%2Fdata%2FKOYEKOLA.db", "KOYEKOLA.db", "/etc/passwd"]) {
      const r = await boss.get(`${AUDIT}?source=${s}`);
      assert.equal(r.status, 404, s);
    }
  });
  test("accès : visiteur redirigé, élève refusé", async () => {
    const anon = new Client(srv.base);
    const a = await anon.get(`${AUDIT}?source=active`);
    assert.ok([302, 401, 403].includes(a.status));
    assert.notEqual(a.status, 200);
    const eleve = await newStudent(srv);
    const e = await eleve.get(`${AUDIT}?source=active`);
    assert.notEqual(e.status, 200);
    assert.doesNotMatch(e.text, /Aucune anomalie|point à examiner/);
  });
});
