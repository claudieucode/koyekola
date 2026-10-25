// Captures d'écran ciblées de l'administration (route@largeur, séparées par des virgules) : node scripts/audit-captures.js dossier "/marketing/site-web/outils@1440,..."
const fs = require("node:fs"); const path = require("node:path");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { chromium } = require("playwright-core");
const [dir, spec] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  for (const item of spec.split(",")) {
    const [route, w] = item.split("@"); const width = Number(w || 1440);
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(dir, `${route.replace(/[^a-z0-9]+/gi, "_")}_${width}.png`) });
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop(); console.log("ok");
})();
