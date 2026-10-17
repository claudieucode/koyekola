// Classes globales du site : export en fichier .json et import (fusion par nom) dans un VRAI navigateur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("classes globales : export / import (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, pageId, siteId, tmp;
  const classes = () => (JSON.parse(srv.db().prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId).settings || "{}").classes || []);
  const names = () => classes().map((c) => c.name).sort();
  before(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw-classes-"));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site classes" })).location).match(/sites\/(\d+)/)[1]);
    const url = `/marketing/site-web/sites/${siteId}/reglages.json`;
    const cur = JSON.parse((await boss.request(url)).text);
    const put = await boss.request(url, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, classes: [{ name: "carte-a", label: ".carte-a", styles: { desktop: { color: "#112233" } } }] } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text);
    pageId = Number((await boss.post("/marketing/pages", { name: "Classes", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "T", level: "2" } }] }] }] } }, headers: { Origin: srv.base } })).status, 200);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(300);
    const tab = page.getByRole("tab", { name: /Avancé|Interactions/i }).first();
    if (await tab.count()) await tab.click();
    const sum = page.locator("details[data-group=code] > summary").first();
    await sum.waitFor({ state: "visible" });
    if (!(await page.locator("details[data-group=code]").first().evaluate((d) => d.open))) await sum.click();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); });

  test("exporter : un fichier .json contenant les classes du site", async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-pb-classes-export]").click()]);
    assert.equal(dl.suggestedFilename(), "classes-globales.json");
    const file = path.join(tmp, "export.json"); await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(data.kolakisa, "classes"); assert.deepEqual(data.classes.map((c) => c.name), ["carte-a"]);
  });

  test("importer : ajoute les nouvelles classes, remplace celles du même nom, garde les autres", async () => {
    const file = path.join(tmp, "import.json");
    fs.writeFileSync(file, JSON.stringify({ kolakisa: "classes", version: 1, classes: [{ name: "carte-a", label: ".carte-a", styles: { desktop: { color: "#aa0000" } } }, { name: "carte-b", label: ".carte-b", styles: { desktop: { color: "#00aa00" } } }] }));
    await page.locator("[data-pb-classes-import]").setInputFiles(file);
    await until(() => names().join() === "carte-a,carte-b", { what: "classes importées" });
    const a = classes().find((c) => c.name === "carte-a");
    assert.equal(JSON.stringify(a).includes("#aa0000"), true, "carte-a remplacée par la version importée");
  });

  test("importer un fichier invalide ou piégé : rien ne change", async () => {
    const before = JSON.stringify(classes());
    const bad = path.join(tmp, "bad.json"); fs.writeFileSync(bad, "ceci n'est pas du json");
    await page.locator("[data-pb-classes-import]").setInputFiles(bad); await wait(800);
    const evil = path.join(tmp, "evil.json");
    fs.writeFileSync(evil, JSON.stringify({ classes: [{ name: "Mauvais Nom!", styles: { desktop: { color: "red" } } }] }));
    await page.locator("[data-pb-classes-import]").setInputFiles(evil); await wait(1200);
    assert.equal(JSON.stringify(classes()), before);
  });
  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
