// KOLAKISA CMS — palier 7 : parcours en vrai Chrome (administration : ajout par recherche, glisser-déposer persisté ;
// site public : sous-menus au clavier, Échap, tiroir mobile, tablette, pas de défilement horizontal).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("navigation (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, menuId;
  const NAV = "/marketing/site-web/navigation";
  const open = async (width = 1280, cookies = false) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    if (cookies) await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const labels = () => db.prepare("SELECT label FROM nav_items WHERE menu_id = ? AND parent_id IS NULL ORDER BY position").all(menuId).map((r) => r.label);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, published_at) VALUES (?, 'Tarifs', 'tarifs', 'Nos tarifs', 'published', datetime('now'))").run(org);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("administration : créer un menu, ajouter une page trouvée par la recherche, un lien personnalisé ; tout persiste", async () => {
    const page = await open(1280, true);
    await page.goto(`${srv.base}${NAV}`);
    await page.click("[data-mk-modal-open=nouveau-menu]");
    await page.fill("#menu-name", "Menu navigateur");
    await page.click("#nouveau-menu button[type=submit]");
    await page.waitForSelector("[data-nav-tree]", { state: "attached" });
    menuId = db.prepare("SELECT id FROM nav_menus WHERE name = 'Menu navigateur'").get().id;
    await page.fill("#ns-page", "tarifs");
    await page.waitForSelector("[data-nav-picker][data-type=page] input[type=checkbox]");
    await page.check("[data-nav-picker][data-type=page] input[type=checkbox]");
    await page.click("[data-nav-picker][data-type=page] button[type=submit]");
    await page.waitForSelector(".mk-nav-item", { state: "attached" });
    await page.locator("summary", { hasText: "Lien personnalisé" }).click();
    await page.fill("#cu-label", "Contact");
    await page.fill("#cu-url", "/contact");
    await page.locator("form:has(#cu-label) button[type=submit]").click();
    await page.waitForFunction(() => document.querySelectorAll(".mk-nav-item").length >= 2);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?").get(menuId).n, 2);
    await page.reload();
    assert.equal(await page.locator(".mk-nav-item").count(), 2);
  });

  test("glisser-déposer : l'ordre et l'imbrication sont écrits en base et survivent au rechargement", async () => {
    const page = await open(1280, true);
    await page.goto(`${srv.base}${NAV}/menus/${menuId}`);
    const first = page.locator(".mk-nav-item").nth(0), second = page.locator(".mk-nav-item").nth(1);
    const firstLabel = (await first.locator(".mk-nav-label").first().innerText()).trim();
    await second.locator("[data-nav-handle]").first().dragTo(first.locator(".mk-nav-row").first(), { targetPosition: { x: 40, y: 3 } });
    await page.waitForFunction(() => /Ordre enregistré/.test(document.querySelector("[data-nav-status]").textContent));
    assert.equal(labels()[0], "Contact");
    await page.reload();
    assert.equal((await page.locator(".mk-nav-item .mk-nav-label").first().innerText()).trim(), "Contact");
    // dépôt « dans » un élément : devient son sous-élément
    const items = page.locator(".mk-nav-tree > .mk-nav-item");
    await items.nth(1).locator("[data-nav-handle]").first().dragTo(items.nth(0).locator(".mk-nav-row").first());
    await page.waitForFunction(() => /Ordre enregistré/.test(document.querySelector("[data-nav-status]").textContent));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ? AND parent_id IS NOT NULL").get(menuId).n, 1);
    assert.ok(firstLabel);
  });

  test("affectation à l'en-tête puis site public : bureau, sous-menu au clavier (Tab, Entrée, Échap, focus), aucun défilement horizontal", async () => {
    await boss.post(`${NAV}/emplacements`, { header: String(menuId) });
    const page = await open(1280);
    await page.goto(srv.base);
    const toggle = page.locator(".nav-sub-toggle").first();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await toggle.focus();
    await page.keyboard.press("Enter");
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator(".nav-sub").first().isVisible(), true);
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement.closest(".nav-sub") !== null), "le focus entre dans le sous-menu");
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await page.evaluate(() => document.activeElement.className), "nav-sub-toggle", "le focus revient au bouton");
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
  });

  test("tablette (820 px) et mobile (375 px) : tiroir, sous-menu qui se déplie, Échap ferme, pas de débordement", async () => {
    for (const width of [820, 375]) {
      const page = await open(width);
      await page.goto(srv.base);
      await page.click("#openMenuBtn");
      await page.waitForSelector("#headerNav.is-open");
      const t = page.locator("#headerNav .nav-sub-toggle").first();
      await t.click();
      assert.equal(await t.getAttribute("aria-expanded"), "true");
      assert.equal(await page.locator("#headerNav .nav-sub").first().isVisible(), true);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${width}px`);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#headerNav.is-open").count(), 0);
    }
  });

  test("administration à 375 px : pas de défilement horizontal ; aucune erreur JavaScript sur tout le parcours", async () => {
    const page = await open(375, true);
    await page.goto(`${srv.base}${NAV}/menus/${menuId}`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    assert.deepEqual(errors, []);
  });
});
