// Programme 22.9 — mesures de LABORATOIRE (Chrome réel piloté par Playwright), hors `npm test`. Compare la même page publique avec l'optimisation « priorité de l'image principale » activée et désactivée.
// Conditions documentées dans le rapport : navigateur, profil appareil/réseau simulé (CDP), nombre de relevés, médiane et étendue. Ces valeurs sont des mesures de LABORATOIRE, pas des données d'utilisateurs réels.
// Usage : NODE_PATH=<dossier>/node_modules node tests/manuel/perf-lab.js <dossier de sortie> [relevés=7]
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const ROOT = path.join(__dirname, "..", "..");
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { TEST_KEY } = require(path.join(ROOT, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const OUT = process.argv[2], RUNS = Number(process.argv[3] || 7); fs.mkdirSync(OUT, { recursive: true });
// Profils : débit/latence du profil « mobile 4G lent » de Lighthouse (1,6 Mbit/s descendant, 150 ms RTT) + processeur ralenti 4×
const PROFILES = {
  "ordinateur (réseau local, processeur normal)": { cpu: 1, net: null, viewport: { width: 1350, height: 900 } },
  "mobile lent (1,6 Mbit/s, RTT 150 ms, CPU x4)": { cpu: 4, net: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }, viewport: { width: 390, height: 800 }, mobile: true },
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const spread = (a) => Math.max(...a) - Math.min(...a);
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db();
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Labo" })).location.match(/sites\/(\d+)/)[1]);
  await boss.post("/marketing/pages", { name: "Page labo", site_id: site, kind: "page" });
  const p = db.prepare("SELECT id, slug, revision, name FROM mk_landing_pages WHERE name = 'Page labo'").get();
  // Vraies images locales (238 Ko et ~200 Ko) servies par l'application elle-même, donc soumises à la limitation réseau
  fs.mkdirSync(path.join(srv.dir, "uploads", "thumbnails"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "public/img/accueil/etude-1-1600.jpg"), path.join(srv.dir, "uploads/thumbnails/labo-1.jpg"));
  fs.copyFileSync(path.join(ROOT, "public/img/accueil/etude-2-1600.jpg"), path.join(srv.dir, "uploads/thumbnails/labo-2.jpg"));
  const node = (id, type, props) => ({ id, type, props, styles: { desktop: {}, tablet: {}, mobile: {} }, children: [] });
  const sections = [{ type: "layout", id: "lablayout001", children: [
    node("labh00001", "heading", { text: "Page de mesure", level: 1 }),
    node("labi00001", "image", { src: "/uploads/thumbnails/labo-1.jpg", alt: "Image principale", size: "full" }),
    node("labt00001", "text", { html: "<p>Texte de la page de mesure.</p>" }),
    node("labi00002", "image", { src: "/uploads/thumbnails/labo-2.jpg", alt: "Seconde image", size: "full" }),
  ] }];
  const sv = await boss.request(`/marketing/pages/${p.id}/brouillon`, { method: "PUT", json: { revision: p.revision, content: { sections, title: "Page labo", description: "" } } });
  if (sv.status !== 200) throw new Error("brouillon : " + sv.text.slice(0, 300));
  if ((await boss.post(`/marketing/pages/${p.id}/publier.json`, {})).status !== 200) throw new Error("publication refusée");
  const setOpt = async (v) => { const r = await boss.request(`/marketing/site-web/sites/${site}/performance/api/options`, { method: "POST", json: { option: "lcpPriority", value: v } }); if (r.status !== 200) throw new Error("option : " + r.text); };
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const env = { navigateur: browser.version(), machine: `${os.cpus()[0].model.trim()} × ${os.cpus().length}`, charge: os.loadavg().map((x) => Math.round(x * 10) / 10), systeme: `${os.type()} ${os.release()}`, build: require(path.join(ROOT, "package.json")).version, relevesParProfil: RUNS, at: new Date().toISOString() };
  const result = { env, runs: {} };
  async function once(profile, cfg) {
    const ctx = await browser.newContext({ viewport: cfg.viewport, isMobile: Boolean(cfg.mobile), deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (cfg.net) await cdp.send("Network.emulateNetworkConditions", cfg.net);
    if (cfg.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cfg.cpu });
    await page.addInitScript(() => {
      window.__m = { lcp: 0, lcpEl: "", cls: 0, longTasks: 0, tbt: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element && (e.element.currentSrc || e.element.tagName)) || ""; } }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.longTasks += 1; window.__m.tbt += Math.max(0, e.duration - 50); } }).observe({ type: "longtask", buffered: true });
    });
    let reqs = 0, bytes = 0; page.on("response", async (r) => { reqs += 1; try { const l = Number((await r.allHeaders())["content-length"] || 0); bytes += l; } catch { /* ignoré */ } });
    await page.goto(`${srv.base}/p/${p.slug}`, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => ({ ...window.__m, imgs: [...document.images].map((i) => ({ src: i.currentSrc.split("/").pop(), lazy: i.loading, fp: i.fetchPriority })) }));
    await ctx.close(); return { ...m, requests: reqs, bytes };
  }
  try {
    for (const [pname, cfg] of Object.entries(PROFILES)) {
      result.runs[pname] = {};
      for (const [label, on] of [["optimisation désactivée", false], ["optimisation activée", true]]) {
        await setOpt(on); await once(pname, cfg); // relevé de chauffe ignoré
        const rows = []; for (let i = 0; i < RUNS; i++) rows.push(await once(pname, cfg));
        const col = (k) => rows.map((r) => r[k]);
        result.runs[pname][label] = { lcp: { median: Math.round(median(col("lcp"))), spread: Math.round(spread(col("lcp"))), values: col("lcp").map(Math.round) }, cls: { median: Number(median(col("cls")).toFixed(4)), spread: Number(spread(col("cls")).toFixed(4)) }, tbt: { median: Math.round(median(col("tbt"))) }, requests: median(col("requests")), imgs: rows[0].imgs, lcpEl: rows[0].lcpEl.split("/").pop() };
        console.log(pname, "|", label, "| LCP médiane", result.runs[pname][label].lcp.median, "ms (étendue", result.runs[pname][label].lcp.spread, ") CLS", result.runs[pname][label].cls.median, JSON.stringify(rows[0].imgs));
      }
    }
  } finally { await browser.close(); db.close(); await srv.stop(); }
  fs.writeFileSync(path.join(OUT, "perf-lab.json"), JSON.stringify(result, null, 2));
  console.log("écrit", path.join(OUT, "perf-lab.json"));
})().catch((e) => { console.error(e); process.exit(1); });
