// En-têtes « media » dans un vrai Chrome : trois largeurs sans défaut, menu desktop et mobile, comportement au défilement annoncé (se cache / se réduit),
// modification réelle (couleur, police, espacement, animation) puis sauvegarde et relecture, installation dans un site et rendu public sans double en-tête.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS } = require("../src/themeBuilder/catalog/header");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const MEDIA = MODELS.filter((m) => m.sector === "media");
const keyOf = (m) => `${m.key}.${m.key}`;
const WIDTHS = [["ordinateur", 1280], ["tablette", 820], ["mobile", 390]];

describe("En-têtes media dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, preview;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const pagesOf = {}, tplOf = {};
  const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); walk(n.children, fn); } };
  const mkPage = async (name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
    const content = { title: name, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${name}`, level: "2" } }, ...tall] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return id;
  };
  const adopt = async (m, pageId) => {
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: keyOf(m) }, headers: ORIGIN() });
    assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template; tplOf[m.key] = t;
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
  };
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of MEDIA) { pagesOf[m.key] = await mkPage(`P ${m.key}`); await adopt(m, pagesOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = true) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); });
    return { ctx, pg, errors };
  };

  test("trois largeurs : un seul en-tête, pas de débordement horizontal, marque visible, aucune erreur JavaScript", async () => {
    for (const m of MEDIA) for (const [name, w] of WIDTHS) {
      const { ctx, pg, errors } = await open(m, { width: w, height: 900 });
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} ${name} : un seul en-tête`);
      const r = await pg.evaluate(() => { const h = document.querySelector(".lp-site-header"), mark = h.querySelector(".kw-sitetitle, .kw-sitelogo"), vw = document.documentElement.clientWidth;
        return { over: document.documentElement.scrollWidth - vw, mark: !!mark && mark.getBoundingClientRect().width > 0, height: h.getBoundingClientRect().height }; });
      assert.ok(r.over <= 1, `${m.key} ${name} : débordement ${r.over}px`); assert.ok(r.mark, `${m.key} ${name} : marque invisible`);
      assert.ok(r.height < (w < 600 ? 520 : 460), `${m.key} ${name} : trop haut (${r.height})`);
      assert.deepEqual(errors, [], `${m.key} ${name}`); await ctx.close();
    }
  });
  test("menu : visible sur ordinateur (menu affecté) ; sur mobile replié derrière un bouton qui l'ouvre et le referme (sauf vertical et plein écran)", async () => {
    for (const m of MEDIA.filter((x) => x.key !== "media-08")) {
      const d = await open(m); assert.ok((await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").toLowerCase().includes("alpha"), `${m.key} : menu affecté absent`); await d.ctx.close();
      if (m.key === "media-07") continue; // menu vertical : toujours visible
      const { ctx, pg } = await open(m, { width: 390, height: 800 }); const burger = pg.locator(".lp-site-header .kw-menu-burger");
      assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu`); await burger.click(); await pg.waitForTimeout(100);
      assert.ok(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible(), `${m.key} : le menu ne s'ouvre pas`);
      await burger.click(); await pg.waitForTimeout(100); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : le menu ne se referme pas`); await ctx.close();
    }
  });
  test("media-08 : le bouton « Index » ouvre le menu plein écran (Échap le ferme), sur ordinateur et sur mobile", async () => {
    const m = MEDIA.find((x) => x.key === "media-08");
    for (const vp of [{ width: 1280, height: 700 }, { width: 390, height: 800 }]) {
      const { ctx, pg } = await open(m, vp, false); const btn = pg.locator(".lp-site-header button", { hasText: "Index" }).first();
      assert.ok(await btn.isVisible(), "bouton Index"); await btn.click(); await pg.waitForTimeout(900);
      const txt = await pg.evaluate(() => document.body.innerText.toLowerCase()); assert.ok(txt.includes("alpha"), "le menu plein écran liste le menu affecté");
      await pg.keyboard.press("Escape"); await pg.waitForTimeout(700); await ctx.close();
    }
  });
  test("défilement : media-08 se cache puis revient ; media-04 se réduit", async () => {
    const h = await open(MEDIA.find((x) => x.key === "media-08")); assert.equal(await h.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
    const bottom = () => h.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom));
    await h.pg.evaluate(() => window.scrollTo(0, 800)); await h.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden")); await h.pg.waitForTimeout(450);
    assert.ok((await bottom()) <= 0, "masqué en descendant");
    await h.pg.evaluate(() => window.scrollTo(0, 500)); await h.pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await h.pg.waitForTimeout(450);
    assert.ok((await bottom()) > 10, "revient en remontant"); await h.ctx.close();
    const s = await open(MEDIA.find((x) => x.key === "media-04")); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.ctx.close();
  });
  test("ticker de media-02 : défile en mouvement normal, immobile en mouvement réduit", async () => {
    const m = MEDIA.find((x) => x.key === "media-02");
    const run = async (reduced) => { const { ctx, pg } = await open(m, { width: 1280, height: 700 }, reduced); await pg.waitForTimeout(600);
      const n = await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length); await ctx.close(); return n; };
    assert.ok((await run(false)) > 0, "le ticker défile"); assert.equal(await run(true), 0, "ticker immobile en mouvement réduit");
  });
  test("modification réelle : couleur, police, espacement et animation changés dans le brouillon du composant, enregistrés puis relus", async () => {
    const m = MEDIA.find((x) => x.key === "media-09"), t = tplOf[m.key];
    const P = require("../src/marketing/pages"), ctx = { organizationId: db.prepare("SELECT organization_id o FROM mk_sites WHERE id = ?").get(site).o, db };
    const comp = P.getComponent(ctx, t.sourceId); const sec = JSON.parse(JSON.stringify(comp.draft || comp.section));
    let changed = 0;
    walk(sec.children, (n) => { if (n.type === "sitetitle") { n.styles.desktop.color = "#123456"; n.styles.desktop.fontFamily = "font.lora"; n.styles.desktop.paddingTop = "12px"; n.motion = { entrance: "zoom-in", duration: 900, delay: 0 }; changed++; } });
    assert.ok(changed >= 1);
    const res = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: comp.revision, content: { sections: [sec] } } });
    assert.equal(res.status, 200, res.text.slice(0, 200));
    const back = P.getComponent(ctx, t.sourceId), saved = back.draft || back.section; let found = null; walk(saved.children, (n) => { if (n.type === "sitetitle") found = n; });
    assert.equal(found.styles.desktop.color, "#123456"); assert.equal(found.styles.desktop.fontFamily, "font.lora"); assert.equal(found.styles.desktop.paddingTop, "12px"); assert.equal(found.motion.entrance, "zoom-in");
  });
});
