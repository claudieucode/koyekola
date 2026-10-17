// R8 lot 5 — ÉTAT DES LIEUX (aucune correction) : ce que l'isolation SEO garantit AUJOURD'HUI, et les écarts connus qui interdisent d'ouvrir le SEO ou l'import aux sites.
// Les tests « ÉCART CONNU » décrivent le comportement ACTUEL : ils doivent être réécrits (pas affaiblis) quand la correction autorisée sera livrée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("SEO : garanties actuelles et écarts (HTTP)", () => {
  let srv, boss, db, A, B, adminA, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Seo"); B = await mkSite("Bravo Seo");
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    const ins = db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES (?, ?, 301, ?)");
    ins.run("/ancien-alpha", "/nouveau-alpha", A); ins.run("/ancien-bravo", "/nouveau-bravo", B); ins.run("/ancien-global", "/nouveau-global", null);
  });
  after(() => { db.close(); return srv.stop(); });

  test("GARANTI — les 9 entrées SEO et la suite /formateur/seo restent fermées à un administrateur de site (rien du contenu n'est renvoyé)", async () => {
    for (const p of ["/formateur/seo", "/formateur/seo/reglages", "/formateur/seo/redirections", "/formateur/seo/erreurs-404", "/formateur/seo/technique", "/formateur/seo/audit",
      `/marketing/site-web/seo?site=${A}`, `/marketing/site-web/seo/robots?site=${A}`, `/marketing/site-web/seo/sitemap?site=${A}`]) {
      const r = await adminA.get(p); assert.notEqual(r.status, 200, p); assert.doesNotMatch(r.text, /ancien-(alpha|bravo|global)|robots_custom/, p);
    }
    assert.notEqual((await anon.get("/formateur/seo/redirections")).status, 200);
  });
  test("GARANTI — l'écran « Redirections » de l'espace d'un site ne liste que les redirections de CE site (ni un autre site, ni les redirections communes)", async () => {
    const r = await adminA.get(`${SP}/${A}/redirections`); assert.equal(r.status, 200);
    assert.match(r.text, /ancien-alpha/); assert.doesNotMatch(r.text, /ancien-bravo|ancien-global/);
    assert.equal((await adminA.get(`${SP}/${B}/redirections`)).status, 403, "le site d'un autre");
  });
  test("ÉCART CONNU 1 — redirections : « source_path » est UNIQUE pour toute l'organisation : deux sites ne peuvent pas avoir la même ancienne adresse", () => {
    assert.throws(() => db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-alpha', '/autre', 301, ?)").run(B), /UNIQUE/i);
  });
  test("ÉCART CONNU 2 — le journal des 404, les réglages SEO et le journal des modifications n'ont aucune colonne de site", () => {
    const cols = (t) => db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all().map((c) => c.name);
    for (const t of ["seo_404", "seo_settings", "seo_changes", "seo_meta"]) assert.ok(!cols(t).includes("site_id"), `${t} n'a pas de site_id`);
    for (const t of ["seo_audits", "seo_alerts", "seo_monitor_snapshots", "seo_jobs"]) { const c = cols(t); if (c.length) assert.ok(!c.includes("site_id"), `${t} n'a pas de site_id`); }
    assert.ok(cols("seo_redirects").includes("site_id"), "seul seo_redirects porte déjà un site (palier 12)");
  });
});

describe("Import de contacts : le service actuel n'est PAS sûr pour un accès limité à un site", () => {
  const imports = require("../src/marketing/import");
  const contactcore = require("../src/marketing/contactcore");
  let m, siteA, siteB, limitedA, contactB;
  before(() => {
    m = freshMarketing();
    const site = (n) => Number(m.db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(m.A.organizationId, n, n.toLowerCase()).lastInsertRowid);
    siteA = site("Alpha"); siteB = site("Bravo");
    contactB = contactcore.identify({ ...m.A, siteScope: undefined }, { email: "secret@bravo.cd", first_name: "Original", source: "admin", siteId: siteB }, {}).contact.id;
    limitedA = { ...m.A, siteScope: siteA };
  });
  test("ÉCART CONNU 3 — « mk_imports » n'a aucune colonne de site : un import (et ses lignes rejetées) est lisible par toute personne de l'organisation qui a le droit d'import", () => {
    assert.ok(!m.db.prepare("SELECT name FROM pragma_table_info('mk_imports')").all().some((c) => c.name === "site_id"));
    const p = imports.previewImport(m.A, { filename: "a.csv", data: Buffer.from("E-mail,Prénom\nx@ex.cd,X\n") });
    assert.ok(imports.getImport(limitedA, p.importId ?? p.id), "un accès limité à un autre site lit l'import d'un autre");
  });
  test("ÉCART CONNU 4 — l'import ne cherche pas les doublons selon la portée du site : une adresse connue d'un AUTRE site est trouvée et MODIFIÉE (aucune demande de rattachement)", () => {
    const text = "E-mail,Prénom\nsecret@bravo.cd,Ecrase\n";
    const p = imports.previewImport(limitedA, { filename: "b.csv", data: Buffer.from(text) });
    const id = p.importId ?? p.id;
    const r = imports.runImport(limitedA, id, { mapping: ["email", "first_name"], options: { updateExisting: "overwrite" } });
    const after = m.db.prepare("SELECT first_name FROM mk_contacts WHERE id = ?").get(contactB);
    const requests = m.db.prepare("SELECT COUNT(*) n FROM mk_contact_requests").get().n;
    assert.equal(after.first_name, "Ecrase", "le contact de l'autre site a été réécrit par un import limité au site A");
    assert.equal(requests, 0, "aucune demande de rattachement n'a été mise en file");
    assert.ok(r);
  });
});
