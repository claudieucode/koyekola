// Style Studio dans un VRAI navigateur : bibliothèque, modes Compléter / Remplacer, redéfinition, dissociation, suppression sûre, renommer, dupliquer, états.
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
const CONTENT = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", styles: { desktop: { color: "#112233", backgroundColor: "#fdf2dc", fontSize: "30px", borderRadius: "8px" } }, states: { hover: { color: "#334455" } }, props: { text: "Source", level: 2 } },
  { id: "head00000002", type: "heading", styles: { desktop: { color: "#aa0000", fontSize: "18px", paddingTop: "40px" } }, props: { text: "Cible", level: 2 } },
  { id: "head00000003", type: "heading", props: { text: "Libre", level: 2 } } ] }] }] });

describe("Style Studio (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, siteId;
  const db = () => srv.db();
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const find = (id) => nodesOf(draft().sections).find((n) => n.id === id);
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const classes = () => (JSON.parse(db().prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings || "{}").classes || []);
  const select = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(300); };
  const css = (id, prop) => page.frameLocator("[data-pb-frame]").locator(`[data-node-id="${id}"]`).evaluate((e, p) => getComputedStyle(e)[p], prop);
  const ctx = async (id, name) => { await select(id); await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click({ button: "right" }); await page.getByRole("menuitem", { name }).click(); };
  const lib = () => page.locator("[data-pb-style-library]");
  const reload = async () => { await page.reload(); await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }); await wait(500); };
  const putDraft = async (mut) => { const d = draft(); mut(d); const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision; assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: d }, headers: { Origin: srv.base } })).status, 200); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site studio" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Studio", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT() }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("E1 enregistrer « Carte » (sans l'appliquer) : états et écrans inclus, apparence de la source inchangée", async () => {
    await ctx("head00000001", /Enregistrer comme style/);
    const dlg = page.locator("[data-pb-style-dialog]");
    await dlg.getByLabel("Nom du style").fill("Carte à l'honneur");
    await dlg.locator("[data-sp-apply]").uncheck();
    await dlg.getByRole("button", { name: "Enregistrer le style" }).click();
    await until(() => classes().length === 1, { what: "style enregistré" });
    const c = classes()[0];
    assert.equal(c.name, "carte-a-l-honneur");
    assert.equal(c.label, "Carte à l'honneur");
    assert.deepEqual(c.states, { hover: { color: "#334455" } });
    assert.deepEqual(c.styles.desktop, { color: "#112233", backgroundColor: "#fdf2dc", fontSize: "30px", borderRadius: "8px" });
    assert.deepEqual(find("head00000001").styles.desktop, c.styles.desktop, "non appliqué : la source garde ses réglages");
  });

  test("E2 bibliothèque : recherche, mode Compléter (le réglage propre l'emporte), puis Remplacer (catégories du style retirées, le reste conservé)", async () => {
    await ctx("head00000002", /Appliquer un style/);
    await lib().waitFor({ state: "visible" });
    await lib().locator("[data-sl-search]").fill("zzz");
    assert.equal(await lib().locator(".pb-sl-row").count(), 0);
    await lib().locator("[data-sl-search]").fill("carte");
    await lib().locator('[data-sl-apply="carte-a-l-honneur"]').click();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000002").classes === "carte-a-l-honneur", "appliqué en complément");
    assert.deepEqual(find("head00000002").styles.desktop, { color: "#aa0000", fontSize: "18px", paddingTop: "40px" }, "Compléter ne retire rien");
    await until(async () => (await css("head00000002", "color")) === "rgb(170, 0, 0)", { what: "le réglage propre l'emporte" });
    await until(async () => (await css("head00000002", "backgroundColor")) === "rgb(253, 242, 220)", { what: "le fond vient du style" });
    await lib().locator('[data-sl-mode="replace"]').click();
    await lib().locator('[data-sl-apply="carte-a-l-honneur"]').click();
    await saved((d) => !nodesOf(d.sections).find((x) => x.id === "head00000002").styles.desktop.color, "couleur propre retirée");
    assert.deepEqual(find("head00000002").styles.desktop, { paddingTop: "40px" }, "Remplacer retire color/fontSize (catégories du style) mais garde le padding");
    await until(async () => (await css("head00000002", "color")) === "rgb(17, 34, 51)", { what: "la couleur vient maintenant du style" });
    await lib().getByRole("button", { name: "Fermer", exact: true }).last().click();
  });

  test("E3 redéfinir depuis un élément : le style change, les éléments liés suivent, leurs réglages propres restent", async () => {
    await putDraft((d) => { nodesOf(d.sections).find((x) => x.id === "head00000001").styles.desktop.color = "#00aa00"; });
    await reload();
    await ctx("head00000001", /Appliquer un style/);
    await lib().waitFor({ state: "visible" });
    await lib().locator('.pb-sl-row[data-style="carte-a-l-honneur"] summary').click();
    await lib().locator('[data-sl-redefine="carte-a-l-honneur"]').click();
    const dlg = page.locator("[data-pb-style-dialog]");
    assert.match(await dlg.locator("[data-sp-error]").textContent(), /utilisé par 1 élément/);
    await dlg.getByRole("button", { name: "Redéfinir le style" }).click();
    await until(() => classes()[0].styles.desktop.color === "#00aa00", { what: "définition mise à jour" });
    assert.equal(classes()[0].label, "Carte à l'honneur", "le nom affiché est conservé");
    await until(async () => (await css("head00000002", "color")) === "rgb(0, 170, 0)", { what: "l'élément lié suit" });
    assert.equal(find("head00000002").styles.desktop.paddingTop, "40px");
  });

  test("E4 dissocier : apparence identique, lien coupé, autres éléments intacts ; annuler / rétablir", async () => {
    const before = { c: await css("head00000002", "color"), b: await css("head00000002", "backgroundColor"), f: await css("head00000002", "fontSize"), r: await css("head00000002", "borderTopLeftRadius") };
    await ctx("head00000002", /Dissocier du style/);
    await saved((d) => !nodesOf(d.sections).find((x) => x.id === "head00000002").classes, "lien coupé");
    const n = find("head00000002");
    assert.equal(n.styles.desktop.color, "#00aa00");
    assert.equal(n.styles.desktop.paddingTop, "40px");
    assert.deepEqual({ c: await css("head00000002", "color"), b: await css("head00000002", "backgroundColor"), f: await css("head00000002", "fontSize"), r: await css("head00000002", "borderTopLeftRadius") }, before, "apparence inchangée");
    assert.equal(classes().length, 1, "le style reste dans la bibliothèque");
    await page.locator("[data-pb-undo]").click();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000002").classes === "carte-a-l-honneur", "annulation : lien rétabli");
    await page.locator("[data-pb-redo]").click();
    await saved((d) => !nodesOf(d.sections).find((x) => x.id === "head00000002").classes, "rétablissement");
  });

  test("E5 renommer et dupliquer dans la bibliothèque ; supprimer dissocie les éléments qui l'utilisent sans changer leur rendu", async () => {
    await select("head00000003");
    await page.locator("[data-pb-layers] .pb-node[data-id=head00000003] > .pb-row-item").click({ button: "right" });
    await page.getByRole("menuitem", { name: /Appliquer un style/ }).click();
    await lib().waitFor({ state: "visible" });
    await lib().locator('[data-sl-apply="carte-a-l-honneur"]').click();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000003").classes === "carte-a-l-honneur", "appliqué au troisième");
    await lib().locator('.pb-sl-row[data-style="carte-a-l-honneur"] summary').click();
    await lib().locator('[data-sl-rename="carte-a-l-honneur"]').click();
    await page.locator("[data-pb-ask-fields] [name=label]").fill("Carte vedette");
    await page.locator("[data-pb-ask-form]").getByRole("button", { name: "Valider" }).click();
    await until(() => classes()[0].label === "Carte vedette" && classes()[0].name === "carte-a-l-honneur", { what: "renommé sans casser les liens" });
    assert.equal(find("head00000003").classes, "carte-a-l-honneur");
    await lib().locator('.pb-sl-row[data-style="carte-a-l-honneur"] summary').click();
    await lib().locator('[data-sl-dup="carte-a-l-honneur"]').click();
    await until(() => classes().length === 2, { what: "dupliqué" });
    assert.deepEqual(classes()[1].styles, classes()[0].styles);
    const before = await css("head00000003", "backgroundColor");
    page.once("dialog", (d) => d.accept());
    await lib().locator('.pb-sl-row[data-style="carte-a-l-honneur"] summary').click();
    await lib().locator('[data-sl-delete="carte-a-l-honneur"]').click();
    await until(() => classes().length === 1, { what: "style supprimé" });
    await saved((d) => !nodesOf(d.sections).find((x) => x.id === "head00000003").classes && nodesOf(d.sections).find((x) => x.id === "head00000003").styles.desktop.backgroundColor === "#fdf2dc", "élément dissocié, apparence copiée");
    assert.equal(await css("head00000003", "backgroundColor"), before, "rendu identique après suppression");
    assert.deepEqual(errors, []);
  });
});
