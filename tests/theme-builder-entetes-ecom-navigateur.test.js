// En-têtes ecom dans un vrai Chrome (aperçu de la bibliothèque) : 3 largeurs sans débordement, éléments commerciaux présents, barres fermables, aucune erreur JavaScript.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const KEYS = Array.from({ length: 10 }, (_, i) => `ecom-${String(i + 1).padStart(2, "0")}`);

describe("En-têtes ecom : Chrome réel", { skip: SKIP, timeout: 900000 }, () => {
  let srv, db, browser, ctx, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    const boss = await loginInstructor(srv); db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site E', 'site-e', '{}')").run(org).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, reducedMotion: "reduce" });
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("10 modèles x 3 largeurs : pas de défilement horizontal, recherche + compte + panier présents, pas d'erreur JavaScript", async () => {
    const p = await ctx.newPage(), errors = []; p.on("pageerror", (e) => errors.push(String(e)));
    for (const key of KEYS) for (const w of [1280, 820, 390]) {
      await p.setViewportSize({ width: w, height: 600 });
      await p.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/header/${key}.${key}/apercu`, { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => { const h = document.querySelector(".kw-theme-header") || document.body; const vis = (s) => [...h.querySelectorAll(s)].some((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed");
        return { over: document.documentElement.scrollWidth - innerWidth, search: vis(".kw-search, form[role=search], input[type=search]"), cart: !!h.querySelector(".kw-minicart, [class*=minicart]"), account: !!h.querySelector(".kw-account, [class*=account]"), h: h.getBoundingClientRect().height }; });
      assert.ok(r.over <= 1, `${key} @${w} : débordement horizontal ${r.over}px`);
      assert.ok(r.cart && r.account, `${key} @${w} : panier ou compte absent`);
      assert.ok(r.h > 30, `${key} @${w} : en-tête vide`);
    }
    assert.deepEqual(errors, []);
  });
  test("barres promotionnelles fermables (01, 06, 08) : le bouton masque la barre", async () => {
    const p = await ctx.newPage(); await p.setViewportSize({ width: 1280, height: 600 });
    for (const key of ["ecom-01", "ecom-06", "ecom-08"]) {
      await p.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/header/${key}.${key}/apercu`, { waitUntil: "load" });
      const bar = p.locator("[data-kw-dismissible]").first(); assert.equal(await bar.count(), 1, key);
      const btn = bar.locator(":scope > [data-kw-dismiss]"); assert.equal(await btn.count(), 1, `${key} : bouton de fermeture`);
      await btn.click(); assert.equal(await bar.evaluate((e) => e.classList.contains("is-dismissed")), true, key);
    }
  });
});
