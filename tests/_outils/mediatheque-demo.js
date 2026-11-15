// Outil de développement (pas un test) : crée une médiathèque de démonstration (images, dossiers, tags, favoris, PDF) sur un site de test, puis ouvre le gestionnaire dans Chrome.
// Usage : node tests/_outils/mediatheque-demo.js <dossier de sortie> <largeur> [chemin relatif à la médiathèque, ex. "?section=stockage"] …
const zlib = require("node:zlib");
const fs = require("fs");
const { setup } = require("../header-aides");
function png(w, h, rgb) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set([(rgb[0] + x * 2) % 256, (rgb[1] + y * 2) % 256, rgb[2]], y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
(async () => {
  const [, , outDir, width = "1440", ...paths] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const env = await setup({ siteName: "Choix et decision" });
  try {
    const L = "/marketing/site-web/mediatheque", S = env.site, boss = env.boss;
    const post = (url, json) => boss.request(`${L}${url}?site=${S}`, { method: "POST", json });
    const upload = async (buffer, name, mime, extra = {}) => { const fd = new FormData(); fd.append("file", new Blob([buffer], { type: mime }), name); for (const [k, v] of Object.entries(extra)) fd.append(k, String(v)); const r = await boss.request(`${L}/televerser?site=${S}`, { method: "POST", multipart: fd }); if (r.status !== 201) throw new Error(`${name}: ${r.status} ${r.text}`); return JSON.parse(r.text).media; };
    const folders = {};
    for (const [name, parent] of [["Photos produits", null], ["Marque", null], ["Logos", "Marque"], ["Campagnes 2026", null]]) folders[name] = JSON.parse((await post("/dossiers", { name, parent_id: parent ? folders[parent] : null })).text).folder.id;
    await post(`/dossiers/${folders["Marque"]}/meta`, { color: "violet", description: "Identité visuelle" }); await post(`/dossiers/${folders["Photos produits"]}/meta`, { color: "orange" });
    const imgs = [];
    const palette = [[10, 90, 170], [200, 80, 60], [40, 160, 110], [220, 170, 40], [120, 80, 190], [30, 140, 190], [210, 90, 150], [90, 100, 110], [20, 60, 100], [180, 120, 60], [60, 180, 160], [150, 60, 90]];
    for (let i = 0; i < 24; i++) imgs.push(await upload(png(90 + (i % 5) * 20, 60 + (i % 3) * 20, palette[i % palette.length]), ["tasse-gres", "plaid-lin", "bougie-ambree", "logo-principal", "bannière-été", "portrait-equipe"][i % 6] + "-" + (i + 1) + ".png", "image/png", { dossier: i < 8 ? folders["Photos produits"] : i < 12 ? folders["Logos"] : "" }));
    await upload(Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"), "catalogue-2026.pdf", "application/pdf");
    await upload(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypmp42"), Buffer.alloc(40)]), "presentation.mp4", "video/mp4");
    await post("/etiqueter", { ids: imgs.slice(0, 6).map((m) => m.id), add: ["Produit", "Été 2026"] }); await post("/etiqueter", { ids: imgs.slice(6, 9).map((m) => m.id), add: ["Logo"] });
    for (const m of imgs.slice(0, 3)) await post("/favoris", { kind: "media", id: m.id, on: true });
    await post("/favoris", { kind: "folder", id: folders["Marque"], on: true });
    await post("/collections", { name: "Campagne rentrée" });
    await post("/utilise", { ids: [imgs[1].id, imgs[4].id] });
    await post(`/${imgs[20].id}/corbeille`, {});
    const ctx = await env.browser.newContext({ viewport: { width: Number(width), height: 900 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
    for (const p of paths) {
      const [rel, script] = p.split("||");
      await page.goto(`${env.srv.base}/marketing/site-web/sites/${S}/medias${rel}`); if (process.env.THEME) await page.evaluate((t) => { document.documentElement.setAttribute("data-kola-theme", t); }, process.env.THEME); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
      if (script) { await page.evaluate(script); await page.waitForTimeout(700); }
      const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      const name = (rel || "tous").replace(/[^a-z0-9]+/gi, "_") + (script ? "_" + (script.match(/data-mx-view=(\w+)/) || script.match(/(\w+)/))[1] : "");
      await page.screenshot({ path: `${outDir}/${name}.png` });
      console.log(rel || "/", over ? "DEBORDEMENT" : "ok");
    }
    console.log("erreurs JS :", errors.length ? errors.join(" | ") : "aucune");
  } finally { await env.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
