// En-tête et pied de page dans un VRAI navigateur (Chrome piloté par Playwright) : l'ancienne adresse d'un site mène au Theme Builder
// (section En-tête / Pied de page), sans écran autonome ni erreur JavaScript. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("en-tête et pied de page : Theme Builder seul gestionnaire (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, siteId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Atelier navigateur" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [old, type] of [["en-tete", "header"], ["pied-de-page", "footer"]]) {
    test(`l'ancienne adresse « ${old} » ouvre le Theme Builder sur la section ${type}, sans erreur`, async () => {
      await page.goto(`${srv.base}/marketing/site-web/sites/${siteId}/reglages/${old}`);
      await page.waitForSelector("#tb");
      assert.match(page.url(), new RegExp(`/sites/${siteId}/constructeur-de-theme\\?type=${type}`));
      assert.equal(await page.locator("a[href*='/reglages/en-tete'], a[href*='/reglages/pied-de-page']").count(), 0, "aucun lien résiduel vers l'ancien écran");
      assert.deepEqual(errors, []);
    });
  }
});
