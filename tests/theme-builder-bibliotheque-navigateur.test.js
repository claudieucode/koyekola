// Bibliothèque de modèles du Theme Builder dans un VRAI Chrome (Playwright) : ouverture, liste paginée, changement de type, recherche, aperçu réel, « Utiliser ce modèle », mobile, aucune erreur JavaScript.
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
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : bibliothèque non exécutée sur cette machine" : false;
const SHOTS = process.env.TB_SHOTS || "";

describe("Bibliothèque de modèles dans un navigateur réel", { skip: SKIP }, () => {
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
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bibliothèque" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("parcours : ouvrir → 24 cartes sur 100 → type → recherche → aperçu réel → utiliser → modèle présent", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    await page.click("#tb-lib-open");
    await page.waitForSelector("#tb-lib-cards .tb-libcard");
    assert.equal(await page.locator("#tb-lib-cards .tb-libcard").count(), 24);
    assert.match(await page.locator("#tb-lib-page").innerText(), /Page 1 \/ 5/);
    await page.waitForFunction(() => document.querySelectorAll("#tb-lib-cards .tb-thumb svg").length > 0); // miniatures chargées à la demande
    await shot(page, "bibliotheque-en-tetes");
    await page.click("#tb-lib-next"); await page.waitForFunction(() => /Page 2 \/ 5/.test(document.getElementById("tb-lib-page").textContent));
    await page.selectOption("#tb-lib-type", "footer"); await page.waitForFunction(() => /Page 1 \/ 5/.test(document.getElementById("tb-lib-page").textContent));
    await page.fill("#tb-lib-q", "colonnes"); await page.waitForFunction(() => document.querySelectorAll("#tb-lib-cards .tb-libcard").length > 0 && document.querySelectorAll("#tb-lib-cards .tb-libcard").length < 24);
    const first = page.locator("#tb-lib-cards .tb-libcard").first();
    await first.getByRole("button", { name: /Prévisualiser/ }).click();
    await page.waitForSelector("#tb-prev[open]");
    const fr = page.frameLocator("#tb-prev-frame");
    await fr.locator(".kw-theme-footer").waitFor({ timeout: 15000 });
    await shot(page, "apercu-pied-de-page");
    await page.click("#tb-prev-back");
    await first.getByRole("button", { name: /Utiliser/ }).click();
    await page.waitForFunction(() => /ajouté à votre site/.test(document.getElementById("tb-lib-status").textContent));
    assert.equal(await first.getByRole("link", { name: /Modifier/ }).count(), 1);
    await page.click("#tb-lib-back");
    await page.waitForFunction(() => document.querySelector("#tb-cards") && /Pied de page|colonnes/i.test(document.getElementById("tb-cards").textContent));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND type = 'footer' AND status = 'draft'").get(site).n, 1);
    await context.close();
  });
  test("mobile (390 px) : pas de défilement horizontal, mode liste", async () => {
    const { context, page } = await open({ width: 390, height: 800 });
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    await page.click("#tb-lib-open"); await page.waitForSelector("#tb-lib-cards .tb-libcard");
    await page.click('[data-lview="list"]');
    assert.ok(await page.evaluate(() => { const d = document.getElementById("tb-lib"); return d.scrollWidth <= d.clientWidth + 1; }), "pas de débordement horizontal");
    await shot(page, "bibliotheque-mobile");
    await context.close();
  });
  test("aucune erreur JavaScript", () => { assert.deepEqual(errors, []); });
});
