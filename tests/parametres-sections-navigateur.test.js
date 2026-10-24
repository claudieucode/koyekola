// KOLAKISA CMS — Paramètres d'un site dans un VRAI Chrome (Playwright, ignoré sans) : les neuf sections s'ouvrent sans erreur JavaScript, le suivi des modifications non enregistrées
// fonctionne, l'enregistrement revient dans le cadre du site, le téléphone (390 px) ne défile pas horizontalement, et « mouvement réduit » coupe les animations.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("paramètres d'un site : sections (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, errors;
  const R = "/marketing/site-web";
  const open = async ({ width = 1280, reducedMotion = "no-preference" } = {}) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 600, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(org).lastInsertRowid);
    db.prepare("INSERT INTO mk_sending_domains (organization_id, domain, token) VALUES (?, 'alpha.example', 't')").run(org);
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });

  test("les neuf sections s'ouvrent depuis le menu, sans erreur JavaScript ; l'entrée active est marquée", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}/sites/${A}/reglages`);
    for (const label of ["Lecture", "Commentaires", "Médias", "Permaliens", "SEO", "Indexation", "Emailing", "Tunnels", "Avancé"]) {
      const link = page.locator(`#mk-sub-parametres a.mk-nav-sublink`, { hasText: new RegExp(`^${label}$`) });
      assert.equal(await link.count(), 1, `${label} : lien actif dans le menu`);
      await Promise.all([page.waitForURL(/parametres-/), link.click()]);
      assert.equal(await page.locator("h1").first().innerText(), label);
      assert.equal(await page.locator(`#mk-sub-parametres a[aria-current="page"]`).innerText(), label, `${label} : entrée active`);
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });

  test("Emailing : modification détectée, enregistrement réel (la base est relue), retour dans le cadre du site ; valeur refusée = saisie conservée", async () => {
    const page = await open();
    await page.goto(`${srv.base}${R}/sites/${A}/parametres-emailing`);
    assert.equal(await page.locator("[data-st-state]").innerText(), "");
    await page.fill("#st-email_from_name", "Alpha Studio");
    assert.match(await page.locator("[data-st-state]").innerText(), /Modifications non enregistrées/);
    await Promise.all([page.waitForURL(/parametres-emailing/), page.click("[data-st-save]")]);
    assert.ok(db.prepare("SELECT 1 FROM mk_settings WHERE key LIKE ? AND value = 'Alpha Studio'").get(`email.site_${A}.%`), "valeur enregistrée");
    assert.equal(await page.locator("#st-email_from_name").inputValue(), "Alpha Studio", "rechargée");
    await page.fill("#st-email_from_address", "pas-une-adresse");
    await page.click("[data-st-save]");
    await page.locator(".mk-flash-error").waitFor();
    assert.equal(await page.locator("#st-email_from_address").inputValue(), "pas-une-adresse", "saisie conservée après refus");
    assert.match(page.url(), /parametres\/emailing|parametres-emailing/);
    assert.equal(await page.locator("h1").first().innerText(), "Emailing"); assert.equal(await page.locator(".mk-tab").count(), 0, "toujours dans le cadre du site (aucun onglet central)");
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });

  test("téléphone (390 px) : aucune section ne défile horizontalement ; « mouvement réduit » coupe les animations", async () => {
    const page = await open({ width: 390 });
    for (const k of ["lecture", "commentaires", "emailing", "avance"]) {
      await page.goto(`${srv.base}${R}/sites/${A}/parametres-${k}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${k} : pas de défilement horizontal`);
    }
    await page.context().close();
    const calm = await open({ reducedMotion: "reduce" });
    await calm.goto(`${srv.base}${R}/sites/${A}/parametres-emailing`);
    assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector(".mk-st-form")).animationName), "none", "animation coupée");
    await calm.context().close();
    const live = await open();
    await live.goto(`${srv.base}${R}/sites/${A}/parametres-emailing`);
    assert.equal(await live.evaluate(() => getComputedStyle(document.querySelector(".mk-st-form")).animationName), "mk-st-in", "animation légère active par défaut");
    assert.equal(errors.length, 0, errors.join("\n"));
    await live.context().close();
  });
});
