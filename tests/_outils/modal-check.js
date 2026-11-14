// Diagnostic : la fenêtre « Ajouter une redirection » est-elle centrée ? node tests/_outils/modal-check.js
const { chromium } = require("playwright-core");
const { TEST_KEY } = require("../marketing-helpers");
const { startServer, loginInstructor } = require("../helpers");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  for (const [w, h] of [[1440, 900], [390, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/marketing/site-web/redirections`);
    await page.locator("[data-ur-new]").first().click();
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const b = document.querySelector("#ur-form").getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight }; });
    console.log(w, JSON.stringify(r), "marge gauche/droite", Math.round(r.x), Math.round(r.vw - r.x - r.w), "haut/bas", Math.round(r.y), Math.round(r.vh - r.y - r.h));
    await page.screenshot({ path: process.env.SHOT ? `${process.env.SHOT}-${w}.png` : undefined });
  }
  await browser.close(); srv.db().close(); await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
