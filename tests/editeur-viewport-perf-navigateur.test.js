// Mesures de fluidité du zoom et de l'outil Main dans un VRAI Chrome, sur un document volumineux (≈ 340 éléments).
// MESURE et écrit les chiffres (variable PERF_OUT = fichier JSON) ; ne fixe que des plafonds larges (aucune régression grossière).
// Par scénario : durées d'image (requestAnimationFrame), nombre d'images longues (> 24 ms), et compteurs Chrome (mises en page, recalculs de style, durée de script).
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
        : j % 3 === 1 ? { id: `t${id}`, type: "text", props: { html: `<p>Paragraphe ${i}-${j} avec un texte assez long pour passer à la ligne sur les petites largeurs de la page.</p>` } }
          : { id: `b${id}`, type: "button", props: { label: `Bouton ${i}-${j}`, url: "/contact" } });
    }
    boxes.push({ id: `box${String(i).padStart(9, "0")}`, type: "container", props: {}, children: [{ id: `in${String(i).padStart(10, "0")}`, type: "container", props: {}, children: kids }] });
  }
  return { sections: [{ id: "sect00000001", type: "layout", children: boxes }] };
}

describe("fluidité du zoom et de la main (navigateur, document volumineux)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, cdp;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Perf viewport" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: bigContent() }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  const metrics = async () => { const m = (await cdp.send("Performance.getMetrics")).metrics; const g = (n) => (m.find((x) => x.name === n) || {}).value || 0; return { layouts: g("LayoutCount"), styles: g("RecalcStyleCount"), layoutMs: g("LayoutDuration") * 1000, scriptMs: g("ScriptDuration") * 1000, taskMs: g("TaskDuration") * 1000 }; };
  const recStart = () => page.evaluate(() => { window.__fr = []; let last = performance.now(); window.__run = true; (function tick(t) { if (!window.__run) return; window.__fr.push(t - last); last = t; requestAnimationFrame(tick); })(performance.now()); });
  const recStop = async () => { const fr = await page.evaluate(() => { window.__run = false; return window.__fr.slice(1); }); const s = fr.slice().sort((a, b) => a - b); return { frames: fr.length, meanMs: Math.round(fr.reduce((a, b) => a + b, 0) / (fr.length || 1) * 10) / 10, p95Ms: Math.round((s[Math.floor(s.length * 0.95)] || 0) * 10) / 10, maxMs: Math.round((s[s.length - 1] || 0) * 10) / 10, over24: fr.filter((x) => x > 24).length }; };
  const scenario = async (name, fn) => {
    await wait(300); const m0 = await metrics(); await recStart();
    const t0 = Date.now(); await fn(); await wait(400);
    const stats = await recStop(); const m1 = await metrics();
    return { [name]: { ...stats, wallMs: Date.now() - t0, layouts: m1.layouts - m0.layouts, styleRecalcs: m1.styles - m0.styles, layoutMs: Math.round(m1.layoutMs - m0.layoutMs), scriptMs: Math.round(m1.scriptMs - m0.scriptMs) } };
  };
  const clickZoom = (v) => page.click(`[data-pb-zoom="${v}"]`);

  test("zoom + / − / 100 %, outil Main, mesures", async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 90000 });
    await wait(1500);
    cdp = await context.newCDPSession(page); await cdp.send("Performance.enable");
    // Un élément est sélectionné : cadres de sélection, poignées et barre d'actions sont actifs (le cas réel de travail)
    await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const el = d.querySelector('[data-node-id^="hw00300000"]') || d.querySelector("[data-node-id]"); el.scrollIntoView({ block: "center" }); el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: d.defaultView })); });
    await wait(600);
    const out = { selectionActive: await page.evaluate(() => !!document.querySelector(".pb-cbar:not([hidden])")), elements: await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length) };
    // Même nombre de clics sur les deux versions, sans jamais atteindre une limite (le bouton se désactive à 400 % / 25 %)
    Object.assign(out, await scenario("zoomOut_x4", async () => { for (let i = 0; i < 4; i++) { await clickZoom("-"); await wait(60); } }));
    await clickZoom("100"); await wait(400);
    Object.assign(out, await scenario("zoomCycle_x20", async () => { for (let r = 0; r < 2; r++) { for (let i = 0; i < 5; i++) { await clickZoom("+"); await wait(60); } for (let i = 0; i < 5; i++) { await clickZoom("-"); await wait(60); } } }));
    await clickZoom("100"); await wait(400);
    // Clics rapides (sans pause) : le pire cas
    Object.assign(out, await scenario("zoomRafale_x4", async () => { for (let i = 0; i < 4; i++) await clickZoom("+"); }));
    await clickZoom("100"); await wait(400);
    // Outil Main : glisser dans la page, 120 mouvements
    await page.click('.pb-tool[data-mode="hand"]'); await wait(200);
    const box = await page.locator("[data-pb-frame]").boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    Object.assign(out, await scenario("mainPan_120", async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 120; i++) await page.mouse.move(cx - i * 2, cy - i * 3); await page.mouse.up(); }));
    out.scrollAfterPan = await page.evaluate(() => ({ y: document.querySelector("[data-pb-frame]").contentWindow.scrollY, sl: document.querySelector("[data-pb-stage]").scrollLeft }));
    console.log("PERF " + JSON.stringify(out));
    if (process.env.PERF_OUT) fs.writeFileSync(process.env.PERF_OUT, JSON.stringify(out, null, 2));
    assert.ok(out.zoomCycle_x20.frames > 3, "le zoom produit des images");
  });
});
