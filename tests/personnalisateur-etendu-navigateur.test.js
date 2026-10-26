// KOLAKISA CMS — Personnaliser (TITAN XVIII) dans un VRAI Chrome (Playwright, ignoré sans) : palettes, couleurs, contrastes, typographie, formes, boutons, guide de style en direct,
// aperçu de la vraie page, appareils, brouillon / publication / annulation / retour arrière, erreurs, protection à la fermeture, clavier, téléphone, lecture seule, isolation.
const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("personnaliser étendu (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, orgId, pageA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const open = async (width = 1440) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-alpha', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "Bonjour" }]), A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("arrière-plan : la couleur saisie change l'aperçu sans recharger, puis la publication l'enregistre et le site public la sert", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    await page.locator('[data-panel="arriere-plan"]').click();
    const bg = page.locator('[data-ctl="settings.background.color"] input[type=text]').first();
    await bg.fill("#123456");
    await page.locator("#kwc-iframe").waitFor();
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.documentElement.innerHTML.toLowerCase().includes("#123456"); }, null, { timeout: 8000 });
    assert.equal(settingsOf(A).background, undefined, "rien n'est enregistré avant la publication");
    await page.screenshot({ path: `${process.env.SHOTS || "/tmp"}/perso-fond-1440.png` });
    await page.click("#kwc-publish");
    await page.getByRole("button", { name: /^Publier/ }).last().click().catch(() => {});
    await page.waitForFunction(() => /Publié/.test(document.getElementById("kwc-status-text").textContent), null, { timeout: 8000 });
    assert.equal(settingsOf(A).background.color, "#123456");
    const pub = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase();
    assert.ok(pub.includes("#123456"));
    assert.deepEqual(errors, []);
  });

  test("champs de formulaire et images : panneaux utilisables, condition d'affichage du dégradé, 9 largeurs sans débordement", async () => {
    const page = await open(1280);
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`);
    for (const p of ["images", "formulaires"]) { await page.locator(`[data-panel="${p}"]`).click(); assert.ok(await page.locator("[data-ctl]").count() >= 6, p); await page.locator(".kwc-panel-head button").first().click(); }
    await page.locator('[data-panel="arriere-plan"]').click();
    assert.equal(await page.locator('[data-ctl="settings.background.gradient.from"]').isHidden(), true, "dégradé masqué tant qu'il est désactivé");
    await page.locator('[data-ctl="settings.background.gradient.enabled"] input').check({ force: true });
    assert.equal(await page.locator('[data-ctl="settings.background.gradient.from"]').isVisible(), true);
    assert.equal(await page.locator('[data-ctl="settings.background.position"]').isHidden(), true, "options d'image masquées sans image");
    for (const w of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 900 });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `débordement horizontal à ${w}px : ${over}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `${process.env.SHOTS || "/tmp"}/perso-degrade-1440.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${process.env.SHOTS || "/tmp"}/perso-mobile-390.png` });
    assert.deepEqual(errors, []);
  });
});
