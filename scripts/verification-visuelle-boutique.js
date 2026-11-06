#!/usr/bin/env node
// Vérification visuelle des thèmes de BOUTIQUE (pages réelles /boutique, fiche produit, panier), dans un vrai Chrome (sans bibliothèque de test navigateur) :
// pour CHAQUE thème et CHAQUE page et à trois largeurs (desktop 1280, tablette 820, mobile 390) → mesure le débordement horizontal et les éléments qui sortent de l'écran, et enregistre une capture.
// Usage : node scripts/verification-visuelle-boutique.js [dossier-de-sortie] [--captures=toutes|aucune]   (Chrome requis ; serveur de test démarré puis arrêté)
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, Client } = require("../tests/helpers");
const shopkit = require("../src/marketing/themes/packs/shopkit");

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "verification-boutique");
// Mesures : TOUS les modèles aux 3 largeurs. Captures : un échantillon (1 modèle sur 7) par défaut, tous avec --captures=toutes, aucun avec --captures=aucune.
const CAP = (process.argv.find((a) => a.startsWith("--captures=")) || "--captures=echantillon").split("=")[1];
const SIZES = [["desktop", 1280, 900], ["tablette", 820, 1100], ["mobile", 390, 900]];
const PROBE = `<script>addEventListener("load",function(){setTimeout(function(){var de=document.documentElement,o=[];document.querySelectorAll("body *").forEach(function(e){var b=e.getBoundingClientRect(),s=getComputedStyle(e);if(b.width>0&&b.right>innerWidth+1&&s.position!=="fixed"&&e.closest("svg")===null)o.push((e.className&&e.className.toString()||e.tagName).slice(0,50))});(window.parent!==window?parent.document:document).title="RESULT:"+JSON.stringify({sw:de.scrollWidth,iw:innerWidth,sh:de.scrollHeight,out:o.length,first:o.slice(0,3)})},400)})</script>`;
const run = (args) => new Promise((resolve) => execFile(CHROME, args, { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }, (e, out) => resolve(String(out || ""))));
async function pool(items, n, fn) { const q = items.slice(); const res = []; await Promise.all(Array.from({ length: n }, async () => { while (q.length) { const it = q.shift(); res.push(await fn(it)); } })); return res; }

const HOST = "www.visu-shop.example";
const THEMES = (process.env.THEMES || "maille,flamme,verdure,pointure").split(",");
(async () => {
  fs.mkdirSync(path.join(OUT, "html"), { recursive: true }); fs.mkdirSync(path.join(OUT, "captures"), { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  try {
    const boss = await loginInstructor(srv); const db = srv.db();
    const one = (sql, ...a) => db.prepare(sql).get(...a);
    const orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
    const siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Verification boutique" })).location.match(/sites\/(\d+)/)[1]);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
    await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } });
    const SA = `/marketing/site-web/sites/${siteId}/boutique`;
    await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" });
    const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
    await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
    await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "VIS" });
    await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" });
    const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
    const jobs = [];
    for (const key of THEMES) {
      const demo = require(`../src/marketing/themes/packs/${key}/demo.js`);
      db.prepare("DELETE FROM mk_shop_products WHERE site_id = ?").run(siteId); db.prepare("DELETE FROM mk_shop_categories WHERE site_id = ?").run(siteId);
      shopkit.seed({ db, organizationId: orgId, siteId }, demo);
      const t = JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", siteId).tokens); t.pack = { key, options: {} };
      db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), siteId);
      const cli = new Client(srv.base);
      const prod = one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND type = 'simple' AND stock_qty > 0 ORDER BY id LIMIT 1", siteId);
      const varp = one("SELECT slug FROM mk_shop_products WHERE site_id = ? AND type = 'variable' ORDER BY id LIMIT 1", siteId);
      await cli.post("/boutique/panier/ajouter", { product_id: prod.id, quantity: "2" }, site);
      const pages = { catalogue: "/boutique", "catalogue-filtre-vide": "/boutique?q=zzzzintrouvable", fiche: `/boutique/produit/${prod.slug}`, "fiche-variantes": `/boutique/produit/${varp.slug}`, panier: "/boutique/panier", commande: "/boutique/commande?pays=FR", compte: "/boutique/compte" };
      for (const [pname, url] of Object.entries(pages)) {
        const r = await cli.get(url, site);
        if (r.status !== 200) { jobs.push({ key: `${key}.${pname}`, error: `HTTP ${r.status}` }); continue; }
        const html = r.text.replace("<head>", `<head><base href="${srv.base}/">`).replace("</body>", `${PROBE}</body>`);
        fs.writeFileSync(path.join(OUT, "html", `${key}.${pname}.html`), html);
        for (const [name, w, h] of SIZES) {
          const host = path.join(OUT, "html", `${key}.${pname}.${name}.host.html`);
          fs.writeFileSync(host, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888"><iframe style="width:${w}px;height:${h}px;border:0;display:block;background:#fff" srcdoc="${html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe></body>`);
          jobs.push({ key: `${key}.${pname}`, file: host, name, w, h });
        }
      }
    }
    // Mesure par un processus séparé (arrêt forcé de chaque Chrome, résultats écrits au fur et à mesure) pendant que le serveur de test reste démarré
    const jsonl = path.join(OUT, "resultats.jsonl"); try { fs.writeFileSync(jsonl, ""); } catch {}
    await new Promise((resolve) => { const c = require("node:child_process").spawn(process.execPath, [path.join(__dirname, "mesurer-pages-chrome.js"), path.join(OUT, "html"), "3"], { stdio: "inherit" }); c.on("close", resolve); });
    const results = fs.readFileSync(jsonl, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return { key: r.file.replace(/\.(desktop|tablette|mobile)\.host\.html$/, ""), size: r.size, scrollWidth: r.scrollWidth, overflowX: r.overflowX, outside: r.outside, firstOutside: r.first, error: r.error }; });
    const bad = results.filter((r) => r.error || r.overflowX || r.outside > 0);
    const report = { generated: new Date().toISOString(), themes: THEMES, measures: results.length, defective: bad.length, errors: jobs.filter((j) => j.error), details: bad };
    fs.writeFileSync(path.join(OUT, "rapport.json"), JSON.stringify({ ...report, all: results }, null, 1));
    console.log(JSON.stringify({ themes: THEMES.length, measures: report.measures, defective: report.defective, errors: report.errors.length }));
    for (const b of bad.slice(0, 40)) console.log("DEFAUT", b.key, b.size, b.error || `scrollWidth=${b.scrollWidth} hors-ecran=${b.outside} ${JSON.stringify(b.firstOutside || [])}`);
  } finally { await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
