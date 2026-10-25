// Centre de gestion dans un VRAI Chrome : pages principales aux 9 largeurs (320 à 1920 px), tactile émulé jusqu'à 768 px.
// Aucun défilement horizontal, aucun élément hors cadre, une seule rubrique h1, aucune erreur de console ; au tactile : champs ≥ 16 px (pas de zoom iOS) et cibles ≥ 40 px.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const { measure } = require("../scripts/lib/auditMeasure");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const G = "/formateur/gestion";
const PAGES = [G, `${G}/ventes`, `${G}/ventes/coupons`, `${G}/eleves`, `${G}/analytics`, `${G}/ressources`, `${G}/activite?vue=alertes`, `${G}/sauvegardes`, `${G}/journal`, "/formateur/formations"];

describe("centre de gestion (navigateur)", { skip: SKIP }, () => {
  let srv, prof, browser;
  before(async () => {
    srv = await startServer(); prof = await loginInstructor(srv);
    const c = await createCourse(prof, srv, { title: "Une formation au titre particulièrement long pour vérifier qu'aucun tableau ni aucune carte ne déborde", price: 40 });
    for (let i = 0; i < 2; i++) await buy(await newStudent(srv), c);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("pages principales : 9 largeurs sans débordement, champs et cibles tactiles conformes, console propre", async () => {
    const problems = [];
    for (const route of PAGES) for (const width of WIDTHS) {
      const touch = width <= 768;
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
      await ctx.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await ctx.newPage(); const errors = [];
      page.on("pageerror", (e) => errors.push(String(e.message))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      const resp = await page.goto(srv.base + route, { waitUntil: "load" });
      const geom = (await page.evaluate(measure)).filter((g) => (g.kind === "h-scroll" || g.kind === "hors-cadre") && !/sr-only|skip/.test(g.sel));
      const m = await page.evaluate((touch) => {
        const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest("[hidden],.sr-only,details:not([open]) > :not(summary)"); };
        const ctl = "main input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), main select, main textarea";
        return { over: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll("h1").length,
          font: touch ? [...document.querySelectorAll(ctl)].filter((e) => vis(e) && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.name || e.id) : [],
          small: touch ? [...document.querySelectorAll(ctl + ", main a.btn, main button, main summary")].filter((e) => vis(e) && e.getBoundingClientRect().height < 40).map((e) => e.className || e.tagName) : [] };
      }, touch);
      const bad = [resp.status() !== 200 && `HTTP ${resp.status()}`, m.over > 1 && `défilement horizontal ${m.over}px`, geom.length && `hors cadre ${geom.map((g) => g.sel).join(",")}`, m.h1 !== 1 && `h1=${m.h1}`, m.font.length && `police<16 ${m.font}`, m.small.length && `cibles<40 ${m.small}`, errors.length && `console ${errors[0]}`].filter(Boolean);
      if (bad.length) problems.push(`${route} @${width} : ${bad.join(" ; ")}`);
      await ctx.close();
    }
    assert.deepEqual(problems, []);
  });
});
