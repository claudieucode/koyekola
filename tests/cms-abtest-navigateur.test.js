// KOLAKISA CMS — palier 22 en vrai Chrome : liste et détail d'un test A/B sans erreur ni débordement (ordinateur et mobile), actions de l'écran, aucun faux gagnant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const pages = require("../src/marketing/pages");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("écrans des tests A/B (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, pageId, testId;
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
    pageId = Number(String((await boss.post("/marketing/pages", { name: "Page navigateur", template: "vente" })).location).match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(pageId);
    await boss.post(`/marketing/pages/${pageId}/test-ab`, { name: "Test navigateur", goal: "click", traffic_b: "50", confidence: "95" });
    const t = db.prepare("SELECT * FROM mk_page_tests WHERE page_id = ?").get(pageId); testId = t.id;
    const vp = pages.getPage({ db, organizationId: 1 }, t.variant_page_id);
    db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ ...vp.working, sections: vp.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Titre B navigateur" } : s)) }), vp.id);
    await boss.post(`/marketing/tests-ab/${testId}/demarrer`, {});
    // Données d'écran : 60 visiteurs par version, l'écart est trop petit pour conclure
    const ins = db.prepare("INSERT INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, ?, ?, ?, ?, 0)");
    for (const [v, conv] of [["a", 6], ["b", 9]]) for (let i = 0; i < 60; i++) { ins.run(testId, v, `${v}${i}`, "view", Date.now()); if (i < conv) ins.run(testId, v, `${v}${i}`, "conversion", Date.now()); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); srv.stop(); });

  test("liste et détail : ordinateur et mobile, aucun débordement, aucune erreur de console, aucun faux gagnant", async () => {
    for (const width of [1280, 375]) {
      const page = await open(width);
      for (const url of ["/marketing/site-web/tests-ab", `/marketing/pages/${pageId}/test-ab?test=${testId}`]) {
        await page.goto(srv.base + url);
        await page.waitForSelector("h1");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `débordement horizontal de ${overflow}px à ${width}px sur ${url}`);
      }
      const body = await page.textContent("body");
      assert.match(body, /Données insuffisantes : pas encore concluant/);
      assert.doesNotMatch(body, /Gagnant : version/);
      assert.match(body, /Taux de conversion/);
      await page.context().close();
    }
    assert.deepEqual(errors, []);
  });

  test("les actions de l'écran agissent : mise en pause puis reprise", async () => {
    const page = await open(1280);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/test-ab?test=${testId}`);
    await Promise.all([page.waitForNavigation(), page.click("button:has-text('Mettre en pause')")]);
    assert.equal(db.prepare("SELECT status FROM mk_page_tests WHERE id = ?").get(testId).status, "stopped");
    assert.match(await page.textContent("body"), /En pause/);
    await Promise.all([page.waitForNavigation(), page.click("button:has-text('Reprendre')")]);
    assert.equal(db.prepare("SELECT status FROM mk_page_tests WHERE id = ?").get(testId).status, "running");
    await page.context().close();
    assert.deepEqual(errors, []);
  });

  test("clavier : les actions principales sont atteignables (focus visible)", async () => {
    const page = await open(1280);
    await page.goto(`${srv.base}/marketing/site-web/tests-ab`);
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement && document.activeElement.className);
    assert.match(String(first), /skip-link/, "premier arrêt du clavier : lien d'accès au contenu");
    const focusables = await page.evaluate(() => [...document.querySelectorAll("main a, main button, main input, main select")].filter((e) => !e.disabled).length);
    assert.ok(focusables >= 5);
    await page.context().close();
  });
});
