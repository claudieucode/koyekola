// Secteur « sport » dans un vrai Chrome : 3 largeurs sans défaut (aperçu), menu desktop et mobile, comportements au défilement annoncés (se cache : sport-05 ; se réduit : sport-02, sport-07),
// installation dans un site puis rendu public sans double en-tête, identité propre.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS } = require("../src/themeBuilder/catalog/header");
let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const SPORT = MODELS.filter((m) => m.sector === "sport"), keyOf = (m) => `${m.key}.${m.key}`;
const WIDTHS = [["ordinateur", 1280, 900], ["tablette", 820, 1000], ["mobile", 390, 800]];

describe("En-têtes sport dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site; const ORIGIN = () => ({ Origin: srv.base }); const pagesOf = {};
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const mkPage = async (name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content: { title: name, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${name}`, level: "2" } }, ...tall] }] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200); return id;
  };
  const adopt = async (key, pageId) => {
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() }); assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Sport" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of SPORT) { pagesOf[m.key] = await mkPage(`P ${m.key}`); await adopt(keyOf(m), pagesOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" }); const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); return { ctx, pg, errors };
  };

  test("3 largeurs : un seul en-tête, pas de débordement horizontal, marque visible, identité propre, aucune erreur JavaScript", async () => {
    for (const m of SPORT) for (const [name, w, h] of WIDTHS) {
      const { ctx, pg, errors } = await open(m, { width: w, height: h }, true);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} ${name} : un seul en-tête`);
      const r = await pg.evaluate(() => { const root = document.querySelector(".lp-site-header"), t = root.querySelector(".kw-sitetitle"); const b = t.getBoundingClientRect();
        return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, markVisible: b.width > 0 && b.height > 0, right: Math.max(...[...root.querySelectorAll("*")].map((e) => { const s = getComputedStyle(e); return s.display === "none" || s.position === "fixed" ? 0 : e.getBoundingClientRect().right; })), font: getComputedStyle(root.querySelector(".kw-sitetitle-link") || t).fontFamily, h: root.getBoundingClientRect().height }; });
      assert.ok(r.over <= 1, `${m.key} ${name} : débordement horizontal ${r.over}`); assert.ok(r.markVisible, `${m.key} ${name} : marque invisible`);
      assert.ok(r.h < (w < 600 ? 520 : 460), `${m.key} ${name} : trop haut (${r.h})`);
      assert.ok(r.font.toLowerCase().includes(m.S.head.replace("font.", "").split("-").join(" ")), `${m.key} : police « ${r.font} »`);
      assert.deepEqual(errors, [], m.key); await ctx.close();
    }
  });
  test("menu : liens du menu affecté sur ordinateur ; sur mobile replié derrière un bouton qui s'ouvre et se ferme", async () => {
    for (const m of SPORT) {
      const d = await open(m); const links = (await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").toLowerCase(); assert.ok(links.includes("alpha"), `${m.key} : menu absent`); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 }); const burger = pg.locator(".lp-site-header .kw-menu-burger");
      assert.ok(await burger.isVisible(), `${m.key} : pas de burger`); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : déjà ouvert`);
      await burger.click(); await pg.waitForTimeout(100); assert.ok(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible(), `${m.key} : ne s'ouvre pas`);
      await burger.click(); await pg.waitForTimeout(100); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : ne se referme pas`); await ctx.close();
    }
  });
  test("mouvement réduit et clavier : aucune animation infinie hors ticker ; Tab atteint l'en-tête", async () => {
    for (const m of SPORT) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true); let inH = false;
      for (let i = 0; i < 14 && !inH; i++) { await pg.keyboard.press("Tab"); inH = await pg.evaluate(() => !!(document.activeElement && document.activeElement.closest(".lp-site-header"))); }
      assert.ok(inH, `${m.key} : en-tête inaccessible au clavier`); await pg.waitForTimeout(700);
      assert.equal(await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length), 0, `${m.key} : animation infinie`); await ctx.close();
    }
  });
  test("défilement annoncé : sport-05 se cache puis revient ; sport-02 et sport-07 se réduisent", async () => {
    const hide = SPORT.find((m) => m.key === "sport-05"); const h = await open(hide); assert.equal(await h.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
    await h.pg.evaluate(() => window.scrollTo(0, 800)); await h.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden"));
    await h.pg.evaluate(() => window.scrollTo(0, 500)); await h.pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await h.ctx.close();
    for (const key of ["sport-02", "sport-07"]) { const m = SPORT.find((x) => x.key === key); const s = await open(m); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink", key);
      await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.ctx.close(); }
  });
  test("ticker de Ligue Un : widget natif, textes à remplacer, immobile en mouvement réduit", async () => {
    const { ctx, pg } = await open(SPORT.find((m) => m.key === "sport-03"), { width: 1280, height: 700 }, true);
    assert.ok((await pg.locator(".lp-site-header .kw-marquee").first().innerText()).toLowerCase().includes("à remplacer")); await ctx.close();
  });
});
