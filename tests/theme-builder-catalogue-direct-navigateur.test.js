// Catalogue prédéfini DIRECT dans chaque catégorie du Theme Builder (vrai Chrome) : les 100 modèles de chaque type sont accessibles sans ouvrir la bibliothèque globale.
// Ignoré (avec la raison) sans Playwright/Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : catalogue direct non exécuté sur cette machine" : false;
const SHOTS = process.env.TB_SHOTS || "";
const TYPES = ["header", "footer", "single_page", "single_post", "archive", "search_results", "not_found", "single_product", "product_archive"];

describe("Catalogue direct dans chaque catégorie", { skip: SKIP }, () => {
  let srv, boss, browser, db, site, errors = [];
  const open = async (viewport = { width: 1440, height: 900 }) => {
    const context = await browser.newContext({ viewport }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Catalogue" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("chaque catégorie expose ses 100 modèles sans ouvrir la bibliothèque", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    await page.waitForSelector("#tb-types button");
    assert.equal(await page.locator("#tb-cat").isVisible(), false, "pas de catalogue sur la vue d'ensemble");
    for (const t of TYPES) {
      await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme?type=${t}`);
      await page.waitForSelector("#tb-cat-cards .tb-libcard");
      assert.equal(await page.locator("#tb-cat-count").innerText(), "100 modèles", t);
      assert.equal(await page.locator("#tb-cat-cards .tb-libcard").count(), 24, t);
      assert.equal(await page.locator("#tb-lib").isVisible(), false, "la bibliothèque reste fermée");
    }
    await context.close();
  });

  test("recherche, filtre, pagination, aperçu et utilisation depuis la catégorie", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme?type=header`);
    await page.waitForSelector("#tb-cat-cards .tb-libcard");
    await shot(page, "direct-header");
    await page.click("#tb-cat-next"); await page.waitForFunction(() => document.getElementById("tb-cat-page").textContent.startsWith("Page 2"));
    await page.selectOption("#tb-cat-skin", "nuit"); await page.waitForFunction(() => document.getElementById("tb-cat-count").textContent === "20 modèles");
    await page.fill("#tb-cat-q", "zzzzzzzz"); await page.waitForSelector("#tb-cat-cards .sw-muted");
    await page.fill("#tb-cat-q", ""); await page.waitForSelector("#tb-cat-cards .tb-libcard");
    await page.locator("#tb-cat-cards .tb-libcard").first().getByRole("button", { name: /Prévisualiser/ }).click();
    await page.waitForSelector("#tb-prev[open]"); await page.waitForTimeout(600); await shot(page, "direct-apercu");
    await page.click("#tb-prev-back");
    const card = page.locator("#tb-cat-cards .tb-libcard").first();
    await card.getByRole("button", { name: /Utiliser/ }).click();
    await page.waitForSelector("#tb-cards .tb-card:not(.tb-tcard)");
    assert.ok(await page.locator("#tb-cards article.tb-card").count() >= 1, "le modèle est dans « Mes modèles »");
    assert.equal(await page.locator('#tb-cards .tb-badge[data-k="published"]').count(), 0, "rien n'est publié automatiquement");
    await shot(page, "direct-apres-utilisation");
    await context.close();
  });

  test("barre latérale et modèle personnalisé : explication honnête, aucun faux modèle ; mobile sans débordement", async () => {
    const { context, page } = await open({ width: 390, height: 800 });
    for (const t of ["sidebar", "custom"]) {
      await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme?type=${t}`);
      await page.waitForSelector("#tb-cat-none:not([hidden])");
      assert.equal(await page.locator("#tb-cat-cards .tb-libcard").count(), 0);
    }
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme?type=archive`);
    await page.waitForSelector("#tb-cat-cards .tb-libcard"); await shot(page, "direct-mobile");
    assert.ok(await page.evaluate(() => document.getElementById("tb-main").scrollWidth <= document.getElementById("tb-main").clientWidth + 1), "pas de défilement horizontal");
    await context.close();
    assert.deepEqual(errors, []);
  });
});
