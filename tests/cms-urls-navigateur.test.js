// KOLAKISA CMS — palier 12 : le gestionnaire de redirections en vrai Chrome (création, modification, test réel, suppression, clavier,
// responsive) et la page de vérification des adresses.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("gestionnaire de redirections (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors;
  const R = "/marketing/site-web/redirections";
  const open = async (width = 1400, height = 900) => {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("ajouter une redirection par la fenêtre : enregistrée en base, appliquée par le serveur, message de confirmation", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}`);
    await page.click("[data-ur-new]");
    await page.waitForSelector("#ur-form[open]");
    await page.fill("#ur-source", "/ancienne-formation");
    await page.fill("#ur-target", "/catalogue");
    await page.click('#ur-form button[type="submit"]');
    await page.waitForSelector(".mk-flash-ok");
    assert.match(await page.locator(".mk-flash-ok").innerText(), /Redirection créée/);
    const row = db.prepare("SELECT * FROM seo_redirects WHERE source_path = '/ancienne-formation'").get();
    assert.equal(row.target, "/catalogue"); assert.equal(row.status, 301);
    const res = await fetch(`${srv.base}/ancienne-formation`, { redirect: "manual" });
    assert.equal(res.status, 301);
    await page.context().close();
  });

  test("une erreur de validation (boucle) affiche un message clair et n'enregistre rien", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}`);
    await page.click("[data-ur-new]");
    await page.fill("#ur-source", "/catalogue");
    await page.fill("#ur-target", "/ancienne-formation");
    await page.click('#ur-form button[type="submit"]');
    await page.waitForSelector(".mk-flash-error");
    assert.match(await page.locator(".mk-flash-error").innerText(), /[Bb]oucle/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/catalogue'").get().n, 0);
    await page.context().close();
  });

  test("Tester : le serveur est interrogé, les étapes réelles sont affichées", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}`);
    await page.click("[data-ur-test]");
    await page.waitForSelector("#ur-test[open] .mk-ur-steps");
    const text = await page.locator("#ur-test").innerText();
    assert.match(text, /\/ancienne-formation/);
    assert.match(text, /HTTP 301/);
    assert.match(text, /HTTP 200/);
    assert.match(text, /la destination répond \(200\)/);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#ur-test[open]").count(), 0, "Échap ferme la fenêtre");
    await page.context().close();
  });

  test("Modifier puis Supprimer (menu « … » au clavier) : la base suit", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}`);
    await page.click(".mk-cms-more");
    await page.click("[data-ur-edit]");
    await page.waitForSelector("#ur-form[open]");
    assert.equal(await page.inputValue("#ur-source"), "/ancienne-formation");
    await page.selectOption("#ur-status", "302");
    await page.click('#ur-form button[type="submit"]');
    await page.waitForSelector(".mk-flash-ok");
    assert.equal(db.prepare("SELECT status FROM seo_redirects WHERE source_path = '/ancienne-formation'").get().status, 302);
    await page.click(".mk-cms-more");
    await page.click("[data-ur-delete]");
    await page.waitForSelector("#ur-delete[open]");
    await page.click("#ur-delete button.btn-danger");
    await page.waitForSelector(".mk-flash-ok");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/ancienne-formation'").get().n, 0);
    await page.context().close();
  });

  test("responsive : liste, fenêtre et pages d'adresses ne débordent pas (ordinateur, tablette, mobile)", async () => {
    await fetch(`${srv.base}/`); // serveur chaud
    const csrf = null; void csrf;
    for (let i = 0; i < 3; i++) db.prepare("INSERT INTO seo_redirects (source_path, target, status) VALUES (?, ?, 301)").run(`/une-adresse-assez-longue-pour-tester-le-debordement-${i}-encore-plus-longue`, "/catalogue");
    for (const w of [1400, 820, 390]) {
      const page = await open(w, 900);
      for (const url of [R, "/marketing/site-web/liens-casses", "/marketing/site-web/permaliens"]) {
        await page.goto(`${srv.base}${url}`);
        await page.waitForSelector("main h1");
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `${url} à ${w}px : défilement horizontal de ${over}px`);
      }
      await page.goto(`${srv.base}${R}`);
      await page.click("[data-ur-new]");
      const box = await page.locator("#ur-form").boundingBox();
      assert.ok(box.width <= w, `fenêtre ${box.width}px dans ${w}px`);
      await page.context().close();
    }
  });

  test("liens cassés : le bouton lance l'analyse et affiche le rapport", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/liens-casses`);
    await page.click("[data-ur-scan] button");
    await page.waitForSelector(".mk-flash");
    assert.match(await page.locator("main").innerText(), /Dernière analyse/);
    await page.context().close();
  });

  test("aucune erreur de script ni de console", () => { assert.deepEqual(errors, []); });
});
