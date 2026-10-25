// Mesure de performance réelle dans Chrome (serveur local, réseau non limité : les chiffres sont COMPARABLES entre deux exécutions, pas des
// temps absolus de production). Par écran : poids transféré (compressé) par type, nombre de requêtes, DOMContentLoaded, load, FCP, LCP, CLS,
// tâches longues (> 50 ms), durées de script / mise en page / recalcul de style (CDP). Puis latence de quelques interactions.
//   NODE_PATH=…/node_modules node scripts/audit-performance.js [--out rapport.json] [--runs 3]
const fs = require("node:fs");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "/tmp/perf.json"); const RUNS = Number(arg("--runs", "3"));
const ROUTES = ["/marketing", "/marketing/site-web", "/marketing/site-web/sites", "/marketing/pages", "/marketing/contacts", "/marketing/campagnes", "/marketing/site-web/themes", "/marketing/site-web/mediatheque", "/marketing/site-web/parametres", "/marketing/site-web/utilisateurs", "/marketing/analytics", "/marketing/site-web/outils", "/marketing/site-web/commentaires"];
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const sections = require("../src/marketing/themes/library").pageSections("meridien", "accueil");
  const pageId = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Accueil perf', 'accueil-perf', 'Accueil', ?, 'draft', 'page', ?)").run(orgId, JSON.stringify(sections), site).lastInsertRowid);
  const tpl = Number((await boss.post("/marketing/modeles", { name: "Modèle perf", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  const all = [...ROUTES, `/marketing/pages/${pageId}/editeur`, `/marketing/modeles/${tpl}`, "/marketing/site-web/articles/ajouter"];
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const report = { date: new Date().toISOString(), runs: RUNS, pages: [], interactions: [] };

  for (const route of all) {
    const rows = [];
    for (let run = 0; run < RUNS; run += 1) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }); await cdp.send("Performance.enable");
      const bytes = { css: 0, js: 0, font: 0, img: 0, doc: 0, other: 0 }; let requests = 0;
      const types = new Map();
      cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
      cdp.on("Network.loadingFinished", (e) => { requests += 1; const t = types.get(e.requestId) || "Other"; const k = t === "Stylesheet" ? "css" : t === "Script" ? "js" : t === "Font" ? "font" : t === "Image" ? "img" : t === "Document" ? "doc" : "other"; bytes[k] += e.encodedDataLength; });
      await page.addInitScript(() => {
        window.__cls = 0; window.__lt = 0; window.__lcp = 0; window.__fcp = 0;
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch { /* absent */ }
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true }); } catch { /* absent */ }
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch { /* absent */ }
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__fcp = e.startTime; }).observe({ type: "paint", buffered: true }); } catch { /* absent */ }
      });
      try {
        await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load", timeout: 60000 }); await page.waitForTimeout(1500);
        const m = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round(window.__fcp), lcp: Math.round(window.__lcp), cls: Math.round(window.__cls * 1000) / 1000, tbt: Math.round(window.__lt), dom: document.getElementsByTagName("*").length }; });
        const cm = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
        rows.push({ ...m, script: Math.round(cm.ScriptDuration * 1000), layout: Math.round(cm.LayoutDuration * 1000), style: Math.round(cm.RecalcStyleDuration * 1000), styleCount: cm.RecalcStyleCount, heapMB: Math.round(cm.JSHeapUsedSize / 1048576 * 10) / 10, requests, kb: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])) });
      } catch (e) { rows.push({ error: String(e.message).slice(0, 80) }); }
      await ctx.close();
    }
    const ok = rows.filter((r) => !r.error);
    if (!ok.length) { report.pages.push({ route, error: rows[0].error }); continue; }
    const med = (k) => median(ok.map((r) => r[k]));
    report.pages.push({ route, dcl: med("dcl"), load: med("load"), fcp: med("fcp"), lcp: med("lcp"), cls: med("cls"), tbt: med("tbt"), script: med("script"), layout: med("layout"), style: med("style"), styleCount: med("styleCount"), heapMB: med("heapMB"), requests: med("requests"), dom: med("dom"), kb: ok[0].kb, kbTotal: Object.values(ok[0].kb).reduce((s, v) => s + v, 0) });
  }

  // latence des interactions : clic → deux images affichées (proche de l'INP), médiane de 5 essais, page chaude
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage();
  const lat = async (label, selector, setup) => {
    const t = [];
    for (let i = 0; i < 5; i += 1) {
      if (setup) await setup();
      if (!(await page.locator(selector).count())) { report.interactions.push({ label, error: "élément absent" }); return; }
      const ms = await page.evaluate(async (sel) => { const e = document.querySelector(sel); const t0 = performance.now(); e.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; }, selector);
      t.push(ms); await page.waitForTimeout(250);
    }
    report.interactions.push({ label, medianMs: Math.round(median(t) * 10) / 10, maxMs: Math.round(Math.max(...t) * 10) / 10 });
  };
  await page.goto(`${srv.base}/marketing/site-web?site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(800);
  await lat("Réduire / déplier le menu latéral", ".mk-cms-fold, .mk-collapse-btn");
  await lat("Changer de thème clair/sombre", "[data-kola-theme-cycle]");
  await lat("Ouvrir / fermer un groupe du menu", ".mk-nav-head");
  await page.goto(`${srv.base}/marketing/site-web/sites?site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(800);
  await lat("Ouvrir la boîte « Créer un site »", "[data-mk-modal-open]", async () => { await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close())); });
  await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`, { waitUntil: "load" }); await page.waitForTimeout(2500);
  await lat("Éditeur de pages : onglet Blocs", ".pb-left [role=tab]:nth-child(2)");
  await ctx.close();
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  console.log("route | KB | req | DCL | load | FCP | LCP | CLS | TBT | script | layout | style(n)");
  for (const p of report.pages) console.log(p.error ? `${p.route} ERREUR ${p.error}` : `${p.route.slice(0, 44).padEnd(44)} ${String(p.kbTotal).padStart(5)} ${String(p.requests).padStart(3)} ${String(p.dcl).padStart(5)} ${String(p.load).padStart(5)} ${String(p.fcp).padStart(5)} ${String(p.lcp).padStart(5)} ${String(p.cls).padStart(6)} ${String(p.tbt).padStart(4)} ${String(p.script).padStart(5)} ${String(p.layout).padStart(5)} ${p.style}(${p.styleCount})`);
  for (const i of report.interactions) console.log(`${i.label} : ${i.error || i.medianMs + " ms (max " + i.maxMs + ")"}`);
})();
