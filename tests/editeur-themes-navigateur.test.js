// Éditeur de pages — THÈMES dans un VRAI Chrome : Classique inchangé, Personnalisé (couleurs → jetons), Navy Premium, changements
// rapides, persistance après rechargement, et aucune donnée de page touchée. Ignoré si Playwright / Chrome sont absents.
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

describe("thèmes de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, url;
  const css = (sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
  const skin = () => page.evaluate(() => document.body.dataset.skin);
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && document.body.dataset.skin; }, null, { timeout: 20000 });
  const openDialog = async () => { if (!(await page.locator("[data-pb-theme-dialog]").evaluate((d) => d.open).catch(() => false))) await page.locator("[data-pb-themes]").click(); await page.locator("[data-pb-theme-dialog]").waitFor({ state: "visible" }); };
  const pick = async (k) => { await openDialog(); await page.locator(`[data-skin-choice="${k}"]`).click(); };
  const rgb = (c) => c.match(/\d+/g).slice(0, 3).map(Number);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = Number((await boss.post("/marketing/pages", { name: "Thèmes" })).location.match(/(\d+)$/)[1]);
    url = `${srv.base}/marketing/pages/${id}/editeur`;
    await page.goto(url); await ready();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Classique par défaut : aucun jeton en ligne, panneau blanc d'origine", async () => {
    assert.equal(await skin(), "classic");
    assert.equal(await page.evaluate(() => document.body.getAttribute("style") || ""), "");
    assert.deepEqual(rgb(await css(".pb-left", "backgroundColor")), [255, 255, 255]);
    assert.deepEqual(rgb(await css(".pb-top", "backgroundColor")), [11, 42, 64]);
  });
  test("Navy Premium : panneaux gauche et droit bleu nuit, barre du haut inchangée, canevas non touché", async () => {
    const canvasBefore = await page.frameLocator("[data-pb-frame]").locator("body").evaluate((b) => getComputedStyle(b).backgroundColor);
    await pick("navy");
    assert.equal(await skin(), "navy");
    assert.deepEqual(rgb(await css(".pb-left", "backgroundColor")), [10, 36, 56]);
    assert.deepEqual(rgb(await css(".pb-right", "backgroundColor")), [10, 36, 56]);
    assert.deepEqual(rgb(await css(".pb-top", "backgroundColor")), [11, 42, 64]);
    assert.equal(await page.frameLocator("[data-pb-frame]").locator("body").evaluate((b) => getComputedStyle(b).backgroundColor), canvasBefore);
  });
  test("Personnalisé : l'accent choisi met à jour les jetons ; un hexadécimal invalide est ignoré", async () => {
    await pick("custom");
    await page.locator('[data-theme-hex="accent"]').fill("#ff0000");
    await page.locator('[data-theme-hex="accent"]').press("Tab");
    await page.waitForFunction(() => document.body.style.getPropertyValue("--editor-accent").toLowerCase() === "#ff0000");
    await page.locator('[data-theme-hex="accent"]').fill("zzz");
    await page.locator('[data-theme-hex="accent"]').press("Tab");
    assert.equal(await page.evaluate(() => document.body.style.getPropertyValue("--editor-accent")), "#ff0000");
    await page.locator('[data-theme-hex="panel"]').fill("#111827");
    await page.locator('[data-theme-hex="panel"]').press("Tab");
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".pb-left")).backgroundColor === "rgb(17, 24, 39)");
  });
  test("couleurs extrêmes : l'interface reste lisible (texte/fond ≥ 4,5:1 mesuré dans la page)", async () => {
    for (const c of ["#000000", "#ffffff", "#ffff00", "#00ffff"]) {
      await page.locator('[data-theme-hex="accent"]').fill(c); await page.locator('[data-theme-hex="accent"]').press("Tab");
      await wait(60);
      const ratio = await page.evaluate(() => {
        const lum = (s) => { const v = s.match(/\d+/g).slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
        const el = document.querySelector(".pb-pal-foot-label"), bg = getComputedStyle(document.querySelector(".pb-left")).backgroundColor;
        const a = lum(getComputedStyle(el).color), b = lum(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      assert.ok(ratio >= 4.5, `${c} : ${ratio.toFixed(2)}`);
    }
  });
  test("changements rapides Classique → Personnalisé → Navy → Classique : sans erreur, jetons en ligne nettoyés", async () => {
    for (const k of ["classic", "custom", "navy", "classic", "navy", "custom", "classic"]) await pick(k);
    assert.equal(await skin(), "classic");
    assert.equal(await page.evaluate(() => document.body.getAttribute("style") || ""), "");
    assert.deepEqual(rgb(await css(".pb-left", "backgroundColor")), [255, 255, 255]);
  });
  test("persistance : le thème et les couleurs reviennent après rechargement", async () => {
    await pick("custom");
    await page.locator('[data-theme-hex="accent"]').fill("#0f9d6b"); await page.locator('[data-theme-hex="accent"]').press("Tab");
    await page.reload(); await ready();
    assert.equal(await skin(), "custom");
    assert.equal(await page.evaluate(() => document.body.style.getPropertyValue("--editor-accent").toLowerCase()), "#0f9d6b");
    await pick("navy"); await page.reload(); await ready();
    assert.equal(await skin(), "navy");
  });
  test("préset et réinitialisation fonctionnent ; focus clavier visible sur le sélecteur", async () => {
    await pick("custom");
    await page.locator('[data-preset="midnight"]').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".pb-left")).backgroundColor === "rgb(17, 24, 39)");
    await page.locator("[data-theme-reset]").click();
    await page.waitForFunction(() => document.body.style.getPropertyValue("--editor-accent").toLowerCase() === "#0277b6");
    await page.locator('[data-skin-choice="classic"]').focus();
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement.closest("[data-pb-theme-dialog]")));
    await page.keyboard.press("Escape");
    await pick("classic");
  });
  test("mobile : Navy reste cohérent", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.evaluate(() => { document.querySelector("[data-pb-theme-dialog]").close(); });
    await page.locator("[data-pb-themes]").scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => localStorage.setItem("pb:editor-skin", '"navy"')); await page.reload(); await ready();
    assert.equal(await skin(), "navy");
    assert.deepEqual(rgb(await css(".pb-top", "backgroundColor")), [11, 42, 64]);
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
