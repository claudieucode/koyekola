// Aperçu immédiat des choix de mise en page (liste / boutons à icônes) : la valeur choisie est visible dans le canevas SANS attendre le rendu
// serveur. Le test retarde volontairement la réponse du rendu de 2,5 s pour prouver que l'affichage vient de l'aperçu, puis vérifie que le
// rendu serveur qui suit confirme exactement la même valeur (aucun retour en arrière ni clignotement) et que le document est enregistré.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : aperçu immédiat non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }

describe("aperçu immédiat des choix de mise en page (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id, delay = 0;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  const saved = (nid) => (((find(JSON.parse(row().draft || row().sections).sections, nid) || {}).styles) || {}).desktop || {};
  const computed = (nid, css) => page.evaluate(({ nid, css }) => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector(`[data-node-id="${nid}"]`); return e ? f.contentWindow.getComputedStyle(e).getPropertyValue(css) : null; }, { nid, css });
  const select = async (nid, tab = "Style") => {
    await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(250);
    await page.locator("[data-pb-inspector] [role=tab]", { hasText: new RegExp(`^${tab}$`) }).click(); await wait(150);
    for (let i = 0; i < 2; i++) { await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(200); }
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Aperçu", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const content = { title: "Aperçu", sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "box000000001", type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "row" } }, children: [
        { id: "hed000000001", type: "heading", props: { text: "Un", level: "2" } }, { id: "hed000000002", type: "heading", props: { text: "Deux", level: "2" } } ] } ] }] };
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage();
    await page.route(/\/rendu$/, async (route) => { if (delay) await wait(delay); await route.continue(); });
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(1200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [nid, prop, css, value, expected] of [
    ["hed000000001", "textAlign", "text-align", "right", "right"],
    ["box000000001", "flexDirection", "flex-direction", "column", "column"],
    ["box000000001", "justifyContent", "justify-content", "center", "center"],
    ["box000000001", "alignItems", "align-items", "flex-end", "flex-end"],
    ["box000000001", "flexWrap", "flex-wrap", "wrap", "wrap"],
    ["hed000000001", "textTransform", "text-transform", "uppercase", "uppercase"],
  ]) {
    test(`${prop} = ${value} : visible dans le canevas AVANT la fin du rendu serveur, puis confirmé par lui et enregistré`, async () => {
      await select(nid);
      const control = page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"]`).first();
      delay = 2500;
      const t0 = Date.now();
      if (await control.locator(`button[data-value="${value}"]`).count()) await control.locator(`button[data-value="${value}"]`).click();
      else await control.locator("select").first().selectOption(value);
      await until(async () => (await computed(nid, css)) === expected, { timeout: 1500, what: `${prop} aperçu` });
      const shown = Date.now() - t0;
      assert.ok(shown < 1500, `aperçu en ${shown} ms`);
      delay = 0;
      await until(() => saved(nid)[prop] === value, { what: `${prop} enregistré` });
      await wait(3200); // le rendu retardé arrive : la valeur ne doit ni changer ni revenir en arrière
      assert.equal(await computed(nid, css), expected, "valeur confirmée par le rendu serveur");
    });
  }
});
