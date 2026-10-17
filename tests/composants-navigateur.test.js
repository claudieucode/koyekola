// Composants réutilisables dans un VRAI navigateur (Chrome piloté par Playwright) : enregistrer depuis la sélection, bibliothèque,
// insertion standard / globale, mise à jour, détachement, suppression à deux options. Ignoré si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout; let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (e) { last = e; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre A", level: 2 } },
  { id: "text00000001", type: "text", props: { text: "Paragraphe A" } },
] }] };

describe("composants réutilisables (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const flat = (l, out = []) => { for (const x of l || []) { out.push(x); flat(x.children, out); } return out; };
  const fr = () => page.frameLocator("[data-pb-frame]");
  const toast = () => page.locator("[data-pb-toast]");
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const dlg = () => page.locator("dialog.pb-comp-dlg[open]");
  const openLib = async (tab) => { await page.locator(`#pb-lib-${tab}`).click(); await wait(150); };
  const rowOf = (name) => page.locator(`.pb-comp2:has(.pb-comp-name:text-is("${name}"))`);
  // « Enregistrer comme composant… » : menu clic droit sur la sélection (même chemin que l'inspecteur et la palette de commandes)
  const openSave = async (id) => { await fr().locator(`[data-node-id="${id}"]`).click({ button: "right" }); await page.getByText("Enregistrer comme composant…", { exact: true }).first().click(); };
  const selectBoth = async () => { await fr().locator('[data-node-id="head00000001"]').click(); await fr().locator('[data-node-id="text00000001"]').click({ modifiers: ["Shift"] }); await wait(200); };
  const comps = () => db().prepare("SELECT * FROM mk_web_components ORDER BY id").all();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Composants" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector('[data-node-id="head00000001"]'); }, null, { timeout: 20000 });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("un seul bloc : pas de choix global ; annuler ne change rien ; enregistrer crée un composant standard", async () => {
    await fr().locator('[data-node-id="head00000001"]').click(); await wait(200);
    await openSave("head00000001");
    await dlg().waitFor();
    assert.equal(await dlg().locator("input[type=radio][name=kind]").count(), 0, "bloc unique : aucun choix standard/global");
    const before = JSON.stringify(draft());
    await dlg().locator("[data-cd-cancel]").click();
    assert.equal(comps().length, 0);
    assert.equal(JSON.stringify(draft()), before);
    await openSave("head00000001");
    await dlg().locator("input[name=name]").fill("Titre réutilisable");
    await dlg().locator("[data-cd-ok]").click();
    await until(() => comps().length === 1, { what: "composant créé" });
    assert.equal(comps()[0].kind, "standard");
    await openLib("components");
    await rowOf("Titre réutilisable").waitFor();
    assert.match(await rowOf("Titre réutilisable").innerText(), /Standard/);
  });

  test("plusieurs blocs : choix Standard / Global, nom unique exigé, composant global enregistré et listé", async () => {
    await selectBoth();
    await openSave("text00000001");
    await dlg().waitFor();
    assert.equal(await dlg().locator("input[type=radio][name=kind]").count(), 2);
    assert.match(await dlg().innerText(), /2 blocs sélectionnés/);
    await dlg().locator("input[name=name]").fill("Titre réutilisable");
    await dlg().locator("[data-cd-ok]").click();
    await dlg().locator("[data-cd-error]").waitFor({ state: "visible" });
    assert.match(await dlg().locator("[data-cd-error]").innerText(), /déjà ce nom/);
    await dlg().locator("input[name=name]").fill("Bandeau global");
    await dlg().locator("label[for=pb-comp-kind-glo]").click();
    await dlg().locator("[data-cd-ok]").click();
    await until(() => comps().length === 2, { what: "composant global créé" });
    assert.equal(comps()[1].kind, "global");
    await openLib("globals");
    assert.match(await rowOf("Bandeau global").innerText(), /Global.*aucune instance liée/s);
  });

  test("insertion : standard = copie indépendante ; global = instance liée ; recherche et renommage", async () => {
    const n0 = flat(draft().sections).length;
    await openLib("components");
    await rowOf("Titre réutilisable").locator("[data-comp-insert]").click();
    await until(() => flat(draft().sections).length > n0, { what: "copie insérée" });
    assert.ok(!flat(draft().sections).some((x) => x.type === "component"));
    await openLib("globals");
    await rowOf("Bandeau global").locator("[data-comp-insert]").click();
    await until(() => flat(draft().sections).some((x) => x.type === "component"), { what: "instance liée" });
    await saved();
    assert.equal(flat(draft().sections).find((x) => x.type === "component").componentId, comps()[1].id);
    await openLib("components");
    await page.locator("#pb-comp-q-site").fill("zzz");
    assert.match(await page.locator("[data-pb-components]").innerText(), /ne correspond/);
    await page.locator("#pb-comp-q-site").fill("");
    await rowOf("Titre réutilisable").locator("[data-comp-menu]").click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.locator("[data-pb-ask-fields] input[name=name]").fill("Titre renommé");
    await page.keyboard.press("Enter");
    await rowOf("Titre renommé").waitFor();
    assert.equal(comps()[0].id, comps().find((c) => c.name === "Titre renommé").id, "même identité après renommage");
  });

  test("détacher : bloc indépendant, nouveaux identifiants, annulable", async () => {
    const inst = flat(draft().sections).find((x) => x.type === "component");
    await fr().locator(`[data-node-id="${inst.id}"], [data-section-id="${inst.id}"]`).first().click();
    await wait(250);
    await page.locator("[data-comp-detach]").click();
    await until(() => !flat(draft().sections).some((x) => x.type === "component"), { what: "détachement" });
    const ids = flat(draft().sections).map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, "identifiants uniques");
    await page.keyboard.press("Control+z");
    await until(() => flat(draft().sections).some((x) => x.type === "component"), { what: "annulation du détachement" });
  });

  test("suppression avec instances : deux options, aucune référence orpheline", async () => {
    await saved();
    await openLib("globals");
    await rowOf("Bandeau global").locator("[data-comp-menu]").click();
    await page.getByRole("menuitem", { name: /Supprimer/ }).click();
    await dlg().waitFor();
    assert.equal(await dlg().locator("input[name=mode]").count(), 2);
    assert.match(await dlg().innerText(), /1 instance liée/);
    await dlg().locator("label[for=pb-comp-del-detach]").click();
    await dlg().locator("[data-cd-ok]").click();
    await until(() => !comps().some((c) => c.name === "Bandeau global"), { what: "composant supprimé" });
    await until(() => !flat(draft().sections).some((x) => x.type === "component"), { what: "plus de référence" });
    assert.ok(flat(draft().sections).some((x) => x.type === "heading" && x.props.text === "Titre A"), "l'instance est devenue un bloc indépendant avec son contenu");
    assert.equal(await rowOf("Bandeau global").count(), 0);
    assert.deepEqual(errors, []);
  });
});
