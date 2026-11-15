// Captures avec un site de test créé : node tests/_outils/shots-site.js <dossier> <largeur> <chemin avec {site}> …
const { setup } = require("../header-aides");
const fs = require("fs");
(async () => {
  const [, , outDir, width = "1440", ...paths] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const env = await setup({ siteName: "Choix et decision" });
  try {
    const ctx = await env.browser.newContext({ viewport: { width: Number(width), height: 900 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    for (const p of paths) {
      const path = p.replace("{site}", env.site).replace("{page}", env.pageId);
      const page = await ctx.newPage();
      const res = await page.goto(env.srv.base + path); await page.waitForLoadState("networkidle");
      const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      const tall = await page.evaluate(() => [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select:not([multiple])")].filter((e) => e.offsetHeight > 70).length);
      console.log(res.status(), path, over ? "DEBORDEMENT" : "ok", tall ? `CHAMPS-TROP-HAUTS:${tall}` : "");
      await page.screenshot({ path: `${outDir}/${p.replace(/[^a-z0-9]+/gi, "_")}.png`, fullPage: true });
      await page.close();
    }
  } finally { await env.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
