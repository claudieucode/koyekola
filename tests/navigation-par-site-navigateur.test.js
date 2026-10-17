// R8 lot 4 — Navigation par site dans un VRAI Chrome (Playwright) : l'administrateur d'Alpha crée un menu dans son espace, le sélecteur de ressources (script) ne propose que SES pages,
// il ajoute une page, affecte le menu à l'en-tête ; il ne voit jamais les menus ni les pages de Bravo. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("navigation d'un site dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, db, browser, adminA, A, B, errors = [];
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Alpha Chrome"); B = await mkSite("Bravo Chrome");
    const page = (name, site) => db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (1, ?, ?, ?, 'published', ?)").run(name, name.toLowerCase().replace(/\W+/g, "-"), name, site);
    page("Page Alpha", A); page("Page Bravo", B); page("Page Principale", null);
    db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu Bravo', 'menu-bravo')").run(B);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(A, adminA.email);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) { db.close(); await srv.stop(); } });

  test("créer un menu dans l'espace du site, chercher une page (script), l'ajouter, l'affecter à l'en-tête ; rien d'un autre site n'apparaît", async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...adminA.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    await page.goto(srv.base + `${SP}/${A}/navigation`);
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Alpha Chrome" }).isVisible());
    assert.doesNotMatch(await page.locator("main").innerText(), /Menu Bravo/);
    await page.locator('[data-mk-modal-open="nouveau-menu"]').first().click();
    await page.locator('dialog[open] input[name="name"], #nouveau-menu input[name="name"]').first().fill("Menu Alpha Chrome");
    await page.locator('dialog[open] button[type="submit"], #nouveau-menu button[type="submit"]').first().click();
    await page.waitForURL(/\/navigation\/menus\/\d+/);
    assert.match(page.url(), new RegExp(`site=${A}`), "le site reste dans l'adresse du menu");
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Alpha Chrome" }).isVisible(), "cadre du site conservé");
    const menuId = Number(page.url().match(/menus\/(\d+)/)[1]); assert.equal(one("SELECT site_id s FROM nav_menus WHERE id = ?", menuId).s, A);
    const pickerInput = page.locator('[data-nav-picker][data-type="page"] [data-nav-search]');
    await pickerInput.fill("Page");
    await page.locator('[data-nav-picker][data-type="page"] [data-nav-results] li').first().waitFor();
    const found = await page.locator('[data-nav-picker][data-type="page"] [data-nav-results]').innerText();
    assert.match(found, /Page Alpha/); assert.doesNotMatch(found, /Page Bravo|Page Principale/, "le script ne propose que les pages du site");
    await page.locator('[data-nav-picker][data-type="page"] input[type="checkbox"]').first().check();
    await page.locator('[data-nav-picker][data-type="page"] button[type="submit"]').click();
    await page.waitForURL(/\/navigation\/menus\/\d+/);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", menuId).n, 1);
    assert.match(await page.locator("main").innerText(), /Page Alpha/);
    await page.goto(srv.base + `${SP}/${A}/navigation`);
    await page.locator("select").first().selectOption({ label: "Menu Alpha Chrome" }).catch(() => {});
    assert.deepEqual(errors, []);
    await context.close();
  });
});
