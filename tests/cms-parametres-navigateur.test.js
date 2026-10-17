// KOLAKISA CMS — palier 14 : écrans Paramètres en vrai Chrome (enregistrement, confirmation sensible, modifications non enregistrées, responsive, clavier).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("paramètres (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async (width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  const URL = () => `${srv.base}/marketing/site-web/parametres`;

  test("modifier le nombre d'articles par page : message « non enregistrées », puis enregistrement réel relu après rechargement", async () => {
    const page = await open();
    await page.goto(`${URL()}/lecture`);
    const field = page.getByLabel(/par page/i).first();
    await field.fill("7");
    assert.match(await page.locator("[data-st-state]").innerText(), /non enregistrées/);
    await Promise.all([page.waitForNavigation(), page.click("[data-st-save]")]);
    assert.equal(await page.getByLabel(/par page/i).first().inputValue(), "7");
    assert.equal(await page.locator("[data-st-state]").innerText(), "");
  });

  test("réglage sensible : un panneau de confirmation s'affiche, rien n'est enregistré avant la case cochée", async () => {
    const page = await open();
    await page.goto(`${URL()}/indexation`);
    const sel = page.locator("select[name=search_visibility]");
    const before = await sel.inputValue();
    const other = (await sel.locator("option").evaluateAll((o) => o.map((x) => x.value))).find((v) => v !== before);
    await sel.selectOption(other);
    await Promise.all([page.waitForNavigation(), page.click("[data-st-save]")]);
    await page.waitForSelector(".mk-st-confirm");
    assert.match(await page.locator(".mk-st-confirm").innerText(), /Impact/);
    const r = await boss.get("/marketing/site-web/parametres/indexation");
    assert.ok(r.text.includes(`value="${before}" selected`) || r.text.includes(`<option value="${before}" selected>`), "valeur inchangée tant que non confirmé");
    await page.check("#st-confirm");
    await Promise.all([page.waitForNavigation(), page.click(".mk-st-confirm button[type=submit]")]);
    assert.equal(await page.locator("select[name=search_visibility]").inputValue(), other);
  });

  test("quitter avec des modifications déclenche l'avertissement du navigateur", async () => {
    const page = await open();
    await page.goto(`${URL()}/lecture`);
    await page.getByLabel(/par page/i).first().fill("9");
    let warned = false;
    page.on("dialog", async (d) => { warned = d.type() === "beforeunload"; await d.accept(); });
    await page.evaluate(() => { location.href = "/marketing/site-web/parametres/medias"; });
    await page.waitForURL(/medias/);
    assert.ok(warned, "boîte beforeunload affichée");
  });

  test("responsive 1400 / 820 / 390 : pas de défilement horizontal ; clavier : chaque champ a une étiquette", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(w);
      for (const g of ["", "/lecture", "/commentaires", "/medias", "/permaliens", "/seo", "/confidentialite", "/indexation", "/avance"]) {
        await page.goto(`${URL()}${g}`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(over <= 1, `débordement ${over}px à ${w}px sur ${g || "/"}`);
      }
      await page.close();
    }
    const page = await open();
    await page.goto(URL());
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll("[data-st-form] input:not([type=hidden]), [data-st-form] select, [data-st-form] textarea")].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute("aria-label")).map((el) => el.name));
    assert.deepEqual(unlabeled, []);
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body));
  });

  test("aucune erreur JavaScript pendant les parcours", () => { assert.deepEqual(errors, []); });
});
