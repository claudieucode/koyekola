// OUTILS → OUTILS DISPONIBLES en vrai Chrome : grille, ouverture de chaque carte, contexte du site conservé, clair / sombre, mobile.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.DISPO_SHOTS || "";

describe("Outils disponibles (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors, siteId;
  const O = "/marketing/site-web/outils/disponibles";
  const open = async (width = 1300, height = 900, { dark = false } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? "dark" : "light" });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (dark) await context.addInitScript(() => { try { localStorage.setItem("kolaTheme", "dark"); } catch (e) { /* noop */ } });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("response", (r) => { if (r.status() >= 400 && r.request().resourceType() === "document") errors.push(`HTTP ${r.status()} ${r.url()}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Dispo navigateur" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("chaque carte du site ouvre sa vraie destination, sans erreur, dans le cadre du bon site", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}?site=${siteId}`);
    await page.waitForSelector(".mk-tc-card");
    await shot(page, "dispo-site-clair");
    const hrefs = await page.locator(".mk-tc-available h3 a").evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
    assert.ok(hrefs.length >= 9, `${hrefs.length} cartes`);
    for (const [name, href] of hrefs) {
      assert.ok(href.includes(`/sites/${siteId}/`) || href.includes(`site=${siteId}`), `${name} : ${href}`);
      const r = await page.goto(`${srv.base}${href}`);
      assert.equal(r.status(), 200, `${name} → ${href}`);
      assert.match(page.url(), new RegExp(`(/sites/${siteId}/|site=${siteId})`), `${name} garde le site`);
      assert.ok((await page.locator("h1").first().innerText()).trim().length > 0, `${name} : titre`);
    }
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("outils pas encore développés : aucun lien ni bouton ; mode sombre et téléphone sans débordement", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}`);
    const planned = page.locator(".mk-tc-planned");
    assert.equal(await planned.count(), 1);
    assert.equal(await planned.locator("a, button").count(), 0, "aucune action sur un outil inexistant");
    assert.match(await planned.first().innerText(), /Pas encore disponible/);
    await shot(page, "dispo-principal-clair");
    await page.context().close();
    const dark = await open(1300, 900, { dark: true });
    await dark.goto(`${srv.base}${O}?site=${siteId}`);
    assert.equal(await dark.locator("html").getAttribute("data-kola-theme"), "dark");
    await shot(dark, "dispo-sombre");
    await dark.context().close();
    for (const [w, h, n] of [[390, 844, "mobile"], [820, 1100, "tablette"]]) {
      const p = await open(w, h);
      await p.goto(`${srv.base}${O}?site=${siteId}`);
      assert.ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1, `${n} : pas de défilement horizontal`);
      const cols = await p.locator(".mk-tc-grid").first().evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(" ").length);
      if (n === "mobile") assert.equal(cols, 1);
      await shot(p, `dispo-${n}`);
      await p.context().close();
    }
    assert.deepEqual(errors, []);
  });
});
