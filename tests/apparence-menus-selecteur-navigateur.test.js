// KOLAKISA CMS — Apparence → Menus dans un VRAI Chrome : le sélecteur de menu de l'éditeur change de menu, protège les modifications non enregistrées,
// et le menu latéral ne montre plus d'entrée « Navigation » (Menus est dans Apparence).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("menus : sélecteur et menu latéral (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, m1, m2, errors;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(org).lastInsertRowid);
    const menu = (n, slug) => Number(db.prepare("INSERT INTO nav_menus (name, slug, site_id, status) VALUES (?, ?, ?, 'published')").run(n, slug, A).lastInsertRowid);
    m1 = menu("Menu un", "menu-un"); m2 = menu("Menu deux", "menu-deux");
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });
  const open = async (width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    return page;
  };

  test("le menu latéral : Apparence contient Menus, aucune entrée « Navigation » ; l'ancienne adresse ouvre la même page", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${A}/navigation`);
    const side = page.locator("aside");
    await side.getByRole("link", { name: "Menus", exact: true }).waitFor();
    assert.equal(await side.getByRole("link", { name: "Navigation", exact: true }).count(), 0);
    assert.equal(await side.getByRole("link", { name: "Menus", exact: true }).first().getAttribute("aria-current"), "page");
    await page.context().close();
  });

  test("le sélecteur change de menu ; avec des modifications non enregistrées, il demande confirmation (refuser = rester) ; accepter = changer", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/navigation/menus/${m1}?site=${A}`);
    const pick = page.locator("[data-nm-pick]"); await pick.waitFor();
    assert.deepEqual((await pick.locator("option").allTextContents()).sort(), ["Menu deux", "Menu un"]);
    // menu non modifié : changement direct, sans confirmation
    let asked = 0; page.on("dialog", async (d) => { asked++; await d.dismiss(); });
    await Promise.all([page.waitForURL(new RegExp(`menu=${m2}`)), pick.selectOption({ label: "Menu deux" })]);
    assert.equal(asked, 0, "aucune confirmation sans modification");
    // modification : le nom change → confirmation, refusée : on reste sur le menu et le sélecteur reprend sa valeur
    await page.locator("#nm-name, [data-nm-name]").first().fill("Menu deux modifié");
    await page.locator("[data-nm-state].is-dirty").waitFor();
    await page.locator("[data-nm-pick]").selectOption({ label: "Menu un" });
    await page.waitForTimeout(300);
    assert.equal(asked, 1, "confirmation demandée");
    assert.match(page.url(), new RegExp(`menu=${m2}`), "refus : on reste");
    assert.equal(await page.locator("[data-nm-pick] option:checked").innerText(), "Menu deux");
    // accepter : on change
    page.removeAllListeners("dialog"); page.on("dialog", (d) => d.accept());
    await Promise.all([page.waitForURL(new RegExp(`menu=${m1}`)), page.locator("[data-nm-pick]").selectOption({ label: "Menu un" })]);
    assert.equal(db.prepare("SELECT name FROM nav_menus WHERE id = ?").get(m2).name, "Menu deux", "rien n'a été enregistré sans accord");
    await page.context().close();
  });

  test("téléphone (390 px) : le sélecteur ne déborde pas ; aucune erreur JavaScript", async () => {
    const page = await open(390);
    await page.goto(`${srv.base}/marketing/site-web/navigation/menus/${m1}?site=${A}`);
    await page.locator("[data-nm-pick]").waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de défilement horizontal");
    assert.deepEqual(errors, []);
    await page.context().close();
  });
});
