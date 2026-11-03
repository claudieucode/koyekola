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

// Exécuté dans la page : liste des défauts de mise en page visibles
const INSPECT = () => {
  const out = [], vw = document.documentElement.clientWidth, root = document.querySelector("main") || document.body;
  if (document.documentElement.scrollWidth > vw + 1) out.push(`débordement horizontal : ${document.documentElement.scrollWidth}px > ${vw}px`);
  if (root.querySelectorAll('*').length < 3) out.push('rendu vide');
  const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) { const c = getComputedStyle(p); if (c.overflowX !== "visible" && c.overflowX !== "") return true; } return false; };
  const seen = new Set();
  const label = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  for (const e of root.querySelectorAll("*")) {
    const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if ((r.right > vw + 2 || r.left < -2) && !clipped(e)) { const k = `off:${label(e)}`; if (!seen.has(k) && !e.closest("[data-skip-overflow]")) { seen.add(k); out.push(`dépasse l'écran : ${label(e)} (${Math.round(r.left)}→${Math.round(r.right)}px sur ${vw}px)`); } }
    if ((cs.overflow === "hidden" || cs.overflowX === "hidden") && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && !/sr-only|visually-hidden|kw-rating-fill/.test(String(e.className)) && /^(A|BUTTON|H[1-6]|P|SPAN|LI)$/.test(e.tagName)) { const k = `cut:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`texte coupé : ${label(e)}`); } }
    // mot coupé au milieu : sans césure forcée, le texte déborderait de son bloc
    if (e.children.length === 0 && (e.textContent || "").trim().length > 3 && !/sr-only|visually-hidden/.test(String(e.className))) {
      const ow = e.style.overflowWrap, wb = e.style.wordBreak; e.style.overflowWrap = "normal"; e.style.wordBreak = "normal";
      const broke = e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && cs.display !== "inline" && (cs.overflowX === "visible"); e.style.overflowWrap = ow; e.style.wordBreak = wb;
      if (broke) { const k = `word:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`mot coupé au milieu : « ${(e.textContent || "").trim().slice(0, 40)} »`); } }
    }
    // texte invisible ou illisible : contraste texte / fond effectif inférieur à 2,2 (seuil volontairement bas : seuls les vrais défauts)
    if (e.children.length === 0 && (e.textContent || "").trim().length > 1 && parseFloat(cs.fontSize) >= 12 && r.width > 20 && !e.closest(".kw-marquee")) {
      const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [R, G, B, A = 1] = m.map(Number); if (A === 0) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return { l: 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B), a: A }; };
      let bg = null, imageBg = false; for (let p = e; p; p = p.parentElement) { if (getComputedStyle(p).backgroundImage !== "none") imageBg = true; const b = lum(getComputedStyle(p).backgroundColor); if (b && b.a > 0.9) { bg = b; break; } }
      const fg = lum(cs.color); bg = bg || { l: 1 };
      if (fg && fg.a > 0.5 && !imageBg) { const hi = Math.max(fg.l, bg.l), lo = Math.min(fg.l, bg.l), ratio = (hi + 0.05) / (lo + 0.05); if (ratio < 2.2 && cs.opacity !== "0") { const k = `contrast:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`texte illisible (contraste ${ratio.toFixed(1)}) : « ${(e.textContent || "").trim().slice(0, 30)} »`); } } }
    }
    if ((cs.display.includes("flex") || cs.display.includes("grid")) && e.children.length > 1 && e.children.length < 40) {
      const kids = [...e.children].filter((c) => { const s = getComputedStyle(c); return s.display !== "none" && s.position !== "absolute" && s.position !== "fixed"; }).map((c) => c.getBoundingClientRect()).filter((b) => b.width > 2 && b.height > 2);
      for (let i = 0; i < kids.length; i += 1) for (let j = i + 1; j < kids.length; j += 1) {
        const a = kids[i], b = kids[j], w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 4 && h > 4) { const k = `ov:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`chevauchement dans ${label(e)} (${Math.round(w)}×${Math.round(h)}px)`); } }
      }
    }
  }
  return out;
};

module.exports = { INSPECT };
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
