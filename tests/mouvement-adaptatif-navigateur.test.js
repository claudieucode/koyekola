// Mouvement adaptatif dans un VRAI Chrome (public/js/kb-motion.js) : niveau « full » par défaut, « off » si le système demande moins de mouvement,
// « lite » sur appareil modeste / économie de données / fluidité mesurée insuffisante, choix explicite, retour automatique. Ignoré avec la raison
// si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("mouvement adaptatif (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const PAGE = "/marketing/site-web/sites";
  const open = async ({ init = "", reducedMotion = "no-preference", width = 1280 } = {}) => {
    const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    // profil neutre déterministe : 8 cœurs, 8 Go, pas d'économie de données (chaque test surcharge ce qu'il veut)
    await context.addInitScript(`Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8, configurable: true }); Object.defineProperty(navigator, "deviceMemory", { get: () => 8, configurable: true }); ${init}`);
    const page = await context.newPage();
    await page.goto(`${srv.base}${PAGE}`, { waitUntil: "load" });
    return page;
  };
  const level = (page) => page.evaluate(() => document.documentElement.getAttribute("data-kb-motion"));
  const dialogAnim = async (page) => {
    await page.click("[data-mk-modal-open]"); await page.waitForSelector("dialog[open]");
    const r = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector("dialog[open]")); return { name: cs.animationName, dur: parseFloat(cs.animationDuration) }; });
    await page.keyboard.press("Escape");
    return r;
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("profil normal : niveau « full », fenêtre animée (180 ms)", async () => {
    const page = await open();
    assert.equal(await level(page), "full");
    const a = await dialogAnim(page);
    assert.match(a.name, /kb-dialog-in/); assert.ok(a.dur > 0.1 && a.dur < 0.3, `durée ${a.dur}`);
    await page.context().close();
  });

  test("mouvement réduit demandé : niveau « off », aucune animation ni transition (durées quasi nulles)", async () => {
    const page = await open({ reducedMotion: "reduce" });
    assert.equal(await level(page), "off");
    const a = await dialogAnim(page);
    assert.ok(a.dur < 0.001, `animation encore active : ${a.dur}`);
    const t = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".mk-body .btn")).transitionDuration));
    assert.equal(t, 0, `transition encore active : ${t}`);
    await page.context().close();
  });

  test("appareil modeste (2 Go) ou économie de données : niveau « lite », fenêtre sans animation", async () => {
    for (const init of ['Object.defineProperty(navigator, "deviceMemory", { get: () => 2, configurable: true });', 'Object.defineProperty(navigator, "connection", { get: () => ({ saveData: true }), configurable: true });', 'Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2, configurable: true });']) {
      const page = await open({ init });
      assert.equal(await level(page), "lite", init);
      const a = await dialogAnim(page);
      assert.equal(a.name, "none", `animation de fenêtre active en « lite » : ${a.name}`);
      await page.context().close();
    }
  });

  test("choix explicite : KolaMotion.set() prime sur la détection, set(\"auto\") rend la main ; survit à la navigation", async () => {
    const page = await open();
    assert.equal(await page.evaluate(() => window.KolaMotion.set("lite")), "lite");
    await page.goto(`${srv.base}/marketing/site-web`, { waitUntil: "load" });
    assert.equal(await level(page), "lite", "le choix doit survivre à la navigation");
    assert.equal(await page.evaluate(() => window.KolaMotion.set("auto")), "full");
    await page.context().close();
  });

  test("fluidité mesurée insuffisante : passage en « lite » après deux fenêtres lentes, puis retour en « full » après trois fenêtres fluides", { timeout: 180000 }, async () => {
    const page = await open();
    assert.equal(await level(page), "full");
    // images volontairement lentes (70 ms de calcul par image) pendant trois fenêtres de mesure
    await page.evaluate(() => { window.__burn = true; (function burn() { if (!window.__burn) return; const t = performance.now(); while (performance.now() - t < 70); requestAnimationFrame(burn); })(); });
    for (let i = 0; i < 2; i += 1) { await page.mouse.click(5, 5); await wait(i ? 2200 : 2200); if (i < 1) await wait(10000); }
    await wait(500);
    assert.equal(await level(page), "lite", "deux fenêtres lentes doivent faire passer en « lite »");
    // retour : on cesse de brûler du temps, trois fenêtres fluides (espacées de 10 s) rétablissent « full »
    await page.evaluate(() => { window.__burn = false; });
    for (let i = 0; i < 4; i += 1) { await wait(i ? 10200 : 9000); await page.mouse.click(5, 5); await wait(2000); }   // espacement ≥ 10 s : une mesure au plus toutes les 10 s
    assert.equal(await level(page), "full", "trois fenêtres fluides doivent rétablir « full »");
    await page.context().close();
  });
});
