// Audit de géométrie de l'interface d'administration dans un vrai Chrome : parcourt les écrans du Marketing et du CMS à plusieurs
// largeurs et mesure les défauts d'agencement (débordement horizontal, éléments hors cadre, textes coupés, boutons déformés,
// commandes qui se chevauchent, décalages de mise en page pendant le chargement). N'écrit rien dans le dépôt : rapport JSON.
//   NODE_PATH=…/node_modules/ node scripts/audit-interface.js [--out rapport.json] [--widths 1920,1440,820,390] [--only fragment]
const fs = require("node:fs");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const nav = require("../src/marketing/web/nav");
const cms = require("../src/marketing/web/cmsNav");
const { chromium } = require("playwright-core");

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", "/tmp/audit-interface.json");
const WIDTHS = arg("--widths", "1920,1440,820,390").split(",").map(Number);
const ONLY = arg("--only", "");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const { measure } = require("./lib/auditMeasure");

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const routes = new Set();
  for (const i of nav.ITEMS) if (i.href) routes.add(i.href);
  for (const i of cms.ALL) if (i.href && !/:/.test(i.href)) routes.add(i.href);
  for (const extra of (arg("--extra", "") || "").split(",").filter(Boolean)) routes.add(extra);
  let list = [...routes].filter((r) => !ONLY || r.includes(ONLY));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = { date: new Date().toISOString(), widths: WIDTHS, routes: list.length, results: [], failures: [] };
  for (const route of list) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 } });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
      await page.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch { /* absent */ } });
      const url = `${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`;
      try {
        const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 });
        await page.waitForTimeout(700);
        const status = resp ? resp.status() : 0;
        const issues = await page.evaluate(measure);
        const cls = await page.evaluate(() => Math.round(window.__cls * 1000) / 1000);
        if (cls > 0.1) issues.push({ kind: "décalage-chargement", sel: "page", detail: `CLS ${cls}` });
        report.results.push({ route, width, status, issues, errors });
      } catch (e) { report.failures.push({ route, width, error: String(e.message).slice(0, 140) }); }
      await context.close();
    }
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  const byKind = {}; for (const r of report.results) for (const i of r.issues) byKind[i.kind] = (byKind[i.kind] || 0) + 1;
  console.log(`Routes ${report.routes}, mesures ${report.results.length}, échecs de chargement ${report.failures.length}`);
  console.log(byKind);
  process.exit(0);
})();
