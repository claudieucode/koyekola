// Audit responsive de la bibliothèque : chaque thème, trois pages (accueil, première page intérieure, contact), trois largeurs (ordinateur 1440, tablette 820, téléphone 390),
// en vrai Chrome sur le banc d'essai léger. Vérifie : aucun défilement horizontal, aucune erreur de page, aucune image visible cassée, un seul titre de niveau 1, la police de titre
// du thème réellement chargée. Écrit un rapport JSON (PX_REPORT, défaut /tmp/themes-responsive.json) et affiche le résumé. Usage : node scripts/themes-responsive.js [clé …]
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");
const { startHarness } = require("./lib/themeHarness");
const library = require(path.join(ROOT, "src", "marketing", "themes", "library"));
const fontLib = require(path.join(ROOT, "src", "utils", "fontLibrary"));
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const WIDTHS = [["ordinateur", 1440, 900], ["tablette", 820, 1100], ["telephone", 390, 844]];

(async () => {
  const wanted = process.argv.slice(2);
  const specs = library.load().specs.filter((s) => s.key !== "zz-qa" && (!wanted.length || wanted.includes(s.key)));
  const srv = await startHarness();
  let browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const results = [];
  const check = async (s, pg, [label, w, h]) => {
    for (let n = 1; n <= 3; n += 1) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
      try {
        const r = await page.goto(`${srv.base}/marketing/site-web/themes/${s.key}/demo/${pg}`, { waitUntil: "load", timeout: 60000 });
        await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(250);
        const heading = fontLib.byId(s.tokens.fonts.heading);
        const m = await page.evaluate((family) => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          broken: [...document.images].filter((im) => im.offsetParent !== null && im.complete && im.naturalWidth === 0).length,
          h1: document.querySelectorAll("h1").length,
          font: family ? [...document.fonts].some((f) => f.family.replace(/['"]/g, "") === family && f.status === "loaded") : true,
          title: document.title.length > 0,
        }), heading ? heading.family : null);
        await ctx.close();
        return { theme: s.key, page: pg, viewport: label, status: r.status(), ...m, errors, ok: r.status() === 200 && m.overflow <= 1 && m.broken === 0 && m.h1 === 1 && m.font && m.title && !errors.length };
      } catch (e) {
        try { await ctx.close(); } catch { /* fermé */ }
        if (n === 3) return { theme: s.key, page: pg, viewport: label, ok: false, errors: [String(e.message).split("\n")[0].slice(0, 120)] };
        try { await browser.close(); } catch { /* fermé */ }
        browser = await chromium.launch({ executablePath: CHROME, headless: true });
      }
    }
  };
  let i = 0;
  for (const s of specs) {
    const pages = [...new Set(["accueil", s.pages[1].key, s.pages.find((p) => p.key === "contact") ? "contact" : s.pages[2].key])];
    for (const pg of pages) for (const v of WIDTHS) results.push(await check(s, pg, v));
    i += 1; if (i % 10 === 0) console.log(`${i}/${specs.length} thèmes`);
  }
  await browser.close(); await srv.stop();
  const bad = results.filter((r) => !r.ok);
  const byTheme = new Map(); for (const r of results) byTheme.set(r.theme, (byTheme.get(r.theme) || true) && r.ok);
  fs.writeFileSync(process.env.PX_REPORT || "/tmp/themes-responsive.json", JSON.stringify({ themes: specs.length, controles: results.length, echecs: bad, themesOk: [...byTheme].filter(([, ok]) => ok).length }, null, 1));
  console.log(`Thèmes : ${specs.length} · contrôles : ${results.length} · thèmes sans aucun échec : ${[...byTheme].filter(([, ok]) => ok).length} · échecs : ${bad.length}`);
  for (const b of bad.slice(0, 40)) console.log(`  ${b.theme}/${b.page} (${b.viewport}) : ${["overflow " + b.overflow, b.broken ? `${b.broken} image(s) cassée(s)` : "", b.h1 !== 1 ? `${b.h1} h1` : "", b.font === false ? "police non chargée" : "", ...(b.errors || [])].filter((x) => x && x !== "overflow undefined" && x !== "overflow 0").join(" ; ")}`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
