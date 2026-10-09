// Changement de thème de l'éditeur ATOMIQUE, dans un VRAI Chrome : aucune transition de couleur ne se déclenche pendant un changement
// (sinon des éléments à transition se fondent lentement pendant que les autres changent d'un coup = mélange ancien / nouveau thème),
// les couleurs finales sont déjà en place au premier recalcul, la classe de coupure est retirée aussitôt, et les transitions normales
// (survol) continuent de fonctionner. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const COLOR_PROP = /color|background|shadow|fill|stroke|border|outline|opacity/;

describe("changement de thème atomique (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && document.querySelector("[data-pb-theme-toggle]"); }, null, { timeout: 30000 });
  const resetLog = () => page.evaluate(() => { window.__tr = []; });
  const log = () => page.evaluate(() => window.__tr.filter((t) => /color|background|shadow|fill|stroke|border|outline|opacity/.test(t.p)).map((t) => `${t.t}:${t.p} (${t.el})`));
  const palette = () => page.evaluate(() => document.body.dataset.palette);
  const openDialog = async () => { if (!(await page.locator("[data-pb-theme-dialog]").evaluate((d) => d.open).catch(() => false))) await page.locator("[data-pb-themes]").click(); await page.locator("[data-pb-theme-dialog]").waitFor({ state: "visible" }); };
  const pick = async (k) => { await openDialog(); await page.locator(`[data-skin-choice="${k}"]`).click(); };
  const toggle = () => page.locator("[data-pb-theme-toggle]").first().click();
  const sample = () => page.evaluate(() => ["body", ".pb-left", ".pb-right", ".pb-top", ".pb-pal-item", ".pb-tool", ".pb-pal-foot", ".pb-layers-panel", ".pb-inspector"].map((s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return [s, c.backgroundColor, c.color, c.borderTopColor, c.boxShadow].join("|"); }));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = Number((await boss.post("/marketing/pages", { name: "Thème atomique" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready();
    await page.evaluate(() => { window.__tr = []; ["transitionrun", "transitionstart"].forEach((n) => document.addEventListener(n, (e) => window.__tr.push({ t: n, p: e.propertyName, el: (e.target.tagName + '.' + (e.target.className && e.target.className.baseVal === undefined ? e.target.className : '')).slice(0, 60) }), true)); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Clair → Sombre → Clair : aucune transition de couleur, classe de coupure retirée, couleurs finales dès le premier recalcul", async () => {
    await resetLog();
    const start = await palette();
    for (let i = 0; i < 2; i++) {
      // Lecture synchrone juste après le clic (même tâche que le changement) : les valeurs doivent déjà être les valeurs finales
      const r = await page.evaluate(() => { document.querySelector("[data-pb-theme-toggle]").click(); const now = ["body", ".pb-left", ".pb-right", ".pb-top"].map((s) => getComputedStyle(document.querySelector(s)).backgroundColor); return { now, cls: document.body.classList.contains("pb-theme-switching") }; });
      assert.equal(r.cls, false, "la classe de coupure ne reste pas");
      await wait(450);
      const settled = await page.evaluate(() => ["body", ".pb-left", ".pb-right", ".pb-top"].map((s) => getComputedStyle(document.querySelector(s)).backgroundColor));
      assert.deepEqual(r.now, settled, `couleurs immédiates ≠ couleurs finales (passage ${i + 1})`);
    }
    assert.equal(await palette(), start);
    assert.deepEqual(await log(), [], "aucune transition de couleur pendant le changement");
  });

  test("Sombre ↔ Clair ↔ Personnalisé ↔ Navy : aucune transition de couleur, aucun état intermédiaire", async () => {
    await resetLog();
    await pick("classic");
    await pick("custom");
    await pick("navy");
    await pick("custom");
    await pick("classic");
    await wait(500);
    assert.deepEqual(await log(), []);
  });

  test("Personnalisé → Personnalisé avec modification d'une couleur : tout change ensemble, sans transition", async () => {
    await pick("custom");
    await resetLog();
    for (const hex of ["#ff0000", "#00aa55", "#7a2fd0"]) {
      const prev = await page.evaluate(() => document.body.style.getPropertyValue("--editor-accent"));
      await page.locator('[data-theme-hex="accent"]').fill(hex);
      await page.locator('[data-theme-hex="accent"]').press("Tab");
      await page.waitForFunction((p) => document.body.style.getPropertyValue("--editor-accent") !== p, prev); // l'accent est dérivé (contraste) : on attend le changement
    }
    await wait(400);
    // L'anneau de focus du champ qu'on tape est une animation normale (focus), pas un effet du thème : on l'exclut
    assert.deepEqual((await log()).filter((l) => !/\(INPUT\./.test(l)), []);
    await pick("classic");
  });

  test("changements rapides enchaînés : états finaux corrects, aucune transition, aucune classe résiduelle", async () => {
    await resetLog();
    await page.evaluate(() => { const b = document.querySelector("[data-pb-theme-toggle]"); for (let i = 0; i < 7; i++) b.click(); });
    await wait(500);
    assert.equal(await palette(), "dark"); // 7 bascules depuis « clair » = sombre
    assert.equal(await page.evaluate(() => document.body.classList.contains("pb-theme-switching")), false);
    assert.deepEqual(await log(), []);
    const a = await sample();
    await page.evaluate(() => { const b = document.querySelector("[data-pb-theme-toggle]"); b.click(); b.click(); });
    await wait(450);
    assert.deepEqual(await sample(), a);
    await page.evaluate(() => document.querySelector("[data-pb-theme-toggle]").click()); await wait(300);
    assert.equal(await palette(), "light");
  });

  test("les transitions normales sont conservées : le survol d'un bouton anime toujours ses couleurs", async () => {
    await page.keyboard.press("Escape"); // ferme la fenêtre des thèmes
    await page.locator("[data-pb-theme-dialog]").waitFor({ state: "hidden" });
    await resetLog();
    const btn = page.locator(".pb-pal-item").first();
    await btn.scrollIntoViewIfNeeded();
    await btn.hover(); await wait(300);
    await page.mouse.move(5, 5); await wait(300);
    const all = await page.evaluate(() => window.__tr.map((t) => t.p));
    assert.ok(all.some((p) => COLOR_PROP.test(p)), `aucune transition au survol (${all.join()})`);
  });

  test("règle CSS de coupure présente, sans erreur de script", async () => {
    const css = fs.readFileSync(require.resolve("../public/css/page-builder.css"), "utf8");
    assert.match(css, /\.pb-theme-switching \*::before[\s\S]*transition: none !important/);
    assert.deepEqual(errors, []);
  });
});
