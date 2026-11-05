// Bibliothèque officielle : rendu RÉEL de chaque modèle (pages, sections, composants, modèles de thème) dans Chrome, aux trois largeurs (ordinateur 1440, tablette 820, mobile 390).
// Détecte pour chaque modèle : réponse HTTP ≠ 200, débordement horizontal du document, éléments qui dépassent le bord de l'écran, enfants d'un même conteneur flex/grid qui se chevauchent,
// texte coupé (overflow caché), erreurs JavaScript. Produit un rapport par modèle (BIB_REPORT=/chemin/rapport.json). BIB_TYPES=page,section,component,part limite les types ; BIB_ONLY=ref1,ref2 limite les modèles.
// Ignoré (avec la raison) sans Playwright/Chrome. Les packs ne sont pas rendus ici : leurs pages le sont (type « page »).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : rendu de la bibliothèque non exécuté sur cette machine" : false;

const patterns = require("../src/marketing/pages/patterns");
const templates = require("../src/marketing/pages/templates");
const components = require("../src/marketing/pages/libraryComponents");
const parts = require("../src/marketing/pages/libraryParts");
const types = (process.env.BIB_TYPES || "page,section,component,part").split(",");
const only = process.env.BIB_ONLY ? new Set(process.env.BIB_ONLY.split(",")) : null;
const REFS = [
  ...(types.includes("page") ? templates.TEMPLATES.map((t) => `page:${t.key}`) : []),
  ...(types.includes("section") ? patterns.PATTERNS.filter((p) => !p.requires).map((p) => `section:${p.key}`) : []),
  ...(types.includes("component") ? components.COMPONENTS.map((c) => `component:${c.key}`) : []),
  ...(types.includes("part") ? parts.PARTS.map((p) => `part:${p.key}`) : []),
].filter((r) => !only || only.has(r));
const VIEWPORTS = [["desktop", 1440, 900], ["tablet", 820, 1100], ["mobile", 390, 800]];

const { INSPECT } = require("./inspect-rendu");
describe("Bibliothèque officielle : rendu navigateur (3 largeurs)", { skip: SKIP }, () => {
  let srv, boss, browser, db, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bibliothèque 100" })).location.match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test(`chaque modèle (${REFS.length}) s'affiche sans débordement ni chevauchement sur ordinateur, tablette et mobile`, { timeout: 3600000 }, async () => {
    const report = {}; let defects = 0;
    for (const [vpName, width, height] of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage(); const errors = [];
      page.on("pageerror", (e) => errors.push(`erreur JavaScript : ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|X-Frame-Options|frame-ancestors/.test(m.text())) errors.push(`erreur console : ${m.text().slice(0, 140)}`); });
      for (const ref of REFS) {
        errors.length = 0;
        const url = `${srv.base}/marketing/site-web/templates/apercu?site=${site}&ref=${encodeURIComponent(ref)}`;
        let status = 0, issues = [];
        try { const r = await page.goto(url, { waitUntil: "load", timeout: 30000 }); status = r.status(); await page.waitForTimeout(60); if (status === 200) { issues = await page.evaluate(INSPECT); if (process.env.BIB_SHOTS) { fs.mkdirSync(process.env.BIB_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.BIB_SHOTS}/${ref.replace(":", "_")}.${vpName}.png`, fullPage: true }); } } } catch (e) { issues = [`navigation impossible : ${e.message.slice(0, 120)}`]; }
        if (status !== 200) issues.unshift(`HTTP ${status}`);
        issues.push(...errors);
        if (issues.length) { (report[ref] ||= {})[vpName] = issues; defects += issues.length; }
      }
      await context.close();
    }
    if (process.env.BIB_REPORT) fs.writeFileSync(process.env.BIB_REPORT, JSON.stringify({ models: REFS.length, defects, report }, null, 1));
    const bad = Object.keys(report);
    assert.equal(bad.length, 0, `${bad.length} modèle(s) défectueux sur ${REFS.length} :\n${bad.slice(0, 25).map((r) => `  ${r} → ${Object.entries(report[r]).map(([v, l]) => `${v}: ${l[0]}`).join(" | ")}`).join("\n")}`);
  });
});
