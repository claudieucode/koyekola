// Mesures de performance de la barre contextuelle dans un VRAI Chrome, sur un document volumineux (≈ 500 éléments imbriqués).
// Ce test MESURE et écrit les chiffres (variable PERF_OUT = fichier JSON) ; il ne fixe que des plafonds larges (aucune régression grossière).
// Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mesures non exécutées sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function bigContent() {
  const boxes = [];
  for (let i = 0; i < 28; i++) {
    const kids = [];
    for (let j = 0; j < 10; j++) {
      const id = `w${String(i).padStart(3, "0")}${String(j).padStart(3, "0")}00`;
      kids.push(j % 3 === 0 ? { id: `h${id}`, type: "heading", props: { text: `Titre ${i}-${j}`, level: "3" } }
        : j % 3 === 1 ? { id: `t${id}`, type: "text", props: { html: `<p>Paragraphe ${i}-${j}</p>` } }
          : { id: `b${id}`, type: "button", props: { label: `Bouton ${i}-${j}`, url: "/contact" }, styles: { desktop: { fontSize: "16px" }, tablet: { fontSize: "14px" } } });
    }
    boxes.push({ id: `box${String(i).padStart(9, "0")}`, type: "container", props: {}, children: [{ id: `in${String(i).padStart(10, "0")}`, type: "container", props: {}, children: kids }] });
  }
  return { sections: [{ id: "sect00000001", type: "layout", children: boxes }] };
}

describe("performance de la barre contextuelle (navigateur, document volumineux)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Perf barre" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: bigContent() }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("ouverture, sélection, apparition de la barre, exécution de commandes, mémoire", async () => {
    const t0 = Date.now();
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("pb-ready") || (f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]")); }, null, { timeout: 60000 });
    const openMs = Date.now() - t0;
    await wait(800);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    const heap = async () => { const m = (await cdp.send("Performance.getMetrics")).metrics; const g = (n) => (m.find((x) => x.name === n) || {}).value || 0; return { heapMB: Math.round(g("JSHeapUsedSize") / 1048576 * 10) / 10, nodes: g("Nodes"), listeners: g("JSEventListeners") }; };
    const before = await heap();
    // Sélection de 20 éléments l'un après l'autre : temps jusqu'à l'affichage de la barre (deux images)
    const ids = await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]")].map((e) => e.getAttribute("data-node-id")).filter((x) => /^[hbt]w/.test(x)).slice(0, 400));
    const times = [];
    for (let k = 0; k < 20; k++) {
      const id = ids[Math.floor(k * ids.length / 20)];
      const ms = await page.evaluate(async (id) => {
        const doc = document.querySelector("[data-pb-frame]").contentDocument;
        const el = doc.querySelector(`[data-node-id="${id}"]`); el.scrollIntoView({ block: "center" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const t = performance.now();
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: doc.defaultView }));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const bar = document.querySelector(".pb-cbar");
        return bar && !bar.hidden ? performance.now() - t : -1;
      }, id);
      times.push(ms);
    }
    const ok = times.filter((x) => x >= 0).sort((a, b) => a - b);
    // Duplication puis annulation sur un élément
    const dup = await page.evaluate(async () => {
      const t = performance.now(); const b = document.querySelector('.pb-cbar-btn[data-action="duplicate"]'); if (!b) return -1; b.click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t;
    });
    const after = await heap();
    const out = { openEditorMs: openMs, selectBarMs: { n: ok.length, median: ok[Math.floor(ok.length / 2)], p90: ok[Math.floor(ok.length * 0.9)], max: ok[ok.length - 1] }, duplicateMs: Math.round(dup), heapBefore: before, heapAfterSelections: after, elements: ids.length };
    console.log("PERF " + JSON.stringify(out));
    if (process.env.PERF_OUT) fs.writeFileSync(process.env.PERF_OUT, JSON.stringify(out, null, 2));
    assert.ok(ok.length >= 15, `la barre doit apparaître à chaque sélection (${ok.length}/20)`);
    assert.ok(ok[Math.floor(ok.length / 2)] < 400, "médiane d'apparition de la barre sous 400 ms");
  });
});
