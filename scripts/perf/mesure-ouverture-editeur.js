#!/usr/bin/env node
// Ouverture de l'éditeur de pages : où passe le temps ? Chrome réel (Playwright) contre un vrai serveur. Mesure, pour une page de N éléments :
// temps jusqu'au canevas prêt, tâches longues (>50 ms), ressources chargées (nombre, octets), et profil CPU du chargement agrégé PAR FICHIER SCRIPT.
//   NODE_PATH=<dossier de playwright-core> node scripts/perf/mesure-ouverture-editeur.js [--size=100] [--mix=riche] [--runs=3] [--cpu=1] [--json=fichier]
const fs = require("fs");
const path = require("path");
const { startServer, loginInstructor } = require("../../tests/helpers");
const { TEST_KEY } = require("../../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const SIZE = Number(arg("size", "100")), RUNS = Number(arg("runs", "3")), CPU = Number(arg("cpu", "1")), JSON_OUT = arg("json", ""), MIX = arg("mix", "simple");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function content(total) {
  let n = 0;
  const id = (p) => `${p}${String(++n).padStart(9, "0")}`.slice(0, 12);
  const leaf = (i) => {
    const k = i % 6;
    if (MIX === "riche" && k >= 2 && k <= 4) { const r = k % 3; return r === 0 ? { id: id("ac"), type: "accordion", props: { items: [{ q: "Q ?", a: "R." }] } } : r === 1 ? { id: id("tb"), type: "tabs", props: { items: [{ title: "Un", text: "A" }, { title: "Deux", text: "B" }] } } : { id: id("ct"), type: "counter", props: { value: 120, label: "Chiffre", suffix: "", prefix: "", duration: 1500 } }; }
    if (k === 0) return { id: id("hd"), type: "heading", props: { text: `Titre ${i}`, level: 3 } };
    return { id: id("tx"), type: "text", props: { html: `<p>Paragraphe ${i}</p>` } };
  };
  const secs = [];
  for (let s = 0, made = 0; made < total; s++) { const kids = []; for (let j = 0; j < 8 && made < total; j++, made++) kids.push(leaf(made)); secs.push({ id: `sect${String(s + 1).padStart(8, "0")}`, type: "layout", children: [{ id: id("cn"), type: "container", children: kids }] }); }
  return secs;
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const pageId = Number((await boss.post("/marketing/pages", { name: `Ouverture ${SIZE}` })).location.match(/(\d+)$/)[1]);
  const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: content(SIZE) } }, headers: { Origin: srv.base } });
  if (put.status !== 200) throw new Error(`page refusée ${put.status} ${put.text.slice(0, 200)}`);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const out = { size: SIZE, mix: MIX, cpu: CPU, runs: [] };
  for (let r = 0; r < RUNS; r++) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
    await page.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: "longtask", buffered: true }); } catch (e) { /* non disponible */ } });
    await cdp.send("Profiler.start");
    const t0 = Date.now();
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`, { waitUntil: "commit" });
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 120000 });
    const ready = Date.now() - t0;
    const { profile } = await cdp.send("Profiler.stop");
    const byFile = new Map(), byFn = new Map(); const dt = profile.timeDeltas; const idIdx = new Map(profile.nodes.map((nd) => [nd.id, nd]));
    profile.samples.forEach((sid, i) => { const nd = idIdx.get(sid); const u = (nd.callFrame.url || "(natif)").replace(/^.*\/(js|css)\//, "").replace(/\?.*$/, ""); byFile.set(u, (byFile.get(u) || 0) + (dt[i] || 0)); if (u === "page-builder.js" || /^page-builder/.test(u)) { const k = `${nd.callFrame.functionName || "(anonyme)"}:${nd.callFrame.lineNumber + 1}`; byFn.set(k, (byFn.get(k) || 0) + (dt[i] || 0)); } });
    const res = await page.evaluate(() => { const rs = performance.getEntriesByType("resource"); return { n: rs.length, ko: Math.round(rs.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024), long: window.__lt.slice(), nav: Math.round(performance.getEntriesByType("navigation")[0].domInteractive), scripts: rs.filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name)).length }; });
    out.runs.push({ ready, ...res, cpuParFichier: [...byFile.entries()].filter(([k]) => k !== "(natif)").sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)} ms`) });
    out.runs[out.runs.length - 1].fonctions = [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)} ms`);
    await ctx.close();
  }
  out.pret = med(out.runs.map((r) => r.ready));
  out.tachesLongues = med(out.runs.map((r) => r.long.length));
  out.tempsTachesLongues = med(out.runs.map((r) => r.long.reduce((a, b) => a + b, 0)));
  console.log(JSON.stringify(out, null, 1));
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
  await browser.close(); await srv.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
