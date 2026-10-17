// R8 lot 5 → lot 6 — garanties d'isolation SEO et import. Les quatre « écarts connus » du lot 5 sont ici réécrits pour vérifier les CORRECTIONS livrées au lot 6 (migrations 090 et 091, résolution par site, import par site).
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
  test("CORRIGÉ (écart 1, migration 090) — redirections : l'ancienne adresse est unique PAR site : deux sites peuvent avoir la même, un même site ne peut pas l'avoir deux fois", () => {
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-alpha', '/autre-b', 301, ?)").run(B);            // même adresse, autre site : permis
    assert.throws(() => db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-alpha', '/x', 301, ?)").run(A), /UNIQUE/i, "deux fois pour le même site");
    assert.throws(() => db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-global', '/x', 301, NULL)").run(), /UNIQUE/i, "deux fois en commun");
  });
  test("CORRIGÉ (écart 2, migration 090) — le journal 404, le journal des modifications, les audits, les alertes et la surveillance portent le site ; les réglages d'un site ont leur table ; les réglages globaux restent globaux ; seo_meta reste par contenu", () => {
    const cols = (t) => db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all().map((c) => c.name);
    for (const t of ["seo_404", "seo_changes", "seo_redirects", "seo_audits", "seo_alerts", "seo_monitor_snapshots", "seo_site_settings"]) assert.ok(cols(t).includes("site_id"), `${t} : site_id`);
    for (const t of ["seo_settings", "seo_meta"]) assert.ok(!cols(t).includes("site_id"), `${t} : global / par contenu, sans site`);
  });
});

describe("Import de contacts : le service est sûr pour un accès limité à un site", () => {
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
  test("CORRIGÉ (écart 3, migration 091) — un import appartient à un site : un accès limité à un autre site ne le lit pas", () => {
    assert.ok(m.db.prepare("SELECT name FROM pragma_table_info('mk_imports')").all().some((c) => c.name === "site_id"));
    const p = imports.previewImport(m.A, { filename: "a.csv", data: Buffer.from("E-mail,Prénom\nx@ex.cd,X\n") });
    assert.equal(imports.getImport(limitedA, p.id), null, "un accès limité au site A ne lit pas un import d'équipe");
    const own = imports.previewImport(limitedA, { filename: "b.csv", data: Buffer.from("E-mail,Prénom\ny@ex.cd,Y\n") });
    assert.equal(m.db.prepare("SELECT site_id FROM mk_imports WHERE id = ?").get(own.id).site_id, siteA);
    assert.equal(imports.getImport({ ...m.A, siteScope: siteB }, own.id), null, "ni celui d'un autre site");
  });
  test("CORRIGÉ (écart 4) — l'import d'un site ne trouve plus, ne modifie plus un contact d'un AUTRE site : demande de rattachement, contact intact", () => {
    const p = imports.previewImport(limitedA, { filename: "c.csv", data: Buffer.from("E-mail,Prénom\nsecret@bravo.cd,Ecrase\n") });
    const options = { updateExisting: "overwrite" };
    imports.analyzeImport(limitedA, p.id, { mapping: ["email", "first_name"], options });
    imports.runImport(limitedA, p.id, { mapping: ["email", "first_name"], options });
    assert.equal(m.db.prepare("SELECT first_name FROM mk_contacts WHERE id = ?").get(contactB).first_name, "Original", "contact de l'autre site intact");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_requests WHERE email = 'secret@bravo.cd' AND site_id = ? AND status = 'pending'").get(siteA).n, 1, "demande de rattachement en file");
  });
});
