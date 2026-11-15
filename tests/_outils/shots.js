// Plusieurs captures en un seul démarrage : node tests/_outils/shots.js <dossier> <largeur> chemin1 chemin2 ...
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../marketing-helpers");
const { startServer, loginInstructor } = require("../helpers");
(async () => {
  const [dir, w, ...paths] = process.argv.slice(2);
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const ctx = await browser.newContext({ viewport: { width: Number(w || 1440), height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage();
  for (const p of paths) {
    const r = await page.goto(srv.base + p).catch(() => null); await page.waitForTimeout(500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    console.log(p, r && r.status(), over ? "DEBORDE-H" : "ok");
    await page.screenshot({ path: `${dir}/${p.replace(/[^a-z0-9]+/gi, "_")}.png`, fullPage: Boolean(process.env.FULL) });
  }
  await browser.close(); srv.db().close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
