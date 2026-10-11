// KOLAKISA CMS — palier 21 en vrai Chrome : le tableau de bord s'affiche sans erreur, sans débordement (ordinateur et mobile), les filtres agissent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("tableau de bord Analytics (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors;
  const now = Date.now();
  const open = async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    for (let i = 0; i < 12; i++) {
      const v = `chrome${String(i).padStart(10, "0")}.${1700000000000 + i}`;
      db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen, sessions) VALUES (?, ?, ?, ?, 1)").run(v, org, now - 86400000, now);
      db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, device, utm_source, utm_medium, occurred_at) VALUES (?, ?, ?, 'session_start', '/blog/article-long-titre-avec-beaucoup-de-caracteres-pour-tester-le-debordement', ?, 'google', 'cpc', ?)").run(org, v, `s${i}xxxxxxxxx`, i % 2 ? "mobile" : "desktop", now - 7200000 - i);
      db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, device, occurred_at) VALUES (?, ?, ?, 'page_view', '/blog/article-long-titre-avec-beaucoup-de-caracteres-pour-tester-le-debordement', ?, ?)").run(org, v, `s${i}xxxxxxxxx`, i % 2 ? "mobile" : "desktop", now - 7100000 - i);
    }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); srv.stop(); });

  test("ordinateur et mobile : affichage, aucun débordement horizontal, aucune erreur de console", async () => {
    for (const width of [1280, 375]) {
      const page = await open(width);
      await page.goto(`${srv.base}/marketing/analytics/global`);
      await page.waitForSelector("h1");
      assert.match(await page.textContent("main, body"), /Pages vues/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `débordement horizontal de ${overflow}px à ${width}px`);
      await page.context().close();
    }
    assert.deepEqual(errors, []);
  });
  test("le filtre d'appareil agit et la période personnalisée sans donnée affiche l'état honnête", async () => {
    const page = await open(1280);
    await page.goto(`${srv.base}/marketing/analytics/global`);
    const visitorsAll = await page.textContent(".mk-stats .mk-stat:nth-child(1) .mk-stat-value");
    await page.selectOption("#an-app", "mobile");
    await Promise.all([page.waitForNavigation(), page.click("form.mk-filterbar button[type=submit]")]);
    const visitorsMobile = await page.textContent(".mk-stats .mk-stat:nth-child(1) .mk-stat-value");
    assert.equal(visitorsAll.trim(), "12"); assert.equal(visitorsMobile.trim(), "6");
    await page.goto(`${srv.base}/marketing/analytics/global?plage=custom&du=2020-01-01&au=2020-01-31`);
    assert.match(await page.textContent("body"), /Aucune donnée disponible pour cette période/);
    assert.equal((await page.textContent(".mk-stats .mk-stat:nth-child(1) .mk-stat-value")).trim(), "—");
    await page.context().close();
    assert.deepEqual(errors, []);
  });
});
