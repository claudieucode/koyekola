// KOLAKISA CMS — palier 11 : le panneau SEO de l'éditeur de pages et les réglages SEO du site, en vrai Chrome :
// saisie → aperçu résolu par le serveur → enregistrement automatique → relecture en base → analyse → responsive → lecture seule.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("panneau SEO de l'éditeur de pages (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, pageId, siteId, orgId;
  const open = async (client, width = 1400, height = 900) => {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const row = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(pageId);
  const seoInDb = () => { const r = row(); return (r.draft ? JSON.parse(r.draft).seo : JSON.parse(r.seo)) || {}; };
  const openSeoPanel = async (page) => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForSelector("#pb-tab-page");
    await page.click("#pb-tab-page");
    await page.waitForSelector("[data-pb-serp] .pb-serp-title");
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location).match(/sites\/(\d+)/)[1]);
    pageId = Number(String((await boss.post("/marketing/pages", { name: "Page SEO navigateur", site_id: String(siteId) })).location).match(/pages\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("saisie du titre SEO : l'aperçu est recalculé par le serveur, le compteur est indicatif, la valeur est enregistrée en base", async () => {
    const page = await open(boss);
    await openSeoPanel(page);
    const before = await page.locator(".pb-serp-title").innerText();
    assert.match(before, /Page SEO navigateur/);
    await page.fill('[data-pb-page-settings] label:has-text("Titre SEO") + input', "Formation Photoshop en ligne | KOLAKISA");
    await page.waitForFunction(() => /Formation Photoshop en ligne/.test(document.querySelector(".pb-serp-title").textContent), null, { timeout: 8000 });
    assert.match(await page.locator(".pb-serp-url").innerText(), /^https:\/\/k\.test\/p\/page-seo-navigateur$/);
    assert.match(await page.locator("[data-pb-page-settings] .pb-count").first().innerText(), /\d+ caractères — environ 60 caractères sont généralement visibles/);
    await page.waitForFunction(() => /enregistré/i.test(document.body.textContent), null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    assert.equal(seoInDb().title, "Formation Photoshop en ligne | KOLAKISA", "relu côté serveur : pas seulement visuel");
    await page.context().close();
  });

  test("case noindex : l'aperçu annonce que la page ne sera pas indexée, la case est enregistrée", async () => {
    const page = await open(boss);
    await openSeoPanel(page);
    await page.check('[data-pb-page-settings] label:has-text("Ne pas indexer cette page")');
    await page.waitForSelector("[data-pb-serp] .pb-note.is-warn", { timeout: 8000 });
    assert.match(await page.locator("[data-pb-serp] .pb-note").innerText(), /ne sera pas indexée/);
    await page.waitForTimeout(1500);
    assert.equal(seoInDb().noindex, true);
    await page.uncheck('[data-pb-page-settings] label:has-text("Ne pas indexer cette page")');
    await page.waitForTimeout(1500);
    assert.equal(seoInDb().noindex, undefined);
    await page.context().close();
  });

  test("« Analyser la page » : contrôles réels, note présentée comme un repère, rien n'est bloqué", async () => {
    const page = await open(boss);
    await openSeoPanel(page);
    await page.click('[data-pb-page-settings] button:has-text("Analyser la page")');
    await page.waitForSelector("[data-pb-seo-result] .pb-seo-score", { timeout: 15000 });
    const text = await page.locator("[data-pb-seo-result]").innerText();
    assert.match(text, /Repère interne : \d+ \/ 100/);
    assert.match(text, /ni une note officielle ni une prévision de classement/);
    assert.match(text, /Titre SEO|Description/);
    await page.context().close();
  });

  test("responsive : le panneau SEO ne déborde pas (ordinateur, tablette, mobile)", async () => {
    for (const w of [1400, 820, 390]) {
      const page = await open(boss, w, w < 500 ? 800 : 900);
      await openSeoPanel(page);
      const over = await page.evaluate(() => { const b = document.querySelector("[data-pb-page-settings]"); return { box: b.scrollWidth - b.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
      assert.ok(over.box <= 1, `largeur ${w} : le panneau SEO déborde de ${over.box}px`);
      assert.ok(over.doc <= 1, `largeur ${w} : la page déborde de ${over.doc}px`);
      await page.context().close();
    }
  });

  test("lecture seule : sans seo.edit les champs SEO sont désactivés avec une explication, mais la page reste lisible", async () => {
    const key = (() => { db.prepare("INSERT OR IGNORE INTO mk_roles (organization_id, key, name, description, permissions) VALUES (?, 'sans_seo', 'Sans SEO', '', ?)").run(orgId, JSON.stringify(["forms.read", "forms.write", "seo.view"])); return "sans_seo"; })();
    const c = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id, key);
    const page = await open(c);
    await openSeoPanel(page);
    assert.match(await page.locator("[data-pb-page-settings]").innerText(), /lecture seule : la permission « seo\.edit »/);
    assert.equal(await page.locator('[data-pb-page-settings] label:has-text("Titre SEO") + input').isDisabled(), true);
    assert.equal(await page.locator('[data-pb-page-settings] button:has-text("Analyser la page")').isDisabled(), false, "seo.view suffit pour l'analyse");
    await page.context().close();
  });

  test("réglages du site → Référencement : adresse publique et titre enregistrés ; adresse invalide refusée avec un message", async () => {
    const page = await open(boss);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForSelector("#pb-tab-page");
    await page.waitForFunction(() => window.KWSiteSettings);
    await page.evaluate(() => window.KWSiteSettings.open());
    await page.waitForSelector(".ss-entry");
    await page.click('.ss-entry:has-text("Référencement (SEO)")');
    await page.waitForSelector(".ss-seo");
    await page.fill('.ss-seo label:has-text("Nom du site dans les résultats") + input', "Académie Navigateur");
    await page.fill('.ss-seo label:has-text("Adresse publique du site") + input', "https://www.academie.example");
    await page.waitForTimeout(2500);
    const settings = JSON.parse(db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings);
    assert.equal(settings.seo.title, "Académie Navigateur");
    assert.equal(settings.seo.publicUrl, "https://www.academie.example");
    assert.equal(page.url().includes("/editeur"), true);
    await page.fill('.ss-seo label:has-text("Adresse publique du site") + input', "http://pas-https.example");
    await page.waitForTimeout(2500);
    const after = JSON.parse(db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings);
    assert.equal(after.seo.publicUrl, "https://www.academie.example", "l'adresse invalide n'a pas été enregistrée");
    await page.context().close();
  });

  test("aucune erreur de script ni de console pendant tous les parcours", () => {
    assert.deepEqual(errors, []);
  });
});
