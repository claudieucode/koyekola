// KOLAKISA CMS — palier 10 : parcours en vrai Chrome — éditeur d'article (états de sauvegarde honnêtes, erreur réseau, conflit, récupération), historique
// (cases à cocher, comparaison, restauration avec confirmation), corbeille (confirmation de la suppression définitive), responsive.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("historique, sauvegarde et corbeille (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, postId;
  const H = "/marketing/site-web/historique";
  const open = async (width = 1400) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const fd = new FormData();
    Object.entries({ title: "Article navigateur", content: "<p>Premier texte.</p>", excerpt: "x", content_format: "html", status: "draft" }).forEach(([k, v]) => fd.append(k, v));
    postId = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text).id;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("éditeur : une erreur réseau n'affiche JAMAIS « Enregistré » ; le texte reste, l'enregistrement repasse quand le réseau revient", async () => {
    const page = await open();
    await page.goto(`${srv.base}/formateur/blog/${postId}/modifier`);
    await page.waitForSelector("[data-save-state]");
    await page.route("**/autosave", (route) => route.abort());
    await page.route("**/modifier", (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type(" Texte ajouté pendant la panne.");
    await page.waitForFunction(() => /Erreur|non enregistr|Modifications/i.test(document.querySelector("[data-save-state]").textContent), null, { timeout: 15000 });
    const state = await page.locator("[data-save-state]").innerText();
    assert.doesNotMatch(state, /^Enregistré$/, `état affiché : ${state}`);
    await page.click("[data-save]");
    await page.waitForTimeout(800);
    assert.doesNotMatch(await page.locator("[data-save-state]").innerText(), /^Enregistré$/, "échec de l'enregistrement : jamais « Enregistré »");
    assert.match(db.prepare("SELECT content FROM posts WHERE id = ?").get(postId).content, /^<p>Premier texte\.<\/p>$/, "rien n'a été enregistré");
    assert.match(await page.locator(".ProseMirror").first().innerText(), /panne/, "le texte reste dans l'éditeur");
    await page.unroute("**/modifier"); await page.unroute("**/autosave");
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 15000 });
    assert.match(db.prepare("SELECT content FROM posts WHERE id = ?").get(postId).content, /panne/);
  });

  test("éditeur : un autre onglet a enregistré → le premier est refusé avec un message clair, rien n'est écrasé, le texte reste", async () => {
    const page = await open();
    await page.goto(`${srv.base}/formateur/blog/${postId}/modifier`);
    await page.waitForSelector("[data-save-state]");
    db.prepare("UPDATE posts SET content = '<p>Version d''un autre onglet</p>', updated_at = datetime('now', '+1 minute') WHERE id = ?").run(postId);
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type(" Mon ajout périmé.");
    await page.click("[data-save]");
    await page.waitForFunction(() => /modifié depuis votre dernière sauvegarde/.test(document.body.innerText), null, { timeout: 10000 });
    assert.doesNotMatch(await page.locator("[data-save-state]").innerText(), /^Enregistré$/);
    assert.equal(db.prepare("SELECT content FROM posts WHERE id = ?").get(postId).content, "<p>Version d'un autre onglet</p>");
    assert.match(await page.locator(".ProseMirror").first().innerText(), /Mon ajout périmé/, "le texte de la personne reste à l'écran");
  });

  test("récupération : après une « fermeture » avec sauvegarde automatique, la réouverture propose de la retrouver — sans rien écraser", async () => {
    const fd = new FormData(); fd.append("title", "Article navigateur"); fd.append("content", "<p>Texte retrouvé après plantage</p>");
    await boss.request(`/formateur/blog/${postId}/autosave`, { method: "POST", multipart: fd });
    db.prepare("UPDATE posts SET updated_at = datetime('now', '-2 hours') WHERE id = ?").run(postId);
    const page = await open();
    await page.goto(`${srv.base}/formateur/blog/${postId}/modifier`);
    await page.waitForSelector("text=sauvegarde automatique", { timeout: 10000 }).catch(() => {});
    const text = await page.locator("body").innerText();
    assert.match(text, /sauvegard(e|ée) automatique|récupér|plus récente/i);
    assert.doesNotMatch(db.prepare("SELECT content FROM posts WHERE id = ?").get(postId).content, /retrouvé après plantage/);
  });

  test("historique : cocher deux versions, comparer, restaurer avec confirmation ; la restauration est traçable", async () => {
    const pid = Number((await boss.post("/marketing/pages", { name: "Page navigateur historique" })).location.match(/(\d+)$/)[1]);
    const layout = (t) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: t, level: 1 } }] }] });
    const put = async (t) => boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision, content: { sections: [layout(t)] } } });
    await put("Alpha"); await boss.postJson(`/marketing/pages/${pid}/publier.json`, {});
    await put("Bravo"); db.prepare("UPDATE cms_revisions SET updated_at = datetime('now', '-1 hour') WHERE content_type = 'page' AND content_id = ?").run(pid);
    await put("Charlie");
    const page = await open();
    await page.goto(`${srv.base}${H}/page/${pid}`);
    const picks = page.locator("[data-hi-pick]");
    assert.ok((await picks.count()) >= 3);
    assert.equal(await page.locator("[data-hi-go]").isDisabled(), true);
    await picks.nth(0).check(); await picks.nth(1).check();
    assert.equal(await page.locator("[data-hi-go]").isEnabled(), true);
    await page.click("[data-hi-go]");
    await page.waitForSelector("text=Différences réelles");
    assert.match(await page.locator("body").innerText(), /différence/);
    await page.goBack();
    await page.locator("tr", { hasText: "Version publiée n° 1" }).getByRole("button", { name: "Restaurer" }).click();
    await page.locator("dialog button:has-text('Restaurer')").last().click();
    await page.waitForSelector("text=Version restaurée");
    const draft = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pid).draft);
    assert.equal(draft.sections[0].children[0].children[0].props.text, "Alpha");
    assert.ok(db.prepare("SELECT 1 FROM cms_revisions WHERE content_type = 'page' AND content_id = ? AND kind = 'before_restore'").get(pid), "état d'avant conservé");
  });

  test("corbeille : la suppression définitive demande une confirmation explicite (irréversible) ; annuler ne supprime rien", async () => {
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, deleted_at) VALUES ('nav-purge', 'À purger navigateur', 'x', 'html', 'draft', 0, datetime('now'))").run().lastInsertRowid);
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/corbeille`);
    await page.locator("tr", { hasText: "À purger navigateur" }).getByRole("button", { name: /Supprimer définitivement/ }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /irréversible/);
    await dialog.getByRole("button", { name: /Annuler/ }).last().click();
    assert.ok(db.prepare("SELECT 1 FROM posts WHERE id = ?").get(post), "annulé : rien n'est supprimé");
    await page.locator("tr", { hasText: "À purger navigateur" }).getByRole("button", { name: /Supprimer définitivement/ }).click();
    await page.locator("dialog[open]").getByRole("button", { name: /Supprimer définitivement/ }).click();
    await page.waitForSelector("text=supprimé définitivement");
    assert.equal(db.prepare("SELECT 1 FROM posts WHERE id = ?").get(post), undefined);
  });

  test("responsive : historique, comparaison et corbeille sans défilement horizontal à 820 et 375 px ; aucune erreur JavaScript", async () => {
    for (const width of [820, 375]) {
      const page = await open(width);
      for (const path of [`${H}/post/${postId}`, `${H}/appearance/0`, "/marketing/site-web/corbeille"]) {
        await page.goto(`${srv.base}${path}`);
        assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${width}px ${path}`);
      }
    }
    assert.deepEqual(errors.filter((e) => !/net::ERR_FAILED|Failed to fetch|abort/i.test(e)), []);
  });
});
