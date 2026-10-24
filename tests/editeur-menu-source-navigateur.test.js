// Éditeur de pages — widget « Menu » : choix de la SOURCE des liens (menu du CMS affecté à un emplacement, menu précis, liste manuelle) dans un VRAI Chrome contre un vrai serveur.
// Le widget enregistre la source dans le brouillon ; en « emplacement », aucun lien n'est écrit dans la page (ils viennent d'Apparence → Menus) ; le canevas montre le menu affecté du site ou l'état vide.
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
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { /* nouvel essai */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); } }

describe("widget Menu : source des liens (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, pageId, siteId;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const menuProps = () => nodesOf(draft().sections).find((x) => x.type === "menu").props;
  const origin = () => ({ Origin: srv.base });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Site source" })).location.match(/(\d+)(#.*)?$/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil source", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const revision = Number(db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision);
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "menu00000001", type: "menu", props: { label: "Navigation", source: "location", location: "header", items: [] } }] }] } }, headers: origin() });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    // le menu AFFECTÉ à l'en-tête de ce site
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${siteId}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const rev = db().prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${siteId}`, { method: "POST", json: { revision: rev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }] }, headers: origin() });
    db().prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(siteId, mid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 1200 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le canevas montre le menu AFFECTÉ ; l'inspecteur propose la source ; passer en liste manuelle propose un premier lien ; retour à l'emplacement n'écrit aucun lien", async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 20000 }); await wait(400);
    assert.deepEqual(await frame().locator(".kw-menu-link").allTextContents(), ["Alpha", "Beta"], "le canevas affiche le menu affecté de CE site, pas une liste de démonstration");
    await frame().locator(".kw-menu").first().click();
    const source = page.getByLabel("Source des liens"); await source.waitFor({ timeout: 10000 });
    assert.equal(await source.inputValue(), "location"); assert.equal(await page.getByLabel("Emplacement", { exact: true }).inputValue(), "header");
    assert.equal(await page.getByText("Texte du lien").count(), 0, "en mode emplacement, aucun éditeur de liste manuelle");
    await source.selectOption("manual"); await until(() => menuProps().source === undefined && menuProps().items.length === 1, { what: "liste manuelle enregistrée avec un premier lien (sans champ « source » : forme historique)" });
    await page.getByText("Texte du lien").first().waitFor({ timeout: 8000 });
    await page.getByLabel("Source des liens").selectOption("location"); await until(() => menuProps().source === "location", { what: "retour à l'emplacement" });
    assert.equal(await page.getByText("Texte du lien").count(), 0); assert.deepEqual(await frame().locator(".kw-menu-link").allTextContents(), ["Alpha", "Beta"]);
    await page.getByLabel("Emplacement", { exact: true }).selectOption("footer"); await until(() => menuProps().location === "footer", { what: "emplacement pied de page" });
    await until(async () => (await frame().locator(".kw-menu-empty").count()) > 0, { what: "état vide du canevas : aucun menu affecté au pied de page" });
    assert.match(await frame().locator(".kw-menu-empty").first().innerText(), /aucun menu publié.*footer.*Apparence → Menus/);
    assert.equal(errors.length, 0, errors.join("\n"));
  });
});
