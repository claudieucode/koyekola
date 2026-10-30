// Programme 22.3 — essai NAVIGATEUR RÉEL de « Mises en page avancées » (Chrome piloté par Playwright). Hors de `npm test`.
// Usage : NODE_PATH=<dossier>/node_modules node tests/manuel/layouts-ui-smoke.js <dossier de sortie>
const path = require("node:path");
const fs = require("node:fs");
const ROOT = path.join(__dirname, "..", "..");
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { TEST_KEY } = require(path.join(ROOT, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const OUT = process.argv[2]; fs.mkdirSync(`${OUT}/shots`, { recursive: true });
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db();
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  await boss.post("/marketing/pages", { name: "Services", site_id: site, kind: "page" });
  const cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const results = []; const check = (n, ok, x = "") => { results.push({ name: n, ok: Boolean(ok), extra: x }); console.log((ok ? "OK  " : "KO  ") + n + (x ? " — " + x : "")); };
  try {
    for (const vp of [{ w: 1280, h: 900, t: "desktop" }, { w: 390, h: 800, t: "mobile" }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } }); await ctx.addCookies(cookies);
      const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      await page.goto(`${srv.base}/marketing/site-web/sites/${site}/mises-en-page`); await page.waitForSelector("#ly-form");
      await page.waitForFunction(() => document.querySelectorAll("#ly-page option").length > 1 && document.querySelectorAll("#ly-role option").length > 5, null, { timeout: 15000 });
      check(`[${vp.t}] pages et rôles chargés`, true);
      await page.selectOption("#ly-page", { index: 1 }); await page.selectOption("#ly-role", "services"); await page.selectOption("#ly-ptype", "services");
      await page.fill("#ly-title", "Nos services"); await page.fill("#ly-text", "Ce que nous faisons pour vous."); await page.fill("#ly-items", "Conception | Des plans clairs\nChantier | Un suivi rigoureux\nLivraison | Dans les délais\nSuivi | Après la remise");
      await page.click('#ly-form button[type="submit"]'); await page.waitForSelector("#ly-gallery .ly-card", { timeout: 15000 });
      const n = await page.locator("#ly-gallery .ly-card").count();
      check(`[${vp.t}] galerie de variantes (≥ 4)`, n >= 4, String(n));
      check(`[${vp.t}] aperçus filaires rendus à partir de la structure`, (await page.locator(".ly-wire .w-grid").count()) >= 3);
      const grid = await page.locator(".ly-wire .w-grid").first().evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
      check(`[${vp.t}] grille de l'aperçu à colonnes réelles`, grid >= 2, String(grid));
      await page.click('#ly-bp [data-bp="mobile"]'); const g2 = await page.locator(".ly-wire .w-grid").first().evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
      check(`[${vp.t}] l'aperçu mobile réorganise la grille`, g2 === 1, String(g2));
      await page.click('#ly-bp [data-bp="desktop"]');
      const fam = await page.locator("#ly-fam button").count(); check(`[${vp.t}] filtres par famille`, fam >= 3, String(fam));
      await page.locator("#ly-gallery .ly-card input[type=checkbox]").nth(0).check(); await page.locator("#ly-gallery .ly-card input[type=checkbox]").nth(1).check(); await page.click("#ly-cmp");
      await page.waitForSelector("#ly-compare .ly-box"); check(`[${vp.t}] comparaison côte à côte`, (await page.locator("#ly-compare .ly-box").count()) === 2);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`[${vp.t}] pas de défilement horizontal`, overflow <= 1, String(overflow));
      await page.screenshot({ path: `${OUT}/shots/22-3-galerie-${vp.t}.png`, fullPage: true });
      await page.locator("#ly-gallery .ly-card button.btn-primary").first().click(); await page.waitForSelector("#ly-proposal .ly-box");
      await page.click("#ly-proposal .btn-primary"); await page.waitForFunction(() => /Brouillon mis à jour/.test(document.querySelector("#ly-status").textContent), null, { timeout: 15000 });
      check(`[${vp.t}] application au brouillon confirmée`, true);
      const stored = db.prepare("SELECT draft FROM mk_landing_pages WHERE name = 'Services'").get();
      check(`[${vp.t}] section « layout » enregistrée dans le brouillon`, JSON.parse(stored.draft).sections.some((s) => s.type === "layout"));
      await page.click("#ly-undo"); await page.waitForFunction(() => /annulée/.test(document.querySelector("#ly-status").textContent), null, { timeout: 15000 });
      check(`[${vp.t}] annulation`, !JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE name = 'Services'").get().draft).sections.some((s) => s.type === "layout"));
      check(`[${vp.t}] aucune erreur JavaScript`, errors.length === 0, errors.join(" | ").slice(0, 200));
      await ctx.close();
    }
  } finally { await browser.close(); db.close(); await srv.stop(); }
  fs.writeFileSync(`${OUT}/ui-results.json`, JSON.stringify(results, null, 2));
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
