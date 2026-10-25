// Audit des éditeurs (pages, e-mails, scénarios, articles, éditeur du site) dans un vrai Chrome : géométrie à plusieurs largeurs,
// décalage de mise en page au chargement, et STABILITÉ à l'interaction (la barre d'outils et le canevas ne doivent pas bouger quand
// on sélectionne un bloc ou qu'on ouvre/ferme un panneau). Captures dans le dossier donné.   node scripts/audit-editeurs.js dossier [sortie.json]
const fs = require("node:fs"); const path = require("node:path");
const { startServer, loginInstructor } = require("../tests/helpers");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { measure } = require("./lib/auditMeasure");
const { chromium } = require("playwright-core");
const [dir, out] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site audit', 'site-audit', '{}')").run(orgId).lastInsertRowid);
  const sections = require("../src/marketing/themes/library").pageSections("meridien", "accueil");
  const pageId = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Accueil audit', 'accueil-audit', 'Accueil', ?, 'draft', 'page', ?)").run(orgId, JSON.stringify(sections), site).lastInsertRowid);
  const emptyId = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Vide audit', 'vide-audit', 'Vide', '[]', 'draft', 'page', ?)").run(orgId, site).lastInsertRowid);
  const tpl = Number((await boss.post("/marketing/modeles", { name: "Modèle audit", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  const auto = Number((await boss.post("/marketing/automatisations", { name: "Scénario audit", kind: "marketing", trigger_event: "lms.user_registered" })).location.match(/(\d+)$/)[1]);
  const editors = [
    ["page", `/marketing/pages/${pageId}/editeur`], ["page-vide", `/marketing/pages/${emptyId}/editeur`], ["email", `/marketing/modeles/${tpl}`], ["scenario", `/marketing/automatisations/${auto}`],
    ["article", `/marketing/site-web/articles/ajouter`], ["editeur-site", `/marketing/site-web/editeur-du-site`], ["personnaliser", `/marketing/site-web/personnaliser`],
  ];
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const report = [];
  for (const [name, route] of editors.filter((e) => !process.env.ED_ONLY || e[0] === process.env.ED_ONLY)) for (const width of (process.env.ED_W || "1920,1440,1100,820").split(",").map(Number)) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([n, value]) => ({ name: n, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160) + " @ " + String(e.stack || "").split("\n").slice(1, 3).join(" | ").slice(0, 200)));
    if (process.env.ED_TRACE) await page.addInitScript((sel) => { window.__tr = []; let last = ""; const tick = () => { const e = document.querySelector(sel); if (e) { const v = Math.round(e.getBoundingClientRect().height) + "|" + [...e.children].map((c) => Math.round(c.getBoundingClientRect().width) + "@" + Math.round(c.getBoundingClientRect().top)).join(","); if (v !== last) { last = v; window.__tr.push(Math.round(performance.now()) + "ms " + v + " fonts:" + document.fonts.status); } } requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, process.env.ED_TRACE);
    if (process.env.ED_SCROLL) await page.addInitScript(() => { window.__sc = []; const log = (k, el) => window.__sc.push(k + " " + (el && el.tagName ? el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0] : "") + " @ " + (new Error().stack.split("\n")[3] || "").trim().slice(0, 140)); const sv = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (...a) { log("scrollIntoView", this); return sv.apply(this, a); }; for (const k of ["scrollTo", "scrollBy"]) { const o = window[k]; window[k] = function (...a) { log(k + JSON.stringify(a).slice(0, 40)); return o.apply(this, a); }; } const f = Element.prototype.focus; Element.prototype.focus = function (...a) { if (!(a[0] && a[0].preventScroll)) log("focus", this); return f.apply(this, a); }; });
    await page.addInitScript(() => { window.__cls = 0; window.__ls = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__ls.push({ v: Math.round(e.value * 1000) / 1000, t: Math.round(e.startTime), s: (e.sources || []).slice(0, 3).map((x) => { const n = x.node; return (n && n.tagName ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + "." + String(n.className || "").split(/\s+/).slice(0, 2).join(".") : "?") + " y" + Math.round(x.previousRect.y) + "→" + Math.round(x.currentRect.y) + " h" + Math.round(x.previousRect.height) + "→" + Math.round(x.currentRect.height); }) }); } }).observe({ type: "layout-shift", buffered: true }); } catch { /* absent */ } });
    try {
      await page.goto(`${srv.base}${route}${route.includes("?") ? "&" : "?"}site=${site}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      const early = process.env.ED_EARLY ? await page.evaluate((sel) => { const e = document.querySelector(sel); return e ? [...e.children].map((c) => c.tagName.toLowerCase() + "." + String(c.className).split(" ")[0] + "[" + Math.round(c.getBoundingClientRect().width) + "]") .join(" ") : "absent"; }, process.env.ED_EARLY) : null;
      await page.waitForLoadState("load"); await page.waitForTimeout(2500);
      if (early) console.log("TÔT", name, width, early, "\nTARD", await page.evaluate((sel) => [...document.querySelector(sel).children].map((c) => c.tagName.toLowerCase() + "." + String(c.className).split(" ")[0] + "[" + Math.round(c.getBoundingClientRect().width) + "]").join(" "), process.env.ED_EARLY));
      if (process.env.ED_TRACE) console.log("TRACE", (await page.evaluate(() => window.__tr)).join("\n"));
      if (process.env.ED_FONTS) console.log("POLICES", JSON.stringify(await page.evaluate(() => ({ used: getComputedStyle(document.querySelector(".pb-top button, .pb-top")).fontFamily, faces: [...document.fonts].filter((f) => f.status !== "unloaded").map((f) => f.family + " " + f.weight + " " + f.status) }))));
      const issues = await page.evaluate(measure);
      const cls = await page.evaluate(() => Math.round(window.__cls * 1000) / 1000);
      const shifts = cls > 0.05 ? await page.evaluate(() => window.__ls.slice(0, 6)) : [];
      // stabilité : position des commandes de l'en-tête avant/après un clic dans la zone de travail et un aller-retour de panneau
      const snap = () => page.evaluate(() => [...document.querySelectorAll("header button, header a, [class*=toolbar] button, [class*=header] button, nav button")].slice(0, 40).map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(","); }).join("|"));
      if (process.env.ED_SAVE) { const m = () => page.evaluate(() => { const t = document.querySelector(".pb-top"), s = document.querySelector(".pb-save"); const r = (e) => { const b = e.getBoundingClientRect(); return Math.round(b.top) + "," + Math.round(b.height) + "," + Math.round(b.width); }; return "top " + r(t) + " | save " + (s ? r(s) + " « " + s.textContent + " » cls=" + s.className + " d=" + getComputedStyle(s).display + " lh=" + getComputedStyle(s).lineHeight : "absent") + " | left " + r(document.querySelector(".pb-top-left")) + " | right " + r(document.querySelector(".pb-top-right")); }); console.log("SAVE avant:", name, await m(), await page.evaluate(() => [...document.querySelectorAll(".pb-top-left button")].slice(0, 2).map((b) => Math.round(b.getBoundingClientRect().top)).join(","))); await page.evaluate(() => { const s = document.querySelector(".pb-save"); if (s) s.textContent = "Enregistré à 12:03"; }); console.log("SAVE après :", await m()); }
      const before = await snap();
      await page.mouse.click(Math.round(width * 0.45), 430).catch(() => {}); await page.waitForTimeout(500);
      const afterClick = await snap();
      if (process.env.ED_SCROLL) console.log("SCROLL", name, width, "scrollY=" + (await page.evaluate(() => Math.round(window.scrollY))), JSON.stringify(await page.evaluate(() => window.__sc.slice(-8)), null, 1));
      const toggled = [];
      for (const sel of ["[aria-expanded]", "button[aria-pressed]"]) { const el = page.locator(sel).first(); if (await el.count()) { try { await el.click({ timeout: 1500 }); await page.waitForTimeout(350); await el.click({ timeout: 1500 }); await page.waitForTimeout(350); toggled.push(sel); } catch { /* non cliquable */ } } }
      const afterToggle = await snap();
      if (process.env.ED_TRACE) console.log("TRACE-FIN", (await page.evaluate(() => window.__tr)).join("\n"));
      const diff = (a, b) => { const A = a.split("|"), B = b.split("|"); const d = []; for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) d.push(`#${i}: ${A[i]} → ${B[i]}`); return d.slice(0, 4); };
      const movedDetail = diff(before, afterClick); const toggleDetail = diff(afterClick, afterToggle);
      const moved = before !== afterClick; const movedToggle = afterClick !== afterToggle;
      await page.screenshot({ path: path.join(dir, `${name}_${width}.png`) });
      report.push({ editor: name, width, cls, shifts, issues: issues.filter((i) => i.kind !== "texte-coupé" || !/sr-only|skip/.test(i.sel)), moved, movedToggle, movedDetail, toggleDetail, toggled, errors });
    } catch (e) { report.push({ editor: name, width, error: String(e.message).slice(0, 160) }); }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(out || path.join(dir, "rapport.json"), JSON.stringify(report, null, 1));
  for (const r of report) console.log(r.editor, r.width, r.error ? "ERREUR " + r.error : `cls=${r.cls} problèmes=${r.issues.length} bouge-au-clic=${r.moved} bouge-au-panneau=${r.movedToggle} erreurs=${r.errors.length}`);
})();
