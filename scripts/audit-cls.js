// Sources des décalages de mise en page d'un écran : node scripts/audit-cls.js "route@largeur" [...autres]
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { chromium } = require("playwright-core");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  for (const spec of process.argv.slice(2)) {
    const [route, w] = spec.split("@");
    const ctx = await browser.newContext({ viewport: { width: Number(w || 1440), height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.__ls = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__ls.push({ v: Math.round(e.value * 1000) / 1000, t: Math.round(e.startTime), s: (e.sources || []).map((x) => { const n = x.node; return (n ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + "." + String(n.className || "").split(/\s+/).slice(0, 2).join(".") : "?") + " " + JSON.stringify(x.previousRect) + "→" + JSON.stringify(x.currentRect); }) }); }).observe({ type: "layout-shift", buffered: true }); });
    await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(2000);
    console.log("==", spec); console.log(JSON.stringify(await page.evaluate(() => window.__ls), null, 1).slice(0, 1800));
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
})();
