// Catégorie « Site » dans un VRAI navigateur (Chrome piloté par Playwright) : sous-catégories de la bibliothèque, ajout d'un
// widget dynamique par clic (enregistré en base), « Voir plus » qui ajoute les articles suivants sans recharger la page.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés.
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
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    let v = null;
    try { v = await check(); } catch { v = null; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`);
    await wait(every);
  }
}

describe("widgets du site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    for (let i = 1; i <= 5; i++) db().prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status) VALUES (?, ?, 'Résumé.', 1, datetime('now', ?), 'published')").run(`art-${i}`, `Article ${i}`, `-${i} hour`);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    pageId = Number((await boss.post("/marketing/pages", { name: "Widgets site" })).location.match(/(\d+)$/)[1]);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("« Voir plus » : les articles suivants s'ajoutent sans recharger la page, le bouton disparaît à la fin", async () => {
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 2, pagination: "more", sort: "title" } }, children: [
        { id: "head00000001", type: "heading", props: { text: "{{post.title}}", level: 3 } }] }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const pub = await context.newPage();
    pub.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await pub.goto(`${srv.base}/p/${slug}`);
    assert.equal(await pub.locator(".kw-loop-item").count(), 2);
    await pub.evaluate(() => { window.__same = "oui"; });
    await pub.locator(".kw-loop-more").click();
    await until(async () => (await pub.locator(".kw-loop-item").count()) === 4, { what: "4 articles après un clic" });
    assert.equal(await pub.evaluate(() => window.__same), "oui", "la page n'a pas été rechargée");
    await pub.locator(".kw-loop-more").click();
    await until(async () => (await pub.locator(".kw-loop-item").count()) === 5, { what: "5 articles" });
    await until(async () => (await pub.locator(".kw-loop-more").count()) === 0, { what: "bouton retiré à la fin" });
    assert.deepEqual(errors, []);
    await pub.close();
  });

  test("bibliothèque : sous-catégories de « Site », recherche, ajout d'une liste dynamique enregistré", async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); });
    await wait(500);
    const heads = await page.locator("#pb-group-site .pb-pal-subhead").allTextContents();
    for (const h of ["Navigation et identité", "Contenu de l'article", "Archives et recherche", "Listes dynamiques", "Compte et panier"]) assert.ok(heads.includes(h), `sous-catégorie « ${h} »`);
    await page.locator("#pb-group-site [data-widget='querylist']").first().click();
    await until(() => {
      const row = db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId);
      return row.draft && row.draft.includes('"type":"querylist"');
    }, { what: "liste dynamique enregistrée dans le brouillon", timeout: 12000 });
    assert.deepEqual(errors, []);
  });
});
