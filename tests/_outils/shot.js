// Capture d'une page du CMS : node tests/_outils/shot.js <chemin> <fichier.png> [largeur]
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../marketing-helpers");
const { startServer, loginInstructor } = require("../helpers");
(async () => {
  const [path, out, w] = process.argv.slice(2);
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const ctx = await browser.newContext({ viewport: { width: Number(w || 1440), height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage(); await page.goto(srv.base + path); await page.waitForTimeout(800);
  if (process.env.EVAL) console.log(JSON.stringify(await page.evaluate(process.env.EVAL))); await page.screenshot({ path: out }); await browser.close(); srv.db().close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
