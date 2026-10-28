// Banc de chargement navigateur (TITAN XXXI) : Chrome réel (Playwright), serveur de test isolé. Pour chaque page :
// requêtes, octets transférés (compressés, via le protocole DevTools), FCP, LCP, CLS, tâches longues, ressources bloquant le rendu,
// JS/CSS exécutés. Deux conditions : « local » (aucune limite) et « 4G » (1,6 Mbit/s, 150 ms) ; un chargement à froid puis un à chaud (cache).
// Usage : node scripts/perf/mesure-chargement-navigateur.js [--sortie fichier.json] [--n 3]
"use strict";
const fs = require("node:fs");
const { startServer, loginInstructor, createCourse, newStudent } = require("../../tests/helpers.js");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("n", 3)), OUT = arg("sortie", "");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "" });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    const boss = await loginInstructor(srv);
    const course = await createCourse(boss, srv, { title: "Formation mesure" });
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article mesure", content: "<h2>Titre</h2>" + "<p>Texte de l'article. </p>".repeat(40), status: "published" })) fd.append(k, v);
    const art = JSON.parse((await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    const pages = [
      ["public", "/"], ["public", "/catalogue"], ["public", `/cours/${course.slug}`], ["public", "/blog"], ["public", `/blog/${art.slug}`], ["public", "/connexion"],
      ["formateur", "/formateur"], ["formateur", "/formateur/formations"], ["formateur", "/formateur/blog"], ["formateur", "/formateur/blog/nouveau"], ["formateur", "/formateur/apparence"],
      ["marketing", "/marketing"], ["marketing", "/marketing/contacts"], ["marketing", "/marketing/campagnes"], ["marketing", "/marketing/pages"], ["marketing", "/marketing/site-web"],
    ];
    const conditions = { local: null, "4G": { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 } };
    const rows = [];
    for (const [who, url] of pages) for (const [cname, net] of Object.entries(conditions)) {
      const runs = [];
      for (let i = 0; i < N + 1; i++) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        if (who !== "public") await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
        if (net) await cdp.send("Network.emulateNetworkConditions", { offline: false, ...net });
        const res = new Map(); const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        cdp.on("Network.requestWillBeSent", (e) => res.set(e.requestId, { url: e.request.url, type: e.type, bytes: 0, blocking: e.request.renderBlockingStatus || "" }));
        cdp.on("Network.responseReceived", (e) => { const r = res.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.enc = e.response.headers["content-encoding"] || ""; r.cache = e.response.fromDiskCache || e.response.fromServiceWorker ? "cache" : ""; } });
        cdp.on("Network.loadingFinished", (e) => { const r = res.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
        await page.addInitScript(() => {
          window.__m = { lcp: 0, cls: 0, longTasks: [], };
          new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.longTasks.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true });
        });
        const t = Date.now();
        await page.goto(srv.base + url, { waitUntil: "load", timeout: 120000 });
        const load = Date.now() - t;
        await page.waitForTimeout(600);
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0]; const fcp = (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime || 0;
          return { ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd, loadEv: nav.loadEventEnd, fcp, lcp: window.__m.lcp, cls: window.__m.cls, long: window.__m.longTasks, tbt: window.__m.longTasks.reduce((a, d) => a + Math.max(0, d - 50), 0), heap: performance.memory ? performance.memory.usedJSHeapSize : 0, dom: document.getElementsByTagName("*").length };
        });
        const all = [...res.values()].filter((r) => r.status);
        const sum = (f) => all.filter(f).reduce((a, r) => a + r.bytes, 0);
        runs.push({ i, load, ...m, requests: all.length, bytes: sum(() => true), js: sum((r) => r.type === "Script"), css: sum((r) => r.type === "Stylesheet"), img: sum((r) => r.type === "Image"), font: sum((r) => r.type === "Font"), doc: sum((r) => r.type === "Document"),
          blocking: all.filter((r) => /blocking/i.test(r.blocking) && !/non/i.test(r.blocking)).map((r) => r.url.replace(srv.base, "")), top: all.sort((a, b) => b.bytes - a.bytes).slice(0, 4).map((r) => `${r.url.replace(srv.base, "").slice(0, 60)} ${Math.round(r.bytes / 1024)}Ko`), errors });
        await ctx.close();
      }
      const cold = runs[0], warm = runs.slice(1);
      rows.push({ who, url, net: cname, cold, warm: { load: med(warm.map((r) => r.load)), fcp: med(warm.map((r) => r.fcp)), lcp: med(warm.map((r) => r.lcp)), bytes: med(warm.map((r) => r.bytes)) } });
    }
    const out = { date: new Date().toISOString(), rows };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
    const f = (x) => String(Math.round(x)).padStart(6);
    console.log("page                                      réseau  FCP   LCP   DCL  load   TBT  CLS   req  Ko(tot/js/css/img)    ");
    for (const r of rows) { const c = r.cold; console.log(`${(r.who + " " + r.url).slice(0, 40).padEnd(40)}  ${r.net.padEnd(5)} ${f(c.fcp)}${f(c.lcp)}${f(c.dcl)}${f(c.load)}${f(c.tbt)} ${c.cls.toFixed(3)} ${String(c.requests).padStart(4)}  ${Math.round(c.bytes / 1024)}/${Math.round(c.js / 1024)}/${Math.round(c.css / 1024)}/${Math.round(c.img / 1024)}  bloquantes:${c.blocking.length}${c.errors.length ? "  ERREURS " + c.errors.length : ""}`); }
  } finally { await browser.close(); await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
