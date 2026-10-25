// Audit responsive de l'administration dans un vrai Chrome : matrice de largeurs (320 à 1920 px, tactile émulé jusqu'à 768 px), par écran :
// débordement horizontal de la page, éléments hors cadre, cibles tactiles trop petites, champs dont la police < 16 px (zoom automatique sur iPhone),
// boîtes de dialogue qui dépassent la fenêtre, barres collantes qui mangent l'écran.
//   NODE_PATH=…/node_modules node scripts/audit-responsive.js [--out r.json] [--shard 0/3] [--widths 320,390,768,1280] [--only fragment]
const fs = require("node:fs");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const nav = require("../src/marketing/web/nav");
const cms = require("../src/marketing/web/cmsNav");
const { measure } = require("./lib/auditMeasure");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "/tmp/responsive.json");
const [SI, SN] = arg("--shard", "0/1").split("/").map(Number);
const WIDTHS = arg("--widths", "320,360,390,430,600,768,900,1024,1280,1440,1920").split(",").map(Number);
const ONLY = arg("--only", "");

function inPage(touch) {
  const res = { small: [], font: [], dialogs: [], sticky: [] };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = String(el.className && el.className.baseVal === undefined ? el.className : "").trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += "." + c.join("."); return s; };
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05 && !el.closest("[hidden],[inert],[aria-hidden='true'],dialog:not([open]),details:not([open]) > :not(summary),.sr-only"); };
  // cibles tactiles : au moins 40 px dans une des deux dimensions utiles (hauteur pour un bouton large), sauf lien en ligne dans un texte
  if (touch) {
    const seen = new Set();
    for (const el of document.querySelectorAll("button, a[href], input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, summary, [role=button], [role=tab]")) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el); if (cs.display === "inline" && el.closest("p, li, td, dd, label, .mk-sub, .field-hint")) continue;
      const r = el.getBoundingClientRect(); if (r.height >= 40 && r.width >= 40) continue; if (r.height >= 40 && r.width >= 24 && (el.textContent || "").trim().length > 3) continue;
      const k = sel(el); if (seen.has(k)) continue; seen.add(k);
      res.small.push({ sel: k, w: Math.round(r.width), h: Math.round(r.height), text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24) });
    }
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]), select, textarea")) {
      if (!vis(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 16) res.font.push({ sel: sel(el), px: fs });
    }
  }
  for (const d of document.querySelectorAll("dialog")) {
    try { if (d.open) continue; d.showModal(); } catch { continue; }
    const r = d.getBoundingClientRect();
    res.dialogs.push({ sel: sel(d), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, off: r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1, hScroll: d.scrollWidth > d.clientWidth + 1, noScroll: r.height >= innerHeight - 2 && getComputedStyle(d).overflowY === "visible" });
    d.close();
  }
  for (const el of document.querySelectorAll("*")) { const cs = getComputedStyle(el); if ((cs.position === "fixed" || cs.position === "sticky") && vis(el)) { const r = el.getBoundingClientRect(); if (r.width > innerWidth * 0.7 && r.height > innerHeight * 0.3) res.sticky.push({ sel: sel(el), h: Math.round(r.height), vh: innerHeight }); } }
  return res;
}

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const routes = new Set(); for (const i of nav.ITEMS) if (i.href) routes.add(i.href); for (const i of cms.ALL) if (i.href && !/:/.test(i.href)) routes.add(i.href);
  const list = [...routes].filter((r) => !ONLY || r.includes(ONLY)).filter((_, i) => i % SN === SI);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const report = { date: new Date().toISOString(), widths: WIDTHS, routes: list.length, results: [] };
  for (const route of list) for (const width of WIDTHS) {
    const touch = width <= 768;
    const ctx = await browser.newContext({ viewport: { width, height: touch ? 800 : 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    try {
      const resp = await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load", timeout: 45000 }); await page.waitForTimeout(500);
      const geom = (await page.evaluate(measure)).filter((i) => !(i.kind === "texte-coupé" && /sr-only|skip/.test(i.sel)) && !(i.kind === "chevauchement" && /mk-nav-head × button\.mk-cms-fold/.test(i.sel)));
      const r = await page.evaluate(inPage, touch);
      const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      report.results.push({ route, width, status: resp ? resp.status() : 0, docOverflow, geom: geom.filter((g) => g.kind === "h-scroll" || g.kind === "hors-cadre"), small: r.small, font: r.font, dialogs: r.dialogs.filter((d) => d.off || d.hScroll || d.noScroll), sticky: r.sticky });
    } catch (e) { report.results.push({ route, width, error: String(e.message).slice(0, 100) }); }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report));
  const n = (k) => report.results.reduce((s, x) => s + ((x[k] && x[k].length) || 0), 0);
  console.log(`shard ${SI}/${SN} : routes ${list.length}, largeurs ${WIDTHS.length}, débordements ${report.results.filter((x) => x.docOverflow > 1).length}, hors cadre ${n("geom")}, cibles petites ${n("small")}, champs < 16 px ${n("font")}, dialogues ${n("dialogs")}, barres collantes ${n("sticky")}`);
})();
