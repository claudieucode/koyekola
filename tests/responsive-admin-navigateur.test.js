// Responsive de l'ADMINISTRATION dans un vrai Chrome (distinct du responsive des sites créés, testé par responsive-apercu / responsive-largeurs) :
// 6 largeurs de 320 à 1920 px sur les écrans clés — aucun défilement horizontal de la page, boîtes de dialogue dans la fenêtre, et, au tactile (≤ 768 px),
// champs à 16 px minimum (sinon iOS zoome à la prise de focus) et boutons de 44 px. Ignoré avec la raison si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const WIDTHS = [320, 390, 768, 1024, 1280, 1920];
const ROUTES = ["/marketing", "/marketing/site-web", "/marketing/site-web/sites", "/marketing/pages", "/marketing/contacts", "/marketing/campagnes", "/marketing/site-web/themes", "/marketing/site-web/parametres", "/marketing/site-web/apparence/menus", "/marketing/site-web/commentaires", "/marketing/site-web/utilisateurs/nouveau", "/marketing/analytics"];

describe("responsive de l'administration (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, site;
  const open = async (width) => {
    const touch = width <= 768;
    const context = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    return { context, page: await context.newPage(), touch };
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); const db = srv.db();
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site responsive', 'site-responsive', '{}')").run(orgId).lastInsertRowid); db.close();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("aucun défilement horizontal de la page, du téléphone très étroit au grand écran (12 écrans × 6 largeurs)", { timeout: 600000 }, async () => {
    const bad = [];
    for (const width of WIDTHS) {
      const { context, page } = await open(width);
      for (const route of ROUTES) {
        await page.goto(`${srv.base}${route}?site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(250);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (over > 1) bad.push(`${route} à ${width} px : ${over} px`);
      }
      await context.close();
    }
    assert.deepEqual(bad, []);
  });

  test("tactile : champs à 16 px minimum (pas de zoom automatique à la prise de focus) et boutons de 44 px sur les écrans de liste et de formulaire", { timeout: 300000 }, async () => {
    const bad = [];
    for (const width of [320, 390, 768]) {
      const { context, page } = await open(width);
      for (const route of ["/marketing/contacts", "/marketing/site-web/commentaires", "/marketing/site-web/utilisateurs/nouveau", "/marketing/site-web/themes"]) {
        await page.goto(`${srv.base}${route}?site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(250);
        const r = await page.evaluate(() => {
          const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden],details:not([open]) > :not(summary),dialog:not([open])"); };
          const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]), select, textarea")].filter(vis).filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.id || e.name || e.tagName);
          const btns = [...document.querySelectorAll(".mk-content .btn, .mk-content button.btn")].filter(vis).filter((e) => e.getBoundingClientRect().height < 43.5).map((e) => (e.textContent || "").trim().slice(0, 20));
          return { fields, btns };
        });
        if (r.fields.length) bad.push(`${route} à ${width} px : champs < 16 px ${r.fields.join(", ")}`);
        if (r.btns.length) bad.push(`${route} à ${width} px : boutons < 44 px ${r.btns.join(", ")}`);
      }
      await context.close();
    }
    assert.deepEqual(bad, []);
  });

  test("boîte de dialogue : reste dans la fenêtre (largeur et hauteur) aux largeurs de téléphone et de tablette", async () => {
    for (const width of [320, 390, 768]) {
      const { context, page } = await open(width);
      await page.goto(`${srv.base}/marketing/site-web/sites`, { waitUntil: "load" });
      await page.click("[data-mk-modal-open]"); await page.waitForSelector("dialog[open]"); await page.waitForTimeout(300);
      const r = await page.evaluate(() => { const b = document.querySelector("dialog[open]").getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, vw: innerWidth, vh: innerHeight }; });
      assert.ok(r.left >= -1 && r.right <= r.vw + 1 && r.top >= -1 && r.bottom <= r.vh + 1, `dialogue hors fenêtre à ${width} px : ${JSON.stringify(r)}`);
      await context.close();
    }
  });
});
