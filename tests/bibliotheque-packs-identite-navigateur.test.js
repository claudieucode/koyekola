// Packs de site : rendu RÉEL (Chrome) de la page d'accueil de chacun des 100 packs avec SON identité (couleurs, polices, formes) et SES illustrations, à 1440 / 820 / 390 px.
// Contrôle : fond et police des titres = ceux de l'identité du pack, illustrations réellement chargées (SVG servis par l'application), aucun débordement, chevauchement, texte illisible ou erreur JavaScript.
// BIB_REPORT=/chemin/rapport.json, BIB_SHOTS=/dossier (captures), BIB_ONLY=cle1,cle2. Ignoré sans Playwright/Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { INSPECT } = require("./inspect-rendu");
const { PACKS } = require("../src/marketing/pages/sitePacks");
const packBrand = require("../src/services/packBrand");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : rendu des packs non exécuté sur cette machine" : false;
const only = process.env.BIB_ONLY ? new Set(process.env.BIB_ONLY.split(",")) : null;
const KEYS = PACKS.map((p) => p.key).filter((k) => !only || only.has(k));
const VIEWPORTS = [["desktop", 1440, 900], ["tablet", 820, 1100], ["mobile", 390, 800]];
const rgbOf = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

describe("Packs de site : identité et illustrations dans Chrome (3 largeurs)", { skip: SKIP }, () => {
  let srv, boss, browser, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Packs" })).location.match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test(`chaque pack (${KEYS.length}) s'affiche avec son identité et ses illustrations, sans défaut`, { timeout: 7200000 }, async () => {
    const report = {}; let defects = 0;
    for (const [vp, width, height] of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage(); const errors = [];
      page.on("pageerror", (e) => errors.push(`erreur JavaScript : ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|X-Frame-Options|frame-ancestors/.test(m.text())) errors.push(`erreur console : ${m.text().slice(0, 140)}`); });
      for (const key of KEYS) {
        errors.length = 0; let issues = [], status = 0;
        const pack = PACKS.find((p) => p.key === key), idy = packBrand.idOf(key);
        const url = `${srv.base}/marketing/site-web/templates/apercu?site=${site}&ref=${encodeURIComponent(`pack:${key}`)}&page=${pack.pages[0].key}`;
        try {
          const r = await page.goto(url, { waitUntil: "load", timeout: 30000 }); status = r.status(); await page.evaluate(() => { document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; }); }); await page.waitForTimeout(250);
          if (status === 200) {
            issues = await page.evaluate(INSPECT);
            const info = await page.evaluate(() => {
              const main = document.querySelector("main") || document.body, imgs = [...main.querySelectorAll("img")].filter((i) => /\/themes-art\//.test(i.getAttribute("src") || ""));
              const h = main.querySelector("h1, h2");
              return { bg: getComputedStyle(document.body).backgroundColor, font: h ? getComputedStyle(h).fontFamily : "", imgs: imgs.length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length };
            });
            if (info.bg !== rgbOf(idy.colors.background) && info.bg !== "rgba(0, 0, 0, 0)") issues.push(`fond ${info.bg} ≠ identité ${idy.colors.background}`);
            const fam = idy.fonts.heading.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ").toLowerCase();
            if (info.font && !info.font.toLowerCase().replace(/['"]/g, "").includes(fam.split(" ")[0])) issues.push(`police des titres « ${info.font.slice(0, 40)} » ≠ identité ${idy.fonts.heading}`);
            if (info.loaded !== info.imgs) issues.push(`${info.imgs - info.loaded} illustration(s) non chargée(s) sur ${info.imgs}`);
            if (process.env.BIB_SHOTS) { fs.mkdirSync(process.env.BIB_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.BIB_SHOTS}/${key}.${vp}.png`, fullPage: true }); }
          }
        } catch (e) { issues = [`navigation impossible : ${e.message.slice(0, 120)}`]; }
        if (status !== 200) issues.unshift(`HTTP ${status}`);
        issues.push(...errors);
        if (issues.length) { (report[key] ||= {})[vp] = issues; defects += issues.length; }
      }
      await context.close();
    }
    if (process.env.BIB_REPORT) fs.writeFileSync(process.env.BIB_REPORT, JSON.stringify({ packs: KEYS.length, defects, report }, null, 1));
    const bad = Object.keys(report);
    assert.equal(bad.length, 0, `${bad.length} pack(s) défectueux sur ${KEYS.length} :\n${bad.slice(0, 25).map((r) => `  ${r} → ${Object.entries(report[r]).map(([v, l]) => `${v}: ${l[0]}`).join(" | ")}`).join("\n")}`);
  });
});
