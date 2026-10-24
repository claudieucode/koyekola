// SANTÉ DU SITE en vrai Chrome : onglets, analyse réelle, détails dépliables, « Tests passés », accordéons, copie (presse-papiers et repli), mobile.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.SANTE_SHOTS || "";

describe("santé du site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors, siteId;
  const O = "/marketing/site-web/outils";
  const open = async (width = 1400, height = 900, { init } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ["clipboard-read", "clipboard-write"] });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SESSION_SECRET: "session-secret-de-test-0123456789", SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_navigateur_secret_77" });
    boss = await loginInstructor(srv); errors = [];
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site santé navigateur" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("onglet État : analyse réelle, résumé, détails dépliables, « Tests passés » ; onglet Informations : accordéons et copie", async () => {
    const page = await open();
    await page.goto(`${srv.base}${O}?site=${siteId}`);
    assert.match(await page.locator(".mk-sh-state").innerText(), /Non analysé/);
    await shot(page, "sante-etat-vide");
    await page.click('button:has-text("Analyser maintenant")');
    await page.waitForSelector(".mk-sh-tally", { timeout: 120000 });
    await shot(page, "sante-etat-resultat");
    const state = await page.locator(".mk-sh-state").innerText();
    assert.match(state, /Bon état|Améliorations recommandées|Problèmes critiques/);
    const first = page.locator(".mk-sh-card .mk-sh-item").first();
    if (await first.count()) {
      assert.equal(await first.evaluate((d) => d.open), false);
      await first.locator("summary").click();
      assert.equal(await first.evaluate((d) => d.open), true);
      assert.ok(await first.locator(".mk-sh-body").isVisible());
      assert.match(await first.locator(".mk-sh-body").innerText(), /Constat/);
      await shot(page, "sante-etat-detail");
    }
    await page.locator(".mk-sh-passed > summary").click();
    assert.ok(await page.locator(".mk-sh-passed .mk-sh-item").first().isVisible());
    await shot(page, "sante-etat-passes");

    await page.click('a.mk-sh-tab:has-text("Informations")');
    await page.waitForSelector("[data-sh-copy-all]");
    assert.match(page.url(), /onglet=informations/);
    const sections = page.locator(".mk-sh-info > details");
    assert.ok((await sections.count()) >= 9);
    const kola = page.locator("#info-kolakisa");
    await kola.locator("summary").click();
    assert.equal(await kola.evaluate((d) => d.open), true);
    assert.match(await kola.innerText(), /Version de Kolakisa/);
    await kola.locator("summary").click();
    assert.equal(await kola.evaluate((d) => d.open), false);
    for (const id of ["kolakisa", "repertoires", "base_de_donnees"]) await page.locator(`#info-${id} summary`).click();
    await shot(page, "sante-infos");

    await page.click("[data-sh-copy-all]");
    await page.waitForFunction(() => /copiées/.test(document.querySelector("[data-sh-copystate]").textContent), null, { timeout: 15000 });
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(clip, /### Kolakisa ###/);
    assert.match(clip, /### Base de données ###/);
    assert.ok(!clip.includes("sk_test_navigateur_secret_77"), "aucun secret dans le presse-papiers");
    await page.locator("#info-kolakisa .mk-sh-copy").first().click();
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).length > 0);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("copie refusée par le navigateur : repli avec texte sélectionnable, sans erreur", async () => {
    const page = await open(1200, 800, { init: () => { try { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("refusé")) }, configurable: true }); } catch (e) { /* noop */ } document.execCommand = () => false; } });
    await page.goto(`${srv.base}${O}?site=${siteId}&onglet=informations`);
    await page.click("[data-sh-copy-all]");
    await page.waitForSelector("[data-sh-fallback]:not([hidden])", { timeout: 15000 });
    assert.match(await page.locator("[data-sh-copystate]").innerText(), /impossible/);
    assert.match(await page.locator("#sh-fallback-text").inputValue(), /### Kolakisa ###/);
    assert.equal(await page.locator("#sh-fallback-text").evaluate((t) => document.activeElement === t), true);
    await shot(page, "sante-copie-refusee");
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("téléphone (390 px) et tablette : aucun débordement horizontal, accordéons utilisables au clavier", async () => {
    for (const [w, h, name] of [[390, 844, "mobile"], [820, 1100, "tablette"]]) {
      const page = await open(w, h);
      await page.goto(`${srv.base}${O}?site=${siteId}&onglet=informations`);
      await page.locator("#info-medias summary").click();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `${name} : débordement horizontal de ${over}px`);
      await page.locator("#info-theme_actif summary").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#info-theme_actif").evaluate((d) => d.open), true);
      await shot(page, `sante-infos-${name}`);
      await page.goto(`${srv.base}${O}?site=${siteId}`);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);
      await shot(page, `sante-etat-${name}`);
      await page.context().close();
    }
    assert.deepEqual(errors, []);
  });
});
