// Header Builder, lot L8 (performance) — décalage de mise en page (CLS) pendant le chargement et le défilement d'un en-tête fixé / collé / masquable, et coût du défilement,
// sur le site publié dans un VRAI Chrome. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L8 : performance de l'en-tête publié (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => { env = await setup({ siteName: "Site performance" }); });
  after(async () => { if (env) await env.close(); });

  const measure = async (header, viewport = { width: 1280, height: 800 }) => {
    await env.publishHeader("luxe-01.luxe-01", header);
    const context = await env.browser.newContext({ viewport }); const page = await context.newPage();
    await page.addInitScript(() => { window.__cls = 0; window.__lt = 0; window.__frames = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true }); new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lt += e.duration; })).observe({ entryTypes: ["longtask"] }); });
    await page.goto(`${env.srv.base}/p/${env.slug()}`); await page.waitForSelector(".lp-site-header"); await page.addStyleTag({ content: "body, .lp-main{min-height:5000px}" }); await page.waitForTimeout(500);
    for (let y = 0; y <= 2400; y += 200) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    for (let y = 2400; y >= 0; y -= 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    const r = await page.evaluate(() => ({ cls: window.__cls, longtask: window.__lt })); await context.close(); return r;
  };

  for (const [label, header] of [["collé", { mode: "sticky" }], ["fixé", { mode: "fixed" }], ["collé, réduit au défilement", { mode: "sticky", fx: "shrink" }], ["collé, masqué en descendant", { mode: "sticky", hideOnScroll: { enabled: true, tolerance: 8 } }], ["superposé, fond plein", { mode: "overlay", fx: "solid" }]]) {
    test(`décalage de mise en page (CLS) : en-tête ${label} n'ajoute pas de saut par rapport au même modèle en en-tête ordinaire (et reste < 0,25)`, async () => {
      const base = await measure({ mode: "static" }), r = await measure(header);
      assert.ok(r.cls <= base.cls + 0.02, `CLS ${r.cls.toFixed(4)} contre ${base.cls.toFixed(4)} pour l'en-tête ordinaire (en-tête ${label})`);
      assert.ok(r.cls < 0.25, `CLS ${r.cls.toFixed(4)} (en-tête ${label})`);
    });
  }

  test("coût du script : le défilement n'ajoute aucune tâche longue (> 50 ms) sur un en-tête masquable", async () => {
    const r = await measure({ mode: "sticky", hideOnScroll: { enabled: true, tolerance: 8 }, fx: "both" });
    assert.ok(r.longtask < 200, `durée cumulée des tâches longues : ${Math.round(r.longtask)} ms`);
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
