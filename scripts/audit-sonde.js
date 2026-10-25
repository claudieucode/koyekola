// Sonde ciblée : node scripts/audit-sonde.js "route@largeur" "<sélecteur CSS>"  → affiche taille, parent et règles d'agencement des éléments trouvés.
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { chromium } = require("playwright-core");
(async () => {
  const [spec, selector] = process.argv.slice(2); const [route, w] = spec.split("@");
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: Number(w || 1440), height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage();
  await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "load" }); await page.waitForTimeout(600);
  const res = await page.evaluate((s) => [...document.querySelectorAll(s)].slice(0, 6).map((el) => {
    const d = (e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return `[${Math.round(r.left)},${Math.round(r.top)}→${Math.round(r.right)},${Math.round(r.bottom)}] pos=${c.position} ${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}.${String(e.className).split(/\s+/).slice(0, 3).join(".")} ${Math.round(r.width)}x${Math.round(r.height)} d=${c.display} fd=${c.flexDirection} ai=${c.alignItems} ml=${c.marginLeft} h=${c.height} mh=${c.minHeight} bs=${c.boxSizing}`; };
    const chain = []; for (let p = el, i = 0; p && i < 4; p = p.parentElement, i++) chain.push(d(p)); return chain.join("\n   ↑ ");
  }), selector);
  console.log(res.join("\n---\n")); await browser.close(); db.close(); await srv.stop();
})();
