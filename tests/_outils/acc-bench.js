// Mesure des accordéons de Confidentialité (outil de diagnostic, pas un test) : node tests/_outils/acc-bench.js [label]
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../marketing-helpers");
const { startServer, loginInstructor } = require("../helpers");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${srv.base}/marketing/site-web/parametres/confidentialite?site=${A}&onglet=guide`);
  await page.locator("[data-pv-root]").waitFor();
  const cdp = await ctx.newCDPSession(page); await cdp.send("Performance.enable");
  if (process.env.THROTTLE) await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE) });
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await page.evaluate(() => {
    window.__f = []; window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ entryTypes: ["longtask"] }); } catch {}
  });
  const btns = page.locator("[data-pv-acc-btn]"); const n = await btns.count();
  async function run(name, fn) {
    await page.evaluate(() => { window.__f = []; window.__lt = []; let last = performance.now(); window.__run = true; (function tick(t) { window.__f.push(t - last); last = t; if (window.__run) requestAnimationFrame(tick); })(last); });
    const m0 = await metrics(); const t0 = Date.now();
    await fn(); await page.waitForTimeout(450);
    const m1 = await metrics();
    const r = await page.evaluate(() => { window.__run = false; const f = window.__f.slice(1); const s = [...f].sort((a, b) => a - b); return { frames: f.length, worst: Math.max(...f), p95: s[Math.floor(s.length * .95)], over20: f.filter((x) => x > 20).length, lt: window.__lt.length, ltMax: Math.max(0, ...window.__lt) }; });
    console.log(name.padEnd(34), `frames=${r.frames} pire=${r.worst.toFixed(1)}ms p95=${r.p95.toFixed(1)}ms >20ms=${r.over20} longtasks=${r.lt}(${r.ltMax.toFixed(0)}ms) layouts=${m1.LayoutCount - m0.LayoutCount} layoutMs=${((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1)} styleRecalc=${m1.RecalcStyleCount - m0.RecalcStyleCount}`);
  }
  const click = (i) => btns.nth(i).click();
  await run("ouvrir le 1er", () => click(0));
  await run("fermer le 1er", () => click(0));
  await run("ouvrir long (générales)", () => click(1));
  await run("fermer long", () => click(1));
  await run("5 ouvertures de suite", async () => { for (let i = 1; i <= 5 && i < n; i++) { await click(i); await page.waitForTimeout(60); } });
  await run("alternance rapide x10", async () => { for (let i = 0; i < 10; i++) { await click(2); await page.waitForTimeout(40); } });
  console.log("erreurs JS :", errs.length ? errs : "aucune");
  await browser.close(); db.close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
