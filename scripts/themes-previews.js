// Production des aperçus visuels de la bibliothèque de thèmes : captures du RENDU RÉEL (site de démonstration de chaque thème) en vrai Chrome, converties en WebP.
//   node scripts/themes-previews.js [clé-de-thème …]          (sans argument : tous les thèmes ; ceux dont les images existent déjà sont refaits)
// Variables : PX_OUT = dossier de sortie (défaut public/img/theme-previews) ; CHROME_PATH ; NODE_PATH doit permettre de trouver « playwright-core ».
// Le script démarre le banc d'essai léger (scripts/lib/themeHarness.js : base temporaire, mêmes routes de rendu que l'application), ouvre l'aperçu isolé de chaque thème et enregistre trois vues :
// accueil (ordinateur, haut de page), page intérieure (ordinateur) et mobile (390 px). Aucune donnée de production n'est lue ni écrite.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");
const { startHarness } = require("./lib/themeHarness");
const sharp = require(path.join(ROOT, "node_modules", "sharp"));
const library = require(path.join(ROOT, "src", "marketing", "themes", "library"));
const { chromium } = require("playwright-core");

const OUT = process.env.PX_OUT || path.join(ROOT, "public", "img", "theme-previews");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const VIEWS = [   // capture à 2× (netteté sur écran Retina) puis réduction : aucune image n'est jamais étirée à l'affichage
  { name: "home", width: 1440, height: 900, page: (s) => "accueil", out: 1440, quality: 82, dpr: 2, extras: [["card", 480, 300, 80], ["card2", 720, 450, 82]] },
  { name: "inner", width: 1440, height: 900, page: (s) => (s.preview && s.preview.inner) || s.pages[1].key, out: 1200, quality: 80, dpr: 2 },
  { name: "mobile", width: 390, height: 844, page: (s) => "accueil", out: 390, quality: 80, dpr: 2, extras: [["phone", 192, 416, 80]] },
];

(async () => {
  const wanted = process.argv.slice(2);
  const specs = library.load().specs.filter((s) => !wanted.length || wanted.includes(s.key));
  if (!specs.length) throw new Error("Aucun thème à photographier.");
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startHarness();
  let browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const relaunch = async () => { try { await browser.close(); } catch { /* déjà fermé */ } browser = await chromium.launch({ executablePath: CHROME, headless: true }); };
  // Machine chargée : une capture peut échouer (« Target page… closed ») ; on relance le navigateur et on réessaie, sans jamais enregistrer une image vide
  const attempt = async (label, fn) => { let last; for (let n = 1; n <= 4; n += 1) { try { return await fn(); } catch (e) { last = e; console.error(`  (essai ${n}/4 : ${label} : ${String(e.message).split("\n")[0].slice(0, 100)})`); await relaunch(); } } throw last; };
  let done = 0;
  try {
    for (const s of specs) {
      // Contrôle visuel : PX_FULL=1 enregistre chaque page du thème en entier (ordinateur, 1440 px) sans produire les aperçus de la galerie
      if (process.env.PX_FULL) {
        for (const pg of s.pages) {
          const ctx = await browser.newContext({ viewport: { width: Number(process.env.PX_WIDTH) || 1440, height: 900 }, reducedMotion: "reduce" });
          const page = await ctx.newPage();
          try { await page.goto(`${srv.base}/marketing/site-web/themes/${s.key}/demo/${pg.key}`, { waitUntil: "load", timeout: 60000 }); await page.evaluate(() => document.fonts && document.fonts.ready); await page.addStyleTag({ content: ".lp-preview-bar{display:none!important}" }); await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); await Promise.race([new Promise((r) => setTimeout(r, 4000)), Promise.all([...document.images].filter((im) => im.offsetParent !== null).map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))))]); }); await page.waitForTimeout(150); await page.screenshot({ path: path.join(OUT, `${s.key}-${pg.key}-full.png`), fullPage: true }); } finally { await ctx.close(); }
        }
        done += 1; continue;
      }
      for (const v of VIEWS.filter((x) => !process.env.PX_ONLY || process.env.PX_ONLY.split(",").includes(x.name))) {
        await attempt(`${s.key}-${v.name}`, async () => {
          const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dpr || 1, reducedMotion: "reduce" });
          const page = await ctx.newPage();
          try {
            const r = await page.goto(`${srv.base}/marketing/site-web/themes/${s.key}/demo/${v.page(s)}`, { waitUntil: "load", timeout: 60000 });
            if (!r || r.status() !== 200) throw new Error(`HTTP ${r && r.status()}`);
            await page.evaluate(() => document.fonts && document.fonts.ready);
            await page.addStyleTag({ content: ".lp-preview-bar{display:none!important}" });
            await page.waitForTimeout(250);
            const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: v.width, height: v.height } });
            const out = await sharp(png).resize({ width: v.out }).webp({ quality: v.quality }).toBuffer();
            if (out.length < 2500) throw new Error("image vide ou trop légère");
            fs.writeFileSync(path.join(OUT, `${s.key}-${v.name}.webp`), out);
            for (const [suffix, w, h, q] of v.extras || []) fs.writeFileSync(path.join(OUT, `${s.key}-${suffix}.webp`), await sharp(png).resize(w, h, { fit: "cover", position: "top" }).webp({ quality: q, effort: 5 }).toBuffer());
          } finally { try { await ctx.close(); } catch { /* navigateur déjà fermé */ } }
        });
      }
      done += 1;
      if (done % 5 === 0) console.log(`${done}/${specs.length}`);
    }
    console.log(`Aperçus produits pour ${done} thème(s) dans ${OUT}`);
  } finally { await browser.close(); await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
