// Audit du Centre de gestion (/formateur/gestion) dans un vrai Chrome : chaque page, 9 largeurs (320 à 1920 px), avec des données réelles de test.
// Mesure : défilement horizontal, éléments hors cadre, chevauchements, cibles tactiles < 40 px, champs < 16 px (zoom iPhone), erreurs de console, poids et durée.
//   NODE_PATH=…/node_modules node scripts/audit-gestion.js [--out r.json] [--shots dossier] [--widths 320,390,1280]
const fs = require("node:fs");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("../tests/helpers");
const { measure } = require("./lib/auditMeasure");
const { chromium } = require("playwright-core");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "/tmp/gestion-audit.json"), SHOTS = arg("--shots", "");
const WIDTHS = arg("--widths", "320,360,390,430,768,1024,1280,1440,1920").split(",").map(Number);
const G = "/formateur/gestion";
const PAGES = [G, `${G}/ventes`, `${G}/ventes/transactions`, `${G}/ventes/remboursements`, `${G}/ventes/coupons`, `${G}/eleves`, `${G}/journal`, `${G}/support`, `${G}/analytics`, `${G}/ressources`, `${G}/activite`, `${G}/activite?vue=alertes`, `${G}/sauvegardes`, `${G}/sauvegardes/audit-sites?source=active`];

(async () => {
  const srv = await startServer();
  const prof = await loginInstructor(srv);
  const a = await createCourse(prof, srv, { title: "Formation Alpha", price: 40, lessons: [{ title: "A1" }] });
  await createCourse(prof, srv, { title: "Formation Beta avec un titre vraiment très long pour tester les débordements des tableaux", price: 10 });
  for (let i = 0; i < 3; i++) { const e = await newStudent(srv); await buy(e, a); }
  await prof.post(`${G}/sauvegardes`, {});
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const results = [];
  const first = PAGES.find((p) => p === `${G}/ventes`);
  const db = srv.db(); const orderId = (db.prepare("SELECT id FROM orders ORDER BY id LIMIT 1").get() || {}).id; const eleveId = (db.prepare("SELECT user_id id FROM enrollments LIMIT 1").get() || {}).id; db.close();
  const SHELL = process.argv.includes("--shell") ? ["/formateur", "/formateur/formations", "/formateur/categories", "/formateur/chapitres", "/formateur/messages", "/formateur/blog", "/formateur/faq", "/formateur/apparence", "/formateur/profil"] : [];
  const pages = [...PAGES, ...SHELL]; if (orderId) pages.push(`${G}/ventes/commandes/${orderId}`); if (eleveId) pages.push(`${G}/eleves/${eleveId}`);
  for (const route of pages) for (const width of WIDTHS) {
    const touch = width <= 768;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    await ctx.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; let bytes = 0;
    page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
    page.on("response", async (r) => { try { bytes += (await r.body()).length; } catch { /* redirection */ } });
    try {
      const t0 = Date.now(); const resp = await page.goto(srv.base + route, { waitUntil: "load", timeout: 45000 }); const ms = Date.now() - t0; await page.waitForTimeout(300);
      const geom = (await page.evaluate(measure)).filter((g) => ["h-scroll", "hors-cadre", "chevauchement"].includes(g.kind) && !/sr-only|skip|mk-nav-head × button\.mk-cms-fold/.test(g.sel));
      const extra = await page.evaluate((touch) => {
        const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest("[hidden],.sr-only,details:not([open]) > :not(summary)"); };
        const small = touch ? [...document.querySelectorAll("main a.btn, main button, main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main summary, main .g-module")].filter((e) => vis(e) && e.getBoundingClientRect().height < 40).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ")[0] + ":" + Math.round(e.getBoundingClientRect().height)) : [];
        const font = touch ? [...document.querySelectorAll("main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main textarea")].filter((e) => vis(e) && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.name || e.id) : [];
        return { over: document.documentElement.scrollWidth - innerWidth, small, font, h1: document.querySelectorAll("main h1, h1").length };
      }, touch);
      if (SHOTS && (width === 390 || width === 1280)) await page.screenshot({ path: `${SHOTS}/${route.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}-${width}.png`, fullPage: true });
      results.push({ route, width, status: resp.status(), ms, kb: Math.round(bytes / 1024), ...extra, geom: geom.map((g) => `${g.kind}:${g.sel}`).slice(0, 4), errors });
    } catch (e) { results.push({ route, width, error: String(e.message).slice(0, 100) }); }
    await ctx.close();
  }
  await browser.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(results));
  const bad = results.filter((r) => r.error || r.status !== 200 || r.over > 1 || r.geom.length || r.small.length || r.font.length || r.errors.length || r.h1 !== 1);
  console.log(`pages ${pages.length}, mesures ${results.length}, avec défaut ${bad.length}`);
  const by = {}; for (const r of bad) { const k = r.route; (by[k] = by[k] || []).push(`${r.width}:${r.error || [r.status !== 200 && "HTTP " + r.status, r.over > 1 && "h-scroll " + r.over, r.geom.length && "geom " + r.geom.join("|"), r.small.length && "tactile " + r.small.length, r.font.length && "police<16 " + r.font.length, r.errors.length && "console " + r.errors[0], r.h1 !== 1 && "h1=" + r.h1].filter(Boolean).join(",")}`); }
  for (const [k, v] of Object.entries(by)) console.log(k, "\n   ", v.slice(0, 4).join("\n    "), v.length > 4 ? `\n    … +${v.length - 4}` : "");
})();
