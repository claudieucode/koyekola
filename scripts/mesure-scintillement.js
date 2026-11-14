// Mesure du scintillement de la coque du CMS dans un vrai Chrome : enchaîne N navigations internes, capte les images affichées (screencast CDP)
// et calcule la luminosité moyenne de la colonne de menus (rail + menu latéral) et de la barre du haut. Un flash = une image dont la luminosité s'écarte de la médiane.
// Usage : node scripts/mesure-scintillement.js [nombre de navigations]
const { setup, SKIP } = require("../tests/header-aides");
const N = Number(process.argv[2]) || 30;
(async () => {
  if (SKIP) { console.log(SKIP); return; }
  const env = await setup({ siteName: "Mesure" });
  const ctx = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
  await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  const base = `${env.srv.base}/marketing/site-web/sites/${env.site}`;
  await page.goto(`${base}/tableau-de-bord`, { waitUntil: "load" });
  const hrefs = await page.$$eval(".mk-sidebar a[href], .bq-side a[href]", (as) => [...new Set(as.map((a) => a.pathname + a.search).filter((h) => /^\/marketing\//.test(h) && !h.includes("#")))]);
  const urls = []; for (const h of hrefs) { const r = await page.request.get(env.srv.base + h); if (r.status() === 200 && !/constructeur-de-theme|personnaliser|\/nouveau|ajouter|export/.test(h)) urls.push(env.srv.base + h); }
  console.error("pages réelles mesurées :", urls.length);
  await page.goto(urls[0], { waitUntil: "load" }); await page.waitForTimeout(800);
  if (process.env.THROTTLE) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 1.5e6 / 8, uploadThroughput: 750e3 / 8 }); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 }); }
  const frames = []; cdp.on("Page.screencastFrame", (f) => { frames.push({ t: f.metadata.timestamp, data: f.data }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 40, maxWidth: 750, maxHeight: 450, everyNthFrame: 1 });
  let loads = 0; page.on("load", () => loads++);
  const spans = []; for (let i = 0; i < N; i++) { const u = urls[(i + 1) % urls.length]; const a = Date.now() / 1000; await page.goto(u, { waitUntil: "load" }); await page.waitForTimeout(process.env.THROTTLE ? 500 : 160); spans.push({ u: u.replace(env.srv.base, ""), a, b: Date.now() / 1000 }); }
  await cdp.send("Page.stopScreencast");
  // décodage dans une page vierge : luminosité moyenne de 3 zones (colonne de menus 0-22 %, barre du haut, contenu)
  const probe = await ctx.newPage(); await probe.goto("about:blank");
  const rows = await probe.evaluate(async (fr) => {
    const out = []; for (const f of fr) { const img = new Image(); img.src = "data:image/jpeg;base64," + f.data; await img.decode(); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const lum = (x, y, w, h) => { const d = g.getImageData(x, y, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; return s / (d.length / 4); };
      out.push({ t: f.t, menu: lum(0, 60, Math.round(img.width * 0.2), img.height - 80), top: lum(0, 0, img.width, 22), body: lum(Math.round(img.width * 0.4), 80, Math.round(img.width * 0.5), img.height - 120) }); }
    return out; }, frames);
  if (process.env.SAVE_FLASH) { const fs = require("fs"); const m0 = [...rows.map((r) => r.top)].sort((a, b) => a - b)[Math.floor(rows.length / 2)]; let k = 0; rows.forEach((r, i) => { if ((Math.abs(r.top - m0) > 25 || Math.abs(r.menu - m0) > 25) && k < 4) { fs.writeFileSync(process.env.SAVE_FLASH + "/flash" + (k++) + ".jpg", Buffer.from(frames[i].data, "base64")); } }); }
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const rep = {};
  for (const k of ["menu", "top", "body"]) { const v = rows.map((r) => r[k]); const m = med(v); rep[k] = { mediane: Math.round(m), ecartMax: Math.round(Math.max(...v.map((x) => Math.abs(x - m)))), imagesEnFlash: v.filter((x) => Math.abs(x - m) > 25).length }; }
  const par = {}; for (const sp of spans) { const fl = rows.filter((r) => r.t >= sp.a && r.t <= sp.b && Math.abs(r.menu - med(rows.map((x) => x.menu))) > 25).length; par[sp.u] = (par[sp.u] || 0) + fl; }
  console.log(JSON.stringify({ flashParDestination: par, navigations: N, chargementsComplets: loads, imagesCaptees: rows.length, ...rep }, null, 1));
  await ctx.close(); await env.close();
})().catch((e) => { console.error(e); process.exit(1); });
