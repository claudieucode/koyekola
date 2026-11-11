#!/usr/bin/env node
// Captures d'écran de contrôle des modèles « Page individuelle » : aperçu réel de la bibliothèque, un PNG par modèle et par largeur.
// Usage : node scripts/captures-page-individuelle.js <dossier> ; env ONLY=prefixe1,prefixe2 ; WIDTHS=1280,390 ; PLEIN=1 (page entière)
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPE = process.env.TYPE || "single_page";
const OUT = process.argv[2] || "captures"; fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null, WIDTHS = (process.env.WIDTHS || "1280").split(",").map(Number);
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db(), org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Captures', 'captures', '{}')").run(org).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
  const keys = Catalog.entries(TYPE).map((e) => e.key).filter((k) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w > 800 ? 900 : 800 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage();
    for (const key of keys) {
      try { await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/${TYPE}/${key}/apercu`, { waitUntil: "load", timeout: 90000 }); await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `${key}.${w}.png`), fullPage: process.env.PLEIN === "1" }); } catch (e) { console.log(key, w, String(e.message).slice(0, 80)); }
    }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop(); console.log(`${keys.length} modèles × ${WIDTHS.length} largeur(s) → ${OUT}`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
