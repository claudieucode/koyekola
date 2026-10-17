// R8 lot 6E — SEO et import d'un site dans un VRAI Chrome (Playwright) : l'administrateur d'Alpha règle le SEO de son site, crée une redirection, consulte ses 404, importe un fichier (aperçu, analyse, lancement) ;
// il ne voit rien de Bravo. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("SEO et import d'un site dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, db, browser, adminA, A, B, errors = [];
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const hostGet = (host, p) => new Promise((resolve, reject) => { const u = new URL(srv.base); http.request({ host: u.hostname, port: u.port, path: p, headers: { Host: host } }, (r) => { let t = ""; r.on("data", (d) => (t += d)); r.on("end", () => resolve({ status: r.statusCode, location: r.headers.location, text: t })); }).on("error", reject).end(); });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Alpha Chrome"); B = await mkSite("Bravo Chrome");
    for (const [site, url] of [[A, "https://un.test"], [B, "https://deux.test"]]) {
      const cur = JSON.parse((await boss.get(`${SP}/${site}/reglages.json`)).text);
      assert.equal((await boss.request(`${SP}/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: { Origin: srv.base } })).status, 200);
    }
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-bravo', '/b', 301, ?)").run(B);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, 'secret.chrome@ex.cd', 'Original-Chrome', ?)").run(B);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(A, adminA.email);
    await hostGet("un.test", "/introuvable-alpha"); await hostGet("deux.test", "/introuvable-bravo");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) { db.close(); await srv.stop(); } });

  test("réglages SEO, redirection et 404 du site dans le cadre du site ; import avec analyse obligatoire ; aucune donnée de Bravo", async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...adminA.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    // réglages
    await page.goto(srv.base + `${SP}/${A}/seo`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Alpha Chrome" }).isVisible());
    await page.locator("#seo-site_name").fill("Alpha Officiel Chrome"); await page.locator("#seo-org_name").fill("Alpha SA");
    await page.locator('#seo-site-form button[type="submit"]').click(); await page.waitForURL(new RegExp(`/sites/${A}/seo`));
    assert.equal(one("SELECT value v FROM seo_site_settings WHERE site_id = ? AND key = 'site_name'", A).v, JSON.stringify("Alpha Officiel Chrome"));
    assert.match(await page.locator("main").innerText(), /enregistrés/);
    // redirection
    await page.goto(srv.base + `${SP}/${A}/redirections`);
    await page.locator("#rd-source").fill("/ancien-alpha"); await page.locator("#rd-target").fill("/nouveau-alpha"); await page.locator('#nouvelle button[type="submit"]').click();
    await page.waitForURL(new RegExp(`/sites/${A}/redirections`));
    const table = await page.locator("#seo-redirects-table").innerText(); assert.match(table, /ancien-alpha/); assert.doesNotMatch(table, /ancien-bravo/);
    assert.equal((await hostGet("un.test", "/ancien-alpha")).location, "/nouveau-alpha");
    // 404
    await page.goto(srv.base + `${SP}/${A}/seo/404`);
    const nf = await page.locator("main").innerText(); assert.match(nf, /introuvable-alpha/); assert.doesNotMatch(nf, /introuvable-bravo/);
    // import : analyse obligatoire
    await page.goto(srv.base + `${SP}/${A}/importer`);
    await page.locator('input[type="file"]').setInputFiles({ name: "contacts.csv", mimeType: "text/csv", buffer: Buffer.from("E-mail,Prénom\nsecret.chrome@ex.cd,Pirate\nnouveau.chrome@ex.cd,Nouveau\n") });
    await page.locator('form[enctype="multipart/form-data"] button[type="submit"]').click(); await page.waitForURL(new RegExp(`/sites/${A}/importer/\\d+`));
    const impId = Number(page.url().match(/importer\/(\d+)/)[1]); assert.equal(one("SELECT site_id s FROM mk_imports WHERE id = ?", impId).s, A);
    await page.getByRole("button", { name: /Lancer l'import/ }).click(); await page.waitForLoadState();
    assert.equal(one("SELECT status s FROM mk_imports WHERE id = ?", impId).s, "previewed", "pas de lancement sans analyse");
    await page.getByRole("button", { name: /Analyser/ }).click(); await page.waitForLoadState();
    await page.getByRole("button", { name: /Lancer l'import/ }).click(); await page.waitForLoadState();
    assert.equal(one("SELECT status s FROM mk_imports WHERE id = ?", impId).s, "done");
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE email = 'secret.chrome@ex.cd'").f, "Original-Chrome", "contact de Bravo intact");
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_requests WHERE site_id = ?", A).n, 1);
    assert.doesNotMatch(await page.locator("main").innerText(), /Original-Chrome|Bravo Chrome/);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
