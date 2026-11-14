// Navigation du CMS sans flash : un vrai Chrome (réseau et processeur ralentis) enchaîne des navigations internes ; la colonne de menus ne doit jamais s'afficher vide ou claire.
// Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { setup, SKIP } = require("./header-aides");
const css = fs.readFileSync(require("path").join(__dirname, "../public/css/kola-stable.css"), "utf8");
const top = fs.readFileSync(require("path").join(__dirname, "../views/marketing/partials/top.ejs"), "utf8");

describe("CMS : navigation sans flash", { skip: SKIP }, () => {
  let env, ctx, page, base;
  before(async () => {
    env = await setup({ siteName: "Site stable" });
    ctx = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await ctx.newPage(); base = `${env.srv.base}/marketing/site-web/sites/${env.site}`;
  });
  after(async () => { if (ctx) await ctx.close(); if (env) await env.close(); });

  test("la coque attend sa construction avant le premier affichage et la transition de document est déclarée", () => {
    assert.match(top, /<link rel="expect" href="#main" blocking="render">/);
    assert.match(css, /@view-transition \{ navigation: auto; \}/);
    for (const n of ["kola-adminbar", "kola-rail", "kola-sidebar"]) assert.ok(css.includes(`view-transition-name: ${n}`), n);
  });

  test("30 navigations internes ralenties : aucune image avec la colonne de menus vide ou claire ; les noms de transition sont posés ; le menu latéral est présent à chaque arrivée", async () => {
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`${base}/tableau-de-bord`, { waitUntil: "load" });
    const hrefs = await page.$$eval(".mk-sidebar a[href]", (as) => [...new Set(as.map((a) => a.pathname).filter((h) => /\/sites\/\d+\//.test(h) && !h.includes("#")))]);
    const urls = []; for (const h of hrefs) { if (/constructeur-de-theme|personnaliser|nouveau|ajouter|export|editeur/.test(h)) continue; if ((await page.request.get(env.srv.base + h)).status() === 200) urls.push(env.srv.base + h); if (urls.length >= 8) break; }
    assert.ok(urls.length >= 5, "assez de rubriques réelles : " + urls.length);
    await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 1.5e6 / 8, uploadThroughput: 750e3 / 8 }); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const frames = []; cdp.on("Page.screencastFrame", (f) => { frames.push(f.data); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 40, maxWidth: 750, maxHeight: 450, everyNthFrame: 1 });
    for (let i = 0; i < 30; i++) {
      await page.goto(urls[i % urls.length], { waitUntil: "load" });
      assert.ok(await page.locator("#mk-sidebar .mk-nav-link, #mk-sidebar .mk-nav-head").count() > 0, "menu latéral présent");
      assert.equal(await page.locator(".mk-sidebar").evaluate((e) => getComputedStyle(e).viewTransitionName), "kola-sidebar");
      await page.waitForTimeout(250);
    }
    await cdp.send("Page.stopScreencast");
    const probe = await ctx.newPage(); await probe.goto("about:blank");
    const lum = await probe.evaluate(async (fr) => { const out = []; for (const d of fr) { const img = new Image(); img.src = "data:image/jpeg;base64," + d; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0); const px = g.getImageData(0, 60, Math.round(img.width * 0.2), img.height - 80).data; let s = 0; for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; out.push(s / (px.length / 4)); } return out; }, frames);
    await probe.close();
    const med = [...lum].sort((a, b) => a - b)[Math.floor(lum.length / 2)];
    const bad = lum.filter((x) => Math.abs(x - med) > 25).length;
    assert.ok(frames.length > 100, "images captées : " + frames.length);
    assert.equal(bad, 0, `${bad} image(s) sur ${frames.length} où la colonne de menus est vide ou claire`);
  });
});
