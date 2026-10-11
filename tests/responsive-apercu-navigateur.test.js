// Aperçu immédiat sur un appareil autre que l'ordinateur : le rendu serveur est retardé de 2,5 s ; la valeur choisie sur la tablette ou le
// mobile apparaît quand même tout de suite dans le canevas À LA LARGEUR DE CET APPAREIL, est enregistrée dans la zone de cet appareil
// seulement, et le rendu serveur qui suit la confirme.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : aperçu responsive non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(60); } }

describe("aperçu immédiat sur tablette et mobile (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id, delay = 0;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  const styles = (nid) => ((find(JSON.parse(row().draft || row().sections).sections, nid) || {}).styles) || {};
  const computed = (nid, css) => page.evaluate(({ nid, css }) => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector(`[data-node-id="${nid}"]`); return e ? f.contentWindow.getComputedStyle(e).getPropertyValue(css) : null; }, { nid, css });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Aperçu responsive", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const content = { title: "A", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: "Titre", level: "2" }, styles: { desktop: { fontSize: "40px", textAlign: "left" } } }] }] };
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

  for (const device of ["tablet", "mobile"]) {
    test(`${device} : taille (nombre) et alignement (icônes) visibles avant la fin du rendu serveur, enregistrés pour cet appareil seulement`, async () => {
      await page.locator(`[role="radio"][data-device="${device}"]`).first().click(); await wait(1000);
      await page.locator('[data-pb-layers] .pb-node[data-id="hed000000001"] > .pb-row-item').click(); await wait(250);
      await page.locator("[data-pb-inspector] [role=tab]", { hasText: /^Style$/ }).click(); await wait(150);
      for (let i = 0; i < 2; i++) { await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(200); }
      const size = device === "tablet" ? "30" : "18", align = device === "tablet" ? "center" : "right";
      delay = 2500;
      const field = page.locator('[data-pb-inspector] .pb-prop[data-prop="fontSize"] input.pb-len-num').first();
      await field.fill(size); await field.press("Enter");
      await until(async () => (await computed("hed000000001", "font-size")) === `${size}px`, { timeout: 1500, what: "taille aperçue" });
      await page.locator(`[data-pb-inspector] .pb-prop[data-prop="textAlign"] button[data-value="${align}"]`).click();
      await until(async () => (await computed("hed000000001", "text-align")) === align, { timeout: 1500, what: "alignement aperçu" });
      delay = 0;
      await until(() => styles("hed000000001")[device] && styles("hed000000001")[device].fontSize === `${size}px` && styles("hed000000001")[device].textAlign === align, { what: "enregistré pour l'appareil" });
      assert.deepEqual(styles("hed000000001").desktop, { fontSize: "40px", textAlign: "left" }, "l'ordinateur n'a pas bougé");
      await wait(3200); // le rendu retardé arrive : même valeur
      assert.equal(await computed("hed000000001", "font-size"), `${size}px`);
      assert.equal(await computed("hed000000001", "text-align"), align);
    });
  }
});
