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

// ── Site publié : installation, rendu public sans double en-tête, défilement, modification puis relecture ─────────────────────────────────────────────
describe("En-têtes ecom : installés dans un site et publiés", { skip: SKIP, timeout: 900000 }, () => {
  let srv, boss, db, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const MODELS = ["ecom-01", "ecom-02", "ecom-07", "ecom-06"], pages = {}, tpl = {};
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const walkAll = (n, fn) => { fn(n); (n.children || []).forEach((c) => walkAll(c, fn)); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Boutique" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const key of MODELS) {
      const id = Number((await boss.post("/marketing/pages", { name: `P ${key}`, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
      const content = { title: key, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${key}`, level: "2" } }, ...tall] }] };
      assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
      assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
      pages[key] = id;
      const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: `${key}.${key}` }, headers: ORIGIN() });
      assert.equal(u.status, 200, u.text.slice(0, 200)); tpl[key] = JSON.parse(u.text).template;
      assert.equal((await boss.request(U(`/api/modeles/${tpl[key].id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [id] }] } }, headers: ORIGIN() })).status, 200);
      assert.equal((await boss.request(U(`/api/modeles/${tpl[key].id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (key, viewport = { width: 1280, height: 700 }) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: "no-preference" }), pg = await ctx.newPage(), errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pages[key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready);
    return { ctx, pg, errors };
  };

  test("installation : un seul en-tête, recherche + compte + mini-panier réels, catégories du menu affecté, aucune erreur (01, 02, 07, 06)", async () => {
    for (const key of MODELS) {
      const { ctx, pg, errors } = await open(key);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${key} : en-tête en double ou absent`);
      for (const [name, sel] of [["recherche", ".lp-site-header .kw-search"], ["compte", ".lp-site-header .kw-account"], ["mini-panier", ".lp-site-header .kw-minicart"]]) assert.ok(await pg.locator(sel).count() >= 1, `${key} : ${name} absent`);
      const form = await pg.locator(".lp-site-header .kw-search").first().evaluate((e) => (e.querySelector("form") || e).getAttribute("action") || "");
      assert.match(form, /catalogue|recherche/, `${key} : la recherche ne vise pas le catalogue (${form})`);
      if (key === "ecom-02") assert.ok(await pg.locator(".lp-site-header [class*=fsmenu], .lp-site-header [data-kw-fsmenu], .lp-site-header button").count() >= 1, "02 : bouton de menu plein écran absent");
      else { const t = (await pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").toLowerCase(); assert.ok(t.includes("alpha"), `${key} : catégories du menu affecté absentes (${t})`); }
      assert.deepEqual(errors, [], key); await ctx.close();
    }
  });
  test("mobile (390 px) : pas de débordement, catégories repliées derrière un bouton (01, 07, 06)", async () => {
    for (const key of ["ecom-01", "ecom-07", "ecom-06"]) {
      const { ctx, pg } = await open(key, { width: 390, height: 800 });
      const wide = await pg.evaluate(() => [...document.querySelectorAll(".lp-site-header *")].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(e).display !== "none").slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}:${Math.round(e.getBoundingClientRect().right)}`));
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${key} : débordement ${JSON.stringify(wide)}`);
      const burger = pg.locator(".lp-site-header .kw-menu-burger:visible").first(); assert.ok(await burger.count() >= 1, `${key} : pas de bouton de menu`);
      await burger.click(); await pg.waitForTimeout(150); assert.ok(await pg.locator(".lp-site-header .kw-menu-list:visible").count() >= 1, `${key} : le menu ne s'ouvre pas`);
      await ctx.close();
    }
  });
  test("défilement : 01 « collant, se réduit » (rangée réduite) ; 02 et 06 collants (restent en haut) ; 07 défile avec la page", async () => {
    const s = await open("ecom-01"); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    const BAND = ".lp-site-header .kw-full .kw-full"; const pad = () => s.pg.evaluate((q) => parseFloat(getComputedStyle(document.querySelector(q)).paddingTop), BAND);
    const before = await pad(); await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(400);
    assert.ok((await pad()) <= before, "01 : rangée non réduite"); assert.equal(await s.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "sticky"); await s.ctx.close();
    for (const key of ["ecom-02", "ecom-06"]) {
      const { ctx, pg } = await open(key); await pg.evaluate(() => window.scrollTo(0, 700)); await pg.waitForTimeout(400);
      assert.ok(Math.abs(await pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top))) <= 1, `${key} : pas collé en haut`); await ctx.close();
    }
    const f = await open("ecom-07"); await f.pg.evaluate(() => window.scrollTo(0, 700)); await f.pg.waitForTimeout(300);
    assert.ok((await f.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom))) <= 0, "07 : devrait défiler avec la page"); await f.ctx.close();
  });
  test("modification réelle (couleur, police, espacement, animation) puis relecture sur le site publié ; le catalogue reste intact", async () => {
    const key = "ecom-01", before = JSON.stringify(require("../src/themeBuilder/catalog").build("header", `${key}.${key}`));
    const row = db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(tpl[key].sourceId), sec = JSON.parse(row.section);
    const band = sec.children[0].children[1]; // rangée « marque + recherche + actions »
    band.styles.desktop.backgroundColor = "#123456"; band.styles.desktop.paddingTop = "41px";
    let animated = null;
    walkAll(sec.children[0], (n) => { if (n.type === "sitetitle") { n.parts.link.styles.desktop.fontFamily = "font.lora"; n.styles.desktop.fontFamily = "font.lora"; } if (!animated && n.type === "menu" && n.motion) { n.motion.entrance = "zoom-in"; animated = n; } });
    assert.ok(animated, "un menu animé à modifier");
    db.prepare("UPDATE mk_web_components SET section = ?, draft = NULL WHERE id = ?").run(JSON.stringify(sec), tpl[key].sourceId);
    const { ctx, pg } = await open(key);
    const r = await pg.evaluate(() => { const b = document.querySelectorAll(".lp-site-header .kw-full .kw-full")[1]; const t = document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitetitle"); return { bg: getComputedStyle(b).backgroundColor, pad: getComputedStyle(b).paddingTop, font: getComputedStyle(t).fontFamily, anim: [...document.querySelectorAll(".lp-site-header [data-kw-anim]")].map((e) => e.getAttribute("data-kw-anim")) }; });
    assert.equal(r.bg, "rgb(18, 52, 86)"); assert.equal(r.pad, "41px"); assert.match(r.font, /Lora/i); assert.ok(r.anim.includes("zoom-in"), `animation modifiée absente (${r.anim})`);
    await ctx.close();
    assert.equal(JSON.stringify(require("../src/themeBuilder/catalog").build("header", `${key}.${key}`)), before, "catalogue modifié par la copie");
  });
});
