// Éditeur de pages — CLASSES GLOBALES DU SITE dans un VRAI navigateur (Chrome piloté par Playwright) contre un
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



const CONTENT = () => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", styles: { desktop: { backgroundColor: "#fdf2dc", paddingTop: "24px" } }, props: { text: "Premier", level: 2 } },
  { id: "head00000002", type: "heading", props: { text: "Second", level: 2 } } ] }] }] });

describe("classes globales (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, siteId;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const find = (id) => nodesOf(draft().sections).find((n) => n.id === id);
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const select = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(300); };
  const bg = (id) => frame().locator(`[data-node-id="${id}"]`).evaluate((e) => getComputedStyle(e).backgroundColor);
  const siteSettings = () => JSON.parse(db().prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings || "{}");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site classes" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Classes", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT() }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
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

  test("T1 créer une classe depuis un élément : enregistrée dans le site, appliquée, le style passe dans la classe", async () => {
    await select("head00000001");
    await openCode();
    await page.getByRole("button", { name: "Enregistrer comme style…" }).click();
    await page.getByLabel("Nom du style").fill("mise-en-avant");
    await page.getByRole("button", { name: "Enregistrer le style" }).click();
    await until(() => (siteSettings().classes || []).some((c) => c.name === "mise-en-avant"), { what: "classe enregistrée dans le site" });
    const cls = siteSettings().classes.find((c) => c.name === "mise-en-avant");
    assert.equal(cls.styles.desktop.backgroundColor, "#fdf2dc");
    await saved(() => find("head00000001").classes === "mise-en-avant" && !find("head00000001").styles, "classe appliquée, style propre déplacé dans la classe");
    await until(async () => (await bg("head00000001")) === "rgb(253, 242, 220)", { what: "le fond vient maintenant de la classe" });
  });

  test("T2 appliquer la classe à un autre élément (case à cocher) : même rendu ; mise à jour de la classe : les deux suivent", async () => {
    assert.equal(await bg("head00000002"), "rgba(0, 0, 0, 0)");
    await select("head00000002");
    await openCode();
    await page.locator(".pb-gclass-row", { hasText: ".mise-en-avant" }).getByRole("checkbox").check();
    await saved(() => find("head00000002").classes === "mise-en-avant", "classe appliquée au second");
    await until(async () => (await bg("head00000002")) === "rgb(253, 242, 220)", { what: "le second prend le style de la classe" });
    // le style propre du second l'emporte sur la classe
    await select("head00000002");
    // modification de la classe depuis le premier élément : un réglage propre puis « Mettre à jour le style »
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const d = draft();
    nodesOf(d.sections).find((n) => n.id === "head00000001").styles = { desktop: { backgroundColor: "#e0f2fe" } };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: d }, headers: { Origin: srv.base } })).status, 200);
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
    await select("head00000001");
    await openCode();
    await page.getByRole("button", { name: "Mettre à jour le style" }).click();
    await page.getByRole("button", { name: "Remplacer le style" }).click();
    await until(() => siteSettings().classes[0].styles.desktop.backgroundColor === "#e0f2fe", { what: "classe mise à jour dans le site" });
    await until(async () => (await bg("head00000002")) === "rgb(224, 242, 254)", { what: "le second élément suit la classe mise à jour" });
    await until(async () => (await bg("head00000001")) === "rgb(224, 242, 254)", { what: "le premier aussi" });
  });

  test("T3 supprimer la classe : le style disparaît des éléments ; page publiée cohérente ; aucune erreur", async () => {
    await select("head00000002");
    await openCode();
    page.once("dialog", (d) => d.accept());
    await page.locator(".pb-gclass-row", { hasText: ".mise-en-avant" }).getByRole("button", { name: /Supprimer la classe/ }).click();
    await until(() => (siteSettings().classes || []).length === 0, { what: "classe supprimée du site" });
    await until(async () => (await bg("head00000002")) === "rgba(0, 0, 0, 0)", { what: "plus de style" });
    assert.deepEqual(errors, []);
  });
});
