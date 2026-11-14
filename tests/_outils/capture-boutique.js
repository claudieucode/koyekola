// Outil de développement (pas un test) : ouvre des écrans de la boutique d'administration dans Chrome et enregistre des captures.
// Usage : node tests/_outils/capture-boutique.js <dossier de sortie> <largeur> <chemin1> [chemin2 …]   (chemins relatifs à …/boutique, "" = produits)
// Données : jeu réel créé par les routes d'administration (module Commerce, boutique ouverte, produits, catégorie, zone, taxe, coupon).
const { setup } = require("../header-aides");
const fs = require("fs");
(async () => {
  const [, , outDir, width = "1440", ...paths] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const env = await setup({ siteName: "Choix et decision" });
  try {
    const B = `/marketing/site-web/sites/${env.site}/boutique`;
    const ch = (r, what) => { if (![200, 302].includes(r.status)) throw new Error(`${what} : ${r.status} ${String(r.text).slice(0, 200)}`); return r; };
    env.db.prepare("INSERT OR REPLACE INTO mk_site_modules (organization_id, site_id, module, enabled) VALUES (1, ?, 'commerce', 1)").run(env.site);
    if (process.env.SEED !== "0") {
      ch(await env.boss.post(`${B}/reglages`, { enabled: "1", currency: "eur", default_country: "FR", order_prefix: "CMD", low_stock_threshold: "3", guest_checkout: "1", payment_methods: ["manual"], manual_instructions: "Virement à réception." }), "réglages");
      ch(await env.boss.post(`${B}/categories`, { name: "Maison" }), "catégorie");
      for (const [n, p] of [["Tasse en grès", "18,00"], ["Plaid en lin", "64,00"], ["Bougie ambrée", "24,50"]]) ch(await env.boss.post(`${B}/produits`, { name: n, price: p, status: "published", type: "simple", manage_stock: "1", stock_qty: "12" }), "produit " + n);
      ch(await env.boss.post(`${B}/livraison/zones`, { name: "France", countries: "FR, BE" }), "zone");
      ch(await env.boss.post(`${B}/taxes`, { name: "TVA", country: "FR", rate: "20" }), "taxe");
      ch(await env.boss.post(`${B}/coupons`, { code: "BIENVENUE", kind: "percent", value: "10" }), "coupon");
    }
    const ctx = await env.browser.newContext({ viewport: { width: Number(width), height: 900 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    if (process.env.THEME) await ctx.addInitScript((t) => { try { localStorage.setItem("kolaTheme", t); } catch (e) {} }, process.env.THEME);
    for (const path of paths) {
      const page = await ctx.newPage();
      const res = await page.goto(`${env.srv.base}${B}${path}`);
      await page.waitForLoadState("networkidle");
      const name = (path || "produits").replace(/[^a-z0-9]+/gi, "_");
      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
      if (process.env.PROBE) console.log("PROBE", JSON.stringify(await page.evaluate(process.env.PROBE)));
      const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      console.log(res.status(), path || "/", over ? "DÉBORDEMENT HORIZONTAL" : "ok");
      await page.close();
    }
  } finally { await env.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
