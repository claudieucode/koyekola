// Audit de la NAVIGATION de chaque thème sur petits écrans : les liens du menu sont soit visibles, soit accessibles par un bouton de menu qui les affiche réellement.
// Usage : node scripts/audit-themes-navigation.js <sortie.json> ; env ONLY=cle1,cle2
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const catalog = require(path.join(REPO, "src/marketing/themes/catalog"));
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const VPS = [["tablette portrait", 768, 1024], ["mobile", 390, 844], ["petit mobile", 320, 568]];
const TOGGLE = "button, summary, [role=button], label[for], [aria-expanded], [aria-controls], [class*=burger], [class*=toggle], [class*=hamb]";
const state = (sel) => {
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 4 && r.height > 4 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" && r.bottom > 0 && r.top < 900 && r.right > 0 && r.left < innerWidth; };
  const links = [...document.querySelectorAll("header a, nav a, [class*=nav] a, [class*=menu] a")].filter((a) => a.textContent.trim() && /^(#|\/|https?)/.test(a.getAttribute("href") || ""));
  const uniq = new Set(links.map((a) => a.textContent.trim().toLowerCase()));
  const visibleLinks = new Set(links.filter(vis).map((a) => a.textContent.trim().toLowerCase()));
  const toggles = [...document.querySelectorAll(sel)].filter((b) => vis(b) && b.getBoundingClientRect().top < 220);
  return { links: uniq.size, visibleLinks: visibleLinks.size, toggles: toggles.length };
};
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit navigation" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage(); const rows = [];
  const keys = catalog.catalog().map((m) => m.key).filter((k) => !ONLY || ONLY.includes(k));
  for (const key of keys) for (const [vname, w, h] of VPS) {
    try {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${srv.base}/marketing/site-web/themes/${key}/demo/accueil?site=${site}`, { waitUntil: "load", timeout: 60000 });
      const s = await page.evaluate(state, TOGGLE);
      let status;
      if (s.links === 0) status = "sans-menu";
      else if (s.visibleLinks >= Math.min(2, s.links)) status = "liens-visibles";
      else if (!s.toggles) status = "INACCESSIBLE";
      else {
        const before = s.visibleLinks; let opened = false;
        for (const c of await page.$$(TOGGLE)) {
          if (!(await c.isVisible().catch(() => false))) continue;
          const bb = await c.boundingBox(); if (!bb || bb.y > 220) continue;
          await c.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(250);
          const s2 = await page.evaluate(state, TOGGLE);
          if (s2.visibleLinks > before) { opened = true; break; }
        }
        status = opened ? "bouton-ouvre-le-menu" : "BOUTON-SANS-EFFET";
      }
      rows.push({ key, vp: vname, status, ...s });
    } catch (e) { rows.push({ key, vp: vname, status: "ERREUR", err: String(e.message).slice(0, 80) }); }
  }
  await browser.close(); await srv.stop();
  fs.writeFileSync(process.argv[2] || ".audit-navigation.json", JSON.stringify(rows));
  const g = {}; for (const r of rows) g[r.status] = (g[r.status] || 0) + 1;
  console.log(`thèmes ${keys.length}, mesures ${rows.length}`, g);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
