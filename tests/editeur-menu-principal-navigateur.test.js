// Éditeur de pages — MENU PRINCIPAL : il doit se fermer tout de suite au clic extérieur, y compris dans le canevas (un iframe,
// dont les clics n'atteignent pas le document parent), au clavier (Échap) et par bascule du bouton. Vrai Chrome (Playwright).
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
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

describe("menu principal de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const menu = () => page.locator("[data-pb-menu]");
  const btn = () => page.locator("[data-pb-mainmenu]");
  const isOpen = () => page.evaluate(() => !document.querySelector("[data-pb-menu]").hidden);
  const expanded = () => btn().getAttribute("aria-expanded");
  const open = async () => { await btn().click(); assert.equal(await isOpen(), true, "le menu doit s'ouvrir"); assert.equal(await expanded(), "true"); };
  // Ouvre le menu, fait le geste, puis exige que le menu soit masqué (et aria-expanded remis à faux) sans attente
  async function closedWithin(gesture) {
    await open();
    await gesture();
    await page.waitForFunction(() => document.querySelector("[data-pb-menu]").hidden, null, { timeout: 2000 });
    assert.equal(await expanded(), "false");
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = Number((await boss.post("/marketing/pages", { name: "Menu principal" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 20000 });
    await wait(300);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("clic dans le canevas (iframe) : fermeture immédiate", async () => {
    await closedWithin(() => page.frameLocator("[data-pb-frame]").locator("body").click({ position: { x: 5, y: 5 } }));
  });
  test("clic dans le panneau de gauche et dans l'en-tête : fermeture immédiate", async () => {
    await closedWithin(() => page.locator(".pb-left").click({ position: { x: 5, y: 700 } }));
    await closedWithin(() => page.locator(".pb-top").click({ position: { x: 400, y: 4 } }));
  });
  test("clic dans le menu : il reste ouvert ; Échap le ferme", async () => {
    await open();
    await menu().locator(".pb-menu-heading").first().click();
    assert.equal(await isOpen(), true);
    await page.keyboard.press("Escape");
    assert.equal(await isOpen(), false);
    assert.equal(await expanded(), "false");
  });
  test("le bouton bascule (ouvrir, fermer, ouvrir…) et reste stable", async () => {
    for (let i = 0; i < 3; i += 1) {
      await btn().click(); assert.equal(await isOpen(), true, `ouverture ${i}`);
      await btn().click(); assert.equal(await isOpen(), false, `fermeture ${i}`);
    }
    await btn().focus(); await page.keyboard.press("Enter");
    assert.equal(await isOpen(), true, "ouverture au clavier");
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
