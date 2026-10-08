// KOLAKISA CMS — palier 5 : parcours en vrai Chrome (écran Catégories/Étiquettes, sélecteur de l'éditeur d'article).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("catégories et étiquettes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, db;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message} @ ${(e.stack || "").split("\n").slice(1, 3).join(" | ")}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("fenêtre d'ajout : création réelle d'une catégorie puis d'une sous-catégorie, adresse proposée", async () => {
    await page.goto(`${srv.base}/marketing/site-web/articles/categories`);
    await page.click("[data-tx-new]");
    await page.fill("#tx-name", "Été & Voyages");
    assert.equal(await page.inputValue("#tx-slug"), "ete-voyages");
    await page.click("[data-tx-submit]");
    await page.waitForSelector("text=créée");
    assert.ok(db.prepare("SELECT 1 FROM taxonomy_terms WHERE slug = 'ete-voyages'").get());
    await page.click("[data-tx-new]");
    await page.fill("#tx-name", "Plages");
    await page.selectOption("#tx-parent", { label: "Été & Voyages" });
    await page.click("[data-tx-submit]");
    await page.waitForSelector("text=Plages");
    const t = db.prepare("SELECT t.parent_id, p.name pn FROM taxonomy_terms t JOIN taxonomy_terms p ON p.id = t.parent_id WHERE t.slug = 'plages'").get();
    assert.equal(t.pn, "Été & Voyages");
  });

  test("modifier ouvre la fenêtre préremplie ; supprimer une catégorie libre", async () => {
    await page.goto(`${srv.base}/marketing/site-web/articles/categories`);
    await page.locator("[data-tx-edit]").first().click();
    assert.equal(await page.inputValue("#tx-name"), "Été & Voyages");
    await page.keyboard.press("Escape");
    await page.locator("tr", { hasText: "Plages" }).locator(".mk-cms-more").click();
    await page.locator("tr", { hasText: "Plages" }).locator("[data-tx-delete]").click();
    await page.click("[data-tx-delete-ok]");
    await page.waitForSelector("text=supprimée");
    assert.equal(db.prepare("SELECT 1 FROM taxonomy_terms WHERE slug = 'plages'").get(), undefined);
  });

  test("éditeur : créer une étiquette et une catégorie sans quitter la page, enregistrer, recharger", async () => {
    const post = db.prepare("INSERT INTO posts (slug, title, content, content_format, status) VALUES ('nav-test', 'Article navigateur', '<p>x</p>', 'html', 'draft')").run().lastInsertRowid;
    await page.goto(`${srv.base}/formateur/blog/${post}/modifier`);
    await page.waitForSelector("[data-taxo]");
    await page.fill("[data-taxo-tag-input]", "Nouveauté");
    await page.waitForSelector("[data-taxo-suggest] li");
    await page.keyboard.press("Enter");
    await page.waitForSelector("[data-taxo-tags] .tx-token");
    await page.locator("[data-taxo-new]").evaluate((d) => { d.open = true; });
    await page.fill("[data-taxo-new-name]", "Guides");
    await page.click("[data-taxo-new-add]");
    await page.waitForFunction(() => document.querySelector("[data-taxo-category-ids]").value !== "");
    await page.keyboard.press("Control+s").catch(() => {});
    await page.evaluate(() => document.querySelector("[data-taxo]").closest("form").requestSubmit());
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
    const rels = db.prepare("SELECT t.taxonomy, t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_id = ?").all(post);
    assert.ok(rels.some((r) => r.name === "Nouveauté") && rels.some((r) => r.name === "Guides"), JSON.stringify(rels));
    await page.goto(`${srv.base}/formateur/blog/${post}/modifier`);
    await page.waitForSelector("[data-taxo-tags] .tx-token");
    assert.match(await page.locator("[data-taxo-tags]").innerText(), /Nouveauté/);
    assert.deepEqual(errors, []);
  });

  test("responsive : pas de défilement horizontal à 375 px", async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${srv.base}/marketing/site-web/articles/categories`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 1, `débordement ${over}px`);
  });
});
