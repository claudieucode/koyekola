const path = require("path"); const fs = require("fs");
const REPO = path.join(__dirname, "..", "..", "..");
const { chromium } = require("playwright-core");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const src = fs.readFileSync(path.join(__dirname, "bench.js"), "utf8");
const makeContent = new Function(src.slice(src.indexOf("function makeContent"), src.indexOf("const median")) + "; return makeContent;")();
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: (process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"), headless: true, args: ["--enable-precise-memory-info"] });
  const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await context.newPage();
  const pageId = Number((await boss.post("/marketing/pages", { name: "Fuites" })).location.match(/(\d+)$/)[1]);
  const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const { sections } = makeContent(100);
  await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: { sections } }, headers: { Origin: srv.base } });
  const cdp = await context.newCDPSession(page);
  await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
  await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const lis = async (expr) => { const { result } = await cdp.send("Runtime.evaluate", { expression: expr }); const r = await cdp.send("DOMDebugger.getEventListeners", { objectId: result.objectId }); const t = {}; r.listeners.forEach((l) => { t[l.type] = (t[l.type] || 0) + 1; }); return t; };
  const snap = async (label) => { const live = await page.evaluate(() => document.getElementsByTagName("*").length + document.querySelector("[data-pb-frame]").contentDocument.getElementsByTagName("*").length); const onDoc = await lis("document"), onWin = await lis("window"), onFrameDoc = await lis("document.querySelector('[data-pb-frame]').contentDocument"); return Object.assign(await snap0(label), { liveNodes: live, onDoc, onWin, onFrameDoc }); };
  const snap0 = async (label) => { await cdp.send("HeapProfiler.collectGarbage"); await cdp.send("HeapProfiler.collectGarbage"); const c = await cdp.send("Memory.getDOMCounters"); const m = await page.evaluate(() => performance.memory.usedJSHeapSize); return { label, heapMB: Math.round(m / 1048576 * 100) / 100, nodes: c.nodes, listeners: c.jsEventListeners, documents: c.documents }; };
  const out = [await snap("départ")];
  const ids = await page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("h2[data-node-id]")].map((e) => e.getAttribute("data-node-id")));
  const cycle = (n) => page.evaluate(async ({ ids, n }) => {
    const f0 = () => document.querySelector("[data-pb-frame]");
    const tick = () => new Promise((r) => requestAnimationFrame(() => r()));
    for (let i = 0; i < n; i++) {
      const f = f0();
      f.contentDocument.querySelector('[data-node-id="' + ids[i % ids.length] + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow }));
      await tick();
      const b = document.querySelector('[aria-label="Désélectionner"]'); if (b) b.click();
      await tick();
    }
  }, { ids, n });
  await cycle(100); out.push(await snap("après 100 sélections/désélections"));
  await cycle(100); out.push(await snap("après 200"));
  // 40 modifications + annuler/rétablir (rendus du canevas)
  await page.evaluate(async (id) => { const f = document.querySelector("[data-pb-frame]"); f.contentDocument.querySelector('[data-node-id="' + id + '"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: f.contentWindow })); }, ids[2]);
  await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click();
  const openAll = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details").forEach((d) => { d.open = true; }));
  await openAll();
  const field = page.locator('[data-pb-inspector] .pb-prop[data-prop="fontSize"] input.pb-len-num');
  for (let i = 0; i < 40; i++) { await openAll(); await field.focus(); await page.keyboard.press("ArrowUp"); await page.waitForTimeout(120); }
  await page.waitForTimeout(1500);
  out.push(await snap("après 40 changements de style"));
  for (let i = 0; i < 40; i++) { await page.evaluate(() => document.querySelector("[data-pb-undo]").click()); await page.waitForTimeout(100); }
  for (let i = 0; i < 40; i++) { await page.evaluate(() => document.querySelector("[data-pb-redo]").click()); await page.waitForTimeout(100); }
  await page.waitForTimeout(1500);
  out.push(await snap("après 40 annuler + 40 rétablir"));
  for (let i = 0; i < 30; i++) { await page.evaluate((s) => document.querySelector(s).click(), i % 2 ? '[data-pb-zoom="+"]' : '[data-pb-zoom="-"]'); await page.waitForTimeout(60); }
  out.push(await snap("après 30 zooms"));
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(__dirname, "leak.json"), JSON.stringify(out, null, 1));
  await browser.close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
