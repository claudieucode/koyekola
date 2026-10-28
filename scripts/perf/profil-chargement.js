// Profil CPU d'un chargement de page (TITAN XXXI) : où passe le temps du thread principal ? (profil DevTools agrégé par fichier et par fonction)
// Usage : node scripts/perf/profil-chargement.js /marketing/campagnes /formateur/blog/nouveau ...
"use strict";
const { startServer, loginInstructor, createCourse } = require("../../tests/helpers.js");
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
(async () => {
  const urls = process.argv.slice(2).filter((a) => a.startsWith("/"));
  const srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "" });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    const boss = await loginInstructor(srv);
    await createCourse(boss, srv, { title: "Formation mesure" });
    for (const url of urls) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      await page.addInitScript(() => { window.__lcp = null; new PerformanceObserver((l) => { const e = l.getEntries().pop(); window.__lcp = { t: Math.round(e.startTime), tag: e.element && e.element.tagName, cls: e.element && String(e.element.className).slice(0, 50), url: e.url, size: e.size }; }).observe({ type: "largest-contentful-paint", buffered: true });
        window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); });
      await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start");
      await page.goto(srv.base + url, { waitUntil: "load" }); await page.waitForTimeout(800);
      const { profile } = await cdp.send("Profiler.stop");
      const info = await page.evaluate(() => ({ lcp: window.__lcp, long: window.__long }));
      const byId = new Map(profile.nodes.map((n) => [n.id, n])); const self = new Map(); const dt = profile.timeDeltas;
      profile.samples.forEach((id, i) => { const n = byId.get(id); const cf = n.callFrame; const key = `${cf.functionName || "(anonyme)"} ${(cf.url || "").replace(srv.base, "").replace(/\?.*/, "")}:${cf.lineNumber}`; self.set(key, (self.get(key) || 0) + (dt[i] || 0)); });
      const byFile = new Map(); for (const [k, v] of self) { const f = k.split(" ").pop().replace(/:\d+$/, ""); byFile.set(f, (byFile.get(f) || 0) + v); }
      const ms = (x) => (x / 1000).toFixed(0).padStart(5);
      console.log(`\n=== ${url}  LCP ${JSON.stringify(info.lcp)}  tâches longues ${JSON.stringify(info.long)}`);
      console.log("  par fichier :", [...byFile].sort((a, b) => b[1] - a[1]).filter(([f]) => f && f !== "(program)" && f !== "(idle)").slice(0, 6).map(([f, v]) => `${f || "natif"} ${ms(v)}ms`).join(" | "));
      console.log("  fonctions   :", [...self].sort((a, b) => b[1] - a[1]).filter(([k]) => !/^\((idle|program|garbage)/.test(k)).slice(0, 7).map(([k, v]) => `${k.slice(0, 70)} ${ms(v)}ms`).join("\n                "));
      await ctx.close();
    }
  } finally { await browser.close(); await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
