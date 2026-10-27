// KOLAKISA — éditeur d'articles (parité Gutenberg) : parcours dans un VRAI Chrome.
// D1 : une frappe pendant un enregistrement n'est jamais déclarée enregistrée.
// D4 : un article créé depuis l'éditeur d'un site naît dans ce site.
// D5 : « Enregistrer » et le brouillon automatique ne créent jamais deux articles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("éditeur d'articles — intégrité (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, siteA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    return page;
  };
  const state = (page) => page.locator("[data-save-state]").innerText();
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const orgId = one("SELECT id FROM mk_organizations").id;
    siteA = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("D4 : un nouvel article enregistré depuis l'éditeur d'un site est rattaché à ce site", async () => {
    const page = await open();
    await page.goto(`${srv.base}/formateur/blog/nouveau?site=${siteA}`);
    await page.waitForSelector("[data-save-state]");
    await page.fill("#post-title", "Article du site Alpha");
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type("Texte du site Alpha.");
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 15000 });
    const post = one("SELECT id FROM posts WHERE title = ?", "Article du site Alpha");
    assert.ok(post, "article créé");
    assert.equal(one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", post.id).s, siteA);
    await page.context().close();
  });

  test("D5 : « Enregistrer » pendant la création du brouillon automatique ne crée qu'UN article", async () => {
    const page = await open();
    const calls = [];
    page.on("request", (rq) => { if (rq.method() === "POST") calls.push(new URL(rq.url()).pathname); });
    await page.route("**/api/brouillon**", async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForSelector("[data-save-state]");
    await page.fill("#post-title", "Course brouillon et enregistrement");
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type("Texte.");
    // Aperçu (qui crée le brouillon, lentement) puis, sans attendre, Enregistrer
    await page.click("[data-options-toggle], [data-preview-toggle]").catch(() => {});
    await page.evaluate(() => document.querySelector('[data-preview="tab"]').click());
    await page.waitForTimeout(150);
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 20000 });
    await page.waitForTimeout(3000); // laisse la création retardée (1,5 s) se terminer : un éventuel doublon serait alors visible
    assert.ok(calls.some((c) => /api\/brouillon/.test(c)), `le brouillon automatique a bien été demandé (${calls.join(", ")})`);
    assert.ok(calls.some((c) => /\/nouveau$|\/modifier$/.test(c)), "et l'enregistrement a bien eu lieu pendant ce temps");
    assert.equal(one("SELECT COUNT(*) n FROM posts WHERE title = ?", "Course brouillon et enregistrement").n, 1, `un seul article malgré la course (${calls.join(", ")})`);
    await page.context().close();
  });

  test("D1 : une frappe pendant l'enregistrement n'est jamais déclarée enregistrée, la copie locale est conservée", async () => {
    const fd = new FormData();
    Object.entries({ title: "Article D1", content: "<p>Départ.</p>", excerpt: "x", content_format: "html", status: "draft" }).forEach(([k, v]) => fd.append(k, v));
    const id = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text).id;
    const page = await open();
    await page.route("**/modifier", async (route) => { if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.goto(`${srv.base}/formateur/blog/${id}/modifier`);
    await page.waitForSelector("[data-save-state]");
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type(" Premier ajout.");
    await page.click("[data-save]");
    await page.waitForTimeout(300);
    await page.locator(".ProseMirror").first().click(); // le clic sur « Enregistrer » a pris le focus
    await page.keyboard.press("End");
    await page.keyboard.type(" Frappe pendant l'envoi.");
    for (let i = 0; i < 60 && !/Premier ajout/.test(one("SELECT content FROM posts WHERE id = ?", id).content); i++) await page.waitForTimeout(250);
    await page.waitForTimeout(600); // la réponse du serveur est traitée par l'éditeur
    assert.doesNotMatch(await state(page), /^Enregistré$/, "la frappe tardive n'est pas enregistrée : l'état ne peut pas l'affirmer");
    assert.match(one("SELECT content FROM posts WHERE id = ?", id).content, /Premier ajout/);
    assert.doesNotMatch(one("SELECT content FROM posts WHERE id = ?", id).content, /pendant l'envoi/);
    await page.context().close();
  });
});
