// Audit RESPONSIVE et performance de rendu de TOUS les thèmes de la bibliothèque dans un vrai Chrome.
// Pour chaque thème, chaque page de démonstration et chaque taille d'écran : débordement horizontal, éléments qui dépassent, images cassées ou déformées,
// cibles tactiles trop petites, menu inutilisable sur mobile, texte illisible (trop petit) ; LCP et CLS mesurés sur la page d'accueil.
// Usage : node scripts/audit-themes-responsive.js <sortie.json> ; env : ONLY=cle1,cle2  PAGES=all|home  VIEWPORTS=...
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const library = require(path.join(REPO, "src/marketing/themes/library"));
const catalog = require(path.join(REPO, "src/marketing/themes/catalog"));
const VPS = [["très grand écran", 1920, 1080], ["ordinateur", 1440, 900], ["portable", 1280, 720], ["tablette paysage", 1024, 768], ["tablette portrait", 768, 1024], ["mobile large", 430, 932], ["mobile", 390, 844], ["petit mobile", 320, 568]];
const VPSEL = process.env.VIEWPORTS ? process.env.VIEWPORTS.split(",") : null;
const SETTLE = Number(process.env.SETTLE || 120);
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const PAGES = process.env.PAGES || "all";
const probe = () => {
  const vw = document.documentElement.clientWidth, out = { overflowX: document.documentElement.scrollWidth - vw, bad: [], broken: 0, distorted: 0, small: 0, tiny: 0 };
  const seen = new Set();
  for (const el of document.body.querySelectorAll("*")) {
    const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    // éléments qui dépassent du côté droit ou gauche de l'écran sans être dans un conteneur qui défile ou coupé
    if ((r.right > vw + 2 || r.left < -2) && out.bad.length < 5) {
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) { const o = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 2 && p.getBoundingClientRect().left >= -2) { clipped = true; break; } p = p.parentElement; }
      if (!clipped && cs.position !== "fixed" && !el.closest("[aria-hidden=true],.sr-only")) { const k = el.tagName + "." + String(el.className).slice(0, 30); if (!seen.has(k)) { seen.add(k); out.bad.push(`${k} ${Math.round(r.left)}→${Math.round(r.right)}`); } }
    }
    if (el.tagName === "IMG") {
      if (el.complete && el.naturalWidth === 0) out.broken++;
      else if (el.naturalWidth && r.height > 20) { const ratio = (el.naturalWidth / el.naturalHeight) / (r.width / r.height); if ((ratio > 1.15 || ratio < 0.87) && cs.objectFit === "fill") out.distorted++; }
    }
    if ((el.tagName === "A" || el.tagName === "BUTTON") && (r.width < 24 || r.height < 24) && el.textContent.trim() && vw <= 768) out.small++;
    if (vw <= 768 && parseFloat(cs.fontSize) < 11 && el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) out.tiny++;
  }
  // navigation : sur mobile, au moins un moyen d'accéder aux liens (liens visibles ou bouton de menu)
  const nav = document.querySelector("header nav, [role=navigation], .lp-site-header nav");
  const toggle = document.querySelector("[aria-expanded][aria-controls], .kw-menu-toggle, [data-menu-toggle], button[aria-label*=enu i]");
  const visibleLinks = nav ? [...nav.querySelectorAll("a")].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== "hidden"; }).length : 0;
  out.nav = nav ? (visibleLinks > 0 || (toggle && toggle.getBoundingClientRect().width > 0) ? "ok" : "inaccessible") : "aucune";
  return out;
};
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit thèmes" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  await ctx.addInitScript(() => { window.__cls = 0; window.__lcp = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch {} });
  const page = await ctx.newPage();
  const rows = []; const keys = catalog.catalog().map((m) => m.key).filter((k) => !ONLY || ONLY.includes(k));
  let n = 0;
  for (const key of keys) {
    const spec = library.specOf(key); if (!spec) { rows.push({ key, err: "pas de site de démonstration" }); continue; }
    const pagesList = PAGES === "home" ? [spec.pages[0]] : spec.pages;
    for (const pg of pagesList) {
      for (const [vname, w, h] of VPS.filter((v) => !VPSEL || VPSEL.includes(v[0]))) {
        n++;
        try {
          await page.setViewportSize({ width: w, height: h });
          const t0 = Date.now();
          const resp = await page.goto(`${srv.base}/marketing/site-web/themes/${key}/demo/${pg.key}?site=${site}`, { waitUntil: "load", timeout: 60000 });
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {}); await page.waitForTimeout(SETTLE); await page.evaluate(() => window.scrollTo(0, 0));
          const m = await page.evaluate(probe); const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), loadEv: Math.round(n.loadEventEnd), kb: Math.round(n.transferSize / 1024) } : {}; });
          const web = pg === pagesList[0] ? await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3) })) : null;
          rows.push({ key, page: pg.key, vp: vname, w, status: resp.status(), ms: Date.now() - t0, ...m, ...nav, ...(web || {}) });
        } catch (e) { rows.push({ key, page: pg.key, vp: vname, w, err: String(e.message).slice(0, 100) }); }
      }
    }
    if (rows.length % 80 === 0) fs.writeFileSync(process.argv[2] || ".audit-themes.json", JSON.stringify(rows));
  }
  await browser.close(); await srv.stop();
  fs.writeFileSync(process.argv[2] || ".audit-themes.json", JSON.stringify(rows));
  const ko = rows.filter((r) => r.err || r.overflowX > 1 || r.bad && r.bad.length || r.broken || r.distorted);
  console.log(`thèmes ${keys.length}, mesures ${rows.length}, anomalies ${ko.length}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
