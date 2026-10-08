// Éditeur de pages — DONNÉES DYNAMIQUES ET BOUCLES dans un VRAI navigateur (Chrome piloté par Playwright) contre un
// vrai serveur. Chaque scénario agit comme une personne (glisser depuis une règle, tirer une poignée, saisir une position,
// changer de zoom ou d'écran), puis relit les positions RÉELLES calculées par le navigateur, le brouillon enregistré en base et
// la page publiée : les outils de conception ne doivent jamais entrer dans le contenu ni dans le site.
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
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}


const CONTENT = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "grid00000001", type: "grid", props: {}, styles: { desktop: { columns: 3, gap: "16px" } }, children: [
    { id: "card00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre", level: 3 } },
      { id: "btn000000001", type: "button", props: { label: "Lire", url: "/blog" } } ] } ] } ] }] });

describe("données dynamiques et boucles (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const find = (id) => nodesOf(draft().sections).find((n) => n.id === id);
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const select = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(300); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    for (let i = 1; i <= 3; i++) db().prepare("INSERT INTO posts (slug, title, excerpt, published, published_at, status) VALUES (?, ?, 'Résumé.', 1, datetime('now', ?), 'published')").run(`art-${i}`, `Article ${i}`, `-${i} hour`);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Dynamique" })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT() }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("T1 grille : activer la boucle depuis l'inspecteur, réglages enregistrés, un exemplaire par article dans le canevas", async () => {
    await select("grid00000001");
    const box = page.getByLabel("Répéter pour chaque article ou formation (boucle)");
    await box.check();
    await saved((d) => find("grid00000001").props.loop && find("grid00000001").props.loop.source === "posts", "boucle activée");
    await page.getByLabel("Nombre par page").selectOption("2");
    await saved(() => find("grid00000001").props.loop.count === 2, "2 par page");
    await page.getByLabel("Pagination (liens Précédent / Suivant)").check();
    await saved(() => find("grid00000001").props.loop.paginate === true, "pagination");
    await until(async () => (await frame().locator(".kw-loop-item").count()) === 2, { what: "2 exemplaires dans le canevas" });
    assert.equal(await frame().locator(".kw-loop-pages").count(), 1, "pagination affichée (3 articles, 2 par page)");
  });

  test("T2 sélecteur de données : insérer {{post.title}} dans le titre, résolu dans le canevas ; l'adresse du bouton dynamique", async () => {
    await select("head00000001");
    const field = page.locator(".pb-field-dyn input").first();
    await field.fill("");
    await page.locator(".pb-dyn-btn").first().click();
    await page.locator(".pb-dyn-pop .pb-dyn-search").fill("titre de l");
    await page.locator(".pb-dyn-pop .pb-dyn-item", { hasText: "Titre de l'article" }).click();
    await saved(() => find("head00000001").props.text === "{{post.title}}", "titre dynamique");
    await until(async () => (await frame().locator(".kw-loop-item h3").allTextContents()).join("|") === "Article 1|Article 2", { what: "titres résolus" });
    await select("btn000000001");
    await page.locator(".pb-dyn-btn").nth(1).click();
    await page.locator(".pb-dyn-pop .pb-dyn-item", { hasText: "Adresse de l'article" }).click();
    await saved(() => /\{\{post\.url\}\}/.test(find("btn000000001").props.url), "adresse dynamique");
    await until(async () => (await frame().locator(".kw-loop-item a.kw-button").count()) === 2, { what: "boutons rendus" });
  });

  test("T3 écriture directe refusée sur un contenu dynamique (l'étiquette n'est jamais écrasée)", async () => {
    await frame().locator(".kw-loop-item h3").first().dblclick();
    await wait(400);
    assert.equal(await frame().locator("[contenteditable=true]").count(), 0, "aucun champ d'écriture ouvert");
    assert.match(await page.locator("[data-pb-toast]").textContent(), /dynamique/);
    assert.equal(find("head00000001").props.text, "{{post.title}}", "étiquette intacte");
  });

  test("T4 page publiée : la boucle affiche les vrais articles, l'étiquette n'apparaît jamais telle quelle, aucun outil d'édition", async () => {
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /Article 1/); assert.match(html, /Article 2/); assert.doesNotMatch(html, /\{\{/); assert.doesNotMatch(html, /data-node-id|pb-handle/);
    assert.deepEqual(errors, []);
  });
});
