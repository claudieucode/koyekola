// Recense les éléments visibles en capitales (text-transform: uppercase) dans l'administration : node scripts/audit-majuscules.js [sortie.json]
const fs = require("node:fs");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const nav = require("../src/marketing/web/nav"); const cms = require("../src/marketing/web/cmsNav");
const { chromium } = require("playwright-core");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const routes = new Set([...nav.ITEMS.map((i) => i.href), ...cms.ALL.map((i) => i.href).filter((h) => h && !/:/.test(h))]);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const found = {};
  for (const route of routes) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    try { await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load", timeout: 45000 }); await page.waitForTimeout(400);
      const items = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.textTransform === "uppercase" && r.width > 0 && r.height > 0 && cs.display !== "none" && (e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())); }).map((e) => (e.tagName.toLowerCase() + "." + String(e.className).split(/\s+/).filter(Boolean).slice(0, 2).join(".")) + " « " + e.textContent.trim().slice(0, 28) + " » ls=" + getComputedStyle(e).letterSpacing));
      for (const i of items) { const k = i.split(" « ")[0]; (found[k] = found[k] || { n: 0, routes: new Set(), ex: i }).n++; found[k].routes.add(route); }
    } catch { /* page non chargée */ }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
  const out = Object.entries(found).sort((a, b) => b[1].routes.size - a[1].routes.size).map(([k, v]) => `${v.routes.size}p ${v.ex}`);
  fs.writeFileSync(process.argv[2] || "/tmp/majuscules.txt", out.join("\n")); console.log(out.slice(0, 40).join("\n"));
})();
