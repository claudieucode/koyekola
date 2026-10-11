// Styles enregistrés dans un VRAI navigateur : dialogue, sélection par catégorie, écrans, application, annulation, persistance, compatibilité.
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
const CONTENT = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [  { id: "head00000001", type: "heading", styles: { desktop: { color: "#112233", backgroundColor: "#fdf2dc", fontSize: "30px", paddingTop: "24px", borderRadius: "8px", opacity: "0.9" }, mobile: { color: "#445566" } }, props: { text: "Source", level: 2 } },
  { id: "head00000002", type: "heading", styles: { desktop: { paddingTop: "40px", fontSize: "18px" } }, props: { text: "Cible", level: 2 } },
  { id: "butt00000001", type: "button", props: { label: "Découvrir", url: "/catalogue", variant: "primary" } } ] }] }] });

describe("styles enregistrés (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, siteId;
  const db = () => srv.db();
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const find = (id) => nodesOf(draft().sections).find((n) => n.id === id);
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const select = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(300); };
  const classes = () => (JSON.parse(db().prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings || "{}").classes || []);
  const dlg = () => page.locator("[data-pb-style-dialog]");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site styles" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Styles", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT() }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const openCode = async () => {
    const tab = page.getByRole("tab", { name: /Avancé|Interactions/i }).first();
    if (await tab.count()) await tab.click();
    const sum = page.locator("details[data-group=code] > summary").first();
    await sum.waitFor({ state: "visible" });
    if (!(await page.locator("details[data-group=code]").first().evaluate((d) => d.open))) await sum.click();
  };
  const openDialog = async (id) => { await select(id); await openCode(); await page.locator("[data-pb-save-style]").click(); await dlg().waitFor({ state: "visible" }); };

  test("S1 le dialogue ne propose que les catégories réellement présentes ; tout sélectionner / désélectionner restent cohérents", async () => {
    await openDialog("head00000001");
    const cats = await dlg().locator("[data-sp-cat]").evaluateAll((l) => l.map((e) => e.dataset.spCat));
    assert.deepEqual(cats, ["colors", "dimensions", "typography", "borders", "objects"], "pas de catégorie vide : ombres et transformations absentes");
    assert.equal(await dlg().locator("[data-sp-all]").isChecked(), true);
    await dlg().locator('[data-sp-cat="typography"]').uncheck();
    assert.equal(await dlg().locator("[data-sp-all]").evaluate((e) => e.indeterminate), true, "l'état global reflète la décoche");
    await dlg().locator("[data-sp-none]").click();
    assert.equal(await dlg().locator("[data-sp-save]").isDisabled(), true, "rien de coché : on ne peut pas enregistrer");
    await dlg().locator("[data-sp-all]").check();
    assert.equal(await dlg().locator('[data-sp-cat="typography"]').isChecked(), true);
    const txt = await dlg().locator("[data-sp-summary]").textContent();
    assert.match(txt, /7 réglages/, txt);
    // structure / contenu jamais proposés
    const keys = await dlg().locator("[data-sp-key]").evaluateAll((l) => l.map((e) => e.dataset.spKey));
    assert.ok(!keys.includes("display") && !keys.includes("alignSelf"));
    await dlg().getByRole("button", { name: "Annuler" }).click();
    await dlg().waitFor({ state: "detached" });
    assert.equal(classes().length, 0, "annuler n'écrit rien");
  });

  test("S2 couleurs seulement, écran ordinateur seulement : le style ne contient que cela ; l'élément garde le reste", async () => {
    await openDialog("head00000001");
    await dlg().locator("[data-sp-none]").click();
    await dlg().locator('[data-sp-cat="colors"]').check();
    await dlg().locator('[data-sp-scope="mobile"]').uncheck();
    await dlg().getByLabel("Nom du style").fill("couleurs");
    await dlg().getByRole("button", { name: "Enregistrer le style" }).click();
    await until(() => classes().some((c) => c.name === "couleurs"), { what: "style enregistré dans le site" });
    const c = classes().find((x) => x.name === "couleurs");
    assert.deepEqual(c.styles, { desktop: { color: "#112233", backgroundColor: "#fdf2dc" } });
    assert.equal(c.states, undefined);
    assert.deepEqual(c.meta.categories, ["colors"]);
    assert.equal(c.meta.source, "heading");
    const n = (await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000001").classes === "couleurs", "classe posée"), find("head00000001"));
    assert.deepEqual(n.styles.desktop, { fontSize: "30px", paddingTop: "24px", borderRadius: "8px", opacity: 0.9 }, "les propriétés non choisies restent sur l'élément");
    assert.deepEqual(n.styles.mobile, { color: "#445566" }, "l'écran non choisi est intact");
  });

  test("S3 appliquer à un autre titre : seules les couleurs arrivent, ses propres réglages restent ; type différent : avertissement", async () => {
    await select("head00000002");
    await openCode();
    await page.locator(".pb-gclass-row", { hasText: ".couleurs" }).getByRole("checkbox").check();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000002").classes === "couleurs", "style appliqué");
    assert.deepEqual(find("head00000002").styles.desktop, { paddingTop: "40px", fontSize: "18px" });
    await until(async () => (await page.frameLocator("[data-pb-frame]").locator('[data-node-id="head00000002"]').evaluate((e) => getComputedStyle(e).backgroundColor)) === "rgb(253, 242, 220)", { what: "rendu du fond dans le canevas" });
    await select("butt00000001");
    await openCode();
    await page.locator(".pb-gclass-row", { hasText: ".couleurs" }).getByRole("checkbox").check();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "butt00000001").classes === "couleurs", "appliqué au bouton");
    assert.ok(errors.length === 0, errors.join("|"));
  });

  test("S4 annuler / rétablir l'enregistrement avec application ; remplacement explicite d'un style existant", async () => {
    await openDialog("head00000001");
    await dlg().locator("[data-sp-none]").click();
    await dlg().locator('[data-sp-cat="typography"]').check();
    await dlg().getByLabel("Nom du style").fill("couleurs");
    assert.equal(await dlg().locator("[data-sp-save]").textContent(), "Remplacer le style");
    assert.equal(await dlg().locator("[data-sp-error]").isVisible(), true, "avertissement de remplacement affiché");
    await dlg().getByLabel("Nom du style").fill("titre");
    await dlg().getByRole("button", { name: "Enregistrer le style" }).click();
    await until(() => classes().some((c) => c.name === "titre"), { what: "second style" });
    assert.deepEqual(classes().find((c) => c.name === "titre").styles, { desktop: { fontSize: "30px" } });
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000001").classes === "couleurs titre", "classes cumulées");
    assert.equal(find("head00000001").styles.desktop.fontSize, undefined, "réglage enregistré retiré de l'élément");
    await page.locator("[data-pb-undo]").click();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000001").classes === "couleurs" && nodesOf(d.sections).find((x) => x.id === "head00000001").styles.desktop.fontSize === "30px", "annulation : classe retirée, réglage revenu");
    await page.locator("[data-pb-redo]").click();
    await saved((d) => nodesOf(d.sections).find((x) => x.id === "head00000001").classes === "couleurs titre", "rétablissement");
  });

  test("S5 persistance après rechargement ; dialogue tenant sur un écran étroit ; aucune erreur", async () => {
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    assert.deepEqual(classes().map((c) => c.name).sort(), ["couleurs", "titre"]);
    await page.setViewportSize({ width: 390, height: 700 });
    await openDialog("head00000002");
    const box = await dlg().boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 700, JSON.stringify(box));
    await dlg().getByRole("button", { name: "Annuler" }).click();
    assert.deepEqual(errors, []);
  });
});
